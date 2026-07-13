import { sendOtpEmail } from "@/lib/mailer";
import { sendOtpSms, isSmsConfigured } from "@/lib/sms";

/** Sends the OTP over every channel available for this user (email always, SMS if configured + phone present). */
export async function dispatchOtp(params: { email: string; phone?: string | null; code: string }) {
  const tasks: Promise<void>[] = [sendOtpEmail({ to: params.email, code: params.code }).catch((err) => {
    console.error("[otp] email send failed", err);
  })];

  if (params.phone && isSmsConfigured()) {
    tasks.push(
      sendOtpSms(params.phone, params.code).catch((err) => {
        console.error("[otp] sms send failed", err);
      })
    );
  }

  await Promise.all(tasks);
}
