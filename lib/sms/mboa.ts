// ============================================
// TAW DELIVERY - Service SMS Mboa
// ============================================

const MBOA_API_URL = 'https://mboadeals.net/api/v1/sms/sendsms';

interface MboaSMSResponse {
  success: boolean;
  message?: string;
  // Ajouter les champs réels de la réponse Mboa si documentés
}

interface SendSMSOptions {
  phone: string;
  message: string;
  sender?: string;
}

/**
 * Envoie un SMS via l'API Mboa SMS
 */
export async function sendSMS(options: SendSMSOptions): Promise<MboaSMSResponse> {
  const { phone, message, sender } = options;
  
  const userID = process.env.MBOA_SMS_USERID;
  const password = process.env.MBOA_SMS_API_PASSWORD;
  const defaultSender = process.env.MBOA_SMS_SENDER_NAME || 'TAW';

  if (!userID || !password) {
    throw new Error('Mboa SMS credentials not configured');
  }

  const response = await fetch(MBOA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userID,
      password: password,
      message: message,
      phone_str: phone,
      sender_name: sender || defaultSender,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send SMS: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Formate le numéro de téléphone pour le Cameroun
 * Convertit les formats locaux en format international
 */
export function formatPhoneNumber(phone: string): string {
  // Supprimer les espaces et caractères spéciaux
  let cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
  
  // Si commence par 00, remplacer par +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }
  
  // Si commence par 6 ou 2 (numéros camerounais), ajouter +237
  if (/^[62]\d{8}$/.test(cleaned)) {
    cleaned = '+237' + cleaned;
  }
  
  // Si commence par 237 sans +, ajouter +
  if (cleaned.startsWith('237') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Génère le message SMS pour l'arrivée d'un colis
 */
export function generateArrivalMessage(code: string, agencyName: string): string {
  const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN || 'taw.cm';
  const confirmUrl = `https://${shortDomain}/c/${code}`;
  
  return `Votre colis ${code} est arrivé à ${agencyName}. Confirmez la réception ou demandez une livraison: ${confirmUrl}`;
}

/**
 * Génère le message SMS de rappel
 */
export function generateReminderMessage(code: string): string {
  const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN || 'taw.cm';
  const confirmUrl = `https://${shortDomain}/c/${code}`;
  
  return `Rappel: Votre colis ${code} vous attend. Confirmez: ${confirmUrl}`;
}

/**
 * Génère le message SMS de confirmation de livraison programmée
 */
export function generateDeliveryScheduledMessage(
  code: string,
  date: string,
  slot: string
): string {
  return `Votre colis ${code} sera livré le ${date} entre ${slot}. Restez joignable!`;
}

/**
 * Envoie une notification d'arrivée de colis
 */
export async function sendParcelArrivalNotification(
  phone: string,
  code: string,
  agencyName: string
): Promise<MboaSMSResponse> {
  const formattedPhone = formatPhoneNumber(phone);
  const message = generateArrivalMessage(code, agencyName);
  
  return sendSMS({
    phone: formattedPhone,
    message,
  });
}
