
import { supabase } from "@/integrations/supabase/client";

// A simple rate limiter implementation
const rateLimits: Record<string, { count: number; timestamp: number }> = {};

export const checkRateLimit = (
  key: string, 
  maxRequests = 10, 
  timeWindowMs = 60000
): boolean => {
  const now = Date.now();
  
  // Initialize or clean up old entries
  if (!rateLimits[key] || now - rateLimits[key].timestamp > timeWindowMs) {
    rateLimits[key] = { count: 1, timestamp: now };
    return true;
  }
  
  // Increment count
  rateLimits[key].count += 1;
  
  // Check if limit exceeded
  if (rateLimits[key].count > maxRequests) {
    // Could log this as a potential abuse
    logSecurityEvent({
      type: 'rate_limit_exceeded',
      key,
      count: rateLimits[key].count,
      timestamp: new Date().toISOString()
    });
    return false;
  }
  
  return true;
};

// Basic input sanitization
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Replace potentially dangerous characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Log security events for monitoring
export const logSecurityEvent = async (event: any): Promise<void> => {
  try {
    console.warn('Security event:', event);
    
    // Could implement server-side logging here
    // await supabase.from('security_logs').insert(event);
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Check for suspicious patterns (e.g., SQL injection attempts)
export const detectSuspiciousPatterns = (input: string): boolean => {
  if (!input) return false;
  
  const suspiciousPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      logSecurityEvent({
        type: 'suspicious_pattern_detected',
        input,
        pattern: pattern.toString(),
        timestamp: new Date().toISOString()
      });
      return true;
    }
  }
  
  return false;
};

// Enhanced security wrapper for fetch operations
export const secureFetch = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  try {
    // Add security headers
    const secureOptions = {
      ...options,
      headers: {
        ...options.headers,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    };
    
    return await fetch(url, secureOptions);
  } catch (error) {
    console.error('Secure fetch error:', error);
    throw error;
  }
};

// JWT token validation helper
export const isValidJWT = (token: string): boolean => {
  if (!token) return false;
  
  // Basic structure validation
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Check if parts are valid base64
    for (const part of parts) {
      window.atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    }
    
    // Check expiration
    const payload = JSON.parse(
      window.atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return false;
    }
    
    return true;
  } catch (e) {
    return false;
  }
};

// Session timeout helper
export const initSessionTimeout = (
  timeoutMinutes = 30,
  onTimeout: () => void
): () => void => {
  let timeoutId: number;
  
  const resetTimeout = () => {
    if (timeoutId) window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(onTimeout, timeoutMinutes * 60 * 1000);
  };
  
  // Set up event listeners
  window.addEventListener('mousemove', resetTimeout);
  window.addEventListener('keypress', resetTimeout);
  window.addEventListener('click', resetTimeout);
  
  // Initial timeout
  resetTimeout();
  
  // Return cleanup function
  return () => {
    window.removeEventListener('mousemove', resetTimeout);
    window.removeEventListener('keypress', resetTimeout);
    window.removeEventListener('click', resetTimeout);
    if (timeoutId) window.clearTimeout(timeoutId);
  };
};
