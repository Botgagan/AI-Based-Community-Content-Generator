import axios from "axios";

export async function sendSMSOTP(phone: string, otp: string) {
  await axios.post(
    "https://control.msg91.com/api/v5/flow/",
    {
      template_id: process.env.MSG91_TEMPLATE_ID,
      short_url: "0",
      recipients: [
        {
          mobiles: phone,
          OTP: otp,
        },
      ],
    },
    {
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
        "Content-Type": "application/json",
      },
    }
  );
}

