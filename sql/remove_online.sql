-- Remove trailing " (Online)" from class names
-- Preview:
-- SELECT id, name FROM public.classes WHERE name ILIKE '%(Online)%' ORDER BY id;

BEGIN;
UPDATE public.classes
SET name = regexp_replace(name, '\\s*\\(Online\\)\\s*$', '')
WHERE name ILIKE '%(Online)%';
COMMIT;
