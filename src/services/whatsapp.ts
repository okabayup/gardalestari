
'use server';

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
    
    if (response.ok) {
        const responseBody = await response.json();
        console.log('SatuConnect API Response (single):', JSON.stringify(responseBody, null, 2));

        // Handle inconsistent API behavior where success is reported as an error message
        if (responseBody.status === true || responseBody.message === 'Message sent successfully') {
            console.log('Successfully sent WhatsApp message to', phoneNumber);
            return { success: true, data: responseBody.data };
        } else {
            const errorMessage = responseBody.message || `API responded with status ${response.status}`;
            console.error('SatuConnect API Error:', errorMessage);
            return { success: false, error: errorMessage, data: responseBody };
        }
    } else {
        const errorText = await response.text();
        console.error(`SatuConnect API Error: Status ${response.status}`, errorText);
        throw new Error(errorText || `API responded with status ${response.status}`);
    }

  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred during API call.';
    console.error('Error calling SatuConnect WhatsApp service:', errorMessage);
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
    console.error('SatuConnect Bulk Error:', errorMsg);
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

    const responseBody = await response.json();
    console.log('SatuConnect API Response (bulk):', JSON.stringify(responseBody, null, 2));

    if (responseBody.status === true) {
      console.log(`Successfully sent bulk WhatsApp message to ${responseBody.data?.sentCount} recipients.`);
      return { success: true, data: responseBody.data };
    } else {
      const errorMessage = responseBody.message || `API responded with status ${response.status}`;
      console.error('SatuConnect Bulk API Error:', errorMessage, responseBody.partialSuccess || '');
      return { success: false, error: errorMessage, data: responseBody };
    }

  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred during bulk API call.';
    console.error('Error calling SatuConnect bulk WhatsApp service:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
