import { NextRequest, NextResponse } from "next/server";
import { extractDocument } from "@/features/document/extract-document";
import { createDocument } from "@/features/document/create-document";
import { sendMessage } from "@/features/whatsapp/zapi-client";

// Payload real da Z-API (evento "ReceivedCallback"):
// { phone, fromMe, isGroup, type, text: { message } , ...resto que não usamos }
type ZApiCallback = {
  type: string;
  fromMe: boolean;
  isGroup: boolean;
  phone: string;
  text?: { message: string };
};

// Mensagens muito curtas ("oi", "boa") não valem uma chamada à IA - evita custo à toa.
const MIN_LENGTH = 20;

// Fase de teste: só processa esse número, pra não gastar token com qualquer mensagem
// que chegar na instância enquanto testamos.
const ALLOWED_PHONE = "5511952875335";

export async function POST(req: NextRequest) {
  let body: ZApiCallback;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[whatsapp webhook] failed to parse request body as JSON", err);
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const text = body.text?.message;
  const ignoreReason =
    body.type !== "ReceivedCallback"
      ? "wrong_event_type"
      : body.fromMe
        ? "from_me"
        : body.isGroup
          ? "is_group"
          : body.phone !== ALLOWED_PHONE
            ? "phone_not_allowed"
            : !text
              ? "no_text"
              : text.length < MIN_LENGTH
                ? "text_too_short"
                : null;

  if (ignoreReason || !text) {
    console.log("[whatsapp webhook] ignored message", { reason: ignoreReason, phone: body.phone });
    return NextResponse.json({ ok: true, ignored: true, reason: ignoreReason });
  }

  let data;
  try {
    data = await extractDocument(text);
  } catch (err) {
    console.error("[whatsapp webhook] extractDocument failed", { phone: body.phone, text, err });
    await safeReply(body.phone, "Não consegui entender essa mensagem, tenta descrever de outro jeito.");
    return NextResponse.json({ ok: false, error: "extraction_failed" }, { status: 500 });
  }

  let document;
  try {
    document = await createDocument({ phone: body.phone, originalText: text, data });
  } catch (err) {
    console.error("[whatsapp webhook] createDocument failed", { phone: body.phone, data, err });
    await safeReply(body.phone, "Entendi a mensagem, mas não consegui salvar. Tenta de novo em um instante.");
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
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
    console.error("[whatsapp webhook] sendMessage failed", { phone, message, err });
  }
}
