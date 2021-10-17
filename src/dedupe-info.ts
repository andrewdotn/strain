import { getConnection } from "./db";
import { ApiResult } from "./models/api-result";
import { createHash } from "crypto";

function hashData(s: string | Buffer) {
  return createHash("sha256").update(s).digest().toString("hex");
}

async function main() {
  await getConnection();

  const lastMethodAndParams = new Map<string, [number, string]>();

  const apiResults = await ApiResult.find({ order: { timestamp: "ASC" } });
  for (const r of apiResults) {
    const methodAndParams = JSON.stringify([r.method, r.params]);

    const data = await ApiResult.findOneOrFail({
      where: { id: r.id },
      select: ["data"],
    });
    const curHash = hashData(data.data!);

    const [prevId, prevHash] = lastMethodAndParams.get(methodAndParams) ?? [];
    if (prevHash === curHash) {
      console.log(`dupe on ${prevId} → ${r.id} ${methodAndParams}`);

      let prev = await ApiResult.findOneOrFail({
        where: { id: prevId },
        select: ["data", "timestamp", "lastDupeTime"],
      });

      if (!prev.data || Buffer.compare(prev.data, data.data)) {
        throw new Error("mismatch");
      }
      if (
        prev.timestamp >= r.timestamp ||
        (prev.lastDupeTime && prev.lastDupeTime >= r.timestamp) ||
        r.lastDupeTime
      ) {
        throw new Error("fail");
      }

      prev = await ApiResult.findOneOrFail({
        where: { id: prevId },
      });
      prev.lastDupeTime = r.timestamp;
      await prev.save();
      await r.remove();
    } else {
      lastMethodAndParams.set(methodAndParams, [r.id!, curHash]);
    }
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
