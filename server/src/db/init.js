/** Applies src/db/schema.sql. Destructive: it drops every table first. */
import { readFile } from "node:fs/promises";
import { getPool } from "./index.js";

const schema = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
await getPool().query(schema);
console.log("schema applied — run `npm run db:seed` next");
await getPool().end();
