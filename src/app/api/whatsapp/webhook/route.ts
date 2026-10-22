import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { extractDocument } from "@/features/document/extract-document";
import { createDocument } from "@/features/document/create-document";
import { sendMessage } from "@/features/whatsapp/zapi-client";

const MIN_LENGTH = 20;

const ALLOWED_PHONE = "5511954881948";

const ZApiCallbackSchema = z.object({
  type: z.string(),
  fromMe: z.boolean(),
  // true quando a mensagem foi enviada programaticamente pela Z-API (ex.: nosso próprio
  // sendMessage) - é assim que distinguimos "o bot respondeu" de "a pessoa digitou",
  // já que ambos podem vir com fromMe: true no mesmo número.
  fromApi: z.boolean(),
  isGroup: z.boolean(),
  phone: z.string(),
  text: z.object({ message: z.string() }).optional(),
});

const IncomingMessageSchema = ZApiCallbackSchema.refine(
  (b) => b.type === "ReceivedCallback",
  {
    message: "wrong_event_type",
  }
)
  .refine((b) => !b.isGroup, { message: "is_group" })
  .refine((b) => !b.fromApi, { message: "own_api_reply" })
  .refine((b) => b.phone === ALLOWED_PHONE, { message: "phone_not_allowed" })
  .refine((b) => !!b.text?.message, { message: "no_text" })
  .refine((b) => (b.text?.message?.length ?? 0) >= MIN_LENGTH, {
    message: "text_too_short",
  });

export async function POST(req: NextRequest) {
  const json = await req.json().catch((err) => {
    console.error(
      "[whatsapp webhook] failed to parse request body as JSON",
      err
    );
    return null;
  });
  if (json === null) {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 }
    );
  }

  const shape = ZApiCallbackSchema.safeParse(json);
  if (!shape.success) {
    console.error(
      "[whatsapp webhook] payload failed schema validation",
      shape.error.issues
    );
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400 }
    );
  }

  const parsed = IncomingMessageSchema.safeParse(shape.data);
  if (!parsed.success) {
    const reason = parsed.error.issues[0]?.message ?? "ignored";
    console.log("[whatsapp webhook] ignored message", {
      reason,
      phone: shape.data.phone,
    });
    return NextResponse.json({ ok: true, ignored: true, reason });
  }

  const body = parsed.data;
  const text = body.text!.message; // garantido pelo schema acima (refine "no_text")

  let data;
  try {
    data = await extractDocument(text);
  } catch (err) {
    console.error("[whatsapp webhook] extractDocument failed", {
      phone: body.phone,
      text,
      err,
    });
    await safeReply(
      body.phone,
      "Não consegui entender essa mensagem, tenta descrever de outro jeito."
    );
    return NextResponse.json(
      { ok: false, error: "extraction_failed" },
      { status: 500 }
    );
  }

  let document;
  try {
    document = await createDocument({
      phone: body.phone,
      originalText: text,
      data,
    });
  } catch (err) {
    console.error("[whatsapp webhook] createDocument failed", {
      phone: body.phone,
      data,
      err,
    });
    await safeReply(
      body.phone,
      "Entendi a mensagem, mas não consegui salvar. Tenta de novo em um instante."
    );
    return NextResponse.json(
      { ok: false, error: "save_failed" },
      { status: 500 }
    );
  }

  const link = `${process.env.NEXT_PUBLIC_APP_URL}/d/${document.id}`;
  await safeReply(body.phone, `Recebi! Confere aqui: ${link}`);

  return NextResponse.json({ ok: true, documentId: document.id });
}

// Nunca deixa uma falha no envio da resposta derrubar o request - só loga.
async function safeReply(phone: string, message: string) {
  try {
    await sendMessage(phone, message);
  } catch (err) {
    console.error("[whatsapp webhook] sendMessage failed", {
      phone,
      message,
      err,
    });
  }
}
