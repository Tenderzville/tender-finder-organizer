
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";
import { corsHeaders } from "../_shared/cors.ts";
import { formatForTwitter, formatForTelegram, postToTwitter, sendTelegramMessage } from "./social.ts";

// Get secrets from environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

// Twitter credentials
const twitterApiKey = Deno.env.get("TWITTER_API_KEY") as string;
const twitterApiSecret = Deno.env.get("TWITTER_API_SECRET") as string;
const twitterAccessToken = Deno.env.get("TWITTER_ACCESS_TOKEN") as string;
const twitterAccessTokenSecret = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET") as string;

// Telegram credentials
const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN") as string;
const telegramChannelId = Deno.env.get("TELEGRAM_CHANNEL_ID") as string;

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Creates a proper response with CORS headers if necessary
function createResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status,
    },
  );
}

// Main handler function
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // For cron invocations, check for unposted tenders
    // Get the latest tenders that haven't been posted to social media
    const { data: unpostedTenders, error: tenderError } = await supabase
      .from("tenders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (tenderError) {
      console.error("Error fetching unposted tenders:", tenderError);
      return createResponse({ success: false, error: tenderError.message }, 500);
    }

    if (!unpostedTenders || unpostedTenders.length === 0) {
      console.log("No new tenders to post to social media");
      return createResponse({ success: true, message: "No new tenders to post" });
    }

    console.log(`Found ${unpostedTenders.length} tenders to post`);

    // Process each tender and post to social media
    const results = [];
    for (const tender of unpostedTenders) {
      try {
        // Check if this tender has already been posted to social media
        const { data: existingPosts, error: postCheckError } = await supabase
          .from("social_media_posts")
          .select("*")
          .eq("tender_id", tender.id);

        if (postCheckError) {
          console.error("Error checking existing posts:", postCheckError);
          continue;
        }

        // If already posted, skip this tender
        if (existingPosts && existingPosts.length > 0) {
          console.log(`Tender ${tender.id} already posted to social media`);
          continue;
        }

        // Format messages for each platform
        const twitterMessage = formatForTwitter(tender);
        const telegramMessage = formatForTelegram(tender);

        // Post to Twitter
        let twitterResult = null;
        try {
          twitterResult = await postToTwitter(
            twitterMessage,
            twitterApiKey,
            twitterApiSecret,
            twitterAccessToken,
            twitterAccessTokenSecret
          );
          console.log("Posted to Twitter:", twitterResult);
        } catch (twitterError) {
          console.error("Error posting to Twitter:", twitterError);
          twitterResult = { error: twitterError.message };
        }

        // Send to Telegram
        let telegramResult = null;
        try {
          telegramResult = await sendTelegramMessage(
            telegramMessage,
            telegramBotToken,
            telegramChannelId
          );
          console.log("Sent to Telegram:", telegramResult);
        } catch (telegramError) {
          console.error("Error sending to Telegram:", telegramError);
          telegramResult = { error: telegramError.message };
        }

        // Record that we've posted this tender
        const { error: recordError } = await supabase
          .from("social_media_posts")
          .insert({
            tender_id: tender.id,
            twitter_posted: twitterResult && !twitterResult.error,
            telegram_posted: telegramResult && !telegramResult.error,
            twitter_response: twitterResult,
            telegram_response: telegramResult
          });

        if (recordError) {
          console.error("Error recording social media post:", recordError);
        }

        results.push({
          tender_id: tender.id,
          twitter: twitterResult,
          telegram: telegramResult
        });
      } catch (tenderError) {
        console.error(`Error processing tender ${tender.id}:`, tenderError);
        results.push({
          tender_id: tender.id,
          error: tenderError.message
        });
      }
    }

    return createResponse({ 
      success: true, 
      message: `Processed ${results.length} tenders`, 
      results 
    });
  } catch (error) {
    console.error("Error in send-social-media function:", error);
    return createResponse({ success: false, error: error.message }, 500);
  }
});
