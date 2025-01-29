import { Navigation } from "@/components/Navigation";
import { TenderCard } from "@/components/TenderCard";
import { TenderFilters } from "@/components/TenderFilters";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// Mock data - replace with real API data later
const MOCK_TENDERS = [
  {
    id: 1,
    title: "National Infrastructure Development Project",
    organization: "Ministry of Public Works",
    deadline: "2024-05-15",
    category: "Construction",
    value: "2500000",
    location: "Kenya",
  },
  {
    id: 2,
    title: "Healthcare Information System Modernization",
    organization: "National Health Service",
    deadline: "2024-05-20",
    category: "IT Services",
    value: "750000",
    location: "UK",
  },
  {
    id: 3,
    title: "Emergency Medical Equipment Procurement",
    organization: "Regional Health Authority",
    deadline: "2024-05-25",
    category: "Healthcare",
    value: "450000",
    location: "USA",
  },
  {
    id: 4,
    title: "Renewable Energy Installation Project",
    organization: "Department of Energy",
    deadline: "2024-06-01",
    category: "Energy",
    value: "1200000",
    location: "EU",
  },
  {
    id: 5,
    title: "Smart City Infrastructure Development",
    organization: "Metropolitan Council",
    deadline: "2024-06-10",
    category: "IT Services",
    value: "3000000",
    location: "Kenya",
  },
  {
    id: 6,
    title: "Public Transportation Fleet Upgrade",
    organization: "City Transit Authority",
    deadline: "2024-06-15",
    category: "Transportation",
    value: "5000000",
    location: "USA",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleViewDetails = (tenderId: number) => {
    navigate(`/tenders/${tenderId}`);
    toast({
      title: "Opening tender details",
      description: "Loading complete tender information...",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tender Opportunities
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Discover and apply for the latest tender opportunities across various sectors
              </p>
            </div>
            <Button onClick={() => navigate("/auth")} variant="outline">
              Sign in to save tenders
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <TenderFilters />
            </div>
            
            <div className="lg:col-span-3">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
                {MOCK_TENDERS.map((tender) => (
                  <TenderCard
                    key={tender.id}
                    {...tender}
                    onViewDetails={() => handleViewDetails(tender.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;