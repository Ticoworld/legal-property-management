/**
 * Zod Validation Schemas
 * 
 * Purpose: Type-safe runtime validation for form inputs and API requests
 * Security: First line of defense against malformed/malicious data
 * 
 * These schemas match the Prisma database models but add validation rules
 * for user input. They're used with react-hook-form for client-side validation
 * and Server Actions for server-side validation (Defense in Depth).
 */

import { z } from 'zod';

// ============================================
// NIGERIAN-SPECIFIC VALIDATION PATTERNS
// ============================================

/**
 * Nigerian National Identification Number (NIN) - 11 digits
 * Format: XXXXXXXXXXX (11 numeric digits)
 */
const ninPattern = /^\d{11}$/;

/**
 * Nigerian Bank Verification Number (BVN) - 11 digits
 * Format: XXXXXXXXXXX (11 numeric digits)
 */
const bvnPattern = /^\d{11}$/;

/**
 * Nigerian phone number pattern
 * Formats accepted:
 * - 08012345678 (11 digits starting with 0)
 * - +2348012345678 (with country code)
 * - 2348012345678 (without + symbol)
 */
const phonePattern = /^(\+?234|0)[789]\d{9}$/;

// ============================================
// USER SCHEMA (Lawyers/Staff)
// ============================================

export const UserSchema = z.object({
  id: z.string().cuid().optional(),
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: z.enum(['ADMIN', 'ASSOCIATE', 'VIEWER']).default('VIEWER'),
});

export type UserInput = z.infer<typeof UserSchema>;

// Login schema (doesn't require password complexity validation)
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ============================================
// CLIENT SCHEMA (Landlords/Property Owners)
// ============================================

export const ClientSchema = z.object({
  id: z.string().cuid().optional(),
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s-']+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s-']+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  phone: z.string()
    .regex(phonePattern, 'Invalid Nigerian phone number. Format: 08012345678 or +2348012345678'),
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must not exceed 200 characters')
    .optional(),
  nin: z.string()
    .regex(ninPattern, 'NIN must be exactly 11 digits')
    .optional()
    .or(z.literal('')), // Allow empty string for optional field
  bvn: z.string()
    .regex(bvnPattern, 'BVN must be exactly 11 digits')
    .optional()
    .or(z.literal('')), // Allow empty string for optional field
});

export type ClientInput = z.infer<typeof ClientSchema>;

// Schema for updating client (all fields optional except ID)
export const UpdateClientSchema = ClientSchema.partial().required({ id: true });

export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;

// ============================================
// PROPERTY SCHEMA (Legal Assets)
// ============================================

export const PropertySchema = z.object({
  id: z.string().cuid().optional(),
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must not exceed 200 characters'),
  city: z.string()
    .min(2, 'City name must be at least 2 characters')
    .max(50, 'City name must not exceed 50 characters'),
  state: z.enum([
    'ABIA', 'ADAMAWA', 'AKWA_IBOM', 'ANAMBRA', 'BAUCHI', 'BAYELSA',
    'BENUE', 'BORNO', 'CROSS_RIVER', 'DELTA', 'EBONYI', 'EDO',
    'EKITI', 'ENUGU', 'FCT', 'GOMBE', 'IMO', 'JIGAWA', 'KADUNA',
    'KANO', 'KATSINA', 'KEBBI', 'KOGI', 'KWARA', 'LAGOS',
    'NASARAWA', 'NIGER', 'OGUN', 'ONDO', 'OSUN', 'OYO',
    'PLATEAU', 'RIVERS', 'SOKOTO', 'TARABA', 'YOBE', 'ZAMFARA'
  ], { message: 'Please select a valid Nigerian state' }),
  titleType: z.enum([
    'CERTIFICATE_OF_OCCUPANCY',
    'DEED_OF_ASSIGNMENT',
    'DEED_OF_CONVEYANCE',
    'GOVERNORS_CONSENT',
    'REGISTERED_CONVEYANCE',
    'POWER_OF_ATTORNEY',
    'OTHER'
  ], { message: 'Please select a valid title type' }),
  registrationNumber: z.string()
    .min(5, 'Registration number must be at least 5 characters')
    .max(50, 'Registration number must not exceed 50 characters')
    .regex(/^[A-Z0-9/-]+$/, 'Registration number can only contain uppercase letters, numbers, hyphens, and slashes'),
  surveyNumber: z.string()
    .max(50, 'Survey number must not exceed 50 characters')
    .optional()
    .or(z.literal('')),
  plotNumber: z.string()
    .max(50, 'Plot number must not exceed 50 characters')
    .optional()
    .or(z.literal('')),
  landArea: z.number()
    .positive('Land area must be a positive number')
    .max(1000000, 'Land area seems unreasonably large')
    .optional(),
  buildingArea: z.number()
    .positive('Building area must be a positive number')
    .max(100000, 'Building area seems unreasonably large')
    .optional(),
  propertyType: z.enum([
    'RESIDENTIAL',
    'COMMERCIAL',
    'INDUSTRIAL',
    'MIXED_USE',
    'LAND'
  ], { message: 'Please select a valid property type' }),
  ownerId: z.string().cuid('Invalid client ID'),
});

export type PropertyInput = z.infer<typeof PropertySchema>;

