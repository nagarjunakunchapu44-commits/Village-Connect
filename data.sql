
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
REPLACE INTO `chat_messages` (`id`, `village_id`, `user_id`, `message`, `created_at`) VALUES (1,2,3,'your village problems will be done after kondapalli','2026-09-27 14:33:30');
REPLACE INTO `chat_messages` (`id`, `village_id`, `user_id`, `message`, `created_at`) VALUES (2,5,6,'hello','2026-11-04 06:14:43');
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;

/*!40000 ALTER TABLE `complaint_followers` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaint_followers` ENABLE KEYS */;

/*!40000 ALTER TABLE `complaint_images` DISABLE KEYS */;
REPLACE INTO `complaint_images` (`id`, `complaint_id`, `image_url`, `storage_public_id`, `created_at`) VALUES (1,3,'/uploads/1789998623682-819004420.jpeg',NULL,'2026-09-21 13:50:23');
REPLACE INTO `complaint_images` (`id`, `complaint_id`, `image_url`, `storage_public_id`, `created_at`) VALUES (2,4,'/uploads/1789999441543-989933295.jpeg',NULL,'2026-09-21 14:04:01');
REPLACE INTO `complaint_images` (`id`, `complaint_id`, `image_url`, `storage_public_id`, `created_at`) VALUES (3,5,'/uploads/1793966679958-10113009.jpg','1793966679958-10113009.jpg','2026-11-06 12:04:39');
/*!40000 ALTER TABLE `complaint_images` ENABLE KEYS */;

/*!40000 ALTER TABLE `complaint_likes` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaint_likes` ENABLE KEYS */;

/*!40000 ALTER TABLE `complaint_status_history` DISABLE KEYS */;
REPLACE INTO `complaint_status_history` (`id`, `complaint_id`, `changed_by`, `old_status`, `new_status`, `remark`, `created_at`) VALUES (1,4,2,'Pending','Forwarded','complaint forwarded','2026-09-21 16:42:33');
REPLACE INTO `complaint_status_history` (`id`, `complaint_id`, `changed_by`, `old_status`, `new_status`, `remark`, `created_at`) VALUES (2,3,2,'Pending','Forwarded',NULL,'2026-09-25 13:43:18');
REPLACE INTO `complaint_status_history` (`id`, `complaint_id`, `changed_by`, `old_status`, `new_status`, `remark`, `created_at`) VALUES (3,5,10,NULL,'Pending','Complaint created by resident.','2026-11-06 12:04:39');
/*!40000 ALTER TABLE `complaint_status_history` ENABLE KEYS */;

/*!40000 ALTER TABLE `complaints` DISABLE KEYS */;
REPLACE INTO `complaints` (`id`, `complaint_number`, `user_id`, `village_id`, `office_id`, `category`, `severity`, `area`, `landmark`, `description`, `latitude`, `longitude`, `geo_tagged`, `status`, `priority_score`, `likes_count`, `created_at`, `updated_at`, `resolved_at`) VALUES (1,'VC-1789997193327',1,NULL,NULL,'Road','Low','colony','ysr statue','road fully damaged',16.35458886,80.52973439,1,'Pending',1,0,'2026-09-21 13:26:33','2026-09-21 13:26:33',NULL);
REPLACE INTO `complaints` (`id`, `complaint_number`, `user_id`, `village_id`, `office_id`, `category`, `severity`, `area`, `landmark`, `description`, `latitude`, `longitude`, `geo_tagged`, `status`, `priority_score`, `likes_count`, `created_at`, `updated_at`, `resolved_at`) VALUES (2,'VC-1789997840448',1,NULL,NULL,'Drainage','Medium','vaddera','bavi','drainage overflow',16.35458946,80.52973943,1,'Pending',2,0,'2026-09-21 13:37:20','2026-09-21 13:37:20',NULL);
REPLACE INTO `complaints` (`id`, `complaint_number`, `user_id`, `village_id`, `office_id`, `category`, `severity`, `area`, `landmark`, `description`, `latitude`, `longitude`, `geo_tagged`, `status`, `priority_score`, `likes_count`, `created_at`, `updated_at`, `resolved_at`) VALUES (3,'VC-1789998623688',1,NULL,2,'Drainage','High','colony','temple','drainage overflowwwww',16.35458308,80.52975644,1,'Forwarded',3,0,'2026-09-21 13:50:23','2026-09-25 13:43:32',NULL);
REPLACE INTO `complaints` (`id`, `complaint_number`, `user_id`, `village_id`, `office_id`, `category`, `severity`, `area`, `landmark`, `description`, `latitude`, `longitude`, `geo_tagged`, `status`, `priority_score`, `likes_count`, `created_at`, `updated_at`, `resolved_at`) VALUES (4,'VC-1789999441547',1,NULL,1,'Garbage','Severe','konidena','bandh','wastage throwing',16.35458622,80.52974353,1,'Forwarded',4,0,'2026-09-21 14:04:01','2026-09-25 13:35:48',NULL);
REPLACE INTO `complaints` (`id`, `complaint_number`, `user_id`, `village_id`, `office_id`, `category`, `severity`, `area`, `landmark`, `description`, `latitude`, `longitude`, `geo_tagged`, `status`, `priority_score`, `likes_count`, `created_at`, `updated_at`, `resolved_at`) VALUES (5,'VC-520510',10,10,NULL,'Waterlogging','High','vvit college road','Akhila rice mill','water overflow on bridge',16.53320000,80.60060000,1,'Pending',3,0,'2026-11-06 12:04:39','2026-11-06 12:04:39',NULL);
/*!40000 ALTER TABLE `complaints` ENABLE KEYS */;

