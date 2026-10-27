import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const generatedConfigPath = resolve("dist/server/wrangler.json");
const deployConfigPath = resolve("dist/server/wrangler.deploy.json");
const databaseId = process.env.DORAN_D1_DATABASE_ID;
const databaseName = process.env.DORAN_D1_DATABASE_NAME || "doran-db";
const workerName = process.env.CLOUDFLARE_WORKER_NAME || "mungs-doran";

if (!databaseId || !/^[0-9a-f-]{36}$/i.test(databaseId)) {
  throw new Error(
    "Set DORAN_D1_DATABASE_ID to the ID of your Cloudflare D1 database before deploying.",
  );
}

const config = JSON.parse(await readFile(generatedConfigPath, "utf8"));
config.name = workerName;
const db = config.d1_databases?.find((binding) => binding.binding === "DB");
if (!db) throw new Error("The generated Worker config is missing the DB binding.");
db.database_name = databaseName;
db.database_id = databaseId;
db.migrations_dir = "../.openai/drizzle";
await writeFile(deployConfigPath, `${JSON.stringify(config, null, 2)}\n`);

const wrangler = resolve("node_modules/wrangler/bin/wrangler.js");
const commands = [
  ["d1", "migrations", "apply", databaseName, "--remote", "--config", deployConfigPath],
  ["deploy", "--config", deployConfigPath],
];

for (const args of commands) {
  const result = spawnSync(process.execPath, [wrangler, ...args], {
    stdio: "inherit",
    env: process.env,
    cwd: dirname(resolve("package.json")),
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
