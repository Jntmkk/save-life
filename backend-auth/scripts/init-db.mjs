// One-off provisioning script: creates save_life_test / save_life_prod and users tables.
// Usage: node --env-file=.env scripts/init-db.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mysql from "mysql2/promise";

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, "../sql/init.sql"), "utf8");

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
});

console.log(`Connected to ${process.env.DB_HOST}`);
await conn.query(sql);
console.log("init.sql applied");

const [dbs] = await conn.query("SHOW DATABASES LIKE 'save_life%'");
console.log("Databases:", dbs);
const [tables] = await conn.query("SHOW TABLES IN save_life_test");
console.log("save_life_test tables:", tables);

await conn.end();
