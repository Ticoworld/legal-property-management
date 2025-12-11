-- Direct SQL seed for admin user
-- Run this with: psql <your-database-url> < seed.sql

-- Insert admin user
INSERT INTO users (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'admin_' || substr(md5(random()::text), 1, 20),
  'admin@legalapp.com',
  'K. C. Ogodo',
  '$2a$10$YourHashedPasswordHere',  -- This will be replaced
  'SUPER_ADMIN',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Insert firm settings
INSERT INTO firm_settings (id, "firmName", "chambersName", address, city, state, "solicitorName", "solicitorTitle", "createdAt", "updatedAt")
VALUES (
  'settings_' || substr(md5(random()::text), 1, 20),
  'Ogodo, Ogodo & Co.',
  'Beracah Chambers',
  '14 Ojeawere Street, Abakaliki, Ebonyi State',
  'Abakaliki',
  'Ebonyi',
  'K. O. Ogboso, Esq.',
  'Legal Practitioner',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;
