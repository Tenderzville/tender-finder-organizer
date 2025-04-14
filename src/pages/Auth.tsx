import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("[Auth] Checking for session");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[Auth] Error checking session:", error);
        }
        
        if (session) {
          console.log("[Auth] Session exists, checking profile");
          try {
            // Check if user has completed onboarding before
            const { data: onboardingStatus } = await supabase
              .from('profiles')
              .select('onboarding_completed')
              .eq('user_id', session.user.id)
              .maybeSingle();

            const currentPath = window.location.pathname;
            
            // If onboarding is completed, go straight to dashboard
            if (onboardingStatus?.onboarding_completed) {
              console.log("[Auth] Onboarding already completed, navigating to dashboard");
              navigate("/dashboard");
            } else if (!onboardingStatus && currentPath !== '/onboarding') {
              console.log("[Auth] No profile found, navigating to onboarding");
              navigate("/onboarding");
            }
          } catch (profileError) {
            console.error("[Auth] Error checking profile:", profileError);
            // Continue to show auth page if profile check fails
          }
        } else {
          console.log("[Auth] No session found, showing auth page");
        }
      } catch (error) {
        console.error("[Auth] Session check error:", error);
      } finally {
        setInitialCheckDone(true);
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }
    
    // Add basic password validation
    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    console.log(`[Auth] Attempting to ${isLogin ? 'sign in' : 'sign up'} with email:`, email);

    try {
      if (isLogin) {
        // For demo purposes, simulate successful login
        toast({
          title: "Success",
          description: "Login successful! Redirecting to dashboard...",
        });
        
        // Check if user has completed onboarding before redirecting
        const checkOnboardingStatus = async () => {
          try {
            // This would be the real auth flow
            // const { data, error } = await supabase.auth.signInWithPassword({
            //   email: email.trim(),
            //   password,
            // });
            
            // For demo, we'll check local storage instead
            const hasCompletedOnboarding = localStorage.getItem('onboardingComplete') === 'true';
            
            if (hasCompletedOnboarding) {
              navigate('/dashboard');
            } else {
              navigate('/onboarding');
            }
          } catch (error) {
            console.error("Error checking onboarding status:", error);
            navigate('/dashboard'); // Default to dashboard on error
          }
        };
        
        // Wait a moment then redirect
        setTimeout(() => {
          checkOnboardingStatus();
        }, 1500);
      } else {
        // For demo purposes, simulate successful registration
        toast({
          title: "Success",
          description: "Account created successfully! Redirecting to onboarding...",
        });
        
        // Wait a moment then redirect
        setTimeout(() => {
          navigate('/onboarding');
        }, 1500);
      }
    } catch (error: any) {
      console.error("[Auth] Auth error:", error);
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading indicator while checking session
  if (!initialCheckDone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>{isLogin ? "Sign in" : "Create an account"}</CardTitle>
          </div>
          <CardDescription>
            {isLogin
              ? "Welcome back! Please sign in to continue."
              : "Create an account to get started."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white"
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isLogin ? "Sign in" : "Create account"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsLogin(!isLogin)}
              className="w-full"
              disabled={isLoading}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
