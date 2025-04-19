import { SupabaseClient } from "@supabase/supabase-js";
import { Tender } from "./types.ts";
import { scrapeMyGov, scrapeTendersGo, scrapePrivateTenders } from "./scraper.ts";

interface JobData {
  source: string;
  url?: string;
}

export async function processJob(supabase: SupabaseClient, jobData: JobData) {
  console.log(`Processing job for source: ${jobData.source}`);
  let tenders: Tender[] = [];
  
  try {
    // Create a log entry for this job
    const { data: logEntry, error: logError } = await supabase
      .from("scraping_logs")
      .insert({
        source: jobData.source,
        status: "in_progress",
        records_found: 0,
      })
      .select()
      .single();

    if (logError) {
      throw new Error(`Failed to create log entry: ${logError.message}`);
    }

    const logId = logEntry.id;

    // Perform the scraping based on the source
    switch (jobData.source) {
      case "mygov":
        tenders = await scrapeMyGov();
        break;
      case "tenders.go.ke":
        tenders = await scrapeTendersGo();
        break;
      case "private":
        tenders = await scrapePrivateTenders();
        break;
      default:
        throw new Error(`Unknown source: ${jobData.source}`);
    }

    console.log(`Found ${tenders.length} tenders from ${jobData.source}`);

    // Process each tender
    let insertedCount = 0;
    for (const tender of tenders) {
      try {
        // Check for existing tender to avoid duplicates
        const { data: existingTender, error: checkError } = await supabase
          .from("tenders")
          .select("id, title")
          .eq("title", tender.title)
          .limit(1);

        if (checkError) {
          console.error("Error checking for existing tender:", checkError);
          continue;
        }

        if (!existingTender || existingTender.length === 0) {
          // Prepare tender data with required fields
          const tenderToInsert = {
            ...tender,
            created_at: new Date().toISOString(),
            category: tender.category || "General",
            location: tender.location || "Kenya",
            requirements: tender.requirements || "See tender document for requirements",
            last_scrape_attempt: new Date().toISOString()
          };

          // Insert the tender
          const { data: insertedTender, error: insertError } = await supabase
            .from("tenders")
            .insert([tenderToInsert])
            .select()
            .single();

          if (insertError) {
            console.error("Error inserting tender:", {
              error: insertError,
              tender: tender.title,
              details: insertError.details
            });
          } else {
            console.log("Successfully inserted tender:", {
              id: insertedTender.id,
              title: insertedTender.title
            });
            insertedCount++;
          }
        } else {
          // Update last scrape attempt for existing tender
          await supabase
            .from("tenders")
            .update({ last_scrape_attempt: new Date().toISOString() })
            .eq("id", existingTender[0].id);
            
          console.log("Updated existing tender:", {
            id: existingTender[0].id,
            title: tender.title
          });
        }
      } catch (error) {
        console.error("Error processing tender:", error);
      }
    }

    // Update the log with final results
    await supabase
      .from("scraping_logs")
      .update({
        status: "success",
        records_found: tenders.length,
        records_inserted: insertedCount,
        completed_at: new Date().toISOString()
      })
      .eq("id", logId);

    return { success: true, tendersFound: tenders.length, tendersInserted: insertedCount };
  } catch (error) {
    console.error(`Error in job processor for ${jobData.source}:`, error);
    
    // Update log with error status
    if (logEntry?.id) {
      await supabase
        .from("scraping_logs")
        .update({
          status: "error",
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq("id", logEntry.id);
    }
    
    throw error;
  }
}

export async function processNextJob(supabase: SupabaseClient): Promise<boolean> {
  try {
    // Get the next pending job
    const { data: nextJob, error: jobError } = await supabase
      .from("scraping_jobs")
      .select("*")
      .eq("status", "pending")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (jobError || !nextJob) {
      console.log("No pending jobs found");
      return false;
    }

    // Mark job as in progress
    await supabase
      .from("scraping_jobs")
      .update({
        status: "in_progress",
        started_at: new Date().toISOString()
      })
      .eq("id", nextJob.id);

    // Process the job
    await processJob(supabase, {
      source: nextJob.source,
      url: nextJob.url
    });

    // Mark job as completed
    await supabase
      .from("scraping_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString()
      })
      .eq("id", nextJob.id);

    return true;
  } catch (error) {
    console.error("Error processing next job:", error);
    return false;
  }
}