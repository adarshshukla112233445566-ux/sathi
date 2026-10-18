/*
# Fix admin demo password and Nagpur tourist location images

## Changes
1. Reset admin@indiasaathi.ai password with a GoTrue-compatible bcrypt hash
   for password "admin123"
2. Update fake placeholder image_url values for Nagpur tourist locations
   with real Pexels photo URLs

## Security
- No schema or RLS changes
- Password hash uses standard bcrypt ($2b$ prefix, cost 10)
*/

-- Fix admin password with GoTrue-compatible bcrypt hash
UPDATE auth.users
SET encrypted_password = '$2b$10$E1hVcRlu.EoxmHub9hjnzOcAXkESi616KsferFILm99x2VIr.K9uG',
    updated_at = now()
WHERE email = 'admin@indiasaathi.ai';

-- Fix Nagpur tourist location images with real Pexels photo URLs
UPDATE tourist_locations SET image_url = 'https://images.pexels.com/photos/35933420/pexels-photo-35933420.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Ambazari Lake';
UPDATE tourist_locations SET image_url = 'https://images.pexels.com/photos/40241088/pexels-photo-40241088.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Deekshabhoomi';
UPDATE tourist_locations SET image_url = 'https://images.pexels.com/photos/13137210/pexels-photo-13137210.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Futala Lake';
UPDATE tourist_locations SET image_url = 'https://images.pexels.com/photos/9304308/pexels-photo-9304308.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Gandhi Sagar Lake';
UPDATE tourist_locations SET image_url = 'https://images.pexels.com/photos/30639519/pexels-photo-30639519.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Sitabuldi Fort';
UPDATE tourist_locations SET image_url = 'https://images.pexels.com/photos/31981248/pexels-photo-31981248.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Japanese Garden';
UPDATE tourist_locations SET image_url = 'https://images.pexels.com/photos/29586035/pexels-photo-29586035.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Maharajbagh Zoo';
UPDATE tourist_locations SET image_url = 'https://images.pexels.com/photos/30722659/pexels-photo-30722659.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Tekdi Ganesh Temple';
UPDATE tourist_locations SET image_url = 'https://images.pexels.com/photos/11370871/pexels-photo-11370871.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Ramtek Temple';
UPDATE tourist_locations SET image_url = 'https://images.pexels.com/photos/12601505/pexels-photo-12601505.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Nagzira Wildlife Sanctuary';
