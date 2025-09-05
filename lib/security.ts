/**
 * Security utilities for input sanitization and validation
 * Prevents template injection, XSS, and other input-based attacks
 */

/**
 * Sanitizes user input for safe template interpolation
 * Prevents XSS, HTML injection, and template injection attacks
 */
export function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    // Remove or escape dangerous HTML characters
    .replace(/[<>&"']/g, (char) => {
      const escapeMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return escapeMap[char];
    })
    // Remove potential script injections
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+=/gi, '')
    // Limit length to prevent DoS
    .slice(0, 1000);
}

/**
 * Sanitizes text specifically for JSON template generation
 * Escapes JSON special characters and prevents injection
 */
export function sanitizeForJSON(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    // Escape JSON special characters
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    // Remove control characters
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    // Limit length
    .slice(0, 500);
}

/**
 * Sanitizes text for safe markdown generation
 * Prevents markdown injection while preserving basic formatting
 */
export function sanitizeForMarkdown(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    // Escape dangerous markdown patterns
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '\\[$1\\]\\($2\\)')
    .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '!\\[$1\\]\\($2\\)')
    .replace(/```/g, '\\`\\`\\`')
    .replace(/<script/gi, '&lt;script')
    .replace(/<iframe/gi, '&lt;iframe')
    // Remove potential XSS vectors
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    // Limit length
    .slice(0, 5000);
}

/**
 * Validates and sanitizes project names/slugs
 * Ensures safe filesystem and URL usage
 */
export function sanitizeProjectSlug(input: string): string {
  if (!input || typeof input !== 'string') return 'unnamed-project';
  
  const processed = input
    .toLowerCase()
    // Replace unsafe characters with hyphens
    .replace(/[^a-z0-9\-_]/g, '-')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length
    .slice(0, 50);
  
  // If empty after processing, return fallback
  if (!processed) return 'unnamed-project';
  
  return processed;
}

/**
 * Validates business/idea descriptions for safe processing
 * Removes potential prompt injection attempts
 */
export function validateIdeaInput(input: string): { isValid: boolean; sanitized: string; errors: string[] } {
  const errors: string[] = [];
  
  if (!input || typeof input !== 'string') {
    errors.push('Input must be a non-empty string');
    return { isValid: false, sanitized: '', errors };
  }
  
  if (input.length > 2000) {
    errors.push('Input too long (max 2000 characters)');
  }
  
  if (input.length < 10) {
    errors.push('Input too short (min 10 characters)');
  }
  
  // Check for potential prompt injection patterns
  const suspiciousPatterns = [
    /ignore.*previous.*instructions/i,
    /system.*prompt/i,
    /you are now/i,
    /forget.*instructions/i,
    /<script/i,
    /javascript:/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      errors.push('Input contains suspicious patterns');
      break;
    }
  }
  
  const sanitized = sanitizeUserInput(input).slice(0, 2000);
  
  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  };
}

/**
 * Security headers for API responses
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
} as const;
