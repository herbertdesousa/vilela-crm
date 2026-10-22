import "server-only";

const INSTANCE_ID = process.env.ZAPI_INSTANCE_ID!;
const INSTANCE_TOKEN = process.env.ZAPI_INSTANCE_TOKEN!;
const CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN!;

export async function sendMessage(phone: string, message: string) {
  await fetch(
    `https://api.z-api.io/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}/send-text`,
    {
      method: "POST",
      headers: {
        "Client-Token": CLIENT_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, message }),
    },
  );
}
