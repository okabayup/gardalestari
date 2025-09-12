
'use server';

/**
 * Sends a message via the SatuConnect WhatsApp API.
 * 
 * @param phoneNumber The recipient's phone number in E.164 format without '+' (e.g., '6281234567890').
 * @param message The text message to send.
 */
export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<void> {
  const SATUCONNECT_API_ENDPOINT = "https://api.satuconnect.my.id/agent/message";
  const SATUCONNECT_API_KEY = process.env.SATUCONNECT_API_KEY;
  const SATUCONNECT_DEVICE_ID = process.env.SATUCONNECT_DEVICE_ID;

  if (!SATUCONNECT_API_KEY || !SATUCONNECT_DEVICE_ID) {
    console.error('SatuConnect API Key or Device ID is not configured in environment variables.');
    return;
  }
  
  // Ensure phone number is in the correct format (e.g., 628xxxx)
  const formattedPhoneNumber = phoneNumber.replace('+', '');

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

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send WhatsApp message via SatuConnect:', errorData);
      throw new Error(`SatuConnect API responded with status ${response.status}`);
    } else {
      const result = await response.json();
      console.log('Successfully sent WhatsApp message to', phoneNumber, 'Result:', result);
    }
  } catch (error) {
    console.error('Error calling SatuConnect WhatsApp service:', error);
    // Rethrow or handle error as needed
  }
}
