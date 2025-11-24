# Legal Property Management System - Server-First Architecture

## 🏗️ Architecture Overview

This is a **high-integrity legal technology application** built with a "Server-First" approach, prioritizing **data security**, **audit trails**, and **NDPR compliance** (Nigerian Data Protection Regulation).

### Core Principles

1. **Security by Design**: PII encrypted at application layer
2. **Audit Everything**: Immutable audit logs for all critical operations
3. **Type Safety**: Zod validation + TypeScript for runtime and compile-time safety
4. **Server-Side Logic**: Business rules in Server Actions, not client components
5. **Connection Efficiency**: Singleton pattern prevents database exhaustion

---

## 📁 Folder Structure

```
src/
├── app/              # Next.js App Router (UI layer)
├── lib/              # Singleton instances
│   ├── db.ts         # Global PrismaClient instance
│   └── utils.ts      # Shadcn utility functions
├── server/           # Server Actions (mutations/queries)
│   └── (future: actions for clients, properties, tenancies)
├── utils/            # Helper functions
│   └── encryption.ts # AES-256-CBC encryption for PII
└── types/            # Validation & Type definitions
    └── schema.ts     # Zod schemas matching Prisma models

prisma/
└── schema.prisma     # PostgreSQL database schema ("The Constitution")
```

---

## 🗄️ Database Schema

### Models

1. **User** - Legal practitioners (Admin, Associate, Viewer roles)
2. **Client** - Property owners/landlords (PII encrypted: NIN, BVN)
3. **Property** - Legal assets (Title types: C of O, Deeds, etc.)
4. **Tenancy** - Lease agreements (Status tracking, expiry alerts)
5. **AuditLog** - Immutable record of all actions (WHO did WHAT, WHEN)
6. **NotificationLog** - Legal proof of email/SMS delivery
7. **Account/Session/VerificationToken** - NextAuth.js authentication

### Key Features

- **Indexed Fields**: `expiryDate` for tenancy alerts, `email` for fast lookups
- **Cascading Deletes**: Client deletion removes properties and tenancies
- **Enums**: Nigerian states, title types, tenancy statuses
- **JSON Fields**: Flexible audit log details

---

## 🔐 Security Implementation

### 1. Encryption (CIA Triad)

**File**: `src/utils/encryption.ts`

```typescript
import { encrypt, decrypt } from '@/utils/encryption';

// ALWAYS encrypt PII before saving
const encryptedNIN = encrypt(rawNIN);
await prisma.client.create({ data: { nin: encryptedNIN } });

// Only decrypt when absolutely necessary
const client = await prisma.client.findUnique({ where: { id } });
const displayNIN = client.nin ? decrypt(client.nin) : null;
```

**Setup Required**:
```bash
# Generate encryption key (run once)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
ENCRYPTION_KEY=your_64_character_hex_string_here
```

### 2. Validation (Defense in Depth)

**File**: `src/types/schema.ts`

```typescript
import { ClientSchema } from '@/types/schema';

// Server Action validation
export async function createClient(formData: FormData) {
  'use server';
  
  const result = ClientSchema.safeParse({
    firstName: formData.get('firstName'),
    // ...
  });
  
  if (!result.success) {
    return { error: result.error.flatten() };
  }
  
  // Data is type-safe and validated
  const validatedData = result.data;
}
```

### 3. Audit Logging

Every sensitive operation should create an audit log:

```typescript
await prisma.auditLog.create({
  data: {
    action: 'UPDATE_CLIENT_NIN',
    entityType: 'Client',
    entityId: client.id,
    performedBy: session.user.id,
    details: { oldNIN: '***', newNIN: '***' }, // Never log raw PII
    ipAddress: request.ip,
    userAgent: request.headers.get('user-agent'),
  },
});
```

---

## 🚀 Next Steps

### 1. Configure Database

Update `.env` with your PostgreSQL connection:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/legal_property_mgmt"
ENCRYPTION_KEY="your_generated_64_char_hex_key"
```

### 2. Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init
```

### 3. Seed Database (Optional)

Create `prisma/seed.ts` to populate initial admin user.

### 4. Create Server Actions

Next, create files in `src/server/`:
- `clients.ts` - CRUD operations for clients
- `properties.ts` - Property management
- `tenancies.ts` - Lease tracking
- `audit.ts` - Audit log queries

### 5. Build UI Components

Use Shadcn UI components with `react-hook-form` + Zod validation.

---

## ⚠️ Critical Security Rules

1. **NEVER** store raw PII (NIN, BVN) in database
2. **NEVER** log decrypted PII to console or error tracking
3. **ALWAYS** validate input with Zod before processing
4. **ALWAYS** create audit logs for sensitive operations
5. **ALWAYS** use Server Actions for database operations (never expose Prisma to client)

---

## 🧪 Testing Encryption

```typescript
import { encrypt, decrypt, isEncrypted } from '@/utils/encryption';

const testNIN = "12345678901";
const encrypted = encrypt(testNIN);
console.log("Encrypted:", encrypted); // a1b2c3...e5f6:9f8e7d6c...

const decrypted = decrypt(encrypted);
console.log("Decrypted:", decrypted); // 12345678901

console.log("Is encrypted?", isEncrypted(encrypted)); // true
console.log("Is encrypted?", isEncrypted(testNIN)); // false
```

---

## 📊 Database Indexes (Performance)

The schema includes strategic indexes on:
- `User.email` - Fast login lookups
- `Client.email`, `Client.lastName` - Search optimization
- `Property.ownerId`, `Property.state`, `Property.registrationNumber` - Filter performance
- `Tenancy.expiryDate` - **Critical for expiry alerts**
- `AuditLog.timestamp`, `AuditLog.performedBy` - Audit queries

---

## 📝 Schema Review Checklist

✅ **Completed**:
- [x] User model with role-based access
- [x] Client model with encrypted PII fields
- [x] Property model with Nigerian states enum
- [x] Tenancy model with expiry tracking
- [x] AuditLog model for integrity
- [x] NotificationLog model for legal proof
- [x] NextAuth.js models for authentication
- [x] Strategic database indexes
- [x] Cascading delete relationships
- [x] Singleton PrismaClient pattern
- [x] AES-256-CBC encryption utilities
- [x] Comprehensive Zod validation schemas

---

## 🔍 Next Code Review Focus

Before building UI, review:

1. **Prisma Schema**: Check for missing indexes or relationships
2. **Encryption**: Verify ENCRYPTION_KEY is properly secured
3. **Validation**: Test Zod schemas with edge cases
4. **Audit Strategy**: Define which actions require audit logs

---

## 📚 Key Dependencies

- `@prisma/client` - Type-safe database client
- `next-auth@beta` - Authentication with App Router support
- `zod` - Runtime type validation
- `react-hook-form` + `@hookform/resolvers` - Form validation
- `server-only` - Prevents client-side imports of server code

---

**Ready for review!** The foundational "Server-First" architecture is complete. No UI components have been generated yet, as per requirements.
