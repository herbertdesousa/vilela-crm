import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";

export async function getDocument(id: string) {
  const [row] = await db.select().from(documents).where(eq(documents.id, id));
  return row ?? null;
}
