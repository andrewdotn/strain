import {getConnection} from "./db";
import {basename, join, resolve} from "path";
import {pipeline} from "stream";
import fetch from "node-fetch";
import {promisify} from "util";
import {createWriteStream, ensureDir, readFile, rename,} from "fs-extra";
import sanitizeFilename from "sanitize-filename";
import {LogLevel, WebClient} from "@slack/web-api";
import {cachingProxy} from "./index";
import {Emoji} from "./models/emoji";

const pipelinePromise = promisify(pipeline);

async function main() {
  const token = (await readFile(".token")).toString().trim();

  await getConnection();

  const web = new WebClient(token, {
    logLevel: LogLevel.DEBUG,
  });


  const emojiList = await cachingProxy({
    method: "emoji.list",
    params: "",
    generator: web.emoji.list,
  }) as unknown as {emoji: {[name: string]: string}}[];

  const outputDir = resolve(
    __dirname,
    "..",
    "emoji"
  );
  await ensureDir(outputDir);

  for (const listEntry of emojiList) {
    for (const [name, url] of Object.entries(listEntry.emoji)) {
      let emojiObj =
        (await Emoji.findOne({where: {name, url}}));
      if (emojiObj) {
        continue;
      }

      emojiObj = new Emoji();
      emojiObj.name = name;
      emojiObj.url = url;

      if (url.startsWith('alias:')) {
        await emojiObj.save();
      } else {
        const localpath = sanitizeFilename(name + '-' + basename(url));

        const response = await fetch(url, {
          // headers,
        });
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        await pipelinePromise(response.body, createWriteStream("tmp"));


        const targetPath = join(outputDir, localpath);
        await rename("tmp", targetPath);

        console.log(localpath);

        emojiObj.localpath = localpath;
        await emojiObj.save();
      }
    }
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
