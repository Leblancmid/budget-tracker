-- MariaDB dump 10.19  Distrib 10.4.28-MariaDB, for osx10.10 (x86_64)
--
-- Host: 127.0.0.1    Database: budget_tracker
-- ------------------------------------------------------
-- Server version	10.4.28-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `budgets` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint(20) unsigned NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `month` tinyint(3) unsigned NOT NULL,
  `year` smallint(5) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `budgets_category_id_month_year_unique` (`category_id`,`month`,`year`),
  CONSTRAINT `budgets_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budgets`
--

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
INSERT INTO `budgets` VALUES (1,2,2500.00,7,2026,'2026-06-30 22:22:35','2026-07-05 18:49:56'),(2,1,5000.00,7,2026,'2026-07-01 18:42:37','2026-07-02 01:33:56'),(3,6,1000.00,7,2026,'2026-07-02 01:33:37','2026-07-02 01:33:37'),(4,7,2500.00,7,2026,'2026-07-02 01:33:45','2026-07-05 18:49:22');
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `business_budgets`
--

DROP TABLE IF EXISTS `business_budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `business_budgets` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint(20) unsigned NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `month` tinyint(3) unsigned NOT NULL,
  `year` smallint(5) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `business_budgets_category_id_month_year_unique` (`category_id`,`month`,`year`),
  CONSTRAINT `business_budgets_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `business_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `business_budgets`
--

LOCK TABLES `business_budgets` WRITE;
/*!40000 ALTER TABLE `business_budgets` DISABLE KEYS */;
/*!40000 ALTER TABLE `business_budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `business_categories`
--

DROP TABLE IF EXISTS `business_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `business_categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` enum('account','gold','expense') NOT NULL,
  `color` varchar(7) NOT NULL DEFAULT '#6366f1',
  `icon` varchar(255) NOT NULL DEFAULT 'tag',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `business_categories`
--

LOCK TABLES `business_categories` WRITE;
/*!40000 ALTER TABLE `business_categories` DISABLE KEYS */;
INSERT INTO `business_categories` VALUES (1,'Gold','account','#eab308','briefcase','2026-07-01 21:27:40','2026-07-01 21:34:46'),(3,'Gold','expense','#ef4444','briefcase','2026-07-01 21:34:03','2026-07-01 21:34:37'),(4,'Account','account','#eab308','briefcase','2026-07-01 21:34:12','2026-07-01 21:34:12'),(5,'Account','expense','#ef4444','briefcase','2026-07-01 21:34:21','2026-07-01 21:34:21');
/*!40000 ALTER TABLE `business_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `business_transactions`
--

