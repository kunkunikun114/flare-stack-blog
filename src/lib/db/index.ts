import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import type { DrizzleD1Database } from "drizzle-orm/d1";

export type DB = DrizzleD1Database<typeof schema>;

export function getDb(env: Env): DB {
  return drizzle(env.DB, { schema });
}
