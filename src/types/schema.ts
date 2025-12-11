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
  role: z.enum(['SUPER_ADMIN', 'MANAGER', 'ASSOCIATE', 'VIEWER']).default('VIEWER'),
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
  bankName: z.string()
    .max(100, 'Bank name must not exceed 100 characters')
    .optional()
    .or(z.literal('')),
  accountNumber: z.string()
    .regex(/^\d{10}$/, 'Account number must be exactly 10 digits')
    .optional()
    .or(z.literal('')),
  accountName: z.string()
    .max(100, 'Account name must not exceed 100 characters')
    .optional()
    .or(z.literal('')),
  bvn: z.string()
    .regex(bvnPattern, 'BVN must be exactly 11 digits')
    .optional()
    .or(z.literal('')), // Allow empty string for optional field
  passportUrl: z.string().optional(),
  // Personal details for legal documents
  title: z.string().max(20, 'Title must not exceed 20 characters').optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'CORPORATE']).default('MALE'),
});

export type ClientInput = z.infer<typeof ClientSchema>;

// Schema for updating client (all fields optional except ID)
export const UpdateClientSchema = ClientSchema.partial().required({ id: true });

export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;

// ============================================
// PROPERTY SCHEMA (Legal Assets)
// ============================================

// Property Unit Configuration for multi-unit properties
export const PropertyUnitConfigSchema = z.object({
  type: z.enum([
    'ROOM_PARLOUR',
    'SELF_CONTAIN',
    'ONE_BEDROOM',
    'TWO_BEDROOM',
    'THREE_BEDROOM',
    'FOUR_BEDROOM',
    'DUPLEX',
    'SHOP',
    'WAREHOUSE',
    'PLOT_OF_LAND',
    'OFFICE'
  ], { message: 'Please select a valid unit type' }),
  quantity: z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be at least 1')
    .max(100, 'Quantity cannot exceed 100 units'),
  marketRent: z.number()
    .positive('Market rent must be a positive number')
    .max(1000000000, 'Market rent seems unreasonably high')
    .multipleOf(0.01, 'Market rent must have at most 2 decimal places')
    .optional(),
  bedrooms: z.number()
    .int('Bedrooms must be a whole number')
    .min(0, 'Bedrooms cannot be negative')
    .max(10, 'Bedrooms seems unreasonably high')
    .optional(),
  bathrooms: z.number()
    .int('Bathrooms must be a whole number')
    .min(0, 'Bathrooms cannot be negative')
    .max(10, 'Bathrooms seems unreasonably high')
    .optional(),
});

export type PropertyUnitConfig = z.infer<typeof PropertyUnitConfigSchema>;

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
    'IRREVOCABLE_POWER_OF_ATTORNEY',
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

  structureType: z.enum([
    'SINGLE_UNIT',
    'BLOCK_OF_FLATS',
    'SHOPPING_COMPLEX',
    'ESTATE',
    'LAND'
  ], { message: 'Please select a valid structure type' }),
  units: z.array(PropertyUnitConfigSchema).optional(), // For multi-unit properties
  ownerId: z.string().cuid('Invalid client ID'),
}).refine(
  (data) => {
    // If multi-unit structure, units array must be provided
    const multiUnitTypes = ['BLOCK_OF_FLATS', 'SHOPPING_COMPLEX', 'ESTATE'];
    if (multiUnitTypes.includes(data.structureType) && (!data.units || data.units.length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: 'Multi-unit properties must have at least one unit configuration',
    path: ['units'],
  }
);

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
  tenantPassportUrl: z.string().optional(),
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
  paymentFrequency: z.enum([
    'ANNUALLY',
    'BI_ANNUALLY',
    'QUARTERLY',
    'MONTHLY'
  ]).default('ANNUALLY'),
  securityDeposit: z.number()
    .positive('Security deposit must be a positive number')
    .max(1000000000, 'Security deposit seems unreasonably high')
    .multipleOf(0.01, 'Security deposit must have at most 2 decimal places')
    .optional(),
  propertyId: z.string().cuid('Invalid property ID'),
  unitId: z.string().cuid('Invalid unit ID').optional().or(z.literal('')), // Optional: For multi-unit properties
  // Guarantor Details (Optional)
  guarantorName: z.string().optional().or(z.literal('')),
  guarantorPhone: z.string().optional().or(z.literal('')),
  guarantorEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  guarantorAddress: z.string().optional().or(z.literal('')),
  // Next of Kin (Optional)
  nextOfKinName: z.string().optional().or(z.literal('')),
  nextOfKinPhone: z.string().optional().or(z.literal('')),
  nextOfKinRelationship: z.string().optional().or(z.literal('')),
  // Personal details for legal documents
  tenantTitle: z.string().max(20, 'Title must not exceed 20 characters').optional().or(z.literal('')),
  tenantGender: z.enum(['MALE', 'FEMALE', 'CORPORATE']).default('MALE'),
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
// EXPENSE SCHEMA (Operational Costs)
// ============================================

export const ExpenseSchema = z.object({
  id: z.string().cuid().optional(),
  amount: z.number()
    .positive('Expense amount must be positive')
    .max(1000000000, 'Expense amount seems unreasonably high')
    .multipleOf(0.01, 'Amount must have at most 2 decimal places'),
  date: z.date(),
  category: z.enum(['REPAIR', 'AGENCY_FEE', 'LEGAL_FEE', 'UTILITY', 'OTHER']),
  description: z.string()
    .min(3, 'Description must be at least 3 characters')
    .max(500, 'Description must not exceed 500 characters'),
  tenancyId: z.string().cuid('Invalid tenancy ID').optional(),
  propertyId: z.string().cuid('Invalid property ID'),
  recordedBy: z.string().cuid('Invalid user ID').optional(), // Will be set server-side
});

export type ExpenseInput = z.infer<typeof ExpenseSchema>;


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
