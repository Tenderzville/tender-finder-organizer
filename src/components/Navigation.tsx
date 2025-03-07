import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuthState } from "@/hooks/useAuthState";

export const Navigation = () => {
  const navigate = useNavigate();
  const { isAuthenticated, handleSignOut } = useAuthState();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
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
            <div className="hidden sm:ml-6 sm:flex sm:space-x-2 lg:space-x-8">
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
                    onClick={() => navigate("/dashboard")}
                    variant="ghost"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    Tenders
                  </Button>
                  <Button
                    onClick={() => navigate("/agpo")}
                    variant="ghost"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    AGPO
                  </Button>
                  <Button
                    onClick={() => navigate("/faq")}
                    variant="ghost"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    FAQ
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
                    onClick={() => navigate("/faq")}
                    variant="ghost"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    FAQ
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex items-center space-x-2 lg:space-x-4 mr-2 lg:mr-4">
              <Button
                onClick={() => navigate("/terms")}
                variant="ghost"
                className="text-gray-600 text-xs"
              >
                Terms
              </Button>
              <Button
                onClick={() => navigate("/privacy")}
                variant="ghost"
                className="text-gray-600 text-xs"
              >
                Privacy
              </Button>
            </div>
            {isAuthenticated ? (
              <Button onClick={handleSignOut} variant="outline" size="sm" className="text-sm">
                Sign out
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")} variant="outline" size="sm" className="text-sm">
                Sign in
              </Button>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="touch-manipulation">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              <span className="sr-only">Open main menu</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-200 py-2 touch-manipulation">
          <div className="space-y-1 px-4">
            {isAuthenticated ? (
              <>
                <Button
                  onClick={() => {
                    navigate("/dashboard");
                    setMobileMenuOpen(false);
                  }}
                  variant="ghost"
                  className="w-full justify-start text-gray-900 py-3"
                >
                  Dashboard
                </Button>
                <Button
                  onClick={() => {
                    navigate("/dashboard");
                    setMobileMenuOpen(false);
                  }}
                  variant="ghost"
                  className="w-full justify-start text-gray-900 py-3"
                >
                  Tenders
                </Button>
                <Button
                  onClick={() => {
                    navigate("/agpo");
                    setMobileMenuOpen(false);
                  }}
                  variant="ghost"
                  className="w-full justify-start text-gray-900 py-3"
                >
                  AGPO
                </Button>
                <Button
                  onClick={() => {
                    navigate("/faq");
                    setMobileMenuOpen(false);
                  }}
                  variant="ghost"
                  className="w-full justify-start text-gray-900 py-3"
                >
                  FAQ
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    navigate("/dashboard");
                    setMobileMenuOpen(false);
                  }}
                  variant="ghost"
                  className="w-full justify-start text-gray-900 py-3"
                >
                  Browse Tenders
                </Button>
                <Button
                  onClick={() => {
                    navigate("/faq");
                    setMobileMenuOpen(false);
                  }}
                  variant="ghost"
                  className="w-full justify-start text-gray-900 py-3"
                >
                  FAQ
                </Button>
              </>
            )}
            
            <div className="pt-2 border-t border-gray-200">
              <Button
                onClick={() => {
                  navigate("/terms");
                  setMobileMenuOpen(false);
                }}
                variant="ghost"
                className="w-full justify-start text-gray-600 py-3"
              >
                Terms of Service
              </Button>
              <Button
                onClick={() => {
                  navigate("/privacy");
                  setMobileMenuOpen(false);
                }}
                variant="ghost"
                className="w-full justify-start text-gray-600 py-3"
              >
                Privacy Policy
              </Button>
              {isAuthenticated ? (
                <Button 
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }} 
                  variant="outline" 
                  className="w-full mt-2"
                >
                  Sign out
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    navigate("/auth");
                    setMobileMenuOpen(false);
                  }} 
                  variant="outline" 
                  className="w-full mt-2"
                >
                  Sign in
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};