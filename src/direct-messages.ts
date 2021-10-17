import { ensureDir, readFile, writeFile } from "fs-extra";
import { resolve } from "path";
import { WebClient } from "@slack/web-api";
import sanitizeFilename from "sanitize-filename";

async function main() {
  const tokenList = JSON.parse((await readFile(".tokens.json")).toString());

  for (const [d, token] of Object.entries(tokenList)) {
    const web = new WebClient(token);

    const outDir = resolve(__dirname, "..", "direct-messages", d);
    await ensureDir(outDir);

    const users = await web.users.list();
    await writeFile(
      resolve(outDir, `users-${new Date().getTime()}.json`),
      JSON.stringify(users, null, 2)
    );

    const list = await web.conversations.list({
      types: "private_channel,mpim,im",
    });

    await writeFile(
      resolve(outDir, `private-channels-${new Date().getTime()}.json`),
      JSON.stringify(list, null, 2)
    );

    for (const c of list.channels) {
      if (!c.is_im) {
        continue;
      }

      const u = users.members.find((m) => m.id === c.user);

      let cursor;
      do {
        const messages = await web.conversations.history({
          channel: c.id,
          cursor,
        });

        if (messages.messages.length) {
          const userId = sanitizeFilename(c.user);

          await writeFile(
            resolve(outDir, `chat-${userId}-${new Date().getTime()}.json`),
            JSON.stringify(messages, null, 2)
          );
        }

        const count = messages.messages.length;
        // Print “50 messages” if only 50, or “50 more messages” if this is an
        // additional batch
        const more_msg = cursor ? " more" : "";
        console.log(`${d} ${count}${more_msg} messages written for ${u.name}`);

        cursor = messages.has_more
          ? messages.response_metadata.next_cursor
          : undefined;
      } while (cursor);
    }
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
  });
}
