import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { ExtractedDocumentSchema, type ExtractedDocument } from "./schema";

const client = new Anthropic();

export async function extractDocument(whatsappText: string): Promise<ExtractedDocument> {
  const response = await client.beta.messages.parse({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    system:
      "Você extrai dados de orçamentos/recibos de serviços de ar condicionado a partir de " +
      "mensagens de WhatsApp em português. Nunca invente dado que não está no texto — deixe " +
      "null quando não tiver certeza. Não corrija nem complete valores.",
    messages: [{ role: "user", content: whatsappText }],
    output_format: betaZodOutputFormat(ExtractedDocumentSchema),
  });

  if (!response.parsed_output) {
    throw new Error("Claude could not structure this message");
  }
  return response.parsed_output;
}
