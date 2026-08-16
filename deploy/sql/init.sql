-- MySQL dump 10.13  Distrib 8.0.46, for Linux (aarch64)
--
-- Host: localhost    Database: opc_portal
-- ------------------------------------------------------
-- Server version	8.0.46

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

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(64) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(64) NOT NULL,
  `status` int NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `ix_admin_users_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES (1,'admin','$pbkdf2-sha256$29000$yrn3njPG2FsLgfB.7x1j7A$waY3N/o7N5islYBIN5qbmADqTslofodrWGqdV6JfQYY','系统管理员',1,'2026-04-03 11:31:11','2026-04-04 11:20:43'),(2,'chuangxin','$pbkdf2-sha256$29000$es8Z4zyH0Lp3ztm7V4oxZg$JbcJdkh0qu2ZJ6vsKB.6rUi1lWim62mO6XF/AcS7nRI','创新管理员',1,'2026-06-18 11:45:00','2026-06-18 11:45:00');
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `article_categories`
--

DROP TABLE IF EXISTS `article_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `article_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `code` varchar(64) NOT NULL,
  `sort_order` int NOT NULL,
  `is_enabled` smallint NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `ix_article_categories_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `article_categories`
--

LOCK TABLES `article_categories` WRITE;
/*!40000 ALTER TABLE `article_categories` DISABLE KEYS */;
INSERT INTO `article_categories` VALUES (21,'活动通知','activity',1,1,'2026-04-04 04:56:18','2026-04-04 04:56:18'),(22,'政策文件','policy',2,1,'2026-04-04 04:56:18','2026-04-04 04:56:18'),(23,'文章信息','article',3,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(24,'申报通知','notice',4,1,'2026-04-04 04:56:19','2026-04-04 04:56:19');
/*!40000 ALTER TABLE `article_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `articles`
--

DROP TABLE IF EXISTS `articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `summary` text NOT NULL,
  `link_type` varchar(32) NOT NULL,
  `external_url` varchar(500) DEFAULT NULL,
  `publish_at` datetime NOT NULL,
  `source_name` varchar(128) DEFAULT NULL,
  `is_top` smallint NOT NULL,
  `is_published` smallint NOT NULL,
  `sort_order` int NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_articles_category_id` (`category_id`),
  KEY `ix_articles_id` (`id`),
  CONSTRAINT `articles_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `article_categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `articles`
--

LOCK TABLES `articles` WRITE;
/*!40000 ALTER TABLE `articles` DISABLE KEYS */;
INSERT INTO `articles` VALUES (54,21,'「爱XIA创AI 黑客松」活动正式启动','48小时极限开发挑战，聚焦 AIGC 与 AI Agent 创新应用，欢迎开发者与创业团队参与。','external','https://mp.weixin.qq.com/s/5ZyyYJ9SxSqmVDk7dPmCAg','2026-03-18 10:00:00','微信公众号',1,1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(55,21,'AI 火炬系列活动：厦门赛博龙虾俱乐部·咖啡局 No.2','聚焦人工智能创业趋势与落地机会，连接技术、资本与场景资源。','external','https://mp.weixin.qq.com/s/F-Ze-sn-3lUxorbJyBm-VQ','2026-03-17 09:30:00','微信公众号',0,1,2,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(56,21,'AI 火炬系列活动：OpenClaw 社区聚会回顾','围绕智能体开发、协作和产品验证，持续沉淀社区技术氛围。','external','https://mp.weixin.qq.com/s/ixud6hSPtDkp6-MZU2eLXQ','2026-03-10 09:00:00','微信公众号',0,1,3,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(57,22,'厦门市进一步推动人工智能产业高质量发展若干措施','围绕产业培育、场景开放和人才支持，推动厦门人工智能产业集聚发展。','external','https://www.xm.gov.cn/zwgk/flfg/sfbwj/202602/t20260228_2983172.htm?assistant=true','2026-02-28 12:00:00','厦门市人民政府',1,1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(58,22,'火炬高新区支持人工智能和软件产业发展的若干措施解读','聚焦产业扶持、创新平台与成长企业培育，适合初创团队快速了解申报方向。','external','https://xmtorch.xm.gov.cn/xxgk/zfxxgkml/zcfg/zcjd/202603/t20260302_2983503.html','2026-03-02 09:00:00','厦门火炬高新区',0,1,2,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(59,22,'思明区促进新一代人工智能产业发展扶持措施','提供产业支持与财政配套，支持人工智能企业在本地落地成长。','external','https://www.siming.gov.cn/zfxxgkzl/gbmxxgk/kjhxxhj/zfxxgkml/zcfg/202412/t20241220_1083000.htm','2024-12-20 10:00:00','思明区科技和工信局',0,1,3,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(60,23,'涨知识 | 无安全，不“养虾”！','涨知识 | 无安全，不“养虾”！','external','https://mp.weixin.qq.com/s/W84Q1EOdAvL4psAdKYA4Ew','2026-03-20 10:00:00','微信公众号',1,1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(61,23,'从社区活动到项目落地：OPC 的协同路径','连接创业者、场景方与服务机构，形成项目孵化和验证闭环。','external','https://example.com/opc-path','2026-03-15 14:00:00','OPC 社区',0,0,99,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(62,24,'2026 年第一批人工智能项目征集通知','开放项目征集与配套服务申请，支持创新团队申报社区资源支持。','external','https://example.com/project-notice','2026-03-25 09:00:00','OPC 社区',0,0,99,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(63,24,'创业服务专场咨询日预约通道开放','面向创业团队开放政策、财税、空间和融资咨询预约。','external','https://example.com/consulting-day','2026-03-12 15:00:00','OPC 社区',0,1,99,'2026-04-04 04:56:19','2026-04-20 05:36:51');
/*!40000 ALTER TABLE `articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(255) NOT NULL,
  `highlight_title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `action_type` varchar(32) NOT NULL,
  `action_value` varchar(500) DEFAULT NULL,
  `sort_order` int NOT NULL,
  `is_published` smallint NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_banners_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners`
--

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
INSERT INTO `banners` VALUES (16,'数智立信 创见不凡','成为一流的数智产业生态构建者','AI 黑客松大赛','48小时极限开发，AIGC与AI Agent双赛道角逐！发掘优质项目，搭建“产学研投”融合平台。','/home-banner-ai-hackathon.webp','external','https://mp.weixin.qq.com/s/Jk_CpIzU5o99-i3jliTJ0w?scene=1&click_id=1',2,1,'2026-04-04 04:56:19','2026-04-16 18:30:00'),(17,'数智立信 创见不凡','成为一流的数智产业生态构建者','AI 火炬系列活动','厦门赛博龙虾俱乐部 · 唠嗑局 No.2 期，聚焦行业前沿探索，激发创业创新灵感。','/home-banner-ai-torch-series.webp','external','https://mp.weixin.qq.com/s/F-Ze-sn-3lUxorbJyBm-VQ',1,1,'2026-04-04 04:56:19','2026-04-16 18:30:00'),(18,'数智立信 创见不凡','成为一流的数智产业生态构建者','厦门OPC社区空间','提供空间载体、算力支持、财税辅导等全链条赋能，助力“一人成军、轻量创业”。','/home-banner-opc-community-space.webp','internal','/community',3,1,'2026-04-04 04:56:19','2026-04-16 18:30:00');
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `community_join_action_logs`
--

DROP TABLE IF EXISTS `community_join_action_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `community_join_action_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `material_file_id` int DEFAULT NULL,
  `action_type` varchar(64) NOT NULL,
  `action_summary` varchar(255) NOT NULL,
  `action_detail` text,
  `operated_by_admin_user_id` int DEFAULT NULL,
  `operated_by_site_user_id` int DEFAULT NULL,
  `operated_by_name` varchar(64) DEFAULT NULL,
  `operated_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_community_join_action_logs_operated_by_site_user_id` (`operated_by_site_user_id`),
  KEY `ix_community_join_action_logs_id` (`id`),
  KEY `ix_community_join_action_logs_material_file_id` (`material_file_id`),
  KEY `ix_community_join_action_logs_operated_by_admin_user_id` (`operated_by_admin_user_id`),
  KEY `ix_community_join_action_logs_application_id` (`application_id`),
  KEY `ix_community_join_action_logs_action_type` (`action_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `community_join_action_logs`
--

LOCK TABLES `community_join_action_logs` WRITE;
/*!40000 ALTER TABLE `community_join_action_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `community_join_action_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `community_join_applications`
--

DROP TABLE IF EXISTS `community_join_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `community_join_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `site_user_id` int NOT NULL,
  `site_user_name` varchar(64) DEFAULT NULL,
  `site_user_phone` varchar(32) DEFAULT NULL,
  `target_campus` varchar(32) NOT NULL,
  `status` varchar(32) NOT NULL,
  `submitted_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_community_join_applications_status` (`status`),
  KEY `ix_community_join_applications_submitted_at` (`submitted_at`),
  KEY `ix_community_join_applications_id` (`id`),
  KEY `ix_community_join_applications_site_user_id` (`site_user_id`),
  KEY `ix_community_join_applications_target_campus` (`target_campus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `community_join_applications`
--

LOCK TABLES `community_join_applications` WRITE;
/*!40000 ALTER TABLE `community_join_applications` DISABLE KEYS */;
/*!40000 ALTER TABLE `community_join_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `community_join_material_files`
--

DROP TABLE IF EXISTS `community_join_material_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `community_join_material_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `original_file_name` varchar(255) NOT NULL,
  `storage_path` varchar(500) NOT NULL,
  `file_type` varchar(32) NOT NULL,
  `file_size` int NOT NULL,
  `is_deleted` smallint NOT NULL,
  `deleted_by_admin_user_id` int DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `uploaded_by_admin_user_id` int DEFAULT NULL,
  `uploaded_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_community_join_material_files_id` (`id`),
  KEY `ix_community_join_material_files_is_deleted` (`is_deleted`),
  KEY `ix_community_join_material_files_application_id` (`application_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `community_join_material_files`
--

LOCK TABLES `community_join_material_files` WRITE;
/*!40000 ALTER TABLE `community_join_material_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `community_join_material_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedbacks`
--

DROP TABLE IF EXISTS `feedbacks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedbacks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject` varchar(64) NOT NULL,
  `content` text NOT NULL,
  `phone` varchar(32) NOT NULL,
  `attachment_name` varchar(255) DEFAULT NULL,
  `attachment_url` varchar(500) DEFAULT NULL,
  `status` varchar(32) NOT NULL,
  `admin_reply` text,
  `handled_by` varchar(64) DEFAULT NULL,
  `handled_at` datetime DEFAULT NULL,
  `is_deleted` smallint NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `site_user_id` int DEFAULT NULL,
  `submitter_name` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_feedbacks_status` (`status`),
  KEY `ix_feedbacks_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedbacks`
--

LOCK TABLES `feedbacks` WRITE;
/*!40000 ALTER TABLE `feedbacks` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedbacks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `navigation_items`
--

DROP TABLE IF EXISTS `navigation_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `navigation_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(64) NOT NULL,
  `path` varchar(255) NOT NULL,
  `target_type` varchar(32) NOT NULL,
  `target_value` varchar(500) NOT NULL,
  `sort_order` int NOT NULL,
  `is_visible` smallint NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_navigation_items_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `navigation_items`
--

LOCK TABLES `navigation_items` WRITE;
/*!40000 ALTER TABLE `navigation_items` DISABLE KEYS */;
INSERT INTO `navigation_items` VALUES (56,'首页','/','internal','/',1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(57,'最新动态','/news','internal','/news',2,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(58,'社区入驻','/community','internal','/community',3,1,'2026-04-04 04:56:19','2026-06-07 14:07:41'),(59,'创业服务','/services','internal','/services',4,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(60,'资源集市','/marketplace','internal','/marketplace',5,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(61,'意见反馈','/feedback','internal','/feedback',6,1,'2026-04-04 04:56:19','2026-04-04 04:56:19');
/*!40000 ALTER TABLE `navigation_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opc_application_action_logs`
--

DROP TABLE IF EXISTS `opc_application_action_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opc_application_action_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `material_file_id` int DEFAULT NULL,
  `action_type` varchar(64) NOT NULL,
  `action_target` varchar(64) DEFAULT NULL,
  `action_summary` varchar(255) NOT NULL,
  `action_detail` text,
  `operated_by_admin_user_id` int DEFAULT NULL,
  `operated_by_site_user_id` int DEFAULT NULL,
  `operated_by_name` varchar(64) DEFAULT NULL,
  `operated_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_opc_application_action_logs_id` (`id`),
  KEY `ix_opc_application_action_logs_application_id` (`application_id`),
  KEY `ix_opc_application_action_logs_material_file_id` (`material_file_id`),
  KEY `ix_opc_application_action_logs_action_type` (`action_type`),
  KEY `ix_opc_application_action_logs_operated_by_admin_user_id` (`operated_by_admin_user_id`),
  KEY `ix_opc_application_action_logs_operated_by_site_user_id` (`operated_by_site_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opc_application_action_logs`
--

LOCK TABLES `opc_application_action_logs` WRITE;
/*!40000 ALTER TABLE `opc_application_action_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `opc_application_action_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opc_application_drafts`
--

DROP TABLE IF EXISTS `opc_application_drafts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opc_application_drafts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `site_user_id` int NOT NULL,
  `form_data` text NOT NULL,
  `shareholders_data` text NOT NULL,
  `material_refs` text NOT NULL,
  `payload_json` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_opc_application_drafts_site_user_id` (`site_user_id`),
  KEY `ix_opc_application_drafts_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opc_application_drafts`
--

LOCK TABLES `opc_application_drafts` WRITE;
/*!40000 ALTER TABLE `opc_application_drafts` DISABLE KEYS */;
/*!40000 ALTER TABLE `opc_application_drafts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opc_application_material_files`
--

DROP TABLE IF EXISTS `opc_application_material_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opc_application_material_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int DEFAULT NULL,
  `site_user_id` int NOT NULL,
  `material_category` varchar(128) NOT NULL,
  `original_file_name` varchar(255) NOT NULL,
  `storage_path` varchar(500) NOT NULL,
  `file_type` varchar(32) NOT NULL,
  `file_size` int NOT NULL,
  `upload_status` varchar(32) NOT NULL DEFAULT 'uploaded',
  `is_deleted` smallint NOT NULL DEFAULT '0',
  `deleted_by_admin_user_id` int DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `uploaded_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_opc_application_material_files_id` (`id`),
  KEY `ix_opc_application_material_files_application_id` (`application_id`),
  KEY `ix_opc_application_material_files_site_user_id` (`site_user_id`),
  KEY `ix_opc_application_material_files_material_category` (`material_category`),
  KEY `ix_opc_application_material_files_upload_status` (`upload_status`),
  KEY `ix_opc_application_material_files_is_deleted` (`is_deleted`),
  KEY `ix_opc_application_material_files_deleted_by_admin_user_id` (`deleted_by_admin_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opc_application_material_files`
--

LOCK TABLES `opc_application_material_files` WRITE;
/*!40000 ALTER TABLE `opc_application_material_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `opc_application_material_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opc_application_review_records`
--

DROP TABLE IF EXISTS `opc_application_review_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opc_application_review_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `previous_status` varchar(32) DEFAULT NULL,
  `current_status` varchar(32) NOT NULL,
  `reject_reason` text,
  `user_visible_note` text,
  `internal_note` text,
  `operated_by_admin_user_id` int NOT NULL,
  `operated_by_name` varchar(64) DEFAULT NULL,
  `operated_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_opc_application_review_records_id` (`id`),
  KEY `ix_opc_application_review_records_application_id` (`application_id`),
  KEY `ix_opc_application_review_records_current_status` (`current_status`),
  KEY `ix_opc_application_review_records_operated_by_admin_user_id` (`operated_by_admin_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opc_application_review_records`
--

LOCK TABLES `opc_application_review_records` WRITE;
/*!40000 ALTER TABLE `opc_application_review_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `opc_application_review_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opc_applications`
--

DROP TABLE IF EXISTS `opc_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opc_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_no` varchar(64) NOT NULL,
  `site_user_id` int NOT NULL,
  `source_module` varchar(64) NOT NULL DEFAULT 'opc_application',
  `status` varchar(32) NOT NULL DEFAULT '待审核',
  `is_missing_materials` smallint NOT NULL DEFAULT '0',
  `submitted_at` datetime NOT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `latest_status_at` datetime NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `company_name_note` varchar(255) DEFAULT NULL,
  `company_name_alternative_one` varchar(255) DEFAULT NULL,
  `company_name_alternative_two` varchar(255) DEFAULT NULL,
  `registered_capital` varchar(64) NOT NULL,
  `currency` varchar(32) NOT NULL DEFAULT '人民币',
  `business_scope` text NOT NULL,
  `shareholder_one_type` varchar(32) DEFAULT NULL,
  `shareholder_one_name` varchar(128) DEFAULT NULL,
  `shareholder_one_id_no` varchar(128) DEFAULT NULL,
  `shareholder_one_subscribed_capital` varchar(64) DEFAULT NULL,
  `shareholder_one_equity_ratio` varchar(32) DEFAULT NULL,
  `shareholder_one_address` varchar(255) DEFAULT NULL,
  `shareholder_one_phone` varchar(32) DEFAULT NULL,
  `shareholder_one_valid_until` varchar(64) DEFAULT NULL,
  `shareholder_two_type` varchar(32) DEFAULT NULL,
  `shareholder_two_name` varchar(128) DEFAULT NULL,
  `shareholder_two_id_no` varchar(128) DEFAULT NULL,
  `shareholder_two_subscribed_capital` varchar(64) DEFAULT NULL,
  `shareholder_two_equity_ratio` varchar(32) DEFAULT NULL,
  `shareholder_two_address` varchar(255) DEFAULT NULL,
  `shareholder_two_phone` varchar(32) DEFAULT NULL,
  `shareholder_two_valid_until` varchar(64) DEFAULT NULL,
  `shareholders_json` text,
  `legal_representative_name` varchar(128) DEFAULT NULL,
  `legal_representative_phone` varchar(32) DEFAULT NULL,
  `legal_representative_id_no` varchar(128) DEFAULT NULL,
  `legal_representative_address` varchar(255) DEFAULT NULL,
  `manager_name` varchar(128) DEFAULT NULL,
  `manager_phone` varchar(32) DEFAULT NULL,
  `manager_id_no` varchar(128) DEFAULT NULL,
  `manager_address` varchar(255) DEFAULT NULL,
  `finance_leader_name` varchar(128) DEFAULT NULL,
  `finance_leader_phone` varchar(32) DEFAULT NULL,
  `finance_leader_id_no` varchar(128) DEFAULT NULL,
  `finance_leader_address` varchar(255) DEFAULT NULL,
  `supervisor_name` varchar(128) DEFAULT NULL,
  `supervisor_phone` varchar(32) DEFAULT NULL,
  `supervisor_id_no` varchar(128) DEFAULT NULL,
  `supervisor_address` varchar(255) DEFAULT NULL,
  `industrial_contact_name` varchar(128) DEFAULT NULL,
  `industrial_contact_phone` varchar(32) DEFAULT NULL,
  `industrial_contact_id_no` varchar(128) DEFAULT NULL,
  `industrial_contact_address` varchar(255) DEFAULT NULL,
  `mailing_status` varchar(32) NOT NULL DEFAULT '待开发',
  `form_snapshot_json` text,
  `premises_source_json` text,
  `application_form_payload_json` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_opc_applications_application_no` (`application_no`),
  KEY `ix_opc_applications_id` (`id`),
  KEY `ix_opc_applications_site_user_id` (`site_user_id`),
  KEY `ix_opc_applications_source_module` (`source_module`),
  KEY `ix_opc_applications_status` (`status`),
  KEY `ix_opc_applications_is_missing_materials` (`is_missing_materials`),
  KEY `ix_opc_applications_submitted_at` (`submitted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opc_applications`
--

LOCK TABLES `opc_applications` WRITE;
/*!40000 ALTER TABLE `opc_applications` DISABLE KEYS */;
/*!40000 ALTER TABLE `opc_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `page_sections`
--

DROP TABLE IF EXISTS `page_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `page_sections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `page_key` varchar(64) NOT NULL,
  `section_key` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `content` text NOT NULL,
  `extra_json` text,
  `sort_order` int NOT NULL,
  `is_published` smallint NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_page_sections_page_key` (`page_key`),
  KEY `ix_page_sections_id` (`id`),
  KEY `ix_page_sections_section_key` (`section_key`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `page_sections`
--

LOCK TABLES `page_sections` WRITE;
/*!40000 ALTER TABLE `page_sections` DISABLE KEYS */;
INSERT INTO `page_sections` VALUES (30,'home','community_intro','厦门OPC社区','打造一流的数智产业创新创业生态','提供空间载体、算力支持、财税辅导等全链条赋能服务，助力“一人成军、轻量创业”。','{\"button_text\":\"了解更多\",\"action_type\":\"internal\",\"action_value\":\"/community\",\"image_url\":\"/service-community-opc-bg.png\"}',1,1,'2026-04-04 04:56:19','2026-04-04 06:53:31'),(31,'home','marketplace_summary','AI资源集市','汇聚数据资源、轻量工具与普惠算力入口','汇聚前沿数据资源、强劲算力服务与场景化工具入口，直达开发者与创业团队，即开即用。','{\"button_text\":\"查看资源集市\",\"action_type\":\"internal\",\"action_value\":\"/marketplace\"}',2,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(32,'home','scenario_1','场景机会','汇聚真实行业需求 · 发掘合作共赢商机','全面覆盖数字经济、人工智能、智慧物流、全空间无人体系等多元产业领域，提供最前沿的场景开放清单，助力企业快速精准寻找市场契合点。','{\"bg_to\": \"#60a5fa\", \"bg_from\": \"#0052d9\", \"image_url\": \"/scene-innovation-banner.png\", \"action_type\": \"external\", \"button_text\": \"进入场景平台\", \"action_value\": \"https://xmcj.ixiamen.org.cn/opportunity\"}',3,1,'2026-04-04 04:56:19','2026-04-16 18:30:00'),(33,'home','scenario_2','场景能力','展示前沿技术方案 · 赋能千行百业升级','集中展示基于 AI 大模型、清洁能源等前沿科技的场景集成服务能力与解决方案，帮助团队快速连接真实场景、验证产品价值。','{\"bg_to\": \"#06b6d4\", \"bg_from\": \"#0052d9\", \"image_url\": \"/scene-innovation-banner.png\", \"action_type\": \"external\", \"button_text\": \"查看场景能力\", \"action_value\": \"https://xmcj.ixiamen.org.cn/capability\"}',4,1,'2026-04-04 04:56:19','2026-04-16 18:30:00'),(34,'home','scenario_3','场景政策','解读权威惠企资讯 · 共享政策扶持红利','聚合国家及地方层面的场景创新、产业扶持与人才引育政策内容，为创业团队提供更清晰的项目申报与政策落地指引。','{\"bg_to\": \"#6366f1\", \"bg_from\": \"#0052d9\", \"image_url\": \"/scene-innovation-banner.png\", \"action_type\": \"external\", \"button_text\": \"了解场景政策\", \"action_value\": \"https://xmcj.ixiamen.org.cn/policy\"}',5,1,'2026-04-04 04:56:19','2026-04-16 18:30:00'),(35,'news','hero','最新动态','一站掌握人工智能OPC创业动态','','',1,1,'2026-04-04 04:56:19','2026-04-13 16:56:35'),(36,'community','hero','专业化智创社区','开放 共享 · 设施齐全 · 全链服务','','{\"tags\":[\"开放 共享\",\"设施齐全\",\"全链服务\"],\"image_url\":\"/community-hero-decor.png\",\"image_alt\":\"社区简介顶部装饰图\"}',1,1,'2026-04-04 04:56:19','2026-04-13 09:09:07'),(37,'community','intro','厦门OPC社区',NULL,'<p>立足厦门软件园产业阵地，以 OPC（一人公司 / 开放式合伙协作）为核心模式，构建面向 AI 时代的创新创业协同社区，为个体创业者与微型团队提供稳定、开放、共享的成长土壤。</p><p>社区聚焦 AIGC、数字创意、电商、新媒体与智能应用等方向，围绕空间载体、算力工具、订单对接、财税服务与投融资链接，打造贯穿项目孵化与成长的全链条支持体系。</p>','{\"image_url\":\"/community-intro-building.png\",\"image_alt\":\"厦门OPC社区楼宇形象\"}',2,1,'2026-04-04 04:56:19','2026-04-13 09:09:07'),(38,'community','stats','社区数据',NULL,'','{\"items\":[{\"value\":\"300+\",\"label\":\"入驻团队\"},{\"value\":\"5000+\",\"label\":\"服务人次\"},{\"value\":\"2万m²\",\"label\":\"社区面积\"},{\"value\":\"50+\",\"label\":\"合作机构\"}],\"background_image_url\":\"/community-stats-wave.png\"}',3,1,'2026-04-04 04:56:19','2026-04-13 09:09:07'),(39,'community','base_soft2','厦门OPC社区（软二基地）','','','{\"alt\": \"软二基地展示图\", \"email\": \"zhengwenya@xmigc.com\", \"phone\": \"5953016\", \"address\": \"厦门软件园二期观日路32号\", \"image_url\": \"/community-base-soft6.png\", \"action_type\": \"external\", \"button_text\": \"申请入驻\", \"action_value\": \"https://mp.weixin.qq.com/s?__biz=MzA4OTI2NzkxMQ==&mid=2651418963&idx=2&sn=16b92ed83f8597957d1f2d18e9ed13e2&chksm=8a2945c57d5487b292dd8994c2b926d52458954e03f4f6c5ef5777a97b7dd8445e0d9e87ca44&mpshare=1&scene=1&srcid=0320N00U953BrKiViTZHrCHj&sharer_shareinfo=87c6b4048e22fbbc1ef3fa7edc03462f&sharer_shareinfo_first=87c6b4048e22fbbc1ef3fa7edc03462f#rd\"}',40,1,'2026-04-04 04:56:19','2026-06-02 07:10:08'),(40,'community','base_soft3','厦门OPC社区（软三基地）',NULL,'','{\"alt\": \"软三基地展示图\", \"email\": \"chenting@xmigc.com\", \"phone\": \"5953921\", \"address\": \"厦门软件园三期F06\", \"reverse\": true, \"image_url\": \"/community-base-soft3.png\", \"action_type\": \"external\", \"button_text\": \"申请入驻\", \"action_value\": \"https://mp.weixin.qq.com/s?__biz=MzA4OTI2NzkxMQ==&mid=2651421939&idx=1&sn=7d9575252828bd8a4857f0934f9c1436&chksm=8a30b200bb7047b6bb39207ca89b26d7e0b0f0f730428cb1db069d45dd768d63fed9ca6cd1d3&mpshare=1&scene=1&srcid=0320dQK4oIEZ4zwGC9IzUsjK&sharer_shareinfo=cd02ab38a53ee5f9d8dfb0d98fbc4c63&sharer_shareinfo_first=cd02ab38a53ee5f9d8dfb0d98fbc4c63#rd\"}',50,1,'2026-04-04 04:56:19','2026-04-13 09:09:07'),(41,'community','requirements','入驻条件',NULL,'','{\"items\": [{\"icon\": \"Users\", \"text\": \"个人创业者或者不超过 3 人微型团队\"}, {\"icon\": \"Sparkles\", \"text\": \"从事 AI 相关领域产品 / 服务开发\"}, {\"icon\": \"Building2\", \"text\": \"持有有效证件完成实名认证\"}, {\"icon\": \"ShieldCheck\", \"text\": \"通过社区资质审核\"}], \"image_alt\": \"入驻条件辅助图\", \"image_url\": \"/community-base-soft2.png\", \"ribbon_image_url\": \"/community-requirements-ribbon.png\"}',60,1,'2026-04-04 04:56:19','2026-04-15 17:06:59'),(42,'services','hero','厦门OPC专属创业政策服务','个性化、精准化匹配','',NULL,1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(43,'services','policy_filters','政策匹配','','','{\"type_options\": [\"应届毕业生\", \"AI从业者\", \"海归创业者\"], \"stage_options\": [\"AI电商\", \"软件开发\", \"开发中\", \"已注册企业\"], \"default_types\": [\"应届毕业生\"], \"default_stages\": [\"AI电商\"]}',2,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(44,'services','policy_cards','政策列表','','','{\"items\":[{\"title\":\"高校毕业生见习补贴\",\"desc\":\"为符合条件的应届毕业生提供最高12个月的见习生活及租房补贴。\",\"tags\":[\"应届毕业生\",\"开发中\"],\"button_text\":\"查看详情\",\"action_type\":\"external\",\"action_value\":\"https://irencai.xmdjej.gov.cn/zc_view.html?rowId=810157347216293927\"},{\"title\":\"AI技术从业者相关政策\",\"desc\":\"面向 AI 技术从业者与相关项目团队，提供专项政策申报与服务入口。\",\"tags\":[\"AI从业者\",\"AI电商\"],\"button_text\":\"查看详情\",\"action_type\":\"external\",\"action_value\":\"https://irencai.xmdjej.gov.cn/zcsy_view.html?rowId=802104053138980880\"},{\"title\":\"海归创业者相关政策\",\"desc\":\"支持海归创业者在厦项目落地与人才服务申报。\",\"tags\":[\"海归创业者\",\"已注册企业\"],\"button_text\":\"查看详情\",\"action_type\":\"external\",\"action_value\":\"https://hrss.xm.gov.cn/xxgk/zfxxgkzl/zfxxgkml/qtxx/rcfw/202602/t20260226_2982794.htm\"},{\"title\":\"人才方面的政策\",\"desc\":\"汇总厦门面向人才引进、安居与创业支持的政策入口。\",\"tags\":[\"应届毕业生\",\"AI从业者\",\"海归创业者\"],\"button_text\":\"查看详情\",\"action_type\":\"external\",\"action_value\":\"https://irencai.xmdjej.gov.cn/zc_view.html?rowId=810156846588362786\"}]}',100,1,'2026-04-04 04:56:19','2026-04-16 18:30:00'),(45,'services','support_cards','创业配套服务','','','{\"items\": [{\"icon\": \"FileCheck\", \"title\": \"OPC工商注册\", \"desc\": \"提供OPC公司注册、税务登记、对公账户开立等一站式开办指引，让轻量创业更简单。\", \"action_type\": \"internal\", \"action_value\": \"/setup\"}, {\"icon\": \"Home\", \"title\": \"安居落户\", \"desc\": \"整理并对接厦门市各类人才安居、保障性商品房申请及应届生落户配套政策信息。\", \"action_type\": \"internal\", \"action_value\": \"/settlement\"}, {\"icon\": \"Coins\", \"title\": \"融资对接\", \"desc\": \"汇聚海量优质投资机构资源，协助AI及数字经济赛道创业者对接早期天使与VC资金。\", \"action_type\": \"internal\", \"action_value\": \"/financing\"}]}',4,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(46,'setup','hero','OPC工商注册全流程指引','提供企业注册、税务登记、对公账户等一站式开办服务','',NULL,1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(47,'setup','journey','企业开办服务流程','','','{\"start\": {\"icon\": \"Monitor\", \"title\": \"申请人提出\\n企业开办申请\"}, \"top_service\": {\"text\": \"银行预约开户、用电\\n报装等延伸服务\"}, \"application_options\": [{\"icon\": \"Monitor\", \"title\": \"“一网通”平台\", \"desc\": \"全流程网上申请\\n无需任何纸质材料\"}, {\"icon\": \"User\", \"title\": \"开办企业专窗\", \"desc\": \"提交：企业设立登记\\n申请材料+发票申领\\n文书\"}], \"multi_cert_text\": \"“多证合一”涉企执照事项目录\\n（三十五证合一）\", \"steps\": [{\"icon\": \"FileText\", \"title\": \"企业登记\", \"subtitle\": \"0.5天内核发营业执照\"}, {\"icon\": \"Receipt\", \"title\": \"申领发票\", \"subtitle\": \"0.5天内核发并交邮\"}, {\"icon\": \"Stamp\", \"title\": \"印章刻制\"}, {\"icon\": \"Briefcase\", \"title\": \"就业登记\"}, {\"icon\": \"Building2\", \"title\": \"住房公积金企业缴存登记\"}], \"result\": {\"icon\": \"UserCheck\", \"title\": \"申请人\", \"desc\": \"无需现场领取\\n静等执照、发票\\n邮寄上门\"}}',2,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(48,'financing','hero','融资对接','百亿元“人工智能产业基金群”支持、政策性股权投资、OPC专项信贷产品等','',NULL,1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(49,'financing','intro','OPC 产业基金群资金申请','','为人工智能创业项目提供强大的资金“后盾”，厦门设立总规模百亿元的人工智能产业基金群，主要面向早期的人工智能技术类项目和数字创意类项目，以“真金白银”帮助 OPC 单人创业者及微型团队走稳轻量创业的“第一步”。',NULL,2,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(50,'financing','fund_cards','融资卡片','','','{\"items\": [{\"icon\": \"Coins\", \"title\": \"人工智能产业投资基金\", \"desc\": \"专项扶持厦门市人工智能领域的初创企业，重点关注AIGC、大模型应用等方向。\", \"button_text\": \"立即申请\", \"action_type\": \"none\", \"action_value\": \"\"}, {\"icon\": \"TrendingUp\", \"title\": \"新质生产力基金\", \"desc\": \"针对具身智能、元宇宙等前沿科技行业，重点支持具有核心技术壁垒的创新项目。\", \"button_text\": \"立即申请\", \"action_type\": \"none\", \"action_value\": \"\"}, {\"icon\": \"Droplets\", \"title\": \"滴灌科创基金\", \"desc\": \"支持种子期、初创期微型团队，提供灵活的“滴灌式”小额精准融资服务。\", \"button_text\": \"立即申请\", \"action_type\": \"none\", \"action_value\": \"\"}]}',3,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(51,'settlement','hero','安居落户','人才就业、安居保障服务事项指引','',NULL,1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(52,'settlement','intro','智汇厦门 · 安居 OPC','全方位创业人才落户与住房保障','','{\"image_url\": \"/service-settlement.svg\"}',2,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(53,'settlement','housing_cards','安居卡片','','','{\"items\": [{\"icon\": \"Home\", \"title\": \"人才房申请\", \"desc\": \"为符合条件的软三园区及重点企业人才提供专属公寓房源，解决住房后顾之忧。\", \"action_type\": \"external\", \"action_value\": \"https://www.xmsoft.com/pzt/fg/serviceDetail.html?serveCd=FW042&parkCd=02\"}, {\"icon\": \"UserCheck\", \"title\": \"高层次人才安居政策\", \"desc\": \"针对高层次拔尖人才提供购房补贴、租房补贴等高标准的专属安居保障。\", \"action_type\": \"external\", \"action_value\": \"https://irencai.xmdjej.gov.cn/zc_view.html?rowId=810156846588362786\"}, {\"icon\": \"Building\", \"title\": \"实习求职免费“一张床”\", \"desc\": \"为来厦求职、实习的高校毕业生提供免费住宿保障，切实减轻短期居住负担。\", \"action_type\": \"external\", \"action_value\": \"https://irencai.xmdjej.gov.cn/zc_view.html?rowId=810157347216293927\"}, {\"icon\": \"Ticket\", \"title\": \"“五年五折”租房补贴\", \"desc\": \"新就业大学生等青年群体可享受租房租金五折优惠补贴，最长可保障五年。\", \"action_type\": \"external\", \"action_value\": \"https://irencai.xmdjej.gov.cn/zc_view.html?rowId=810157347216293927\"}, {\"icon\": \"Banknote\", \"title\": \"人才生活补助\", \"desc\": \"为新引进的高学历毕业生、高技能人才等提供专属生活补贴，降低生活成本。\", \"action_type\": \"external\", \"action_value\": \"https://irencai.xmdjej.gov.cn/zc_view.html?rowId=810157347216293927\"}, {\"icon\": \"Briefcase\", \"title\": \"青年创业支持政策\", \"desc\": \"为青年创业人才和初创微型团队提供场地租金减免、创业奖励等全方位扶持。\", \"action_type\": \"external\", \"action_value\": \"https://irencai.xmdjej.gov.cn/zc_view.html?rowId=810157347216293927\"}]}',3,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(54,'marketplace','hero','厦门OPC专属资源集市服务','协助创业者快速进行资源检索','',NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(55,'api_market','hero','API 服务市场','聚合常用 API 能力，覆盖电子商务、生活服务与数据智能场景。','',NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(56,'mcp_market','hero','MCP 标准连接服务','通过标准化连接能力打通工具、数据与模型，让 AI 应用更充分地协同外界资源。','',NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(57,'home','marketplace_group_data','数据资源',NULL,'','{\"button_text\":\"查看更多\",\"action_type\":\"internal\",\"action_value\":\"/marketplace#marketplace-data\"}',21,1,'2026-04-12 05:44:48','2026-04-12 05:44:48'),(58,'home','marketplace_group_tools','产品工具',NULL,'','{\"button_text\":\"查看更多\",\"action_type\":\"internal\",\"action_value\":\"/marketplace#marketplace-tools\"}',22,1,'2026-04-12 05:44:48','2026-04-12 05:44:48'),(59,'home','marketplace_group_compute','普惠算力','','','{\"button_text\":\"查看更多\",\"action_type\":\"internal\",\"action_value\":\"/marketplace#marketplace-compute\"}',23,1,'2026-04-12 05:44:48','2026-04-13 14:01:03'),(60,'marketplace','marketplace_group_data','数据资源',NULL,'','{\"button_text\":\"查看更多\",\"action_type\":\"internal\",\"action_value\":\"/marketplace#marketplace-data\"}',20,1,'2026-04-12 05:44:48','2026-04-12 05:44:48'),(61,'marketplace','marketplace_group_tools','产品工具',NULL,'','{\"button_text\":\"查看更多\",\"action_type\":\"internal\",\"action_value\":\"/marketplace#marketplace-tools\"}',30,1,'2026-04-12 05:44:48','2026-04-12 05:44:48'),(62,'marketplace','marketplace_group_compute','普惠算力',NULL,'','{\"button_text\":\"查看更多\",\"action_type\":\"internal\",\"action_value\":\"/marketplace#marketplace-compute\"}',40,1,'2026-04-12 05:44:48','2026-04-12 05:44:48');
/*!40000 ALTER TABLE `page_sections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resource_categories`
--

DROP TABLE IF EXISTS `resource_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resource_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `resource_type` varchar(32) NOT NULL,
  `group_key` varchar(32) DEFAULT NULL,
  `description` text NOT NULL,
  `icon` varchar(64) DEFAULT NULL,
  `action_type` varchar(32) NOT NULL,
  `action_value` varchar(500) DEFAULT NULL,
  `button_text` varchar(100) DEFAULT NULL,
  `sort_order` int NOT NULL,
  `is_published` smallint NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `display_template` varchar(32) NOT NULL DEFAULT 'default',
  `show_on_home` smallint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_resource_categories_code` (`code`),
  KEY `ix_resource_categories_resource_type` (`resource_type`),
  KEY `ix_resource_categories_id` (`id`),
  KEY `ix_resource_categories_group_key` (`group_key`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resource_categories`
--

LOCK TABLES `resource_categories` WRITE;
/*!40000 ALTER TABLE `resource_categories` DISABLE KEYS */;
INSERT INTO `resource_categories` VALUES (1,'marketplace_data_center','数据资源中心','marketplace','data','整合多源政务数据、社会数据等资源，提供数据目录浏览、资源申请、数据获取等全流程服务，打破数据孤岛，实现数据要素的高效流通与开发利用。','Server','external','https://www.xmdataspace.com/portal/dataSource','查看详情',10,1,'2026-04-04 06:28:15','2026-04-12 05:44:48','/service-datacentre.png','summary_data',1),(2,'marketplace_model_center','模型成果中心','marketplace','data','汇聚行业领先基础大模型，提供大模型微调、评测、部署等全生命周期服务，降低企业应用门槛，打造智能体生态，赋能千行百业智能化转型。','Box','external','https://www.xmdataspace.com/portal/market','查看详情',20,1,'2026-04-04 06:28:15','2026-04-12 05:44:48','/service-mdoelresultcentre.png','summary_data',1),(3,'marketplace_dataset_center','高质量数据集','marketplace','data','甄选高质量政务数据、行业公共数据，经过专业清洗、标注与脱敏处理，提供标准一致、标签丰富的高价值数据集，为 AI 模型训练提供优质数据底座。','Database','external','https://www.xmdataspace.com/portal/societyMarket','查看详情',30,1,'2026-04-04 06:28:15','2026-04-12 05:44:48','/service-highdata.png','summary_data',1),(4,'marketplace_api','AI编程工具','marketplace','tools','面向代码生成、接口调试、研发协作与自动化开发流程，提供适合创业团队快速接入的 AI 编程工具。','Zap','internal','/marketplace/tools/API','了解更多',20,1,'2026-04-04 06:28:15','2026-04-12 05:44:48',NULL,'summary_tool',1),(5,'marketplace_mcp','AI办公套件','marketplace','tools','聚合文档处理、内容创作、知识管理与流程自动化工具，让日常办公和团队协作更高效。','Workflow','internal','/marketplace/tools/MCP','了解更多',30,1,'2026-04-04 06:28:15','2026-04-12 05:44:48',NULL,'summary_tool',1),(6,'marketplace_tools','热门推荐','marketplace','tools','精选高频 AI 工具与创业团队常用能力，覆盖项目启动、产品搭建、运营增长等场景，帮助快速找到可直接使用的工具入口。','Wrench','internal','/marketplace/tools','了解更多',10,1,'2026-04-04 06:28:15','2026-04-14 18:00:39',NULL,'summary_tool',1),(7,'marketplace_compute','普惠算力','marketplace','compute','厦门市公共算力服务平台整合优质计算能力与配套服务，支撑人工智能项目训练、推理与应用落地。','Cpu','external','https://www.xmcpsp.com/','查看详情',70,1,'2026-04-04 06:28:15','2026-04-12 05:44:48','/service-dataspace.png','featured_compute',1),(8,'api_all','全部','api_market',NULL,'资源汇总视图','AppWindow','none',NULL,NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'default',1),(9,'api_ecommerce','电子商务','api_market',NULL,'电商经营与交易配套能力','ShoppingCart','none',NULL,NULL,20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'default',1),(10,'api_life_service','生活服务','api_market',NULL,'生活服务与公共信息能力','MapPin','none',NULL,NULL,30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'default',1),(11,'api_data_intelligence','数据智能','api_market',NULL,'模型、识别与智能理解能力','Brain','none',NULL,NULL,40,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'default',1),(12,'mcp_default','MCP 服务','mcp_market',NULL,'标准化连接服务目录','Workflow','none',NULL,NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'default',1),(13,'marketplace_city_dataspace','厦门城市可信数据空间','marketplace','data','立足厦门、面向全国、连接两岸，服务金砖场景的数据融合开发与流通利用基础设施。','Shield','internal','/trusted-data-space','创建企业账号',5,1,'2026-04-12 05:44:48','2026-04-12 05:44:48','/service-dataspace-shield.svg','featured_data',1),(14,'marketplace_model_plaza','大模型服务','marketplace','tools','汇聚主流大模型与多模态能力入口，支持模型体验、能力对比和业务场景接入。','AppWindow','internal','/marketplace/tools/model-plaza','了解更多',40,1,'2026-04-12 05:44:48','2026-04-20 05:04:36',NULL,'summary_tool',1);
/*!40000 ALTER TABLE `resource_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resource_items`
--

DROP TABLE IF EXISTS `resource_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resource_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `resource_type` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `summary` text NOT NULL,
  `icon` varchar(64) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `badge_text` varchar(100) DEFAULT NULL,
  `price` varchar(100) DEFAULT NULL,
  `unit_label` varchar(100) DEFAULT NULL,
  `status_text` varchar(100) DEFAULT NULL,
  `link_type` varchar(32) NOT NULL,
  `link_value` varchar(500) DEFAULT NULL,
  `tags_json` text,
  `meta_json` text,
  `sort_order` int NOT NULL,
  `is_published` smallint NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `primary_button_text` varchar(100) DEFAULT NULL,
  `secondary_link_type` varchar(32) NOT NULL DEFAULT 'none',
  `secondary_link_value` varchar(500) DEFAULT NULL,
  `secondary_button_text` varchar(100) DEFAULT NULL,
  `show_on_home` smallint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `ix_resource_items_id` (`id`),
  KEY `ix_resource_items_category_id` (`category_id`),
  KEY `ix_resource_items_resource_type` (`resource_type`),
  CONSTRAINT `resource_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `resource_categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=154 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resource_items`
--

LOCK TABLES `resource_items` WRITE;
/*!40000 ALTER TABLE `resource_items` DISABLE KEYS */;
INSERT INTO `resource_items` VALUES (1,1,'marketplace','厦门网络预约出租汽车车辆运营证核...','资源摘要：厦门网络预约出租汽车车辆运营证核发（设区的市级权限）信息，包括所有人信息、车辆信息等。','Box',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/dataSource',NULL,'{\"type\":\"API\",\"owner\":\"市交通运输局\",\"tag\":\"交通运输\",\"publish_date\":\"2025-12-12\"}',10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(2,1,'marketplace','厦门市运政船舶营运证信息','资源摘要：厦门市运政船舶营运证信息，包括船舶名称、营运证号等信息。','Box',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/dataSource',NULL,'{\"type\":\"API\",\"owner\":\"市交通运输局\",\"tag\":\"交通运输\",\"publish_date\":\"2025-12-12\"}',20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(3,1,'marketplace','厦门市已备案的密室逃脱名录信息','资源摘要：厦门市已备案的密室逃脱名录信息，包括备案号和单位等信息。','Box',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/dataSource',NULL,'{\"type\":\"API\",\"owner\":\"市文化和旅游局\",\"tag\":\"文化旅游\",\"publish_date\":\"2025-12-12\"}',30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(4,2,'marketplace','矿山大模型','资源摘要：联合矿山大模型数据，通过大模型技术解决复杂的工业场景需求...','Box',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/market','[\"交通物流\"]','{\"label\":\"模型类型：大语言模型\",\"publish_date\":\"2026-02-05\"}',10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(5,2,'marketplace','旅游导润大模型','资源摘要：整合文旅多维数据集，通过大模型技术赋能旅游智能规划、客服问答...','Box',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/market','[\"文化旅游\"]','{\"label\":\"模型类型：大语言模型\",\"publish_date\":\"2026-02-05\"}',20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(6,2,'marketplace','出行大模型','资源摘要：结合出行行业多维数据集，通过大模型技术实现智能调度、路径优化...','Box',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/market','[\"公共服务\"]','{\"label\":\"模型类型：大语言模型\",\"publish_date\":\"2026-02-05\"}',30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(7,3,'marketplace','文化旅游数据集','数据摘要：包含厦门市及周边区域的旅游景点信息、历史文化介绍、游客评价等数据...','Database',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/societyMarket','[\"文化旅游\"]','{\"label\":\"数据类型：文本\",\"publish_date\":\"2026-02-05\"}',10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(8,3,'marketplace','医学三元结数据集','数据摘要：整合医疗领域的疾病、症状、药物等实体及其关系，支持构建医疗知识图谱...','Database',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/societyMarket','[\"卫生健康\"]','{\"label\":\"数据类型：文本\",\"publish_date\":\"2026-02-06\"}',20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(9,3,'marketplace','供应链标准术语数据集','数据摘要：核心内容涵盖国际贸易、物流配送、供应链金融等领域的标准专业术语...','Database',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/societyMarket','[\"商贸流通\"]','{\"label\":\"数据类型：文本\",\"publish_date\":\"2026-03-19\"}',30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(10,4,'marketplace','AI视频制作','支持通过文字描述生成高质量视频画面，为内容创作者提供强大的效率工具支持。','Zap',NULL,NULL,NULL,NULL,NULL,'internal','/marketplace/tools/API','[\"免费\"]',NULL,10,0,'2026-04-04 06:28:15','2026-06-07 14:04:11',NULL,'none',NULL,NULL,1),(11,4,'marketplace','AI图像编辑','提供图片去水印、智能抠图、画质增强等图像处理 API，赋能电商设计与新媒体运营。','Zap',NULL,NULL,NULL,NULL,NULL,'internal','/marketplace/tools/API','[\"限免\"]',NULL,20,0,'2026-04-04 06:28:15','2026-06-07 14:04:11',NULL,'none',NULL,NULL,1),(12,4,'marketplace','AI图像生成','只需输入 Prompt 即可生成创意图片，支持多种风格转换，适用于文创设计。','Zap',NULL,NULL,NULL,NULL,NULL,'internal','/marketplace/tools/API','[\"免费\"]',NULL,30,0,'2026-04-04 06:28:15','2026-06-07 14:04:11',NULL,'none',NULL,NULL,1),(13,5,'marketplace','[定制化]库房盘点','面向仓储与物流场景的标准化连接服务。','Workflow',NULL,NULL,NULL,NULL,NULL,'internal','/marketplace/tools/MCP',NULL,'{\"items\":[\"智能识别货架商品\",\"自动核对库存数据\",\"一键生成盘点报告\"]}',10,0,'2026-04-04 06:28:15','2026-06-07 14:04:11',NULL,'none',NULL,NULL,1),(14,5,'marketplace','导购机器人','面向零售与服务咨询的交互型连接服务。','Workflow',NULL,NULL,NULL,NULL,NULL,'internal','/marketplace/tools/MCP',NULL,'{\"items\":[\"7x24小时在线答疑\",\"个性化商品推荐\",\"多语言无缝切换\"]}',20,0,'2026-04-04 06:28:15','2026-06-07 14:04:11',NULL,'none',NULL,NULL,1),(15,5,'marketplace','#地址标准化','面向地址纠错与地理信息处理的连接服务。','Workflow',NULL,NULL,NULL,NULL,NULL,'internal','/marketplace/tools/MCP',NULL,'{\"items\":[\"不规范地址智能纠错\",\"行政区划自动补全\",\"经纬度精准转换\"]}',30,0,'2026-04-04 06:28:15','2026-06-07 14:04:11',NULL,'none',NULL,NULL,1),(16,6,'marketplace','AI SCENE','让每个企业都拥有 AI 数字员工，AI SCENE 帮助企业打造一体化智能展示平台，无缝链接各类设备。','Wrench',NULL,NULL,NULL,NULL,NULL,'external','https://www.aiscenes.cn/',NULL,'{\"logo_text\":\"I SCENE\",\"sub_text\":\"MASTER AI场景大屏\"}',10,0,'2026-04-04 06:28:15','2026-06-02 09:36:25',NULL,'none',NULL,NULL,1),(17,6,'marketplace','DataArts','高效服务于数据标准落地、数据质量提升、盘活数据资产，提升经营管理水平。','Wrench',NULL,NULL,NULL,NULL,NULL,'external','https://dataarts.juhe.cn/?f=head',NULL,'{\"logo_text\":\"DataArts\",\"sub_text\":\"数据全生命周期敏捷治理平台\"}',20,0,'2026-04-04 06:28:15','2026-06-02 09:36:25',NULL,'none',NULL,NULL,1),(18,6,'marketplace','Elastic Search','一款基于开源 Elasticsearch、OpenSearch 打造的通用云端检索安全托管服务，支持安全检索、极简查询。','Wrench',NULL,NULL,NULL,NULL,NULL,'external','https://ecloud.10086.cn/portal/product/elasticsearch',NULL,'{\"logo_text\":\"Elastic\",\"sub_text\":\"Search\"}',30,0,'2026-04-04 06:28:15','2026-06-02 09:36:25',NULL,'none',NULL,NULL,1),(19,7,'marketplace','MetaX C550 64GB','普惠算力卡型，面向模型训练与推理场景。','Cpu',NULL,'可租赁','4,320','/ 月',NULL,'external','https://www.xmcpsp.com:10444/index',NULL,'{\"region\":\"杭州\",\"server\":\"新华三\",\"gpu_cards\":\"1\",\"vcpu_cores\":\"12\",\"memory\":\"90\",\"gpu_memory\":\"64GB\",\"storage\":\"100GB\"}',10,1,'2026-04-04 06:28:15','2026-04-20 05:53:16','立即使用','external','https://www.xmcpsp.com:10444/index','详情',1),(20,7,'marketplace','Nvidia A800 80GB','高性能算力资源，支持大模型训练与复杂推理任务。','Cpu',NULL,'可租赁','55,000','/ 月',NULL,'external','https://www.xmcpsp.com:10444/index',NULL,'{\"region\":\"厦门\",\"server\":\"新华三\",\"gpu_cards\":\"1\",\"vcpu_cores\":\"96\",\"memory\":\"180\",\"gpu_memory\":\"80GB\",\"storage\":\"1000GB\"}',20,1,'2026-04-04 06:28:15','2026-04-20 05:53:20','立即使用','external','https://www.xmcpsp.com:10444/index','详情',1),(21,7,'marketplace','Iluvatar BI-V150 64GB','兼顾成本与性能的算力资源，适合中轻量模型任务。','Cpu',NULL,'可租赁','3,960','/ 月',NULL,'external','https://www.xmcpsp.com:10444/index',NULL,'{\"region\":\"厦门\",\"server\":\"新华三\",\"gpu_cards\":\"1\",\"vcpu_cores\":\"12\",\"memory\":\"90\",\"gpu_memory\":\"64GB\",\"storage\":\"100GB\"}',30,1,'2026-04-04 06:28:15','2026-04-20 05:53:23','立即使用','external','https://www.xmcpsp.com:10444/index','详情',1),(22,11,'api_market','人脸实名认证','校验姓名、身份证号、人脸图片信息是否一致，进行人脸实名认证。','ScanFace',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(23,11,'api_market','AI语音合成 TTS API','支持多语言多音色的智能语音合成能力。','Mic',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(24,11,'api_market','Google Gemini Image API','图像生成与编辑能力，适用于创意设计与内容生产。','Image',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(25,11,'api_market','AI视频创作','通过自然语言文本生成高质量视频内容。','Video',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,40,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(26,11,'api_market','AI图像编辑','根据文本提示与图片链接完成风格化图像编辑。','Image',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,50,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(27,11,'api_market','AI图像生成','根据 Prompt 生成具有场景与风格的图像。','Image',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,60,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(28,11,'api_market','AI图像理解','快速准确地解析和理解图像内容，支持复杂场景识别。','Image',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,70,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(29,11,'api_market','活体人脸实名认证H5版','搭载真人检测与人脸比对等生物识别技术，支持 PC 和移动端。','ScanFace',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,80,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(30,11,'api_market','身份证OCR识别','支持二代居民身份证正反面关键字段识别。','ScanFace',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,90,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(31,11,'api_market','智能取名','根据性别、姓氏等属性智能推荐名字，仅供娱乐参考。','FileText',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\",\"支持MCP\"]',NULL,100,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(32,11,'api_market','语音图像垃圾分类识别','通过语音或图片自动识别垃圾名称并给出垃圾分类信息。','Mic',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,110,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(33,11,'api_market','通用印刷体识别','支持图像整体文字检测和识别，返回文字框位置与内容。','Image',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,120,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(34,11,'api_market','银行卡 OCR 识别','支持银行卡卡号、有效期、发卡行等关键字段结构化识别。','CreditCard',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,130,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(35,11,'api_market','证件识别','支持身份证、银行卡、驾驶证、营业执照等三十多种证件的 OCR 识别。','ScanFace',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,140,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(36,11,'api_market','名片识别','快速识别姓名、职位、手机、邮箱等名片内容。','FileText',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,150,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(37,12,'mcp_market','[限免]火车查询订票','一个提供火车票和高铁票查询服务的 MCP 服务。','Train',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"query_train_tickets\",\"book_train_ticket\",\"pay_train_ticket\"]',NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(38,12,'mcp_market','手机归属地查询','提供手机号码归属地、所属号段、手机卡类型、运营商等信息查询。','Smartphone',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_mobile_location\"]',NULL,20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(39,12,'mcp_market','IP地址归属地','提供 IPv4 地址归属地信息查询的 MCP 服务。','MapPin',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_ipv4_location\"]',NULL,30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(40,12,'mcp_market','全球快递物流','提供全球快递物流状态信息查询的 MCP 服务。','Package',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_express_info\"]',NULL,40,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(41,12,'mcp_market','全国天气预报','提供全国城市、地区、区县实时天气预报情况的 MCP 服务。','CloudSun',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_weather\"]',NULL,50,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(42,12,'mcp_market','实时汇率查询','提供全球货币之间汇率查询的 MCP 服务。','Banknote',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_exchange_rate\"]',NULL,60,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(43,12,'mcp_market','今日头条新闻','提供新闻头条信息查询功能，使大模型可以获取当前最新资讯。','Newspaper',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_news_list\",\"get_news_content\"]',NULL,70,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(44,12,'mcp_market','今日全国油价','提供今日全国油价查询功能的 MCP 服务。','Fuel',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_oil_price\"]',NULL,80,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(45,12,'mcp_market','星座运势','提供星座今日、明日、本周、本年运势查询功能的 MCP 服务。','Star',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_horoscope\"]',NULL,90,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(46,12,'mcp_market','全国空气质量','提供全国 300 多个城市的实时空气质量查询功能。','Wind',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_air_quality\"]',NULL,100,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(47,12,'mcp_market','老黄历','提供老黄历信息查询的 MCP 服务。','CalendarDays',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_almanac\"]',NULL,110,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(48,12,'mcp_market','NBA赛程','提供 NBA 近期赛程和比分结果查询的 MCP 服务。','Dribbble',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_nba_schedule\"]',NULL,120,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(49,8,'api_market','人脸实名认证','校验姓名、身份证号、人脸图片信息是否一致，进行人脸实名认证。','ScanFace',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(50,8,'api_market','AI语音合成 TTS API','提供多种拟人音色，支持多语言及方言，并可在同一音色下输出多语言内容，系统可自适应语气，流畅处理复杂文本。','Mic',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(51,8,'api_market','Google Gemini Image API','Nano Banana 图像模型可提供高质量图像生成与编辑能力。','Image',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(52,8,'api_market','AI视频创作','通过自然语言文本智能生成高质量视频，适用于营销与内容制作。','Video',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,40,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(53,8,'api_market','AI图像编辑','根据文本提示和图片链接编辑原图，广泛应用于电商与广告设计。','Image',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,50,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(54,8,'api_market','AI图像生成','根据文本提示生成具有特定风格、场景和氛围感的图像。','Image',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,60,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(55,8,'api_market','三网手机实名认证[简]','核验手机运营商三要素信息是否一致，只返回一致或不一致。','Smartphone',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\",\"个人高级认证\",\"支持MCP\"]',NULL,70,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(56,8,'api_market','身份证实名认证','核验身份证二要素信息是否一致。','ScanFace',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\",\"个人高级认证\",\"支持MCP\"]',NULL,80,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(57,8,'api_market','短信API服务','支持三大运营商短信发送，独享专用通道，3 秒可达，适合高并发场景。','MessageSquare',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,90,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(58,8,'api_market','AI联网搜索','提供实时联网搜索能力，返回 url、标题与摘要等丰富内容。','Search',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,100,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(59,8,'api_market','银行卡四元素检测[简]','校验银行卡四要素信息是否一致，只返回一致或不一致。','CreditCard',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,110,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(60,8,'api_market','银行卡三元素检测[简]','校验银行卡三要素信息是否一致，只返回一致或不一致。','CreditCard',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\",\"支持MCP\"]',NULL,120,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(61,8,'api_market','全国城市空气质量','提供空气质量与污染物浓度查询，覆盖全国多个城市与站点。','CloudRain',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\",\"支持MCP\"]',NULL,130,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(62,8,'api_market','运营商基站信息','支持全球 200 多个国家或地区，以及国内三网运营商基站位置信息数据查询。','Radio',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,140,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(63,9,'api_market','全球快递物流查询','支持全球上千家快递公司跟踪服务，可自动识别快递公司及单号。','Package',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"低至 ￥0.01/次\"]',NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(64,9,'api_market','手机号码归属地','输入手机号查询归属地、所属号段、卡类型和运营商等信息。','Smartphone',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\",\"支持MCP\"]',NULL,20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(65,9,'api_market','二维码生成','按设定参数生成二维码。','LayoutTemplate',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(66,9,'api_market','银行联行号查询','可根据关键字、银行名称、银行卡号、省、市等查询联行号信息。','CreditCard',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,40,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(67,9,'api_market','专利查询','提供专利相关信息检索能力。','Search',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,50,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(68,9,'api_market','标准中文电码查询','依托海量标准中文电码数据，提供快速精准的中文电码查询服务。','FileText',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,60,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(69,9,'api_market','图书电商数据','提供好书推荐与图书电商相关数据能力。','BookOpen',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,70,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(70,9,'api_market','Whois 实时查询','通过 Whois 接口查询域名注册状态与持有者等信息。','Globe',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,80,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(71,10,'api_market','短信API服务','支持三大运营商短信发送，适应多种业务场景与高并发需求。','MessageSquare',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(72,10,'api_market','AI联网搜索','依托海量数据返回丰富的搜索结果摘要，支持实时联网访问。','Search',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(73,10,'api_market','台风路径','查询台风信息和台风路径。','Wind',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(74,10,'api_market','IPv4地址查询-区县级','可查询 IPv4 地址的国家、省、市、邮编及经纬度信息，可精确至区县级。','MapPin',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,40,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(75,10,'api_market','IPv6地址查询-城市级','根据 IPv6 地址查询所属区域，可精确到城市级。','MapPin',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,50,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(76,10,'api_market','新闻头条','提供最新新闻头条与资讯能力，更新周期快。','Newspaper',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\",\"支持MCP\"]',NULL,60,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(77,10,'api_market','性格测试','基于 MBTI 理论生成性格测试报告，供娱乐与参考。','User',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,70,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(78,10,'api_market','历史天气','提供全国历史天气相关信息查询，包括温度、天气状况与风力风向。','CloudRain',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,80,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(79,10,'api_market','气象预警V2','查询国家预警信息发布中心发布的台风、暴雨、寒潮等预警信息。','CloudSun',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,90,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(80,10,'api_market','国际短信','覆盖 200 多个国家和地区，适合企业海外业务拓展。','MessageSquare',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,100,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(81,10,'api_market','视频短信','支持发送视频和图片等富媒体短信信息。','Video',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,110,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(82,10,'api_market','万年历','支持指定日期查询星期、星座、农历、生肖、黄历宜忌等信息。','CalendarDays',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,120,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(83,10,'api_market','热门视频榜单','提供抖音热门视频及多类榜单数据。','Video',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,130,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(84,10,'api_market','数独游戏生成器','提供多难度随机数独谜题与答案生成能力。','LayoutTemplate',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,140,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(85,10,'api_market','笑话大全','持续更新网络幽默、搞笑与内涵段子内容。','MessageSquare',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,150,1,'2026-04-04 06:28:15','2026-04-04 06:28:15',NULL,'none',NULL,NULL,1),(86,14,'marketplace','ArkClaw','企业版 OpenClaw 云上服务，为企业提供安全、稳定的云端 AI 开发与运行环境，助力快速搭建和部署企业级 AI 应用，降低开发与运维成本。','Bot',NULL,NULL,NULL,NULL,NULL,'external','https://www.volcengine.com/product/arkclaw-enterprise/','[\"云上\",\"企业版\"]','{\"vendor\":\"火山引擎\",\"highlight\":\"企业版 OpenClaw 云上服务，为企业提供安全、稳定的云端 AI 开发与运行环境，助力快速搭建和部署企业级 AI 应用，降低开发与运维成本。\",\"logo_text\":\"A\"}',1,0,'2026-05-23 00:00:00','2026-06-02 09:36:25',NULL,'none',NULL,NULL,0),(87,14,'marketplace','AgentPlan','订阅式大模型服务套餐包，提供灵活、高性价比的大模型调用方案，按需订阅、即开即用，满足企业不同规模业务场景的 AI 算力需求','Bot',NULL,NULL,NULL,NULL,NULL,'external','https://ai.volcengine.com/activity/agentplan?infrom=100001.100.164/','[\"订阅式\",\"大模型\"]','{\"vendor\":\"火山引擎\",\"highlight\":\"订阅式大模型服务套餐包，提供灵活、高性价比的大模型调用方案，按需订阅、即开即用，满足企业不同规模业务场景的 AI 算力需求。\",\"logo_text\":\"AP\"}',2,0,'2026-05-23 00:00:00','2026-06-02 09:36:25',NULL,'none',NULL,NULL,0),(88,14,'marketplace','Coze','一站式 AI Agent 开发工具，无需复杂代码即可快速搭建、调试和发布智能体应用，支持多场景对话与自动化流程，降低 AI Agent 开发门槛。','Bot',NULL,NULL,NULL,NULL,NULL,'external','https://www.volcengine.com/product/coze-pro?_vtm_=a441938.b75322.0_0.0_0.0.45_7637069208177739279/','[\"AI Agent\",\"开发工具\"]','{\"vendor\":\"火山引擎\",\"highlight\":\"一站式 AI Agent 开发工具\",\"logo_text\":\"CZ\"}',3,0,'2026-05-23 00:00:00','2026-06-02 09:36:25',NULL,'none',NULL,NULL,0),(89,14,'marketplace','Trae','AI 原生企业级智能研发协作平台，集成智能编码、需求管理与团队协作功能，赋能研发团队提升效率、缩短交付周期，打造高效开发流程。','Bot',NULL,NULL,NULL,NULL,NULL,'external','https://www.volcengine.com/product/trae?_vtm_=a441938.b359850.0_0.0_0.0.69_7637069208177739279/','[\"AI原生\",\"研发协作\"]','{\"vendor\":\"火山引擎\",\"highlight\":\"AI 原生企业级智能研发协作平台，集成智能编码、需求管理与团队协作功能，赋能研发团队提升效率、缩短交付周期，打造高效开发流程。\",\"logo_text\":\"TR\"}',4,0,'2026-05-23 00:00:00','2026-06-02 09:36:25',NULL,'none',NULL,NULL,0),(90,14,'marketplace','火山方舟','一站式大模型服务平台，提供丰富的大模型 API 接入与全流程管理能力，支持模型训练、部署与调用，为企业 AI 业务提供稳定、可靠的底层支撑。','Bot',NULL,NULL,NULL,NULL,NULL,'external','https://www.volcengine.com/product/ark?_vtm_=a441938.b656048.0_0.0_0.0.115_7637069208177739279','[\"大模型\",\"API接入\"]','{\"vendor\":\"火山引擎\",\"highlight\":\"一站式大模型服务平台，提供丰富的大模型 API 接入与全流程管理能力，支持模型训练、部署与调用，为企业 AI 业务提供稳定、可靠的底层支撑。\",\"logo_text\":\"火山\"}',5,0,'2026-05-23 00:00:00','2026-06-02 09:36:25',NULL,'none',NULL,NULL,0),(91,14,'marketplace','minimax','智能对话与内容生成模型，提供高度拟真的多轮交互与文本创作能力。具备强大的代码和 Agent 能力，以及超长上下文处理能力，能够理解、生成并整合包括文本、音频、图像、视频和音乐在内的多种模态。','Sparkles',NULL,NULL,NULL,NULL,NULL,'external','https://www.minimaxi.com/','[\"多模态\",\"Agent\",\"文本生成\",\"音频\",\"图像\",\"视频\"]','{\"vendor\":\"MiniMax\",\"highlight\":\"智能对话与内容生成模型\"}',6,1,'2026-04-12 05:44:48','2026-06-03 02:04:00','去体验','none',NULL,NULL,0),(92,14,'marketplace','阿里悟空','悟空是钉钉推出的 AI 工作平台，通过对话式交互，帮你高效完成日程、文档、审批、会议等各类工作任务。一句话调动多个应用，让 AI 真正成为你的工作搭档。','BriefcaseBusiness',NULL,NULL,NULL,NULL,NULL,'external','https://wukong.dingtalk.com/','[\"办公协同\",\"任务调度\",\"审批\",\"会议\"]','{\"vendor\":\"钉钉\",\"highlight\":\"一句话调动多个应用，让 AI 成为工作搭档\"}',7,1,'2026-04-12 05:44:48','2026-06-03 02:04:00','去体验','none',NULL,NULL,0),(93,14,'marketplace','QClaw','QClaw 是腾讯推出的个人AI助手，可微信远程整理文件、执行复杂任务、无需编程基础，适配办公 / 创作 / 开发等多场景，丰富技能生态越用越懂你。','Bot',NULL,NULL,NULL,NULL,NULL,'external','https://qclaw.qq.com/','[\"腾讯\",\"个人助手\",\"办公\",\"创作\",\"开发\"]','{\"vendor\":\"腾讯\",\"highlight\":\"QClaw 是腾讯推出的个人AI助手，可微信远程整理文件、执行复杂任务、无需编程基础，适配办公 / 创作 / 开发等多场景，丰富技能生态越用越懂你。\"}',8,0,'2026-04-12 05:44:48','2026-06-02 09:36:25','去体验','none',NULL,NULL,0),(94,14,'marketplace','GLM-5','智谱最新一代大模型，面向智能体工程编程与推理能力升级。','Bot','/model-icons/glm-5.svg',NULL,NULL,NULL,NULL,'none',NULL,'[\"大语言模型\",\"最新开源\"]','{\"vendor\":\"智谱\",\"highlight\":\"智谱最新一代大模型，面向智能体工程编程与推理能力升级。\",\"logo_text\":\"Z\"}',10,0,'2026-04-14 17:32:05','2026-06-02 09:36:25',NULL,'none',NULL,NULL,0),(95,14,'marketplace','minimax-m2.7','MiniMax 高性能大模型，支持 Agent、工具调用与 200K 超长上下文。','AudioWaveform','/model-icons/minimax.svg',NULL,NULL,NULL,NULL,'none',NULL,'[\"大语言模型\",\"文本生成\"]','{\"vendor\":\"MiniMax\",\"highlight\":\"MiniMax 高性能大模型，深度推理、工具调用能力强。\",\"logo_text\":\"MM\"}',20,0,'2026-04-14 17:32:05','2026-06-02 09:36:25',NULL,'none',NULL,NULL,0),(96,14,'marketplace','minimax-m2.5','MiniMax 高性价比大模型，适合深度推理与工具调用方案。','AudioWaveform','/model-icons/minimax.svg',NULL,NULL,NULL,NULL,'none',NULL,'[\"大语言模型\",\"深度推理\"]','{\"vendor\":\"MiniMax\",\"highlight\":\"MiniMax 高性价比大模型，深度推理、工具调用能力强。\",\"logo_text\":\"MM\"}',30,0,'2026-04-14 17:32:05','2026-06-02 09:36:25',NULL,'none',NULL,NULL,0),(97,14,'marketplace','deepseek-v3.2','DeepSeek 开源通用大模型，推理与代码能力接近闭源顶级水平。','Orbit','/model-icons/deepseek.svg',NULL,NULL,NULL,NULL,'none',NULL,'[\"大语言模型\",\"文本生成\"]','{\"vendor\":\"DeepSeek\",\"highlight\":\"DeepSeek 开源通用大模型，推理与代码能力接近闭源顶级水平。\",\"logo_text\":\"DS\"}',40,0,'2026-04-14 17:32:05','2026-06-02 09:36:25',NULL,'none',NULL,NULL,0),(98,14,'marketplace','baichuan-m2-32b','百川开源医疗增强大模型，面向全科开源医疗模型能力。','ChartNoAxesColumn','/model-icons/baichuan.svg',NULL,NULL,NULL,NULL,'none',NULL,'[\"大语言模型\",\"文本生成\"]','{\"vendor\":\"百川\",\"highlight\":\"百川开源医疗增强大模型，面向全科开源医疗模型能力。\",\"logo_text\":\"BC\"}',50,0,'2026-04-14 17:32:05','2026-06-02 09:36:25',NULL,'none',NULL,NULL,0),(99,14,'marketplace','deepseek-r1','DeepSeek 纯强化学习推理模型，专攻复杂逻辑与深度分析任务。','Orbit','/model-icons/deepseek.svg',NULL,NULL,NULL,NULL,'none',NULL,'[\"大语言模型\",\"深度推理\"]','{\"vendor\":\"DeepSeek\",\"highlight\":\"DeepSeek 纯强化学习推理模型，专攻复杂逻辑与深度分析任务。\",\"logo_text\":\"DS\"}',60,0,'2026-04-14 17:32:05','2026-06-02 09:36:25',NULL,'none',NULL,NULL,0),(100,14,'marketplace','hailuo','MiniMax 高性能视频生成模型，具备深度推理与工具调用能力。','AudioWaveform','/model-icons/minimax.svg',NULL,NULL,NULL,NULL,'none',NULL,'[\"视频模型\",\"视频生成\"]','{\"vendor\":\"MiniMax\",\"highlight\":\"MiniMax 高性能视频生成模型，深度推理、工具调用能力强。\",\"logo_text\":\"HL\"}',70,0,'2026-04-14 17:32:05','2026-06-02 09:36:25',NULL,'none',NULL,NULL,0),(101,14,'marketplace','seedance-1.0','字节跳动视频生成模型，基于图像或文本生成视频内容。','ChartNoAxesColumn','/model-icons/seedance.svg',NULL,NULL,NULL,NULL,'none',NULL,'[\"视频模型\",\"基于图像\"]','{\"vendor\":\"字节跳动\",\"highlight\":\"字节跳动视频生成模型，基于图像或文本生成视频内容。\",\"logo_text\":\"SD\"}',80,0,'2026-04-14 17:32:05','2026-06-02 09:36:25',NULL,'none',NULL,NULL,0),(102,14,'marketplace','vidu','生数科技视频大模型，支持文生视频、图生视频与高清生成。','CircleDot','/model-icons/vidu.svg',NULL,NULL,NULL,NULL,'none',NULL,'[\"基于图像\",\"文本视频\"]','{\"vendor\":\"生数科技\",\"highlight\":\"生数科技视频大模型，支持文生视频、图生视频与高清生成。\",\"logo_text\":\"VD\"}',90,0,'2026-05-31 08:39:12','2026-06-02 09:36:25',NULL,'none',NULL,NULL,0),(103,6,'marketplace','ArkClaw','企业版 OpenClaw 云上服务，为企业提供安全、稳定的云端 AI 开发与运行环境，助力快速搭建和部署企业级 AI 应用，降低开发与运维成本。','Bot','/tool-icons/arkclaw.png',NULL,NULL,NULL,NULL,'external','https://www.volcengine.com/product/arkclaw-enterprise','[\"云上\", \"企业版\"]','{\"owner\": \"火山引擎\", \"type\": \"热门推荐\", \"logo_text\": \"云上\"}',10,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(104,6,'marketplace','AgentPlan','订阅式大模型服务套餐包，提供灵活、高性价比的大模型调用方案，满足企业不同规模业务场景的 AI 算力需求。','Bot','/tool-icons/agentplan.png','火爆',NULL,NULL,NULL,'external','https://ai.volcengine.com/activity/agentplan','[\"订阅式\", \"大模型\"]','{\"owner\": \"火山引擎\", \"type\": \"热门推荐\", \"logo_text\": \"订阅式\"}',20,1,'2026-06-02 17:36:25','2026-06-02 10:35:37','查看详情','none',NULL,NULL,1),(105,6,'marketplace','Coze','一站式 AI Agent 开发工具，支持智能体搭建、插件接入和工作流编排，帮助团队快速落地自动化业务应用。','Bot','/tool-icons/coze.png',NULL,NULL,NULL,NULL,'external','https://www.coze.cn/','[\"AI Agent\", \"开发工具\"]','{\"owner\": \"字节跳动\", \"type\": \"热门推荐\", \"logo_text\": \"AI Agent\"}',30,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(106,6,'marketplace','Trae','AI 原生企业级智能研发协作平台，集成智能编码、需求管理与团队协作能力，提升研发效率并缩短交付周期。','Bot','/tool-icons/trae.png',NULL,NULL,NULL,NULL,'external','https://www.trae.ai/','[\"AI原生\", \"研发协作\"]','{\"owner\": \"字节跳动\", \"type\": \"热门推荐\", \"logo_text\": \"AI原生\"}',40,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(107,6,'marketplace','火山方舟','一站式大模型服务平台，提供模型 API 接入、训练、部署与调用管理能力，为企业 AI 业务提供可靠底层支撑。','Bot','/tool-icons/volc-ark.png',NULL,NULL,NULL,NULL,'external','https://www.volcengine.com/product/ark','[\"大模型\", \"API接入\"]','{\"owner\": \"火山引擎\", \"type\": \"热门推荐\", \"logo_text\": \"大模型\"}',50,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(108,6,'marketplace','minimax','智能对话与内容生成模型平台，支持文本、语音、多模态 Agent 等能力，适合快速构建智能应用。','Bot','/tool-icons/minimax.png',NULL,NULL,NULL,NULL,'external','https://www.minimaxi.com/','[\"多模态\", \"Agent\"]','{\"owner\": \"MiniMax\", \"type\": \"热门推荐\", \"logo_text\": \"多模态\"}',60,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(109,6,'marketplace','阿里悟空','一句话调动多个应用，让 AI 成为工作搭档，覆盖办公协同、任务调度与多应用联动场景。','Bot','/tool-icons/ali-wukong.png','火爆',NULL,NULL,NULL,'external','https://wukong.dingtalk.com/','[\"办公协同\", \"任务调度\"]','{\"owner\": \"阿里巴巴\", \"type\": \"热门推荐\", \"logo_text\": \"办公协同\"}',70,1,'2026-06-02 17:36:25','2026-06-02 10:35:37','查看详情','none',NULL,NULL,1),(110,6,'marketplace','QClaw','腾讯推出的个人 AI 助手，可微信远程整理文件、执行复杂任务，适配办公、创作与开发等多场景。','Bot','/tool-icons/qclaw.png',NULL,NULL,NULL,NULL,'external','https://qclaw.qq.com/','[\"腾讯\", \"个人助手\"]','{\"owner\": \"腾讯\", \"type\": \"热门推荐\", \"logo_text\": \"腾讯\"}',80,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(111,4,'marketplace','讯飞星辰MaaS Coding Plan','面向企业研发团队的大模型编程套餐，提供代码生成、研发辅助和多模型调用能力，帮助降低研发试错成本。','Bot','/tool-icons/xingchen-coding.png',NULL,NULL,NULL,NULL,'external','https://maas.xfyun.cn/','[\"编程助手\", \"套餐\"]','{\"owner\": \"科大讯飞\", \"type\": \"AI编程工具\", \"logo_text\": \"编程助手\"}',10,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(112,4,'marketplace','火山方舟 coding plan','多工具适配的大模型编程服务，提供较大调用额度与企业级模型能力，适合研发团队批量接入。','Bot','/tool-icons/volc-ark.png',NULL,NULL,NULL,NULL,'external','https://www.volcengine.com/','[\"Coding\", \"大模型\"]','{\"owner\": \"火山引擎\", \"type\": \"AI编程工具\", \"logo_text\": \"Coding\"}',20,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(113,4,'marketplace','Trae','国内 AI 原生 IDE，支持多模型智能协作、代码生成与研发流程辅助，提升工程交付效率。','Bot','/tool-icons/trae.png',NULL,NULL,NULL,NULL,'external','https://www.trae.ai/','[\"AI IDE\", \"研发协作\"]','{\"owner\": \"字节跳动\", \"type\": \"AI编程工具\", \"logo_text\": \"AI IDE\"}',30,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(114,4,'marketplace','代码小浣熊','基于大模型的 AI 编程助手，支持多语言代码生成、测试用例生成与代码解释，辅助日常开发。','Bot','/tool-icons/code-raccoon.png',NULL,NULL,NULL,NULL,'external','https://www.sensetime.com/','[\"代码生成\", \"测试用例\"]','{\"owner\": \"商汤科技\", \"type\": \"AI编程工具\", \"logo_text\": \"代码生成\"}',40,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(115,5,'marketplace','飞书多维表格','业务系统的 AI 搭建平台，可用自然语言快速搭建复杂业务系统，一站式覆盖企业管理流程。','Bot','/tool-icons/feishu-bitable.png',NULL,NULL,NULL,NULL,'external','https://www.feishu.cn/product/base','[\"业务系统\", \"表格\"]','{\"owner\": \"飞书\", \"type\": \"AI办公套件\", \"logo_text\": \"业务系统\"}',10,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(116,5,'marketplace','扣子','通用 AI Agent 协同办公平台，支持任务自动化、智能拆解执行与插件集成，提升团队生产力。','Bot','/tool-icons/coze.png',NULL,NULL,NULL,NULL,'external','https://www.coze.cn/','[\"AI Agent\", \"办公协同\"]','{\"owner\": \"字节跳动\", \"type\": \"AI办公套件\", \"logo_text\": \"AI Agent\"}',20,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(117,5,'marketplace','讯飞智文','高效文档生成与内容整理工具，支持多种办公文档场景，适合方案、报告与资料生成。','Bot','/tool-icons/xunfei-zhiwen.png',NULL,NULL,NULL,NULL,'external','https://zhiwen.xfyun.cn/','[\"文档助手\", \"内容生成\"]','{\"owner\": \"科大讯飞\", \"type\": \"AI办公套件\", \"logo_text\": \"文档助手\"}',30,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(118,5,'marketplace','小浣熊办公','通过 AI 重构数据分析流程，以自然语言交互生成专业分析报告，降低数据处理门槛。','Bot','/tool-icons/code-raccoon.png',NULL,NULL,NULL,NULL,'external','https://www.sensetime.com/','[\"数据分析\", \"报告生成\"]','{\"owner\": \"商汤科技\", \"type\": \"AI办公套件\", \"logo_text\": \"数据分析\"}',40,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(119,5,'marketplace','iSlide','PPT 辅助制作工具，支持一键生成、智能排版和模板化编辑，提高演示文稿制作效率。','Bot','/tool-icons/islide.png',NULL,NULL,NULL,NULL,'external','https://www.islide.cc/','[\"PPT\", \"智能排版\"]','{\"owner\": \"iSlide\", \"type\": \"AI办公套件\", \"logo_text\": \"PPT\"}',50,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(120,5,'marketplace','ChatExcel','通过聊天对话处理 Excel 表格，支持数据分析、公式生成与表格处理，适合轻量数据办公。','Bot','/tool-icons/chatexcel.png',NULL,NULL,NULL,NULL,'external','https://www.chatexcel.com/','[\"Excel\", \"数据处理\"]','{\"owner\": \"ChatExcel\", \"type\": \"AI办公套件\", \"logo_text\": \"Excel\"}',60,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(121,14,'marketplace','豆包网页版','一站式 AI 对话与内容生成入口，支持问答、写作、总结和多场景智能辅助。','Bot','/tool-icons/doubao.png',NULL,NULL,NULL,NULL,'external','https://www.doubao.com/','[\"对话助手\", \"内容生成\"]','{\"owner\": \"字节跳动\", \"type\": \"大模型服务\", \"logo_text\": \"对话助手\"}',10,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(122,14,'marketplace','千问','阿里巴巴旗下 AI 智能助手，提供通用问答、内容创作与模型能力体验入口。','Bot','/tool-icons/qwen.png',NULL,NULL,NULL,NULL,'external','https://chat.qwen.ai/','[\"通义千问\", \"智能助手\"]','{\"owner\": \"阿里巴巴\", \"type\": \"大模型服务\", \"logo_text\": \"通义千问\"}',20,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(123,14,'marketplace','腾讯元宝','整合腾讯生态能力的 AI 助手，支持内容创作、知识问答与办公场景辅助。','Bot','/tool-icons/yuanbao.png',NULL,NULL,NULL,NULL,'external','https://yuanbao.tencent.com/','[\"腾讯\", \"智能助手\"]','{\"owner\": \"腾讯\", \"type\": \"大模型服务\", \"logo_text\": \"腾讯\"}',30,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(124,14,'marketplace','DeepSeek','DeepSeek 大模型服务入口，支持高质量对话、推理与开发者模型能力体验。','Bot','/tool-icons/deepseek.png',NULL,NULL,NULL,NULL,'external','https://www.deepseek.com/','[\"大模型\", \"推理\"]','{\"owner\": \"DeepSeek\", \"type\": \"大模型服务\", \"logo_text\": \"大模型\"}',40,1,'2026-06-02 17:36:25','2026-06-02 17:36:25','查看详情','none',NULL,NULL,1),(125,4,'marketplace','通义灵码IDE','千问驱动的 AI 原生开发环境，支持编程智能体、工程感知、代码生成与调试优化，适合团队研发全流程提效。','Bot','/tool-icons/tongyi-lingma-ide.png',NULL,NULL,NULL,NULL,'external','https://lingma.aliyun.com/','[\"AI IDE\", \"编程智能体\"]','{\"owner\": \"阿里云\", \"type\": \"AI编程工具\", \"logo_text\": \"AI IDE\"}',50,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(126,4,'marketplace','通义灵码','阿里推出的 AI 编程助手，支持代码补全、自然语言生成代码、代码解释与优化，适配 VS Code 和 JetBrains 等主流 IDE。','Bot','/tool-icons/tongyi-lingma.png',NULL,NULL,NULL,NULL,'external','https://tongyi.aliyun.com/lingma/','[\"代码补全\", \"IDE插件\"]','{\"owner\": \"阿里巴巴\", \"type\": \"AI编程工具\", \"logo_text\": \"代码补全\"}',60,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(127,4,'marketplace','豆包MarsCode','字节跳动旗下智能编程工具，提供云端 IDE 与插件能力，覆盖代码补全、生成、测试和问答等研发场景。','Bot','/tool-icons/marscode.png',NULL,NULL,NULL,NULL,'external','https://www.marscode.cn/','[\"云端IDE\", \"代码生成\"]','{\"owner\": \"字节跳动\", \"type\": \"AI编程工具\", \"logo_text\": \"云端IDE\"}',70,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(128,4,'marketplace','豆包编程','面向代码生成与项目导入的在线编程工具，支持需求生成代码、代码优化与可视化编辑，适合快速原型开发。','Bot','/tool-icons/doubao-coding.png',NULL,NULL,NULL,NULL,'external','https://www.doubao.com/','[\"代码生成\", \"原型开发\"]','{\"owner\": \"字节跳动\", \"type\": \"AI编程工具\", \"logo_text\": \"代码生成\"}',80,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(129,4,'marketplace','MonkeyCode','在线 AI 编程平台，自带云开发环境并兼容多模型，支持任务模式、Git 协作和在线工作台。','Bot','/tool-icons/monkeycode.png',NULL,NULL,NULL,NULL,'external','https://monkeycode.ai/','[\"在线工作台\", \"Git协作\"]','{\"owner\": \"MonkeyCode\", \"type\": \"AI编程工具\", \"logo_text\": \"在线工作台\"}',90,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(130,4,'marketplace','Qoder','智能代码生成平台，可通过自然语言生成多语言代码、API 接口、SQL 查询和前端组件，降低开发门槛。','Bot','/tool-icons/qoder.png',NULL,NULL,NULL,NULL,'external','https://qoder.com/','[\"自然语言\", \"代码生成\"]','{\"owner\": \"Qoder\", \"type\": \"AI编程工具\", \"logo_text\": \"自然语言\"}',100,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(131,4,'marketplace','iFlyCode','科大讯飞推出的智能编程助手，基于星火能力提供代码生成、代码理解和研发辅助能力。','Bot','/tool-icons/iflycode.png',NULL,NULL,NULL,NULL,'external','https://iflycode.xfyun.cn/','[\"星火模型\", \"编程助手\"]','{\"owner\": \"科大讯飞\", \"type\": \"AI编程工具\", \"logo_text\": \"星火模型\"}',110,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(132,4,'marketplace','Gemini Code Assist','Google 面向开发者的 AI 编程助手，支持代码补全、代码审查和主流开发环境中的智能问答。','Bot','/tool-icons/gemini-code-assist.png',NULL,NULL,NULL,NULL,'external','https://codeassist.google/','[\"代码审查\", \"智能补全\"]','{\"owner\": \"Google\", \"type\": \"AI编程工具\", \"logo_text\": \"代码审查\"}',120,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(133,5,'marketplace','飞书AI文档','支持多人实时协作、AI 写作和文档内容组织，适合团队方案撰写、会议记录和项目资料沉淀。','Bot','/tool-icons/feishu-docs.png',NULL,NULL,NULL,NULL,'external','https://www.feishu.cn/product/docs','[\"AI文档\", \"实时协作\"]','{\"owner\": \"飞书\", \"type\": \"AI办公套件\", \"logo_text\": \"AI文档\"}',70,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(134,5,'marketplace','AiPPT','一键生成 PPT 大纲和演示文稿，支持智能排版、内容润色与模板更换，提升汇报材料制作效率。','Bot','/tool-icons/aippt.png',NULL,NULL,NULL,NULL,'external','https://www.aippt.cn/','[\"PPT生成\", \"智能排版\"]','{\"owner\": \"AiPPT\", \"type\": \"AI办公套件\", \"logo_text\": \"PPT生成\"}',80,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(135,5,'marketplace','Excelly-AI','可将文本需求转换为 Excel 或 Google Sheets 公式，并提供公式解释、VBA 生成和表格上传辅助。','Bot','/tool-icons/excelly-ai.png',NULL,NULL,NULL,NULL,'external','https://excelly-ai.com/','[\"表格公式\", \"Excel\"]','{\"owner\": \"Excelly-AI\", \"type\": \"AI办公套件\", \"logo_text\": \"表格公式\"}',90,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(136,5,'marketplace','SheetAI.app','为 Google Sheets 提供 AI 函数和自然语言问答能力，可生成结构化数据、列表和表格内容。','Bot','/tool-icons/sheetai.png',NULL,NULL,NULL,NULL,'external','https://www.sheetai.app/','[\"Google表格\", \"数据生成\"]','{\"owner\": \"SheetAI\", \"type\": \"AI办公套件\", \"logo_text\": \"Google表格\"}',100,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(137,5,'marketplace','印象AI','与印象笔记深度融合的办公助手，支持笔记创作、文档分析、摘要生成和思维导图场景。','Bot','/tool-icons/yinxiang-ai.png',NULL,NULL,NULL,NULL,'external','https://www.yinxiang.com/','[\"知识管理\", \"文档分析\"]','{\"owner\": \"印象笔记\", \"type\": \"AI办公套件\", \"logo_text\": \"知识管理\"}',110,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(138,5,'marketplace','Cubox','融合 AI 的阅读与知识管理工具，支持网页收藏、重点高亮、笔记沉淀和资料检索。','Bot','/tool-icons/cubox.png',NULL,NULL,NULL,NULL,'external','https://cubox.pro/','[\"知识管理\", \"阅读助手\"]','{\"owner\": \"Cubox\", \"type\": \"AI办公套件\", \"logo_text\": \"知识管理\"}',120,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(139,14,'marketplace','Kimi','月之暗面推出的 AI 智能助手，擅长长文本处理、联网搜索和复杂任务拆解，适合文档与分析场景。','Bot','/tool-icons/kimi.png',NULL,NULL,NULL,NULL,'external','https://kimi.moonshot.cn/','[\"长文本\", \"智能助手\"]','{\"owner\": \"月之暗面\", \"type\": \"大模型服务\", \"logo_text\": \"长文本\"}',50,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(140,14,'marketplace','讯飞星火','科大讯飞国产认知大模型，覆盖办公写作、知识问答、文档处理和企业转型等场景。','Bot','/tool-icons/xunfei-spark.png',NULL,NULL,NULL,NULL,'external','https://xinghuo.xfyun.cn/','[\"国产大模型\", \"办公助手\"]','{\"owner\": \"科大讯飞\", \"type\": \"大模型服务\", \"logo_text\": \"国产大模型\"}',60,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(141,14,'marketplace','Claude','Anthropic 推出的多模态 AI 助手，支持复杂推理、视觉分析、代码生成和多语言处理。','Bot','/tool-icons/claude.png',NULL,NULL,NULL,NULL,'external','https://claude.ai/','[\"多模态\", \"复杂推理\"]','{\"owner\": \"Anthropic\", \"type\": \"大模型服务\", \"logo_text\": \"多模态\"}',70,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(142,14,'marketplace','ChatGPT','OpenAI 推出的通用 AI 助手，覆盖问答、写作、代码、分析和多模态交互等广泛场景。','Bot','/tool-icons/chatgpt.png',NULL,NULL,NULL,NULL,'external','https://chatgpt.com/','[\"通用助手\", \"多模态\"]','{\"owner\": \"OpenAI\", \"type\": \"大模型服务\", \"logo_text\": \"通用助手\"}',80,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(143,14,'marketplace','Gemini','Google 的多模态 AI 模型服务，支持文本、代码、图像理解和跨工具协作场景。','Bot','/tool-icons/gemini.png',NULL,NULL,NULL,NULL,'external','https://gemini.google.com/','[\"Google\", \"多模态\"]','{\"owner\": \"Google\", \"type\": \"大模型服务\", \"logo_text\": \"Google\"}',90,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(144,14,'marketplace','ChatHub','多模型聊天与对比工具，支持同时调用多个 AI 助手，便于快速比较不同模型输出。','Bot','/tool-icons/chathub.png',NULL,NULL,NULL,NULL,'external','https://chathub.gg/','[\"多模型\", \"对比分析\"]','{\"owner\": \"ChatHub\", \"type\": \"大模型服务\", \"logo_text\": \"多模型\"}',100,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(145,14,'marketplace','Coze AI','低门槛 AI 大模型应用开发平台，支持插件、知识库和多 Agent 协作，适合搭建业务智能体。','Bot','/tool-icons/coze-ai.png',NULL,NULL,NULL,NULL,'external','https://www.coze.cn/','[\"Agent平台\", \"插件生态\"]','{\"owner\": \"字节跳动\", \"type\": \"大模型服务\", \"logo_text\": \"Agent平台\"}',110,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(146,14,'marketplace','GlobalGPT','一站式多模型集成平台，可在统一工作区访问多种文本、图像、视频和编程模型能力。','Bot','/tool-icons/globalgpt.png',NULL,NULL,NULL,NULL,'external','https://www.glbgpt.com/','[\"多模型集成\", \"工作流\"]','{\"owner\": \"GlobalGPT\", \"type\": \"大模型服务\", \"logo_text\": \"多模型集成\"}',120,1,'2026-06-02 18:24:24','2026-06-02 10:24:25','查看详情','none',NULL,NULL,1),(147,5,'marketplace','数字员工','天罡智算公司推出的企业级数字员工平台，面向政企办公、流程办理和智能服务场景，帮助团队提升业务协同与自动化处理效率。','Bot',NULL,NULL,NULL,NULL,NULL,'external','https://tianqing.tiangangaitp.com/','[\"数字员工\", \"智能办公\"]','{\"owner\":\"天罡智算\",\"type\":\"AI办公套件\",\"logo_text\":\"数字员工\"}',130,1,'2026-06-07 10:43:08','2026-06-07 10:43:08','查看详情','none',NULL,NULL,1);
/*!40000 ALTER TABLE `resource_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_items`
--

DROP TABLE IF EXISTS `service_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `module_key` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `summary` text NOT NULL,
  `icon` varchar(64) DEFAULT NULL,
  `target_type` varchar(32) NOT NULL,
  `target_value` varchar(500) DEFAULT NULL,
  `sort_order` int NOT NULL,
  `is_published` smallint NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_service_items_id` (`id`),
  KEY `ix_service_items_module_key` (`module_key`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_items`
--

LOCK TABLES `service_items` WRITE;
/*!40000 ALTER TABLE `service_items` DISABLE KEYS */;
INSERT INTO `service_items` VALUES (27,'home_service_entries','OPC工商注册','开办指引一站式办理','/home-service-business-registration.png','internal','/setup',1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(28,'home_service_entries','政策匹配','按身份匹配创业政策','/home-service-policy-matching.png','internal','/services',2,1,'2026-04-04 04:56:19','2026-04-16 18:30:00'),(29,'home_service_entries','安居落户','人才安居配套政策信息','/home-service-settlement-support.png','internal','/settlement',3,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(30,'home_service_entries','融资对接','对接优质投资机构与资金','/home-service-financing-connection.png','internal','/financing',4,1,'2026-04-04 04:56:19','2026-04-04 04:56:19');
/*!40000 ALTER TABLE `service_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_settings`
--

DROP TABLE IF EXISTS `site_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `site_name` varchar(128) NOT NULL,
  `site_subtitle` varchar(255) NOT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `footer_text` text NOT NULL,
  `contact_phone` varchar(64) DEFAULT NULL,
  `contact_email` varchar(128) DEFAULT NULL,
  `icp_no` varchar(64) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_site_settings_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_settings`
--

LOCK TABLES `site_settings` WRITE;
/*!40000 ALTER TABLE `site_settings` DISABLE KEYS */;
INSERT INTO `site_settings` VALUES (1,'厦门OPC社区门户','成为一流的数智产业生态构建者','/site-logo-opc-community.png','© 2026 厦门 OPC 社区. All rights reserved.','0592-5953016','opc@xmigc.com','闽ICP备2026000001号','2026-04-03 11:31:11','2026-04-15 17:15:01');
/*!40000 ALTER TABLE `site_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_users`
--

DROP TABLE IF EXISTS `site_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(32) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(64) NOT NULL,
  `status` int NOT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `real_name` varchar(64) DEFAULT NULL,
  `auth_source` varchar(32) NOT NULL DEFAULT 'local',
  `external_open_id` varchar(128) DEFAULT NULL,
  `external_user_id` varchar(128) DEFAULT NULL,
  `user_type` int DEFAULT NULL,
  `mobile_fuzzy` varchar(32) DEFAULT NULL,
  `raw_profile_json` varchar(4000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_site_users_phone` (`phone`),
  UNIQUE KEY `ix_site_users_external_open_id` (`external_open_id`),
  KEY `ix_site_users_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_users`
--

LOCK TABLES `site_users` WRITE;
/*!40000 ALTER TABLE `site_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `site_users` ENABLE KEYS */;
UNLOCK TABLES;
--
-- Table structure and seed data for table `billing_products`
--

DROP TABLE IF EXISTS `billing_products`;
CREATE TABLE `billing_products` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_code` varchar(64) NOT NULL,
  `service_code` varchar(64) NOT NULL,
  `service_name` varchar(128) NOT NULL,
  `supplier_name` varchar(128) NOT NULL,
  `name` varchar(128) NOT NULL,
  `description` text DEFAULT NULL,
  `billing_mode` varchar(16) NOT NULL,
  `price` decimal(18,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'CNY',
  `sort_order` int NOT NULL DEFAULT 0,
  `status` varchar(16) NOT NULL DEFAULT 'OFF_SALE',
  `created_by` bigint NOT NULL,
  `updated_by` bigint NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_billing_products_product_code` (`product_code`),
  KEY `idx_billing_products_public` (`status`,`billing_mode`,`sort_order`,`id`),
  KEY `idx_billing_products_service` (`service_code`,`status`),
  CONSTRAINT `ck_billing_products_mode` CHECK (`billing_mode` IN ('MONTHLY','PREPAID')),
  CONSTRAINT `ck_billing_products_price` CHECK (`price` > 0),
  CONSTRAINT `ck_billing_products_currency` CHECK (`currency` = 'CNY'),
  CONSTRAINT `ck_billing_products_status` CHECK (`status` IN ('ON_SALE','OFF_SALE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `billing_products` (`id`,`product_code`,`service_code`,`service_name`,`supplier_name`,`name`,`description`,`billing_mode`,`price`,`currency`,`sort_order`,`status`,`created_by`,`updated_by`,`created_at`,`updated_at`) VALUES
(1,'AI_COMPUTE_MONTHLY','AI_COMPUTE','AI 算力服务','创新算力服务商','AI 算力包月服务','按月提供稳定算力资源，适合持续开发和模型推理场景。','MONTHLY',299.00,'CNY',10,'ON_SALE',1,1,'2026-07-14 00:00:00','2026-07-14 00:00:00'),
(2,'AI_COMPUTE_1000','AI_COMPUTE','AI 算力服务','创新算力服务商','AI 算力充值 1000 元','固定面额预充值，用于后续按实际算力消费明细扣减。','PREPAID',1000.00,'CNY',20,'ON_SALE',1,1,'2026-07-14 00:00:00','2026-07-14 00:00:00'),
(3,'AI_COMPUTE_2000','AI_COMPUTE','AI 算力服务','创新算力服务商','AI 算力充值 2000 元','固定面额预充值，适合较高频的算力使用场景。','PREPAID',2000.00,'CNY',30,'OFF_SALE',1,1,'2026-07-14 00:00:00','2026-07-14 00:00:00');

--
-- Table structure for table `billing_orders`
--

DROP TABLE IF EXISTS `billing_orders`;
CREATE TABLE `billing_orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_no` varchar(40) NOT NULL,
  `site_user_id` int NOT NULL,
  `request_id` varchar(64) NOT NULL,
  `product_id` bigint NOT NULL,
  `product_code` varchar(64) NOT NULL,
  `product_name` varchar(128) NOT NULL,
  `service_code` varchar(64) NOT NULL,
  `service_name` varchar(128) NOT NULL,
  `supplier_name` varchar(128) NOT NULL,
  `billing_mode` varchar(16) NOT NULL,
  `unit_price` decimal(18,2) NOT NULL,
  `month_count` int DEFAULT NULL,
  `order_amount` decimal(18,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'CNY',
  `service_start_date` date DEFAULT NULL,
  `service_end_date` date DEFAULT NULL,
  `status` varchar(24) NOT NULL DEFAULT 'PENDING_PAYMENT',
  `payment_channel` varchar(16) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `canceled_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_billing_orders_order_no` (`order_no`),
  UNIQUE KEY `uk_billing_orders_user_request` (`site_user_id`,`request_id`),
  KEY `idx_billing_orders_user_list` (`site_user_id`,`created_at`,`id`),
  KEY `idx_billing_orders_admin_list` (`status`,`created_at`,`id`),
  KEY `idx_billing_orders_product` (`product_id`),
  KEY `idx_billing_orders_service` (`service_code`),
  KEY `idx_billing_orders_mode` (`billing_mode`),
  CONSTRAINT `fk_billing_orders_site_user` FOREIGN KEY (`site_user_id`) REFERENCES `site_users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_billing_orders_product` FOREIGN KEY (`product_id`) REFERENCES `billing_products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_billing_orders_mode` CHECK (`billing_mode` IN ('MONTHLY','PREPAID')),
  CONSTRAINT `ck_billing_orders_amount` CHECK (`unit_price` > 0 AND `order_amount` > 0),
  CONSTRAINT `ck_billing_orders_currency` CHECK (`currency` = 'CNY'),
  CONSTRAINT `ck_billing_orders_status` CHECK (`status` IN ('PENDING_PAYMENT','PAID','CANCELED','PAYMENT_FAILED')),
  CONSTRAINT `ck_billing_orders_payment_channel` CHECK (`payment_channel` IS NULL OR `payment_channel` IN ('EXTERNAL','WALLET')),
  CONSTRAINT `ck_billing_orders_period` CHECK (
    (`billing_mode` = 'MONTHLY' AND `month_count` BETWEEN 1 AND 36 AND `service_start_date` IS NOT NULL AND `service_end_date` IS NOT NULL)
    OR (`billing_mode` = 'PREPAID' AND `month_count` IS NULL AND `service_start_date` IS NULL AND `service_end_date` IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `payment_transactions`
--

DROP TABLE IF EXISTS `payment_transactions`;
CREATE TABLE `payment_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `payment_no` varchar(40) NOT NULL,
  `order_id` bigint NOT NULL,
  `order_no` varchar(40) NOT NULL,
  `provider` varchar(32) NOT NULL,
  `provider_transaction_no` varchar(64) DEFAULT NULL,
  `amount` decimal(18,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'CNY',
  `status` varchar(16) NOT NULL DEFAULT 'CREATED',
  `checkout_url` varchar(500) DEFAULT NULL,
  `provider_completed_at` datetime DEFAULT NULL,
  `last_query_at` datetime DEFAULT NULL,
  `failure_code` varchar(64) DEFAULT NULL,
  `failure_message` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_transactions_payment_no` (`payment_no`),
  UNIQUE KEY `uk_payment_transactions_provider_tx` (`provider`,`provider_transaction_no`),
  KEY `idx_payment_transactions_order_created` (`order_id`,`created_at`,`id`),
  KEY `idx_payment_transactions_provider_status` (`provider`,`status`,`created_at`,`id`),
  CONSTRAINT `fk_payment_transactions_order` FOREIGN KEY (`order_id`) REFERENCES `billing_orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_payment_transactions_amount` CHECK (`amount` > 0),
  CONSTRAINT `ck_payment_transactions_currency` CHECK (`currency` = 'CNY'),
  CONSTRAINT `ck_payment_transactions_status` CHECK (`status` IN ('CREATED','PENDING','SUCCESS','FAILED','CLOSED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `payment_notifications`
--

DROP TABLE IF EXISTS `payment_notifications`;
CREATE TABLE `payment_notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `provider` varchar(32) NOT NULL,
  `notification_id` varchar(80) NOT NULL,
  `payment_transaction_id` bigint DEFAULT NULL,
  `signature_valid` tinyint NOT NULL DEFAULT 0,
  `process_status` varchar(16) NOT NULL DEFAULT 'RECEIVED',
  `headers_json` text NOT NULL,
  `body_text` text NOT NULL,
  `error_message` varchar(500) DEFAULT NULL,
  `received_at` datetime NOT NULL,
  `processed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_notifications_provider_notification` (`provider`,`notification_id`),
  KEY `idx_payment_notifications_received` (`provider`,`received_at`,`id`),
  KEY `idx_payment_notifications_payment` (`payment_transaction_id`,`received_at`,`id`),
  CONSTRAINT `fk_payment_notifications_payment` FOREIGN KEY (`payment_transaction_id`) REFERENCES `payment_transactions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ck_payment_notifications_process_status` CHECK (`process_status` IN ('RECEIVED','PROCESSED','REJECTED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `payment_reconciliation_batches`
--

DROP TABLE IF EXISTS `payment_reconciliation_batches`;
CREATE TABLE `payment_reconciliation_batches` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `provider` varchar(32) NOT NULL,
  `statement_date` date NOT NULL,
  `run_status` varchar(16) NOT NULL DEFAULT 'SUCCESS',
  `provider_total_count` int NOT NULL DEFAULT 0,
  `provider_total_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `system_total_count` int NOT NULL DEFAULT 0,
  `system_total_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `matched_count` int NOT NULL DEFAULT 0,
  `amount_mismatch_count` int NOT NULL DEFAULT 0,
  `status_mismatch_count` int NOT NULL DEFAULT 0,
  `system_only_count` int NOT NULL DEFAULT 0,
  `provider_only_count` int NOT NULL DEFAULT 0,
  `executed_by_admin_user_id` int NOT NULL,
  `executed_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_reconciliation_batches_provider_date` (`provider`,`statement_date`),
  KEY `idx_payment_reconciliation_batches_list` (`provider`,`statement_date`,`id`),
  CONSTRAINT `ck_payment_reconciliation_batches_provider_amount` CHECK (`provider_total_amount` >= 0),
  CONSTRAINT `ck_payment_reconciliation_batches_system_amount` CHECK (`system_total_amount` >= 0),
  CONSTRAINT `ck_payment_reconciliation_batches_run_status` CHECK (`run_status` IN ('SUCCESS','FAILED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `payment_reconciliation_items`
--

DROP TABLE IF EXISTS `payment_reconciliation_items`;
CREATE TABLE `payment_reconciliation_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `batch_id` bigint NOT NULL,
  `payment_transaction_id` bigint DEFAULT NULL,
  `payment_no` varchar(40) DEFAULT NULL,
  `provider_transaction_no` varchar(64) DEFAULT NULL,
  `order_no` varchar(40) DEFAULT NULL,
  `system_amount` decimal(18,2) DEFAULT NULL,
  `provider_amount` decimal(18,2) DEFAULT NULL,
  `system_status` varchar(16) DEFAULT NULL,
  `provider_status` varchar(16) DEFAULT NULL,
  `result` varchar(24) NOT NULL,
  `difference_message` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_payment_reconciliation_items_batch_result` (`batch_id`,`result`,`id`),
  KEY `idx_payment_reconciliation_items_payment` (`payment_transaction_id`),
  CONSTRAINT `fk_payment_reconciliation_items_batch` FOREIGN KEY (`batch_id`) REFERENCES `payment_reconciliation_batches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payment_reconciliation_items_payment` FOREIGN KEY (`payment_transaction_id`) REFERENCES `payment_transactions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ck_payment_reconciliation_items_result` CHECK (`result` IN ('MATCHED','AMOUNT_MISMATCH','STATUS_MISMATCH','SYSTEM_ONLY','PROVIDER_ONLY'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `mock_payment_transactions`
--

DROP TABLE IF EXISTS `mock_payment_transactions`;
CREATE TABLE `mock_payment_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `payment_no` varchar(40) NOT NULL,
  `order_no` varchar(40) NOT NULL,
  `provider_transaction_no` varchar(64) NOT NULL,
  `checkout_token` varchar(80) NOT NULL,
  `subject` varchar(128) NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'CNY',
  `notify_url` varchar(500) NOT NULL,
  `return_url` varchar(500) NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'PENDING',
  `failure_code` varchar(64) DEFAULT NULL,
  `failure_message` varchar(500) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `notification_mode` varchar(16) NOT NULL DEFAULT 'IMMEDIATE',
  `notification_status` varchar(16) NOT NULL DEFAULT 'PENDING',
  `notification_due_at` datetime DEFAULT NULL,
  `notification_sent_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mock_payment_transactions_payment_no` (`payment_no`),
  UNIQUE KEY `uk_mock_payment_transactions_provider_tx` (`provider_transaction_no`),
  UNIQUE KEY `uk_mock_payment_transactions_checkout_token` (`checkout_token`),
  CONSTRAINT `ck_mock_payment_transactions_amount` CHECK (`amount` > 0),
  CONSTRAINT `ck_mock_payment_transactions_currency` CHECK (`currency` = 'CNY'),
  CONSTRAINT `ck_mock_payment_transactions_status` CHECK (`status` IN ('PENDING','SUCCESS','FAILED','CLOSED')),
  CONSTRAINT `ck_mock_payment_transactions_notification_mode` CHECK (`notification_mode` IN ('IMMEDIATE','DELAYED','NONE')),
  CONSTRAINT `ck_mock_payment_transactions_notification_status` CHECK (`notification_status` IN ('PENDING','SCHEDULED','SKIPPED','SENT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `consumption_import_batches`
--

DROP TABLE IF EXISTS `consumption_import_batches`;
CREATE TABLE `consumption_import_batches` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `batch_no` varchar(40) NOT NULL,
  `record_source` varchar(32) NOT NULL DEFAULT 'EXCEL',
  `file_name` varchar(255) NOT NULL,
  `file_sha256` varchar(64) NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'PARSING',
  `total_rows` int NOT NULL DEFAULT 0,
  `valid_rows` int NOT NULL DEFAULT 0,
  `invalid_rows` int NOT NULL DEFAULT 0,
  `imported_rows` int NOT NULL DEFAULT 0,
  `uploaded_by` int NOT NULL,
  `confirmed_by` int DEFAULT NULL,
  `uploaded_at` datetime NOT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `error_message` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_consumption_import_batches_batch_no` (`batch_no`),
  KEY `idx_consumption_import_batches_uploaded_at` (`uploaded_at`,`id`),
  KEY `idx_consumption_import_batches_status` (`status`,`uploaded_at`,`id`),
  CONSTRAINT `ck_consumption_import_batches_status` CHECK (`status` IN ('PARSING','PREVIEWED','IMPORTING','COMPLETED','EXPIRED','FAILED')),
  CONSTRAINT `ck_consumption_import_batches_total_rows` CHECK (`total_rows` >= 0),
  CONSTRAINT `ck_consumption_import_batches_valid_rows` CHECK (`valid_rows` >= 0),
  CONSTRAINT `ck_consumption_import_batches_invalid_rows` CHECK (`invalid_rows` >= 0),
  CONSTRAINT `ck_consumption_import_batches_imported_rows` CHECK (`imported_rows` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `consumption_import_rows`
--

DROP TABLE IF EXISTS `consumption_import_rows`;
CREATE TABLE `consumption_import_rows` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `batch_id` bigint NOT NULL,
  `row_no` int NOT NULL,
  `record_source` varchar(32) NOT NULL DEFAULT 'EXCEL',
  `raw_values_json` text NOT NULL,
  `supplier_record_no` varchar(128) DEFAULT NULL,
  `consumed_at` datetime DEFAULT NULL,
  `user_phone` varchar(32) DEFAULT NULL,
  `service_code` varchar(64) DEFAULT NULL,
  `supplier_name` varchar(128) DEFAULT NULL,
  `item_name` varchar(200) DEFAULT NULL,
  `quantity` decimal(18,6) DEFAULT NULL,
  `unit` varchar(32) DEFAULT NULL,
  `amount` decimal(18,2) DEFAULT NULL,
  `order_no` varchar(40) DEFAULT NULL,
  `remark` varchar(500) DEFAULT NULL,
  `site_user_id` int DEFAULT NULL,
  `service_name` varchar(128) DEFAULT NULL,
  `order_id` bigint DEFAULT NULL,
  `row_status` varchar(16) NOT NULL DEFAULT 'INVALID',
  `error_message` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_consumption_import_rows_batch_row` (`batch_id`,`row_no`),
  KEY `idx_consumption_import_rows_batch_status` (`batch_id`,`row_status`,`row_no`),
  KEY `idx_consumption_import_rows_user_service` (`site_user_id`,`service_code`),
  CONSTRAINT `fk_consumption_import_rows_batch` FOREIGN KEY (`batch_id`) REFERENCES `consumption_import_batches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_consumption_import_rows_quantity` CHECK (`quantity` IS NULL OR `quantity` >= 0),
  CONSTRAINT `ck_consumption_import_rows_amount` CHECK (`amount` IS NULL OR `amount` > 0),
  CONSTRAINT `ck_consumption_import_rows_status` CHECK (`row_status` IN ('VALID','INVALID','IMPORTED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `consumption_records`
--

DROP TABLE IF EXISTS `consumption_records`;
CREATE TABLE `consumption_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `batch_id` bigint NOT NULL,
  `import_row_id` bigint NOT NULL,
  `record_source` varchar(32) NOT NULL DEFAULT 'EXCEL',
  `supplier_name` varchar(128) NOT NULL,
  `supplier_record_no` varchar(128) NOT NULL,
  `site_user_id` int NOT NULL,
  `service_code` varchar(64) NOT NULL,
  `service_name` varchar(128) NOT NULL,
  `order_id` bigint DEFAULT NULL,
  `consumed_at` datetime NOT NULL,
  `item_name` varchar(200) NOT NULL,
  `quantity` decimal(18,6) DEFAULT NULL,
  `unit` varchar(32) DEFAULT NULL,
  `amount` decimal(18,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'CNY',
  `remark` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_consumption_records_source_supplier_record` (`record_source`,`supplier_name`,`supplier_record_no`),
  UNIQUE KEY `uk_consumption_records_import_row` (`import_row_id`),
  KEY `idx_consumption_records_user_service_time` (`site_user_id`,`service_code`,`consumed_at`,`id`),
  KEY `idx_consumption_records_batch` (`batch_id`,`id`),
  KEY `idx_consumption_records_order` (`order_id`),
  CONSTRAINT `fk_consumption_records_batch` FOREIGN KEY (`batch_id`) REFERENCES `consumption_import_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_consumption_records_import_row` FOREIGN KEY (`import_row_id`) REFERENCES `consumption_import_rows` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_consumption_records_user` FOREIGN KEY (`site_user_id`) REFERENCES `site_users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_consumption_records_order` FOREIGN KEY (`order_id`) REFERENCES `billing_orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ck_consumption_records_quantity` CHECK (`quantity` IS NULL OR `quantity` >= 0),
  CONSTRAINT `ck_consumption_records_amount` CHECK (`amount` > 0),
  CONSTRAINT `ck_consumption_records_currency` CHECK (`currency` = 'CNY')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `prepaid_ledger_entries`
--

DROP TABLE IF EXISTS `prepaid_ledger_entries`;
CREATE TABLE `prepaid_ledger_entries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `site_user_id` int NOT NULL,
  `service_code` varchar(64) NOT NULL,
  `service_name` varchar(128) NOT NULL,
  `entry_type` varchar(16) NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'CNY',
  `source_type` varchar(32) NOT NULL,
  `source_id` bigint NOT NULL,
  `occurred_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_prepaid_ledger_entries_source` (`source_type`,`source_id`),
  KEY `idx_prepaid_ledger_entries_user_service_time` (`site_user_id`,`service_code`,`occurred_at`,`id`),
  CONSTRAINT `fk_prepaid_ledger_entries_user` FOREIGN KEY (`site_user_id`) REFERENCES `site_users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_prepaid_ledger_entries_type` CHECK (`entry_type` IN ('CREDIT','DEBIT')),
  CONSTRAINT `ck_prepaid_ledger_entries_amount` CHECK (`amount` > 0),
  CONSTRAINT `ck_prepaid_ledger_entries_currency` CHECK (`currency` = 'CNY'),
  CONSTRAINT `ck_prepaid_ledger_entries_source_type` CHECK (`source_type` IN ('PAID_ORDER','CONSUMPTION'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `wallet_recharge_orders`
--

DROP TABLE IF EXISTS `wallet_recharge_orders`;
CREATE TABLE `wallet_recharge_orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `recharge_no` varchar(40) NOT NULL,
  `site_user_id` int NOT NULL,
  `request_id` varchar(64) NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'CNY',
  `payment_method` varchar(16) NOT NULL,
  `status` varchar(24) NOT NULL DEFAULT 'PENDING_PAYMENT',
  `paid_at` datetime DEFAULT NULL,
  `canceled_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wallet_recharge_orders_no` (`recharge_no`),
  UNIQUE KEY `uk_wallet_recharge_orders_user_request` (`site_user_id`,`request_id`),
  KEY `idx_wallet_recharge_orders_user_created` (`site_user_id`,`created_at`,`id`),
  KEY `idx_wallet_recharge_orders_status_created` (`status`,`created_at`,`id`),
  CONSTRAINT `fk_wallet_recharge_orders_user` FOREIGN KEY (`site_user_id`) REFERENCES `site_users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_wallet_recharge_orders_amount` CHECK (`amount` > 0),
  CONSTRAINT `ck_wallet_recharge_orders_currency` CHECK (`currency` = 'CNY'),
  CONSTRAINT `ck_wallet_recharge_orders_method` CHECK (`payment_method` IN ('ALIPAY','WECHAT')),
  CONSTRAINT `ck_wallet_recharge_orders_status` CHECK (`status` IN ('PENDING_PAYMENT','PAID','CANCELED','PAYMENT_FAILED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `wallet_payment_transactions`
--

DROP TABLE IF EXISTS `wallet_payment_transactions`;
CREATE TABLE `wallet_payment_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `payment_no` varchar(40) NOT NULL,
  `recharge_order_id` bigint NOT NULL,
  `recharge_no` varchar(40) NOT NULL,
  `provider` varchar(32) NOT NULL,
  `provider_transaction_no` varchar(64) DEFAULT NULL,
  `amount` decimal(18,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'CNY',
  `status` varchar(16) NOT NULL DEFAULT 'CREATED',
  `checkout_url` varchar(500) DEFAULT NULL,
  `provider_completed_at` datetime DEFAULT NULL,
  `last_query_at` datetime DEFAULT NULL,
  `failure_code` varchar(64) DEFAULT NULL,
  `failure_message` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wallet_payment_transactions_payment_no` (`payment_no`),
  UNIQUE KEY `uk_wallet_payment_transactions_provider_tx` (`provider`,`provider_transaction_no`),
  KEY `idx_wallet_payment_transactions_order_created` (`recharge_order_id`,`created_at`,`id`),
  KEY `idx_wallet_payment_transactions_provider_status` (`provider`,`status`,`created_at`,`id`),
  CONSTRAINT `fk_wallet_payment_transactions_order` FOREIGN KEY (`recharge_order_id`) REFERENCES `wallet_recharge_orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_wallet_payment_transactions_amount` CHECK (`amount` > 0),
  CONSTRAINT `ck_wallet_payment_transactions_currency` CHECK (`currency` = 'CNY'),
  CONSTRAINT `ck_wallet_payment_transactions_status` CHECK (`status` IN ('CREATED','PENDING','SUCCESS','FAILED','CLOSED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `wallet_ledger_entries`
--

DROP TABLE IF EXISTS `wallet_ledger_entries`;
CREATE TABLE `wallet_ledger_entries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `site_user_id` int NOT NULL,
  `entry_type` varchar(16) NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'CNY',
  `source_type` varchar(24) NOT NULL,
  `source_id` bigint NOT NULL,
  `title` varchar(200) NOT NULL,
  `service_code` varchar(64) DEFAULT NULL,
  `service_name` varchar(128) DEFAULT NULL,
  `occurred_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wallet_ledger_entries_source` (`source_type`,`source_id`),
  KEY `idx_wallet_ledger_entries_user_time` (`site_user_id`,`occurred_at`,`id`),
  KEY `idx_wallet_ledger_entries_user_type_time` (`site_user_id`,`entry_type`,`occurred_at`,`id`),
  CONSTRAINT `fk_wallet_ledger_entries_user` FOREIGN KEY (`site_user_id`) REFERENCES `site_users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_wallet_ledger_entries_type` CHECK (`entry_type` IN ('CREDIT','DEBIT')),
  CONSTRAINT `ck_wallet_ledger_entries_amount` CHECK (`amount` > 0),
  CONSTRAINT `ck_wallet_ledger_entries_currency` CHECK (`currency` = 'CNY'),
  CONSTRAINT `ck_wallet_ledger_entries_source_type` CHECK (`source_type` IN ('PAID_ORDER','CONSUMPTION','RECHARGE_ORDER','ORDER_PAYMENT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--
-- Table structure for trusted data space registration integration
--

DROP TABLE IF EXISTS `trusted_dataspace_submission_attempts`;
DROP TABLE IF EXISTS `trusted_dataspace_registrations`;
CREATE TABLE `trusted_dataspace_registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `site_user_id` int NOT NULL,
  `dept_name` varchar(255) NOT NULL,
  `credit_code` varchar(18) NOT NULL,
  `legal_person_name` varchar(128) NOT NULL,
  `legal_person_id_card_ciphertext` text NOT NULL,
  `legal_person_phone` varchar(32) NOT NULL,
  `account` varchar(32) NOT NULL,
  `status` varchar(32) NOT NULL,
  `current_seq_no` varchar(128) DEFAULT NULL,
  `provider_message` varchar(500) DEFAULT NULL,
  `last_error_code` varchar(64) DEFAULT NULL,
  `last_error_message` varchar(500) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `last_synced_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_trusted_dataspace_registrations_user` (`site_user_id`),
  UNIQUE KEY `uk_trusted_dataspace_registrations_seq_no` (`current_seq_no`),
  UNIQUE KEY `uk_trusted_dataspace_registrations_credit_code` (`credit_code`),
  UNIQUE KEY `uk_trusted_dataspace_registrations_phone` (`legal_person_phone`),
  UNIQUE KEY `uk_trusted_dataspace_registrations_account` (`account`),
  KEY `idx_trusted_dataspace_registrations_status_updated` (`status`,`updated_at`),
  CONSTRAINT `fk_trusted_dataspace_registrations_user` FOREIGN KEY (`site_user_id`) REFERENCES `site_users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_trusted_dataspace_registrations_status` CHECK (`status` IN ('SUBMITTING','PENDING','COMPLETED','REJECTED','SUBMIT_FAILED','SUBMISSION_UNKNOWN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `trusted_dataspace_submission_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `registration_id` int NOT NULL,
  `idempotency_key` varchar(128) NOT NULL,
  `seq_no` varchar(128) DEFAULT NULL,
  `result_status` varchar(32) NOT NULL,
  `provider_code` varchar(64) DEFAULT NULL,
  `provider_message` varchar(500) DEFAULT NULL,
  `request_started_at` datetime NOT NULL,
  `responded_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_trusted_dataspace_attempts_registration_key` (`registration_id`,`idempotency_key`),
  KEY `idx_trusted_dataspace_attempts_seq_no` (`seq_no`),
  KEY `idx_trusted_dataspace_attempts_registration_created` (`registration_id`,`created_at`),
  CONSTRAINT `fk_trusted_dataspace_attempts_registration` FOREIGN KEY (`registration_id`) REFERENCES `trusted_dataspace_registrations` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_trusted_dataspace_attempts_status` CHECK (`result_status` IN ('SUBMITTING','PENDING','COMPLETED','REJECTED','SUBMIT_FAILED','SUBMISSION_UNKNOWN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-07 14:08:01
