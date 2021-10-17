import { findCachedApiResult } from "./index";
import { getConnection } from "./db";
import { User } from "./models/user";
import { Channel } from "./models/channel";
import { ApiResult } from "./models/api-result";
import { Like } from "typeorm";
import { Message } from "./models/message";

async function populateUsers() {
  const userData = await findCachedApiResult({
    method: "users.list",
    params: "",
  });
  const userList = userData
    ? JSON.parse(userData.data!.toString()).members
    : [];

  const existingUsers = await User.find();
  const existingUsersBySlackId = new Map<string, User>();

  for (const u of existingUsers) {
    existingUsersBySlackId.set(u.slackId!, u);
  }

  for (const userFromApi of userList) {
    const userObj = existingUsersBySlackId.get(userFromApi.id) ?? new User();
    userObj.slackId = userFromApi.id;
    userObj.name = userFromApi.name;
    userObj.realName = userFromApi.real_name;
    userObj.isAdmin = userFromApi.is_admin ?? false;
    userObj.isOwner = userFromApi.is_owner ?? false;
    userObj.isDeleted = userFromApi.deleted;
    userObj.raw = Buffer.from(JSON.stringify(userFromApi, null, 2));
    await userObj.save();
  }
}

async function populateChannels() {
  const channelData = await findCachedApiResult({
    method: "conversations.list",
    params: "",
  });
  const channelList = channelData
    ? JSON.parse(channelData.data!.toString()).channels
    : [];

  const existingChannels = await Channel.find();
  const existingChannelsBySlackId = new Map<string, Channel>();
  for (const c of existingChannels) {
    existingChannelsBySlackId.set(c.slackId, c);
  }

  for (const channelFromApi of channelList) {
    const channelObj =
      existingChannelsBySlackId.get(channelFromApi.id) ?? new Channel();
    channelObj.slackId = channelFromApi.id;
    channelObj.created = new Date(channelFromApi.created * 1000);
    channelObj.creatorSlackId = channelFromApi.creator;
    channelObj.name = channelFromApi.name;
    channelObj.topic = channelFromApi.topic.value;
    channelObj.purpose = channelFromApi.purpose.value;
    channelObj.unlinked =
      channelFromApi.unlinked && channelFromApi.unlinked !== 0
        ? new Date(channelFromApi.unlinked * 1000)
        : null;
    channelObj.memberCount = channelFromApi.num_members;
    channelObj.raw = Buffer.from(JSON.stringify(channelFromApi, null, 2));
    await channelObj.save();
  }
}

async function populateMessages() {
  const channels = await Channel.find();
  for (const c of channels) {
    const msgResults = await ApiResult.find({
      where: [
        {
          method: "conversations.history",
          params: `channel=${c.slackId}`,
        },
        {
          method: "conversations.history",
          params: Like(`channel=${c.slackId}%`),
        },
      ],
      order: { timestamp: "ASC" },
      select: ["id", "data", "method", "params", "timestamp"],
    });

    for (const r of msgResults) {
      console.log(`${r.id} ${r.method} ${r.params} ${r.timestamp}`);
      const data = JSON.parse(r.data);
      for (const m of data.messages) {
        const messageObj =
          (await Message.findOne({
            where: {
              channelSlackId: c.slackId,
              messageTimestamp: m.ts,
              threadTimestamp: m.thread_ts ?? m.ts,
            },
          })) ?? new Message();

        messageObj.channelSlackId = c.slackId;
        messageObj.messageTimestamp = m.ts;
        messageObj.threadTimestamp = m.thread_ts ?? m.ts;
        messageObj.isReply = false;
        messageObj.userSlackId = m.user ?? m.bot_id;
        messageObj.text = m.text;
        messageObj.raw = Buffer.from(JSON.stringify(m, null, 2));
        await messageObj.save();

        const replies = await ApiResult.find({
          where: {
            method: "conversations.replies",
            params: `channel=${c.slackId},ts=${m.thread_ts}`,
          },
          order: { timestamp: "ASC" },
          select: ["id", "data", "method", "params", "timestamp"],
        });

        for (const replyResult of replies) {
          const data = JSON.parse(replyResult.data);

          for (const replyMessage of data.messages) {
            const replyObj =
              (await Message.findOne({
                where: {
                  channelSlackId: c.slackId,
                  messageTimestamp: replyMessage.ts,
                  threadTimestamp: m.thread_ts,
                },
              })) ?? new Message();

            replyObj.isReply = m.ts !== replyMessage.ts;
            replyObj.channelSlackId = c.slackId;
            replyObj.messageTimestamp = replyMessage.ts;
            replyObj.threadTimestamp = replyMessage.thread_ts;
            replyObj.userSlackId = replyMessage.user ?? replyMessage.bot_id;
            replyObj.text = replyMessage.text;
            replyObj.raw = Buffer.from(JSON.stringify(replyMessage, null, 2));
            await replyObj.save();
          }
        }
      }
    }
  }
}

async function main() {
  await getConnection();
  await populateUsers();
  await populateChannels();
  await populateMessages();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