DROP TABLE IF EXISTS `business_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `business_transactions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `account_id` bigint(20) unsigned DEFAULT NULL,
  `type` enum('account','gold','expense') NOT NULL,
  `action` enum('buy','sell') DEFAULT NULL,
  `price_rate` decimal(10,6) DEFAULT NULL,
  `cost_rate` decimal(10,6) DEFAULT NULL,
  `php_rate` decimal(10,4) DEFAULT NULL,
  `price_php` decimal(15,2) DEFAULT NULL,
  `cost_php` decimal(15,2) DEFAULT NULL,
  `profit_php` decimal(15,2) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_transactions_account_id_foreign` (`account_id`),
  CONSTRAINT `business_transactions_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `rucoy_accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `business_transactions`
--

LOCK TABLES `business_transactions` WRITE;
/*!40000 ALTER TABLE `business_transactions` DISABLE KEYS */;
INSERT INTO `business_transactions` VALUES (18,8,'account',NULL,0.220000,0.170000,61.4100,14861.22,7829.78,7031.44,7031.44,'Leblanc 600 Melee','2026-07-03',NULL,NULL,'2026-07-03 01:07:42','2026-07-09 06:26:50'),(19,7,'account',NULL,0.220000,0.170000,61.4100,32424.48,19835.43,12589.05,12589.05,'Leblanc 624 Melee','2026-07-03',NULL,NULL,'2026-07-03 01:09:20','2026-07-09 05:13:53'),(20,6,'account',NULL,0.239000,0.216800,61.5000,22047.75,19999.80,2047.95,2047.95,'Leblanc 618 Dist','2026-07-03',NULL,'2026-07-09 17:08:42','2026-07-03 01:09:45','2026-07-09 17:08:42'),(21,4,'account',NULL,0.220000,0.170000,61.4100,35126.52,19835.43,15291.09,15291.09,'Leblanc 632 Dist','2026-07-03',NULL,NULL,'2026-07-03 01:10:04','2026-07-09 17:53:04'),(22,3,'account',NULL,0.220000,0.170000,61.4100,45934.68,25055.28,20879.40,20879.40,'Leblanc 648 Dist','2026-07-03',NULL,NULL,'2026-07-03 01:11:34','2026-07-06 00:54:13'),(23,2,'account',NULL,0.220000,0.170000,61.4500,78410.20,52232.50,26177.70,26177.70,'Leblanc 702 Melee','2026-07-03',NULL,'2026-07-12 14:57:45','2026-07-03 01:12:04','2026-07-12 14:57:45'),(25,9,'account',NULL,0.220000,0.160000,61.5000,25314.63,18410.64,6903.99,6903.99,'1.5kkk (.16$ rate)','2026-07-08',NULL,NULL,'2026-07-08 06:00:19','2026-07-11 23:13:10'),(26,10,'account',NULL,0.220000,0.170000,61.5000,8118.00,0.00,8118.00,8118.00,'Leblanc 560 Mage','2026-07-10',NULL,NULL,'2026-07-09 18:11:33','2026-07-09 18:11:33'),(27,11,'account',NULL,0.220000,0.160000,61.5000,36531.00,20664.00,15867.00,15867.00,'Leblanc 642 Melee','2026-07-12',NULL,NULL,'2026-07-11 23:16:20','2026-07-11 23:16:20');
/*!40000 ALTER TABLE `business_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `color` varchar(7) NOT NULL DEFAULT '#6366f1',
  `icon` varchar(255) NOT NULL DEFAULT 'tag',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Foods','expense','#06b6d4','tag','2026-06-30 00:42:16','2026-07-01 18:45:23'),(2,'Transportations','expense','#f97316','tag','2026-06-30 00:43:32','2026-07-01 18:45:25'),(5,'Savings','income','#ef4444','tag','2026-06-30 21:50:55','2026-07-02 17:56:20'),(6,'Bills','expense','#22c55e','tag','2026-07-01 18:43:23','2026-07-01 18:45:20'),(7,'Others','expense','#ec4899','tag','2026-07-02 01:29:04','2026-07-02 21:44:11'),(8,'Salary','income','#4f46e5','Briefcase','2026-07-06 19:12:34','2026-07-06 19:12:34');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gold_logs`
--

DROP TABLE IF EXISTS `gold_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gold_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('add','sell') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gold_logs`
--

