
const userID = process.env.MBOA_SMS_USERID;
const password = process.env.MBOA_SMS_API_PASSWORD;


export async function sendSMS(sender: string, message: string, phone: string) {
  const response = await fetch("https://mboadeals.net/api/v1/sms/sendsms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userID,
      password: password,
      message: message,
      phone_str: phone,
      sender_name: sender,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send SMS");
  }
  return response.json();
}