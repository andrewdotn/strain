import type { Request, Response } from "express";
import React from "react";
import { htmlPage } from "../util";
import { Message } from "../models/message";
import { User } from "../models/user";
import { Channel } from "../models/channel";
import { Pagination } from "../ui/pagination";

const shortFormat = new Intl.DateTimeFormat("en-CA", {
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour12: true,
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Edmonton",
});

function formatDate(d: Date) {
  return (
    shortFormat
      .format(d)
      // put non-breaking hyphen in yyyy-mm-dd
      .replace(/-/g, "‑")
      // put non-breaking space before a.m. / p.m.
      .replace(/ ([ap])/, (match, group1) => " " + group1)
      .replace(".,", "")
      .replace(",", "")
  );
}

export function MessageRow(props: {
  message: Message;
  showChannel?: boolean;
  userMap: Map<string, User>;
  channelMap?: Map<string, Channel>;
}) {
  const m = props.message;

  return (
    <tr key={m.id}>
      <td>{formatDate(new Date(m.messageTimestamp * 1000))}</td>
      {props.showChannel && (
        <td>
          <a href={`/channels/${m.channelSlackId}`}>
            #{props.channelMap?.get(m.channelSlackId)?.name ?? m.channelSlackId}
          </a>
        </td>
      )}
      <td>
        <a href={`/users/${m.userSlackId}`}>
          {props.userMap.get(m.userSlackId)?.realName ?? m.userSlackId}
        </a>
      </td>
      <td className="message__text">
        {m.isReply && (
          <b>
            Reply
            <br />
          </b>
        )}
        {m.text}
        <details>
          <summary className="small">
            Raw <a href={`/messages/${m.id}`}>#{m.id}</a>
          </summary>
          <pre>{m.raw.toString()}</pre>
        </details>
      </td>
    </tr>
  );
}

export async function messageDetail(req: Request, res: Response) {
  const message = await Message.findOneOrFail({
    where: { id: req.params.messageId },
    select: [
      "id",
      "userSlackId",
      "channelSlackId",
      "messageTimestamp",
      "isReply",
      "raw",
    ],
  });

  res.send(htmlPage(<pre>{message.raw.toString()}</pre>));
}

export async function messagesList(req: Request, res: Response) {
  const itemsPerPage = 250;
  let page = parseInt(req.query.page);
  if (!page || page < 1) {
    page = 1;
  }

  const [messages, count] = await Message.findAndCount({
    order: { threadTimestamp: "DESC", messageTimestamp: "ASC" },
    take: itemsPerPage,
    skip: (page - 1) * itemsPerPage,
  });

  const userMap = await User.bySlackIdMap(messages.map((m) => m.userSlackId));
  const channelMap = await Channel.bySlackIdMap(
    messages.map((m) => m.channelSlackId)
  );

  res.send(
    htmlPage(
      <div>
        <h2>Messages</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Channel</th>
              <th>User</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <MessageRow
                message={m}
                showChannel={true}
                channelMap={channelMap}
                userMap={userMap}
              />
            ))}
          </tbody>
        </table>
        <Pagination count={count} itemsPerPage={itemsPerPage} page={page} />
      </div>
    )
  );
}
