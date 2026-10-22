import { notFound } from "next/navigation";
import { getDocument } from "@/features/document/get-document";
import { DocumentView } from "@/features/document/components/document-view";
import type { ExtractedDocument } from "@/features/document/schema";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await getDocument(id);

  if (!document) notFound();

  return <DocumentView data={document.data as ExtractedDocument} />;
}
