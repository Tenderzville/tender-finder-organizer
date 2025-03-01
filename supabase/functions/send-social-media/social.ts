
// Twitter API helper functions
export function formatForTwitter(tender: any): string {
  const deadline = new Date(tender.deadline).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  return `📢 ${tender.title.substring(0, 100)}${tender.title.length > 100 ? '...' : ''}
🏛️ ${tender.issuing_body || 'Unknown Issuer'}
📅 Deadline: ${deadline}
📍 ${tender.location || 'Kenya'}
🔗 Check it out in the Telegram channel: https://t.me/supplychain_coded
By: SupplyChain_Ke
#TenderAlert #KenyaTenders ${tender.sector ? `#${tender.sector.replace(/\s+/g, '')}Tenders` : ''} ${tender.location ? `#${tender.location.replace(/\s+/g, '')}` : ''}`;
}

export function formatForTelegram(tender: any): string {
  const deadline = new Date(tender.deadline).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  return `🚨 *NEW TENDER ALERT* 🚨
*Title:* ${tender.title}
*Ref No:* ${tender.reference_number || 'N/A'}
*Issuer:* ${tender.issuing_body || 'Unknown Issuer'}
*Deadline:* ${deadline}
*Sector:* ${tender.sector || 'General'}
*Eligibility:* ${tender.eligibility_criteria || 'See tender details'}
Check it Out: https://t.me/supplychain_coded
By: SupplyChain_Ke`;
}

// Twitter v1.1 API posting function (using OAuth 1.0a)
export async function postToTwitter(
  message: string,
  apiKey: string,
  apiSecret: string,
  accessToken: string,
  accessTokenSecret: string
): Promise<any> {
  try {
    const oauth = {
      consumer_key: apiKey,
      consumer_secret: apiSecret,
      token: accessToken,
      token_secret: accessTokenSecret,
    };

    const url = "https://api.twitter.com/1.1/statuses/update.json";
    
    // Current timestamp and nonce for OAuth 1.0a
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    
    // Parameters for the request
    const parameters = {
      status: message,
      oauth_consumer_key: oauth.consumer_key,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_token: oauth.token,
      oauth_version: '1.0'
    };
    
    // Create signature base string
    const parameterString = Object.keys(parameters)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`)
      .join('&');
    
    const signatureBaseString = [
      'POST',
      encodeURIComponent(url),
      encodeURIComponent(parameterString)
    ].join('&');
    
    // Create signing key
    const signingKey = `${encodeURIComponent(oauth.consumer_secret)}&${encodeURIComponent(oauth.token_secret)}`;
    
    // Generate signature
    const signature = await createHmacSignature(signingKey, signatureBaseString);
    
    // Create Authorization header
    const authHeader = 'OAuth ' + 
      `oauth_consumer_key="${encodeURIComponent(oauth.consumer_key)}", ` +
      `oauth_nonce="${encodeURIComponent(nonce)}", ` +
      `oauth_signature="${encodeURIComponent(signature)}", ` +
      `oauth_signature_method="HMAC-SHA1", ` +
      `oauth_timestamp="${timestamp}", ` +
      `oauth_token="${encodeURIComponent(oauth.token)}", ` +
      `oauth_version="1.0"`;
    
    // Make the request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `status=${encodeURIComponent(message)}`
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twitter API error: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error posting to Twitter:", error);
    throw error;
  }
}

// Helper function to create HMAC-SHA1 signature
async function createHmacSignature(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    messageData
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// Telegram message sending function
export async function sendTelegramMessage(
  message: string,
  botToken: string,
  channelId: string
): Promise<any> {
  try {
    const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: channelId,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram API error: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    throw error;
  }
}
