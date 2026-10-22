import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const documents = pgTable("tb_documents", {
  id: uuid().primaryKey().defaultRandom(),
  phone: text().notNull(), // número de quem mandou a mensagem no WhatsApp
  originalText: text().notNull(), // mensagem crua, pra depurar extração ruim
  data: jsonb().notNull(), // ExtractedDocument (src/features/document/schema.ts)
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
