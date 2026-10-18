/*
# Add photos to existing Nagpur tourist locations

1. Changes
   - Update image_url for 9 existing Nagpur locations with real photos
   - Locations: Ambazari Lake, Tekdi Ganesh Temple, Deekshabhoomi, Gandhi Sagar Lake, Maharajbagh Zoo, Sitabuldi Fort, Japanese Garden, Futala Lake, Ramtek Temple, Nagzira Wildlife Sanctuary

2. Security
   - UPDATE only; no schema changes
   - No data loss; only adding image_url to rows that had NULL
*/

UPDATE public.tourist_locations SET image_url = 'https://images.pexels.com/photos/35933420/pexels-photo-35933420.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Ambazari Lake' AND (image_url IS NULL OR image_url = '');

UPDATE public.tourist_locations SET image_url = 'https://images.pexels.com/photos/30722659/pexels-photo-30722659.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Tekdi Ganesh Temple' AND (image_url IS NULL OR image_url = '');

UPDATE public.tourist_locations SET image_url = 'https://images.pexels.com/photos/6650454/pexels-photo-6650454.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Deekshabhoomi' AND (image_url IS NULL OR image_url = '');

UPDATE public.tourist_locations SET image_url = 'https://images.pexels.com/photos/20754100/pexels-photo-20754100.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Gandhi Sagar Lake' AND (image_url IS NULL OR image_url = '');

UPDATE public.tourist_locations SET image_url = 'https://images.pexels.com/photos/31114601/pexels-photo-31114601.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Maharajbagh Zoo' AND (image_url IS NULL OR image_url = '');

UPDATE public.tourist_locations SET image_url = 'https://images.pexels.com/photos/30639519/pexels-photo-30639519.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Sitabuldi Fort' AND (image_url IS NULL OR image_url = '');

UPDATE public.tourist_locations SET image_url = 'https://images.pexels.com/photos/31981248/pexels-photo-31981248.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Japanese Garden' AND (image_url IS NULL OR image_url = '');

UPDATE public.tourist_locations SET image_url = 'https://images.pexels.com/photos/13137210/pexels-photo-13137210.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Futala Lake' AND (image_url IS NULL OR image_url = '');

UPDATE public.tourist_locations SET image_url = 'https://images.pexels.com/photos/18645640/pexels-photo-18645640.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Ramtek Temple' AND (image_url IS NULL OR image_url = '');

UPDATE public.tourist_locations SET image_url = 'https://images.pexels.com/photos/36530920/pexels-photo-36530920.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE name = 'Nagzira Wildlife Sanctuary' AND (image_url IS NULL OR image_url = '');
