import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const Navigation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, !!session);
        setIsAuthenticated(!!session);
        
        // Handle email confirmation
        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome!",
            description: "You have successfully signed in",
          });
          navigate("/dashboard");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
      toast({
        title: "Signed out",
        description: "Successfully signed out of your account",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
            {isAuthenticated && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
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
                  onClick={() => navigate("/profile")}
                  variant="ghost"
                  className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                >
                  Profile
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {isAuthenticated ? (
              <Button
                onClick={handleSignOut}
                variant="default"
                className="ml-4"
              >
                Sign Out
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/auth")}
                variant="default"
                className="ml-4"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};