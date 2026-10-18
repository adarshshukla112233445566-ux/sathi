/*
# Update demo citizen email to indiasaathi.ai domain

1. Changes
   - Update demo@nagpursaathi.ai to demo@indiasaathi.ai
   - Update priya@nagpursaathi.ai to priya@indiasaathi.ai

2. Notes
   - Ensures demo login button with demo@indiasaathi.ai works
*/

UPDATE auth.users SET email = 'demo@indiasaathi.ai' WHERE email = 'demo@nagpursaathi.ai' AND NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'demo@indiasaathi.ai');
UPDATE auth.users SET email = 'priya@indiasaathi.ai' WHERE email = 'priya@nagpursaathi.ai' AND NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'priya@indiasaathi.ai');