LOCK TABLES `gold_logs` WRITE;
/*!40000 ALTER TABLE `gold_logs` DISABLE KEYS */;
INSERT INTO `gold_logs` VALUES (5,'add',3000000.00,'2 MM Fee','2026-07-01 17:19:44','2026-07-01 17:19:44'),(6,'sell',1250000000.00,'Payment for nolife sil (650kk left)','2026-07-02 18:02:53','2026-07-02 18:02:53'),(7,'add',1000000.00,'MM Fee','2026-07-02 18:03:48','2026-07-02 18:03:48'),(8,'sell',600000000.00,'Buying Leblanc 618 Dist','2026-07-02 18:31:02','2026-07-02 18:31:02'),(9,'sell',650000000.00,'Buying Leblanc 624 Melee','2026-07-02 21:02:28','2026-07-02 21:02:28'),(10,'add',650000000.00,NULL,'2026-07-02 21:02:59','2026-07-02 21:02:59'),(11,'sell',700000000.00,NULL,'2026-07-02 21:05:40','2026-07-02 21:05:40'),(12,'add',50000000.00,NULL,'2026-07-02 21:07:09','2026-07-02 21:07:09'),(13,'add',770885811.00,NULL,'2026-07-02 21:08:02','2026-07-02 21:08:02'),(14,'sell',650000000.00,'Buying Leblanc 624 Melee (Not yet paid ig)','2026-07-02 21:10:17','2026-07-02 21:10:17'),(15,'sell',600000000.00,'Buying Leblanc 618 Dist (Not yet paid ig)','2026-07-02 21:15:18','2026-07-02 21:15:18'),(16,'sell',750000000.00,'Buying Leblanc 600 Melee (not yet paid ig)','2026-07-02 21:16:08','2026-07-02 21:16:08'),(17,'add',750000000.00,'Leblanc 593 Melee (Sold)','2026-07-02 21:25:28','2026-07-02 21:25:28'),(18,'add',200000000.00,'Buy gold for law (2k gcash)','2026-07-05 17:35:48','2026-07-05 17:35:48'),(19,'add',14000000.00,'MM Fee','2026-07-05 18:06:09','2026-07-05 18:06:09'),(20,'add',2000000.00,'MM fee 7/13 598','2026-07-05 18:31:55','2026-07-05 18:31:55'),(21,'add',2000000.00,'MM Fee 7/13 140 + Swift','2026-07-05 23:58:23','2026-07-05 23:58:23'),(22,'add',2000000.00,'7/14 335 (MM Fee)','2026-07-06 18:40:24','2026-07-06 18:40:24'),(25,'sell',50000.00,'Sold to player A (KKS)','2026-07-06 19:12:34','2026-07-06 19:12:34'),(26,'add',180000.00,'Gold farming — week 3','2026-07-06 19:12:34','2026-07-06 19:12:34'),(27,'sell',80000.00,'Sold to player B (CASH)','2026-07-06 19:12:34','2026-07-06 19:12:34'),(28,'add',220000.00,'Gold farming — week 4','2026-07-06 19:12:34','2026-07-06 19:12:34'),(29,'sell',620000.00,NULL,'2026-07-06 19:59:48','2026-07-06 19:59:48'),(30,'add',1500000000.00,'Bought gold for 240$ (.16$ rate)','2026-07-08 05:59:25','2026-07-08 05:59:25'),(31,'add',9000000.00,'MM Fee','2026-07-08 06:14:45','2026-07-08 06:14:45'),(32,'add',3000000.00,'7/16 3800 (MM Fee)','2026-07-09 00:37:56','2026-07-09 00:37:56'),(33,'sell',650000000.00,'Bought Leblanc 624 Melee (Fully Paid)','2026-07-09 03:39:44','2026-07-09 03:39:44'),(34,'add',1100000000.00,'Sold: uzeroa6@gmail.com','2026-07-09 05:16:41','2026-07-09 05:16:41'),(36,'sell',1100000000.00,'Bug','2026-07-09 05:19:01','2026-07-09 05:19:01'),(39,'add',1397500001.00,'Gold Adjustment','2026-07-09 05:58:15','2026-07-09 05:58:15'),(42,'add',2000000.00,'7/16 130 (MM Fee)','2026-07-09 06:31:10','2026-07-09 06:31:10'),(43,'add',1500000000.00,'Sold: Leblanc 618 Dist','2026-07-09 17:08:42','2026-07-09 17:08:42'),(44,'add',2000000.00,'MM Fee','2026-07-09 17:12:46','2026-07-09 17:12:46'),(45,'sell',750000000.00,'Buying Leblanc 600 Melee','2026-07-09 17:25:01','2026-07-09 17:25:01'),(46,'sell',1000000.00,'Cancellation','2026-07-09 21:19:11','2026-07-09 21:19:11'),(47,'add',171900000.00,'Bought gold for .16','2026-07-11 23:10:46','2026-07-11 23:10:46'),(48,'add',8000000.00,'MM Fee','2026-07-11 23:11:23','2026-07-11 23:11:23'),(49,'add',2000000.00,'MM Fee','2026-07-12 06:34:09','2026-07-12 06:34:09'),(50,'add',1000000.00,'7/19 83 (MM Fee)','2026-07-12 06:37:21','2026-07-12 06:37:21'),(51,'add',5800000000.00,'Sold: Leblanc 702 Melee','2026-07-12 14:57:45','2026-07-12 14:57:45'),(52,'sell',999999.00,'cancel trade','2026-07-13 01:40:47','2026-07-13 01:40:47');
/*!40000 ALTER TABLE `gold_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `golds`
--

DROP TABLE IF EXISTS `golds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `golds` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `amount` decimal(20,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `golds`
--

LOCK TABLES `golds` WRITE;
/*!40000 ALTER TABLE `golds` DISABLE KEYS */;
INSERT INTO `golds` VALUES (5,0.00,'Current Gold','2026-07-01 01:36:02','2026-07-02 21:02:28'),(6,0.00,'Sveet','2026-07-01 01:42:58','2026-07-02 21:02:28'),(7,0.00,'Wheres my 25kk toad','2026-07-01 01:47:28','2026-07-02 21:02:28'),(8,0.00,'2 MM Fee','2026-07-01 17:19:44','2026-07-02 21:02:28'),(9,0.00,'MM Fee','2026-07-02 18:03:48','2026-07-02 21:02:28'),(10,0.00,NULL,'2026-07-02 21:02:59','2026-07-02 21:05:40'),(11,0.00,NULL,'2026-07-02 21:05:40','2026-07-02 21:15:18'),(12,0.00,NULL,'2026-07-02 21:07:09','2026-07-02 21:15:18'),(13,0.00,NULL,'2026-07-02 21:08:02','2026-07-02 21:15:18'),(14,0.00,NULL,'2026-07-02 21:15:18','2026-07-02 21:16:08'),(15,-1229114189.00,NULL,'2026-07-02 21:16:08','2026-07-02 21:16:08'),(16,749380000.00,'Leblanc 593 Melee (Sold)','2026-07-02 21:25:28','2026-07-06 19:59:48'),(17,200000000.00,'Buy gold for law (2k gcash)','2026-07-05 17:35:48','2026-07-05 17:35:48'),(18,14000000.00,'MM Fee','2026-07-05 18:06:09','2026-07-05 18:06:09'),(19,2000000.00,'MM fee 7/13 598','2026-07-05 18:31:55','2026-07-05 18:31:55'),(20,2000000.00,'MM Fee 7/13 140 + Swift','2026-07-05 23:58:23','2026-07-05 23:58:23'),(21,2000000.00,'7/14 335 (MM Fee)','2026-07-06 18:40:24','2026-07-06 18:40:24'),(22,620000.00,'Current gold stash','2026-07-06 19:12:34','2026-07-06 19:12:34'),(23,850000000.00,'Bought gold for 240$ (.16$ rate)','2026-07-08 05:59:25','2026-07-09 03:39:44'),(24,9000000.00,'MM Fee','2026-07-08 06:14:45','2026-07-08 06:14:45'),(25,3000000.00,'7/16 3800 (MM Fee)','2026-07-09 00:37:56','2026-07-09 00:37:56'),(27,0.00,'Sold: uzeroa6@gmail.com','2026-07-09 05:16:41','2026-07-09 05:19:01'),(31,1396500001.00,'Gold Adjustment','2026-07-09 05:58:15','2026-07-09 21:19:11'),(34,2000000.00,'7/16 130 (MM Fee)','2026-07-09 06:31:10','2026-07-09 06:31:10'),(35,750000000.00,'Sold: Leblanc 618 Dist','2026-07-09 17:08:42','2026-07-09 17:25:01'),(36,2000000.00,'MM Fee','2026-07-09 17:12:46','2026-07-09 17:12:46'),(37,171900000.00,'Bought gold for .16','2026-07-11 23:10:46','2026-07-11 23:10:46'),(38,8000000.00,'MM Fee','2026-07-11 23:11:23','2026-07-11 23:11:23'),(39,2000000.00,'MM Fee','2026-07-12 06:34:09','2026-07-12 06:34:09'),(40,1000000.00,'7/19 83 (MM Fee)','2026-07-12 06:37:21','2026-07-12 06:37:21'),(41,5799000001.00,'Sold: Leblanc 702 Melee','2026-07-12 14:57:45','2026-07-13 01:40:47');
/*!40000 ALTER TABLE `golds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2024_01_01_000001_create_categories_table',1),(5,'2024_01_01_000002_create_transactions_table',1),(6,'2024_01_01_000003_create_budgets_table',1),(7,'2024_01_02_000001_create_golds_table',1),(8,'2024_01_02_000002_create_rucoy_accounts_table',1),(9,'2024_01_02_000003_create_trades_table',1),(10,'2026_07_01_093739_create_gold_logs_table',1),(11,'2026_07_02_051125_create_business_transactions_table',1),(12,'2026_07_02_120000_create_savings_table',1),(13,'2026_07_06_100000_add_php_values_to_business_transactions_table',1),(14,'2026_07_07_035531_create_personal_access_tokens_table',1),(28,'2026_07_09_054146_add_payment_date_to_rucoy_accounts_table',2);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (2,'App\\Models\\User',1,'api-token','720ba48807640427077e785fa3200d78237bfac4b11c2b086271aa8000120b4e','[\"*\"]',NULL,NULL,'2026-07-06 20:00:40','2026-07-06 20:00:40'),(4,'App\\Models\\User',1,'api-token','e572152c7c5765043f636ba29749d1878915f78311c679cd32ec3f917e8914e2','[\"*\"]',NULL,NULL,'2026-07-07 01:58:22','2026-07-07 01:58:22'),(6,'App\\Models\\User',1,'api-token','4d2ac54090708eb17d187d4c2b5a7be4066e11cf18137d23b90ecd2ecd5bc66f','[\"*\"]',NULL,NULL,'2026-07-07 02:03:56','2026-07-07 02:03:56');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rucoy_accounts`
--

DROP TABLE IF EXISTS `rucoy_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rucoy_accounts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `description` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  `cost` decimal(12,2) DEFAULT NULL,
  `payment_status` enum('not_paid','partially_paid','fully_paid') NOT NULL DEFAULT 'not_paid',
  `payment_date` date DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rucoy_accounts`
--

LOCK TABLES `rucoy_accounts` WRITE;
/*!40000 ALTER TABLE `rucoy_accounts` DISABLE KEYS */;
INSERT INTO `rucoy_accounts` VALUES (1,'Leblanc 593 Melee','markjhonedralin@gmail.com',NULL,750000000.00,700000000.00,'fully_paid',NULL,'2026-07-02 21:24:55','2026-06-30 22:55:53','2026-07-02 21:24:55'),(2,'Leblanc 702 Melee','chrystianrodrigues445@gmail.com',NULL,5800000000.00,5000000000.00,'fully_paid',NULL,'2026-07-12 14:57:45','2026-06-30 22:57:26','2026-07-12 14:57:45'),(3,'Leblanc 648 Dist','johncurlyofficial@gmail.com',NULL,3400000000.00,2400000000.00,'fully_paid',NULL,NULL,'2026-06-30 22:58:28','2026-07-06 00:54:13'),(4,'Leblanc 632 Dist','mauricio.nto@gmail.com',NULL,2600000000.00,1900000000.00,'fully_paid',NULL,NULL,'2026-06-30 22:59:04','2026-07-09 17:52:47'),(6,'Leblanc 618 Dist','michaelbernal547@gmail.com',NULL,1500000000.00,1500000000.00,'fully_paid',NULL,'2026-07-09 17:08:42','2026-07-01 18:09:11','2026-07-09 17:08:42'),(7,'Leblanc 624 Melee','msgamer273@gmail.com',NULL,2400000000.00,1900000000.00,'fully_paid',NULL,NULL,'2026-07-02 17:29:37','2026-07-09 05:13:53'),(8,'Leblanc 600 Melee','uzeroa6@gmail.com',NULL,1100000000.00,750000000.00,'fully_paid',NULL,NULL,'2026-07-02 17:31:23','2026-07-09 17:22:44'),(9,'1.871kk (.16$ rate)','leblancrucoys@gmail.com',NULL,1871000000.00,1871000000.00,'fully_paid',NULL,NULL,'2026-07-08 05:59:59','2026-07-11 23:12:46'),(10,'Leblanc 560 Mage','muhammadse53@gmail.com',NULL,600000000.00,0.00,'not_paid',NULL,NULL,'2026-07-09 18:10:49','2026-07-09 18:10:49'),(11,'Leblanc 642 Melee','zeta24595@gmail.com',NULL,2700000000.00,2100000000.00,'not_paid','2026-07-18',NULL,'2026-07-11 23:15:51','2026-07-11 23:43:44');
/*!40000 ALTER TABLE `rucoy_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `savings`
--

DROP TABLE IF EXISTS `savings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `savings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `mode_of_payment` enum('CIMB','MARIBANK','GCASH') NOT NULL,
  `type` enum('deposit','withdraw') NOT NULL,
  `transfer` enum('daily_expenses','business') DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `savings`
--

LOCK TABLES `savings` WRITE;
/*!40000 ALTER TABLE `savings` DISABLE KEYS */;
INSERT INTO `savings` VALUES (9,'CIMB','deposit',NULL,'Overall',163605.00,'2026-07-10','2026-07-09 17:44:15','2026-07-09 17:44:25');
/*!40000 ALTER TABLE `savings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('7MpKjAawmC0qGVqJUi5gjjOGktMhNr6pKlkJMrN1',NULL,'100.105.230.63','Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.51 Mobile/15E148 Safari/604.1','YTozOntzOjY6Il90b2tlbiI7czo0MDoiNWt0bVVpbm96b0cxamQxbndxWDVXNXo5MmtZZ0FGdVZTZk04MDJmRiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjY6Imh0dHA6Ly8xMDAuODEuMjIuMTE2L3J1Y295IjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1783867793),('NB1dgGpvshg9cc4y11FBcaFlMkJjNlj2rrZZD2CG',NULL,'100.105.230.63','Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1','YTozOntzOjY6Il90b2tlbiI7czo0MDoiU3UzTHl0N1VhUWNFSWVwaWNoUndwbERNVmhRdEFqdU1TM0xPYUFjRCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjk6Imh0dHA6Ly8xMDAuODEuMjIuMTE2L2J1c2luZXNzIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1783935258),('xvTtaGNCAZF8a1yQTayLyl8vkIJkqRcvqFVeVLic',NULL,'100.81.22.116','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiZThpd2NLOG9SRlF1aHRGYlpuYTdGRG5qRlM1djd1NjNRQlJaSTRzQiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzI6Imh0dHA6Ly8xMDAuODEuMjIuMTE2L3J1Y295L2dvbGRzIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1783842208);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trades`
--

DROP TABLE IF EXISTS `trades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `trades` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `gold_id` bigint(20) unsigned DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` enum('kks','cash') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `currency` varchar(3) DEFAULT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `completion_date` date DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `trades_gold_id_foreign` (`gold_id`),
  CONSTRAINT `trades_gold_id_foreign` FOREIGN KEY (`gold_id`) REFERENCES `golds` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trades`
--

LOCK TABLES `trades` WRITE;
/*!40000 ALTER TABLE `trades` DISABLE KEYS */;
INSERT INTO `trades` VALUES (1,NULL,'7/6 330','kks',330000000.00,NULL,NULL,'2026-07-06','2026-07-06 20:01:36','2026-06-30 23:20:25','2026-07-06 20:01:36'),(2,NULL,'7/10 €1718','cash',1718.00,'EUR','paypal','2026-07-10',NULL,'2026-07-01 00:22:27','2026-07-09 09:23:34'),(3,NULL,'7/4 69','kks',69000000.00,NULL,NULL,'2026-07-04','2026-07-05 17:00:11','2026-07-01 00:23:34','2026-07-05 17:00:11'),(4,NULL,'7/1 600','kks',600000000.00,NULL,NULL,'2026-07-01','2026-07-01 17:43:14','2026-07-01 00:27:15','2026-07-01 17:43:14'),(5,NULL,'7/7 120','kks',120000000.00,NULL,NULL,'2026-07-07','2026-07-08 06:08:23','2026-07-01 00:28:48','2026-07-08 06:08:23'),(6,NULL,'7/3 188','kks',188000000.00,NULL,NULL,'2026-07-03','2026-07-02 21:19:41','2026-07-01 00:29:17','2026-07-02 21:19:41'),(7,NULL,'7/5 1080','kks',1080000000.00,NULL,NULL,'2026-07-05','2026-07-05 17:33:38','2026-07-01 00:29:53','2026-07-05 17:33:38'),(8,NULL,'7/2 300','kks',300000000.00,NULL,NULL,'2026-07-02','2026-07-05 17:03:48','2026-07-01 00:30:27','2026-07-05 17:03:48'),(9,NULL,'7/6 800','kks',800000000.00,NULL,NULL,'2026-07-06','2026-07-08 05:53:57','2026-07-01 00:30:52','2026-07-08 05:53:57'),(10,NULL,'7/27 328','kks',328000000.00,NULL,NULL,'2026-07-27',NULL,'2026-07-01 00:31:08','2026-07-05 17:43:08'),(11,NULL,'7/7 15','kks',15000000.00,NULL,NULL,'2026-07-07','2026-07-08 09:02:47','2026-07-01 00:31:27','2026-07-08 09:02:47'),(12,NULL,'7/3 2398','kks',2398000000.00,NULL,NULL,'2026-07-03','2026-07-05 17:04:06','2026-07-01 00:31:49','2026-07-05 17:04:06'),(13,NULL,'7/7 430','kks',430000000.00,NULL,NULL,'2026-07-07','2026-07-08 05:57:00','2026-07-01 00:32:06','2026-07-08 05:57:00'),(14,NULL,'6/28 22','kks',22000000.00,NULL,NULL,'2026-06-22',NULL,'2026-07-01 00:46:25','2026-07-01 00:46:25'),(17,NULL,'7/8 440','kks',440000000.00,NULL,NULL,'2026-07-08','2026-07-09 00:36:07','2026-07-01 16:56:15','2026-07-09 00:36:07'),(18,NULL,'7/8 29','kks',29000000.00,NULL,NULL,'2026-07-08','2026-07-09 00:36:45','2026-07-01 16:57:03','2026-07-09 00:36:45'),(19,NULL,'7/9 55','kks',55000000.00,NULL,NULL,'2026-07-09','2026-07-10 00:54:04','2026-07-02 17:59:58','2026-07-10 00:54:04'),(20,NULL,'7/10 265','kks',265000000.00,NULL,NULL,'2026-07-10','2026-07-09 21:59:04','2026-07-02 21:22:03','2026-07-09 21:59:04'),(21,NULL,'7/14 344','kks',344000000.00,NULL,NULL,'2026-07-14','2026-07-11 23:06:25','2026-07-05 17:28:36','2026-07-11 23:06:25'),(22,NULL,'7/13 598','kks',598000000.00,NULL,NULL,'2026-07-13',NULL,'2026-07-05 18:32:20','2026-07-05 18:32:20'),(23,NULL,'7/13 140 + Swift','kks',140000000.00,NULL,NULL,'2026-07-13','2026-07-13 01:34:39','2026-07-05 23:57:47','2026-07-13 01:34:39'),(24,NULL,'7/14 335','kks',335000000.00,NULL,NULL,'2026-07-14',NULL,'2026-07-06 18:39:57','2026-07-06 18:39:57'),(25,NULL,'1080','kks',1080000000.00,NULL,NULL,'2026-07-08','2026-07-09 00:40:57','2026-07-08 06:01:16','2026-07-09 00:40:57'),(26,NULL,'7/14 220','kks',220000000.00,NULL,NULL,'2026-07-14',NULL,'2026-07-08 06:14:15','2026-07-08 06:14:15'),(27,NULL,'7/16 3800','kks',3800000000.00,NULL,NULL,'2026-07-16',NULL,'2026-07-09 00:38:24','2026-07-09 00:38:24'),(28,NULL,'7/16 130','kks',130000000.00,NULL,NULL,NULL,'2026-07-09 21:20:09','2026-07-09 06:30:37','2026-07-09 21:20:09'),(29,NULL,'7/18 360','kks',360000000.00,NULL,NULL,'2026-07-18',NULL,'2026-07-11 23:08:37','2026-07-11 23:08:37'),(30,NULL,'7/20 129','kks',129000000.00,NULL,NULL,'2026-07-20','2026-07-13 01:40:04','2026-07-11 23:09:13','2026-07-13 01:40:04'),(31,NULL,'7/19 83','kks',83000000.00,NULL,NULL,'2026-07-19','2026-07-12 17:48:30','2026-07-12 06:37:46','2026-07-12 17:48:30');
/*!40000 ALTER TABLE `trades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `transactions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint(20) unsigned NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transactions_category_id_foreign` (`category_id`),
  CONSTRAINT `transactions_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (1,1,'expense',74.00,'Fried Noodles','2026-07-01',NULL,'2026-06-30 21:32:08','2026-07-01 00:01:29'),(2,1,'expense',295.00,'Dunkin Donut','2026-07-01',NULL,'2026-07-01 16:30:48','2026-07-01 16:30:48'),(4,2,'expense',472.00,'Gas Shell','2026-07-02',NULL,'2026-07-02 16:58:51','2026-07-02 16:58:51'),(5,1,'expense',40.00,'Lemon Juice','2026-07-03',NULL,'2026-07-02 16:59:14','2026-07-02 16:59:14'),(6,1,'expense',75.00,'Sarsa - Halo Halo','2026-07-03',NULL,'2026-07-02 21:33:49','2026-07-02 21:33:49'),(7,2,'expense',551.00,NULL,'2026-07-06','Shell','2026-07-05 18:07:21','2026-07-05 18:07:21'),(8,1,'expense',50.00,NULL,'2026-07-04','Mountain Dew','2026-07-05 18:09:23','2026-07-05 18:09:23'),(9,1,'expense',434.00,'Chowking breakfast','2026-07-06',NULL,'2026-07-05 18:17:26','2026-07-05 18:17:26'),(10,1,'expense',790.00,'Dinner and pasalubong','2026-07-05',NULL,'2026-07-05 18:20:01','2026-07-05 18:44:31'),(11,1,'expense',300.00,'Meryenda','2026-07-06',NULL,'2026-07-05 18:20:25','2026-07-05 18:20:25'),(12,7,'expense',150.00,'Deo','2026-07-06',NULL,'2026-07-05 18:21:12','2026-07-05 18:21:12'),(13,1,'expense',346.00,'Foods sa resort','2026-07-06',NULL,'2026-07-05 18:22:49','2026-07-05 18:22:49'),(14,7,'expense',410.00,'Resort','2026-07-06',NULL,'2026-07-05 18:23:35','2026-07-05 18:23:52'),(15,1,'expense',410.00,'Drinks','2026-07-06',NULL,'2026-07-05 18:23:46','2026-07-05 18:23:46'),(16,7,'expense',467.00,'Mich kuromi','2026-07-06',NULL,'2026-07-05 18:24:27','2026-07-05 18:24:27'),(17,1,'expense',300.00,'Groceries for office','2026-07-06',NULL,'2026-07-05 20:55:57','2026-07-05 20:55:57'),(18,1,'expense',199.00,'Chicken Wings','2026-07-06',NULL,'2026-07-05 20:57:51','2026-07-05 20:57:51'),(19,7,'expense',98.00,'Tissue','2026-07-06',NULL,'2026-07-05 20:59:02','2026-07-05 20:59:21'),(20,7,'expense',271.00,'Grace and Glow body wash','2026-07-06',NULL,'2026-07-05 21:01:59','2026-07-05 21:01:59'),(21,7,'expense',279.00,'Dove gold (Shampoo)','2026-07-06',NULL,'2026-07-05 21:05:51','2026-07-05 21:05:51'),(44,7,'expense',75.00,'Toothbrush for office','2026-07-08',NULL,'2026-07-08 05:51:35','2026-07-08 05:51:35'),(45,7,'expense',522.00,'Gambit Hair Creamer','2026-07-08',NULL,'2026-07-08 05:52:10','2026-07-08 05:52:10'),(46,1,'expense',69.00,'Avacado Crema','2026-07-08',NULL,'2026-07-08 05:52:33','2026-07-08 05:52:33'),(47,1,'expense',80.00,'Fishball, Kikiam, kwekwek','2026-07-10',NULL,'2026-07-09 16:58:22','2026-07-09 16:58:22'),(48,1,'expense',12.00,'Melon','2026-07-12',NULL,'2026-07-11 22:13:59','2026-07-11 22:13:59'),(49,1,'expense',736.00,'Shakeys','2026-07-12',NULL,'2026-07-11 22:14:20','2026-07-11 22:14:20'),(50,2,'expense',609.00,'Gas','2026-07-12',NULL,'2026-07-11 22:15:11','2026-07-11 22:15:11'),(51,1,'expense',359.00,'Breakfast','2026-07-12',NULL,'2026-07-11 22:15:30','2026-07-11 22:15:30'),(52,1,'expense',658.00,'Samgyup','2026-07-12',NULL,'2026-07-12 06:33:26','2026-07-12 06:33:26'),(53,1,'expense',240.00,'Breakfast','2026-07-13',NULL,'2026-07-12 18:00:53','2026-07-12 18:00:53'),(54,1,'expense',509.00,'jalibi','2026-07-13',NULL,'2026-07-12 19:51:43','2026-07-12 19:51:43'),(55,7,'expense',1646.00,'Tiktok','2026-07-13',NULL,'2026-07-13 01:57:38','2026-07-13 01:57:38'),(56,2,'expense',511.00,'Gas','2026-07-14',NULL,'2026-07-14 08:45:11','2026-07-14 08:45:11'),(57,1,'expense',150.00,'Coffee','2026-07-14',NULL,'2026-07-14 08:45:34','2026-07-14 08:45:34'),(58,1,'expense',75.00,'Meryenda','2026-07-14',NULL,'2026-07-14 08:48:18','2026-07-14 08:48:18'),(59,8,'income',9750.00,'July 15, 2026 (Salary)','2026-07-14',NULL,'2026-07-14 08:56:01','2026-07-14 08:56:01');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Mikey','mikey@example.com','2026-07-06 19:12:34','$2y$12$cjMM895y.Hn05zUm2vcbFe9veJ4dKDZfzrBQ/bFO0wFs/vDIiujzG','nvKNH9Ts8b','2026-07-06 19:12:34','2026-07-06 19:12:34');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-15  7:42:48
