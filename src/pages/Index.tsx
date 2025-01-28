import { Navigation } from "@/components/Navigation";
import { TenderCard } from "@/components/TenderCard";
import { TenderFilters } from "@/components/TenderFilters";
import { useNavigate } from "react-router-dom";

// Mock data - replace with real API data later
const MOCK_TENDERS = [
  {
    id: 1,
    title: "Construction of New Municipal Building",
    organization: "City Council",
    deadline: "2024-05-15",
    category: "Construction",
    value: "$500,000",
  },
  {
    id: 2,
    title: "IT Infrastructure Upgrade Project",
    organization: "Ministry of Technology",
    deadline: "2024-05-20",
    category: "IT Services",
    value: "$250,000",
  },
  {
    id: 3,
    title: "Medical Supplies Procurement",
    organization: "Regional Health Authority",
    deadline: "2024-05-25",
    category: "Healthcare",
    value: "$150,000",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Tender Opportunities
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <TenderFilters />
            </div>
            
            <div className="lg:col-span-3">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {MOCK_TENDERS.map((tender) => (
                  <TenderCard
                    key={tender.id}
                    {...tender}
                    onViewDetails={() => navigate(`/tenders/${tender.id}`)}
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