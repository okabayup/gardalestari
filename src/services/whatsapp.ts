

'use server';

const DEV_PHONE_NUMBER = '6285937010409';

/**
 * Sends a single message via the SatuConnect WhatsApp API.
 * 
 * @param phoneNumber The recipient's phone number in E.164 format without '+' (e.g., '6281234567890').
 * @param message The text message to send.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<{ success: boolean; data?: any, error?: string }> {
  const SATUCONNECT_API_ENDPOINT = "https://api.satuconnect.my.id/agent/message";
  const SATUCONNECT_API_KEY = process.env.SATUCONNECT_API_KEY;
  const SATUCONNECT_DEVICE_ID = process.env.SATUCONNECT_DEVICE_ID;

  if (!SATUCONNECT_API_KEY || !SATUCONNECT_DEVICE_ID) {
    const errorMsg = 'Konfigurasi SatuConnect tidak lengkap di server.';
    console.error('[sendWhatsAppMessage Error]', errorMsg);
    return { success: false, error: errorMsg };
  }
  
  const formattedPhoneNumber = phoneNumber.replace(/\D/g, '');

  try {
    const response = await fetch(SATUCONNECT_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SATUCONNECT_API_KEY}`,
      },
      body: JSON.stringify({
        deviceID: SATUCONNECT_DEVICE_ID,
        phoneNumbers: formattedPhoneNumber,
        message: message,
      }),
    });
    
    const responseBody = await response.json().catch(() => response.text());

    if (response.ok && typeof responseBody === 'object' && responseBody.status === true) {
        console.log('Successfully sent WhatsApp message to', phoneNumber);
        return { success: true, data: responseBody.data };
    } else {
        const errorMessage = typeof responseBody === 'object' ? responseBody.message : (responseBody || `API responded with status ${response.status}`);
        console.error('SatuConnect API Error:', errorMessage);
        return { success: false, error: errorMessage, data: responseBody };
    }

  } catch (error) {
    const errorMessage = (error as Error).message || 'Unknown error occurred during API call.';
    console.error('[sendWhatsAppMessage Error] Failed to call SatuConnect service:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Sends a message to multiple recipients via the SatuConnect WhatsApp API.
 * 
 * @param phoneNumbers An array of recipient phone numbers in E.164 format without '+' (e.g., ['628123...', '62895...']).
 * @param message The text message to send.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function sendBulkWhatsAppMessage(phoneNumbers: string[], message: string): Promise<{ success: boolean; data?: any, error?: string }> {
  const SATUCONNECT_API_ENDPOINT = "https://api.satuconnect.my.id/agent/messages";
  const SATUCONNECT_API_KEY = process.env.SATUCONNECT_API_KEY;
  const SATUCONNECT_DEVICE_ID = process.env.SATUCONNECT_DEVICE_ID;

  if (!SATUCONNECT_API_KEY || !SATUCONNECT_DEVICE_ID) {
    const errorMsg = 'Konfigurasi SatuConnect tidak lengkap di server.';
    console.error('[sendBulkWhatsAppMessage Error]', errorMsg);
    return { success: false, error: errorMsg };
  }

  const formattedPhoneNumbers = phoneNumbers.map(num => num.replace(/\D/g, ''));
  if (formattedPhoneNumbers.length === 0) {
      return { success: true, data: { message: "No numbers to send to." } };
  }
  
  try {
    const response = await fetch(SATUCONNECT_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SATUCONNECT_API_KEY}`,
      },
      body: JSON.stringify({
        deviceID: SATUCONNECT_DEVICE_ID,
        phoneNumbers: formattedPhoneNumbers,
        message: message,
      }),
    });
    
    const responseBody = await response.json().catch(() => response.text());

    if (response.ok && typeof responseBody === 'object' && responseBody.status === true) {
        console.log(`Successfully sent bulk WhatsApp message to ${responseBody.data?.sentCount} recipients.`);
        return { success: true, data: responseBody.data };
    } else {
        const errorMessage = typeof responseBody === 'object' ? responseBody.message : responseBody;
        console.error('SatuConnect Bulk API Error:', errorMessage, responseBody.partialSuccess || '');
        return { success: false, error: errorMessage, data: responseBody };
    }

  } catch (error) {
    const errorMessage = (error as Error).message || 'Unknown error occurred during bulk API call.';
    console.error('[sendBulkWhatsAppMessage Error] Failed to call SatuConnect bulk service:', errorMessage);
    return { success: false, error: errorMessage };
  }
}


/**
 * Sends a development alert message to a predefined developer phone number.
 * This is a fire-and-forget function.
 * @param message The alert message to send.
 */
export async function sendDevAlert(message: string): Promise<void> {
  const alertMessage = `🚨 *Garda Lestari App Alert* 🚨\n\n${message}`;
  
  // Fire-and-forget: we don't await this and don't care about the response
  sendWhatsAppMessage(DEV_PHONE_NUMBER, alertMessage).catch(err => {
    console.error("Failed to send dev alert:", err);
  });
}
