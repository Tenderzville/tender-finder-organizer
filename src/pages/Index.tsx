import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { TenderFilters } from "@/components/TenderFilters";
import { TenderList } from "@/components/tenders/TenderList";
import { TenderHeader } from "@/components/tenders/TenderHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const Index = () => {
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    location: "",
    valueRange: "",
    deadline: "",
  });

  const { data: tenders = [], isLoading } = useQuery({
    queryKey: ["tenders", filters],
    queryFn: async () => {
      console.log("Fetching tenders with filters:", filters);
      
      let query = supabase
        .from("tenders")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      if (filters.deadline) {
        const now = new Date();
        let endDate;
        
        switch (filters.deadline) {
          case "today":
            endDate = new Date(now.setHours(23, 59, 59, 999));
            query = query.lte("deadline", endDate.toISOString());
            break;
          case "this-week":
            endDate = new Date(now.setDate(now.getDate() + 7));
            query = query.lte("deadline", endDate.toISOString());
            break;
          case "this-month":
            endDate = new Date(now.setMonth(now.getMonth() + 1));
            query = query.lte("deadline", endDate.toISOString());
            break;
          case "next-month":
            const startDate = new Date(now.setMonth(now.getMonth() + 1));
            endDate = new Date(now.setMonth(now.getMonth() + 2));
            query = query
              .gte("deadline", startDate.toISOString())
              .lte("deadline", endDate.toISOString());
            break;
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching tenders:", error);
        throw error;
      }

      return data.map(tender => ({
        id: tender.id,
        title: tender.title,
        organization: tender.contact_info || "Not specified",
        deadline: format(new Date(tender.deadline), "PPP"),
        category: tender.category,
        value: tender.fees || "Contact for pricing",
        location: tender.location || "International",
        description: tender.description,
      }));
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <TenderHeader />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <TenderFilters onFilterChange={setFilters} />
            </div>
            
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="text-center py-8">Loading tenders...</div>
              ) : (
                <TenderList tenders={tenders} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;