import nodemailer from "nodemailer";

export async function sendEmailOTP(email: string, otp: string, link: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    to: email,
    subject: "Login Verification",
    html: `
      <h2>Your OTP: ${otp}</h2>
      <p>Or click below:</p>
      <a href="${link}">Login</a>
    `,
  });
}
