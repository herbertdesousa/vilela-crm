import "server-only";
import { db } from "@/db";
import { documents } from "@/db/schema";
import type { ExtractedDocument } from "./schema";

export async function createDocument(input: {
  phone: string;
  originalText: string;
  data: ExtractedDocument;
}) {
  const [row] = await db.insert(documents).values(input).returning();
  return row;
}
