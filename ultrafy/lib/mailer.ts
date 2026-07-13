import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function send(to: string, subject: string, html: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("[mailer] GMAIL_USER/GMAIL_APP_PASSWORD not set — skipping email:", subject);
    return;
  }
  await transporter.sendMail({
    from: `"Ultrafy Fiber Network" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

export async function notifyAdminNewListing(params: {
  propertyTitle: string;
  ownerName: string;
  ownerEmail: string;
  propertyId: string;
}) {
  const to = process.env.NOTIFY_TO_EMAIL || process.env.GMAIL_USER || "";
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin`;
  await send(
    to,
    `New property submitted: ${params.propertyTitle}`,
    `<p><strong>${params.ownerName}</strong> (${params.ownerEmail}) submitted a new listing:</p>
     <p>${params.propertyTitle}</p>
     <p><a href="${dashboardUrl}">Review it in the admin panel</a></p>`
  );
}

export async function notifyOwnerApproved(params: { to: string; propertyTitle: string }) {
  await send(
    params.to,
    `Your listing "${params.propertyTitle}" is live!`,
    `<p>Great news — your property <strong>${params.propertyTitle}</strong> has been approved and is now live on Ultrafy's listings page.</p>`
  );
}

export async function notifyOwnerRejected(params: { to: string; propertyTitle: string; reason?: string }) {
  await send(
    params.to,
    `Update on your listing "${params.propertyTitle}"`,
    `<p>Your property <strong>${params.propertyTitle}</strong> was not approved.</p>
     ${params.reason ? `<p>Reason: ${params.reason}</p>` : ""}`
  );
}

export async function notifyOwnerNewInquiry(params: { to: string; propertyTitle: string; inquirerName: string; inquirerEmail: string; message?: string }) {
  await send(
    params.to,
    `New inquiry for "${params.propertyTitle}"`,
    `<p><strong>${params.inquirerName}</strong> (${params.inquirerEmail}) is interested in your property <strong>${params.propertyTitle}</strong>.</p>
     ${params.message ? `<p>Message: ${params.message}</p>` : ""}`
  );
}

export async function sendPasswordResetEmail(params: { to: string; resetUrl: string }) {
  await send(
    params.to,
    "Reset your Ultrafy password",
    `<p>Click below to set a new password. This link expires in 1 hour and can only be used once.</p>
     <p><a href="${params.resetUrl}">${params.resetUrl}</a></p>
     <p>If you didn't request this, you can safely ignore this email.</p>`
  );
}

export async function notifyOwnerContractReady(params: { to: string; propertyTitle: string; reviewUrl: string }) {
  await send(
    params.to,
    `Please review your Ultrafy fiber contract — ${params.propertyTitle}`,
    `<p>Your exclusive fiber-provider agreement for <strong>${params.propertyTitle}</strong> is ready to review and sign.</p>
     <p><a href="${params.reviewUrl}">Review and sign the contract</a></p>`
  );
}

export async function sendOtpEmail(params: { to: string; code: string }) {
  await send(
    params.to,
    "Verify your Ultrafy account",
    `<p>Your verification code is:</p>
     <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${params.code}</p>
     <p>This code expires in 5 minutes. If you didn't request this, you can ignore this email.</p>`
  );
}

export async function notifyAdminNewUserPending(params: { name: string; email: string; role: string; reviewUrl: string }) {
  const to = process.env.NOTIFY_TO_EMAIL || process.env.GMAIL_USER || "";
  await send(
    to,
    `New account awaiting approval: ${params.name}`,
    `<p><strong>${params.name}</strong> (${params.email}) verified their email and is awaiting approval as a <strong>${params.role}</strong>.</p>
     <p><a href="${params.reviewUrl}">Review in the admin panel</a></p>`
  );
}

export async function notifyUserApproved(params: { to: string; name: string }) {
  await send(
    params.to,
    "Your Ultrafy account is active",
    `<p>Hi ${params.name}, your account has been approved — you now have full access to Ultrafy.</p>`
  );
}

export async function notifyUserRejected(params: { to: string; name: string; reason?: string }) {
  await send(
    params.to,
    "Update on your Ultrafy account",
    `<p>Hi ${params.name}, we weren't able to approve your account.</p>
     ${params.reason ? `<p>Reason: ${params.reason}</p>` : ""}`
  );
}
