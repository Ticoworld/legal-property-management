import type { PaymentFrequency } from '@prisma/client';
import { format, addMonths } from 'date-fns';

/**
 * Get the notice period text based on payment frequency
 * Per Lagos Tenancy Law requirements
 * 
 * @param frequency - Payment frequency from the tenancy
 * @returns Notice period in words (e.g., "Six Months", "One Month")
 */
export function getNoticePeriodText(frequency: PaymentFrequency | null | undefined): string {
  switch (frequency) {
    case 'ANNUALLY':
      return 'Six Months';
    case 'MONTHLY':
      return 'One Month';
    case 'BI_ANNUALLY':
      return 'Six Months';
    case 'QUARTERLY':
      return 'Three Months';
    default:
      return 'Statutory';
  }
}

/**
 * Calculate the notice expiry date based on payment frequency
 * 
 * @param startDate - The date the notice is served
 * @param frequency - Payment frequency from the tenancy
 * @returns The expiry date after the notice period
 */
export function calculateNoticeExpiryDate(
  startDate: Date,
  frequency: PaymentFrequency | null | undefined
): Date {
  switch (frequency) {
    case 'ANNUALLY':
      return addMonths(startDate, 6);
    case 'MONTHLY':
      return addMonths(startDate, 1);
    case 'BI_ANNUALLY':
      return addMonths(startDate, 6);
    case 'QUARTERLY':
      return addMonths(startDate, 3);
    default:
      return addMonths(startDate, 3); // Default statutory period
  }
}

/**
 * Get ordinal suffix for a day number
 * 
 * @param day - Day of month (1-31)
 * @returns Ordinal suffix (st, nd, rd, th)
 */
function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/**
 * Format a date in legal document style
 * Example: "30th day of April, 2025"
 * 
 * @param date - Date to format
 * @returns Legal-style formatted date string
 */
export function formatLegalDate(date: Date): string {
  const day = date.getDate();
  const ordinal = getOrdinalSuffix(day);
  const month = format(date, 'MMMM');
  const year = format(date, 'yyyy');
  
  return `${day}${ordinal} day of ${month}, ${year}`;
}

/**
 * Format frequency for display in legal documents
 * 
 * @param frequency - Payment frequency enum value
 * @returns Human-readable frequency (e.g., "monthly", "yearly")
 */
export function formatFrequencyText(frequency: PaymentFrequency | null | undefined): string {
  switch (frequency) {
    case 'ANNUALLY':
      return 'yearly';
    case 'MONTHLY':
      return 'monthly';
    case 'BI_ANNUALLY':
      return 'bi-annual';
    case 'QUARTERLY':
      return 'quarterly';
    default:
      return 'periodic';
  }
}

// ============================================
// GENDER & TITLE HELPERS FOR LEGAL DOCUMENTS
// ============================================

import type { Gender } from '@prisma/client';

/**
 * Pronoun set for a specific gender
 */
export type Pronouns = {
  subject: string;   // he, she, it
  object: string;    // him, her, it
  possessive: string; // his, her, its
};

/**
 * Get the appropriate landlord term based on gender
 * 
 * @param gender - Gender of the property owner
 * @returns "Landlord", "Landlady", or "Landlord" for corporate
 */
export function getLandlordTerm(gender: Gender | null | undefined): string {
  switch (gender) {
    case 'MALE':
      return 'Landlord';
    case 'FEMALE':
      return 'Landlady';
    case 'CORPORATE':
      return 'Landlord'; // Or "Lessor" if preferred
    default:
      return 'Landlord';
  }
}

/**
 * Get pronouns based on gender for use in legal documents
 * 
 * @param gender - Gender of the person
 * @returns Object with subject, object, and possessive pronouns
 */
export function getPronouns(gender: Gender | null | undefined): Pronouns {
  switch (gender) {
    case 'MALE':
      return { subject: 'he', object: 'him', possessive: 'his' };
    case 'FEMALE':
      return { subject: 'she', object: 'her', possessive: 'her' };
    case 'CORPORATE':
      return { subject: 'it', object: 'it', possessive: 'its' };
    default:
      return { subject: 'he', object: 'him', possessive: 'his' };
  }
}

/**
 * Common Nigerian titles for selection
 */
export const COMMON_TITLES = [
  'Mr',
  'Mrs',
  'Miss',
  'Ms',
  'Dr',
  'Chief',
  'Engr',
  'Arch',
  'Barr',
  'Pharm',
  'Pastor',
  'Rev',
  'Bishop',
  'Alh',
  'Hajia',
  'Prof',
  'Hon',
  'Sir',
  'Dame',
  'Oba',
  'Igwe',
] as const;

export type CommonTitle = typeof COMMON_TITLES[number];

/**
 * Format a name with title for legal documents
 * Avoids duplication like "Mr. Mr. John" by checking if name already starts with title
 * 
 * @param title - Optional title (Mr, Mrs, Dr, etc.)
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Properly formatted name with title
 */
export function formatNameWithTitle(
  title: string | null | undefined,
  firstName: string,
  lastName: string
): string {
  const fullName = `${firstName} ${lastName}`.trim();
  
  if (!title) {
    return fullName;
  }
  
  // Remove trailing period from title if present
  const cleanTitle = title.replace(/\.$/, '');
  
  // Check if name already starts with a common title to avoid duplication
  const nameStartsWithTitle = COMMON_TITLES.some(t => 
    fullName.toUpperCase().startsWith(t.toUpperCase() + ' ') ||
    fullName.toUpperCase().startsWith(t.toUpperCase() + '.')
  );
  
  if (nameStartsWithTitle) {
    return fullName;
  }
  
  return `${cleanTitle}. ${fullName}`;
}

/**
 * Format the full landlord signature with title (uppercase for legal documents)
 * 
 * @param title - Optional title
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Uppercase formatted name for signatures
 */
export function formatLandlordSignature(
  title: string | null | undefined,
  firstName: string,
  lastName: string
): string {
  return formatNameWithTitle(title, firstName, lastName).toUpperCase();
}
