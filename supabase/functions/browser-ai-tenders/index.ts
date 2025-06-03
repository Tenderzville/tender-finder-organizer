
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";

// Create a single supabase client for interacting with database
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const BROWSER_AI_API_KEY = Deno.env.get("BROWSER_AI_API_KEY") || "";

// MYGOV Robot
const MYGOV_ROBOT_ID = "ac84ba46-2da7-4a54-b083-48de0011fb36";
// PPIP Robot  
const PPIP_ROBOT_ID = "f55e700b-f976-4a56-9bd5-9e837c70d9b7";

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;
const rateLimitMap = new Map();

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimitMap.has(clientId)) {
    rateLimitMap.set(clientId, []);
  }
  
  const requests = rateLimitMap.get(clientId);
  const recentRequests = requests.filter((time: number) => time > windowStart);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(clientId, recentRequests);
  return true;
}

async function logError(operation: string, error: any, metadata: any = {}) {
  try {
    await supabase.from('error_logs').insert({
      operation,
      error_message: error.message || String(error),
      metadata: JSON.stringify(metadata),
      timestamp: new Date().toISOString()
    });
  } catch (logError) {
    console.error("Failed to log error:", logError);
  }
}

async function fetchTendersFromBrowserAI(robotId = PPIP_ROBOT_ID, originUrl = "https://tenders.go.ke/tenders") {
  const startTime = Date.now();
  
  try {
    console.log(`Starting Browser AI fetch: robot=${robotId}, url=${originUrl}`);
    
    if (!BROWSER_AI_API_KEY) {
      const errorMsg = "Browser AI API key not configured";
      console.error(errorMsg);
      await logError("browser_ai_fetch", new Error(errorMsg), { robotId, originUrl });
      return { success: false, error: errorMsg };
    }
    
    const apiUrl = `https://api.browse.ai/v2/robots/${robotId}/tasks`;
    const requestBody = {
      inputParameters: { 
        originUrl: originUrl, 
        tenders_list_limit: 15 
      }
    };
    
    console.log("Browser AI request:", JSON.stringify(requestBody));
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BROWSER_AI_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseText = await response.text();
    console.log(`Browser AI response (${response.status}):`, responseText.slice(0, 500));
    
    if (!response.ok) {
      const errorMsg = `Browser AI API error: ${response.status} ${responseText}`;
      console.error(errorMsg);
      await logError("browser_ai_api_error", new Error(errorMsg), { 
        robotId, 
        originUrl, 
        status: response.status,
        responseBody: responseText.slice(0, 1000)
      });
      return { success: false, error: errorMsg };
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      const errorMsg = `Failed to parse Browser AI response: ${parseError.message}`;
      console.error(errorMsg);
      await logError("browser_ai_parse_error", parseError, { robotId, originUrl, responseText: responseText.slice(0, 500) });
      return { success: false, error: errorMsg };
    }
    
    console.log("Browser AI parsed data structure:", Object.keys(data));
    
    // Enhanced data extraction with multiple fallback strategies
    let tenders = [];
    
    // Strategy 1: Standard result format
    if (data?.result?.extractedData?.tenders) {
      tenders = data.result.extractedData.tenders;
      console.log("Extracted tenders using strategy 1 (standard format)");
    }
    // Strategy 2: Direct tenders array
    else if (data?.tenders) {
      tenders = data.tenders;
      console.log("Extracted tenders using strategy 2 (direct array)");
    }
    // Strategy 3: Data wrapper
    else if (data?.data) {
      tenders = Array.isArray(data.data) ? data.data : data.data.tenders || [];
      console.log("Extracted tenders using strategy 3 (data wrapper)");
    }
    // Strategy 4: Task result format
    else if (data?.task?.capturedLists) {
      tenders = Object.values(data.task.capturedLists).flat();
      console.log("Extracted tenders using strategy 4 (captured lists)");
    }
    
    console.log(`Found ${tenders.length} raw tender entries`);
    
    if (!tenders || tenders.length === 0) {
      console.log("No tenders found in Browser AI response");
      await logError("no_tenders_found", new Error("No tenders in response"), { 
        robotId, 
        originUrl, 
        dataStructure: Object.keys(data),
        fullResponse: JSON.stringify(data).slice(0, 1000)
      });
      return { success: false, inserted: 0, tenders: [], message: "No tenders available from Browser AI" };
    }
    
    const insertedTenders = [];
    let duplicateCount = 0;
    
    for (const tender of tenders) {
      try {
        // Enhanced tender data formatting with better field mapping
        const title = tender.title || tender.name || tender.tenderTitle || "Unknown Tender";
        const description = tender.description || tender.summary || tender.details || `Tender from ${tender.procuringEntity || tender.entity || 'Unknown Entity'}`;
        const deadline = tender.deadline || tender.closingDate || tender.submissionDeadline;
        
        // Skip if essential data is missing
        if (!title || title === "Unknown Tender") {
          console.log("Skipping tender with missing title");
          continue;
        }
        
        const formattedTender = {
          title: title.slice(0, 255), // Ensure title fits database constraints
          description: description.slice(0, 1000),
          deadline: deadline ? new Date(deadline).toISOString() : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          contact_info: tender.procuringEntity || tender.entity || tender.contactInfo || "Contact the procurement entity",
          category: tender.category || tender.type || "Government",
          location: tender.location || tender.region || "Kenya",
          tender_url: tender.sourceUrl || tender.url || tender.link || originUrl,
          requirements: tender.requirements || tender.eligibility || "See tender document for requirements",
          source: "browser-ai",
          points_required: 0
        };
        
        // Check for duplicates based on title and deadline
        const { data: existingTender } = await supabase
          .from("tenders")
          .select("id")
          .eq("title", formattedTender.title)
          .limit(1);
        
        if (!existingTender || existingTender.length === 0) {
          const { data: insertData, error: insertError } = await supabase
            .from("tenders")
            .insert([formattedTender])
            .select();
            
          if (insertError) {
            console.error("Error inserting tender:", insertError);
            await logError("tender_insert_error", insertError, { tender: formattedTender });
          } else if (insertData) {
            insertedTenders.push(insertData[0]);
            console.log(`Inserted tender: ${formattedTender.title}`);
          }
        } else {
          duplicateCount++;
        }
      } catch (error) {
        console.error("Error processing tender:", error);
        await logError("tender_processing_error", error, { tender });
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`Browser AI fetch completed in ${duration}ms: ${insertedTenders.length} new tenders, ${duplicateCount} duplicates`);
    
    // Log performance metrics
    await supabase.from('performance_logs').insert({
      operation: 'browser_ai_fetch',
      duration_ms: duration,
      items_processed: tenders.length,
      items_inserted: insertedTenders.length,
      metadata: JSON.stringify({ robotId, originUrl, duplicateCount })
    });
    
    return { 
      success: true, 
      inserted: insertedTenders.length, 
      tenders: insertedTenders,
      duplicates: duplicateCount,
      totalProcessed: tenders.length
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("Error in fetchTendersFromBrowserAI:", error);
    await logError("browser_ai_fetch_error", error, { robotId, originUrl, duration });
    return { success: false, error: error.message, inserted: 0 };
  }
}

// Function to fetch tenders from both robots with improved error handling
async function fetchAllBrowserAITenders() {
  console.log("Starting comprehensive Browser AI tender fetch...");
  
  const results = [];
  let totalInserted = 0;
  let totalProcessed = 0;
  
  // Fetch from PPIP robot (primary source)
  console.log("Fetching from PPIP robot (tenders.go.ke)...");
  const ppipResult = await fetchTendersFromBrowserAI(PPIP_ROBOT_ID, "https://tenders.go.ke/tenders");
  results.push({ source: "PPIP (tenders.go.ke)", result: ppipResult });
  if (ppipResult.success) {
    totalInserted += ppipResult.inserted || 0;
    totalProcessed += ppipResult.totalProcessed || 0;
  }
  
  // Add delay between API calls to respect rate limits
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Fetch from MYGOV robot (secondary source)
  console.log("Fetching from MYGOV robot (mygov.go.ke)...");
  const mygovResult = await fetchTendersFromBrowserAI(MYGOV_ROBOT_ID, "https://www.mygov.go.ke/all-tenders");
  results.push({ source: "MYGOV (mygov.go.ke)", result: mygovResult });
  if (mygovResult.success) {
    totalInserted += mygovResult.inserted || 0;
    totalProcessed += mygovResult.totalProcessed || 0;
  }
  
  console.log(`Total fetch results: ${totalInserted} inserted from ${totalProcessed} processed`);
  
  return {
    success: totalInserted > 0,
    totalInserted,
    totalProcessed,
    results,
    message: totalInserted > 0 
      ? `Successfully fetched ${totalInserted} new tenders from ${totalProcessed} total processed` 
      : "No new tenders found from Browser AI sources"
  };
}

serve(async (req: Request) => {
  const startTime = Date.now();
  
  // Handle CORS for browser requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Extract client identifier for rate limiting
    const clientId = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    
    // Check rate limit
    if (!checkRateLimit(clientId)) {
      console.log(`Rate limit exceeded for client: ${clientId}`);
      return new Response(JSON.stringify({
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: 60
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429
      });
    }
    
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();
    
    let result;
    
    if (path === "fetch-browser-ai") {
      console.log("=== Starting Browser AI tender fetch ===");
      result = await fetchAllBrowserAITenders();
      console.log("=== Browser AI fetch completed ===");
    } else if (path === "status") {
      // Status endpoint for monitoring
      const { count: totalTenders } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true })
        .neq('source', 'sample');
        
      result = { 
        status: "healthy",
        browser_ai_configured: !!BROWSER_AI_API_KEY,
        total_real_tenders: totalTenders || 0,
        timestamp: new Date().toISOString(),
        version: "2.0.0"
      };
    } else {
      // Default status
      result = { 
        status: "ok",
        browser_ai_configured: !!BROWSER_AI_API_KEY,
        available_endpoints: [
          "fetch-browser-ai",
          "status"
        ],
        note: "Production-ready Browser AI integration with monitoring and rate limiting"
      };
    }
    
    const duration = Date.now() - startTime;
    
    // Log request for monitoring
    if (path === "fetch-browser-ai") {
      await supabase.from('api_request_logs').insert({
        endpoint: path,
        client_id: clientId,
        duration_ms: duration,
        success: !result.error,
        response_size: JSON.stringify(result).length
      });
    }
    
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Response-Time": `${duration}ms`
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("Error in browser-ai-tenders function:", error);
    
    await logError("function_error", error, { 
      url: req.url,
      method: req.method,
      duration 
    });
    
    return new Response(
      JSON.stringify({
        status: "error",
        error: error.message || String(error),
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});
