/*
# Rebrand tracking ID prefix and seed reference data

1. Changes
   - Update tracking ID prefix from 'NS-' to 'ISA-' (India Saathi AI)
   - Seed departments (8 departments for civic issue routing)
   - Seed tourist_locations with real Indian landmarks and photos
   - Seed hospitals with Indian demo data
   - Seed emergency_services with Indian demo data
   - Seed transport_routes with demo bus/metro routes
   - Seed traffic_incidents with demo data (using valid check constraint values)

2. Security
   - No new tables; existing RLS policies unchanged
   - All inserts use WHERE NOT EXISTS for idempotency

3. Notes
   - Tracking ID prefix change only affects NEW complaints
   - Tourist locations include real Pexels image URLs for photo display
*/

-- Update tracking ID prefix
CREATE OR REPLACE FUNCTION public.generate_tracking_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'ISA-' || EXTRACT(YEAR FROM now())::text || '-' ||
         lpad(nextval('public.complaint_tracking_seq')::text, 6, '0')
$$;

-- Seed departments (name has unique constraint)
INSERT INTO public.departments (name, description) VALUES
  ('Road Maintenance', 'Potholes, road surface damage, and road infrastructure'),
  ('Waste Management', 'Garbage collection, waste disposal, and sanitation'),
  ('Electrical Department', 'Streetlights, electrical infrastructure, and power supply'),
  ('Water Department', 'Water supply, pipelines, and water quality'),
  ('Drainage Department', 'Drainage systems, flooding, and sewage'),
  ('Traffic Department', 'Traffic signals, road safety, and traffic management'),
  ('Animal Rescue', 'Injured or stranded animal rescue and welfare'),
  ('Emergency Response', 'Emergency services and disaster response')
ON CONFLICT (name) DO NOTHING;

-- Seed tourist locations with real Indian landmarks and photos
INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Taj Mahal', 'Iconic white marble mausoleum in Agra, one of the Seven Wonders of the World.', 'HERITAGE', 27.1751, 78.0421, 'https://images.pexels.com/photos/11948442/pexels-photo-11948442.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Taj Mahal');

INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'India Gate', 'War memorial arch in New Delhi commemorating Indian soldiers who died in WWI.', 'HERITAGE', 28.6129, 77.2295, 'https://images.pexels.com/photos/789750/pexels-photo-789750.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'India Gate');

INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Gateway of India', 'Iconic arch monument on the Mumbai waterfront overlooking the Arabian Sea.', 'HERITAGE', 18.9220, 72.8347, 'https://images.pexels.com/photos/36874536/pexels-photo-36874536.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Gateway of India');

INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Hawa Mahal', 'Palace of Winds in Jaipur with intricate pink sandstone facade and 953 windows.', 'HERITAGE', 26.9239, 75.8267, 'https://images.pexels.com/photos/784885/pexels-photo-784885.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Hawa Mahal');

INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Charminar', '16th-century mosque and monument with four minarets in the heart of Hyderabad.', 'HERITAGE', 17.3616, 78.4747, 'https://images.pexels.com/photos/11321242/pexels-photo-11321242.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Charminar');

INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Marine Drive', 'Famous curved promenade along the Mumbai coastline with stunning sunset views.', 'TOURIST_ATTRACTIONS', 18.9436, 72.8236, 'https://images.pexels.com/photos/35709783/pexels-photo-35709783.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Marine Drive');

INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Ellora Caves', 'UNESCO World Heritage site with 34 rock-cut caves showcasing Buddhist, Hindu and Jain art.', 'HERITAGE', 20.0269, 75.1797, 'https://images.pexels.com/photos/31912392/pexels-photo-31912392.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Ellora Caves');

INSERT INTO public.tourist_locations (name, description, category, latitude, longitude, image_url)
SELECT 'Sanchi Stupa', 'Ancient Buddhist stupa and UNESCO World Heritage site in Madhya Pradesh.', 'TEMPLES', 23.4793, 77.7398, 'https://images.pexels.com/photos/36588603/pexels-photo-36588603.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE NOT EXISTS (SELECT 1 FROM public.tourist_locations WHERE name = 'Sanchi Stupa');

-- Seed hospitals
INSERT INTO public.hospitals (name, address, phone, emergency_available, latitude, longitude)
SELECT 'AIIMS Delhi', 'Ansari Nagar, New Delhi', '011-26588500', true, 28.5672, 77.2100
WHERE NOT EXISTS (SELECT 1 FROM public.hospitals WHERE name = 'AIIMS Delhi');

INSERT INTO public.hospitals (name, address, phone, emergency_available, latitude, longitude)
SELECT 'Apollo Hospitals', 'Greams Road, Chennai', '044-28293333', true, 13.0605, 80.2496
WHERE NOT EXISTS (SELECT 1 FROM public.hospitals WHERE name = 'Apollo Hospitals');

