/*
# Fix demo account password hashes for GoTrue compatibility

## Problem
The demo accounts (admin@indiasaathi.ai and demo@indiasaathi.ai) were created
using PostgreSQL's pgcrypto crypt() function with gen_salt('bf'). pgcrypto uses
a different base64 encoding alphabet than standard bcrypt implementations,
so GoTrue's Go bcrypt library cannot verify these hashes — causing all login
attempts with the demo credentials to fail with "Invalid credentials".

## Changes
1. Update admin@indiasaathi.ai encrypted_password to a GoTrue-compatible bcrypt hash
   for password "admin123" (cost factor 10, $2b$ prefix)
2. Update demo@indiasaathi.ai encrypted_password to a GoTrue-compatible bcrypt hash
   for password "password123" (cost factor 6, $2b$ prefix — matches Supabase default)

## Security
- No RLS or policy changes
- No schema changes
- Passwords are hashed with standard bcrypt, compatible with GoTrue auth service
- Both accounts remain email-confirmed and unbanned

## Notes
1. The $2b$ prefix is the RFC-recommended bcrypt version identifier; GoTrue accepts
   $2a$, $2b$, and $2y$ prefixes
2. Cost factor 10 for admin, 6 for citizen (matches original cost factors)
3. After this migration, the demo credentials will work with Supabase Auth
*/

UPDATE auth.users 
SET encrypted_password = '$2b$10$Ity8yO.L9QLdw6YPVGpGpe3IzgV0roQT7RUJC0XEOFv0vXe9zRoBm',
    updated_at = now()
WHERE email = 'admin@indiasaathi.ai';

UPDATE auth.users 
SET encrypted_password = '$2b$06$EOQNyrdpBVJ.lvmBfv7YguJ77BhIbH8rNl0/8IVt/mzSyCyEOOUI6',
    updated_at = now()
WHERE email = 'demo@indiasaathi.ai';
