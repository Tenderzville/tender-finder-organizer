
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ProfileStatus = 'loading' | 'exists' | 'missing';

export const useAuthState = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('loading');
  const [isInitialized, setIsInitialized] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Initialize auth state - optimized to prevent race conditions
  useEffect(() => {
    let isMounted = true;
    console.log("[useAuthState] Setting up auth state tracker");
    
    // Increase timeout to 15 seconds to give more time for auth
    const timeoutId = setTimeout(() => {
      if (isMounted && !isInitialized) {
        console.warn("[useAuthState] Auth initialization timed out");
        setIsInitialized(true);
      }
    }, 15000); // 15 second timeout instead of 5 seconds
    
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
            // Check if profile exists - using maybeSingle to prevent errors
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
          } else {
            if (isMounted) {
              setProfileStatus('missing');
            }
          }
          
          // Mark initialization complete at the end
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

          // Only handle navigation if we're fully initialized and on a page that requires a redirect
          if (isInitialized) {
            // Only redirect to onboarding if profile is missing and user is on auth page or home page
            if (!profile && (location.pathname === '/auth' || location.pathname === '/')) {
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
      clearTimeout(timeoutId);
      console.log("[useAuthState] Cleaning up auth listener");
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const handleSignOut = async () => {
    try {
      console.log("[useAuthState] Signing out user");
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
