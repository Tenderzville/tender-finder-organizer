
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ProfileStatus = 'loading' | 'exists' | 'missing';

export const useAuthState = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('loading');
  const [isInitialized, setIsInitialized] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        console.log("[useAuthState] Starting auth check...");
        
        // Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("[useAuthState] Session error:", sessionError);
          if (isMounted) {
            setAuthError(sessionError);
            setIsAuthenticated(false);
            setProfileStatus('missing');
            setIsInitialized(true);
          }
          return;
        }
        
        const isAuthed = !!session;
        console.log("[useAuthState] Initial auth check - Session exists:", isAuthed);
        
        if (isMounted) {
          setIsAuthenticated(isAuthed);
        
          if (isAuthed && session) {
            try {
              // Check if profile exists
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              if (profileError) {
                console.error("[useAuthState] Profile check error:", profileError);
                if (isMounted) {
                  setProfileStatus('missing');
                }
              } else {
                const status = profile ? 'exists' : 'missing';
                console.log("[useAuthState] Profile status:", status);
                if (isMounted) {
                  setProfileStatus(status);
                }
              }
            } catch (err) {
              console.error("[useAuthState] Profile check exception:", err);
              if (isMounted) {
                setProfileStatus('missing');
              }
            }
          } else {
            if (isMounted) {
              setProfileStatus('missing');
            }
          }
          
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("[useAuthState] Auth check error:", error);
        if (isMounted) {
          setAuthError(error instanceof Error ? error : new Error(String(error)));
          setIsInitialized(true);
        }
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[useAuthState] Auth state changed:", event, !!session);
      
      if (!isMounted) return;
      
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setProfileStatus('missing');
        return;
      }

      if (session) {
        setIsAuthenticated(true);
        
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (profileError) {
            console.error("[useAuthState] Profile check error after auth change:", profileError);
            setProfileStatus('missing');
            return;
          }

          const newStatus = profile ? 'exists' : 'missing';
          console.log("[useAuthState] New profile status after auth change:", newStatus);
          setProfileStatus(newStatus);

          // Navigation logic
          if (isInitialized) {
            if (!profile && window.location.pathname !== '/onboarding') {
              console.log("[useAuthState] No profile found, navigating to onboarding");
              navigate("/onboarding");
            }
          }
        } catch (error) {
          console.error("[useAuthState] Error checking profile after auth change:", error);
          setProfileStatus('missing');
        }
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setIsAuthenticated(false);
      setProfileStatus('missing');
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

  return { 
    isAuthenticated, 
    profileStatus, 
    isInitialized, 
    authError,
    handleSignOut 
  };
};
