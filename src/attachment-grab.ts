import { getConnection } from "./db";
import { Message } from "./models/message";
import { File } from "./models/file";
import { extname, join, resolve } from "path";
import { pipeline } from "stream";
import fetch, { HeadersInit } from "node-fetch";
import { promisify } from "util";
import {
  createWriteStream,
  ensureDir,
  pathExists,
  readFile,
  rename,
} from "fs-extra";
import sanitizeFilename from "sanitize-filename";

const pipelinePromise = promisify(pipeline);

async function main() {
  await getConnection();

  const token = (await readFile(".token")).toString().trim();

  async function downloadFileIfNotExists(
    url: string,
    targetPath: string,
    htmlOk?: boolean
  ) {
    if (!(await pathExists(targetPath))) {
      console.log(`downloading ${url}`);

      const headers: HeadersInit = {};
      const urlObj = new URL(url);
      // Do not give slack token to anyone but slack.
      if (
        urlObj.hostname === "files.slack.com" &&
        urlObj.protocol === "https:"
      ) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const googleDrivePathnameRegExp = /^\/file\/d\/([^/]+)\/view$/;
      if (
        urlObj.hostname === "drive.google.com" &&
        googleDrivePathnameRegExp.test(urlObj.pathname)
      ) {
        const match = googleDrivePathnameRegExp.exec(urlObj.pathname)!;
        urlObj.pathname = "/uc";
        urlObj.searchParams.forEach((v, k, params) => params.delete(k));
        urlObj.searchParams.set("export", "download");
        urlObj.searchParams.set("id", match[1]);
        url = urlObj.toString();
        console.log(`Google drive link detected: rewrote to ${url}`);
      }

      const response = await fetch(url, {
        headers,
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      if (
        !htmlOk &&
        response.headers.get("Content-Type").startsWith("text/html")
      ) {
        console.error(
          `got html, not expected, for ${targetPath} download attempt`
        );
        return;
      }
      await pipelinePromise(response.body, createWriteStream("tmp"));
      console.log("ok");

      await rename("tmp", targetPath);
    }
  }

  const messages = await Message.find({
    select: ["id", "raw", "messageTimestamp"],
  });
  console.log(`${messages.length} messages loaded`);

  let withFiles = 0;
  let fileCount = 0;
  let totalSize = 0;
  const filetypeCounts = new Map<string, number>();
  for (const m of messages) {
    const data = JSON.parse(m.raw);
    if (data.files) {
      withFiles++;

      for (let f of data.files) {
        fileCount++;
        console.log(`${f.id} ${m.id} ${f.filetype} ${f.title}`);
        if (f.size) {
          totalSize += f.size;
        }

        const fileObj =
          (await File.findOne({ where: { fileSlackId: f.id } })) ?? new File();
        fileObj.fileSlackId = f.id;
        fileObj.messageTimestamp = m.messageTimestamp;
        fileObj.fileTimestamp = f.timestamp;
        fileObj.userSlackId = f.user;
        fileObj.filetype = f.filetype;
        fileObj.mimetype = f.mimetype;
        fileObj.size = f.size;
        fileObj.originalName = f.name;
        fileObj.originalTitle = f.title;

        filetypeCounts.set(
          f.filetype,
          (filetypeCounts.get(f.filetype) ?? 0) + 1
        );

        if (f.size && f.filetype) {
          let filename = f.title;
          if (!filename.endsWith("." + f.filetype)) {
            filename += "." + f.filetype;
          }

          let thumb;
          let thumb_key;
          for (const key of [
            "thumb_1024",
            "thumb_720",
            "thumb_360",
            "thumb_pdf",
            "thumb_video",
          ]) {
            if (key in f) {
              thumb_key = key;
              thumb = f[key];
            }
          }

          const fileId = sanitizeFilename(f.id);

          const dir = resolve(
            __dirname,
            "..",
            "files",
            fileId.substr(0, 3),
            fileId
          );

          const sanitizedFilename = sanitizeFilename(filename);
          fileObj.filename = join(
            fileId.substr(0, 3),
            fileId,
            sanitizedFilename
          );

          const output = resolve(dir, sanitizedFilename);
          console.log(output);

          await ensureDir(dir);

          if (thumb && thumb_key) {
            fileObj.originalThumbExtension = extname(thumb);
            fileObj.thumbFilename = join(
              fileId.substr(0, 3),
              fileId,
              thumb_key
            );

            const thumbFile = resolve(dir, thumb_key);
            await downloadFileIfNotExists(thumb, thumbFile);
          }
          await downloadFileIfNotExists(
            f.url_private_download ?? f.url_private,
            output,
            ["gsheet", "gpres", "gdoc"].includes(f.filetype)
          );

          await fileObj.save();
        }
      }
    }
  }
  console.log(`${withFiles} messages with files, ${fileCount} files`);
  console.log(filetypeCounts);
  console.log(`size: ${totalSize.toLocaleString()}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
