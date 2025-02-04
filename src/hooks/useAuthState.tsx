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
      const { data: { session } } = await supabase.auth.getSession();
      const isAuthed = !!session;
      setIsAuthenticated(isAuthed);

      if (isAuthed) {
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

        setProfileStatus(profile ? 'exists' : 'missing');
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, !!session);
        setIsAuthenticated(!!session);
        
        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome!",
            description: "You have successfully signed in",
          });
          
          // Check profile after sign in
          if (session) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', session.user.id)
              .maybeSingle();

            if (!profile) {
              navigate("/onboarding");
            } else {
              navigate("/dashboard");
            }
          }
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

  return { isAuthenticated, profileStatus, handleSignOut };
};