-- Append " (Online)" to class names when missing
-- Preview before running:
-- SELECT id, name FROM public.classes WHERE name NOT ILIKE '%(Online)%' ORDER BY id;

BEGIN;
UPDATE public.classes
SET name = name || ' (Online)'
WHERE name NOT ILIKE '%(Online)%';
COMMIT;
