
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
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const isAuthed = !!session;
        console.log("Initial auth check - Session exists:", isAuthed);
        setIsAuthenticated(isAuthed);

        if (isAuthed && session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          const status = profile ? 'exists' : 'missing';
          console.log("Initial profile status check:", status);
          setProfileStatus(status);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, !!session);
      
      // Prevent unnecessary state updates if the auth state hasn't changed
      const newAuthState = !!session;
      if (isAuthenticated !== newAuthState) {
        setIsAuthenticated(newAuthState);
      }

      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const newStatus = profile ? 'exists' : 'missing';
        if (profileStatus !== newStatus) {
          setProfileStatus(newStatus);
        }

        // Only navigate if we're not already on the correct page
        if (!profile && window.location.pathname !== '/onboarding') {
          navigate("/onboarding");
        } else if (profile && window.location.pathname === '/auth') {
          navigate("/dashboard");
        }
      } else if (event === 'SIGNED_OUT') {
        // Only navigate on actual sign out, not initial load
        navigate("/auth");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, isAuthenticated, profileStatus]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      navigate("/");
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
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
