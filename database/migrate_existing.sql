USE village_connect;

-- =========================================================
-- 1. FIX EVENTS TABLE COLUMN NAMES
-- =========================================================
-- Old schema:
--     event_date
--     event_time
--
-- Application:
--     date
--     time
--
-- Rename only if the old columns still exist.
-- =========================================================

SET @event_date_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'events'
      AND column_name = 'event_date'
);

SET @sql = IF(
    @event_date_exists > 0,
    'ALTER TABLE events CHANGE COLUMN event_date date DATE NOT NULL',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @event_time_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'events'
      AND column_name = 'event_time'
);

SET @sql = IF(
    @event_time_exists > 0,
    'ALTER TABLE events CHANGE COLUMN event_time time TIME',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- =========================================================
-- 2. MAKE SURE COMPLAINT VILLAGE IDs ARE PRESENT
-- =========================================================
-- Existing complaints may have village_id = NULL.
-- Derive the village from the complaint owner.
-- =========================================================

UPDATE complaints c
INNER JOIN users u
    ON u.id = c.user_id
SET c.village_id = u.village_id
WHERE c.village_id IS NULL
  AND u.village_id IS NOT NULL;


-- =========================================================
-- 3. MAKE SURE VOLUNTEER VILLAGE IDs ARE PRESENT
-- =========================================================
-- Derive volunteer village from the linked user.
-- =========================================================

UPDATE volunteers v
INNER JOIN users u
    ON u.id = v.user_id
SET v.village_id = u.village_id
WHERE v.village_id IS NULL
  AND u.village_id IS NOT NULL;


-- =========================================================
-- 4. VERIFY EVENTS TABLE
-- =========================================================

SELECT
    id,
    title,
    date,
    time,
    village_id
FROM events
ORDER BY id;


-- =========================================================
-- 5. VERIFY COMPLAINT VILLAGE DATA
-- =========================================================

SELECT
    c.id,
    c.complaint_number,
    c.user_id,
    c.village_id
FROM complaints c
ORDER BY c.id;


-- =========================================================
-- 6. VERIFY VOLUNTEER VILLAGE DATA
-- =========================================================

SELECT
    v.id,
    v.user_id,
    v.village_id,
    v.approved
FROM volunteers v
ORDER BY v.id;