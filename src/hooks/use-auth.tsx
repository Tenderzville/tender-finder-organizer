
import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/types/user";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch user profile if authenticated
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error("Error fetching profile:", profileError);
          } else {
            setProfile(profileData as UserProfile);
            // Check if onboarding is completed
            setHasCompletedOnboarding(!!profileData?.onboarding_completed);
          }
        } else {
          // For demo/development: check local storage
          const localOnboardingStatus = localStorage.getItem('onboardingComplete') === 'true';
          setHasCompletedOnboarding(localOnboardingStatus);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session) {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
              
            setProfile(profileData as UserProfile);
            
            // Check if onboarding is completed
            const onboardingCompleted = !!profileData?.onboarding_completed;
            setHasCompletedOnboarding(onboardingCompleted);
            
            // Check if profile exists - if not or onboarding not completed, redirect to onboarding
            if (!profileData || !onboardingCompleted) {
              if (window.location.pathname !== '/onboarding') {
                navigate('/onboarding');
              }
            } else if (profileData && window.location.pathname === '/auth') {
              navigate('/dashboard');
            }
          } catch (error) {
            console.error("Error fetching profile after auth change:", error);
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setHasCompletedOnboarding(false);
          navigate('/');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
      navigate('/');
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    profile,
    isLoading,
    signOut,
    isAuthenticated: !!user,
    hasCompletedOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
