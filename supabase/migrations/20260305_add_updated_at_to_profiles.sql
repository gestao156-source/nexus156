/*
  Add updated_at column to profiles table
  
  This migration adds the missing updated_at column to the profiles table
  to support the RPC functions that need to track when profiles are modified.
*/

-- Add updated_at column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create index on updated_at for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);

-- Update existing records to have a proper updated_at timestamp
UPDATE profiles 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Add comment to the column
COMMENT ON COLUMN profiles.updated_at IS 'Timestamp of when the profile was last updated';
