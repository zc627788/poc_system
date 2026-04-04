-- MySQL dump 10.13  Distrib 8.4.8, for Linux (x86_64)
--
-- Host: localhost    Database: opc_portal
-- ------------------------------------------------------
-- Server version	8.4.8

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

--
-- Current Database: `opc_portal`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `opc_portal` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `opc_portal`;

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES (1,'admin','$pbkdf2-sha256$29000$yrn3njPG2FsLgfB.7x1j7A$waY3N/o7N5islYBIN5qbmADqTslofodrWGqdV6JfQYY','系统管理员',1,'2026-04-03 11:31:11','2026-04-04 11:20:43');
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
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `articles`
--

LOCK TABLES `articles` WRITE;
/*!40000 ALTER TABLE `articles` DISABLE KEYS */;
INSERT INTO `articles` VALUES (54,21,'「爱XIA创AI 黑客松」活动正式启动','48小时极限开发挑战，聚焦 AIGC 与 AI Agent 创新应用，欢迎开发者与创业团队参与。','external','https://mp.weixin.qq.com/s/5ZyyYJ9SxSqmVDk7dPmCAg','2026-03-18 10:00:00','微信公众号',1,1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(55,21,'AI 火炬系列活动：厦门赛博龙虾俱乐部·咖啡局 No.2','聚焦人工智能创业趋势与落地机会，连接技术、资本与场景资源。','external','https://mp.weixin.qq.com/s/F-Ze-sn-3lUxorbJyBm-VQ','2026-03-17 09:30:00','微信公众号',0,1,2,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(56,21,'AI 火炬系列活动：OpenClaw 社区聚会回顾','围绕智能体开发、协作和产品验证，持续沉淀社区技术氛围。','external','https://mp.weixin.qq.com/s/ixud6hSPtDkp6-MZU2eLXQ','2026-03-10 09:00:00','微信公众号',0,1,3,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(57,22,'厦门市进一步推动人工智能产业高质量发展若干措施','围绕产业培育、场景开放和人才支持，推动厦门人工智能产业集聚发展。','external','https://www.xm.gov.cn/zwgk/flfg/sfbwj/202602/t20260228_2983172.htm?assistant=true','2026-02-28 12:00:00','厦门市人民政府',1,1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(58,22,'火炬高新区支持人工智能和软件产业发展的若干措施解读','聚焦产业扶持、创新平台与成长企业培育，适合初创团队快速了解申报方向。','external','https://xmtorch.xm.gov.cn/xxgk/zfxxgkml/zcfg/zcjd/202603/t20260302_2983503.html','2026-03-02 09:00:00','厦门火炬高新区',0,1,2,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(59,22,'思明区促进新一代人工智能产业发展扶持措施','提供产业支持与财政配套，支持人工智能企业在本地落地成长。','external','https://www.siming.gov.cn/zfxxgkzl/gbmxxgk/kjhxxhj/zfxxgkml/zcfg/202412/t20241220_1083000.htm','2024-12-20 10:00:00','思明区科技和工信局',0,1,3,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(60,23,'AI 创业者如何更快完成 MVP 首版交付','从原型、内容配置到场景验证，梳理一套轻量交付路径，帮助创业团队快速上线。','external','https://example.com/ai-mvp','2026-03-22 11:00:00','OPC 社区',1,1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(61,23,'从社区活动到项目落地：OPC 的协同路径','连接创业者、场景方与服务机构，形成项目孵化和验证闭环。','external','https://example.com/opc-path','2026-03-15 14:00:00','OPC 社区',0,1,2,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(62,24,'2026 年第一批人工智能项目征集通知','开放项目征集与配套服务申请，支持创新团队申报社区资源支持。','external','https://example.com/project-notice','2026-03-25 09:00:00','OPC 社区',1,1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(63,24,'创业服务专场咨询日预约通道开放','面向创业团队开放政策、财税、空间和融资咨询预约。','external','https://example.com/consulting-day','2026-03-12 15:00:00','OPC 社区',0,1,2,'2026-04-04 04:56:19','2026-04-04 04:56:19');
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners`
--

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
INSERT INTO `banners` VALUES (16,'数智立信 创见不凡','成为一流的数智产业生态构建者','AI 黑客松大赛2','48小时极限开发，AIGC 与 AI Agent 双赛道角逐，发掘优质项目，搭建“产学研投”融合平台。','/prototype-assets/7.png','external','https://mp.weixin.qq.com/s/Jk_CpIzU5o99-i3jliTJ0w?scene=1&click_id=1',2,1,'2026-04-04 04:56:19','2026-04-04 10:53:28'),(17,'数智立信 创见不凡','成为一流的数智产业生态构建者','AI 火炬系列活动','聚焦行业前沿探索与创业交流，持续激发人工智能社区活力，连接技术、场景与产业伙伴。','/prototype-assets/火炬系列.png','external','https://mp.weixin.qq.com/s/F-Ze-sn-3lUxorbJyBm-VQ',1,1,'2026-04-04 04:56:19','2026-04-04 10:53:24'),(18,'数智立信 创见不凡','成为一流的数智产业生态构建者','厦门OPC社区空间','提供空间载体、算力支持、工具共享、创业辅导等全链条服务，助力“一人成军、轻量创业”。','/prototype-assets/社区.png','internal','/community',3,1,'2026-04-04 04:56:19','2026-04-04 04:56:19');
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedbacks`
--

LOCK TABLES `feedbacks` WRITE;
/*!40000 ALTER TABLE `feedbacks` DISABLE KEYS */;
INSERT INTO `feedbacks` VALUES (1,'首页内容建议','建议在首页最新动态区域增加置顶标识，方便访客快速识别重点通知。','13900001111','homepage-note.png',NULL,'pending',NULL,NULL,NULL,0,'2026-04-04 09:26:02','2026-04-04 09:26:02',1,'门户演示用户'),(2,'资源市场咨询','希望确认 GPU 资源的交付周期，并补充套餐对比说明。','13700003333','gpu-plan.pdf',NULL,'processing','已安排运营同事整理 GPU 套餐对比，本周内补充到资源市场页面。','admin','2026-04-04 10:30:00',0,'2026-04-04 09:45:00','2026-04-04 10:30:00',NULL,'合作企业联系人'),(3,'移动端适配建议','建议移动端导航抽屉里增加当前登录手机号展示，方便确认登录身份。','13900001111',NULL,NULL,'resolved','已在移动端导航抽屉中增加登录状态和退出入口，问题已处理。','admin','2026-04-04 11:15:00',0,'2026-04-04 10:05:00','2026-04-04 11:15:00',1,'门户演示用户');
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
INSERT INTO `navigation_items` VALUES (56,'首页','/','internal','/',1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(57,'最新动态','/news','internal','/news',2,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(58,'社区简介','/community','internal','/community',3,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(59,'创业服务','/services','internal','/services',4,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(60,'资源集市','/marketplace','internal','/marketplace',5,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(61,'意见反馈','/feedback','internal','/feedback',6,1,'2026-04-04 04:56:19','2026-04-04 04:56:19');
/*!40000 ALTER TABLE `navigation_items` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `page_sections`
--

LOCK TABLES `page_sections` WRITE;
/*!40000 ALTER TABLE `page_sections` DISABLE KEYS */;
INSERT INTO `page_sections` VALUES (30,'home','community_intro','厦门OPC社区211','打造一流的数智产业创新创业生态','提供空间载体、算力支持、财税辅导等全链条赋能服务，助力“一人成军、轻量创业”。','{\"button_text\": \"了解更多\", \"action_type\": \"internal\", \"action_value\": \"/community\", \"image_url\": \"https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400\"}',1,1,'2026-04-04 04:56:19','2026-04-04 06:53:31'),(31,'home','marketplace_summary','AI资源集市','汇聚数据、工具、算力与应用入口','汇聚前沿数据资源、强劲算力服务与轻量化应用工具包，直达开发者终端，即开即用。','{\"button_text\": \"查看资源集市\", \"action_type\": \"internal\", \"action_value\": \"/marketplace\", \"tags\": [\"数据资源\", \"轻量工具包\", \"普惠算力\"]}',2,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(32,'home','scenario_1','场景机会','汇聚真实行业需求 · 发掘合作共赢商机','全面覆盖数字经济、人工智能、智慧物流、全空间无人体系等多元产业领域，提供前沿的场景开放清单。','{\"button_text\": \"探索场景机会\", \"action_type\": \"external\", \"action_value\": \"https://xmcj.ixiamen.org.cn/opportunity\", \"bg_from\": \"#0052d9\", \"bg_to\": \"#60a5fa\"}',3,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(33,'home','scenario_2','场景能力','展示前沿技术方案 · 赋能千行百业升级','集中展示基于 AI 大模型、清洁能源等前沿科技的场景集成服务能力与解决方案。','{\"button_text\": \"查看场景能力\", \"action_type\": \"external\", \"action_value\": \"https://xmcj.ixiamen.org.cn/capability\", \"bg_from\": \"#0052d9\", \"bg_to\": \"#06b6d4\"}',4,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(34,'home','scenario_3','场景政策','解读权威惠企资讯 · 共享政策扶持红利','实时汇编国家及地方层面的场景创新培育、低空经济发展、人才招引补贴等利好政策。','{\"button_text\": \"了解场景政策\", \"action_type\": \"external\", \"action_value\": \"https://xmcj.ixiamen.org.cn/policy\", \"bg_from\": \"#0052d9\", \"bg_to\": \"#6366f1\"}',5,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(35,'news','hero','最新动态','一站掌握人工智能OPC创业动态','',NULL,1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(36,'community','hero','专业化智创社区','','','{\"tags\": [\"开放共享\", \"设施齐全\", \"全链服务\"]}',1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(37,'community','intro','社区介绍','','厦门信息集团OPC社区，立足厦门软件园产业阵地，以 <span class=\"text-[#0052d9] font-bold text-[17px]\">OPC（一人公司 / 开放式合伙协作）</span> 为核心模式，打造面向 <span class=\"text-[#0052d9] font-bold text-[17px]\">AI 时代的超级个体创业共生平台</span>，是集团赋能数字经济、培育新型创业生态的重要载体。社区聚焦 <span class=\"text-gray-900 font-semibold\">数字创意、AIGC、具身智能、电商、新媒体</span> 等领域，为个体创业者、小微团队提供 <span class=\"text-[#0052d9] font-bold text-[17px]\">空间载体、算力支持、工具共享、订单对接、财税服务、投融资对接全链条一站式服务</span>，助力“<span class=\"text-orange-500 font-black text-[18px]\">一人成军、轻量创业</span>”。',NULL,2,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(38,'community','stats','社区数据','','','{\"items\": [{\"value\": \"300+\", \"label\": \"入驻团队\"}, {\"value\": \"5000+\", \"label\": \"服务人次\"}, {\"value\": \"2万㎡\", \"label\": \"社区面积\"}, {\"value\": \"50+\", \"label\": \"合作机构\"}]}',3,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(39,'community','base_soft2','厦门信息集团OPC社区（软二基地）','','','{\"address\": \"厦门软件园二期观日路32号\", \"phone\": \"5953016\", \"email\": \"zhengwenya@xmigc.com\", \"button_text\": \"申请入驻\", \"action_type\": \"none\", \"action_value\": \"\", \"image_url\": \"https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800\", \"alt\": \"厦门OPC社区办公环境\"}',4,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(40,'community','base_soft3','厦门信息集团OPC社区（软三基地）','','','{\"address\": \"厦门软件园三期F06\", \"phone\": \"5953921\", \"email\": \"chenting@xmigc.com\", \"button_text\": \"申请入驻\", \"action_type\": \"none\", \"action_value\": \"\", \"image_url\": \"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800\", \"alt\": \"厦门软件园三期建筑\", \"reverse\": true}',5,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(41,'community','requirements','入驻条件：','','','{\"items\": [\"个人创业者或不超过3人微型团队\", \"从事AI相关领域产品/服务开发\", \"持有有效证件完成实名认证\", \"通过社区资质审核\"]}',6,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(42,'services','hero','厦门OPC专属创业政策服务','个性化、精准化匹配','',NULL,1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(43,'services','policy_filters','政策匹配','','','{\"type_options\": [\"应届毕业生\", \"AI从业者\", \"海归创业者\"], \"stage_options\": [\"AI电商\", \"软件开发\", \"开发中\", \"已注册企业\"], \"default_types\": [\"应届毕业生\"], \"default_stages\": [\"AI电商\"]}',2,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(44,'services','policy_cards','政策列表','','','{\"items\": [{\"title\": \"高校毕业生见习补贴\", \"desc\": \"为符合条件的应届毕业生提供最高12个月的见习生活及租房补贴。\", \"tags\": [\"应届毕业生\", \"开发中\"], \"button_text\": \"查看详情\", \"action_type\": \"none\", \"action_value\": \"\"}, {\"title\": \"高层次人才公积金补贴\", \"desc\": \"海归及高层次人才购房公积金贷款额度最高可上浮至4倍。\", \"tags\": [\"海归创业者\"], \"button_text\": \"查看详情\", \"action_type\": \"none\", \"action_value\": \"\"}, {\"title\": \"AI产业场地租金减免\", \"desc\": \"针对AI领域初创企业提供最高3年的办公场地租金全额减免。\", \"tags\": [\"AI从业者\", \"软件开发\"], \"button_text\": \"查看详情\", \"action_type\": \"none\", \"action_value\": \"\"}, {\"title\": \"电商发展专项扶持基金\", \"desc\": \"鼓励AI技术在电商领域的应用转化，最高给予50万元启动资金。\", \"tags\": [\"AI电商\", \"已注册企业\"], \"button_text\": \"查看详情\", \"action_type\": \"none\", \"action_value\": \"\"}, {\"title\": \"创业第一贴\", \"desc\": \"首次创办小微企业或从事个体经营的高校毕业生，给予一次性创业补贴。\", \"tags\": [\"应届毕业生\", \"已注册企业\"], \"button_text\": \"查看详情\", \"action_type\": \"none\", \"action_value\": \"\"}, {\"title\": \"研发投入奖励补贴\", \"desc\": \"对软件开发及AI算法模型研发投入费用，给予最高15%的资金奖励。\", \"tags\": [\"软件开发\", \"AI从业者\"], \"button_text\": \"查看详情\", \"action_type\": \"none\", \"action_value\": \"\"}]}',3,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(45,'services','support_cards','创业配套服务','','','{\"items\": [{\"icon\": \"FileCheck\", \"title\": \"OPC开办\", \"desc\": \"提供OPC公司注册、税务登记、对公账户开立等一站式开办指引，让轻量创业更简单。\", \"action_type\": \"internal\", \"action_value\": \"/setup\"}, {\"icon\": \"Home\", \"title\": \"安居落户\", \"desc\": \"整理并对接厦门市各类人才安居、保障性商品房申请及应届生落户配套政策信息。\", \"action_type\": \"internal\", \"action_value\": \"/settlement\"}, {\"icon\": \"Coins\", \"title\": \"融资对接\", \"desc\": \"汇聚海量优质投资机构资源，协助AI及数字经济赛道创业者对接早期天使与VC资金。\", \"action_type\": \"internal\", \"action_value\": \"/financing\"}]}',4,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(46,'setup','hero','OPC 开办全流程指引','提供企业注册、税务登记、对公账户等一站式开办服务','',NULL,1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(47,'setup','journey','企业开办服务流程','','','{\"start\": {\"icon\": \"Monitor\", \"title\": \"申请人提出\\n企业开办申请\"}, \"top_service\": {\"text\": \"银行预约开户、用电\\n报装等延伸服务\"}, \"application_options\": [{\"icon\": \"Monitor\", \"title\": \"“一网通”平台\", \"desc\": \"全流程网上申请\\n无需任何纸质材料\"}, {\"icon\": \"User\", \"title\": \"开办企业专窗\", \"desc\": \"提交：企业设立登记\\n申请材料+发票申领\\n文书\"}], \"multi_cert_text\": \"“多证合一”涉企执照事项目录\\n（三十五证合一）\", \"steps\": [{\"icon\": \"FileText\", \"title\": \"企业登记\", \"subtitle\": \"0.5天内核发营业执照\"}, {\"icon\": \"Receipt\", \"title\": \"申领发票\", \"subtitle\": \"0.5天内核发并交邮\"}, {\"icon\": \"Stamp\", \"title\": \"印章刻制\"}, {\"icon\": \"Briefcase\", \"title\": \"就业登记\"}, {\"icon\": \"Building2\", \"title\": \"住房公积金企业缴存登记\"}], \"result\": {\"icon\": \"UserCheck\", \"title\": \"申请人\", \"desc\": \"无需现场领取\\n静等执照、发票\\n邮寄上门\"}}',2,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(48,'financing','hero','融资对接','百亿元“人工智能产业基金群”支持、政策性股权投资、OPC专项信贷产品等','',NULL,1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(49,'financing','intro','OPC 产业基金群资金申请','','为人工智能创业项目提供强大的资金“后盾”，厦门设立总规模百亿元的人工智能产业基金群，主要面向早期的人工智能技术类项目和数字创意类项目，以“真金白银”帮助 OPC 单人创业者及微型团队走稳轻量创业的“第一步”。',NULL,2,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(50,'financing','fund_cards','融资卡片','','','{\"items\": [{\"icon\": \"Coins\", \"title\": \"人工智能产业投资基金\", \"desc\": \"专项扶持厦门市人工智能领域的初创企业，重点关注AIGC、大模型应用等方向。\", \"button_text\": \"立即申请\", \"action_type\": \"none\", \"action_value\": \"\"}, {\"icon\": \"TrendingUp\", \"title\": \"新质生产力基金\", \"desc\": \"针对具身智能、元宇宙等前沿科技行业，重点支持具有核心技术壁垒的创新项目。\", \"button_text\": \"立即申请\", \"action_type\": \"none\", \"action_value\": \"\"}, {\"icon\": \"Droplets\", \"title\": \"滴灌科创基金\", \"desc\": \"支持种子期、初创期微型团队，提供灵活的“滴灌式”小额精准融资服务。\", \"button_text\": \"立即申请\", \"action_type\": \"none\", \"action_value\": \"\"}]}',3,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(51,'settlement','hero','安居落户','人才就业、安居保障服务事项指引','',NULL,1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(52,'settlement','intro','智汇厦门 · 安居 OPC','全方位创业人才落户与住房保障','','{\"image_url\": \"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=300\"}',2,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(53,'settlement','housing_cards','安居卡片','','','{\"items\": [{\"icon\": \"Home\", \"title\": \"人才房申请\", \"desc\": \"为符合条件的软三园区及重点企业人才提供专属公寓房源，解决住房后顾之忧。\", \"action_type\": \"external\", \"action_value\": \"https://www.xmsoft.com/pzt/fg/serviceDetail.html?serveCd=FW042&parkCd=02\"}, {\"icon\": \"UserCheck\", \"title\": \"高层次人才安居政策\", \"desc\": \"针对高层次拔尖人才提供购房补贴、租房补贴等高标准的专属安居保障。\", \"action_type\": \"external\", \"action_value\": \"https://irencai.xmdjej.gov.cn/zc_view.html?rowId=810156846588362786\"}, {\"icon\": \"Building\", \"title\": \"实习求职免费“一张床”\", \"desc\": \"为来厦求职、实习的高校毕业生提供免费住宿保障，切实减轻短期居住负担。\", \"action_type\": \"external\", \"action_value\": \"https://irencai.xmdjej.gov.cn/zc_view.html?rowId=810157347216293927\"}, {\"icon\": \"Ticket\", \"title\": \"“五年五折”租房补贴\", \"desc\": \"新就业大学生等青年群体可享受租房租金五折优惠补贴，最长可保障五年。\", \"action_type\": \"external\", \"action_value\": \"https://irencai.xmdjej.gov.cn/zc_view.html?rowId=810157347216293927\"}, {\"icon\": \"Banknote\", \"title\": \"人才生活补助\", \"desc\": \"为新引进的高学历毕业生、高技能人才等提供专属生活补贴，降低生活成本。\", \"action_type\": \"external\", \"action_value\": \"https://irencai.xmdjej.gov.cn/zc_view.html?rowId=810157347216293927\"}, {\"icon\": \"Briefcase\", \"title\": \"青年创业支持政策\", \"desc\": \"为青年创业人才和初创微型团队提供场地租金减免、创业奖励等全方位扶持。\", \"action_type\": \"external\", \"action_value\": \"https://irencai.xmdjej.gov.cn/zc_view.html?rowId=810157347216293927\"}]}',3,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(54,'marketplace','hero','厦门OPC专属资源集市服务','协助创业者快速进行资源检索','',NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(55,'api_market','hero','API 服务市场','聚合常用 API 能力，覆盖电子商务、生活服务与数据智能场景。','',NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(56,'mcp_market','hero','MCP 标准连接服务','通过标准化连接能力打通工具、数据与模型，让 AI 应用更充分地协同外界资源。','',NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15');
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_resource_categories_code` (`code`),
  KEY `ix_resource_categories_resource_type` (`resource_type`),
  KEY `ix_resource_categories_id` (`id`),
  KEY `ix_resource_categories_group_key` (`group_key`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resource_categories`
--

LOCK TABLES `resource_categories` WRITE;
/*!40000 ALTER TABLE `resource_categories` DISABLE KEYS */;
INSERT INTO `resource_categories` VALUES (1,'marketplace_data_center','数据资源中心','marketplace','data','整合多源政务数据、社会数据等资源，提供数据目录浏览、资源申请、数据获取等全流程服务，打破数据孤岛，实现数据要素的高效流通与开发利用。','Server','external','https://www.xmdataspace.com/portal/dataSource','查看详情',10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(2,'marketplace_model_center','模型成果中心','marketplace','data','汇聚行业领先基础大模型，提供大模型微调、评测、部署等全生命周期服务，降低企业应用门槛，打造智能体生态，赋能千行百业智能化转型。','Box','external','https://www.xmdataspace.com/portal/market','查看详情',20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(3,'marketplace_dataset_center','高质量数据集','marketplace','data','甄选高质量政务数据、行业公共数据，经过专业清洗、标注与脱敏处理，提供标准一致、标签丰富的高价值数据集，为 AI 模型训练提供优质数据底座。','Database','external','https://www.xmdataspace.com/portal/societyMarket','查看详情',30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(4,'marketplace_api','API','marketplace','tools','为 OPC 创业者提供生成服务、金融科技、数据智能等多类接口能力，帮助项目快速接入核心功能，降低开发成本，加速产品落地。','Zap','internal','/api-market','了解更多',40,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(5,'marketplace_mcp','MCP','marketplace','tools','通过标准化连接能力打通工具、数据与模型，让 AI 应用更充分地协同外界资源，提升自动化水平与业务闭环效率。','Workflow','internal','/mcp-market','了解更多',50,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(6,'marketplace_tools','产品工具','marketplace','tools','围绕 OPC 创业者在项目启动、产品路线、运营增长、数据分析与支付接入等环节的实际需求，提供一站式工具支持。','Wrench','internal','/marketplace','了解更多',60,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(7,'marketplace_compute','普惠算力','marketplace','compute','厦门市公共算力服务平台整合优质计算能力与配套服务，支撑人工智能项目训练、推理与应用落地。','Cpu','external','https://www.xmcpsp.com/','查看详情',70,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(8,'api_all','全部','api_market',NULL,'资源汇总视图','AppWindow','none',NULL,NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(9,'api_ecommerce','电子商务','api_market',NULL,'电商经营与交易配套能力','ShoppingCart','none',NULL,NULL,20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(10,'api_life_service','生活服务','api_market',NULL,'生活服务与公共信息能力','MapPin','none',NULL,NULL,30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(11,'api_data_intelligence','数据智能','api_market',NULL,'模型、识别与智能理解能力','Brain','none',NULL,NULL,40,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(12,'mcp_default','MCP 服务','mcp_market',NULL,'标准化连接服务目录','Workflow','none',NULL,NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15');
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
  PRIMARY KEY (`id`),
  KEY `ix_resource_items_id` (`id`),
  KEY `ix_resource_items_category_id` (`category_id`),
  KEY `ix_resource_items_resource_type` (`resource_type`),
  CONSTRAINT `resource_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `resource_categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resource_items`
--

LOCK TABLES `resource_items` WRITE;
/*!40000 ALTER TABLE `resource_items` DISABLE KEYS */;
INSERT INTO `resource_items` VALUES (1,1,'marketplace','厦门网络预约出租汽车车辆运营证核...','资源摘要：厦门网络预约出租汽车车辆运营证核发（设区的市级权限）信息，包括所有人信息、车辆信息等。','Box',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/dataSource',NULL,'{\"type\":\"API\",\"owner\":\"市交通运输局\",\"tag\":\"交通运输\",\"publish_date\":\"2025-12-12\"}',10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(2,1,'marketplace','厦门市运政船舶营运证信息','资源摘要：厦门市运政船舶营运证信息，包括船舶名称、营运证号等信息。','Box',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/dataSource',NULL,'{\"type\":\"API\",\"owner\":\"市交通运输局\",\"tag\":\"交通运输\",\"publish_date\":\"2025-12-12\"}',20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(3,1,'marketplace','厦门市已备案的密室逃脱名录信息','资源摘要：厦门市已备案的密室逃脱名录信息，包括备案号和单位等信息。','Box',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/dataSource',NULL,'{\"type\":\"API\",\"owner\":\"市文化和旅游局\",\"tag\":\"文化旅游\",\"publish_date\":\"2025-12-12\"}',30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(4,2,'marketplace','矿山大模型','资源摘要：联合矿山大模型数据，通过大模型技术解决复杂的工业场景需求...','Box',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/market','[\"交通物流\"]','{\"label\":\"模型类型：大语言模型\",\"publish_date\":\"2026-02-05\"}',10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(5,2,'marketplace','旅游导润大模型','资源摘要：整合文旅多维数据集，通过大模型技术赋能旅游智能规划、客服问答...','Box',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/market','[\"文化旅游\"]','{\"label\":\"模型类型：大语言模型\",\"publish_date\":\"2026-02-05\"}',20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(6,2,'marketplace','出行大模型','资源摘要：结合出行行业多维数据集，通过大模型技术实现智能调度、路径优化...','Box',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/market','[\"公共服务\"]','{\"label\":\"模型类型：大语言模型\",\"publish_date\":\"2026-02-05\"}',30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(7,3,'marketplace','文化旅游数据集','数据摘要：包含厦门市及周边区域的旅游景点信息、历史文化介绍、游客评价等数据...','Database',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/societyMarket','[\"文化旅游\"]','{\"label\":\"数据类型：文本\",\"publish_date\":\"2026-02-05\"}',10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(8,3,'marketplace','医学三元结数据集','数据摘要：整合医疗领域的疾病、症状、药物等实体及其关系，支持构建医疗知识图谱...','Database',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/societyMarket','[\"卫生健康\"]','{\"label\":\"数据类型：文本\",\"publish_date\":\"2026-02-06\"}',20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(9,3,'marketplace','供应链标准术语数据集','数据摘要：核心内容涵盖国际贸易、物流配送、供应链金融等领域的标准专业术语...','Database',NULL,NULL,NULL,NULL,NULL,'external','https://www.xmdataspace.com/portal/societyMarket','[\"商贸流通\"]','{\"label\":\"数据类型：文本\",\"publish_date\":\"2026-03-19\"}',30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(10,4,'marketplace','AI视频制作','支持通过文字描述生成高质量视频画面，为内容创作者提供强大的效率工具支持。','Zap',NULL,NULL,NULL,NULL,NULL,'internal','/api-market','[\"免费\"]',NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(11,4,'marketplace','AI图像编辑','提供图片去水印、智能抠图、画质增强等图像处理 API，赋能电商设计与新媒体运营。','Zap',NULL,NULL,NULL,NULL,NULL,'internal','/api-market','[\"限免\"]',NULL,20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(12,4,'marketplace','AI图像生成','只需输入 Prompt 即可生成创意图片，支持多种风格转换，适用于文创设计。','Zap',NULL,NULL,NULL,NULL,NULL,'internal','/api-market','[\"免费\"]',NULL,30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(13,5,'marketplace','[定制化]库房盘点','面向仓储与物流场景的标准化连接服务。','Workflow',NULL,NULL,NULL,NULL,NULL,'internal','/mcp-market',NULL,'{\"items\":[\"智能识别货架商品\",\"自动核对库存数据\",\"一键生成盘点报告\"]}',10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(14,5,'marketplace','导购机器人','面向零售与服务咨询的交互型连接服务。','Workflow',NULL,NULL,NULL,NULL,NULL,'internal','/mcp-market',NULL,'{\"items\":[\"7x24小时在线答疑\",\"个性化商品推荐\",\"多语言无缝切换\"]}',20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(15,5,'marketplace','#地址标准化','面向地址纠错与地理信息处理的连接服务。','Workflow',NULL,NULL,NULL,NULL,NULL,'internal','/mcp-market',NULL,'{\"items\":[\"不规范地址智能纠错\",\"行政区划自动补全\",\"经纬度精准转换\"]}',30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(16,6,'marketplace','AI SCENE','让每个企业都拥有 AI 数字员工，AI SCENE 帮助企业打造一体化智能展示平台，无缝链接各类设备。','Wrench',NULL,NULL,NULL,NULL,NULL,'external','https://www.aiscenes.cn/',NULL,'{\"logo_text\":\"I SCENE\",\"sub_text\":\"MASTER AI场景大屏\"}',10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(17,6,'marketplace','DataArts','高效服务于数据标准落地、数据质量提升、盘活数据资产，提升经营管理水平。','Wrench',NULL,NULL,NULL,NULL,NULL,'external','https://dataarts.juhe.cn/?f=head',NULL,'{\"logo_text\":\"DataArts\",\"sub_text\":\"数据全生命周期敏捷治理平台\"}',20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(18,6,'marketplace','Elastic Search','一款基于开源 Elasticsearch、OpenSearch 打造的通用云端检索安全托管服务，支持安全检索、极简查询。','Wrench',NULL,NULL,NULL,NULL,NULL,'external','https://ecloud.10086.cn/portal/product/elasticsearch',NULL,'{\"logo_text\":\"Elastic\",\"sub_text\":\"Search\"}',30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(19,7,'marketplace','MetaX C550 64GB','普惠算力卡型，面向模型训练与推理场景。','Cpu',NULL,'可租赁','4,320','/ 月',NULL,'external','https://www.xmcpsp.com/',NULL,NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(20,7,'marketplace','Nvidia A800 80GB','高性能算力资源，支持大模型训练与复杂推理任务。','Cpu',NULL,'可租赁','55,000','/ 月',NULL,'external','https://www.xmcpsp.com/',NULL,NULL,20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(21,7,'marketplace','Iluvatar BI-V150 64GB','兼顾成本与性能的算力资源，适合中轻量模型任务。','Cpu',NULL,'可租赁','3,960','/ 月',NULL,'external','https://www.xmcpsp.com/',NULL,NULL,30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(22,11,'api_market','人脸实名认证','校验姓名、身份证号、人脸图片信息是否一致，进行人脸实名认证。','ScanFace',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(23,11,'api_market','AI语音合成 TTS API','支持多语言多音色的智能语音合成能力。','Mic',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(24,11,'api_market','Google Gemini Image API','图像生成与编辑能力，适用于创意设计与内容生产。','Image',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(25,11,'api_market','AI视频创作','通过自然语言文本生成高质量视频内容。','Video',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,40,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(26,11,'api_market','AI图像编辑','根据文本提示与图片链接完成风格化图像编辑。','Image',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,50,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(27,11,'api_market','AI图像生成','根据 Prompt 生成具有场景与风格的图像。','Image',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,60,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(28,11,'api_market','AI图像理解','快速准确地解析和理解图像内容，支持复杂场景识别。','Image',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,70,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(29,11,'api_market','活体人脸实名认证H5版','搭载真人检测与人脸比对等生物识别技术，支持 PC 和移动端。','ScanFace',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,80,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(30,11,'api_market','身份证OCR识别','支持二代居民身份证正反面关键字段识别。','ScanFace',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,90,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(31,11,'api_market','智能取名','根据性别、姓氏等属性智能推荐名字，仅供娱乐参考。','FileText',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\",\"支持MCP\"]',NULL,100,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(32,11,'api_market','语音图像垃圾分类识别','通过语音或图片自动识别垃圾名称并给出垃圾分类信息。','Mic',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,110,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(33,11,'api_market','通用印刷体识别','支持图像整体文字检测和识别，返回文字框位置与内容。','Image',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,120,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(34,11,'api_market','银行卡 OCR 识别','支持银行卡卡号、有效期、发卡行等关键字段结构化识别。','CreditCard',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,130,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(35,11,'api_market','证件识别','支持身份证、银行卡、驾驶证、营业执照等三十多种证件的 OCR 识别。','ScanFace',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,140,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(36,11,'api_market','名片识别','快速识别姓名、职位、手机、邮箱等名片内容。','FileText',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,150,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(37,12,'mcp_market','[限免]火车查询订票','一个提供火车票和高铁票查询服务的 MCP 服务。','Train',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"query_train_tickets\",\"book_train_ticket\",\"pay_train_ticket\"]',NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(38,12,'mcp_market','手机归属地查询','提供手机号码归属地、所属号段、手机卡类型、运营商等信息查询。','Smartphone',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_mobile_location\"]',NULL,20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(39,12,'mcp_market','IP地址归属地','提供 IPv4 地址归属地信息查询的 MCP 服务。','MapPin',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_ipv4_location\"]',NULL,30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(40,12,'mcp_market','全球快递物流','提供全球快递物流状态信息查询的 MCP 服务。','Package',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_express_info\"]',NULL,40,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(41,12,'mcp_market','全国天气预报','提供全国城市、地区、区县实时天气预报情况的 MCP 服务。','CloudSun',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_weather\"]',NULL,50,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(42,12,'mcp_market','实时汇率查询','提供全球货币之间汇率查询的 MCP 服务。','Banknote',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_exchange_rate\"]',NULL,60,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(43,12,'mcp_market','今日头条新闻','提供新闻头条信息查询功能，使大模型可以获取当前最新资讯。','Newspaper',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_news_list\",\"get_news_content\"]',NULL,70,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(44,12,'mcp_market','今日全国油价','提供今日全国油价查询功能的 MCP 服务。','Fuel',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_oil_price\"]',NULL,80,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(45,12,'mcp_market','星座运势','提供星座今日、明日、本周、本年运势查询功能的 MCP 服务。','Star',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_horoscope\"]',NULL,90,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(46,12,'mcp_market','全国空气质量','提供全国 300 多个城市的实时空气质量查询功能。','Wind',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_air_quality\"]',NULL,100,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(47,12,'mcp_market','老黄历','提供老黄历信息查询的 MCP 服务。','CalendarDays',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_almanac\"]',NULL,110,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(48,12,'mcp_market','NBA赛程','提供 NBA 近期赛程和比分结果查询的 MCP 服务。','Dribbble',NULL,NULL,NULL,NULL,'未开通','none',NULL,'[\"get_nba_schedule\"]',NULL,120,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(49,8,'api_market','人脸实名认证','校验姓名、身份证号、人脸图片信息是否一致，进行人脸实名认证。','ScanFace',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(50,8,'api_market','AI语音合成 TTS API','提供多种拟人音色，支持多语言及方言，并可在同一音色下输出多语言内容，系统可自适应语气，流畅处理复杂文本。','Mic',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(51,8,'api_market','Google Gemini Image API','Nano Banana 图像模型可提供高质量图像生成与编辑能力。','Image',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(52,8,'api_market','AI视频创作','通过自然语言文本智能生成高质量视频，适用于营销与内容制作。','Video',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,40,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(53,8,'api_market','AI图像编辑','根据文本提示和图片链接编辑原图，广泛应用于电商与广告设计。','Image',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,50,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(54,8,'api_market','AI图像生成','根据文本提示生成具有特定风格、场景和氛围感的图像。','Image',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,60,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(55,8,'api_market','三网手机实名认证[简]','核验手机运营商三要素信息是否一致，只返回一致或不一致。','Smartphone',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\",\"个人高级认证\",\"支持MCP\"]',NULL,70,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(56,8,'api_market','身份证实名认证','核验身份证二要素信息是否一致。','ScanFace',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\",\"个人高级认证\",\"支持MCP\"]',NULL,80,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(57,8,'api_market','短信API服务','支持三大运营商短信发送，独享专用通道，3 秒可达，适合高并发场景。','MessageSquare',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,90,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(58,8,'api_market','AI联网搜索','提供实时联网搜索能力，返回 url、标题与摘要等丰富内容。','Search',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,100,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(59,8,'api_market','银行卡四元素检测[简]','校验银行卡四要素信息是否一致，只返回一致或不一致。','CreditCard',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,110,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(60,8,'api_market','银行卡三元素检测[简]','校验银行卡三要素信息是否一致，只返回一致或不一致。','CreditCard',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\",\"支持MCP\"]',NULL,120,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(61,8,'api_market','全国城市空气质量','提供空气质量与污染物浓度查询，覆盖全国多个城市与站点。','CloudRain',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\",\"支持MCP\"]',NULL,130,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(62,8,'api_market','运营商基站信息','支持全球 200 多个国家或地区，以及国内三网运营商基站位置信息数据查询。','Radio',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,140,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(63,9,'api_market','全球快递物流查询','支持全球上千家快递公司跟踪服务，可自动识别快递公司及单号。','Package',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"低至 ￥0.01/次\"]',NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(64,9,'api_market','手机号码归属地','输入手机号查询归属地、所属号段、卡类型和运营商等信息。','Smartphone',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\",\"支持MCP\"]',NULL,20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(65,9,'api_market','二维码生成','按设定参数生成二维码。','LayoutTemplate',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(66,9,'api_market','银行联行号查询','可根据关键字、银行名称、银行卡号、省、市等查询联行号信息。','CreditCard',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,40,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(67,9,'api_market','专利查询','提供专利相关信息检索能力。','Search',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,50,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(68,9,'api_market','标准中文电码查询','依托海量标准中文电码数据，提供快速精准的中文电码查询服务。','FileText',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,60,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(69,9,'api_market','图书电商数据','提供好书推荐与图书电商相关数据能力。','BookOpen',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,70,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(70,9,'api_market','Whois 实时查询','通过 Whois 接口查询域名注册状态与持有者等信息。','Globe',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,80,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(71,10,'api_market','短信API服务','支持三大运营商短信发送，适应多种业务场景与高并发需求。','MessageSquare',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,10,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(72,10,'api_market','AI联网搜索','依托海量数据返回丰富的搜索结果摘要，支持实时联网访问。','Search',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,20,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(73,10,'api_market','台风路径','查询台风信息和台风路径。','Wind',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,30,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(74,10,'api_market','IPv4地址查询-区县级','可查询 IPv4 地址的国家、省、市、邮编及经纬度信息，可精确至区县级。','MapPin',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,40,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(75,10,'api_market','IPv6地址查询-城市级','根据 IPv6 地址查询所属区域，可精确到城市级。','MapPin',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,50,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(76,10,'api_market','新闻头条','提供最新新闻头条与资讯能力，更新周期快。','Newspaper',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\",\"支持MCP\"]',NULL,60,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(77,10,'api_market','性格测试','基于 MBTI 理论生成性格测试报告，供娱乐与参考。','User',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,70,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(78,10,'api_market','历史天气','提供全国历史天气相关信息查询，包括温度、天气状况与风力风向。','CloudRain',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\"]',NULL,80,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(79,10,'api_market','气象预警V2','查询国家预警信息发布中心发布的台风、暴雨、寒潮等预警信息。','CloudSun',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,90,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(80,10,'api_market','国际短信','覆盖 200 多个国家和地区，适合企业海外业务拓展。','MessageSquare',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,100,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(81,10,'api_market','视频短信','支持发送视频和图片等富媒体短信信息。','Video',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"付费\",\"企业专用\"]',NULL,110,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(82,10,'api_market','万年历','支持指定日期查询星期、星座、农历、生肖、黄历宜忌等信息。','CalendarDays',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,120,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(83,10,'api_market','热门视频榜单','提供抖音热门视频及多类榜单数据。','Video',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,130,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(84,10,'api_market','数独游戏生成器','提供多难度随机数独谜题与答案生成能力。','LayoutTemplate',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,140,1,'2026-04-04 06:28:15','2026-04-04 06:28:15'),(85,10,'api_market','笑话大全','持续更新网络幽默、搞笑与内涵段子内容。','MessageSquare',NULL,NULL,NULL,NULL,NULL,'none',NULL,'[\"免费\"]',NULL,150,1,'2026-04-04 06:28:15','2026-04-04 06:28:15');
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
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_items`
--

LOCK TABLES `service_items` WRITE;
/*!40000 ALTER TABLE `service_items` DISABLE KEYS */;
INSERT INTO `service_items` VALUES (27,'home_service_entries','OPC开办','开办指引一站式办理','FileCheck','internal','/setup',1,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(28,'home_service_entries','政策匹配','按身份匹配近似申报 H-list 政策','Shield','internal','/services',2,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(29,'home_service_entries','安居落户','人才安居配套政策信息','Home','internal','/settlement',3,1,'2026-04-04 04:56:19','2026-04-04 04:56:19'),(30,'home_service_entries','融资对接','对接优质投资机构与资金','Coins','internal','/financing',4,1,'2026-04-04 04:56:19','2026-04-04 04:56:19');
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
INSERT INTO `site_settings` VALUES (1,'厦门OPC社区门户','成为一流的数智产业生态构建者','/prototype-assets/opc-logo.png','© 2026 厦门 OPC 社区. All rights reserved.','0592-5953016','opc@xmigc.com','闽ICP备2026000001号','2026-04-03 11:31:11','2026-04-04 11:20:43');
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_site_users_phone` (`phone`),
  KEY `ix_site_users_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_users`
--

LOCK TABLES `site_users` WRITE;
/*!40000 ALTER TABLE `site_users` DISABLE KEYS */;
INSERT INTO `site_users` VALUES (1,'13900001111','$pbkdf2-sha256$29000$6723FmIspbS29j6HsPaekw$bOXp/8OurvE14q35KpBHYQK/LY6YSBtBW8MKgNrAjbg','门户演示用户',1,'2026-04-04 18:00:00','2026-04-04 09:00:00','2026-04-04 18:00:00');
/*!40000 ALTER TABLE `site_users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-04 11:21:12
