import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const googleSheetUrls = [
  "https://docs.google.com/spreadsheets/d/1X6li714ElTTiKd_jwo6Kt1vpjIalwxmuwUO-Kzg38I8/export?format=csv",
  "https://docs.google.com/spreadsheets/d/1j7gokfil3TPBzZ_WrpCG2N_bP6DMeFtV_4HJgQkPQ0Q/export?format=csv"
];

// Helper to fetch CSV data from Google Sheets URL
async function fetchSheetCsv(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet CSV from ${url}: ${response.statusText}`);
  }
  return await response.text();
}

// Helper to parse CSV string into array of objects
function parseCsv(csv: string): Record<string, string>[] {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map(line => {
    const values = line.split(",");
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header.trim()] = values[i]?.trim() || "";
    });
    return obj;
  });
}

serve(async (req) => {
  try {
    let allTenders: Record<string, string>[] = [];

    for (const url of googleSheetUrls) {
      const csv = await fetchSheetCsv(url);
      const tenders = parseCsv(csv);
      allTenders = allTenders.concat(tenders);
    }

    // Map CSV data to Supabase tender table columns
    const tendersToUpsert = allTenders.map(t => ({
      title: t["title"] || t["Title"] || "",
      description: t["description"] || t["Description"] || "",
      procuring_entity: t["procuring_entity"] || t["Procuring Entity"] || "",
      tender_no: t["tender_no"] || t["Tender No"] || "",
      category: t["category"] || t["Category"] || "",
      deadline: t["deadline"] || t["Deadline"] || null,
      location: t["location"] || t["Location"] || "",
      tender_url: t["tender_url"] || t["Tender URL"] || "",
      points_required: t["points_required"] ? parseInt(t["points_required"]) : null,
      affirmative_action: t["affirmative_action"] || null
    }));

    // Upsert tenders into Supabase
    const { error } = await supabase
      .from("tenders")
      .upsert(tendersToUpsert, { onConflict: "tender_no" });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: "Tenders synced successfully", count: tendersToUpsert.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
