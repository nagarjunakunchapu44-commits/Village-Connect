USE village_connect;

-- =========================================================
-- VILLAGES
-- =========================================================

INSERT INTO villages
(name, district, state, latitude, longitude)
SELECT
    'Kondapalli',
    'NTR',
    'Andhra Pradesh',
    16.61988500,
    80.54244200
WHERE NOT EXISTS (
    SELECT 1
    FROM villages
    WHERE LOWER(TRIM(name)) = 'kondapalli'
);

INSERT INTO villages
(name, district, state, latitude, longitude)
SELECT
    'Gollapudi',
    'NTR',
    'Andhra Pradesh',
    16.53745000,
    80.58490000
WHERE NOT EXISTS (
    SELECT 1
    FROM villages
    WHERE LOWER(TRIM(name)) = 'gollapudi'
);

INSERT INTO villages
(name, district, state, latitude, longitude)
SELECT
    'Ibrahimpatnam',
    'NTR',
    'Andhra Pradesh',
    16.59400000,
    80.52253000
WHERE NOT EXISTS (
    SELECT 1
    FROM villages
    WHERE LOWER(TRIM(name)) = 'ibrahimpatnam'
);


-- =========================================================
-- OFFICES
-- These are common offices, so village_id is NULL.
-- Residents can see these as general offices.
-- =========================================================

INSERT INTO offices
(name, office_type, latitude, longitude, village_id, contact_phone)
SELECT
    'Village Panchayat Office',
    'Panchayat',
    16.50620000,
    80.64800000,
    NULL,
    '9876543210'
WHERE NOT EXISTS (
    SELECT 1
    FROM offices
    WHERE LOWER(TRIM(name)) = 'village panchayat office'
);

INSERT INTO offices
(name, office_type, latitude, longitude, village_id, contact_phone)
SELECT
    'Mandal Revenue Office',
    'Revenue',
    16.50700000,
    80.65000000,
    NULL,
    '9876543211'
WHERE NOT EXISTS (
    SELECT 1
    FROM offices
    WHERE LOWER(TRIM(name)) = 'mandal revenue office'
);

INSERT INTO offices
(name, office_type, latitude, longitude, village_id, contact_phone)
SELECT
    'Municipal Zonal Office',
    'Municipal',
    16.50800000,
    80.65200000,
    NULL,
    '9876543212'
WHERE NOT EXISTS (
    SELECT 1
    FROM offices
    WHERE LOWER(TRIM(name)) = 'municipal zonal office'
);


-- =========================================================
-- EVENTS
-- Village IDs are obtained by village name.
-- We do NOT assume IDs 1, 2 and 3.
-- =========================================================

INSERT INTO events
(
    title,
    description,
    date,
    time,
    venue,
    village_id,
    organizer,
    created_by
)
SELECT
    'Village Cleanliness Drive',
    'Community cleanliness and sanitation awareness program.',
    '2026-10-05',
    '09:00:00',
    'Village Community Hall',
    v.id,
    'Village Panchayat',
    NULL
FROM villages v
WHERE LOWER(TRIM(v.name)) = 'kondapalli'
AND NOT EXISTS (
    SELECT 1
    FROM events e
    WHERE LOWER(TRIM(e.title)) =
          'village cleanliness drive'
);


INSERT INTO events
(
    title,
    description,
    date,
    time,
    venue,
    village_id,
    organizer,
    created_by
)
SELECT
    'Free Health Awareness Camp',
    'Free health awareness and basic health check-up camp for villagers.',
    '2026-10-12',
    '10:00:00',
    'Government School Ground',
    v.id,
    'Village Health Committee',
    NULL
FROM villages v
WHERE LOWER(TRIM(v.name)) = 'gollapudi'
AND NOT EXISTS (
    SELECT 1
    FROM events e
    WHERE LOWER(TRIM(e.title)) =
          'free health awareness camp'
);


INSERT INTO events
(
    title,
    description,
    date,
    time,
    venue,
    village_id,
    organizer,
    created_by
)
SELECT
    'Farmers Awareness Meeting',
    'Awareness meeting about modern farming practices and government schemes.',
    '2026-10-20',
    '14:00:00',
    'Village Panchayat Office',
    v.id,
    'Agriculture Department',
    NULL
FROM villages v
WHERE LOWER(TRIM(v.name)) = 'ibrahimpatnam'
AND NOT EXISTS (
    SELECT 1
    FROM events e
    WHERE LOWER(TRIM(e.title)) =
          'farmers awareness meeting'
);


-- =========================================================
-- SAMPLE POLL
-- This poll belongs to Kondapalli.
-- =========================================================

INSERT INTO polls
(
    question,
    village_id,
    created_by
)
SELECT
    'What should be the main development priority for the village?',
    v.id,
    NULL
FROM villages v
WHERE LOWER(TRIM(v.name)) = 'kondapalli'
AND NOT EXISTS (
    SELECT 1
    FROM polls p
    WHERE LOWER(TRIM(p.question)) =
          'what should be the main development priority for the village?'
);


-- =========================================================
-- POLL OPTIONS
-- =========================================================

SET @poll_id = (
    SELECT id
    FROM polls
    WHERE LOWER(TRIM(question)) =
          'what should be the main development priority for the village?'
    LIMIT 1
);


INSERT INTO poll_options
(
    poll_id,
    option_text
)
SELECT
    @poll_id,
    'Road Development'
WHERE @poll_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM poll_options
    WHERE poll_id = @poll_id
    AND LOWER(TRIM(option_text)) =
        'road development'
);


INSERT INTO poll_options
(
    poll_id,
    option_text
)
SELECT
    @poll_id,
    'Drainage Improvement'
WHERE @poll_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM poll_options
    WHERE poll_id = @poll_id
    AND LOWER(TRIM(option_text)) =
        'drainage improvement'
);


INSERT INTO poll_options
(
    poll_id,
    option_text
)
SELECT
    @poll_id,
    'Street Lighting'
WHERE @poll_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM poll_options
    WHERE poll_id = @poll_id
    AND LOWER(TRIM(option_text)) =
        'street lighting'
);


INSERT INTO poll_options
(
    poll_id,
    option_text
)
SELECT
    @poll_id,
    'Water Supply'
WHERE @poll_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM poll_options
    WHERE poll_id = @poll_id
    AND LOWER(TRIM(option_text)) =
        'water supply'
);