// Schema for updating property (all fields optional except ID)
export const UpdatePropertySchema = PropertySchema.partial().required({ id: true });

export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>;

// ============================================
// TENANCY SCHEMA (Lease Agreements)
// ============================================

export const TenancySchema = z.object({
  id: z.string().cuid().optional(),
  tenantName: z.string()
    .min(2, 'Tenant name must be at least 2 characters')
    .max(100, 'Tenant name must not exceed 100 characters'),
  tenantEmail: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .optional()
    .or(z.literal('')),
  tenantPhone: z.string()
    .regex(phonePattern, 'Invalid Nigerian phone number. Format: 08012345678 or +2348012345678'),
  startDate: z.coerce.date({
    message: 'Start date is required and must be a valid date',
  }),
  expiryDate: z.coerce.date({
    message: 'Expiry date is required and must be a valid date',
  }),
  annualRent: z.number()
    .positive('Annual rent must be a positive number')
    .max(1000000000, 'Annual rent seems unreasonably high')
    .multipleOf(0.01, 'Annual rent must have at most 2 decimal places'),
  status: z.enum([
    'ACTIVE',
    'EXPIRED',
    'NOTICE_SERVED',
    'TERMINATED',
    'RENEWED'
  ]).default('ACTIVE'),
  paymentFrequency: z.string()
    .max(50, 'Payment frequency must not exceed 50 characters')
    .optional()
    .or(z.literal('')),
  securityDeposit: z.number()
    .positive('Security deposit must be a positive number')
    .max(1000000000, 'Security deposit seems unreasonably high')
    .multipleOf(0.01, 'Security deposit must have at most 2 decimal places')
    .optional(),
  propertyId: z.string().cuid('Invalid property ID'),
}).refine(
  (data) => data.expiryDate > data.startDate,
  {
    message: 'Expiry date must be after start date',
    path: ['expiryDate'],
  }
);

export type TenancyInput = z.infer<typeof TenancySchema>;

// Schema for updating tenancy (all fields optional except ID)
export const UpdateTenancySchema = TenancySchema.partial().required({ id: true });

export type UpdateTenancyInput = z.infer<typeof UpdateTenancySchema>;

// ============================================
// PAYMENT SCHEMA (Financial Tracking)
// ============================================

export const PaymentSchema = z.object({
  id: z.string().cuid().optional(),
  amount: z.number()
    .positive('Payment amount must be positive')
    .max(1000000000, 'Payment amount seems unreasonably high')
    .multipleOf(0.01, 'Amount must have at most 2 decimal places'),
  date: z.date(),
  type: z.enum(['RENT', 'SERVICE_CHARGE', 'LEGAL_FEE', 'CAUTION']),
  method: z.enum(['CASH', 'TRANSFER', 'CHEQUE']),
  reference: z.string()
    .max(100, 'Reference must not exceed 100 characters')
    .optional()
    .or(z.literal('')),
  notes: z.string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
  tenancyId: z.string().cuid('Invalid tenancy ID'),
  recordedBy: z.string().cuid('Invalid user ID').optional(), // Will be set server-side
});

export type PaymentInput = z.infer<typeof PaymentSchema>;

// ============================================
// AUDIT LOG SCHEMA
// ============================================

export const AuditLogSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  entityType: z.string().min(1, 'Entity type is required'),
  entityId: z.string().min(1, 'Entity ID is required'),
  performedBy: z.string().cuid('Invalid user ID'),
  details: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export type AuditLogInput = z.infer<typeof AuditLogSchema>;

// ============================================
// NOTIFICATION LOG SCHEMA
// ============================================

export const NotificationLogSchema = z.object({
  type: z.enum(['EMAIL', 'SMS', 'SYSTEM_ALERT']),
  recipient: z.string().min(1, 'Recipient is required'),
  subject: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  status: z.enum(['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED']).default('PENDING'),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

export type NotificationLogInput = z.infer<typeof NotificationLogSchema>;

/**
 * USAGE IN SERVER ACTIONS:
 * 
 * import { ClientSchema } from '@/types/schema';
 * 
 * export async function createClient(formData: FormData) {
 *   'use server';
 *   
 *   // Parse and validate input
 *   const result = ClientSchema.safeParse({
 *     firstName: formData.get('firstName'),
 *     lastName: formData.get('lastName'),
 *     // ... other fields
 *   });
 *   
 *   if (!result.success) {
 *     return { error: result.error.flatten() };
 *   }
 *   
 *   // Data is now type-safe and validated
 *   const validatedData = result.data;
 *   
 *   // Encrypt PII before saving
 *   if (validatedData.nin) {
 *     validatedData.nin = encrypt(validatedData.nin);
 *   }
 *   
 *   // Save to database...
 * }
 * 
 * USAGE IN REACT-HOOK-FORM:
 * 
 * import { zodResolver } from '@hookform/resolvers/zod';
 * import { useForm } from 'react-hook-form';
 * import { ClientSchema, type ClientInput } from '@/types/schema';
 * 
 * const form = useForm<ClientInput>({
 *   resolver: zodResolver(ClientSchema),
 *   defaultValues: {
 *     firstName: '',
 *     lastName: '',
 *     // ...
 *   },
 * });
 */
