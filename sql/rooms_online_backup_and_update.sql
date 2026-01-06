-- Backup current rooms, set all rooms to 'Online', and provide restore

-- 1) Backup current rooms (run once):
CREATE TABLE IF NOT EXISTS public.classes_room_backup AS
SELECT id, room, now() AS backed_up_at
FROM public.classes;

CREATE INDEX IF NOT EXISTS classes_room_backup_id_idx ON public.classes_room_backup(id);

-- 2) Set rooms to Online (no-op if already 'Online'):
BEGIN;
UPDATE public.classes
SET room = 'Online'
WHERE room NOT ILIKE 'online';
COMMIT;

-- 3) Restore from backup (if needed):
-- BEGIN;
-- UPDATE public.classes c
-- SET room = b.room
-- FROM public.classes_room_backup b
-- WHERE c.id = b.id;
-- COMMIT;

-- Optionally drop backup when satisfied:
-- DROP TABLE public.classes_room_backup;
