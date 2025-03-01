
// supabase/functions/send-social-media/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to validate Twitter API environment variables
function validateTwitterEnvVars() {
  const API_KEY = Deno.env.get("TWITTER_API_KEY")?.trim();
  const API_SECRET = Deno.env.get("TWITTER_API_SECRET")?.trim();
  const ACCESS_TOKEN = Deno.env.get("TWITTER_ACCESS_TOKEN")?.trim();
  const ACCESS_TOKEN_SECRET = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")?.trim();

  if (!API_KEY || !API_SECRET || !ACCESS_TOKEN || !ACCESS_TOKEN_SECRET) {
    console.error("Missing Twitter API environment variables");
    return false;
  }
  return true;
}

// Helper function to validate Telegram API environment variables
function validateTelegramEnvVars() {
  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")?.trim();
  const TELEGRAM_CHANNEL_ID = Deno.env.get("TELEGRAM_CHANNEL_ID")?.trim();

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.error("Missing Telegram API environment variables");
    return false;
  }
  return true;
}

// Function to generate Twitter OAuth signature
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(
    url
  )}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  
  const signingKey = `${encodeURIComponent(
    consumerSecret
  )}&${encodeURIComponent(tokenSecret)}`;
  
  const hmacSha1 = createHmac("sha1", signingKey);
  const signature = hmacSha1.update(signatureBaseString).digest("base64");

  console.log("Generated Twitter signature for:", url);
  return signature;
}

// Function to generate Twitter OAuth header
function generateOAuthHeader(method: string, url: string): string {
  const API_KEY = Deno.env.get("TWITTER_API_KEY")!.trim();
  const API_SECRET = Deno.env.get("TWITTER_API_SECRET")!.trim();
  const ACCESS_TOKEN = Deno.env.get("TWITTER_ACCESS_TOKEN")!.trim();
  const ACCESS_TOKEN_SECRET = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")!.trim();

  const oauthParams = {
    oauth_consumer_key: API_KEY,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ACCESS_TOKEN,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    API_SECRET,
    ACCESS_TOKEN_SECRET
  );

  const signedOAuthParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  return (
    "OAuth " +
    Object.entries(signedOAuthParams)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ")
  );
}

// Function to post a tweet
async function sendTweet(tweetText: string): Promise<any> {
  if (!validateTwitterEnvVars()) {
    throw new Error("Twitter API configuration is incomplete");
  }

  const url = "https://api.twitter.com/2/tweets";
  const method = "POST";
  const params = { text: tweetText };

  const oauthHeader = generateOAuthHeader(method, url);
  console.log("Sending tweet with text length:", tweetText.length);

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        Authorization: oauthHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`Twitter API error: ${response.status}`, responseText);
      throw new Error(
        `Twitter API error! status: ${response.status}, body: ${responseText}`
      );
    }

    console.log("Tweet sent successfully");
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error sending tweet:", error);
    throw error;
  }
}

// Function to send a message to Telegram channel
async function sendTelegramMessage(message: string): Promise<any> {
  if (!validateTelegramEnvVars()) {
    throw new Error("Telegram API configuration is incomplete");
  }

  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!.trim();
  const TELEGRAM_CHANNEL_ID = Deno.env.get("TELEGRAM_CHANNEL_ID")!.trim();
  
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHANNEL_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`Telegram API error: ${response.status}`, responseText);
      throw new Error(
        `Telegram API error! status: ${response.status}, body: ${responseText}`
      );
    }

    console.log("Telegram message sent successfully");
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    throw error;
  }
}

// Function to format tender for Twitter
function formatTweetText(tender: any): string {
  return `📢 ${tender.title}
🏛️ ${tender.organization || 'Unknown Organization'}
📅 Deadline: ${tender.deadline || 'Not specified'}
📍 ${tender.location || 'Not specified'}
🔗 Check it out in the Telegram channel: https://t.me/supplychain_coded
By:SupplyChain_Ke
#TenderAlert #KenyaTenders ${tender.category ? `#${tender.category.replace(/\s+/g, '')}Tenders` : ''} ${tender.location ? `#${tender.location.replace(/\s+/g, '')}` : ''}`;
}

// Function to format tender for Telegram
function formatTelegramText(tender: any): string {
  return `🚨 *NEW TENDER ALERT* 🚨
*Title:* ${tender.title}
*Ref No:* ${tender.id || 'Not specified'}
*Issuer:* ${tender.organization || 'Unknown Organization'}
*Deadline:* ${tender.deadline || 'Not specified'}
*Sector:* ${tender.category || 'Not specified'}
*Eligibility:* ${tender.requirements || 'Not specified'}
Check it Out: [https://t.me/supplychain_coded]
By:SupplyChain_Ke`;
}

// Main function to process a single tender
async function processTender(tender: any): Promise<{twitter: boolean, telegram: boolean}> {
  console.log("Processing tender for social media:", tender.title);
  const results = {twitter: false, telegram: false};
  
  try {
    // Post to Twitter
    const tweetText = formatTweetText(tender);
    await sendTweet(tweetText);
    results.twitter = true;
  } catch (error) {
    console.error("Twitter posting failed:", error);
  }
  
  try {
    // Send to Telegram
    const telegramText = formatTelegramText(tender);
    await sendTelegramMessage(telegramText);
    results.telegram = true;
  } catch (error) {
    console.error("Telegram posting failed:", error);
  }
  
  return results;
}

// Create Supabase client
function createSupabaseClient(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: { Authorization: req.headers.get('Authorization')! },
    },
  });
}

// Log social media posting results
async function logSocialMediaPosting(supabase: any, tenderId: number, results: {twitter: boolean, telegram: boolean}) {
  try {
    const { error } = await supabase
      .from('social_media_posts')
      .insert({
        tender_id: tenderId,
        twitter_posted: results.twitter,
        telegram_posted: results.telegram,
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error("Error logging social media post:", error);
    }
  } catch (error) {
    console.error("Failed to log social media posting:", error);
  }
}

// Main serve function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Get request body
    const { tenderId } = await req.json();
    
    if (!tenderId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing tender ID" 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    // Create Supabase client
    const supabase = createSupabaseClient(req);
    
    // Get tender details
    const { data: tender, error } = await supabase
      .from('tenders')
      .select('*')
      .eq('id', tenderId)
      .single();
    
    if (error || !tender) {
      console.error("Error fetching tender:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error?.message || "Tender not found" 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }
    
    // Check if already posted
    const { data: existingPosts } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('tender_id', tenderId);
    
    if (existingPosts && existingPosts.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Tender already posted to social media" 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409 
        }
      );
    }
    
    // Process tender
    const results = await processTender(tender);
    
    // Log results
    await logSocialMediaPosting(supabase, tenderId, results);
    
    return new Response(
      JSON.stringify({
        success: true,
        tender: tender.title,
        twitter: results.twitter,
        telegram: results.telegram
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-social-media function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
