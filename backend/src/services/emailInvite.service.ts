import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendInviteEmail(
  email: string,
  inviteLink: string
) {
  await transporter.sendMail({
    from: `" Hind Social AI Community Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "You're invited to join a community 🎉",
    html: `
      <h2>You have been invited!</h2>
      <p>Click below to join:</p>
      <a href="${inviteLink}" style="padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:5px;">
        Join Community
      </a>
    `,
  });
}