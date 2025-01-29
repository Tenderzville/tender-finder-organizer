import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const TenderHeader = () => {
  const navigate = useNavigate();
  
  return (
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
  );
};