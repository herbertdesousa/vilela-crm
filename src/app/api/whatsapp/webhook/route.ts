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
  const body: ZApiCallback = await req.json();

  const text = body.text?.message;
  const shouldProcess =
    body.type === "ReceivedCallback" &&
    !body.fromMe &&
    !body.isGroup &&
    body.phone === ALLOWED_PHONE &&
    text &&
    text.length >= MIN_LENGTH;

  if (!shouldProcess || !text) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const data = await extractDocument(text);
    const document = await createDocument({
      phone: body.phone,
      originalText: text,
      data,
    });

    const link = `${process.env.NEXT_PUBLIC_APP_URL}/d/${document.id}`;
    await sendMessage(body.phone, `Recebi! Confere aqui: ${link}`);
  } catch (err) {
    console.error("failed to process whatsapp message", err);
    await sendMessage(
      body.phone,
      "Não consegui entender essa mensagem, tenta descrever de outro jeito.",
    );
  }

  return NextResponse.json({ ok: true });
}
