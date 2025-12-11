import { Resend } from 'resend';

/**
 * Resend Email Client
 * 
 * Initialize with RESEND_API environment variable.
 * Uses "onboarding@resend.dev" as default sender for testing.
 */

// Safety check: Only initialize if API key exists
const resendApiKey = process.env.RESEND_API;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Default sender address (Resend's testing address)
export const DEFAULT_FROM_EMAIL = 'Legal Property Management <onboarding@resend.dev>';

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return resend !== null;
}
