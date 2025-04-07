
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tender } from "@/types/tender";

export function useDashboardTenders() {
  const { toast } = useToast();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [isLoadingTenders, setIsLoadingTenders] = useState(false);
  const [errorTenders, setErrorTenders] = useState<Error | null>(null);

  const fetchTenders = async () => {
    setIsLoadingTenders(true);
    setErrorTenders(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for demonstration - with numeric IDs
      const mockTenders: Tender[] = [
        {
          id: 1,
          title: "IT Infrastructure Upgrade",
          description: "Seeking vendors for upgrading government IT infrastructure",
          procuring_entity: "Ministry of ICT",
          tender_no: "ICT-2023-001",
          category: "IT & Telecommunications",
          deadline: new Date().toISOString(),
          location: "Nairobi",
          tender_url: "#",
          points_required: 100
        },
        {
          id: 2,
          title: "Women Entrepreneurship Support Program",
          description: "Contracts for training and mentoring women entrepreneurs",
          procuring_entity: "Ministry of Gender",
          tender_no: "MGS-2023-002",
          category: "Women Opportunities",
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          location: "Nationwide",
          tender_url: "#",
          points_required: 50
        },
        {
          id: 3,
          title: "Rural School Construction",
          description: "Construction of primary schools in rural counties",
          procuring_entity: "Ministry of Education",
          tender_no: "EDU-2023-045",
          category: "Construction",
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          location: "Multiple Counties",
          tender_url: "#",
          points_required: 200
        }
      ];
      
      setTenders(mockTenders);
      
    } catch (error) {
      console.error("Error fetching tenders:", error);
      setErrorTenders(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsLoadingTenders(false);
    }
  };
  
  useEffect(() => {
    fetchTenders();
  }, []);

  return {
    tenders,
    isLoadingTenders,
    errorTenders,
    fetchTenders
  };
}