/*!40000 ALTER TABLE `event_registrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_registrations` ENABLE KEYS */;

/*!40000 ALTER TABLE `events` DISABLE KEYS */;
REPLACE INTO `events` (`id`, `title`, `description`, `date`, `time`, `venue`, `organizer`, `village_id`, `created_by`, `created_at`) VALUES (1,'Village Cleanliness Drive','Community cleanliness and sanitation awareness program.','2026-10-05','09:00:00','Village Community Hall','Village Panchayat',1,NULL,'2026-09-27 10:13:53');
REPLACE INTO `events` (`id`, `title`, `description`, `date`, `time`, `venue`, `organizer`, `village_id`, `created_by`, `created_at`) VALUES (2,'Free Health Awareness Camp','Free health awareness and basic health check-up camp for villagers.','2026-10-12','10:00:00','Government School Ground','Village Health Committee',2,NULL,'2026-09-27 10:13:53');
REPLACE INTO `events` (`id`, `title`, `description`, `date`, `time`, `venue`, `organizer`, `village_id`, `created_by`, `created_at`) VALUES (3,'Farmers Awareness Meeting','Awareness meeting about modern farming practices and government schemes.','2026-10-20','14:00:00','Village Panchayat Office','Agriculture Department',3,NULL,'2026-09-27 10:13:53');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;

/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;

