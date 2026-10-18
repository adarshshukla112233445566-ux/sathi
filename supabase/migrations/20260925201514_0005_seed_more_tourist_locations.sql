/*
# Add FORTS and NATURE categories and seed 15 new tourist locations

1. Changes
   - Alter tourist_locations check constraint to include FORTS and NATURE categories
   - Add 15 new tourist locations across all categories with real Pexels photos
   - Locations span all of India: Delhi, Jaipur, Kashmir, Kerala, Karnataka, Odisha, Tamil Nadu, Punjab, Uttarakhand, UP, Rajasthan

2. Security
   - No new tables; existing RLS unchanged
   - Constraint change is additive only

3. Notes
   - Brings total locations to 32+ across all 7 categories
*/

-- Add FORTS and NATURE to the category check constraint
ALTER TABLE public.tourist_locations DROP CONSTRAINT IF EXISTS tourist_locations_category_check;
ALTER TABLE public.tourist_locations ADD CONSTRAINT tourist_locations_category_check
  CHECK (category = ANY (ARRAY['PARKS'::text, 'HERITAGE'::text, 'LAKES'::text, 'TEMPLES'::text, 'TOURIST_ATTRACTIONS'::text, 'FORTS'::text, 'NATURE'::text]));

-- HERITAGE
INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Red Fort', 'Mughal fort in Delhi with massive red sandstone walls, a UNESCO World Heritage Site.', 'HERITAGE', 28.6562, 77.2410, 'https://images.pexels.com/photos/14094276/pexels-photo-14094276.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Red Fort');

INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Qutub Minar', 'Tallest brick minaret in the world, a 13th-century UNESCO World Heritage Site in Delhi.', 'HERITAGE', 28.5245, 77.1855, 'https://images.pexels.com/photos/16892575/pexels-photo-16892575.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Qutub Minar');

INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Mysore Palace', 'Stunning Indo-Saracenic palace in Mysore, illuminated with thousands of lights on weekends.', 'HERITAGE', 12.3052, 76.6554, 'https://images.pexels.com/photos/9882016/pexels-photo-9882016.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Mysore Palace');

-- FORTS
INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Amer Fort', 'Majestic hilltop fort in Jaipur with mirror palace and scenic Maota Lake views.', 'FORTS', 26.9855, 75.8513, 'https://images.pexels.com/photos/19446861/pexels-photo-19446861.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Amer Fort');

-- TEMPLES
INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Lotus Temple', 'Bahai house of worship shaped like a lotus flower, a modern architectural marvel in Delhi.', 'TEMPLES', 28.5535, 77.2588, 'https://images.pexels.com/photos/4727066/pexels-photo-4727066.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Lotus Temple');

INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Golden Temple', 'Holiest Sikh shrine in Amritsar with a stunning golden facade reflected in the holy pool.', 'TEMPLES', 31.6200, 74.8765, 'https://images.pexels.com/photos/18275890/pexels-photo-18275890.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Golden Temple');

INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Konark Sun Temple', '13th-century sun temple shaped like a chariot, a UNESCO World Heritage Site in Odisha.', 'TEMPLES', 19.8876, 86.0945, 'https://images.pexels.com/photos/6040175/pexels-photo-6040175.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Konark Sun Temple');

INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Meenakshi Temple', 'Magnificent Dravidian temple in Madurai with towering gopurams and vibrant sculptures.', 'TEMPLES', 9.9252, 78.1197, 'https://images.pexels.com/photos/33895627/pexels-photo-33895627.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Meenakshi Temple');

-- LAKES
INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Dal Lake', 'Iconic lake in Srinagar with houseboats, shikaras and floating gardens against Himalayan backdrop.', 'LAKES', 34.1197, 74.8736, 'https://images.pexels.com/photos/18758350/pexels-photo-18758350.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Dal Lake');

INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Lake Pichola', 'Picturesque lake in Udaipur with the floating Lake Palace and City Palace on its shores.', 'LAKES', 24.5745, 73.6655, 'https://images.pexels.com/photos/33658452/pexels-photo-33658452.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Lake Pichola');

-- PARKS
INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Lodhi Garden', 'Beautiful park in Delhi with ancient tombs, manicured lawns and jogging paths.', 'PARKS', 28.5918, 77.2181, 'https://images.pexels.com/photos/12446146/pexels-photo-12446146.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Lodhi Garden');

INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Cubbon Park', 'Lush green park in Bengaluru with 300 acres of trees, statues and walking paths.', 'PARKS', 12.9762, 77.5929, 'https://images.pexels.com/photos/4070763/pexels-photo-4070763.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Cubbon Park');

-- TOURIST_ATTRACTIONS
INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Varanasi Ghats', 'Ancient spiritual city on the Ganges with sacred ghats, rituals and riverside temples.', 'TOURIST_ATTRACTIONS', 25.3176, 82.9739, 'https://images.pexels.com/photos/17869831/pexels-photo-17869831.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Varanasi Ghats');

-- NATURE
INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Kerala Backwaters', 'Tranquil network of palm-fringed canals and lagoons explored on traditional houseboats.', 'NATURE', 9.5277, 76.3866, 'https://images.pexels.com/photos/36998153/pexels-photo-36998153.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Kerala Backwaters');

INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Valley of Flowers', 'UNESCO World Heritage meadow in Uttarakhand blooming with hundreds of alpine flower species.', 'NATURE', 30.7268, 79.6055, 'https://images.pexels.com/photos/32108616/pexels-photo-32108616.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Valley of Flowers');
