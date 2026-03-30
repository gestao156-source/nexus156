/*
  Remove Obsolete Reset Password RPC Functions
  
  These functions were replaced by Edge Function and are no longer needed.
*/

-- Drop obsolete RPC functions
DROP FUNCTION IF EXISTS reset_user_password(uuid);
DROP FUNCTION IF EXISTS reset_user_password_real(uuid, text);

-- Note: Edge Function reset-user-password is now the only method