INSERT INTO public.hospitals (name, address, phone, emergency_available, latitude, longitude)
SELECT 'Fortis Hospital', 'Mulund, Mumbai', '022-61522000', true, 19.1726, 72.8567
WHERE NOT EXISTS (SELECT 1 FROM public.hospitals WHERE name = 'Fortis Hospital');

INSERT INTO public.hospitals (name, address, phone, emergency_available, latitude, longitude)
SELECT 'Government Medical College', 'Nagpur, Maharashtra', '0712-2741234', true, 21.1490, 79.0882
WHERE NOT EXISTS (SELECT 1 FROM public.hospitals WHERE name = 'Government Medical College');

-- Seed emergency services
INSERT INTO public.emergency_services (name, type, phone, address, latitude, longitude)
SELECT 'Police Control Room', 'POLICE', '100', 'All India', 28.6129, 77.2295
WHERE NOT EXISTS (SELECT 1 FROM public.emergency_services WHERE name = 'Police Control Room');

INSERT INTO public.emergency_services (name, type, phone, address, latitude, longitude)
SELECT 'Ambulance Service', 'AMBULANCE', '108', 'All India', 19.0760, 72.8777
WHERE NOT EXISTS (SELECT 1 FROM public.emergency_services WHERE name = 'Ambulance Service');

INSERT INTO public.emergency_services (name, type, phone, address, latitude, longitude)
SELECT 'Fire Brigade', 'FIRE', '101', 'All India', 12.9716, 77.5946
WHERE NOT EXISTS (SELECT 1 FROM public.emergency_services WHERE name = 'Fire Brigade');

-- Seed transport routes
INSERT INTO public.transport_routes (route_name, route_type, stops, estimated_duration_min)
SELECT 'Metro Line 1 - Blue Line', 'METRO', ARRAY['Dwarka Sector 21','Dwarka','Janakpuri West','Rajouri Garden','Karol Bagh','Rajiv Chowk','Barakhamba','Yamuna Bank','Noida City Centre'], 55
WHERE NOT EXISTS (SELECT 1 FROM public.transport_routes WHERE route_name = 'Metro Line 1 - Blue Line');

INSERT INTO public.transport_routes (route_name, route_type, stops, estimated_duration_min)
SELECT 'Metro Line 2 - Yellow Line', 'METRO', ARRAY['Samaypur Badli','Rohini','Pitampura','Model Town','Civil Lines','Kashmere Gate','Chandni Chowk','Rajiv Chowk','Patel Chowk','Central Secretariat','Jor Bagh','HUDA City Centre'], 65
WHERE NOT EXISTS (SELECT 1 FROM public.transport_routes WHERE route_name = 'Metro Line 2 - Yellow Line');

INSERT INTO public.transport_routes (route_name, route_type, stops, estimated_duration_min)
SELECT 'Bus Route 7 - Express', 'BUS', ARRAY['CSMT','Byculla','Mahalaxmi','Worli','Haji Ali','Bandra','Andheri','Goregaon','Borivali'], 90
WHERE NOT EXISTS (SELECT 1 FROM public.transport_routes WHERE route_name = 'Bus Route 7 - Express');

-- Seed traffic incidents (valid types: ACCIDENT, CONGESTION, ROAD_WORK, CLOSURE, ALERT)
INSERT INTO public.traffic_incidents (incident_type, severity, road_name, description, latitude, longitude)
SELECT 'CONGESTION', 'HIGH', 'Andheri Flyover, Mumbai', 'Heavy traffic congestion on Andheri flyover during peak hours', 19.1197, 72.8468
WHERE NOT EXISTS (SELECT 1 FROM public.traffic_incidents WHERE road_name = 'Andheri Flyover, Mumbai');

INSERT INTO public.traffic_incidents (incident_type, severity, road_name, description, latitude, longitude)
SELECT 'ACCIDENT', 'CRITICAL', 'NH-48, Gurgaon', 'Vehicle collision reported on NH-48 near IFFCO Chowk', 28.4593, 77.0642
WHERE NOT EXISTS (SELECT 1 FROM public.traffic_incidents WHERE road_name = 'NH-48, Gurgaon');

INSERT INTO public.traffic_incidents (incident_type, severity, road_name, description, latitude, longitude)
SELECT 'ROAD_WORK', 'MEDIUM', 'MG Road, Pune', 'Partial road closure due to construction work', 18.5308, 73.8448
WHERE NOT EXISTS (SELECT 1 FROM public.traffic_incidents WHERE road_name = 'MG Road, Pune');

INSERT INTO public.traffic_incidents (incident_type, severity, road_name, description, latitude, longitude)
SELECT 'CONGESTION', 'MEDIUM', 'Outer Ring Road, Bengaluru', 'Slow-moving traffic on Outer Ring Road near Marathahalli', 12.9569, 77.7011
WHERE NOT EXISTS (SELECT 1 FROM public.traffic_incidents WHERE road_name = 'Outer Ring Road, Bengaluru');
