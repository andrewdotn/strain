import { LogLevel, WebAPICallResult, WebClient } from "@slack/web-api";
import { readFile } from "fs-extra";
import { ApiResult } from "./models/api-result";
import { getConnection } from "./db";

const ONE_HOUR_IN_MS = 1 * 60 * 60 * 1000;
const CACHE_THRESHOLD = 12 * ONE_HOUR_IN_MS;

function needsUpdate(apiResult?: ApiResult) {
  if (!apiResult) {
    return true;
  }
  if (
    apiResult.timestamp! < new Date().getTime() - CACHE_THRESHOLD ||
    (apiResult.lastDupeTime &&
      apiResult.lastDupeTime < new Date().getTime() - CACHE_THRESHOLD)
  ) {
    return true;
  }
  return false;
}

export async function findCachedApiResult(params: {
  method: string;
  params: string;
}) {
  return await ApiResult.findOne({
    where: { method: params.method, params: params.params },
    order: { timestamp: "DESC" },
    select: ["method", "params", "timestamp", "lastDupeTime", "data"],
  });
}

/**
 * Using `method` and `params` as cache-key lookups, return results either
 * cached from database, or by calling generator and caching those responses in
 * the database as well.
 */
export async function cachingProxy(args: {
  method: string;
  params: string;
  generator: (args: { cursor?: string }) => Promise<WebAPICallResult>;
}): Promise<WebAPICallResult[]> {
  function log(msg: string) {
    console.log(`${args.method} ${args.params}: ${msg}`);
  }

  const origParams = args.params;

  let cursor;
  const retList = [];

  do {
    const existing = await findCachedApiResult(args);
    let result;

    if (needsUpdate(existing)) {
      result = await args.generator({ cursor });
      if (!result.ok) {
        throw new Error("result not ok");
      }

      const newData = Buffer.from(JSON.stringify(result));
      if (existing && !Buffer.compare(newData, existing.data!)) {
        existing.lastDupeTime = new Date().getTime();
        await existing.save();
        log(`data unchanged since last retrieval`);
      } else {
        const entity = ApiResult.create({
          method: args.method,
          params: args.params,
          timestamp: new Date().getTime(),
          data: Buffer.from(JSON.stringify(result)),
        });
        await entity.save();
        log(`saved ${args.method} ${args.params}!`);
      }
    } else {
      log("using cached");
      result = JSON.parse(existing!.data!.toString()) as WebAPICallResult;
      if (!result.ok) {
        throw new Error("db data not ok");
      }
    }

    retList.push(result);
    cursor = result.response_metadata?.next_cursor;
    args.params = origParams + `,cursor=${cursor}`;
  } while (cursor);

  return retList;
}

async function main() {
  await getConnection();

  const token = (await readFile(".token")).toString().trim();

  const web = new WebClient(token, {
    logLevel: LogLevel.DEBUG,
  });

  const userList = await cachingProxy({
    method: "users.list",
    params: "",
    generator: web.users.list,
  });
  console.log(`${userList[0].members.length} members`);

  const conversationList = await cachingProxy({
    method: "conversations.list",
    params: "",
    generator: web.conversations.list,
  });
  console.log(`${conversationList[0].channels.length} channels`);

  for (const c of conversationList[0].channels) {
    const messageHistory = await cachingProxy({
      method: "conversations.history",
      params: `channel=${c.id}`,
      generator: (args: { cursor?: string }) =>
        web.conversations.history({ channel: c.id, cursor: args.cursor }),
    });

    for (const messageList of messageHistory) {
      for (const m of messageList.messages) {
        if (m.thread_ts) {
          console.log(`want thread info for ${m.client_msg_id}`);

          // It would be tempting to skip a fresh download entirely if
          // `latest_reply` is unchanged, but adding reactions updates the reply
          // without changing the latest_reply time.
          //
          // We *have* had reply more than two months after the previous message
          // though.

          const ONE_MONTH_IN_SECONDS = (365.242190402 * 24 * 60 * 60) / 12;

          const existing = await ApiResult.findOne({
            where: {
              method: "conversations.replies",
              params: `channel=${c.id},ts=${m.thread_ts}`,
            },
            order: { timestamp: "DESC" },
          });

          const shouldDownload =
            !existing ||
            !m.latest_reply ||
            (existing.lastDupeTime ?? existing.timestamp!) <
              1000 * (m.latest_reply + ONE_MONTH_IN_SECONDS);

          console.log(`should download? ${shouldDownload}`);

          if (shouldDownload) {
            await cachingProxy({
              method: "conversations.replies",
              params: `channel=${c.id},ts=${m.thread_ts}`,
              generator: (args: { cursor?: string }) =>
                web.conversations.replies({
                  channel: c.id,
                  ts: m.thread_ts,
                  cursor: args.cursor,
                }),
            });
          }
        }
      }
    }
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
  });
}
