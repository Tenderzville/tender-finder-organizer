
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/hooks/useAuthState";

export const Navigation = () => {
  const navigate = useNavigate();
  const { isAuthenticated, handleSignOut } = useAuthState();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                className="text-xl font-bold text-gray-900"
              >
                Tenders Ville
              </Button>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {isAuthenticated ? (
                <>
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
                    onClick={() => navigate("/services")}
                    variant="ghost"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    Services
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => navigate("/dashboard")}
                    variant="ghost"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    Browse Tenders
                  </Button>
                  <Button
                    onClick={() => navigate("/services")}
                    variant="ghost"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    Services
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <Button onClick={handleSignOut} variant="outline">
                Sign out
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")} variant="outline">
                Sign in
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
