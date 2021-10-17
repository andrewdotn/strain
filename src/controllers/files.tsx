import type { Request, Response } from "express";
import React from "react";
import { htmlPage } from "../util";
import { Message } from "../models/message";
import { User } from "../models/user";
import { File } from "../models/file";
import { In } from "typeorm";
import { userInfo } from "./channels";
import { MessageRow } from "./messages";
import { uniq } from "lodash";
import { Channel } from "../models/channel";
import { readFile } from "fs-extra";
import { resolve } from "path";
import { createReadStream } from "fs";
import { promisify } from "util";
import { pipeline } from "stream";
import { Pagination } from "../ui/pagination";

export async function fileList(req: Request, res: Response) {
  const itemsPerPage = 250;
  let page = parseInt(req.query.page);
  if (!page || page < 1) {
    page = 1;
  }

  const [files, count] = await File.findAndCount({
    take: itemsPerPage,
    skip: (page - 1) * itemsPerPage,
    order: { messageTimestamp: "DESC" },
  });

  const userMap = await User.bySlackIdMap(files.map((f) => f.userSlackId));
  const messages = await Message.find({
    where: { messageTimestamp: In(files.map((f) => f.messageTimestamp)) },
  });

  const messagesByTimestamp = new Map<number, Message>();
  for (const m of messages) {
    messagesByTimestamp.set(m.messageTimestamp, m);
  }

  const channels = await Channel.find({
    where: { slackId: In(uniq(messages.map((m) => m.channelSlackId))) },
  });
  const channelMap = new Map<string, Channel>();
  for (const c of channels) {
    channelMap.set(c.slackId, c);
  }

  function messageInfo(f: File) {
    const msg = messagesByTimestamp.get(f.messageTimestamp);
    if (msg) {
      return (
        <table>
          <MessageRow
            message={msg}
            userMap={userMap}
            channelMap={channelMap}
            showChannel={true}
          />
        </table>
      );
    }
  }

  res.send(
    htmlPage(
      <div>
        <h2>Files</h2>
        {files.map((f) => (
          <>
            {messageInfo(f) || <i>No corresponding message found</i>}
            <div className="card">
              <a href={`/files/view/${f.fileSlackId}`} className="card-img-top">
                {f.thumbFilename ? (
                  <img src={`/files/thumb/${f.fileSlackId}`} />
                ) : (
                  "No preview"
                )}
              </a>
              <div className="card-body">
                <div>{f.originalTitle}</div>
                <div>{f.originalName}</div>
                <div>{userInfo(f.userSlackId, userMap)}</div>
                <div>{f.size.toLocaleString()}</div>
              </div>
            </div>
          </>
        ))}
        <Pagination count={count} itemsPerPage={itemsPerPage} page={page} />
      </div>
    )
  );
}

export async function fileThumb(req: Request, res: Response) {
  const fileSlackId = req.params.fileSlackId;
  const file = await File.findOneOrFail({
    where: { fileSlackId: fileSlackId },
  });

  if (!file.thumbFilename) {
    res.sendStatus(404);
    return;
  }

  let data;
  try {
    data = await readFile(
        resolve(__dirname, "..", "..", "files", file.thumbFilename!)
    );
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.error(`Warning: thumb in DB but not on disk: ${file.thumbFilename}`);
      res.sendStatus(404);
      return;
    }
    throw(e);
  }
  let contentType;
  switch (file.originalThumbExtension) {
    case ".png":
      contentType = "image/png";
      break;
    case ".jpg":
    case ".jpeg":
      contentType = "image/jpeg";
      break;
  }
  if (!contentType) {
    res.sendStatus(404);
    return;
  }
  res.contentType(contentType);

  res.send(data);
}

export async function fileView(req: Request, res: Response) {
  const fileSlackId = req.params.fileSlackId;
  const file = await File.findOneOrFail({
    where: { fileSlackId: fileSlackId },
  });

  // Slack seems to set mimetype = tex/plain for .js files, so let’s trust its
  // mime types to be safe.
  res.contentType(file.mimetype);

  const data = createReadStream(
    resolve(__dirname, "..", "..", "files", file.filename)
  );
  await promisify(pipeline)(data, res);
}
