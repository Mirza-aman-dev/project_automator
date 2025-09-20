/**
 * Robust input sanitization module
 * Provides functions for sanitizing strings, emails, and complex data structures
 */

/**
 * Sanitizes a string using an allow-list strategy
 * @param {string} str - The string to be sanitized
 * @param {string} exceptions - Additional characters to allow (optional)
 * @returns {string|null} - Sanitized string or null if input is falsy
 */
export function sanitiseString(str, exceptions = '') {
    // Return null for falsy inputs
    if (!str) {
        return null;
    }
    
    // Trim leading and trailing whitespace
    let sanitized = str.trim();
    
    // Define the default allowed character list
    // Alphanumeric (a-z, A-Z, 0-9), Arabic (\u0600-\u06FF), whitespace, and symbols: - / & ( ) , .
    const defaultAllowed = 'a-zA-Z0-9\\u0600-\\u06FF\\s\\-/&(),.';
    
    // Escape special regex characters in exceptions string
    const escapedExceptions = exceptions.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create the allowed character pattern (note: NOT using global flag for test)
    const allowedPattern = `[${defaultAllowed}${escapedExceptions}]`;
    const allowedRegex = new RegExp(allowedPattern);
    
    // Replace any character not in the allowed list with a single space
    sanitized = sanitized.replace(/./g, (char) => {
        return allowedRegex.test(char) ? char : ' ';
    });
    
    // Collapse multiple spaces into single space
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    // Trim any leading or trailing whitespace created during replacement
    return sanitized.trim();
}

/**
 * Performs basic sanitization for email addresses
 * @param {string} email - The email address to sanitize
 * @returns {string|null} - Sanitized email or null if input is falsy
 */
export function sanitiseEmail(email) {
    // Return null for falsy inputs
    if (!email) {
        return null;
    }
    
    // Only trim leading and trailing whitespace
    return email.trim();
}

/**
 * Recursively sanitizes complex data structures (objects and arrays)
 * @param {*} data - The data to be sanitized
 * @returns {*} - Sanitized data structure
 */
export function sanitiseInput(data) {
    // Return primitive types and null unmodified
    if (typeof data !== 'object' || data === null) {
        return data;
    }
    
    // Handle arrays
    if (Array.isArray(data)) {
        return data.map(item => sanitiseInput(item));
    }
    
    // Handle objects
    const sanitizedObj = {};
    
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            // Check if key includes "email" (case-insensitive)
            if (key.toLowerCase().includes('email')) {
                sanitizedObj[key] = sanitiseEmail(value);
            } else {
                sanitizedObj[key] = sanitiseString(value);
            }
        } else if (typeof value === 'object' && value !== null) {
            // Recursively sanitize nested objects and arrays
            sanitizedObj[key] = sanitiseInput(value);
        } else {
            // Keep non-string, non-object values as-is
            sanitizedObj[key] = value;
        }
    }
    
    return sanitizedObj;
}
