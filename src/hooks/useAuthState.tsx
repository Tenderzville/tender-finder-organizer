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
      console.log("Auth check - Session exists:", isAuthed);
      setIsAuthenticated(isAuthed);

      if (isAuthed && session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const status = profile ? 'exists' : 'missing';
        console.log("Profile status:", status);
        setProfileStatus(status);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, !!session);
      setIsAuthenticated(!!session);

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
      } else {
        navigate("/auth");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

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