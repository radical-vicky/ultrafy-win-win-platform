/**
 * Minimal Twilio SMS sender using fetch + Basic Auth against Twilio's REST
 * API directly — no SDK dependency needed. If Twilio env vars aren't set,
 * this quietly no-ops (logs and returns) so local/dev environments without
 * SMS configured don't break; email OTP still goes out either way.
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

export function isSmsConfigured(): boolean {
  return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER);
}

export async function sendSms(to: string, body: string): Promise<void> {
  if (!isSmsConfigured()) {
    console.warn("[sms] Twilio not configured — skipping SMS to", to);
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: TWILIO_FROM_NUMBER!, Body: body }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Twilio SMS failed (${res.status}): ${errText}`);
  }
}

export async function sendOtpSms(to: string, code: string): Promise<void> {
  await sendSms(to, `Your Ultrafy verification code is ${code}. It expires in 5 minutes.`);
}
