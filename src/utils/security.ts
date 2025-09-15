import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/user";

// Data minimization helper
export const sanitizeUserData = (userData: UserProfile) => {
  const { id, user_id, ...publicData } = userData;
  return publicData;
};

// Enhanced Security utilities with audit logging
export const securityUtils = {
  // Validate user inputs to prevent XSS and SQL injection
  sanitizeInput: (input: string): string => {
    if (!input) return "";
    // Enhanced sanitization - remove script tags, SQL comments, etc.
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .replace(/'/g, "''")
      .replace(/--/g, "")
      .replace(/\/\*/g, "")
      .replace(/\*\//g, "")
      .trim();
  },

  // Check for suspicious activity (multiple failed login attempts)
  checkSuspiciousActivity: async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('auth_logs')
        .select('*')
        .eq('email', email)
        .eq('success', false)
        .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Last 15 minutes
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error checking for suspicious activity:', error);
        return false;
      }

      // If more than 5 failed attempts in the last 15 minutes
      const isSuspicious = (data?.length || 0) > 5;
      
      if (isSuspicious) {
        await securityUtils.logSecurityEvent('suspicious_login_activity', undefined, { 
          email, 
          failed_attempts: data?.length || 0 
        });
      }

      return isSuspicious;
    } catch (error) {
      console.error('Failed to check for suspicious activity:', error);
      return false;
    }
  },

  // Enhanced security event logging
  logSecurityEvent: async (eventType: string, userId?: string, details?: object): Promise<void> => {
    try {
      await supabase
        .from('security_logs')
        .insert({
          event_type: eventType,
          user_id: userId,
          details: details || {},
          ip_address: '0.0.0.0', // In a real app, you would get the actual IP
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  },

  // Log authentication events
  logAuthEvent: async (eventType: string, email: string, success: boolean, userId?: string, details?: object): Promise<void> => {
    try {
      await supabase
        .from('auth_logs')
        .insert({
          user_id: userId,
          email,
          event_type: eventType,
          success,
          ip_address: '0.0.0.0',
          user_agent: navigator.userAgent,
          details: details || {}
        });
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  },

  // Custom password validation
  validatePassword: (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must include an uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must include a lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must include a number' };
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return { valid: false, message: 'Password must include a special character' };
    }
    return { valid: true, message: 'Password meets requirements' };
  },

  // Enhanced secure HTTP headers (for use in meta tags)
  getSecurityMeta: () => [
    { 
      httpEquiv: "Content-Security-Policy", 
      content: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; font-src 'self' data:; media-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none';" 
    },
    { httpEquiv: "X-Content-Type-Options", content: "nosniff" },
    { httpEquiv: "X-Frame-Options", content: "DENY" },
    { httpEquiv: "X-XSS-Protection", content: "1; mode=block" },
    { httpEquiv: "Referrer-Policy", content: "strict-origin-when-cross-origin" },
    { httpEquiv: "Permissions-Policy", content: "geolocation=(), microphone=(), camera=()" },
  ],

  // Rate limiting helper
  checkRateLimit: async (identifier: string, maxAttempts: number = 10, windowMinutes: number = 15): Promise<boolean> => {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    
    try {
      const { data, error } = await supabase
        .from('security_logs')
        .select('id')
        .eq('details->identifier', identifier)
        .gte('created_at', windowStart.toISOString());

      if (error) {
        console.error('Rate limit check failed:', error);
        return false; // Allow on error to avoid blocking legitimate users
      }

      return (data?.length || 0) < maxAttempts;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return false;
    }
  }
};

// GDPR Data protection utilities
export const dataProtection = {
  // Download user's data in compliance with GDPR right to access
  exportUserData: async (userId: string): Promise<object | null> => {
    try {
      const userData = {};
      
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (profile) {
        Object.assign(userData, { profile });
      }
      
      // Get user points
      const { data: points } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (points) {
        Object.assign(userData, { points });
      }
      
      return userData;
    } catch (error) {
      console.error('Failed to export user data:', error);
      return null;
    }
  },

  // Request to delete user data (GDPR right to be forgotten)
  requestDataDeletion: async (userId: string): Promise<boolean> => {
    try {
      // In a real app, this would trigger a workflow for data deletion
      // For now, we just log the request
      await securityUtils.logSecurityEvent('data_deletion_request', userId);
      return true;
    } catch (error) {
      console.error('Failed to request data deletion:', error);
      return false;
    }
  }
};

// Data obfuscation for AI-related functions (to prevent model inversion attacks)
export const aiSecurity = {
  // Anonymize data before sending to AI services
  anonymizeDataForAI: (data: any): any => {
    // Deep clone the data to avoid modifying the original
    const clonedData = JSON.parse(JSON.stringify(data));
    
    // Replace sensitive fields with anonymized versions
    if (clonedData.user_id) {
      clonedData.user_id = 'anonymized_user';
    }
    
    if (clonedData.email) {
      clonedData.email = 'anonymized@example.com';
    }
    
    if (clonedData.name) {
      clonedData.name = 'Anonymous User';
    }
    
    if (clonedData.location) {
      // Keep only the country/region level information
      const locationParts = clonedData.location.split(',');
      if (locationParts.length > 1) {
        clonedData.location = locationParts[locationParts.length - 1].trim();
      }
    }
    
    return clonedData;
  }
};

// Export combined security utilities
export const securityModule = {
  ...securityUtils,
  dataProtection,
  aiSecurity
};

export default securityModule;
