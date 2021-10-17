import express from "express";
import React from "react";
import { getConnection } from "./db";
import { htmlPage } from "./util";
import { apiResultsDetail, apiResultsPage } from "./controllers/apiResults";
import { channelDetailPage } from "./controllers/channels";
import { channelListPage } from "./controllers/channels";
import { userDetail, userListPage } from "./controllers/users";
import { messageDetail, messagesList } from "./controllers/messages";
import { fileList, fileThumb, fileView } from "./controllers/files";
import yargs from "yargs";

async function main() {
  const args = yargs
    .strict()
    .demandCommand(0, 0)
    .option("port", { type: "number", default: 3050 }).argv;

  await getConnection();

  const app = express();
  app.get("/", async (req, res) => {
    res.send(
      htmlPage(
        <div>
          <h1>Strain</h1>
        </div>
      )
    );
  });

  app.get("/apiResults", apiResultsPage);
  app.get("/apiResults/:id", apiResultsDetail);

  app.get("/channels", channelListPage);
  app.get("/channels/:channelId", channelDetailPage);

  app.get("/users", userListPage);
  app.get("/users/:userId", userDetail);

  app.get("/messages", messagesList);
  app.get("/messages/:messageId", messageDetail);

  app.get("/files", fileList);
  app.get("/files/thumb/:fileSlackId", fileThumb);
  app.get("/files/view/:fileSlackId", fileView);

  const server = app.listen(args.port, () => {
    console.log(`now listening on ${JSON.stringify(server.address())}`);
  });
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
  });
}
