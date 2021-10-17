import type { Request, Response } from "express";
import { htmlPage } from "../util";
import React from "react";
import { Channel } from "../models/channel";
import { User } from "../models/user";
import { In } from "typeorm";
import { Message } from "../models/message";
import { MessageRow } from "./messages";
import { Pagination } from "../ui/pagination";

export function userInfo(
  userSlackId?: string,
  usersBySlackId: Map<string, User>
) {
  if (!userSlackId) return;
  const user = usersBySlackId.get(userSlackId);
  if (!user) {
    return userSlackId;
  }

  return <a href={`/users/${user.slackId}`}>{user.realName}</a>;
}

export async function channelDetailPage(req: Request, res: Response) {
  const channel = await Channel.findOneOrFail({
    where: { slackId: req.params.channelId },
  });
  let page = parseInt(req.query.page);
  if (!page || page < 1) {
    page = 1;
  }

  const itemsPerPage = 200;

  const [messages, count] = await Message.findAndCount({
    where: { channelSlackId: channel.slackId },
    order: { threadTimestamp: "DESC", messageTimestamp: "ASC" },
    take: itemsPerPage,
    skip: (page - 1) * itemsPerPage,
  });

  const usersBySlackId = await User.bySlackIdMap(
    messages.map((m) => m.userSlackId)
  );

  res.send(
    htmlPage(
      <div>
        <h1>#{channel.name}</h1>
        <table className="table">
          <thead>
            <tr>
              <td>Date</td>
              <td>User</td>
              <td>Message</td>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <MessageRow message={m} userMap={usersBySlackId} />
            ))}
          </tbody>
        </table>
        <Pagination page={page} itemsPerPage={itemsPerPage} count={count} />
      </div>
    )
  );
}

export async function channelListPage(req: Request, res: Response) {
  const channels = await Channel.find({ order: { name: "ASC" } });

  const creators = await User.find({
    where: { slackId: In(channels.map((c) => c.creatorSlackId)) },
  });
  const creatorsById = new Map<string, User>();
  for (const c of creators) {
    creatorsById.set(c.slackId, c);
  }

  res.send(
    htmlPage(
      <div>
        <h2>Channels</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Created by</th>
              <th>Created</th>
              <th>Unlinked</th>
              <th>Members</th>
              <th>Topic</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((c) => (
              <tr key={c.slackId}>
                <td>
                  <a href={`/channels/${c.slackId}`}>#{c.name}</a>
                </td>
                <td>{userInfo(c.creatorSlackId, creatorsById)}</td>
                <td>{c.created?.toISOString()}</td>
                <td>{c.unlinked?.toISOString()}</td>
                <td>{c.memberCount}</td>
                <td>{c.topic}</td>
                <td>{c.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  );
}
