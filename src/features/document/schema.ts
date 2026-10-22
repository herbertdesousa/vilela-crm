import { z } from "zod";

export const DocumentItemSchema = z.object({
  title: z.string().describe("Nome da seção, ex: Infraestrutura, Instalação, Serviço"),
  location: z.string().nullable().describe("Cômodo/andar, ex: Sala, Térreo"),
  description: z.string().describe("Texto livre com o que foi/será feito"),
  equipment: z.array(z.string()).describe("Ex: '1x Split Cassete 4 vias 22.000 BTU'"),
  materials: z.array(z.string()),
  value: z.number().nullable(),
});

export const ExtractedDocumentSchema = z.object({
  type: z.enum(["quote", "receipt"]),
  customerName: z.string().nullable(),
  address: z.string().nullable(),
  items: z.array(DocumentItemSchema),
  totalValue: z.number().nullable(),
});

export type ExtractedDocument = z.infer<typeof ExtractedDocumentSchema>;
