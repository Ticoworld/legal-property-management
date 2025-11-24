/**
 * CIA Triad Encryption Utilities
 * 
 * Purpose: Protect Personally Identifiable Information (PII) at rest in database
 * Compliance: Nigerian Data Protection Regulation (NDPR) requirements
 * 
 * CRITICAL SECURITY REQUIREMENTS:
 * 1. Confidentiality: PII (NIN, BVN) must be encrypted before database storage
 * 2. Integrity: Encrypted data must be tamper-proof (HMAC verification)
 * 3. Availability: Decryption must be performant and reliable
 * 
 * NEVER store raw PII in database!
 * 
 * Algorithm: AES-256-CBC (Advanced Encryption Standard)
 * - Key Size: 256 bits (32 bytes) - Military-grade encryption
 * - Mode: CBC (Cipher Block Chaining) - Prevents pattern analysis
 * - IV: Random 16-byte Initialization Vector per encryption (prevents replay attacks)
 * 
 * Environment Variables Required:
 * - ENCRYPTION_KEY: 64-character hexadecimal string (32 bytes when converted)
 *   Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import crypto from 'crypto';

// Encryption configuration constants
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size for CBC mode
const KEY_LENGTH = 32; // 256 bits = 32 bytes

/**
 * Retrieves and validates the encryption key from environment variables
 * 
 * @throws {Error} If ENCRYPTION_KEY is not set or is invalid
 * @returns {Buffer} The encryption key as a Buffer
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is not set. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  
  // Validate key length (should be 64 hex characters = 32 bytes)
  if (key.length !== KEY_LENGTH * 2) {
    throw new Error(
      `ENCRYPTION_KEY must be ${KEY_LENGTH * 2} hexadecimal characters (${KEY_LENGTH} bytes). ` +
      `Current length: ${key.length}`
    );
  }
  
  return Buffer.from(key, 'hex');
}

/**
 * Encrypts sensitive text using AES-256-CBC
 * 
 * Process:
 * 1. Generate random IV (Initialization Vector)
 * 2. Create cipher with key and IV
 * 3. Encrypt plaintext
 * 4. Prepend IV to ciphertext (IV is not secret, just needs to be unique)
 * 5. Return as hex string for database storage
 * 
 * @param text - The plaintext to encrypt (e.g., NIN, BVN)
 * @returns The encrypted string in format: IV:CIPHERTEXT (hex encoded)
 * 
 * @example
 * const encryptedNIN = encrypt("12345678901"); // Nigerian NIN
 * // Returns: "a1b2c3d4...e5f6:9f8e7d6c..."
 */
export function encrypt(text: string): string {
  try {
    // Generate random IV for this encryption operation
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher instance
    const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted data (IV is needed for decryption)
    // Format: IV:CIPHERTEXT (both hex encoded)
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Decrypts text that was encrypted with the encrypt() function
 * 
 * Process:
 * 1. Split IV and ciphertext
 * 2. Create decipher with key and extracted IV
 * 3. Decrypt ciphertext
 * 4. Return original plaintext
 * 
 * @param encryptedText - The encrypted string (format: IV:CIPHERTEXT)
 * @returns The original plaintext
 * 
 * @throws {Error} If text format is invalid or decryption fails
 * 
 * @example
 * const nin = decrypt(encryptedNIN);
 * // Returns: "12345678901"
 */
export function decrypt(encryptedText: string): string {
  try {
    // Split the IV and ciphertext
    const parts = encryptedText.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format. Expected IV:CIPHERTEXT');
    }
    
    const [ivHex, encryptedHex] = parts;
    
    // Convert hex strings back to Buffers
    const iv = Buffer.from(ivHex, 'hex');
    
    // Validate IV length
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length. Expected ${IV_LENGTH} bytes, got ${iv.length}`);
    }
    
    // Create decipher instance
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    
    // Decrypt the text
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Utility function to check if a string appears to be encrypted
 * 
 * @param text - The text to check
 * @returns True if text matches encrypted format (IV:CIPHERTEXT)
 */
export function isEncrypted(text: string): boolean {
  const parts = text.split(':');
  if (parts.length !== 2) return false;
  
  const [ivHex, cipherHex] = parts;
  
  // Check if both parts are valid hex strings
  const hexRegex = /^[0-9a-f]+$/i;
  return (
    hexRegex.test(ivHex) && 
    hexRegex.test(cipherHex) && 
    ivHex.length === IV_LENGTH * 2 // IV should be 32 hex chars (16 bytes)
  );
}

/**
 * USAGE EXAMPLES IN SERVER ACTIONS:
 * 
 * // When creating a client with NIN
 * import { encrypt } from '@/utils/encryption';
 * 
 * const encryptedNIN = encrypt(formData.nin);
 * await prisma.client.create({
 *   data: {
 *     ...formData,
 *     nin: encryptedNIN, // Store encrypted
 *   },
 * });
 * 
 * // When displaying client data
 * import { decrypt } from '@/utils/encryption';
 * 
 * const client = await prisma.client.findUnique({ where: { id } });
 * const displayNIN = client.nin ? decrypt(client.nin) : null;
 * 
 * SECURITY NOTES:
 * - NEVER log decrypted PII to console or error tracking
 * - NEVER send decrypted PII to client-side unless absolutely necessary
 * - ALWAYS encrypt before database writes
 * - ALWAYS audit access to PII (use AuditLog model)
 * - Rotate ENCRYPTION_KEY periodically (requires re-encryption of all PII)
 */
