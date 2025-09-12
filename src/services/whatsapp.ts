
'use server';

/**
 * Sends a message via the SatuConnect WhatsApp API.
 * 
 * @param phoneNumber The recipient's phone number in E.164 format without '+' (e.g., '6281234567890').
 * @param message The text message to send.
 * @throws {Error} If the API responds with an error or the request fails.
 */
export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<{ success: boolean; data?: any }> {
  const SATUCONNECT_API_ENDPOINT = "https://api.satuconnect.my.id/agent/message";
  const SATUCONNECT_API_KEY = process.env.SATUCONNECT_API_KEY;
  const SATUCONNECT_DEVICE_ID = process.env.SATUCONNECT_DEVICE_ID;

  if (!SATUCONNECT_API_KEY || !SATUCONNECT_DEVICE_ID) {
    console.error('SatuConnect API Key or Device ID is not configured in environment variables.');
    throw new Error('Konfigurasi SatuConnect tidak lengkap di server.');
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


    if (!response.ok || responseBody.status !== true) {
      const errorMessage = responseBody.message || `API responded with status ${response.status}`;
      console.error('SatuConnect API Error:', errorMessage);
      throw new Error(errorMessage);
    }
      
    console.log('Successfully sent WhatsApp message to', phoneNumber);
    return { success: true, data: responseBody.data };

  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred during API call.';
    console.error('Error calling SatuConnect WhatsApp service:', errorMessage);
    // Re-throw the error to be handled by the calling function
    throw new Error(errorMessage);
  }
}
