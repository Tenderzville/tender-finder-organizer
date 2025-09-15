import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { securityUtils } from "@/utils/security";
import type { User, Session } from "@supabase/supabase-js";

interface SecureAuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthError {
  message: string;
  code?: string;
}

export const useSecureAuth = () => {
  const [authState, setAuthState] = useState<SecureAuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (isMounted) {
          setAuthState({
            user: session?.user ?? null,
            session,
            isLoading: false,
            isAuthenticated: !!session,
          });

          if (session?.user) {
            await securityUtils.logAuthEvent(
              'session_restored',
              session.user.email ?? 'unknown',
              true,
              session.user.id
            );
          }
        }
      } catch (error: any) {
        console.error('Error getting initial session:', error);
        if (isMounted) {
          setAuthError(error);
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log('[useSecureAuth] Auth event:', event);

        setAuthState({
          user: session?.user ?? null,
          session,
          isLoading: false,
          isAuthenticated: !!session,
        });

        // Log authentication events
        if (session?.user) {
          await securityUtils.logAuthEvent(
            event,
            session.user.email ?? 'unknown',
            true,
            session.user.id,
            { event_details: event }
          );

          // Log successful login specifically
          if (event === 'SIGNED_IN') {
            await securityUtils.logSecurityEvent(
              'successful_login',
              session.user.id,
              { 
                login_method: 'email',
                timestamp: new Date().toISOString()
              }
            );
          }
        }

        // Handle sign out
        if (event === 'SIGNED_OUT') {
          await securityUtils.logSecurityEvent('user_signed_out');
          navigate('/');
        }
      }
    );

    getInitialSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthError(null);

      // Check for suspicious activity before allowing login
      const isSuspicious = await securityUtils.checkSuspiciousActivity(email);
      if (isSuspicious) {
        const errorMsg = 'Too many failed login attempts. Please try again later.';
        await securityUtils.logAuthEvent('login_blocked_suspicious', email, false, undefined, {
          reason: 'too_many_failed_attempts'
        });
        
        toast({
          title: "Login Blocked",
          description: errorMsg,
          variant: "destructive",
        });

        return { success: false, error: errorMsg };
      }

      // Validate input
      const sanitizedEmail = securityUtils.sanitizeInput(email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: password,
      });

      if (error) {
        // Log failed login attempt
        await securityUtils.logAuthEvent('login_failed', sanitizedEmail, false, undefined, {
          error_code: error.message,
          error_details: error
        });

        setAuthError({ message: error.message, code: error.message });
        
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });

        return { success: false, error: error.message };
      }

      if (data.user) {
        await securityUtils.logAuthEvent('login_success', sanitizedEmail, true, data.user.id);
        
        toast({
          title: "Welcome back!",
          description: "You have been successfully signed in.",
        });
      }

      return { success: true };
    } catch (error: any) {
      const errorMsg = error.message || 'An unexpected error occurred';
      setAuthError({ message: errorMsg });
      
      await securityUtils.logSecurityEvent('login_error', undefined, {
        error: errorMsg,
        email: securityUtils.sanitizeInput(email)
      });

      return { success: false, error: errorMsg };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthError(null);

      // Validate password strength
      const passwordValidation = securityUtils.validatePassword(password);
      if (!passwordValidation.valid) {
        toast({
          title: "Weak Password",
          description: passwordValidation.message,
          variant: "destructive",
        });
        
        return { success: false, error: passwordValidation.message };
      }

      // Sanitize input
      const sanitizedEmail = securityUtils.sanitizeInput(email);

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        await securityUtils.logAuthEvent('signup_failed', sanitizedEmail, false, undefined, {
          error_code: error.message
        });

        setAuthError({ message: error.message, code: error.message });
        
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive",
        });

        return { success: false, error: error.message };
      }

      if (data.user) {
        await securityUtils.logAuthEvent('signup_success', sanitizedEmail, true, data.user.id);
        
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
        });
      }

      return { success: true };
    } catch (error: any) {
      const errorMsg = error.message || 'An unexpected error occurred';
      setAuthError({ message: errorMsg });
      
      await securityUtils.logSecurityEvent('signup_error', undefined, {
        error: errorMsg,
        email: securityUtils.sanitizeInput(email)
      });

      return { success: false, error: errorMsg };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      const userId = authState.user?.id;
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      if (userId) {
        await securityUtils.logSecurityEvent('manual_signout', userId);
      }

      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    ...authState,
    authError,
    signIn,
    signUp,
    signOut,
  };
};