/*!40000 ALTER TABLE `offices` DISABLE KEYS */;
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (1,'Village Panchayat Office','Panchayat',16.50620000,80.64800000,NULL,'9876543210','2026-09-25 11:55:15');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (2,'Mandal Revenue Office','Revenue',16.50700000,80.65000000,NULL,'9876543211','2026-09-25 11:55:15');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (3,'Municipal Zonal Office','Municipal',16.50800000,80.65200000,NULL,'9876543212','2026-09-25 11:55:15');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (4,'Municipal Zonal Office','Municipal',16.50800000,80.65200000,1,'9876543212','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (5,'Mandal Revenue Office','Revenue',16.50700000,80.65000000,1,'9876543211','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (6,'Village Panchayat Office','Panchayat',16.50620000,80.64800000,1,'9876543210','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (7,'Municipal Zonal Office','Municipal',16.50800000,80.65200000,2,'9876543212','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (8,'Mandal Revenue Office','Revenue',16.50700000,80.65000000,2,'9876543211','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (9,'Village Panchayat Office','Panchayat',16.50620000,80.64800000,2,'9876543210','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (10,'Municipal Zonal Office','Municipal',16.50800000,80.65200000,3,'9876543212','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (11,'Mandal Revenue Office','Revenue',16.50700000,80.65000000,3,'9876543211','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (12,'Village Panchayat Office','Panchayat',16.50620000,80.64800000,3,'9876543210','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (13,'Municipal Zonal Office','Municipal',16.50800000,80.65200000,4,'9876543212','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (14,'Mandal Revenue Office','Revenue',16.50700000,80.65000000,4,'9876543211','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (15,'Village Panchayat Office','Panchayat',16.50620000,80.64800000,4,'9876543210','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (16,'Municipal Zonal Office','Municipal',16.50800000,80.65200000,5,'9876543212','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (17,'Mandal Revenue Office','Revenue',16.50700000,80.65000000,5,'9876543211','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (18,'Village Panchayat Office','Panchayat',16.50620000,80.64800000,5,'9876543210','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (19,'Municipal Zonal Office','Municipal',16.50800000,80.65200000,6,'9876543212','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (20,'Mandal Revenue Office','Revenue',16.50700000,80.65000000,6,'9876543211','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (21,'Village Panchayat Office','Panchayat',16.50620000,80.64800000,6,'9876543210','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (22,'Municipal Zonal Office','Municipal',16.50800000,80.65200000,7,'9876543212','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (23,'Mandal Revenue Office','Revenue',16.50700000,80.65000000,7,'9876543211','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (24,'Village Panchayat Office','Panchayat',16.50620000,80.64800000,7,'9876543210','2026-11-06 06:53:21');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (35,'Municipal Zonal Office','Municipal',NULL,NULL,8,'9876543212','2026-11-06 12:33:44');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (36,'Mandal Revenue Office','Revenue',NULL,NULL,8,'9876543211','2026-11-06 12:33:44');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (37,'Village Panchayat Office','Panchayat',NULL,NULL,8,'9876543210','2026-11-06 12:33:44');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (38,'Municipal Zonal Office','Municipal',NULL,NULL,9,'9876543212','2026-11-06 12:33:44');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (39,'Mandal Revenue Office','Revenue',NULL,NULL,9,'9876543211','2026-11-06 12:33:44');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (40,'Village Panchayat Office','Panchayat',NULL,NULL,9,'9876543210','2026-11-06 12:33:44');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (42,'Municipal Zonal Office','Municipal',NULL,NULL,10,'9876543212','2026-11-06 12:37:40');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (43,'Mandal Revenue Office','Revenue',NULL,NULL,10,'9876543211','2026-11-06 12:37:40');
REPLACE INTO `offices` (`id`, `name`, `office_type`, `latitude`, `longitude`, `village_id`, `contact_phone`, `created_at`) VALUES (44,'Village Panchayat Office','Panchayat',NULL,NULL,10,'9876543210','2026-11-06 12:37:40');
/*!40000 ALTER TABLE `offices` ENABLE KEYS */;

/*!40000 ALTER TABLE `poll_options` DISABLE KEYS */;
REPLACE INTO `poll_options` (`id`, `poll_id`, `option_text`) VALUES (1,1,'Roads');
REPLACE INTO `poll_options` (`id`, `poll_id`, `option_text`) VALUES (2,1,'Drainage');
REPLACE INTO `poll_options` (`id`, `poll_id`, `option_text`) VALUES (3,2,'Road Development');
REPLACE INTO `poll_options` (`id`, `poll_id`, `option_text`) VALUES (4,2,'Drainage Improvement');
REPLACE INTO `poll_options` (`id`, `poll_id`, `option_text`) VALUES (5,2,'Street Lighting');
REPLACE INTO `poll_options` (`id`, `poll_id`, `option_text`) VALUES (6,2,'Water Supply');
/*!40000 ALTER TABLE `poll_options` ENABLE KEYS */;

/*!40000 ALTER TABLE `poll_votes` DISABLE KEYS */;
/*!40000 ALTER TABLE `poll_votes` ENABLE KEYS */;

/*!40000 ALTER TABLE `polls` DISABLE KEYS */;
REPLACE INTO `polls` (`id`, `question`, `village_id`, `created_by`, `created_at`) VALUES (1,'Which village facility should be improved first?',1,3,'2026-09-27 14:15:52');
REPLACE INTO `polls` (`id`, `question`, `village_id`, `created_by`, `created_at`) VALUES (2,'What should be the main development priority for the village?',1,NULL,'2026-09-27 15:37:23');
/*!40000 ALTER TABLE `polls` ENABLE KEYS */;

/*!40000 ALTER TABLE `users` DISABLE KEYS */;
REPLACE INTO `users` (`id`, `name`, `mobile`, `email`, `password_hash`, `village_id`, `occupation`, `role`, `status`, `created_at`, `updated_at`) VALUES (1,'Nagarjuna Kunchapu','09848302333','nagarjunakunchapu44@gmail.com','$2b$10$qqWqNDUJpqXvEEoq74Y6m.Nz4gVGRvPxUd1pylYy0vLiqMDUpIOe2',NULL,'student','admin','active','2026-09-21 13:09:53','2026-09-21 14:19:00');
REPLACE INTO `users` (`id`, `name`, `mobile`, `email`, `password_hash`, `village_id`, `occupation`, `role`, `status`, `created_at`, `updated_at`) VALUES (2,'Village Connect Admin','9502123851','srinivasaraokunchapu09@gmail.com','$2b$10$b6JSZae5bGztnDPPopuqG.WRjWx0UQEN0JEpJ824V8qhQfogKABFW',NULL,NULL,'admin','active','2026-09-21 14:22:37','2026-09-21 14:26:03');
REPLACE INTO `users` (`id`, `name`, `mobile`, `email`, `password_hash`, `village_id`, `occupation`, `role`, `status`, `created_at`, `updated_at`) VALUES (3,'prem','0987654321','premmathangi01@gmail.com','$2b$10$2HFtDsiUnYWotDubKEA7oe5VZIHB74ztrCQ/nvKkPU7f92Zmu.x9S',8,'student','resident','active','2026-09-27 10:31:08','2026-11-06 07:32:43');
REPLACE INTO `users` (`id`, `name`, `mobile`, `email`, `password_hash`, `village_id`, `occupation`, `role`, `status`, `created_at`, `updated_at`) VALUES (4,'Gunji Pavan','8908908900','pavangunji01@gmail.com','$2b$10$RK1b16.MLxS9WPgJ61hh6.kHthygaCH1uCap/.csVwRktf.8QYo1a',9,'Student','resident','active','2026-09-27 17:31:45','2026-11-06 07:32:43');
REPLACE INTO `users` (`id`, `name`, `mobile`, `email`, `password_hash`, `village_id`, `occupation`, `role`, `status`, `created_at`, `updated_at`) VALUES (5,'hari srinivas','8908908901',NULL,'$2b$10$PvG1m2TD.XxQQWDpW6tlZe41kNf2jxKxKrjvtt5TEwIxNMDBMXnRy',4,'student','resident','active','2026-09-28 09:35:41','2026-09-28 09:35:41');
REPLACE INTO `users` (`id`, `name`, `mobile`, `email`, `password_hash`, `village_id`, `occupation`, `role`, `status`, `created_at`, `updated_at`) VALUES (6,'Mani','9014993035',NULL,'$2b$10$24VDLZdY4YcT61V70bmvjOwfy57QglVU/p3xyIl9zGAuCRHjXSlYG',5,'student','resident','active','2026-11-03 12:17:34','2026-11-03 12:17:34');
REPLACE INTO `users` (`id`, `name`, `mobile`, `email`, `password_hash`, `village_id`, `occupation`, `role`, `status`, `created_at`, `updated_at`) VALUES (7,'gadupudi Giri','9542696159',NULL,'$2b$10$4ar5O0Eb4S9m6.LcesGdx.HATKKaVRZs5LHUPQJrcOt/4B2ATnFkS',6,'Sarpanch','official','active','2026-11-05 10:39:31','2026-11-05 16:18:06');
REPLACE INTO `users` (`id`, `name`, `mobile`, `email`, `password_hash`, `village_id`, `occupation`, `role`, `status`, `created_at`, `updated_at`) VALUES (8,'Tanniru Yesubabu','9948175754',NULL,'$2b$10$VI4YPEpXBPtDqzWc6J6hzuX.Wf2u7oUliDS30zDGVkHvw/KtdCMCa',7,'Sarpanch','resident','active','2026-11-06 06:00:06','2026-11-06 06:00:06');
REPLACE INTO `users` (`id`, `name`, `mobile`, `email`, `password_hash`, `village_id`, `occupation`, `role`, `status`, `created_at`, `updated_at`) VALUES (9,'Yerra Manikanta','9390692427',NULL,'$2b$10$YShnfWcNEk898ARXigUjk.R8JOKQLU6ln2tjbfUHiBIq7sDh1KQIa',10,'Sarpanch','official','active','2026-11-06 11:59:59','2026-11-06 12:00:58');
REPLACE INTO `users` (`id`, `name`, `mobile`, `email`, `password_hash`, `village_id`, `occupation`, `role`, `status`, `created_at`, `updated_at`) VALUES (10,'Gudipati Madhavan','9963473101',NULL,'$2b$10$MOyetf9gqj28ml8fbPwzUu4qlQSCvlv0ph9AtWoLgQTLPlFyNUGcu',10,'student','resident','active','2026-11-06 12:02:56','2026-11-06 12:02:56');
REPLACE INTO `users` (`id`, `name`, `mobile`, `email`, `password_hash`, `village_id`, `occupation`, `role`, `status`, `created_at`, `updated_at`) VALUES (11,'Chandaragiri Sanath','9676194453',NULL,'$2b$10$EnJz/9Zrlu4yjoEfb1WB2OB7VoJlFJf1m3D4W93vgjo93VNznkdau',11,'student','resident','active','2026-11-21 12:52:28','2026-11-21 12:52:28');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;

/*!40000 ALTER TABLE `villages` DISABLE KEYS */;
REPLACE INTO `villages` (`id`, `name`, `district`, `state`, `latitude`, `longitude`, `created_at`) VALUES (1,'Kondapalli','NTR','Andhra Pradesh',16.61988500,80.54244200,'2026-09-27 09:39:37');
REPLACE INTO `villages` (`id`, `name`, `district`, `state`, `latitude`, `longitude`, `created_at`) VALUES (2,'Gollapudi','NTR','Andhra Pradesh',16.53745000,80.58490000,'2026-09-27 09:39:37');
REPLACE INTO `villages` (`id`, `name`, `district`, `state`, `latitude`, `longitude`, `created_at`) VALUES (3,'Ibrahimpatnam','NTR','Andhra Pradesh',16.59400000,80.52253000,'2026-09-27 09:39:37');
REPLACE INTO `villages` (`id`, `name`, `district`, `state`, `latitude`, `longitude`, `created_at`) VALUES (4,'tenali',NULL,NULL,NULL,NULL,'2026-09-28 09:35:41');
REPLACE INTO `villages` (`id`, `name`, `district`, `state`, `latitude`, `longitude`, `created_at`) VALUES (5,'kadapa','YSR  Kadapa District','Andhra Pradesh',14.47529360,78.82168610,'2026-11-03 12:17:34');
REPLACE INTO `villages` (`id`, `name`, `district`, `state`, `latitude`, `longitude`, `created_at`) VALUES (6,'chavitipalem',NULL,NULL,NULL,NULL,'2026-11-05 10:39:31');
REPLACE INTO `villages` (`id`, `name`, `district`, `state`, `latitude`, `longitude`, `created_at`) VALUES (7,'Konidena','Prakasam District','Andhra Pradesh',16.01550550,80.05718220,'2026-11-06 06:00:06');
REPLACE INTO `villages` (`id`, `name`, `district`, `state`, `latitude`, `longitude`, `created_at`) VALUES (8,'Gogulapadu','Palnadu','Andhra Pradesh',NULL,NULL,'2026-11-06 07:32:24');
REPLACE INTO `villages` (`id`, `name`, `district`, `state`, `latitude`, `longitude`, `created_at`) VALUES (9,'Kotappakonda','Palnadu','Andhra Pradesh',NULL,NULL,'2026-11-06 07:32:24');
REPLACE INTO `villages` (`id`, `name`, `district`, `state`, `latitude`, `longitude`, `created_at`) VALUES (10,'Namburu','Guntur District','Andhra Pradesh',16.35844740,80.49624740,'2026-11-06 11:59:59');
REPLACE INTO `villages` (`id`, `name`, `district`, `state`, `latitude`, `longitude`, `created_at`) VALUES (11,'Parchuru',NULL,NULL,NULL,NULL,'2026-11-21 12:52:28');
/*!40000 ALTER TABLE `villages` ENABLE KEYS */;

/*!40000 ALTER TABLE `volunteers` DISABLE KEYS */;
REPLACE INTO `volunteers` (`id`, `user_id`, `village_id`, `skills`, `availability`, `approved`, `created_at`, `status`) VALUES (1,6,5,'event management,computer skills','weekends',0,'2026-11-03 12:23:39','rejected');
REPLACE INTO `volunteers` (`id`, `user_id`, `village_id`, `skills`, `availability`, `approved`, `created_at`, `status`) VALUES (2,10,10,'Event management,communication skills,passioante in developing','Weekends',0,'2026-11-06 12:06:05','pending');
/*!40000 ALTER TABLE `volunteers` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

