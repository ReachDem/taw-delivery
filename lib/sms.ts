
const userID = process.env.MBOA_SMS_USERID;
const password = process.env.MBOA_SMS_API_PASSWORD;

// ─── Cameroon number helpers ────────────────────────────────────

export function normalizeNumber(phone: string) {
  return phone.replace(/\D/g, "").replace(/^237/, "");
}

export function isValidMobileCM(phone: string) {
  const normalized = normalizeNumber(phone);
  return /^6\d{8}$/.test(normalized);
}

export function isOrange(phone: string) {
  const normalized = normalizeNumber(phone);
  if (!isValidMobileCM(normalized)) return false;
  const prefix = normalized.substring(0, 3);
  return (
    ["655", "656", "657", "658", "659", "686", "687", "688", "689", "640"].includes(prefix) ||
    /^69[0-9]{8}/.test(normalized)
  );
}

export function isMTN(phone: string) {
  const normalized = normalizeNumber(phone);
  if (!isValidMobileCM(normalized)) return false;
  const prefix = normalized.substring(0, 3);
  return (
    ["650", "651", "652", "653", "654", "680", "681", "682", "683"].includes(prefix) ||
    /^67[0-9]/.test(normalized)
  );
}

// ─── Send SMS ───────────────────────────────────────────────────

export async function sendSMS(sender: string, message: string, phone: string) {
  if (!isValidMobileCM(phone)) {
    console.log(`[SMS] Skipped — non-Cameroon number: ${phone}`);
    return { skipped: true, reason: "SMS uniquement disponible pour le Cameroun" };
  }

  // MTN numbers require sender_name "infos"
  const senderName = isMTN(phone) ? "infos" : sender;

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
      sender_name: senderName,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send SMS");
  }
  return response.json();
}