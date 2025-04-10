
// Follow Deno's URL imports pattern for Edge Functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import { corsHeaders } from "../_shared/cors.ts";
import { format, addDays } from "https://esm.sh/date-fns@2.30.0";
import { processJob, processNextJob } from "./job-processor.ts";
import { scrapeTenders } from "./scraper.ts";
import type { Tender } from "./types.ts";

// Create a single supabase client for interacting with your database
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Get API Layer key from environment variables
const apiLayerKey = Deno.env.get("API_LAYER_KEY") || "";

// Function to use API Layer for scraping
async function scrapeWithApiLayer(url: string) {
  if (!apiLayerKey) {
    console.error("API Layer key not configured");
    throw new Error("API Layer key not configured");
  }
  
  try {
    console.log(`Scraping ${url} with API Layer`);
    
    const response = await fetch("https://api.apilayer.com/adv_scraper/extract", {
      method: "POST",
      headers: {
        "apikey": apiLayerKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: url,
        fallback: true,
        simplify: true
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Layer error: ${response.status} ${errorText}`);
      throw new Error(`API Layer returned error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("API Layer response:", JSON.stringify(data).slice(0, 500) + "...");
    
    return data;
  } catch (error) {
    console.error("Error using API Layer:", error);
    throw error;
  }
}

// Convert API Layer response to tender objects
async function processTenderData(data: any): Promise<Tender[]> {
  const tenders: Tender[] = [];
  
  try {
    // Process the API Layer response to extract tender information
    // If there are tables in the response, they might contain tender listings
    if (data.tables && data.tables.length > 0) {
      for (const table of data.tables) {
        if (table.rows && table.rows.length > 0) {
          // Try to identify the tender information from table headers
          const headerIndices: Record<string, number> = {};
          
          if (table.header && table.header.length > 0) {
            table.header.forEach((header: string, index: number) => {
              const headerLower = header.toLowerCase();
              
              if (headerLower.includes('title') || headerLower.includes('name') || headerLower.includes('tender')) {
                headerIndices.title = index;
              } else if (headerLower.includes('deadline') || headerLower.includes('closing') || headerLower.includes('date')) {
                headerIndices.deadline = index;
              } else if (headerLower.includes('ministry') || headerLower.includes('department') || headerLower.includes('entity')) {
                headerIndices.entity = index;
              } else if (headerLower.includes('description') || headerLower.includes('details')) {
                headerIndices.description = index;
              }
            });
          }
          
          // Process each row in the table
          for (const row of table.rows) {
            let title = '';
            let description = '';
            let deadline = new Date();
            let contact = '';
            
            // Extract information based on identified headers
            if (headerIndices.title !== undefined) {
              title = row[headerIndices.title] || '';
            } else if (row.length > 0) {
              // Fallback: use first column as title if no header was identified
              title = row[0] || '';
            }
            
            if (headerIndices.description !== undefined) {
              description = row[headerIndices.description] || '';
            }
            
            if (headerIndices.deadline !== undefined) {
              const deadlineText = row[headerIndices.deadline] || '';
              try {
                // Attempt to parse deadline text
                const dateMatch = deadlineText.match(/\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/);
                if (dateMatch) {
                  deadline = new Date(dateMatch[0]);
                  if (isNaN(deadline.getTime())) {
                    deadline = addDays(new Date(), 14); // Default to 14 days from now
                  }
                } else {
                  deadline = addDays(new Date(), 14);
                }
              } catch (e) {
                deadline = addDays(new Date(), 14);
              }
            } else {
              deadline = addDays(new Date(), 14);
            }
            
            if (headerIndices.entity !== undefined) {
              contact = row[headerIndices.entity] || '';
            }
            
            // Only add if we have a valid title
            if (title && title.trim() !== '') {
              tenders.push({
                title,
                description: description || `Tender: ${title}`,
                deadline: deadline.toISOString(),
                contact_info: contact || "See tender document for contact details",
                category: "Government",
                location: "Kenya",
                tender_url: data.url || "",
                requirements: "See tender document for detailed requirements",
                points_required: 0
              });
            }
          }
        }
      }
    }
    
    // If no tenders were extracted from tables, try to extract from the main content
    if (tenders.length === 0 && data.text) {
      // Look for sections that might contain tender listings
      const sections = data.text.split(/\n\n+/);
      
      for (const section of sections) {
        // Look for text that might be a tender title
        if (section.match(/tender|bid|procurement|contract/i) && section.length < 200) {
          tenders.push({
            title: section.trim(),
            description: "Extracted from website content",
            deadline: addDays(new Date(), 14).toISOString(),
            contact_info: "See tender document for contact details",
            category: "Government",
            location: "Kenya",
            tender_url: data.url || "",
            requirements: "See tender document for detailed requirements",
            points_required: 0
          });
        }
      }
    }
    
  } catch (error) {
    console.error("Error processing API Layer data:", error);
  }
  
  return tenders;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    console.log("Starting scrape-tenders function");
    
    // Parse request to get force parameter and job ID if provided
    let force = false;
    let specificJobId = null;
    let ping = false;
    let useApiLayer = false;
    
    if (req.method === "POST") {
      const body = await req.json();
      force = body?.force === true;
      specificJobId = body?.jobId || null;
      ping = body?.ping === true;
      useApiLayer = body?.useApiLayer === true;
      console.log(`Force parameter: ${force}, Job ID: ${specificJobId}, Ping: ${ping}, Use API Layer: ${useApiLayer}`);
      
      // If this is just a ping to check if the function is available, return success
      if (ping) {
        return new Response(
          JSON.stringify({
            message: "Scraper function is available",
            success: true,
            api_layer_key_configured: !!apiLayerKey
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }
    
    // Check if we've already scraped recently (within last 30 minutes)
    // Skip this check if force is true
    if (!force && !specificJobId) {
      const { data: lastScrape } = await supabase
        .from("scraping_logs")
        .select("created_at, status")
        .eq("source", "mygov.go.ke")
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (lastScrape && lastScrape.length > 0) {
        const lastScrapeTime = new Date(lastScrape[0].created_at);
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        
        if (lastScrapeTime > thirtyMinutesAgo && lastScrape[0].status === "success") {
          console.log("Skipping scrape - already scraped within last 30 minutes");
          return new Response(
            JSON.stringify({
              message: "Skipping scrape - already scraped within last 30 minutes",
              last_scrape: lastScrape[0].created_at,
              success: true
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        }
      }
    }
    
    // Create a log entry for this scrape
    const { data: logEntry, error: logError } = await supabase
      .from("scraping_logs")
      .insert({
        source: useApiLayer ? "api_layer" : "job_queue",
        status: "in_progress",
        records_found: 0
      })
      .select()
      .single();
    
    if (logError) {
      console.error("Error creating log entry:", logError);
      throw new Error("Failed to create scraping log entry");
    }
    
    const logId = logEntry.id;
    console.log(`Created scraping log with ID ${logId}`);
    
    // If API Layer is requested and the key is available, use it directly
    if (useApiLayer && apiLayerKey) {
      console.log("Using API Layer for scraping");
      
      const backgroundProcessing = async () => {
        try {
          // Define URLs to scrape
          const urlsToScrape = [
            "https://www.mygov.go.ke/all-tenders",
            "https://tenders.go.ke/website/tenders/index"
          ];
          
          let totalTendersFound = 0;
          
          for (const url of urlsToScrape) {
            try {
              console.log(`Scraping ${url} with API Layer`);
              const scrapedData = await scrapeWithApiLayer(url);
              
              if (scrapedData) {
                // Process the API Layer response into tender objects
                const tenders = await processTenderData(scrapedData);
                totalTendersFound += tenders.length;
                
                console.log(`Extracted ${tenders.length} tenders from ${url}`);
                
                // Save the tenders to the database
                if (tenders.length > 0) {
                  for (const tender of tenders) {
                    try {
                      const { data: existingTender } = await supabase
                        .from("tenders")
                        .select("id")
                        .eq("title", tender.title)
                        .limit(1);
                      
                      if (!existingTender || existingTender.length === 0) {
                        // Insert new tender
                        const { error: insertError } = await supabase
                          .from("tenders")
                          .insert([tender]);
                          
                        if (insertError) {
                          console.error("Error inserting tender:", insertError);
                        }
                      }
                    } catch (error) {
                      console.error("Error checking/inserting tender:", error);
                    }
                  }
                }
              }
            } catch (error) {
              console.error(`Error scraping ${url}:`, error);
            }
          }
          
          // Update the log with success
          await supabase
            .from("scraping_logs")
            .update({
              status: "success",
              records_found: totalTendersFound,
              records_inserted: totalTendersFound
            })
            .eq("id", logId);
            
          console.log(`API Layer scraping complete. Found ${totalTendersFound} tenders.`);
        } catch (error) {
          console.error("Error in API Layer background scraping:", error);
          
          // Update the log with error
          await supabase
            .from("scraping_logs")
            .update({
              status: "error",
              error_message: error.message || "Unknown error in API Layer scraping"
            })
            .eq("id", logId);
        }
      };
      
      // Use EdgeRuntime.waitUntil for background processing
      console.log("Starting background API Layer scraping");
      EdgeRuntime.waitUntil(backgroundProcessing());
      
      return new Response(
        JSON.stringify({
          message: "API Layer scraping started in background",
          log_id: logId,
          success: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    // Initialize jobs if needed
    if (force || !specificJobId) {
      await supabase.rpc('initialize_scraping_jobs');
      console.log("Initialized scraping jobs");
    }
    
    // If a specific job ID was provided, process that job
    if (specificJobId) {
      // Start processing in the background
      const backgroundProcessing = async () => {
        try {
          // Get the job details
          const { data: jobData } = await supabase
            .from('scraping_jobs')
            .select('*')
            .eq('id', specificJobId)
            .single();
          
          if (!jobData) {
            console.error(`Job with ID ${specificJobId} not found`);
            return;
          }
          
          // Process the specific job
          console.log(`Processing specific job: ${jobData.source} - ${jobData.url}`);
          
          // Try to use API Layer if key is available
          if (apiLayerKey && jobData.url) {
            try {
              const scrapedData = await scrapeWithApiLayer(jobData.url);
              console.log("Successfully scraped with API Layer");
              
              // Process and save the scraped data
              const tenders = await processTenderData(scrapedData);
              
              if (tenders.length > 0) {
                for (const tender of tenders) {
                  try {
                    const { data: existingTender } = await supabase
                      .from("tenders")
                      .select("id")
                      .eq("title", tender.title)
                      .limit(1);
                    
                    if (!existingTender || existingTender.length === 0) {
                      // Insert new tender
                      const { error: insertError } = await supabase
                        .from("tenders")
                        .insert([tender]);
                        
                      if (insertError) {
                        console.error("Error inserting tender:", insertError);
                      }
                    }
                  } catch (error) {
                    console.error("Error checking/inserting tender:", error);
                  }
                }
              }
              
              // Update job status
              await supabase
                .from("scraping_jobs")
                .update({
                  status: "completed",
                  completed_at: new Date().toISOString()
                })
                .eq("id", specificJobId);
              
              // Update the log with success
              await supabase
                .from("scraping_logs")
                .update({
                  status: "success",
                  records_found: tenders.length,
                  records_inserted: tenders.length
                })
                .eq("id", logId);
                
            } catch (apiError) {
              console.error("API Layer scraping failed, falling back to default processor:", apiError);
              await processJob(supabase, jobData);
            }
          } else {
            // Fall back to default processor
            await processJob(supabase, jobData);
          }
        } catch (error) {
          console.error("Error in background job processing:", error);
          
          // Update the log with error
          await supabase
            .from("scraping_logs")
            .update({
              status: "error",
              error_message: error.message || "Unknown error"
            })
            .eq("id", logId);
        }
      };
      
      // Use EdgeRuntime.waitUntil for background processing
      console.log("Starting background processing for specific job");
      EdgeRuntime.waitUntil(backgroundProcessing());
      
      return new Response(
        JSON.stringify({
          message: `Processing job ${specificJobId} started in background`,
          log_id: logId,
          success: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // Process the next job in the queue
      // Start processing in the background
      const backgroundProcessing = async () => {
        try {
          await processNextJob(supabase);
          
          // Update the log with success
          await supabase
            .from("scraping_logs")
            .update({
              status: "success",
              records_found: 1
            })
            .eq("id", logId);
          
        } catch (error) {
          console.error("Error in background job processing:", error);
          
          // Update the log with error
          await supabase
            .from("scraping_logs")
            .update({
              status: "error",
              error_message: error.message || "Unknown error"
            })
            .eq("id", logId);
        }
      };
      
      // Use EdgeRuntime.waitUntil for background processing
      console.log("Starting background processing for next job");
      EdgeRuntime.waitUntil(backgroundProcessing());
      
      return new Response(
        JSON.stringify({
          message: "Job queue processing started in background",
          log_id: logId,
          success: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error("Error in scrape-tenders function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred during the scrape operation",
        success: false
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Add shutdown handler for graceful termination
addEventListener("beforeunload", (evt) => {
  console.log("Function shutting down:", evt.detail?.reason);
});
