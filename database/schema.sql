CREATE DATABASE IF NOT EXISTS village_connect;

USE village_connect;

-- =========================================================
-- 1. VILLAGES
-- =========================================================

CREATE TABLE IF NOT EXISTS villages (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    district VARCHAR(100),
    state VARCHAR(100),

    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 2. USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    mobile VARCHAR(15) NOT NULL UNIQUE,

    email VARCHAR(150) UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    village_id INT,

    occupation VARCHAR(100),

    role ENUM(
        'resident',
        'volunteer',
        'official',
        'admin'
    ) DEFAULT 'resident',

    status ENUM(
        'active',
        'inactive'
    ) DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_village
        FOREIGN KEY (village_id)
        REFERENCES villages(id)
        ON DELETE SET NULL
);


-- =========================================================
-- 3. OFFICES
-- =========================================================

CREATE TABLE IF NOT EXISTS offices (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    office_type VARCHAR(100),

    latitude DECIMAL(10,7),

    longitude DECIMAL(10,7),

    village_id INT,

    contact_phone VARCHAR(15),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_offices_village
        FOREIGN KEY (village_id)
        REFERENCES villages(id)
        ON DELETE SET NULL
);


-- =========================================================
-- 4. COMPLAINTS
-- =========================================================

CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,

    complaint_number VARCHAR(50) NOT NULL UNIQUE,

    user_id INT NOT NULL,

    village_id INT,

    office_id INT,

    category ENUM(
        'Road',
        'Drainage',
        'Garbage',
        'Waterlogging',
        'Other'
    ) NOT NULL,

    severity ENUM(
        'Low',
        'Medium',
        'High',
        'Severe'
    ) DEFAULT 'Medium',

    area VARCHAR(200),

    landmark VARCHAR(200),

    description TEXT,

    latitude DECIMAL(10,7),

    longitude DECIMAL(10,7),

    geo_tagged BOOLEAN DEFAULT FALSE,

    status ENUM(
        'Pending',
        'Forwarded',
        'In Progress',
        'Resolved'
    ) DEFAULT 'Pending',

    priority_score INT DEFAULT 0,

    likes_count INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    resolved_at TIMESTAMP NULL,

    CONSTRAINT fk_complaints_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_complaints_village
        FOREIGN KEY (village_id)
        REFERENCES villages(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_complaints_office
        FOREIGN KEY (office_id)
        REFERENCES offices(id)
        ON DELETE SET NULL
);


-- =========================================================
-- 5. COMPLAINT IMAGES
-- =========================================================

CREATE TABLE IF NOT EXISTS complaint_images (
    id INT AUTO_INCREMENT PRIMARY KEY,

    complaint_id INT NOT NULL,

    image_url VARCHAR(500) NOT NULL,

    storage_public_id VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_complaint_images_complaint
        FOREIGN KEY (complaint_id)
        REFERENCES complaints(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 6. COMPLAINT STATUS HISTORY
-- =========================================================

CREATE TABLE IF NOT EXISTS complaint_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,

    complaint_id INT NOT NULL,

    changed_by INT NOT NULL,

    old_status VARCHAR(50),

    new_status VARCHAR(50),

    remark TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_status_history_complaint
        FOREIGN KEY (complaint_id)
        REFERENCES complaints(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_status_history_user
        FOREIGN KEY (changed_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 7. COMPLAINT FOLLOWERS
-- =========================================================

CREATE TABLE IF NOT EXISTS complaint_followers (
    id INT AUTO_INCREMENT PRIMARY KEY,

    complaint_id INT NOT NULL,

    user_id INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (
        complaint_id,
        user_id
    ),

    CONSTRAINT fk_followers_complaint
        FOREIGN KEY (complaint_id)
        REFERENCES complaints(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_followers_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 8. COMPLAINT LIKES
-- =========================================================

CREATE TABLE IF NOT EXISTS complaint_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    complaint_id INT NOT NULL,

    user_id INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (
        complaint_id,
        user_id
    ),

    CONSTRAINT fk_likes_complaint
        FOREIGN KEY (complaint_id)
        REFERENCES complaints(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_likes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 9. VOLUNTEERS
-- =========================================================

CREATE TABLE IF NOT EXISTS volunteers (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    village_id INT,

    skills VARCHAR(500),

    availability VARCHAR(255),

    approved BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_volunteers_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_volunteers_village
        FOREIGN KEY (village_id)
        REFERENCES villages(id)
        ON DELETE SET NULL
);


-- =========================================================
-- 10. EVENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(200) NOT NULL,

    description TEXT,

    date DATE NOT NULL,

    time TIME,

    venue VARCHAR(255),

    organizer VARCHAR(150),

    village_id INT,

    created_by INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_events_village
        FOREIGN KEY (village_id)
        REFERENCES villages(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_events_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- =========================================================
-- 11. EVENT REGISTRATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS event_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,

    event_id INT NOT NULL,

    user_id INT NOT NULL,

    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (
        event_id,
        user_id
    ),

    CONSTRAINT fk_event_reg_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_event_reg_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 12. POLLS
-- =========================================================

CREATE TABLE IF NOT EXISTS polls (
    id INT AUTO_INCREMENT PRIMARY KEY,

    question TEXT NOT NULL,

    village_id INT,

    created_by INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_polls_village
        FOREIGN KEY (village_id)
        REFERENCES villages(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_polls_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- =========================================================
-- 13. POLL OPTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS poll_options (
    id INT AUTO_INCREMENT PRIMARY KEY,

    poll_id INT NOT NULL,

    option_text VARCHAR(255) NOT NULL,

    CONSTRAINT fk_poll_options_poll
        FOREIGN KEY (poll_id)
        REFERENCES polls(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 14. POLL VOTES
-- =========================================================

CREATE TABLE IF NOT EXISTS poll_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    poll_id INT NOT NULL,

    option_id INT NOT NULL,

    user_id INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (
        poll_id,
        user_id
    ),

    CONSTRAINT fk_poll_votes_poll
        FOREIGN KEY (poll_id)
        REFERENCES polls(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_poll_votes_option
        FOREIGN KEY (option_id)
        REFERENCES poll_options(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_poll_votes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 15. CHAT MESSAGES
-- =========================================================

CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,

    village_id INT NOT NULL,

    user_id INT NOT NULL,

    message TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_chat_village
        FOREIGN KEY (village_id)
        REFERENCES villages(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_chat_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 16. NOTIFICATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    complaint_id INT NULL,

    event_id INT NULL,

    title VARCHAR(200) NOT NULL,

    message TEXT NOT NULL,

    type VARCHAR(50),

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_complaint
        FOREIGN KEY (complaint_id)
        REFERENCES complaints(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE
);