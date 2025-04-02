import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/user";

// Data minimization helper
export const sanitizeUserData = (userData: UserProfile) => {
  const { id, user_id, ...publicData } = userData;
  return publicData;
};

// Security utilities
export const securityUtils = {
  // Validate user inputs to prevent XSS and SQL injection
  sanitizeInput: (input: string): string => {
    if (!input) return "";
    // Basic sanitization - remove script tags, SQL comments, etc.
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/'/g, "''")
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
      return (data?.length || 0) > 5;
    } catch (error) {
      console.error('Failed to check for suspicious activity:', error);
      return false;
    }
  },

  // Log important security events for audit trail
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

  // Set secure HTTP headers (for use in meta tags)
  getSecurityMeta: () => [
    { httpEquiv: "Content-Security-Policy", content: "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co" },
    { httpEquiv: "X-Content-Type-Options", content: "nosniff" },
    { httpEquiv: "X-Frame-Options", content: "DENY" },
    { httpEquiv: "Referrer-Policy", content: "no-referrer-when-downgrade" },
  ]
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
