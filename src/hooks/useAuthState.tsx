import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ProfileStatus = 'loading' | 'exists' | 'missing';

export const useAuthState = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('loading');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      console.log("Checking auth state...");
      const { data: { session } } = await supabase.auth.getSession();
      const isAuthed = !!session;
      console.log("Is authenticated:", isAuthed);
      setIsAuthenticated(isAuthed);

      if (isAuthed && session) {
        // Check if profile exists
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking profile:', error);
          return;
        }

        const status = profile ? 'exists' : 'missing';
        console.log("Profile status:", status);
        setProfileStatus(status);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, !!session);
        setIsAuthenticated(!!session);
        
        if (event === 'SIGNED_IN' && session) {
          // Check profile after sign in
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (!profile) {
            console.log("No profile found, redirecting to onboarding");
            navigate("/onboarding");
          } else {
            console.log("Profile found, redirecting to dashboard");
            navigate("/dashboard");
          }

          toast({
            title: "Welcome!",
            description: "You have successfully signed in",
          });
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const handleSignOut = async () => {
    try {
      console.log("Signing out...");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
      navigate("/");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return { isAuthenticated, profileStatus, handleSignOut };
};