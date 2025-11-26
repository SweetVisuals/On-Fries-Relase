-- Remove extra columns from suppliers table if they exist
ALTER TABLE suppliers 
DROP COLUMN IF EXISTS contact_person,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS address;
