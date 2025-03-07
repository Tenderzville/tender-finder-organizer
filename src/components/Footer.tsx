import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-500">
              © {currentYear} Tenders Ville. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={() => navigate("/terms")}
              variant="link"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Terms of Service
            </Button>
            <Button
              onClick={() => navigate("/privacy")}
              variant="link"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Privacy Policy
            </Button>
            <Button
              onClick={() => navigate("/agpo")}
              variant="link"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              AGPO Opportunities
            </Button>
          </div>
        </div>
        <div className="mt-4 text-xs text-center text-gray-400">
          <p>Helping businesses find and secure government procurement opportunities in Kenya</p>
          <p className="mt-1">Specialized support for Youth, Women, and Persons with Disabilities</p>
        </div>
      </div>
    </footer>
  );
};
