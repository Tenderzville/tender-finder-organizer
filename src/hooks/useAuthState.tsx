
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ProfileStatus = 'loading' | 'exists' | 'missing';

export const useAuthState = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('loading');
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const isAuthed = !!session;
        console.log("[useAuthState] Initial auth check - Session exists:", isAuthed);
        setIsAuthenticated(isAuthed);

        if (isAuthed && session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          const status = profile ? 'exists' : 'missing';
          console.log("[useAuthState] Profile status:", status);
          setProfileStatus(status);
        } else {
          setProfileStatus('missing');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("[useAuthState] Auth check error:", error);
        setIsInitialized(true);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[useAuthState] Auth state changed:", event, !!session);
      
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setProfileStatus('missing');
        navigate("/auth");
        return;
      }

      if (session) {
        setIsAuthenticated(true);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const newStatus = profile ? 'exists' : 'missing';
        console.log("[useAuthState] New profile status after auth change:", newStatus);
        setProfileStatus(newStatus);

        // Only navigate if we have finished initialization
        if (isInitialized) {
          if (!profile && window.location.pathname !== '/onboarding') {
            console.log("[useAuthState] No profile found, navigating to onboarding");
            navigate("/onboarding");
          } else if (profile && window.location.pathname === '/auth') {
            console.log("[useAuthState] Profile exists, navigating to dashboard");
            navigate("/dashboard");
          }
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, isInitialized]);

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

  return { isAuthenticated, profileStatus, isInitialized, handleSignOut };
};
