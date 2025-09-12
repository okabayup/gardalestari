
'use server';

/**
 * Sends a message via the SatuConnect WhatsApp API.
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
    console.error('SatuConnect Error:', errorMsg);
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

    const responseBody = await response.json();
    console.log('SatuConnect API Response:', JSON.stringify(responseBody, null, 2));

    if (responseBody.status === true) {
      console.log('Successfully sent WhatsApp message to', phoneNumber);
      return { success: true, data: responseBody.data };
    } else {
      // Handle API-level errors where status is false
      const errorMessage = responseBody.message || `API responded with status ${response.status}`;
      console.error('SatuConnect API Error:', errorMessage);
      return { success: false, error: errorMessage };
    }

  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred during API call.';
    console.error('Error calling SatuConnect WhatsApp service:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
