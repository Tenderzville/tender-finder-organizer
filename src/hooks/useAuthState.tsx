import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useAuthState = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return { isAuthenticated, handleSignOut };
};