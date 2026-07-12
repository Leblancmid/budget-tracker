-- phpMyAdmin SQL Dump
-- version 6.0.0-dev+20260705.62fe883628
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 10, 2026 at 09:18 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `budget_tracker`
--

-- --------------------------------------------------------

--
-- Table structure for table `budgets`
--

CREATE TABLE `budgets` (
  `id` bigint UNSIGNED NOT NULL,
  `category_id` bigint UNSIGNED NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `month` tinyint UNSIGNED NOT NULL,
  `year` smallint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `budgets`
--

INSERT INTO `budgets` (`id`, `category_id`, `amount`, `month`, `year`, `created_at`, `updated_at`) VALUES
(1, 2, 2500.00, 7, 2026, '2026-06-30 22:22:35', '2026-07-05 18:49:56'),
(2, 1, 5000.00, 7, 2026, '2026-07-01 18:42:37', '2026-07-02 01:33:56'),
(3, 6, 1000.00, 7, 2026, '2026-07-02 01:33:37', '2026-07-02 01:33:37'),
(4, 7, 2500.00, 7, 2026, '2026-07-02 01:33:45', '2026-07-05 18:49:22');

-- --------------------------------------------------------

--
-- Table structure for table `business_budgets`
--

CREATE TABLE `business_budgets` (
  `id` bigint UNSIGNED NOT NULL,
  `category_id` bigint UNSIGNED NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `month` tinyint UNSIGNED NOT NULL,
  `year` smallint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `business_categories`
--

CREATE TABLE `business_categories` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('account','gold','expense') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#6366f1',
  `icon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tag',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `business_categories`
--

INSERT INTO `business_categories` (`id`, `name`, `type`, `color`, `icon`, `created_at`, `updated_at`) VALUES
(1, 'Gold', 'account', '#eab308', 'briefcase', '2026-07-01 21:27:40', '2026-07-01 21:34:46'),
(3, 'Gold', 'expense', '#ef4444', 'briefcase', '2026-07-01 21:34:03', '2026-07-01 21:34:37'),
(4, 'Account', 'account', '#eab308', 'briefcase', '2026-07-01 21:34:12', '2026-07-01 21:34:12'),
(5, 'Account', 'expense', '#ef4444', 'briefcase', '2026-07-01 21:34:21', '2026-07-01 21:34:21');

-- --------------------------------------------------------

--
-- Table structure for table `business_transactions`
--

CREATE TABLE `business_transactions` (
  `id` bigint UNSIGNED NOT NULL,
  `account_id` bigint UNSIGNED DEFAULT NULL,
  `type` enum('account','gold','expense') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` enum('buy','sell') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_rate` decimal(10,6) DEFAULT NULL,
  `cost_rate` decimal(10,6) DEFAULT NULL,
  `php_rate` decimal(10,4) DEFAULT NULL,
  `price_php` decimal(15,2) DEFAULT NULL,
  `cost_php` decimal(15,2) DEFAULT NULL,
  `profit_php` decimal(15,2) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `archived_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `business_transactions`
--

INSERT INTO `business_transactions` (`id`, `account_id`, `type`, `action`, `price_rate`, `cost_rate`, `php_rate`, `price_php`, `cost_php`, `profit_php`, `amount`, `description`, `date`, `notes`, `archived_at`, `created_at`, `updated_at`) VALUES
(18, 8, 'account', NULL, 0.220000, 0.170000, 61.4100, 14861.22, 7829.78, 7031.44, 7031.44, 'Leblanc 600 Melee', '2026-07-03', NULL, NULL, '2026-07-03 01:07:42', '2026-07-09 06:26:50'),
(19, 7, 'account', NULL, 0.220000, 0.170000, 61.4100, 32424.48, 19835.43, 12589.05, 12589.05, 'Leblanc 624 Melee', '2026-07-03', NULL, NULL, '2026-07-03 01:09:20', '2026-07-09 05:13:53'),
(20, 6, 'account', NULL, 0.239000, 0.216800, 61.5000, 22047.75, 19999.80, 2047.95, 2047.95, 'Leblanc 618 Dist', '2026-07-03', NULL, '2026-07-09 17:08:42', '2026-07-03 01:09:45', '2026-07-09 17:08:42'),
(21, 4, 'account', NULL, 0.220000, 0.170000, 61.4100, 35126.52, 19835.43, 15291.09, 15291.09, 'Leblanc 632 Dist', '2026-07-03', NULL, NULL, '2026-07-03 01:10:04', '2026-07-09 17:53:04'),
(22, 3, 'account', NULL, 0.220000, 0.170000, 61.4100, 45934.68, 25055.28, 20879.40, 20879.40, 'Leblanc 648 Dist', '2026-07-03', NULL, NULL, '2026-07-03 01:11:34', '2026-07-06 00:54:13'),
(23, 2, 'account', NULL, 0.220000, 0.180000, 61.4100, 81061.20, 55269.00, 25792.20, 25792.20, 'Leblanc 702 Melee', '2026-07-03', NULL, NULL, '2026-07-03 01:12:04', '2026-07-06 18:43:38'),
(25, 9, 'account', NULL, 0.220000, 0.160000, 61.5000, 23001.00, 16728.00, 6273.00, 6273.00, '1.5kkk (.16$ rate)', '2026-07-08', NULL, NULL, '2026-07-08 06:00:19', '2026-07-09 00:53:36'),
(26, 10, 'account', NULL, 0.220000, 0.170000, 61.5000, 8118.00, 0.00, 8118.00, 8118.00, 'Leblanc 560 Mage', '2026-07-10', NULL, NULL, '2026-07-09 18:11:33', '2026-07-09 18:11:33');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('income','expense') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#6366f1',
  `icon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tag',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `type`, `color`, `icon`, `created_at`, `updated_at`) VALUES
(1, 'Foods', 'expense', '#06b6d4', 'tag', '2026-06-30 00:42:16', '2026-07-01 18:45:23'),
(2, 'Transportations', 'expense', '#f97316', 'tag', '2026-06-30 00:43:32', '2026-07-01 18:45:25'),
(5, 'Savings', 'income', '#ef4444', 'tag', '2026-06-30 21:50:55', '2026-07-02 17:56:20'),
(6, 'Bills', 'expense', '#22c55e', 'tag', '2026-07-01 18:43:23', '2026-07-01 18:45:20'),
(7, 'Others', 'expense', '#ec4899', 'tag', '2026-07-02 01:29:04', '2026-07-02 21:44:11'),
(8, 'Salary', 'income', '#4f46e5', 'Briefcase', '2026-07-06 19:12:34', '2026-07-06 19:12:34');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `golds`
--

CREATE TABLE `golds` (
  `id` bigint UNSIGNED NOT NULL,
  `amount` decimal(20,2) NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `golds`
--

INSERT INTO `golds` (`id`, `amount`, `description`, `created_at`, `updated_at`) VALUES
(5, 0.00, 'Current Gold', '2026-07-01 01:36:02', '2026-07-02 21:02:28'),
(6, 0.00, 'Sveet', '2026-07-01 01:42:58', '2026-07-02 21:02:28'),
(7, 0.00, 'Wheres my 25kk toad', '2026-07-01 01:47:28', '2026-07-02 21:02:28'),
(8, 0.00, '2 MM Fee', '2026-07-01 17:19:44', '2026-07-02 21:02:28'),
(9, 0.00, 'MM Fee', '2026-07-02 18:03:48', '2026-07-02 21:02:28'),
(10, 0.00, NULL, '2026-07-02 21:02:59', '2026-07-02 21:05:40'),
(11, 0.00, NULL, '2026-07-02 21:05:40', '2026-07-02 21:15:18'),
(12, 0.00, NULL, '2026-07-02 21:07:09', '2026-07-02 21:15:18'),
(13, 0.00, NULL, '2026-07-02 21:08:02', '2026-07-02 21:15:18'),
(14, 0.00, NULL, '2026-07-02 21:15:18', '2026-07-02 21:16:08'),
(15, -1229114189.00, NULL, '2026-07-02 21:16:08', '2026-07-02 21:16:08'),
(16, 749380000.00, 'Leblanc 593 Melee (Sold)', '2026-07-02 21:25:28', '2026-07-06 19:59:48'),
(17, 200000000.00, 'Buy gold for law (2k gcash)', '2026-07-05 17:35:48', '2026-07-05 17:35:48'),
(18, 14000000.00, 'MM Fee', '2026-07-05 18:06:09', '2026-07-05 18:06:09'),
(19, 2000000.00, 'MM fee 7/13 598', '2026-07-05 18:31:55', '2026-07-05 18:31:55'),
(20, 2000000.00, 'MM Fee 7/13 140 + Swift', '2026-07-05 23:58:23', '2026-07-05 23:58:23'),
(21, 2000000.00, '7/14 335 (MM Fee)', '2026-07-06 18:40:24', '2026-07-06 18:40:24'),
(22, 620000.00, 'Current gold stash', '2026-07-06 19:12:34', '2026-07-06 19:12:34'),
(23, 850000000.00, 'Bought gold for 240$ (.16$ rate)', '2026-07-08 05:59:25', '2026-07-09 03:39:44'),
(24, 9000000.00, 'MM Fee', '2026-07-08 06:14:45', '2026-07-08 06:14:45'),
(25, 3000000.00, '7/16 3800 (MM Fee)', '2026-07-09 00:37:56', '2026-07-09 00:37:56'),
(27, 0.00, 'Sold: uzeroa6@gmail.com', '2026-07-09 05:16:41', '2026-07-09 05:19:01'),
(31, 1396500001.00, 'Gold Adjustment', '2026-07-09 05:58:15', '2026-07-09 21:19:11'),
(34, 2000000.00, '7/16 130 (MM Fee)', '2026-07-09 06:31:10', '2026-07-09 06:31:10'),
(35, 750000000.00, 'Sold: Leblanc 618 Dist', '2026-07-09 17:08:42', '2026-07-09 17:25:01'),
(36, 2000000.00, 'MM Fee', '2026-07-09 17:12:46', '2026-07-09 17:12:46');

-- --------------------------------------------------------

--
-- Table structure for table `gold_logs`
--

CREATE TABLE `gold_logs` (
  `id` bigint UNSIGNED NOT NULL,
  `type` enum('add','sell') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gold_logs`
--

INSERT INTO `gold_logs` (`id`, `type`, `amount`, `description`, `created_at`, `updated_at`) VALUES
(5, 'add', 3000000.00, '2 MM Fee', '2026-07-01 17:19:44', '2026-07-01 17:19:44'),
(6, 'sell', 1250000000.00, 'Payment for nolife sil (650kk left)', '2026-07-02 18:02:53', '2026-07-02 18:02:53'),
(7, 'add', 1000000.00, 'MM Fee', '2026-07-02 18:03:48', '2026-07-02 18:03:48'),
(8, 'sell', 600000000.00, 'Buying Leblanc 618 Dist', '2026-07-02 18:31:02', '2026-07-02 18:31:02'),
(9, 'sell', 650000000.00, 'Buying Leblanc 624 Melee', '2026-07-02 21:02:28', '2026-07-02 21:02:28'),
(10, 'add', 650000000.00, NULL, '2026-07-02 21:02:59', '2026-07-02 21:02:59'),
(11, 'sell', 700000000.00, NULL, '2026-07-02 21:05:40', '2026-07-02 21:05:40'),
(12, 'add', 50000000.00, NULL, '2026-07-02 21:07:09', '2026-07-02 21:07:09'),
(13, 'add', 770885811.00, NULL, '2026-07-02 21:08:02', '2026-07-02 21:08:02'),
(14, 'sell', 650000000.00, 'Buying Leblanc 624 Melee (Not yet paid ig)', '2026-07-02 21:10:17', '2026-07-02 21:10:17'),
(15, 'sell', 600000000.00, 'Buying Leblanc 618 Dist (Not yet paid ig)', '2026-07-02 21:15:18', '2026-07-02 21:15:18'),
(16, 'sell', 750000000.00, 'Buying Leblanc 600 Melee (not yet paid ig)', '2026-07-02 21:16:08', '2026-07-02 21:16:08'),
(17, 'add', 750000000.00, 'Leblanc 593 Melee (Sold)', '2026-07-02 21:25:28', '2026-07-02 21:25:28'),
(18, 'add', 200000000.00, 'Buy gold for law (2k gcash)', '2026-07-05 17:35:48', '2026-07-05 17:35:48'),
(19, 'add', 14000000.00, 'MM Fee', '2026-07-05 18:06:09', '2026-07-05 18:06:09'),
(20, 'add', 2000000.00, 'MM fee 7/13 598', '2026-07-05 18:31:55', '2026-07-05 18:31:55'),
(21, 'add', 2000000.00, 'MM Fee 7/13 140 + Swift', '2026-07-05 23:58:23', '2026-07-05 23:58:23'),
(22, 'add', 2000000.00, '7/14 335 (MM Fee)', '2026-07-06 18:40:24', '2026-07-06 18:40:24'),
(25, 'sell', 50000.00, 'Sold to player A (KKS)', '2026-07-06 19:12:34', '2026-07-06 19:12:34'),
(26, 'add', 180000.00, 'Gold farming — week 3', '2026-07-06 19:12:34', '2026-07-06 19:12:34'),
(27, 'sell', 80000.00, 'Sold to player B (CASH)', '2026-07-06 19:12:34', '2026-07-06 19:12:34'),
(28, 'add', 220000.00, 'Gold farming — week 4', '2026-07-06 19:12:34', '2026-07-06 19:12:34'),
(29, 'sell', 620000.00, NULL, '2026-07-06 19:59:48', '2026-07-06 19:59:48'),
(30, 'add', 1500000000.00, 'Bought gold for 240$ (.16$ rate)', '2026-07-08 05:59:25', '2026-07-08 05:59:25'),
(31, 'add', 9000000.00, 'MM Fee', '2026-07-08 06:14:45', '2026-07-08 06:14:45'),
(32, 'add', 3000000.00, '7/16 3800 (MM Fee)', '2026-07-09 00:37:56', '2026-07-09 00:37:56'),
(33, 'sell', 650000000.00, 'Bought Leblanc 624 Melee (Fully Paid)', '2026-07-09 03:39:44', '2026-07-09 03:39:44'),
(34, 'add', 1100000000.00, 'Sold: uzeroa6@gmail.com', '2026-07-09 05:16:41', '2026-07-09 05:16:41'),
(36, 'sell', 1100000000.00, 'Bug', '2026-07-09 05:19:01', '2026-07-09 05:19:01'),
(39, 'add', 1397500001.00, 'Gold Adjustment', '2026-07-09 05:58:15', '2026-07-09 05:58:15'),
(42, 'add', 2000000.00, '7/16 130 (MM Fee)', '2026-07-09 06:31:10', '2026-07-09 06:31:10'),
(43, 'add', 1500000000.00, 'Sold: Leblanc 618 Dist', '2026-07-09 17:08:42', '2026-07-09 17:08:42'),
(44, 'add', 2000000.00, 'MM Fee', '2026-07-09 17:12:46', '2026-07-09 17:12:46'),
(45, 'sell', 750000000.00, 'Buying Leblanc 600 Melee', '2026-07-09 17:25:01', '2026-07-09 17:25:01'),
(46, 'sell', 1000000.00, 'Cancellation', '2026-07-09 21:19:11', '2026-07-09 21:19:11');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `queue` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint UNSIGNED NOT NULL,
  `reserved_at` int UNSIGNED DEFAULT NULL,
  `available_at` int UNSIGNED NOT NULL,
  `created_at` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2024_01_01_000001_create_categories_table', 1),
(5, '2024_01_01_000002_create_transactions_table', 1),
(6, '2024_01_01_000003_create_budgets_table', 1),
(7, '2024_01_02_000001_create_golds_table', 1),
(8, '2024_01_02_000002_create_rucoy_accounts_table', 1),
(9, '2024_01_02_000003_create_trades_table', 1),
(10, '2026_07_01_093739_create_gold_logs_table', 1),
(11, '2026_07_02_051125_create_business_transactions_table', 1),
(12, '2026_07_02_120000_create_savings_table', 1),
(13, '2026_07_06_100000_add_php_values_to_business_transactions_table', 1),
(14, '2026_07_07_035531_create_personal_access_tokens_table', 1),
(28, '2026_07_09_054146_add_payment_date_to_rucoy_accounts_table', 2);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint UNSIGNED NOT NULL,
  `name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(2, 'App\\Models\\User', 1, 'api-token', '720ba48807640427077e785fa3200d78237bfac4b11c2b086271aa8000120b4e', '[\"*\"]', NULL, NULL, '2026-07-06 20:00:40', '2026-07-06 20:00:40'),
(4, 'App\\Models\\User', 1, 'api-token', 'e572152c7c5765043f636ba29749d1878915f78311c679cd32ec3f917e8914e2', '[\"*\"]', NULL, NULL, '2026-07-07 01:58:22', '2026-07-07 01:58:22'),
(6, 'App\\Models\\User', 1, 'api-token', '4d2ac54090708eb17d187d4c2b5a7be4066e11cf18137d23b90ecd2ecd5bc66f', '[\"*\"]', NULL, NULL, '2026-07-07 02:03:56', '2026-07-07 02:03:56');

-- --------------------------------------------------------

--
-- Table structure for table `rucoy_accounts`
--

CREATE TABLE `rucoy_accounts` (
  `id` bigint UNSIGNED NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  `cost` decimal(12,2) DEFAULT NULL,
  `payment_status` enum('not_paid','partially_paid','fully_paid') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_paid',
  `payment_date` date DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rucoy_accounts`
--

INSERT INTO `rucoy_accounts` (`id`, `description`, `email`, `avatar`, `price`, `cost`, `payment_status`, `payment_date`, `archived_at`, `created_at`, `updated_at`) VALUES
(1, 'Leblanc 593 Melee', 'markjhonedralin@gmail.com', NULL, 750000000.00, 700000000.00, 'fully_paid', NULL, '2026-07-02 21:24:55', '2026-06-30 22:55:53', '2026-07-02 21:24:55'),
(2, 'Leblanc 702 Melee', 'chrystianrodrigues445@gmail.com', NULL, 6000000000.00, 5000000000.00, 'fully_paid', NULL, NULL, '2026-06-30 22:57:26', '2026-07-06 18:43:38'),
(3, 'Leblanc 648 Dist', 'johncurlyofficial@gmail.com', NULL, 3400000000.00, 2400000000.00, 'fully_paid', NULL, NULL, '2026-06-30 22:58:28', '2026-07-06 00:54:13'),
(4, 'Leblanc 632 Dist', 'mauricio.nto@gmail.com', NULL, 2600000000.00, 1900000000.00, 'fully_paid', NULL, NULL, '2026-06-30 22:59:04', '2026-07-09 17:52:47'),
(6, 'Leblanc 618 Dist', 'michaelbernal547@gmail.com', NULL, 1500000000.00, 1500000000.00, 'fully_paid', NULL, '2026-07-09 17:08:42', '2026-07-01 18:09:11', '2026-07-09 17:08:42'),
(7, 'Leblanc 624 Melee', 'msgamer273@gmail.com', NULL, 2400000000.00, 1900000000.00, 'fully_paid', NULL, NULL, '2026-07-02 17:29:37', '2026-07-09 05:13:53'),
(8, 'Leblanc 600 Melee', 'uzeroa6@gmail.com', NULL, 1100000000.00, 750000000.00, 'fully_paid', NULL, NULL, '2026-07-02 17:31:23', '2026-07-09 17:22:44'),
(9, '1.5kkk (.16$ rate)', 'leblancrucoys@gmail.com', NULL, 1700000000.00, 1700000000.00, 'fully_paid', NULL, NULL, '2026-07-08 05:59:59', '2026-07-09 00:53:36'),
(10, 'Leblanc 560 Mage', 'muhammadse53@gmail.com', NULL, 600000000.00, 0.00, 'not_paid', NULL, NULL, '2026-07-09 18:10:49', '2026-07-09 18:10:49');

-- --------------------------------------------------------

--
-- Table structure for table `savings`
--

CREATE TABLE `savings` (
  `id` bigint UNSIGNED NOT NULL,
  `mode_of_payment` enum('CIMB','MARIBANK','GCASH') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('deposit','withdraw') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `transfer` enum('daily_expenses','business') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `savings`
--

INSERT INTO `savings` (`id`, `mode_of_payment`, `type`, `transfer`, `description`, `amount`, `date`, `created_at`, `updated_at`) VALUES
(9, 'CIMB', 'deposit', NULL, 'Overall', 163605.00, '2026-07-10', '2026-07-09 17:44:15', '2026-07-09 17:44:25');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trades`
--

CREATE TABLE `trades` (
  `id` bigint UNSIGNED NOT NULL,
  `gold_id` bigint UNSIGNED DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('kks','cash') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `currency` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `completion_date` date DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `trades`
--

INSERT INTO `trades` (`id`, `gold_id`, `description`, `status`, `amount`, `currency`, `payment_method`, `completion_date`, `archived_at`, `created_at`, `updated_at`) VALUES
(1, 1, '7/6 330', 'kks', 330000000.00, NULL, NULL, '2026-07-06', '2026-07-06 20:01:36', '2026-06-30 23:20:25', '2026-07-06 20:01:36'),
(2, NULL, '7/10 €1718', 'cash', 1718.00, 'EUR', 'paypal', '2026-07-10', NULL, '2026-07-01 00:22:27', '2026-07-09 09:23:34'),
(3, NULL, '7/4 69', 'kks', 69000000.00, NULL, NULL, '2026-07-04', '2026-07-05 17:00:11', '2026-07-01 00:23:34', '2026-07-05 17:00:11'),
(4, NULL, '7/1 600', 'kks', 600000000.00, NULL, NULL, '2026-07-01', '2026-07-01 17:43:14', '2026-07-01 00:27:15', '2026-07-01 17:43:14'),
(5, NULL, '7/7 120', 'kks', 120000000.00, NULL, NULL, '2026-07-07', '2026-07-08 06:08:23', '2026-07-01 00:28:48', '2026-07-08 06:08:23'),
(6, NULL, '7/3 188', 'kks', 188000000.00, NULL, NULL, '2026-07-03', '2026-07-02 21:19:41', '2026-07-01 00:29:17', '2026-07-02 21:19:41'),
(7, NULL, '7/5 1080', 'kks', 1080000000.00, NULL, NULL, '2026-07-05', '2026-07-05 17:33:38', '2026-07-01 00:29:53', '2026-07-05 17:33:38'),
(8, NULL, '7/2 300', 'kks', 300000000.00, NULL, NULL, '2026-07-02', '2026-07-05 17:03:48', '2026-07-01 00:30:27', '2026-07-05 17:03:48'),
(9, NULL, '7/6 800', 'kks', 800000000.00, NULL, NULL, '2026-07-06', '2026-07-08 05:53:57', '2026-07-01 00:30:52', '2026-07-08 05:53:57'),
(10, NULL, '7/27 328', 'kks', 328000000.00, NULL, NULL, '2026-07-27', NULL, '2026-07-01 00:31:08', '2026-07-05 17:43:08'),
(11, NULL, '7/7 15', 'kks', 15000000.00, NULL, NULL, '2026-07-07', '2026-07-08 09:02:47', '2026-07-01 00:31:27', '2026-07-08 09:02:47'),
(12, NULL, '7/3 2398', 'kks', 2398000000.00, NULL, NULL, '2026-07-03', '2026-07-05 17:04:06', '2026-07-01 00:31:49', '2026-07-05 17:04:06'),
(13, NULL, '7/7 430', 'kks', 430000000.00, NULL, NULL, '2026-07-07', '2026-07-08 05:57:00', '2026-07-01 00:32:06', '2026-07-08 05:57:00'),
(14, NULL, '6/28 22', 'kks', 22000000.00, NULL, NULL, '2026-06-22', NULL, '2026-07-01 00:46:25', '2026-07-01 00:46:25'),
(17, NULL, '7/8 440', 'kks', 440000000.00, NULL, NULL, '2026-07-08', '2026-07-09 00:36:07', '2026-07-01 16:56:15', '2026-07-09 00:36:07'),
(18, NULL, '7/8 29', 'kks', 29000000.00, NULL, NULL, '2026-07-08', '2026-07-09 00:36:45', '2026-07-01 16:57:03', '2026-07-09 00:36:45'),
(19, NULL, '7/9 55', 'kks', 55000000.00, NULL, NULL, '2026-07-09', '2026-07-10 00:54:04', '2026-07-02 17:59:58', '2026-07-10 00:54:04'),
(20, NULL, '7/10 265', 'kks', 265000000.00, NULL, NULL, '2026-07-10', '2026-07-09 21:59:04', '2026-07-02 21:22:03', '2026-07-09 21:59:04'),
(21, NULL, '7/14 344', 'kks', 344000000.00, NULL, NULL, '2026-07-14', NULL, '2026-07-05 17:28:36', '2026-07-05 17:28:36'),
(22, NULL, '7/13 598', 'kks', 598000000.00, NULL, NULL, '2026-07-13', NULL, '2026-07-05 18:32:20', '2026-07-05 18:32:20'),
(23, NULL, '7/13 140 + Swift', 'kks', 140000000.00, NULL, NULL, '2026-07-13', NULL, '2026-07-05 23:57:47', '2026-07-05 23:57:47'),
(24, NULL, '7/14 335', 'kks', 335000000.00, NULL, NULL, '2026-07-14', NULL, '2026-07-06 18:39:57', '2026-07-06 18:39:57'),
(25, NULL, '1080', 'kks', 1080000000.00, NULL, NULL, '2026-07-08', '2026-07-09 00:40:57', '2026-07-08 06:01:16', '2026-07-09 00:40:57'),
(26, NULL, '7/14 220', 'kks', 220000000.00, NULL, NULL, '2026-07-14', NULL, '2026-07-08 06:14:15', '2026-07-08 06:14:15'),
(27, NULL, '7/16 3800', 'kks', 3800000000.00, NULL, NULL, '2026-07-16', NULL, '2026-07-09 00:38:24', '2026-07-09 00:38:24'),
(28, NULL, '7/16 130', 'kks', 130000000.00, NULL, NULL, NULL, '2026-07-09 21:20:09', '2026-07-09 06:30:37', '2026-07-09 21:20:09');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` bigint UNSIGNED NOT NULL,
  `category_id` bigint UNSIGNED NOT NULL,
  `type` enum('income','expense') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `category_id`, `type`, `amount`, `description`, `date`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 'expense', 74.00, 'Fried Noodles', '2026-07-01', NULL, '2026-06-30 21:32:08', '2026-07-01 00:01:29'),
(2, 1, 'expense', 295.00, 'Dunkin Donut', '2026-07-01', NULL, '2026-07-01 16:30:48', '2026-07-01 16:30:48'),
(4, 2, 'expense', 472.00, 'Gas Shell', '2026-07-02', NULL, '2026-07-02 16:58:51', '2026-07-02 16:58:51'),
(5, 1, 'expense', 40.00, 'Lemon Juice', '2026-07-03', NULL, '2026-07-02 16:59:14', '2026-07-02 16:59:14'),
(6, 1, 'expense', 75.00, 'Sarsa - Halo Halo', '2026-07-03', NULL, '2026-07-02 21:33:49', '2026-07-02 21:33:49'),
(7, 2, 'expense', 551.00, NULL, '2026-07-06', 'Shell', '2026-07-05 18:07:21', '2026-07-05 18:07:21'),
(8, 1, 'expense', 50.00, NULL, '2026-07-04', 'Mountain Dew', '2026-07-05 18:09:23', '2026-07-05 18:09:23'),
(9, 1, 'expense', 434.00, 'Chowking breakfast', '2026-07-06', NULL, '2026-07-05 18:17:26', '2026-07-05 18:17:26'),
(10, 1, 'expense', 790.00, 'Dinner and pasalubong', '2026-07-05', NULL, '2026-07-05 18:20:01', '2026-07-05 18:44:31'),
(11, 1, 'expense', 300.00, 'Meryenda', '2026-07-06', NULL, '2026-07-05 18:20:25', '2026-07-05 18:20:25'),
(12, 7, 'expense', 150.00, 'Deo', '2026-07-06', NULL, '2026-07-05 18:21:12', '2026-07-05 18:21:12'),
(13, 1, 'expense', 346.00, 'Foods sa resort', '2026-07-06', NULL, '2026-07-05 18:22:49', '2026-07-05 18:22:49'),
(14, 7, 'expense', 410.00, 'Resort', '2026-07-06', NULL, '2026-07-05 18:23:35', '2026-07-05 18:23:52'),
(15, 1, 'expense', 410.00, 'Drinks', '2026-07-06', NULL, '2026-07-05 18:23:46', '2026-07-05 18:23:46'),
(16, 7, 'expense', 467.00, 'Mich kuromi', '2026-07-06', NULL, '2026-07-05 18:24:27', '2026-07-05 18:24:27'),
(17, 1, 'expense', 300.00, 'Groceries for office', '2026-07-06', NULL, '2026-07-05 20:55:57', '2026-07-05 20:55:57'),
(18, 1, 'expense', 199.00, 'Chicken Wings', '2026-07-06', NULL, '2026-07-05 20:57:51', '2026-07-05 20:57:51'),
(19, 7, 'expense', 98.00, 'Tissue', '2026-07-06', NULL, '2026-07-05 20:59:02', '2026-07-05 20:59:21'),
(20, 7, 'expense', 271.00, 'Grace and Glow body wash', '2026-07-06', NULL, '2026-07-05 21:01:59', '2026-07-05 21:01:59'),
(21, 7, 'expense', 279.00, 'Dove gold (Shampoo)', '2026-07-06', NULL, '2026-07-05 21:05:51', '2026-07-05 21:05:51'),
(44, 7, 'expense', 75.00, 'Toothbrush for office', '2026-07-08', NULL, '2026-07-08 05:51:35', '2026-07-08 05:51:35'),
(45, 7, 'expense', 522.00, 'Gambit Hair Creamer', '2026-07-08', NULL, '2026-07-08 05:52:10', '2026-07-08 05:52:10'),
(46, 1, 'expense', 69.00, 'Avacado Crema', '2026-07-08', NULL, '2026-07-08 05:52:33', '2026-07-08 05:52:33'),
(47, 1, 'expense', 80.00, 'Fishball, Kikiam, kwekwek', '2026-07-10', NULL, '2026-07-09 16:58:22', '2026-07-09 16:58:22');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Mikey', 'mikey@example.com', '2026-07-06 19:12:34', '$2y$12$cjMM895y.Hn05zUm2vcbFe9veJ4dKDZfzrBQ/bFO0wFs/vDIiujzG', 'nvKNH9Ts8b', '2026-07-06 19:12:34', '2026-07-06 19:12:34');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `budgets`
--
ALTER TABLE `budgets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `budgets_category_id_month_year_unique` (`category_id`,`month`,`year`);

--
-- Indexes for table `business_budgets`
--
ALTER TABLE `business_budgets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `business_budgets_category_id_month_year_unique` (`category_id`,`month`,`year`);

--
-- Indexes for table `business_categories`
--
ALTER TABLE `business_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `business_transactions`
--
ALTER TABLE `business_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `business_transactions_account_id_foreign` (`account_id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `golds`
--
ALTER TABLE `golds`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gold_logs`
--
ALTER TABLE `gold_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `rucoy_accounts`
--
ALTER TABLE `rucoy_accounts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `savings`
--
ALTER TABLE `savings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `trades`
--
ALTER TABLE `trades`
  ADD PRIMARY KEY (`id`),
  ADD KEY `trades_gold_id_foreign` (`gold_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transactions_category_id_foreign` (`category_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `budgets`
--
ALTER TABLE `budgets`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `business_budgets`
--
ALTER TABLE `business_budgets`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `business_categories`
--
ALTER TABLE `business_categories`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `business_transactions`
--
ALTER TABLE `business_transactions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `golds`
--
ALTER TABLE `golds`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `gold_logs`
--
ALTER TABLE `gold_logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `rucoy_accounts`
--
ALTER TABLE `rucoy_accounts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `savings`
--
ALTER TABLE `savings`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `trades`
--
ALTER TABLE `trades`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `budgets`
--
ALTER TABLE `budgets`
  ADD CONSTRAINT `budgets_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `business_budgets`
--
ALTER TABLE `business_budgets`
  ADD CONSTRAINT `business_budgets_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `business_categories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `business_transactions`
--
ALTER TABLE `business_transactions`
  ADD CONSTRAINT `business_transactions_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `rucoy_accounts` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `trades`
--
ALTER TABLE `trades`
  ADD CONSTRAINT `trades_gold_id_foreign` FOREIGN KEY (`gold_id`) REFERENCES `golds` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
