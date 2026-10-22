import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Pooler (pgbouncer) não suporta prepared statements
const client = postgres(process.env.POSTGRES_URL!, {
  prepare: false,
  ssl: "require",
  max: 1,
});

export const db = drizzle(client, { schema });
