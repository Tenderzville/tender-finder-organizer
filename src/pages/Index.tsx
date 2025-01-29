import { Navigation } from "@/components/Navigation";
import { TenderFilters } from "@/components/TenderFilters";
import { TenderList } from "@/components/tenders/TenderList";
import { TenderHeader } from "@/components/tenders/TenderHeader";
import { MOCK_TENDERS } from "@/data/mockTenders";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <TenderHeader />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <TenderFilters />
            </div>
            
            <div className="lg:col-span-3">
              <TenderList tenders={MOCK_TENDERS} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;