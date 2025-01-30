import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Navigation = () => {
  const navigate = useNavigate();

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 
                className="text-2xl font-bold text-primary cursor-pointer"
                onClick={() => navigate("/")}
              >
                Tenders Ville
              </h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Button
                onClick={() => navigate("/dashboard")}
                variant="ghost"
                className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
              >
                Dashboard
              </Button>
              <Button
                onClick={() => navigate("/tenders")}
                variant="ghost"
                className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
              >
                Tenders
              </Button>
              <Button
                onClick={() => navigate("/profile")}
                variant="ghost"
                className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
              >
                Profile
              </Button>
            </div>
          </div>
          <div className="flex items-center">
            <Button
              onClick={() => navigate("/auth")}
              variant="default"
              className="ml-4"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};