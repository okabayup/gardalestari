
'use server';

/**
 * Sends a message via the SatuConnect WhatsApp API.
 * 
 * @param phoneNumber The recipient's phone number in E.164 format without '+' (e.g., '6281234567890').
 * @param message The text message to send.
 * @throws {Error} If the API responds with an error or the request fails.
 */
export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<void> {
  const SATUCONNECT_API_ENDPOINT = "https://api.satuconnect.my.id/agent/message";
  const SATUCONNECT_API_KEY = process.env.SATUCONNECT_API_KEY;
  const SATUCONNECT_DEVICE_ID = process.env.SATUCONNECT_DEVICE_ID;

  if (!SATUCONNECT_API_KEY || !SATUCONNECT_DEVICE_ID) {
    console.error('SatuConnect API Key or Device ID is not configured in environment variables.');
    throw new Error('Konfigurasi SatuConnect tidak lengkap di server.');
  }
  
  // Ensure phone number is in the correct format (e.g., 628xxxx)
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

    if (!response.ok) {
      // Log the full error from the API for debugging
      console.error('SatuConnect API Error Response:', responseBody);
      // Throw a more descriptive error for the caller
      const errorMessage = responseBody.message || `API responded with status ${response.status}`;
      throw new Error(errorMessage);
    }
    
    // Even with a 200 OK, the API might report a failure in its body
    if (responseBody.status !== true) {
      console.error('SatuConnect reported a failure:', responseBody);
      throw new Error(responseBody.message || 'SatuConnect gagal mengirim pesan.');
    }
      
    console.log('Successfully sent WhatsApp message to', phoneNumber);

  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred during API call.';
    console.error('Error calling SatuConnect WhatsApp service:', errorMessage);
    // Re-throw the error to be handled by the calling function
    throw new Error(errorMessage);
  }
}
