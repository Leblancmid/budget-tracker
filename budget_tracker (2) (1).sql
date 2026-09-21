-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 20, 2026 at 06:01 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

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
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `loggable_type` varchar(255) NOT NULL,
  `loggable_id` bigint(20) UNSIGNED NOT NULL,
  `module` varchar(30) NOT NULL,
  `type` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `amount` varchar(50) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `loggable_type`, `loggable_id`, `module`, `type`, `description`, `amount`, `ip_address`, `user_agent`, `created_at`, `updated_at`) VALUES
(1, NULL, 'App\\Models\\Transaction', 107, 'daily', 'expense', 'test', '1.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-06 18:01:50', '2026-08-06 18:01:50'),
(2, NULL, 'App\\Models\\Transaction', 108, 'daily', 'income', 'test', '1.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.57 Mobile/15E148 Safari/604.1', '2026-08-06 18:02:23', '2026-08-06 18:02:23'),
(3, NULL, 'App\\Models\\Transaction', 109, 'daily', 'expense', 'Tshirt tiktok', '519.37', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-06 18:15:29', '2026-08-06 18:15:29'),
(4, NULL, 'App\\Models\\Trade', 53, 'trade', 'archived', '8/8', '0.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-06 18:22:07', '2026-08-06 18:22:07'),
(5, NULL, 'App\\Models\\Transaction', 110, 'daily', 'expense', 'Dinner', '238.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:06:56', '2026-08-11 17:06:56'),
(6, NULL, 'App\\Models\\Transaction', 111, 'daily', 'expense', 'Bag', '166.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:07:10', '2026-08-11 17:07:10'),
(7, NULL, 'App\\Models\\Transaction', 112, 'daily', 'expense', 'Lunch', '1043.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:07:47', '2026-08-11 17:07:47'),
(8, NULL, 'App\\Models\\Transaction', 113, 'daily', 'expense', 'Pants', '559.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:08:00', '2026-08-11 17:08:00'),
(9, NULL, 'App\\Models\\Transaction', 114, 'daily', 'expense', 'Dinner', '440.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:08:22', '2026-08-11 17:08:22'),
(10, NULL, 'App\\Models\\Transaction', 115, 'daily', 'expense', 'Utang kay mama', '1500.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:08:35', '2026-08-11 17:08:35'),
(11, NULL, 'App\\Models\\Transaction', 116, 'daily', 'expense', 'Bfast', '320.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:08:56', '2026-08-11 17:08:56'),
(12, NULL, 'App\\Models\\Transaction', 117, 'daily', 'expense', 'Pizza', '1150.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:09:05', '2026-08-11 17:09:05'),
(13, NULL, 'App\\Models\\Transaction', 118, 'daily', 'expense', 'Gin', '220.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:09:27', '2026-08-11 17:09:27'),
(14, NULL, 'App\\Models\\Transaction', 119, 'daily', 'expense', 'MD', '25.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:09:39', '2026-08-11 17:09:39'),
(15, NULL, 'App\\Models\\Transaction', 120, 'daily', 'expense', 'Mcdo', '477.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:10:11', '2026-08-11 17:10:11'),
(16, NULL, 'App\\Models\\Transaction', 121, 'daily', 'expense', 'Pills', '740.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:10:26', '2026-08-11 17:10:26'),
(17, NULL, 'App\\Models\\Transaction', 122, 'daily', 'expense', 'Pares', '295.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:10:35', '2026-08-11 17:10:35'),
(18, NULL, 'App\\Models\\Transaction', 123, 'daily', 'expense', 'Brian', '500.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:10:48', '2026-08-11 17:10:48'),
(19, NULL, 'App\\Models\\Trade', 2, 'trade', 'archived', '7/25 €2351 + 781 Melee x TOP 3 Melee · EUR', '2351.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:26:46', '2026-08-11 17:26:46'),
(20, NULL, 'App\\Models\\Trade', 54, 'trade', 'archived', '8/11 360', '360000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:27:03', '2026-08-11 17:27:03'),
(21, NULL, 'App\\Models\\Trade', 51, 'trade', 'archived', '8/9 160', '160000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:27:19', '2026-08-11 17:27:19'),
(22, NULL, 'App\\Models\\Trade', 50, 'trade', 'archived', '8/9 397', '397000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:28:10', '2026-08-11 17:28:10'),
(23, NULL, 'App\\Models\\Trade', 57, 'trade', 'kks', '8/14 168', '168000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:30:24', '2026-08-11 17:30:24'),
(24, NULL, 'App\\Models\\Trade', 58, 'trade', 'kks', '8/16 8', '8000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:31:29', '2026-08-11 17:31:29'),
(25, NULL, 'App\\Models\\Trade', 59, 'trade', 'kks', '8/18 180', '180000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:32:30', '2026-08-11 17:32:30'),
(26, NULL, 'App\\Models\\Trade', 60, 'trade', 'kks', '8/18 220', '220000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:32:56', '2026-08-11 17:32:56'),
(27, NULL, 'App\\Models\\Trade', 61, 'trade', 'kks', '8/18 128', '128000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:33:56', '2026-08-11 17:33:56'),
(28, NULL, 'App\\Models\\Trade', 62, 'trade', 'kks', '8/18 2000', '2000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 17:35:40', '2026-08-11 17:35:40'),
(29, NULL, 'App\\Models\\GoldLog', 126, 'gold', 'add', 'Sold: Leblanc 614 Melee', '1150000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 18:09:26', '2026-08-11 18:09:26'),
(30, NULL, 'App\\Models\\GoldLog', 127, 'gold', 'sell', '.2$ binance', '395000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 18:16:17', '2026-08-11 18:16:17'),
(31, NULL, 'App\\Models\\GoldLog', 128, 'gold', 'add', '.17$ binance', '280000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 18:16:39', '2026-08-11 18:16:39'),
(32, NULL, 'App\\Models\\GoldLog', 129, 'gold', 'sell', '.17 euro paypal', '2000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 18:16:51', '2026-08-11 18:16:51'),
(33, NULL, 'App\\Models\\Trade', 63, 'trade', 'kks', '8/19 85', '85000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 18:18:07', '2026-08-11 18:18:07'),
(34, NULL, 'App\\Models\\BusinessTransaction', 40, 'business', 'account', '2kkk gold .185 euro', '4728.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 18:19:51', '2026-08-11 18:19:51'),
(35, NULL, 'App\\Models\\GoldLog', 130, 'gold', 'add', 'Sold: 2kkk gold .185 euro', '2000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 18:20:09', '2026-08-11 18:20:09'),
(36, NULL, 'App\\Models\\GoldLog', 131, 'gold', 'add', 'Sold: 454kk (.22$) paypal', '454000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 18:23:26', '2026-08-11 18:23:26'),
(37, NULL, 'App\\Models\\GoldLog', 132, 'gold', 'sell', 'Pantay', '2454000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 18:25:15', '2026-08-11 18:25:15'),
(38, NULL, 'App\\Models\\GoldLog', 133, 'gold', 'add', '.17 gcash', '142500000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 18:29:15', '2026-08-11 18:29:15'),
(39, NULL, 'App\\Models\\GoldLog', 134, 'gold', 'fee', 'Pantay', '14000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 18:36:49', '2026-08-11 18:36:49'),
(40, NULL, 'App\\Models\\BalanceEntry', 12, 'balance', 'add', 'Pantay', '12.40', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 18:46:06', '2026-08-11 18:46:06'),
(41, NULL, 'App\\Models\\Saving', 17, 'savings', 'withdraw', NULL, '3117.37', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-11 18:48:42', '2026-08-11 18:48:42'),
(42, NULL, 'App\\Models\\Trade', 64, 'trade', 'kks', '8/19 160', '160000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 16:53:35', '2026-08-12 16:53:35'),
(43, NULL, 'App\\Models\\GoldLog', 135, 'gold', 'fee', '8/19 160', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 16:56:11', '2026-08-12 16:56:11'),
(44, NULL, 'App\\Models\\Transaction', 124, 'daily', 'expense', '24 Chicken', '219.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 18:56:01', '2026-08-12 18:56:01'),
(45, NULL, 'App\\Models\\Trade', 56, 'trade', 'archived', '8/12 730', '730000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 19:43:45', '2026-08-12 19:43:45'),
(46, NULL, 'App\\Models\\GoldLog', 136, 'gold', 'add', '.17$ binance', '150000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 22:21:44', '2026-08-12 22:21:44'),
(47, NULL, 'App\\Models\\GoldLog', 137, 'gold', 'add', '.17$ binance', '100000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 22:47:16', '2026-08-12 22:47:16'),
(48, NULL, 'App\\Models\\Trade', 65, 'trade', 'kks', '8/20 200', '200000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 23:10:42', '2026-08-12 23:10:42'),
(49, NULL, 'App\\Models\\GoldLog', 138, 'gold', 'fee', '8/20 200', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-12 23:11:06', '2026-08-12 23:11:06'),
(50, NULL, 'App\\Models\\Trade', 66, 'trade', 'kks', '8/20 184', '184000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 02:01:15', '2026-08-13 02:01:15'),
(51, NULL, 'App\\Models\\GoldLog', 139, 'gold', 'fee', '8/20 124', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 02:01:27', '2026-08-13 02:01:27'),
(52, NULL, 'App\\Models\\Transaction', 125, 'daily', 'expense', 'dinner', '148.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 17:01:11', '2026-08-13 17:01:11'),
(53, NULL, 'App\\Models\\Transaction', 126, 'daily', 'expense', 'pagupit', '250.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 17:01:24', '2026-08-13 17:01:24'),
(54, NULL, 'App\\Models\\Transaction', 127, 'daily', 'expense', 'Gas', '519.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 17:01:33', '2026-08-13 17:01:33'),
(55, NULL, 'App\\Models\\GoldLog', 140, 'gold', 'sell', '.22$ Paypal', '2000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 17:03:03', '2026-08-13 17:03:03'),
(56, NULL, 'App\\Models\\Trade', 67, 'trade', 'kks', '8/26 85', '85000002.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 17:12:16', '2026-08-13 17:12:16'),
(57, NULL, 'App\\Models\\GoldLog', 141, 'gold', 'fee', '8/26 85', '1000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 17:13:24', '2026-08-13 17:13:24'),
(58, NULL, 'App\\Models\\Trade', 68, 'trade', 'kks', '8/21 49', '49000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 17:54:42', '2026-08-13 17:54:42'),
(59, NULL, 'App\\Models\\GoldLog', 142, 'gold', 'fee', '8/21 49', '1000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 17:57:23', '2026-08-13 17:57:23'),
(60, NULL, 'App\\Models\\GoldLog', 143, 'gold', 'fee', 'item trade', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 17:58:02', '2026-08-13 17:58:02'),
(61, NULL, 'App\\Models\\BusinessTransaction', 41, 'business', 'account', '2kkk gold .21$', '4743.20', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 19:27:24', '2026-08-13 19:27:24'),
(62, NULL, 'App\\Models\\GoldLog', 144, 'gold', 'add', 'Sold: 2kkk gold .21$', '2000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 19:27:34', '2026-08-13 19:27:34'),
(63, NULL, 'App\\Models\\GoldLog', 145, 'gold', 'sell', 'Pantay', '2000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 19:28:08', '2026-08-13 19:28:08'),
(64, NULL, 'App\\Models\\GoldLog', 146, 'gold', 'add', '.17$ binance', '100000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 19:39:25', '2026-08-13 19:39:25'),
(65, NULL, 'App\\Models\\Transaction', 128, 'daily', 'income', '8/14', '10000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 20:56:02', '2026-08-13 20:56:02'),
(66, NULL, 'App\\Models\\GoldLog', 147, 'gold', 'add', '.17$ binance', '150000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 23:23:52', '2026-08-13 23:23:52'),
(67, NULL, 'App\\Models\\Trade', 69, 'trade', 'kks', '8/21 288', '288000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-13 23:27:39', '2026-08-13 23:27:39'),
(68, NULL, 'App\\Models\\GoldLog', 148, 'gold', 'add', '.17$ binance', '100000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-14 17:19:47', '2026-08-14 17:19:47'),
(69, NULL, 'App\\Models\\GoldLog', 149, 'gold', 'add', '.175$ binance', '900000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-14 17:20:12', '2026-08-14 17:20:12'),
(70, NULL, 'App\\Models\\GoldLog', 150, 'gold', 'fee', 'Pantay', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-14 17:23:46', '2026-08-14 17:23:46'),
(71, NULL, 'App\\Models\\Trade', 57, 'trade', 'archived', '8/14 168', '168000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-14 17:25:11', '2026-08-14 17:25:11'),
(72, NULL, 'App\\Models\\GoldLog', 151, 'gold', 'fee', '624kk', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-14 18:52:38', '2026-08-14 18:52:38'),
(73, NULL, 'App\\Models\\GoldLog', 152, 'gold', 'add', '.17$ gcash', '463000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-14 20:25:41', '2026-08-14 20:25:41'),
(74, NULL, 'App\\Models\\GoldLog', 153, 'gold', 'sell', '.22$ Paypal', '180000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-14 20:54:49', '2026-08-14 20:54:49'),
(75, NULL, 'App\\Models\\BusinessTransaction', 42, 'business', 'account', '180kk (.22$) paypal', '540.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-14 20:57:42', '2026-08-14 20:57:42'),
(76, NULL, 'App\\Models\\GoldLog', 154, 'gold', 'add', 'Sold: 180kk (.22$) paypal', '180000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-14 20:57:51', '2026-08-14 20:57:51'),
(77, NULL, 'App\\Models\\GoldLog', 155, 'gold', 'sell', 'Pantay', '180000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-14 20:58:12', '2026-08-14 20:58:12'),
(78, NULL, 'App\\Models\\GoldLog', 156, 'gold', 'add', '.17$ gcash', '332500000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-14 21:14:33', '2026-08-14 21:14:33'),
(79, NULL, 'App\\Models\\Trade', 70, 'trade', 'kks', '8/22 450', '450000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-14 23:14:43', '2026-08-14 23:14:43'),
(80, NULL, 'App\\Models\\GoldLog', 157, 'gold', 'fee', '8/22 450', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-14 23:15:22', '2026-08-14 23:15:22'),
(81, NULL, 'App\\Models\\GoldLog', 158, 'gold', 'add', '.17$ gcash', '60000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-14 23:43:11', '2026-08-14 23:43:11'),
(82, NULL, 'App\\Models\\GoldLog', 159, 'gold', 'add', '.17$ binance', '332500000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-14 23:57:54', '2026-08-14 23:57:54'),
(83, NULL, 'App\\Models\\GoldLog', 160, 'gold', 'add', '.17$ binance', '350000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 17:03:31', '2026-08-16 17:03:31'),
(84, NULL, 'App\\Models\\GoldLog', 161, 'gold', 'add', '.17$ gcash', '142500000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 17:03:53', '2026-08-16 17:03:53'),
(85, NULL, 'App\\Models\\GoldLog', 162, 'gold', 'add', '.17$ gcash', '325000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 17:04:09', '2026-08-16 17:04:09'),
(86, NULL, 'App\\Models\\GoldLog', 163, 'gold', 'sell', '.2$ binance', '165000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 17:04:28', '2026-08-16 17:04:28'),
(87, NULL, 'App\\Models\\Trade', 69, 'trade', 'archived', '8/21 288', '288000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 17:06:50', '2026-08-16 17:06:50'),
(88, NULL, 'App\\Models\\Trade', 71, 'trade', 'kks', '8/28 100', '100000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 17:10:41', '2026-08-16 17:10:41'),
(89, NULL, 'App\\Models\\GoldLog', 164, 'gold', 'fee', '8/28 100', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 17:11:10', '2026-08-16 17:11:10'),
(90, NULL, 'App\\Models\\Trade', 58, 'trade', 'archived', '8/16 8', '8000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 17:15:32', '2026-08-16 17:15:32'),
(91, NULL, 'App\\Models\\BusinessTransaction', 43, 'business', 'account', '480kk (.2$) binance', '878.40', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 17:36:41', '2026-08-16 17:36:41'),
(92, NULL, 'App\\Models\\GoldLog', 165, 'gold', 'add', 'Sold: 480kk (.2$) binance', '480000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 17:36:48', '2026-08-16 17:36:48'),
(93, NULL, 'App\\Models\\GoldLog', 166, 'gold', 'sell', 'Pantay', '480000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 17:37:05', '2026-08-16 17:37:05'),
(94, NULL, 'App\\Models\\Transaction', 129, 'daily', 'expense', 'Flowers', '500.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 17:45:58', '2026-08-16 17:45:58'),
(95, NULL, 'App\\Models\\Transaction', 130, 'daily', 'expense', 'Starbucks', '604.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 17:48:01', '2026-08-16 17:48:01'),
(96, NULL, 'App\\Models\\Transaction', 131, 'daily', 'expense', 'Taco and water', '363.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 17:48:27', '2026-08-16 17:48:27'),
(97, NULL, 'App\\Models\\Transaction', 132, 'daily', 'expense', 'Mango Drink', '211.10', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 17:49:09', '2026-08-16 17:49:09'),
(98, NULL, 'App\\Models\\Transaction', 133, 'daily', 'expense', 'Jollibee and other stuffs', '1000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 17:50:32', '2026-08-16 17:50:32'),
(99, NULL, 'App\\Models\\Transaction', 134, 'daily', 'expense', 'Lugaw & other stuffs', '1000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 17:52:19', '2026-08-16 17:52:19'),
(100, NULL, 'App\\Models\\GoldLog', 167, 'gold', 'add', 'Sold: Leblanc 596 Magic', '1000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 21:07:39', '2026-08-16 21:07:39'),
(101, NULL, 'App\\Models\\GoldLog', 168, 'gold', 'sell', 'pantay', '1000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 21:13:45', '2026-08-16 21:13:45'),
(102, NULL, 'App\\Models\\GoldLog', 169, 'gold', 'add', '.17$ binance', '97000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 22:17:16', '2026-08-16 22:17:16'),
(103, NULL, 'App\\Models\\GoldLog', 170, 'gold', 'add', '.17$ binance', '250000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 22:40:06', '2026-08-16 22:40:06'),
(104, NULL, 'App\\Models\\GoldLog', 171, 'gold', 'sell', 'Pantay', '100000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-16 22:47:05', '2026-08-16 22:47:05'),
(105, NULL, 'App\\Models\\Trade', 59, 'trade', 'archived', '8/18 180', '180000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 16:49:23', '2026-08-18 16:49:23'),
(106, NULL, 'App\\Models\\GoldLog', 172, 'gold', 'add', '.165$ binance', '150000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 16:50:58', '2026-08-18 16:50:58'),
(107, NULL, 'App\\Models\\GoldLog', 173, 'gold', 'add', '.17$ binance', '97000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 16:57:37', '2026-08-18 16:57:37'),
(108, NULL, 'App\\Models\\Trade', 68, 'trade', 'archived', '8/21 89', '89000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 17:02:37', '2026-08-18 17:02:37'),
(109, NULL, 'App\\Models\\GoldLog', 174, 'gold', 'add', '.17$ binance', '80000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 17:03:10', '2026-08-18 17:03:10'),
(110, NULL, 'App\\Models\\Transaction', 135, 'daily', 'expense', 'Spotify', '169.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 17:15:35', '2026-08-18 17:15:35'),
(111, NULL, 'App\\Models\\Transaction', 136, 'daily', 'expense', 'Sinigang', '300.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 17:18:06', '2026-08-18 17:18:06'),
(112, NULL, 'App\\Models\\Transaction', 137, 'daily', 'expense', 'Lunch (Hungarian & Siomai)', '145.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 17:21:01', '2026-08-18 17:21:01'),
(113, NULL, 'App\\Models\\GoldLog', 175, 'gold', 'add', '.17$ binance', '100000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 17:23:42', '2026-08-18 17:23:42'),
(114, NULL, 'App\\Models\\GoldLog', 176, 'gold', 'sell', '.21$ paypal', '2000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 17:42:34', '2026-08-18 17:42:34'),
(115, NULL, 'App\\Models\\BusinessTransaction', 44, 'business', 'account', '900kk (.175)', '1874.25', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 17:49:30', '2026-08-18 17:49:30'),
(116, NULL, 'App\\Models\\GoldLog', 177, 'gold', 'add', 'Sold: 900kk (.175)', '900000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 17:49:53', '2026-08-18 17:49:53'),
(117, NULL, 'App\\Models\\GoldLog', 178, 'gold', 'sell', 'pantay', '900000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 17:50:06', '2026-08-18 17:50:06'),
(118, NULL, 'App\\Models\\BusinessTransaction', 45, 'business', 'account', '150kk (.165$ binance)', '401.63', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 17:52:46', '2026-08-18 17:52:46'),
(119, NULL, 'App\\Models\\GoldLog', 179, 'gold', 'add', 'Sold: 150kk (.165$ binance)', '150000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 17:52:58', '2026-08-18 17:52:58'),
(120, NULL, 'App\\Models\\GoldLog', 180, 'gold', 'sell', 'Pantay', '150000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 17:53:13', '2026-08-18 17:53:13'),
(121, NULL, 'App\\Models\\BusinessTransaction', 46, 'business', 'account', '950kk (.21$ paypal)', '2261.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 17:55:27', '2026-08-18 17:55:27'),
(122, NULL, 'App\\Models\\GoldLog', 181, 'gold', 'add', 'Sold: 950kk (.21$ paypal)', '950000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 17:55:35', '2026-08-18 17:55:35'),
(123, NULL, 'App\\Models\\GoldLog', 182, 'gold', 'sell', 'Pantay', '950000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 17:55:49', '2026-08-18 17:55:49'),
(124, NULL, 'App\\Models\\Trade', 67, 'trade', 'archived', '8/21 85', '85000002.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 19:03:47', '2026-08-18 19:03:47'),
(125, NULL, 'App\\Models\\Trade', 60, 'trade', 'archived', '8/18 220', '220000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 19:30:31', '2026-08-18 19:30:31'),
(126, NULL, 'App\\Models\\BusinessTransaction', 47, 'business', 'gold', 'Test', '10000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 19:39:12', '2026-08-18 19:39:12'),
(127, NULL, 'App\\Models\\BusinessTransaction', 47, 'business', 'archived', 'Test', '0.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 19:39:12', '2026-08-18 19:39:12'),
(128, NULL, 'App\\Models\\BusinessTransaction', 48, 'business', 'gold', 'Tester', '10000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 19:55:34', '2026-08-18 19:55:34'),
(129, NULL, 'App\\Models\\BusinessTransaction', 49, 'business', 'gold', 'Last Test', '1000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 21:02:41', '2026-08-18 21:02:41'),
(130, NULL, 'App\\Models\\Transaction', 138, 'daily', 'expense', 'Jollibee', '254.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 21:08:19', '2026-08-18 21:08:19'),
(131, NULL, 'App\\Models\\BusinessTransaction', 50, 'business', 'gold', 'Final Test', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 21:23:44', '2026-08-18 21:23:44'),
(132, NULL, 'App\\Models\\BusinessTransaction', 51, 'business', 'gold', 'Try bigger amount', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 21:28:00', '2026-08-18 21:28:00'),
(133, NULL, 'App\\Models\\BusinessTransaction', 52, 'business', 'gold', '500kk test', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 21:40:05', '2026-08-18 21:40:05'),
(134, NULL, 'App\\Models\\BusinessTransaction', 53, 'business', 'gold', '500kk final testtt', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 21:45:48', '2026-08-18 21:45:48'),
(135, NULL, 'App\\Models\\BusinessTransaction', 54, 'business', 'gold', '500kk Test again', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 21:54:47', '2026-08-18 21:54:47'),
(136, NULL, 'App\\Models\\BusinessTransaction', 55, 'business', 'gold', '500kk TESTETER', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 21:59:38', '2026-08-18 21:59:38'),
(137, NULL, 'App\\Models\\BusinessTransaction', 55, 'business', 'archived', '500kk TESTETER', '1500.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 22:00:13', '2026-08-18 22:00:13'),
(138, NULL, 'App\\Models\\BusinessTransaction', 56, 'business', 'account', 'Leblanc 637 Dist', '9165.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 22:08:54', '2026-08-18 22:08:54'),
(139, NULL, 'App\\Models\\Trade', 72, 'trade', 'kks', '8/26 580', '580000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 22:16:23', '2026-08-18 22:16:23'),
(140, NULL, 'App\\Models\\BusinessTransaction', 57, 'business', 'gold', 'test gold in business archive', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 22:27:01', '2026-08-18 22:27:01'),
(141, NULL, 'App\\Models\\BusinessTransaction', 57, 'business', 'archived', 'test gold in business archive', '600.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 22:27:33', '2026-08-18 22:27:33'),
(142, NULL, 'App\\Models\\GoldLog', 183, 'gold', 'fee', '8/26 580', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 22:37:27', '2026-08-18 22:37:27'),
(143, NULL, 'App\\Models\\GoldLog', 184, 'gold', 'add', '.165$ binance', '85000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 22:42:23', '2026-08-18 22:42:23'),
(144, NULL, 'App\\Models\\Trade', 73, 'trade', 'kks', 'Test MM feee 20kk', '20000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 22:45:33', '2026-08-18 22:45:33'),
(145, NULL, 'App\\Models\\GoldLog', 185, 'gold', 'fee', 'Test MM feee 20kk', '1000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 22:45:33', '2026-08-18 22:45:33'),
(146, NULL, 'App\\Models\\Trade', 74, 'trade', 'kks', 'test ulit', '5000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 23:00:15', '2026-08-18 23:00:15'),
(147, NULL, 'App\\Models\\GoldLog', 186, 'gold', 'fee', 'test ulit', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 23:00:15', '2026-08-18 23:00:15'),
(148, NULL, 'App\\Models\\BusinessTransaction', 58, 'business', 'gold', '85kk (.165$) binance', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 23:02:33', '2026-08-18 23:02:33'),
(149, NULL, 'App\\Models\\Trade', 75, 'trade', 'kks', '8/26 155', '155000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 23:04:34', '2026-08-18 23:04:34'),
(150, NULL, 'App\\Models\\GoldLog', 187, 'gold', 'fee', '8/26 155', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 23:04:35', '2026-08-18 23:04:35'),
(151, NULL, 'App\\Models\\Trade', 55, 'trade', 'archived', '8/19 200', '200000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-18 23:59:36', '2026-08-18 23:59:36'),
(152, NULL, 'App\\Models\\Trade', 76, 'trade', 'kks', '8/25 133', '133000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 00:03:42', '2026-08-19 00:03:42'),
(153, NULL, 'App\\Models\\GoldLog', 188, 'gold', 'fee', '8/25 133', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 00:03:42', '2026-08-19 00:03:42'),
(154, NULL, 'App\\Models\\GoldLog', 189, 'gold', 'add', 'pantay', '100000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 00:11:27', '2026-08-19 00:11:27'),
(155, NULL, 'App\\Models\\GoldLog', 190, 'gold', 'sell', 'pantay', '100000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 00:20:41', '2026-08-19 00:20:41'),
(156, NULL, 'App\\Models\\GoldLog', 191, 'gold', 'sell', '96kk missing', '96000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 00:40:26', '2026-08-19 00:40:26'),
(157, NULL, 'App\\Models\\GoldLog', 192, 'gold', 'add', 'pantay', '2.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 01:07:54', '2026-08-19 01:07:54'),
(158, NULL, 'App\\Models\\Trade', 77, 'trade', 'kks', '8/27 749', '749000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 17:03:41', '2026-08-19 17:03:41'),
(159, NULL, 'App\\Models\\GoldLog', 193, 'gold', 'fee', '8/27 749', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 17:03:42', '2026-08-19 17:03:42'),
(160, NULL, 'App\\Models\\Trade', 78, 'trade', 'kks', '8/27 100', '100000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 17:04:02', '2026-08-19 17:04:02'),
(161, NULL, 'App\\Models\\GoldLog', 194, 'gold', 'fee', '8/27 100', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 17:04:02', '2026-08-19 17:04:02'),
(162, NULL, 'App\\Models\\Trade', 64, 'trade', 'archived', '8/19 160', '160000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 17:04:20', '2026-08-19 17:04:20'),
(163, NULL, 'App\\Models\\GoldLog', 195, 'gold', 'add', '.17$ binance', '102000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 17:07:47', '2026-08-19 17:07:47'),
(164, NULL, 'App\\Models\\GoldLog', 196, 'gold', 'sell', '.21$ paypal', '61500000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 17:13:58', '2026-08-19 17:13:58'),
(165, NULL, 'App\\Models\\BusinessTransaction', 59, 'business', 'gold', '23.5$ (.165$) binance', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 17:15:58', '2026-08-19 17:15:58'),
(166, NULL, 'App\\Models\\BusinessTransaction', 60, 'business', 'gold', '61.5kk (.165$) binance', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 17:16:42', '2026-08-19 17:16:42'),
(167, NULL, 'App\\Models\\BusinessTransaction', 61, 'business', 'gold', '61.5kk (.165$ binance)', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 17:17:35', '2026-08-19 17:17:35'),
(168, NULL, 'App\\Models\\BusinessTransaction', 62, 'business', 'gold', '85 test', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 17:21:58', '2026-08-19 17:21:58'),
(169, NULL, 'App\\Models\\BusinessTransaction', 63, 'business', 'gold', '61.5 (.165$ binance)', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 17:27:42', '2026-08-19 17:27:42'),
(170, NULL, 'App\\Models\\BusinessTransaction', 64, 'business', 'gold', '21.5 (.165$ binance)', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 17:28:01', '2026-08-19 17:28:01'),
(171, NULL, 'App\\Models\\BusinessTransaction', 63, 'business', 'archived', '61.5 (.165$ binance)', '795.95', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 17:29:53', '2026-08-19 17:29:53'),
(172, NULL, 'App\\Models\\Transaction', 139, 'daily', 'expense', 'Vape', '250.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 17:34:23', '2026-08-19 17:34:23'),
(173, NULL, 'App\\Models\\BalanceEntry', 13, 'balance', 'add', NULL, '208.83', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 17:38:29', '2026-08-19 17:38:29'),
(174, NULL, 'App\\Models\\Saving', 18, 'savings', 'deposit', NULL, '16341.59', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 17:39:08', '2026-08-19 17:39:08'),
(175, NULL, 'App\\Models\\BusinessTransaction', 63, 'business', 'archived', '61.5 (.165$ binance)', '795.95', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 18:33:58', '2026-08-19 18:33:58'),
(176, NULL, 'App\\Models\\BusinessTransaction', 63, 'business', 'archived', '61.5 (.165$ binance)', '795.95', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 18:58:10', '2026-08-19 18:58:10'),
(177, NULL, 'App\\Models\\BusinessTransaction', 63, 'business', 'archived', '61.5 (.165$ binance)', '795.95', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 19:05:52', '2026-08-19 19:05:52'),
(178, NULL, 'App\\Models\\Transaction', 140, 'daily', 'expense', NULL, '40.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 19:40:37', '2026-08-19 19:40:37'),
(179, NULL, 'App\\Models\\Trade', 79, 'trade', 'kks', '8/27 500', '500000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 21:04:20', '2026-08-19 21:04:20'),
(180, NULL, 'App\\Models\\GoldLog', 197, 'gold', 'fee', '8/27 500', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 21:04:20', '2026-08-19 21:04:20'),
(181, NULL, 'App\\Models\\GoldLog', 198, 'gold', 'add', '.165$ binance', '200000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 21:56:03', '2026-08-19 21:56:03'),
(182, NULL, 'App\\Models\\BusinessTransaction', 65, 'business', 'gold', '.165$ binance', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-19 21:57:01', '2026-08-19 21:57:01'),
(183, NULL, 'App\\Models\\Trade', 61, 'trade', 'archived', '8/18 128', '128000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:17:41', '2026-08-23 17:17:41'),
(184, NULL, 'App\\Models\\Trade', 66, 'trade', 'archived', '8/20 184', '184000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:17:57', '2026-08-23 17:17:57'),
(185, NULL, 'App\\Models\\Trade', 65, 'trade', 'archived', '8/20 210', '210000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:18:18', '2026-08-23 17:18:18'),
(186, NULL, 'App\\Models\\Trade', 70, 'trade', 'archived', '8/22 450', '450000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:19:09', '2026-08-23 17:19:09'),
(187, NULL, 'App\\Models\\Trade', 80, 'trade', 'kks', '8/31 119', '119000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:22:11', '2026-08-23 17:22:11');
INSERT INTO `activity_logs` (`id`, `user_id`, `loggable_type`, `loggable_id`, `module`, `type`, `description`, `amount`, `ip_address`, `user_agent`, `created_at`, `updated_at`) VALUES
(188, NULL, 'App\\Models\\GoldLog', 199, 'gold', 'fee', '8/31 119', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:22:11', '2026-08-23 17:22:11'),
(189, NULL, 'App\\Models\\Trade', 81, 'trade', 'kks', '8/30 205', '205000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:22:48', '2026-08-23 17:22:48'),
(190, NULL, 'App\\Models\\GoldLog', 200, 'gold', 'fee', '8/30 205', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:22:48', '2026-08-23 17:22:48'),
(191, NULL, 'App\\Models\\Trade', 82, 'trade', 'kks', '8/28 485', '485000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:23:15', '2026-08-23 17:23:15'),
(192, NULL, 'App\\Models\\GoldLog', 201, 'gold', 'fee', '8/28 485', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:23:15', '2026-08-23 17:23:15'),
(193, NULL, 'App\\Models\\Trade', 83, 'trade', 'kks', '8/29 1.5', '1500000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:25:33', '2026-08-23 17:25:33'),
(194, NULL, 'App\\Models\\GoldLog', 202, 'gold', 'fee', '8/29 1.5', '1000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:25:34', '2026-08-23 17:25:34'),
(195, NULL, 'App\\Models\\GoldLog', 203, 'gold', 'add', '641 mage payment', '925000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:27:11', '2026-08-23 17:27:11'),
(196, NULL, 'App\\Models\\GoldLog', 204, 'gold', 'add', '.17$ binance', '1000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:27:36', '2026-08-23 17:27:36'),
(197, NULL, 'App\\Models\\GoldLog', 205, 'gold', 'add', '.17$ binance', '220000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:27:50', '2026-08-23 17:27:50'),
(198, NULL, 'App\\Models\\GoldLog', 206, 'gold', 'add', '.17$ binance', '100000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:27:58', '2026-08-23 17:27:58'),
(199, NULL, 'App\\Models\\GoldLog', 207, 'gold', 'add', '.17$ binance', '903000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:28:08', '2026-08-23 17:28:08'),
(200, NULL, 'App\\Models\\GoldLog', 208, 'gold', 'sell', '.22$ Paypal', '2400000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:28:30', '2026-08-23 17:28:30'),
(201, NULL, 'App\\Models\\GoldLog', 209, 'gold', 'sell', '.21$ paypal', '200000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:28:46', '2026-08-23 17:28:46'),
(202, NULL, 'App\\Models\\GoldLog', 210, 'gold', 'sell', '.21$ paypal', '261000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:28:56', '2026-08-23 17:28:56'),
(203, NULL, 'App\\Models\\BusinessTransaction', 66, 'business', 'gold', '.175$', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:35:36', '2026-08-23 17:35:36'),
(204, NULL, 'App\\Models\\BusinessTransaction', 67, 'business', 'gold', '.22$', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:38:26', '2026-08-23 17:38:26'),
(205, NULL, 'App\\Models\\BusinessTransaction', 68, 'business', 'gold', '.21$ paypal', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:39:29', '2026-08-23 17:39:29'),
(206, NULL, 'App\\Models\\BusinessTransaction', 69, 'business', 'gold', '.17$ paypal', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:39:43', '2026-08-23 17:39:43'),
(207, NULL, 'App\\Models\\BusinessTransaction', 65, 'business', 'archived', '.165$ binance', '743.13', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:40:58', '2026-08-23 17:40:58'),
(208, NULL, 'App\\Models\\BusinessTransaction', 69, 'business', 'archived', '.17$ paypal', '636.84', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:42:27', '2026-08-23 17:42:27'),
(209, NULL, 'App\\Models\\BusinessTransaction', 68, 'business', 'archived', '.21$ paypal', '488.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:42:40', '2026-08-23 17:42:40'),
(210, NULL, 'App\\Models\\BusinessTransaction', 67, 'business', 'archived', '.22$', '3899.42', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:42:44', '2026-08-23 17:42:44'),
(211, NULL, 'App\\Models\\BusinessTransaction', 66, 'business', 'archived', '.175$', '2470.50', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:42:50', '2026-08-23 17:42:50'),
(212, NULL, 'App\\Models\\Trade', 84, 'trade', 'kks', '8/27', '1100000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:47:21', '2026-08-23 17:47:21'),
(213, NULL, 'App\\Models\\GoldLog', 211, 'gold', 'fee', '8/27 1100 (Account Secure)', '15000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:47:48', '2026-08-23 17:47:48'),
(214, NULL, 'App\\Models\\Trade', 85, 'trade', 'kks', '8/28 130', '130000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:48:21', '2026-08-23 17:48:21'),
(215, NULL, 'App\\Models\\GoldLog', 212, 'gold', 'fee', '8/28 130', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:48:21', '2026-08-23 17:48:21'),
(216, NULL, 'App\\Models\\GoldLog', 213, 'gold', 'fee', 'MM Fee', '7000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:51:34', '2026-08-23 17:51:34'),
(217, NULL, 'App\\Models\\GoldLog', 214, 'gold', 'add', 'other stuffs', '41415.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:51:48', '2026-08-23 17:51:48'),
(218, NULL, 'App\\Models\\Transaction', 141, 'daily', 'expense', 'Gas', '535.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:57:04', '2026-08-23 17:57:04'),
(219, NULL, 'App\\Models\\Transaction', 142, 'daily', 'expense', 'Unli Wings', '798.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:57:18', '2026-08-23 17:57:18'),
(220, NULL, 'App\\Models\\Transaction', 143, 'daily', 'expense', 'Tiktok card holder', '270.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:57:40', '2026-08-23 17:57:40'),
(221, NULL, 'App\\Models\\Transaction', 144, 'daily', 'expense', 'Siopao', '400.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:57:58', '2026-08-23 17:57:58'),
(222, NULL, 'App\\Models\\Transaction', 145, 'daily', 'expense', 'Ice cream and idk', '198.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:58:17', '2026-08-23 17:58:17'),
(223, NULL, 'App\\Models\\Transaction', 146, 'daily', 'expense', 'Siomai', '15.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:58:31', '2026-08-23 17:58:31'),
(224, NULL, 'App\\Models\\Transaction', 147, 'daily', 'expense', 'Siopao', '273.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:58:48', '2026-08-23 17:58:48'),
(225, NULL, 'App\\Models\\Transaction', 148, 'daily', 'expense', 'Ice cream', '99.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:59:03', '2026-08-23 17:59:03'),
(226, NULL, 'App\\Models\\Transaction', 149, 'daily', 'expense', 'Chowking', '415.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:59:17', '2026-08-23 17:59:17'),
(227, NULL, 'App\\Models\\Transaction', 150, 'daily', 'expense', 'Shake', '60.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:59:30', '2026-08-23 17:59:30'),
(228, NULL, 'App\\Models\\Transaction', 151, 'daily', 'expense', 'Chocomucho and siomai', '32.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 17:59:58', '2026-08-23 17:59:58'),
(229, NULL, 'App\\Models\\Transaction', 152, 'daily', 'expense', 'Ice cream', '88.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 18:00:27', '2026-08-23 18:00:27'),
(230, NULL, 'App\\Models\\Transaction', 153, 'daily', 'expense', '24 Chicken and drinks', '434.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 18:00:59', '2026-08-23 18:00:59'),
(231, NULL, 'App\\Models\\Transaction', 154, 'daily', 'expense', 'baby', '1000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 18:02:14', '2026-08-23 18:02:14'),
(232, NULL, 'App\\Models\\GoldLog', 215, 'gold', 'fee', '9/9 84', '1000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 18:37:18', '2026-08-23 18:37:18'),
(233, NULL, 'App\\Models\\BalanceEntry', 14, 'balance', 'sell', NULL, '167.75', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 21:10:36', '2026-08-23 21:10:36'),
(234, NULL, 'App\\Models\\BalanceEntry', 15, 'balance', 'add', NULL, '55.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 21:10:42', '2026-08-23 21:10:42'),
(235, NULL, 'App\\Models\\Saving', 19, 'savings', 'deposit', NULL, '16069.97', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 21:13:25', '2026-08-23 21:13:25'),
(236, NULL, 'App\\Models\\GoldLog', 216, 'gold', 'add', '.17$ binance', '1000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 21:50:30', '2026-08-23 21:50:30'),
(237, NULL, 'App\\Models\\GoldLog', 217, 'gold', 'add', '.17$ binance', '36000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 21:59:57', '2026-08-23 21:59:57'),
(238, NULL, 'App\\Models\\GoldLog', 218, 'gold', 'add', '.165$ binance', '600000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 22:05:55', '2026-08-23 22:05:55'),
(239, NULL, 'App\\Models\\BusinessTransaction', 70, 'business', 'gold', '.165$', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 22:06:55', '2026-08-23 22:06:55'),
(240, NULL, 'App\\Models\\BalanceEntry', 16, 'balance', 'add', NULL, '1600.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 22:11:37', '2026-08-23 22:11:37'),
(241, NULL, 'App\\Models\\BalanceEntry', 17, 'balance', 'add', NULL, '50000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 22:11:49', '2026-08-23 22:11:49'),
(242, NULL, 'App\\Models\\BalanceEntry', 18, 'balance', 'add', NULL, '100552.87', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 22:12:12', '2026-08-23 22:12:12'),
(243, NULL, 'App\\Models\\BalanceEntry', 19, 'balance', 'add', NULL, '47496.41', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 22:12:29', '2026-08-23 22:12:29'),
(244, NULL, 'App\\Models\\BalanceEntry', 20, 'balance', 'add', NULL, '48.40', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 22:13:11', '2026-08-23 22:13:11'),
(245, NULL, 'App\\Models\\BalanceEntry', 21, 'balance', 'add', NULL, '0.47', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 22:13:19', '2026-08-23 22:13:19'),
(246, NULL, 'App\\Models\\Trade', 45, 'trade', 'archived', '9/9 70', '70000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-23 22:52:06', '2026-08-23 22:52:06'),
(247, NULL, 'App\\Models\\Trade', 53, 'trade', 'archived', '9/9 84', '84000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 17:02:10', '2026-08-24 17:02:10'),
(248, NULL, 'App\\Models\\Trade', 76, 'trade', 'archived', '8/25 133', '133000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 18:00:12', '2026-08-24 18:00:12'),
(249, NULL, 'App\\Models\\BalanceEntry', 22, 'balance', 'add', NULL, '100.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 21:31:22', '2026-08-24 21:31:22'),
(250, NULL, 'App\\Models\\GoldLog', 219, 'gold', 'add', 'Sold: Leblanc 632 Dist', '2500000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:07:25', '2026-08-24 22:07:25'),
(251, NULL, 'App\\Models\\GoldLog', 220, 'gold', 'add', 'Sold: Leblanc 632 Dist', '2500000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:09:23', '2026-08-24 22:09:23'),
(252, NULL, 'App\\Models\\GoldLog', 221, 'gold', 'sell', 'Leblanc 621 Dist', '1000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:10:09', '2026-08-24 22:10:09'),
(253, NULL, 'App\\Models\\GoldLog', 222, 'gold', 'add', 'Sold: Leblanc 632 Melee', '2100000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:11:48', '2026-08-24 22:11:48'),
(254, NULL, 'App\\Models\\GoldLog', 223, 'gold', 'add', 'Sold: Leblanc 632 Melee', '2100000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:14:21', '2026-08-24 22:14:21'),
(255, NULL, 'App\\Models\\GoldLog', 224, 'gold', 'sell', '60 Wand', '1000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:17:11', '2026-08-24 22:17:11'),
(256, NULL, 'App\\Models\\GoldLog', 225, 'gold', 'add', 'Sold: Leblanc 632 Melee', '2000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:19:22', '2026-08-24 22:19:22'),
(257, NULL, 'App\\Models\\GoldLog', 226, 'gold', 'add', 'Sold: Leblanc 632 Dist', '2500000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:23:37', '2026-08-24 22:23:37'),
(258, NULL, 'App\\Models\\GoldLog', 227, 'gold', 'sell', 'rollback', '1000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:26:59', '2026-08-24 22:26:59'),
(259, NULL, 'App\\Models\\BalanceEntry', 23, 'balance', 'sell', NULL, '100.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:28:43', '2026-08-24 22:28:43'),
(260, NULL, 'App\\Models\\BalanceEntry', 24, 'balance', 'add', NULL, '100.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:28:50', '2026-08-24 22:28:50'),
(261, NULL, 'App\\Models\\GoldLog', 228, 'gold', 'sell', NULL, '600000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:29:03', '2026-08-24 22:29:03'),
(262, NULL, 'App\\Models\\GoldLog', 229, 'gold', 'sell', 'rollback', '1000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:32:48', '2026-08-24 22:32:48'),
(263, NULL, 'App\\Models\\GoldLog', 230, 'gold', 'add', 'Sold: Leblanc 632 Melee', '2000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:33:25', '2026-08-24 22:33:25'),
(264, NULL, 'App\\Models\\GoldLog', 231, 'gold', 'add', 'Sold: Leblanc 632 Melee', '2000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:34:20', '2026-08-24 22:34:20'),
(265, NULL, 'App\\Models\\GoldLog', 232, 'gold', 'sell', '60 Wand', '1000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:34:38', '2026-08-24 22:34:38'),
(266, NULL, 'App\\Models\\BusinessTransaction', 71, 'business', 'gold', '60 Wand', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:35:26', '2026-08-24 22:35:26'),
(267, NULL, 'App\\Models\\GoldLog', 233, 'gold', 'add', 'Sold: Leblanc 632 Dist', '2500000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:38:14', '2026-08-24 22:38:14'),
(268, NULL, 'App\\Models\\GoldLog', 234, 'gold', 'add', 'Sold: Leblanc 632 Dist', '2500000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:39:18', '2026-08-24 22:39:18'),
(269, NULL, 'App\\Models\\GoldLog', 235, 'gold', 'sell', 'Hindi pa nabibigay', '575000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:40:27', '2026-08-24 22:40:27'),
(270, NULL, 'App\\Models\\GoldLog', 236, 'gold', 'sell', 'Leblanc 621 Dist', '1000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:40:42', '2026-08-24 22:40:42'),
(271, NULL, 'App\\Models\\GoldLog', 237, 'gold', 'sell', 'nabigay na', '925000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 22:41:17', '2026-08-24 22:41:17'),
(272, NULL, 'App\\Models\\BusinessTransaction', 72, 'business', 'account', 'Leblanc 621 Dist', '5535.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 23:05:21', '2026-08-24 23:05:21'),
(273, NULL, 'App\\Models\\Trade', 86, 'trade', 'kks', '9/1 30', '30000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 23:11:27', '2026-08-24 23:11:27'),
(274, NULL, 'App\\Models\\GoldLog', 238, 'gold', 'fee', '9/1 30', '1000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 23:11:27', '2026-08-24 23:11:27'),
(275, NULL, 'App\\Models\\Trade', 87, 'trade', 'kks', '9/1 30 (after 3 days 160kk)', '30000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 23:15:37', '2026-08-24 23:15:37'),
(276, NULL, 'App\\Models\\GoldLog', 239, 'gold', 'fee', '9/1 30 (after 3 days 160kk)', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-24 23:15:37', '2026-08-24 23:15:37'),
(277, NULL, 'App\\Models\\Trade', 63, 'trade', 'archived', '8/21 85', '85000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-25 17:06:52', '2026-08-25 17:06:52'),
(278, NULL, 'App\\Models\\GoldLog', 240, 'gold', 'add', 'Leblanc 632 Dist', '575000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-25 21:01:11', '2026-08-25 21:01:11'),
(279, NULL, 'App\\Models\\Trade', 72, 'trade', 'archived', '8/26 580', '580000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-25 23:05:57', '2026-08-25 23:05:57'),
(280, NULL, 'App\\Models\\Trade', 75, 'trade', 'archived', '8/26 155', '155000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-26 00:45:19', '2026-08-26 00:45:19'),
(281, NULL, 'App\\Models\\Trade', 62, 'trade', 'archived', '8/26 2000', '2000000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-26 04:28:02', '2026-08-26 04:28:02'),
(282, NULL, 'App\\Models\\BusinessTransaction', 73, 'business', 'gold', 'Tip 2kkk trade', '0.01', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-26 04:29:16', '2026-08-26 04:29:16'),
(283, NULL, 'App\\Models\\BusinessTransaction', 73, 'business', 'archived', 'Tip 2kkk trade', '692.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-26 04:31:11', '2026-08-26 04:31:11'),
(284, NULL, 'App\\Models\\Trade', 88, 'trade', 'kks', '9/2 81.5', '81500000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-26 05:26:24', '2026-08-26 05:26:24'),
(285, NULL, 'App\\Models\\GoldLog', 241, 'gold', 'fee', '9/2 81.5', '2000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-26 05:26:24', '2026-08-26 05:26:24'),
(286, NULL, 'App\\Models\\GoldLog', 242, 'gold', 'add', 'pantay', '2000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-26 16:56:37', '2026-08-26 16:56:37'),
(287, NULL, 'App\\Models\\GoldLog', 243, 'gold', 'add', 'Wand 60', '1150000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-26 17:34:46', '2026-08-26 17:34:46'),
(288, NULL, 'App\\Models\\BusinessTransaction', 74, 'business', 'gold', 'Wand 60', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-26 17:36:30', '2026-08-26 17:36:30'),
(289, NULL, 'App\\Models\\BusinessTransaction', 74, 'business', 'archived', 'Wand 60', '3690.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-26 17:37:29', '2026-08-26 17:37:29'),
(290, NULL, 'App\\Models\\BalanceEntry', 25, 'balance', 'add', NULL, '98.76', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-26 17:42:05', '2026-08-26 17:42:05'),
(291, NULL, 'App\\Models\\BalanceEntry', 26, 'balance', 'add', NULL, '10.14', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-26 17:42:50', '2026-08-26 17:42:50'),
(292, NULL, 'App\\Models\\BalanceEntry', 27, 'balance', 'add', NULL, '10.47', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-26 17:44:07', '2026-08-26 17:44:07'),
(293, NULL, 'App\\Models\\Transaction', 155, 'daily', 'expense', 'Pilzerd', '1000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-26 18:00:19', '2026-08-26 18:00:19'),
(294, NULL, 'App\\Models\\BalanceEntry', 28, 'balance', 'sell', 'baby', '1000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-26 18:00:42', '2026-08-26 18:00:42'),
(295, NULL, 'App\\Models\\Trade', 77, 'trade', 'archived', '8/27 749', '749000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-26 22:28:52', '2026-08-26 22:28:52'),
(296, NULL, 'App\\Models\\GoldLog', 244, 'gold', 'add', '.17$ binance', '60000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 00:43:32', '2026-08-27 00:43:32'),
(297, NULL, 'App\\Models\\Trade', 79, 'trade', 'archived', '8/27 500', '500000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-27 03:36:06', '2026-08-27 03:36:06'),
(298, NULL, 'App\\Models\\GoldLog', 245, 'gold', 'fee', '9/2 176.5', '1000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 17:43:30', '2026-08-27 17:43:30'),
(299, NULL, 'App\\Models\\Trade', 84, 'trade', 'archived', '8/27 1100', '1100000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 17:44:11', '2026-08-27 17:44:11'),
(300, NULL, 'App\\Models\\Trade', 78, 'trade', 'archived', '8/27 100', '100000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 17:44:29', '2026-08-27 17:44:29'),
(301, NULL, 'App\\Models\\GoldLog', 246, 'gold', 'sell', 'Leblanc 637 Dist', '1925000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 17:50:35', '2026-08-27 17:50:35'),
(302, NULL, 'App\\Models\\GoldLog', 247, 'gold', 'fee', '384kk mm', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 17:51:05', '2026-08-27 17:51:05'),
(303, NULL, 'App\\Models\\GoldLog', 248, 'gold', 'add', '.165', '100000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 17:53:16', '2026-08-27 17:53:16'),
(304, NULL, 'App\\Models\\BusinessTransaction', 75, 'business', 'gold', '.165$', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 17:54:05', '2026-08-27 17:54:05'),
(305, NULL, 'App\\Models\\GoldLog', 249, 'gold', 'fee', 'MM Fee', '1000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 17:54:30', '2026-08-27 17:54:30'),
(306, NULL, 'App\\Models\\GoldLog', 250, 'gold', 'sell', 'Pantay', '1000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 17:57:22', '2026-08-27 17:57:22'),
(307, NULL, 'App\\Models\\GoldLog', 251, 'gold', 'sell', 'pantay', '3000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 18:03:18', '2026-08-27 18:03:18'),
(308, NULL, 'App\\Models\\Trade', 85, 'trade', 'archived', '8/28 130', '130000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 18:42:34', '2026-08-27 18:42:34'),
(309, NULL, 'App\\Models\\Trade', 89, 'trade', 'kks', '9/4 175', '175000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 18:49:14', '2026-08-27 18:49:14'),
(310, NULL, 'App\\Models\\GoldLog', 252, 'gold', 'fee', '9/4 175', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 18:49:15', '2026-08-27 18:49:15'),
(311, NULL, 'App\\Models\\Transaction', 156, 'daily', 'expense', 'McFlurry', '74.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 23:16:31', '2026-08-27 23:16:31'),
(312, NULL, 'App\\Models\\Transaction', 157, 'daily', 'expense', 'Helmet Cleaner', '147.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 23:16:53', '2026-08-27 23:16:53'),
(313, NULL, 'App\\Models\\Transaction', 158, 'daily', 'expense', 'Contact Lens Solution', '199.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-27 23:18:21', '2026-08-27 23:18:21'),
(314, NULL, 'App\\Models\\GoldLog', 253, 'gold', 'add', '.17$ gcash', '950000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-28 00:38:38', '2026-08-28 00:38:38'),
(315, NULL, 'App\\Models\\Trade', 90, 'trade', 'kks', '9/4 450', '450000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-28 00:44:04', '2026-08-28 00:44:04'),
(316, NULL, 'App\\Models\\GoldLog', 254, 'gold', 'fee', '9/4 450', '1000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-28 00:44:04', '2026-08-28 00:44:04'),
(317, NULL, 'App\\Models\\Trade', 91, 'trade', 'kks', '9/4 247', '245000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-28 01:18:09', '2026-08-28 01:18:09'),
(318, NULL, 'App\\Models\\GoldLog', 255, 'gold', 'fee', '9/4 247', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-28 01:18:09', '2026-08-28 01:18:09'),
(319, NULL, 'App\\Models\\BusinessTransaction', 76, 'business', 'gold', 'MM Fee', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-28 01:20:06', '2026-08-28 01:20:06'),
(320, NULL, 'App\\Models\\BusinessTransaction', 77, 'business', 'gold', 'MM Fee', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-28 01:21:09', '2026-08-28 01:21:09'),
(321, NULL, 'App\\Models\\BusinessTransaction', 78, 'business', 'gold', 'MM Fee', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-28 01:21:53', '2026-08-28 01:21:53'),
(322, NULL, 'App\\Models\\Transaction', 159, 'daily', 'income', NULL, '10500.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 04:46:53', '2026-08-28 04:46:53'),
(323, NULL, 'App\\Models\\GoldLog', 256, 'gold', 'add', '.17$ binance', '160000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 05:20:04', '2026-08-28 05:20:04'),
(324, NULL, 'App\\Models\\Trade', 92, 'trade', 'kks', '9/4 720', '720000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 05:20:48', '2026-08-28 05:20:48'),
(325, NULL, 'App\\Models\\GoldLog', 257, 'gold', 'fee', '9/4 720', '2000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 05:20:49', '2026-08-28 05:20:49'),
(326, NULL, 'App\\Models\\Trade', 82, 'trade', 'archived', '8/28 485', '485000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 16:06:10', '2026-08-28 16:06:10'),
(327, NULL, 'App\\Models\\BusinessTransaction', 79, 'business', 'gold', '.21$ Paypal', '0.01', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 16:11:43', '2026-08-28 16:11:43'),
(328, NULL, 'App\\Models\\BusinessTransaction', 80, 'business', 'gold', '.21$ paypal', '0.01', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 16:15:59', '2026-08-28 16:15:59'),
(329, NULL, 'App\\Models\\BusinessTransaction', 80, 'business', 'archived', '.21$ paypal', '892.33', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 16:18:47', '2026-08-28 16:18:47'),
(330, NULL, 'App\\Models\\GoldLog', 258, 'gold', 'sell', '.21$ paypal', '333333333.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 16:19:11', '2026-08-28 16:19:11'),
(331, NULL, 'App\\Models\\BusinessTransaction', 81, 'business', 'gold', '.165$', '0.01', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 16:20:52', '2026-08-28 16:20:52'),
(332, NULL, 'App\\Models\\GoldLog', 259, 'gold', 'add', 'Sold: Leblanc 582 Dist', '961525688.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 17:46:31', '2026-08-28 17:46:31'),
(333, NULL, 'App\\Models\\GoldLog', 260, 'gold', 'sell', 'Leblanc 561 Mage', '500000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 17:46:49', '2026-08-28 17:46:49'),
(334, NULL, 'App\\Models\\Transaction', 160, 'daily', 'expense', 'Burger n tonkatsu', '196.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 17:52:29', '2026-08-28 17:52:29'),
(335, NULL, 'App\\Models\\Transaction', 161, 'daily', 'income', NULL, '50.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 17:55:31', '2026-08-28 17:55:31'),
(336, NULL, 'App\\Models\\GoldLog', 261, 'gold', 'add', NULL, '47500000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 19:10:30', '2026-08-28 19:10:30'),
(337, NULL, 'App\\Models\\Transaction', 162, 'daily', 'expense', 'Beef', '580.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 20:08:53', '2026-08-28 20:08:53'),
(338, NULL, 'App\\Models\\Transaction', 163, 'daily', 'income', 'Kinsenas', '10000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 20:39:34', '2026-08-28 20:39:34'),
(339, NULL, 'App\\Models\\Transaction', 164, 'daily', 'expense', 'Dinner', '500.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 20:40:09', '2026-08-28 20:40:09'),
(340, NULL, 'App\\Models\\GoldLog', 262, 'gold', 'fee', 'Gold trade', '2000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 21:35:22', '2026-08-28 21:35:22'),
(341, NULL, 'App\\Models\\GoldLog', 263, 'gold', 'add', 'Sold: Leblanc 642 Melee', '2300000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 21:42:26', '2026-08-28 21:42:26'),
(342, NULL, 'App\\Models\\GoldLog', 264, 'gold', 'sell', '.185€ paypal', '1300000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-28 21:43:43', '2026-08-28 21:43:43'),
(343, NULL, 'App\\Models\\Transaction', 165, 'daily', 'expense', 'Cheese, butter, & milk', '220.52', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-29 03:20:47', '2026-08-29 03:20:47'),
(344, NULL, 'App\\Models\\Transaction', 166, 'daily', 'expense', 'Soft Drinks', '143.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-29 03:21:08', '2026-08-29 03:21:08'),
(345, NULL, 'App\\Models\\Transaction', 167, 'daily', 'expense', 'Siopao', '942.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-29 03:21:58', '2026-08-29 03:21:58'),
(346, NULL, 'App\\Models\\Transaction', 168, 'daily', 'expense', 'Couple Slippers', '523.18', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-29 03:22:24', '2026-08-29 03:22:24'),
(347, NULL, 'App\\Models\\GoldLog', 265, 'gold', 'fee', 'gold mm fee', '2000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.7922.112 Mobile/15E148 Safari/604.1', '2026-08-29 05:37:03', '2026-08-29 05:37:03'),
(348, NULL, 'App\\Models\\Trade', 71, 'trade', 'archived', '8/28 100', '100000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-08-29 21:48:00', '2026-08-29 21:48:00'),
(349, NULL, 'App\\Models\\Trade', 83, 'trade', 'archived', '8/29 1.5', '1500000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-08-29 21:48:02', '2026-08-29 21:48:02'),
(350, NULL, 'App\\Models\\GoldLog', 266, 'gold', 'add', '.17$ gcash', '105000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-08-29 21:56:01', '2026-08-29 21:56:01'),
(351, NULL, 'App\\Models\\Trade', 81, 'trade', 'archived', '8/30 205', '205000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-08-30 07:07:47', '2026-08-30 07:07:47'),
(352, NULL, 'App\\Models\\Transaction', 169, 'daily', 'expense', 'Tiktok', '869.80', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-08-30 17:22:54', '2026-08-30 17:22:54'),
(353, NULL, 'App\\Models\\Transaction', 170, 'daily', 'expense', 'Baon sa Quezon', '744.56', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-08-30 17:24:02', '2026-08-30 17:24:02'),
(354, NULL, 'App\\Models\\Transaction', 171, 'daily', 'expense', 'Pasalubong', '820.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-08-31 06:02:49', '2026-08-31 06:02:49'),
(355, NULL, 'App\\Models\\GoldLog', 267, 'gold', 'sell', '.21$ paypal', '484000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 17:08:06', '2026-08-31 17:08:06'),
(356, NULL, 'App\\Models\\GoldLog', 268, 'gold', 'sell', '.21$ paypal', '500000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 17:12:08', '2026-08-31 17:12:08'),
(357, NULL, 'App\\Models\\BusinessTransaction', 82, 'business', 'gold', '.165$', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 17:14:09', '2026-08-31 17:14:09'),
(358, NULL, 'App\\Models\\BusinessTransaction', 81, 'business', 'archived', '.165$', '1006.50', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 17:15:35', '2026-08-31 17:15:35'),
(359, NULL, 'App\\Models\\BusinessTransaction', 83, 'business', 'gold', '.21$ paypal', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 17:17:09', '2026-08-31 17:17:09'),
(360, NULL, 'App\\Models\\BusinessTransaction', 83, 'business', 'archived', '.21$ paypal', '1486.54', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 17:17:53', '2026-08-31 17:17:53'),
(361, NULL, 'App\\Models\\BusinessTransaction', 84, 'business', 'account', 'Leblanc 561 Mage', '2152.50', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 17:18:29', '2026-08-31 17:18:29'),
(362, NULL, 'App\\Models\\Transaction', 172, 'daily', 'expense', 'gas', '560.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 17:33:59', '2026-08-31 17:33:59'),
(363, NULL, 'App\\Models\\Transaction', 173, 'daily', 'expense', 'Kfc', '832.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 17:35:31', '2026-08-31 17:35:31'),
(364, NULL, 'App\\Models\\BusinessTransaction', 85, 'business', 'gold', 'MM Fee', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 18:09:33', '2026-08-31 18:09:33'),
(365, NULL, 'App\\Models\\BusinessTransaction', 86, 'business', 'gold', 'MM Fee', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 18:09:49', '2026-08-31 18:09:49'),
(366, NULL, 'App\\Models\\BusinessTransaction', 86, 'business', 'archived', 'MM Fee', '1353.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 18:10:41', '2026-08-31 18:10:41'),
(367, NULL, 'App\\Models\\BalanceEntry', 29, 'balance', 'add', NULL, '190.60', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 18:50:22', '2026-08-31 18:50:22'),
(368, NULL, 'App\\Models\\BalanceEntry', 30, 'balance', 'add', NULL, '53.89', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 18:50:57', '2026-08-31 18:50:57'),
(369, NULL, 'App\\Models\\BalanceEntry', 31, 'balance', 'sell', NULL, '53.89', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 18:51:06', '2026-08-31 18:51:06');
INSERT INTO `activity_logs` (`id`, `user_id`, `loggable_type`, `loggable_id`, `module`, `type`, `description`, `amount`, `ip_address`, `user_agent`, `created_at`, `updated_at`) VALUES
(370, NULL, 'App\\Models\\BalanceEntry', 32, 'balance', 'sell', NULL, '53.89', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 18:51:13', '2026-08-31 18:51:13'),
(371, NULL, 'App\\Models\\BalanceEntry', 33, 'balance', 'sell', NULL, '65.47', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 18:51:26', '2026-08-31 18:51:26'),
(372, NULL, 'App\\Models\\BalanceEntry', 34, 'balance', 'add', NULL, '20316.19', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 18:52:51', '2026-08-31 18:52:51'),
(373, NULL, 'App\\Models\\BalanceEntry', 35, 'balance', 'add', NULL, '8221.90', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 19:32:41', '2026-08-31 19:32:41'),
(374, NULL, 'App\\Models\\Transaction', 174, 'daily', 'expense', 'Phone ni baby', '2000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 20:51:48', '2026-08-31 20:51:48'),
(375, NULL, 'App\\Models\\Transaction', 175, 'daily', 'expense', 'Dunkin coffee', '167.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 21:01:52', '2026-08-31 21:01:52'),
(376, NULL, 'App\\Models\\GoldLog', 269, 'gold', 'add', '.17$ gcash', '9500000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 21:41:55', '2026-08-31 21:41:55'),
(377, NULL, 'App\\Models\\Transaction', 176, 'daily', 'expense', 'baby', '3000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 21:49:13', '2026-08-31 21:49:13'),
(378, NULL, 'App\\Models\\Transaction', 177, 'daily', 'expense', 'Babyy', '2000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 22:00:24', '2026-08-31 22:00:24'),
(379, NULL, 'App\\Models\\Transaction', 178, 'daily', 'income', 'Suman', '130.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 22:05:12', '2026-08-31 22:05:12'),
(380, NULL, 'App\\Models\\Transaction', 179, 'daily', 'income', 'Payment for dunkin coffee', '170.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 22:06:50', '2026-08-31 22:06:50'),
(381, NULL, 'App\\Models\\GoldLog', 270, 'gold', 'add', '.17$ gcash', '47500000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-08-31 23:04:27', '2026-08-31 23:04:27'),
(382, NULL, 'App\\Models\\Trade', 80, 'trade', 'archived', '8/31 119', '119000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-09-01 02:10:56', '2026-09-01 02:10:56'),
(383, NULL, 'App\\Models\\Trade', 91, 'trade', 'archived', '9/4 245', '245000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-01 07:54:26', '2026-09-01 07:54:26'),
(384, NULL, 'App\\Models\\GoldLog', 271, 'gold', 'add', '.17$ gcash', '364000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-01 08:37:13', '2026-09-01 08:37:13'),
(385, NULL, 'App\\Models\\GoldLog', 272, 'gold', 'add', '.17$ gcash', '2614000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-01 08:37:29', '2026-09-01 08:37:29'),
(386, NULL, 'App\\Models\\GoldLog', 273, 'gold', 'sell', NULL, '138000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-01 08:40:48', '2026-09-01 08:40:48'),
(387, NULL, 'App\\Models\\Trade', 86, 'trade', 'archived', '9/1 30', '30000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 16:55:15', '2026-09-01 16:55:15'),
(388, NULL, 'App\\Models\\Trade', 87, 'trade', 'archived', '9/1 160', '160000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 17:18:41', '2026-09-01 17:18:41'),
(389, NULL, 'App\\Models\\BusinessTransaction', 87, 'business', 'gold', '.21$ paypal', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 17:21:45', '2026-09-01 17:21:45'),
(390, NULL, 'App\\Models\\BusinessTransaction', 88, 'business', 'gold', '.22$', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 17:23:17', '2026-09-01 17:23:17'),
(391, NULL, 'App\\Models\\BusinessTransaction', 89, 'business', 'gold', '.223', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 17:25:15', '2026-09-01 17:25:15'),
(392, NULL, 'App\\Models\\BusinessTransaction', 89, 'business', 'archived', '.223', '1616.50', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 17:26:10', '2026-09-01 17:26:10'),
(393, NULL, 'App\\Models\\BusinessTransaction', 88, 'business', 'archived', '.22$', '738.10', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 17:26:12', '2026-09-01 17:26:12'),
(394, NULL, 'App\\Models\\BusinessTransaction', 87, 'business', 'archived', '.21$ paypal', '336.72', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 17:26:17', '2026-09-01 17:26:17'),
(395, NULL, 'App\\Models\\GoldLog', 274, 'gold', 'sell', 'Leblanc 632 Melee', '1600000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 17:36:38', '2026-09-01 17:36:38'),
(396, NULL, 'App\\Models\\GoldLog', 275, 'gold', 'add', '7 days pa mag dededuct', '1600000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 17:52:22', '2026-09-01 17:52:22'),
(397, NULL, 'App\\Models\\GoldLog', 276, 'gold', 'sell', '.22$ Paypal', '242000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 17:57:18', '2026-09-01 17:57:18'),
(398, NULL, 'App\\Models\\GoldLog', 277, 'gold', 'sell', '.223$ paypal', '500000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 17:57:29', '2026-09-01 17:57:29'),
(399, NULL, 'App\\Models\\GoldLog', 278, 'gold', 'add', '.17$ gcash', '47500000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 17:58:15', '2026-09-01 17:58:15'),
(400, NULL, 'App\\Models\\Trade', 93, 'trade', 'kks', '9/9 1600', '1600000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 17:59:58', '2026-09-01 17:59:58'),
(401, NULL, 'App\\Models\\GoldLog', 279, 'gold', 'fee', '9/9 1600', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 17:59:58', '2026-09-01 17:59:58'),
(402, NULL, 'App\\Models\\Transaction', 180, 'daily', 'expense', 'papa', '100.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 18:48:12', '2026-09-01 18:48:12'),
(403, NULL, 'App\\Models\\BusinessTransaction', 90, 'business', 'account', 'Leblanc 632 Melee', '7808.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 19:16:28', '2026-09-01 19:16:28'),
(404, NULL, 'App\\Models\\BusinessTransaction', 91, 'business', 'account', 'Leblanc 514 Dist', '1079.70', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 19:16:41', '2026-09-01 19:16:41'),
(405, NULL, 'App\\Models\\BusinessTransaction', 92, 'business', 'account', 'Leblanc 586 Magic', '3849.10', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 19:18:24', '2026-09-01 19:18:24'),
(406, NULL, 'App\\Models\\BusinessTransaction', 93, 'business', 'account', 'Leblanc 583 Dist', '4160.20', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 19:31:53', '2026-09-01 19:31:53'),
(407, NULL, 'App\\Models\\BalanceEntry', 36, 'balance', 'sell', NULL, '43222.52', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 19:53:17', '2026-09-01 19:53:17'),
(408, NULL, 'App\\Models\\GoldLog', 280, 'gold', 'add', '.17$ gcash', '57000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-01 21:05:30', '2026-09-01 21:05:30'),
(409, NULL, 'App\\Models\\Transaction', 181, 'daily', 'expense', 'meryenda', '100.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-02 00:44:25', '2026-09-02 00:44:25'),
(410, NULL, 'App\\Models\\Transaction', 182, 'daily', 'expense', 'bayad', '950.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-02 00:47:08', '2026-09-02 00:47:08'),
(411, NULL, 'App\\Models\\GoldLog', 281, 'gold', 'add', '.17$ binance', '102000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-02 00:53:45', '2026-09-02 00:53:45'),
(412, NULL, 'App\\Models\\GoldLog', 282, 'gold', 'add', '.17$ gcash', '684000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-02 04:17:53', '2026-09-02 04:17:53'),
(413, NULL, 'App\\Models\\GoldLog', 283, 'gold', 'sell', '.19€ paypal', '3300000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-02 08:16:21', '2026-09-02 08:16:21'),
(414, NULL, 'App\\Models\\BusinessTransaction', 94, 'business', 'gold', '.19€ paypal', '0.01', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-02 08:16:59', '2026-09-02 08:16:59'),
(415, NULL, 'App\\Models\\BusinessTransaction', 94, 'business', 'archived', '.19€ paypal', '9662.40', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-02 08:22:03', '2026-09-02 08:22:03'),
(416, NULL, 'App\\Models\\GoldLog', 284, 'gold', 'add', '.17$ gcash', '76000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-02 16:50:18', '2026-09-02 16:50:18'),
(417, NULL, 'App\\Models\\Transaction', 183, 'daily', 'expense', '24chicken', '134.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-02 19:13:22', '2026-09-02 19:13:22'),
(418, NULL, 'App\\Models\\Transaction', 184, 'daily', 'expense', 'Motor CP Holder', '688.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-02 19:35:48', '2026-09-02 19:35:48'),
(419, NULL, 'App\\Models\\Trade', 48, 'trade', 'archived', '9/4 65', '65000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-02 19:49:48', '2026-09-02 19:49:48'),
(420, NULL, 'App\\Models\\Trade', 94, 'trade', 'kks', '9/10 3300', '3300000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-02 20:50:21', '2026-09-02 20:50:21'),
(421, NULL, 'App\\Models\\GoldLog', 285, 'gold', 'fee', '9/10 3300', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-02 20:50:21', '2026-09-02 20:50:21'),
(422, NULL, 'App\\Models\\GoldLog', 286, 'gold', 'add', 'ananeko gold trade', '4000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-03 04:04:27', '2026-09-03 04:04:27'),
(423, NULL, 'App\\Models\\GoldLog', 287, 'gold', 'sell', 'ananeko bug', '4000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-03 04:04:53', '2026-09-03 04:04:53'),
(424, NULL, 'App\\Models\\GoldLog', 288, 'gold', 'fee', 'ananeko gold trade', '4000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-03 04:05:07', '2026-09-03 04:05:07'),
(425, NULL, 'App\\Models\\GoldLog', 289, 'gold', 'add', '.17$ gcash', '123500000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-03 04:45:57', '2026-09-03 04:45:57'),
(426, NULL, 'App\\Models\\Trade', 95, 'trade', 'kks', '9/10 395', '395000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-03 04:51:16', '2026-09-03 04:51:16'),
(427, NULL, 'App\\Models\\GoldLog', 290, 'gold', 'fee', '9/10 395', '2000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-03 04:51:17', '2026-09-03 04:51:17'),
(428, NULL, 'App\\Models\\GoldLog', 291, 'gold', 'fee', '9/3 176.5', '3000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-03 17:38:04', '2026-09-03 17:38:04'),
(429, NULL, 'App\\Models\\Trade', 88, 'trade', 'archived', '9/2 176.5', '176500000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-03 17:42:33', '2026-09-03 17:42:33'),
(430, NULL, 'App\\Models\\Trade', 89, 'trade', 'archived', '9/4 175', '175000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-03 19:20:13', '2026-09-03 19:20:13'),
(431, NULL, 'App\\Models\\Transaction', 185, 'daily', 'expense', 'baby', '1000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-03 20:54:21', '2026-09-03 20:54:21'),
(432, NULL, 'App\\Models\\GoldLog', 292, 'gold', 'add', '.17$ gcash', '105000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-03 20:58:52', '2026-09-03 20:58:52'),
(433, NULL, 'App\\Models\\GoldLog', 293, 'gold', 'fee', 'MM gold fee', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-03 22:07:25', '2026-09-03 22:07:25'),
(434, NULL, 'App\\Models\\Trade', 96, 'trade', 'kks', '9/11 133', '133000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-04 00:05:49', '2026-09-04 00:05:49'),
(435, NULL, 'App\\Models\\GoldLog', 294, 'gold', 'fee', '9/11 133', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-04 00:05:50', '2026-09-04 00:05:50'),
(436, NULL, 'App\\Models\\GoldLog', 295, 'gold', 'add', '.17$ gcash', '28500000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-04 00:06:07', '2026-09-04 00:06:07'),
(437, NULL, 'App\\Models\\BalanceEntry', 37, 'balance', 'add', NULL, '46670.76', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-04 00:09:33', '2026-09-04 00:09:33'),
(438, NULL, 'App\\Models\\GoldLog', 296, 'gold', 'add', '.17$ gcash', '213750000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-04 00:11:55', '2026-09-04 00:11:55'),
(439, NULL, 'App\\Models\\BalanceEntry', 38, 'balance', 'sell', NULL, '2250.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-04 00:12:52', '2026-09-04 00:12:52'),
(440, NULL, 'App\\Models\\BalanceEntry', 39, 'balance', 'add', NULL, '138.89', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-04 00:15:08', '2026-09-04 00:15:08'),
(441, NULL, 'App\\Models\\BalanceEntry', 40, 'balance', 'add', NULL, '35.15', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-04 00:15:35', '2026-09-04 00:15:35'),
(442, NULL, 'App\\Models\\BalanceEntry', 41, 'balance', 'sell', NULL, '35.15', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-04 00:15:45', '2026-09-04 00:15:45'),
(443, NULL, 'App\\Models\\BalanceEntry', 42, 'balance', 'sell', NULL, '35.15', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-04 00:15:47', '2026-09-04 00:15:47'),
(444, NULL, 'App\\Models\\Trade', 90, 'trade', 'archived', '9/4 450', '450000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-04 01:38:14', '2026-09-04 01:38:14'),
(445, NULL, 'App\\Models\\Transaction', 186, 'daily', 'expense', 'bfast', '220.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-05 01:42:52', '2026-09-05 01:42:52'),
(446, NULL, 'App\\Models\\Transaction', 187, 'daily', 'expense', 'siomai', '60.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-05 01:43:09', '2026-09-05 01:43:09'),
(447, NULL, 'App\\Models\\GoldLog', 297, 'gold', 'fee', 'Mm fee', '15000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-05 18:19:49', '2026-09-05 18:19:49'),
(448, NULL, 'App\\Models\\GoldLog', 298, 'gold', 'sell', NULL, '56000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-05 18:21:04', '2026-09-05 18:21:04'),
(449, NULL, 'App\\Models\\BusinessTransaction', 95, 'business', 'gold', '.21$', '0.01', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-05 18:23:36', '2026-09-05 18:23:36'),
(450, NULL, 'App\\Models\\BusinessTransaction', 95, 'business', 'archived', '.21$', '139.55', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-05 18:25:28', '2026-09-05 18:25:28'),
(451, NULL, 'App\\Models\\Transaction', 188, 'daily', 'expense', 'Royal', '86.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-05 18:28:23', '2026-09-05 18:28:23'),
(452, NULL, 'App\\Models\\Transaction', 189, 'daily', 'expense', 'Sahog', '90.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-05 19:03:25', '2026-09-05 19:03:25'),
(453, NULL, 'App\\Models\\Transaction', 190, 'daily', 'expense', 'Pedicure', '200.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-05 19:03:47', '2026-09-05 19:03:47'),
(454, NULL, 'App\\Models\\Trade', 92, 'trade', 'archived', '9/4 720', '720000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-05 19:07:29', '2026-09-05 19:07:29'),
(455, NULL, 'App\\Models\\Transaction', 191, 'daily', 'expense', 'bread', '28.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-05 19:08:54', '2026-09-05 19:08:54'),
(456, NULL, 'App\\Models\\Transaction', 192, 'daily', 'expense', 'Samg', '770.40', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-05 22:41:09', '2026-09-05 22:41:09'),
(457, NULL, 'App\\Models\\Transaction', 193, 'daily', 'expense', 'Top box', '5700.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-05 22:41:21', '2026-09-05 22:41:21'),
(458, NULL, 'App\\Models\\Transaction', 194, 'daily', 'expense', 'bread', '56.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-06 05:58:17', '2026-09-06 05:58:17'),
(459, NULL, 'App\\Models\\Transaction', 195, 'daily', 'expense', 'puto bongbong', '100.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-06 05:58:45', '2026-09-06 05:58:45'),
(460, NULL, 'App\\Models\\Transaction', 196, 'daily', 'expense', 'Jollibee', '313.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-06 05:59:13', '2026-09-06 05:59:13'),
(461, NULL, 'App\\Models\\Transaction', 197, 'daily', 'expense', 'Gas', '554.65', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-06 17:13:01', '2026-09-06 17:13:01'),
(462, NULL, 'App\\Models\\BusinessTransaction', 96, 'business', 'gold', '.21$ paypal', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-06 17:15:54', '2026-09-06 17:15:54'),
(463, NULL, 'App\\Models\\BusinessTransaction', 96, 'business', 'archived', '.21$ paypal', '209.84', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-06 17:16:41', '2026-09-06 17:16:41'),
(464, NULL, 'App\\Models\\Transaction', 198, 'daily', 'expense', 'ZUS coffee', '156.14', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-06 21:37:35', '2026-09-06 21:37:35'),
(465, NULL, 'App\\Models\\Transaction', 199, 'daily', 'expense', 'Motor Cover', '178.13', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-07 00:09:22', '2026-09-07 00:09:22'),
(466, NULL, 'App\\Models\\Trade', 97, 'trade', 'kks', '9/14 155', '155000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-07 02:30:09', '2026-09-07 02:30:09'),
(467, NULL, 'App\\Models\\GoldLog', 299, 'gold', 'fee', '9/14 155', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-07 02:30:09', '2026-09-07 02:30:09'),
(468, NULL, 'App\\Models\\GoldLog', 300, 'gold', 'sell', '.22$ paypal', '1000000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-07 13:57:30', '2026-09-07 13:57:30'),
(469, NULL, 'App\\Models\\GoldLog', 301, 'gold', 'sell', '.22$ paypal', '216000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-07 13:57:55', '2026-09-07 13:57:55'),
(470, NULL, 'App\\Models\\BusinessTransaction', 97, 'business', 'gold', '.22$ paypal', '0.01', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-07 13:58:32', '2026-09-07 13:58:32'),
(471, NULL, 'App\\Models\\BusinessTransaction', 97, 'business', 'archived', '.22$ paypal', '3675.92', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-07 14:03:54', '2026-09-07 14:03:54'),
(472, NULL, 'App\\Models\\BusinessTransaction', 97, 'business', 'archived', '.22$ paypal', '3675.92', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-07 14:06:19', '2026-09-07 14:06:19'),
(473, NULL, 'App\\Models\\GoldLog', 302, 'gold', 'sell', '.22$ Paypal', '1000000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-07 16:49:04', '2026-09-07 16:49:04'),
(474, NULL, 'App\\Models\\BusinessTransaction', 98, 'business', 'gold', '.22$ paypal', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-07 16:50:17', '2026-09-07 16:50:17'),
(475, NULL, 'App\\Models\\BusinessTransaction', 98, 'business', 'archived', '.22$ paypal', '3025.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-07 16:52:42', '2026-09-07 16:52:42'),
(476, NULL, 'App\\Models\\BusinessTransaction', 97, 'business', 'archived', '.22$ paypal', '3675.92', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-07 16:53:40', '2026-09-07 16:53:40'),
(477, NULL, 'App\\Models\\GoldLog', 303, 'gold', 'sell', '.22$ Paypal', '1999999997.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-07 17:02:17', '2026-09-07 17:02:17'),
(478, NULL, 'App\\Models\\BusinessTransaction', 99, 'business', 'gold', '.22$ paypal', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-07 17:02:45', '2026-09-07 17:02:45'),
(479, NULL, 'App\\Models\\BusinessTransaction', 99, 'business', 'archived', '.22$ paypal', '6074.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-07 17:04:13', '2026-09-07 17:04:13'),
(480, NULL, 'App\\Models\\GoldLog', 304, 'gold', 'fee', 'gold mm fee', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-07 17:59:36', '2026-09-07 17:59:36'),
(481, NULL, 'App\\Models\\Trade', 98, 'trade', 'kks', '9/15 930', '930000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-07 18:58:04', '2026-09-07 18:58:04'),
(482, NULL, 'App\\Models\\GoldLog', 305, 'gold', 'fee', '9/15 930', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-07 18:58:04', '2026-09-07 18:58:04'),
(483, NULL, 'App\\Models\\Transaction', 200, 'daily', 'expense', 'Liquid wash', '247.80', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-07 19:03:31', '2026-09-07 19:03:31'),
(484, NULL, 'App\\Models\\GoldLog', 306, 'gold', 'fee', 'Gold mm fee', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-07 19:48:35', '2026-09-07 19:48:35'),
(485, NULL, 'App\\Models\\GoldLog', 307, 'gold', 'add', '.17$ binance', '103000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-08 06:22:18', '2026-09-08 06:22:18'),
(486, NULL, 'App\\Models\\GoldLog', 308, 'gold', 'sell', 'Leblanc 632 Melee', '1600000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-08 15:42:24', '2026-09-08 15:42:24'),
(487, NULL, 'App\\Models\\Trade', 99, 'trade', 'kks', '9/16 228', '228000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-08 15:44:31', '2026-09-08 15:44:31'),
(488, NULL, 'App\\Models\\GoldLog', 309, 'gold', 'fee', '9/16 228', '2000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-08 15:44:32', '2026-09-08 15:44:32'),
(489, NULL, 'App\\Models\\GoldLog', 310, 'gold', 'fee', NULL, '2000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-08 16:39:48', '2026-09-08 16:39:48'),
(490, NULL, 'App\\Models\\GoldLog', 311, 'gold', 'sell', '.22$ paypal', '789000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 06:59:14', '2026-09-09 06:59:14'),
(491, NULL, 'App\\Models\\Trade', 93, 'trade', 'archived', '9/9 1600', '1600000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 14:00:31', '2026-09-09 14:00:31'),
(492, NULL, 'App\\Models\\GoldLog', 312, 'gold', 'add', '.175$ binance', '1600000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 14:13:09', '2026-09-09 14:13:09'),
(493, NULL, 'App\\Models\\BusinessTransaction', 100, 'business', 'gold', '.175$', '0.01', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 14:18:02', '2026-09-09 14:18:02'),
(494, NULL, 'App\\Models\\BusinessTransaction', 101, 'business', 'gold', '.22$', '0.01', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 14:19:20', '2026-09-09 14:19:20'),
(495, NULL, 'App\\Models\\BusinessTransaction', 101, 'business', 'archived', '.22$', '2759.31', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 14:21:05', '2026-09-09 14:21:05'),
(496, NULL, 'App\\Models\\BusinessTransaction', 102, 'business', 'gold', '.175$', '0.01', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 14:22:23', '2026-09-09 14:22:23'),
(497, NULL, 'App\\Models\\GoldLog', 313, 'gold', 'sell', '.22$ paypal', '200000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 14:24:44', '2026-09-09 14:24:44'),
(498, NULL, 'App\\Models\\Transaction', 201, 'daily', 'expense', 'gamot', '582.85', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 18:02:15', '2026-09-09 18:02:15'),
(499, NULL, 'App\\Models\\Transaction', 202, 'daily', 'expense', 'Bfast lugaw champorado', '75.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 18:02:46', '2026-09-09 18:02:46'),
(500, NULL, 'App\\Models\\Transaction', 203, 'daily', 'expense', 'bfast', '43.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 18:04:04', '2026-09-09 18:04:04'),
(501, NULL, 'App\\Models\\GoldLog', 314, 'gold', 'fee', 'gold mm fee', '2000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 18:27:52', '2026-09-09 18:27:52'),
(502, NULL, 'App\\Models\\GoldLog', 315, 'gold', 'sell', '.22$ paypal', '840000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 21:42:25', '2026-09-09 21:42:25'),
(503, NULL, 'App\\Models\\BusinessTransaction', 102, 'business', 'archived', '.175$', '1704.69', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 21:43:33', '2026-09-09 21:43:33'),
(504, NULL, 'App\\Models\\BusinessTransaction', 103, 'business', 'gold', '.22$ paypal', '0.01', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 21:44:33', '2026-09-09 21:44:33'),
(505, NULL, 'App\\Models\\BusinessTransaction', 103, 'business', 'archived', '.22$ paypal', '709.90', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 21:45:31', '2026-09-09 21:45:31'),
(506, NULL, 'App\\Models\\Trade', 100, 'trade', 'kks', '9/17 800 + acc x acc', '800000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 21:47:27', '2026-09-09 21:47:27'),
(507, NULL, 'App\\Models\\GoldLog', 316, 'gold', 'fee', '9/17 800 + acc x acc', '2000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-09 21:47:28', '2026-09-09 21:47:28'),
(508, NULL, 'App\\Models\\Trade', 94, 'trade', 'archived', '9/10 3300', '3300000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-10 13:56:10', '2026-09-10 13:56:10'),
(509, NULL, 'App\\Models\\GoldLog', 317, 'gold', 'add', 'First Payment for Leblanc 637 Dist', '500000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-10 17:06:31', '2026-09-10 17:06:31'),
(510, NULL, 'App\\Models\\BalanceEntry', 43, 'balance', 'sell', NULL, '44.55', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-10 18:59:47', '2026-09-10 18:59:47'),
(511, NULL, 'App\\Models\\BalanceEntry', 44, 'balance', 'add', NULL, '0.05', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-10 18:59:53', '2026-09-10 18:59:53'),
(512, NULL, 'App\\Models\\BalanceEntry', 45, 'balance', 'sell', NULL, '100842.23', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-10 19:00:07', '2026-09-10 19:00:07'),
(513, NULL, 'App\\Models\\BalanceEntry', 46, 'balance', 'add', NULL, '150000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-10 19:00:45', '2026-09-10 19:00:45'),
(514, NULL, 'App\\Models\\BalanceEntry', 47, 'balance', 'sell', NULL, '6496.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-10 19:01:20', '2026-09-10 19:01:20'),
(515, NULL, 'App\\Models\\Trade', 101, 'trade', 'kks', '9/18', '55000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-10 19:12:32', '2026-09-10 19:12:32'),
(516, NULL, 'App\\Models\\GoldLog', 318, 'gold', 'fee', '9/18', '1000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-10 19:12:32', '2026-09-10 19:12:32'),
(517, NULL, 'App\\Models\\GoldLog', 319, 'gold', 'sell', '.21$ paypal', '87000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-10 19:13:30', '2026-09-10 19:13:30'),
(518, NULL, 'App\\Models\\GoldLog', 320, 'gold', 'sell', '-2kk to 510 dist', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-10 19:50:42', '2026-09-10 19:50:42'),
(519, NULL, 'App\\Models\\Trade', 95, 'trade', 'archived', '9/10 395', '395000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-10 22:28:11', '2026-09-10 22:28:11'),
(520, NULL, 'App\\Models\\Transaction', 204, 'daily', 'expense', 'dinner', '320.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-11 07:45:27', '2026-09-11 07:45:27'),
(521, NULL, 'App\\Models\\GoldLog', 321, 'gold', 'add', '9/100 gcash', '206000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-11 16:23:02', '2026-09-11 16:23:02'),
(522, NULL, 'App\\Models\\GoldLog', 322, 'gold', 'add', '9/100 gcash', '351000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-11 19:35:18', '2026-09-11 19:35:18'),
(523, NULL, 'App\\Models\\Trade', 102, 'trade', 'kks', '9/19 75', '75000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-12 00:55:30', '2026-09-12 00:55:30'),
(524, NULL, 'App\\Models\\GoldLog', 323, 'gold', 'fee', '9/19 75', '1000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-12 00:55:30', '2026-09-12 00:55:30'),
(525, NULL, 'App\\Models\\Transaction', 205, 'daily', 'expense', 'Branch', '220.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-12 00:56:36', '2026-09-12 00:56:36'),
(526, NULL, 'App\\Models\\Transaction', 206, 'daily', 'expense', 'gamot', '202.50', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-12 00:56:56', '2026-09-12 00:56:56'),
(527, NULL, 'App\\Models\\Transaction', 207, 'daily', 'expense', 'kape 7/11', '93.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1', '2026-09-12 00:57:09', '2026-09-12 00:57:09'),
(528, NULL, 'App\\Models\\GoldLog', 324, 'gold', 'add', '9/100 gcash', '18000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-12 20:05:03', '2026-09-12 20:05:03'),
(529, NULL, 'App\\Models\\GoldLog', 325, 'gold', 'add', '9/100', '9300000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-12 21:35:22', '2026-09-12 21:35:22'),
(530, NULL, 'App\\Models\\Transaction', 208, 'daily', 'expense', 'Motor PMS', '1800.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-13 16:54:55', '2026-09-13 16:54:55'),
(531, NULL, 'App\\Models\\Transaction', 209, 'daily', 'expense', 'gibo', '500.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-13 16:57:59', '2026-09-13 16:57:59'),
(532, NULL, 'App\\Models\\Transaction', 210, 'daily', 'expense', 'dinner', '454.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-13 17:00:36', '2026-09-13 17:00:36'),
(533, NULL, 'App\\Models\\GoldLog', 326, 'gold', 'add', '9/100', '90000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-13 17:16:42', '2026-09-13 17:16:42'),
(534, NULL, 'App\\Models\\GoldLog', 327, 'gold', 'add', 'cleaning acc', '659219.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-13 17:17:40', '2026-09-13 17:17:40'),
(535, NULL, 'App\\Models\\GoldLog', 328, 'gold', 'add', 'cleaning acc', '153573.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-13 17:20:30', '2026-09-13 17:20:30'),
(536, NULL, 'App\\Models\\GoldLog', 329, 'gold', 'add', 'cleaning acc', '25194.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-13 17:23:14', '2026-09-13 17:23:14'),
(537, NULL, 'App\\Models\\GoldLog', 330, 'gold', 'add', 'cleaning acc', '51000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-13 17:25:54', '2026-09-13 17:25:54'),
(538, NULL, 'App\\Models\\GoldLog', 331, 'gold', 'add', 'cleaning acc', '78409.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-13 17:28:24', '2026-09-13 17:28:24'),
(539, NULL, 'App\\Models\\BusinessTransaction', 104, 'business', 'account', 'Leblanc 510 Dist', '2474.70', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-13 22:08:03', '2026-09-13 22:08:03'),
(540, NULL, 'App\\Models\\GoldLog', 332, 'gold', 'add', 'Sold: Leblanc 510 Dist', '250000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-13 22:08:56', '2026-09-13 22:08:56'),
(541, NULL, 'App\\Models\\GoldLog', 333, 'gold', 'sell', '.23$ paypal', '250000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-13 22:14:13', '2026-09-13 22:14:13'),
(542, NULL, 'App\\Models\\Transaction', 211, 'daily', 'income', NULL, '8675.82', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-13 23:29:44', '2026-09-13 23:29:44'),
(543, NULL, 'App\\Models\\GoldLog', 334, 'gold', 'fee', 'gold mm fee', '1000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-14 00:34:13', '2026-09-14 00:34:13'),
(544, NULL, 'App\\Models\\Trade', 96, 'trade', 'archived', '9/11 133', '133000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-14 01:22:07', '2026-09-14 01:22:07'),
(545, NULL, 'App\\Models\\Trade', 97, 'trade', 'archived', '9/14 155', '155000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-14 04:56:27', '2026-09-14 04:56:27'),
(546, NULL, 'App\\Models\\GoldLog', 335, 'gold', 'add', '.175$ binance', '72000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-14 17:18:39', '2026-09-14 17:18:39'),
(547, NULL, 'App\\Models\\Transaction', 212, 'daily', 'expense', 'baby', '3000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-14 17:31:57', '2026-09-14 17:31:57'),
(548, NULL, 'App\\Models\\GoldLog', 336, 'gold', 'add', '.17$', '1253700000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-14 17:40:56', '2026-09-14 17:40:56');
INSERT INTO `activity_logs` (`id`, `user_id`, `loggable_type`, `loggable_id`, `module`, `type`, `description`, `amount`, `ip_address`, `user_agent`, `created_at`, `updated_at`) VALUES
(549, NULL, 'App\\Models\\GoldLog', 337, 'gold', 'sell', NULL, '1253700000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-14 17:41:48', '2026-09-14 17:41:48'),
(550, NULL, 'App\\Models\\BusinessTransaction', 105, 'business', 'gold', '.17$', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-14 17:42:19', '2026-09-14 17:42:19'),
(551, NULL, 'App\\Models\\BusinessTransaction', 106, 'business', 'gold', '.175$', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-14 17:44:04', '2026-09-14 17:44:04'),
(552, NULL, 'App\\Models\\BusinessTransaction', 106, 'business', 'archived', '.175$', '2039.86', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-14 17:45:22', '2026-09-14 17:45:22'),
(553, NULL, 'App\\Models\\BusinessTransaction', 105, 'business', 'archived', '.17$', '3807.48', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-14 17:45:25', '2026-09-14 17:45:25'),
(554, NULL, 'App\\Models\\GoldLog', 338, 'gold', 'add', 'mm fee', '1000000.00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-14 19:25:02', '2026-09-14 19:25:02'),
(555, NULL, 'App\\Models\\BusinessTransaction', 107, 'business', 'gold', 'Test Data', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-14 21:25:07', '2026-09-14 21:25:07'),
(556, NULL, 'App\\Models\\Trade', 98, 'trade', 'archived', '9/15 930', '930000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-14 21:54:42', '2026-09-14 21:54:42'),
(557, NULL, 'App\\Models\\Transaction', 213, 'daily', 'expense', 'meryenda at pa cash', '175.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-15 00:13:47', '2026-09-15 00:13:47'),
(558, NULL, 'App\\Models\\GoldLog', 339, 'gold', 'add', '9/100 (new)', '9000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-15 00:19:29', '2026-09-15 00:19:29'),
(559, NULL, 'App\\Models\\GoldLog', 340, 'gold', 'add', '9/100 gcash', '720000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-15 07:48:24', '2026-09-15 07:48:24'),
(560, NULL, 'App\\Models\\GoldLog', 341, 'gold', 'add', 'Sold: Leblanc 624 Melee', '2150000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-15 16:46:14', '2026-09-15 16:46:14'),
(561, NULL, 'App\\Models\\Transaction', 214, 'daily', 'expense', 'dinner date taco', '697.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-15 17:26:05', '2026-09-15 17:26:05'),
(562, NULL, 'App\\Models\\Transaction', 215, 'daily', 'expense', 'dunkin / dinner', '275.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-15 17:26:31', '2026-09-15 17:26:31'),
(563, NULL, 'App\\Models\\Transaction', 216, 'daily', 'expense', 'gas', '641.27', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-15 17:27:14', '2026-09-15 17:27:14'),
(564, NULL, 'App\\Models\\Transaction', 217, 'daily', 'expense', 'baby', '100.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-15 18:10:52', '2026-09-15 18:10:52'),
(565, NULL, 'App\\Models\\Transaction', 218, 'daily', 'expense', 'papa', '500.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-15 19:06:55', '2026-09-15 19:06:55'),
(566, NULL, 'App\\Models\\Trade', 99, 'trade', 'archived', '9/16 228', '228000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-15 21:38:04', '2026-09-15 21:38:04'),
(567, NULL, 'App\\Models\\Trade', 103, 'trade', 'kks', '9/23 159', '159000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-15 22:41:58', '2026-09-15 22:41:58'),
(568, NULL, 'App\\Models\\GoldLog', 342, 'gold', 'fee', '9/23 159', '2000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-15 22:41:58', '2026-09-15 22:41:58'),
(569, NULL, 'App\\Models\\Transaction', 219, 'daily', 'expense', 'iced coffee', '39.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-16 04:27:58', '2026-09-16 04:27:58'),
(570, NULL, 'App\\Models\\GoldLog', 343, 'gold', 'fee', 'gold mm fee', '2000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-16 19:23:27', '2026-09-16 19:23:27'),
(571, NULL, 'App\\Models\\Trade', 104, 'trade', 'kks', '9/24 600', '600000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-16 22:34:24', '2026-09-16 22:34:24'),
(572, NULL, 'App\\Models\\GoldLog', 344, 'gold', 'fee', '9/24 600', '2000000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-16 22:34:24', '2026-09-16 22:34:24'),
(573, NULL, 'App\\Models\\Trade', 105, 'trade', 'kks', '9/24 123', '123000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-17 00:02:00', '2026-09-17 00:02:00'),
(574, NULL, 'App\\Models\\GoldLog', 345, 'gold', 'fee', '9/24 123', '2000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-17 00:02:01', '2026-09-17 00:02:01'),
(575, NULL, 'App\\Models\\Trade', 101, 'trade', 'archived', '9/18 55', '55000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-17 01:00:44', '2026-09-17 01:00:44'),
(576, NULL, 'App\\Models\\Transaction', 220, 'daily', 'expense', 'milk tea', '29.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-17 04:06:01', '2026-09-17 04:06:01'),
(577, NULL, 'App\\Models\\Transaction', 221, 'daily', 'expense', 'Smart C', '30.00', '100.113.155.28', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-17 04:15:05', '2026-09-17 04:15:05'),
(578, NULL, 'App\\Models\\Transaction', 222, 'daily', 'expense', 'Siomai', '50.00', '100.113.155.28', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-17 04:15:36', '2026-09-17 04:15:36'),
(579, NULL, 'App\\Models\\Transaction', 223, 'daily', 'income', 'Salary', '1350.00', '100.113.155.28', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-17 04:16:59', '2026-09-17 04:16:59'),
(580, NULL, 'App\\Models\\Transaction', 224, 'daily', 'income', 'Sukli sa 10k', '2000.00', '100.113.155.28', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-17 04:17:58', '2026-09-17 04:17:58'),
(581, NULL, 'App\\Models\\Transaction', 225, 'daily', 'expense', 'dinner', '282.00', '100.113.155.28', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-17 04:19:26', '2026-09-17 04:19:26'),
(582, NULL, 'App\\Models\\Transaction', 226, 'daily', 'expense', 'Bacon', '190.00', '100.113.155.28', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-17 04:20:13', '2026-09-17 04:20:13'),
(583, NULL, 'App\\Models\\Transaction', 227, 'daily', 'expense', 'baon ni Edward', '74.75', '100.113.155.28', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-17 04:22:19', '2026-09-17 04:22:19'),
(584, NULL, 'App\\Models\\Transaction', 228, 'daily', 'expense', 'baby', '1000.00', '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-17 07:11:09', '2026-09-17 07:11:09'),
(585, NULL, 'App\\Models\\Transaction', 229, 'daily', 'expense', 'transpo to Mercury and regular', '86.00', '100.113.155.28', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-17 15:43:00', '2026-09-17 15:43:00'),
(586, NULL, 'App\\Models\\Transaction', 230, 'daily', 'expense', 'Powdered Milk for Devotion', '129.00', '100.113.155.28', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-17 15:48:07', '2026-09-17 15:48:07'),
(587, NULL, 'App\\Models\\Transaction', 231, 'daily', 'expense', 'baon ni Edward', '50.00', '100.113.155.28', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-17 15:48:57', '2026-09-17 15:48:57'),
(588, NULL, 'App\\Models\\Transaction', 232, 'daily', 'expense', 'JDF', '200.00', '100.113.155.28', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.8010.24 Mobile/15E148 Safari/604.1', '2026-09-17 15:51:39', '2026-09-17 15:51:39'),
(589, NULL, 'App\\Models\\Trade', 106, 'trade', 'kks', '9/24 385', '385000000.00', '100.81.22.116', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-17 18:04:34', '2026-09-17 18:04:34'),
(590, NULL, 'App\\Models\\GoldLog', 346, 'gold', 'fee', '9/24 385', '2000000.00', '100.81.22.116', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-17 18:04:34', '2026-09-17 18:04:34'),
(591, NULL, 'App\\Models\\Trade', 107, 'trade', 'kks', '141 (not yet confirmed)', '141000000.00', '100.81.22.116', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-17 18:05:18', '2026-09-17 18:05:18'),
(592, NULL, 'App\\Models\\Trade', 108, 'trade', 'kks', 'not yet confirmed 127', '127000000.00', '100.81.22.116', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-17 18:06:01', '2026-09-17 18:06:01'),
(593, NULL, 'App\\Models\\GoldLog', 347, 'gold', 'sell', '.22$ paypal', '500000000.00', '100.81.22.116', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-17 18:10:17', '2026-09-17 18:10:17'),
(594, NULL, 'App\\Models\\BusinessTransaction', 108, 'business', 'gold', '.22$', '0.01', '100.81.22.116', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-17 18:11:33', '2026-09-17 18:11:33'),
(595, NULL, 'App\\Models\\BusinessTransaction', 108, 'business', 'archived', '.22$', '1218.63', '100.81.22.116', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-17 18:17:43', '2026-09-17 18:17:43'),
(596, NULL, 'App\\Models\\BusinessTransaction', 109, 'business', 'gold', 'First payment of Leblanc 637 Dist', '0.01', '100.81.22.116', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-17 18:45:24', '2026-09-17 18:45:24'),
(597, NULL, 'App\\Models\\BusinessTransaction', 109, 'business', 'archived', 'First payment of Leblanc 637 Dist', '2023.05', '100.81.22.116', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-17 18:48:24', '2026-09-17 18:48:24'),
(598, NULL, 'App\\Models\\GoldLog', 348, 'gold', 'add', '9/100 gcash', '9000000.00', '100.81.22.116', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-17 18:51:59', '2026-09-17 18:51:59'),
(599, NULL, 'App\\Models\\BusinessTransaction', 110, 'business', 'gold', '9/100 gcash', '0.01', '100.81.22.116', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-17 18:52:17', '2026-09-17 18:52:17'),
(600, NULL, 'App\\Models\\BusinessTransaction', 111, 'business', 'gold', NULL, '0.01', '100.81.22.116', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-17 21:55:35', '2026-09-17 21:55:35'),
(601, NULL, 'App\\Models\\GoldLog', 349, 'gold', 'add', '.17$ binance (62.73 peso)', '732000000.00', '100.81.22.116', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-17 21:59:42', '2026-09-17 21:59:42'),
(602, NULL, 'App\\Models\\GoldLog', 350, 'gold', 'add', 'Sold: Leblanc 510 Dist', '250000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-18 00:23:28', '2026-09-18 00:23:28'),
(603, NULL, 'App\\Models\\GoldLog', 351, 'gold', 'sell', '.23$ paypal', '200000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-18 00:39:35', '2026-09-18 00:39:35'),
(604, NULL, 'App\\Models\\GoldLog', 352, 'gold', 'sell', 'Cash', '250000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-18 00:39:57', '2026-09-18 00:39:57'),
(605, NULL, 'App\\Models\\GoldLog', 353, 'gold', 'add', 'cash back', '250000000.00', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-18 00:42:16', '2026-09-18 00:42:16'),
(606, NULL, 'App\\Models\\BusinessTransaction', 112, 'business', 'gold', '.17$', '0.01', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-18 00:43:06', '2026-09-18 00:43:06'),
(607, NULL, 'App\\Models\\BusinessTransaction', 112, 'business', 'archived', '.17$', '659.62', '100.108.33.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-18 00:45:26', '2026-09-18 00:45:26'),
(608, 1, 'App\\Models\\GoldLog', 355, 'gold', 'add', '.17$ binance (62.66 peso)', '177000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-18 15:25:45', '2026-09-18 15:25:45'),
(609, 1, 'App\\Models\\GoldLog', 356, 'gold', 'sell', 'doble', '177000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-18 15:26:19', '2026-09-18 15:26:19'),
(610, 1, 'App\\Models\\Trade', 109, 'trade', 'kks', '9/26 3700', '3700000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-18 15:53:40', '2026-09-18 15:53:40'),
(611, 1, 'App\\Models\\GoldLog', 357, 'gold', 'fee', '9/26 3700', '2000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-18 15:53:40', '2026-09-18 15:53:40'),
(612, 1, 'App\\Models\\GoldLog', 358, 'gold', 'add', '9/26 3700', '1000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-18 15:53:54', '2026-09-18 15:53:54'),
(613, 1, 'App\\Models\\GoldLog', 359, 'gold', 'sell', 'bug', '1000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-18 15:54:06', '2026-09-18 15:54:06'),
(614, 1, 'App\\Models\\GoldLog', 360, 'gold', 'fee', '9/26 3700', '1000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-18 15:54:24', '2026-09-18 15:54:24'),
(615, 1, 'App\\Models\\BusinessTransaction', 113, 'business', 'account', 'Leblanc 609 Dist', '15840.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-18 17:14:49', '2026-09-18 17:14:49'),
(616, 1, 'App\\Models\\Trade', 110, 'trade', 'kks', '9/26', '2500000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-19 07:33:12', '2026-09-19 07:33:12'),
(617, 1, 'App\\Models\\GoldLog', 361, 'gold', 'fee', '9/26', '2000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-19 07:33:12', '2026-09-19 07:33:12'),
(618, 1, 'App\\Models\\Trade', 100, 'trade', 'archived', '9/17 900', '900000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-19 18:25:53', '2026-09-19 18:25:53'),
(619, 1, 'App\\Models\\Trade', 102, 'trade', 'archived', '9/19 75', '75000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-19 18:26:01', '2026-09-19 18:26:01'),
(620, 1, 'App\\Models\\Trade', 100, 'trade', 'archived', '9/17 810', '810000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-19 18:27:47', '2026-09-19 18:27:47'),
(621, 1, 'App\\Models\\GoldLog', 362, 'gold', 'add', '9/100 gcash', '90000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-19 18:28:09', '2026-09-19 18:28:09'),
(622, 1, 'App\\Models\\Trade', 111, 'trade', 'kks', '9/27 518', '518000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-19 18:29:21', '2026-09-19 18:29:21'),
(623, 1, 'App\\Models\\GoldLog', 363, 'gold', 'fee', '9/27 518', '2000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-19 18:29:21', '2026-09-19 18:29:21'),
(624, 1, 'App\\Models\\BusinessTransaction', 114, 'business', 'gold', '.17$ binance (62.98)', '0.01', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-19 18:45:14', '2026-09-19 18:45:14'),
(625, 1, 'App\\Models\\Transaction', 233, 'daily', 'expense', 'dokito burger', '86.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-19 18:49:47', '2026-09-19 18:49:47'),
(626, 1, 'App\\Models\\Trade', 108, 'trade', 'archived', 'not yet confirmed 127', '127000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-19 19:41:00', '2026-09-19 19:41:00'),
(627, 1, 'App\\Models\\GoldLog', 364, 'gold', 'add', '.17$ binance (62.98 peso)', '80000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-19 19:42:29', '2026-09-19 19:42:29'),
(628, 1, 'App\\Models\\GoldLog', 365, 'gold', 'fee', 'mm fee 127', '2000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-19 19:42:52', '2026-09-19 19:42:52'),
(629, 1, 'App\\Models\\Trade', 112, 'trade', 'kks', '9/27 45', '45000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-19 20:47:09', '2026-09-19 20:47:09'),
(630, 1, 'App\\Models\\GoldLog', 366, 'gold', 'fee', '9/27 45', '1000000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-19 20:47:09', '2026-09-19 20:47:09'),
(631, 1, 'App\\Models\\GoldLog', 367, 'gold', 'add', '9.5/100 gcash', '85500000.00', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-20 03:04:43', '2026-09-20 03:04:43'),
(632, 1, 'App\\Models\\BusinessTransaction', 115, 'business', 'gold', '9.5/100 gcash', '0.01', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '2026-09-20 03:05:19', '2026-09-20 03:05:19');

-- --------------------------------------------------------

--
-- Table structure for table `balance_entries`
--

CREATE TABLE `balance_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `account` enum('PAYPAL','BINANCE','MEXC','MARIBANK','MAYA','BANKO') NOT NULL,
  `type` enum('add','sell') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `balance_entries`
--

INSERT INTO `balance_entries` (`id`, `account`, `type`, `amount`, `description`, `date`, `created_at`, `updated_at`) VALUES
(1, 'PAYPAL', 'add', 70.00, '318kk (.22$ paypal)', '2026-07-21', '2026-07-22 00:37:18', '2026-07-22 00:37:18'),
(2, 'BINANCE', 'add', 680.00, 'Sold 3.4kkk (.2$)', '2026-07-22', '2026-07-22 00:38:15', '2026-07-22 00:38:15'),
(3, 'BINANCE', 'sell', 51.00, 'Bought gold 300kk for (.17$)', '2026-07-29', '2026-07-28 18:41:06', '2026-07-28 18:41:06'),
(4, 'BINANCE', 'sell', 5.00, '30kk (.16 rate)', '2026-07-29', '2026-07-28 23:17:36', '2026-07-28 23:17:36'),
(5, 'BINANCE', 'sell', 425.00, 'Bought gold .17 rate', '2026-07-30', '2026-07-29 17:25:39', '2026-07-29 17:25:39'),
(6, 'BINANCE', 'sell', 54.23, 'Buy gold .17', '2026-07-31', '2026-07-30 18:14:04', '2026-07-30 18:14:26'),
(7, 'BINANCE', 'add', 0.38, NULL, '2026-07-31', '2026-07-30 18:15:16', '2026-07-30 18:15:24'),
(8, 'BINANCE', 'sell', 118.49, NULL, '2026-07-31', '2026-07-30 19:34:31', '2026-07-30 19:34:31'),
(9, 'PAYPAL', 'sell', 70.00, 'Cashout', '2026-08-04', '2026-08-03 18:45:29', '2026-08-03 18:45:29'),
(10, 'BINANCE', 'add', 54.03, NULL, '2026-08-05', '2026-08-04 19:15:40', '2026-08-04 19:15:40'),
(11, 'BINANCE', 'sell', 49.50, '.165$ binance 300kk', '2026-08-06', '2026-08-05 18:39:29', '2026-08-05 18:39:29'),
(12, 'BINANCE', 'add', 12.40, 'Pantay', '2026-08-12', '2026-08-11 18:46:06', '2026-08-11 18:46:06'),
(13, 'BINANCE', 'add', 208.83, NULL, '2026-08-20', '2026-08-19 17:38:29', '2026-08-19 17:38:29'),
(14, 'BINANCE', 'sell', 167.75, NULL, '2026-08-24', '2026-08-23 21:10:36', '2026-08-23 21:10:36'),
(15, 'PAYPAL', 'add', 55.00, NULL, '2026-08-24', '2026-08-23 21:10:42', '2026-08-23 21:10:42'),
(16, 'MEXC', 'add', 1600.00, NULL, '2026-08-24', '2026-08-23 22:11:37', '2026-08-23 22:11:37'),
(17, 'BANKO', 'add', 50000.00, NULL, '2026-08-24', '2026-08-23 22:11:49', '2026-08-23 22:11:49'),
(18, 'MAYA', 'add', 100552.87, NULL, '2026-08-24', '2026-08-23 22:12:12', '2026-08-23 22:12:12'),
(19, 'MARIBANK', 'add', 47496.41, NULL, '2026-08-24', '2026-08-23 22:12:29', '2026-08-23 22:12:29'),
(20, 'BINANCE', 'add', 48.40, NULL, '2026-08-24', '2026-08-23 22:13:11', '2026-08-23 22:13:11'),
(21, 'BINANCE', 'add', 0.47, NULL, '2026-08-24', '2026-08-23 22:13:19', '2026-08-23 22:13:19'),
(22, 'MEXC', 'add', 100.00, NULL, '2026-08-25', '2026-08-24 21:31:22', '2026-08-24 21:31:22'),
(23, 'MEXC', 'sell', 100.00, NULL, '2026-08-25', '2026-08-24 22:28:43', '2026-08-24 22:28:43'),
(24, 'MEXC', 'add', 100.00, NULL, '2026-08-25', '2026-08-24 22:28:50', '2026-08-24 22:28:50'),
(25, 'MAYA', 'add', 98.76, NULL, '2026-08-27', '2026-08-26 17:42:05', '2026-08-26 17:42:05'),
(26, 'MARIBANK', 'add', 10.14, NULL, '2026-08-27', '2026-08-26 17:42:50', '2026-08-26 17:42:50'),
(27, 'PAYPAL', 'add', 10.47, NULL, '2026-08-27', '2026-08-26 17:44:07', '2026-08-26 17:44:07'),
(28, 'MARIBANK', 'sell', 1000.00, 'baby', '2026-08-27', '2026-08-26 18:00:42', '2026-08-26 18:00:42'),
(29, 'MAYA', 'add', 190.60, NULL, '2026-09-01', '2026-08-31 18:50:22', '2026-08-31 18:50:22'),
(30, 'BINANCE', 'add', 53.89, NULL, '2026-09-01', '2026-08-31 18:50:57', '2026-08-31 18:50:57'),
(31, 'BINANCE', 'sell', 53.89, NULL, '2026-09-01', '2026-08-31 18:51:06', '2026-08-31 18:51:06'),
(32, 'BINANCE', 'sell', 53.89, NULL, '2026-09-01', '2026-08-31 18:51:13', '2026-08-31 18:51:13'),
(33, 'PAYPAL', 'sell', 65.47, NULL, '2026-09-01', '2026-08-31 18:51:26', '2026-08-31 18:51:26'),
(34, 'MARIBANK', 'add', 20316.19, NULL, '2026-09-01', '2026-08-31 18:52:51', '2026-08-31 18:52:51'),
(35, 'MARIBANK', 'add', 8221.90, NULL, '2026-09-01', '2026-08-31 19:32:41', '2026-08-31 19:32:41'),
(36, 'MARIBANK', 'sell', 43222.52, NULL, '2026-09-02', '2026-09-01 19:53:17', '2026-09-01 19:53:17'),
(37, 'MARIBANK', 'add', 46670.76, NULL, '2026-09-04', '2026-09-04 00:09:33', '2026-09-04 00:09:33'),
(38, 'MARIBANK', 'sell', 2250.00, NULL, '2026-09-04', '2026-09-04 00:12:52', '2026-09-04 00:12:52'),
(39, 'BANKO', 'add', 138.89, NULL, '2026-09-04', '2026-09-04 00:15:08', '2026-09-04 00:15:08'),
(40, 'BINANCE', 'add', 35.15, NULL, '2026-09-04', '2026-09-04 00:15:35', '2026-09-04 00:15:35'),
(41, 'BINANCE', 'sell', 35.15, NULL, '2026-09-04', '2026-09-04 00:15:45', '2026-09-04 00:15:45'),
(42, 'BINANCE', 'sell', 35.15, NULL, '2026-09-04', '2026-09-04 00:15:47', '2026-09-04 00:15:47'),
(43, 'BINANCE', 'sell', 44.55, NULL, '2026-09-11', '2026-09-10 18:59:47', '2026-09-10 18:59:47'),
(44, 'BINANCE', 'add', 0.05, NULL, '2026-09-11', '2026-09-10 18:59:53', '2026-09-10 18:59:53'),
(45, 'MAYA', 'sell', 100842.23, NULL, '2026-09-11', '2026-09-10 19:00:07', '2026-09-10 19:00:07'),
(46, 'BANKO', 'add', 150000.00, NULL, '2026-09-11', '2026-09-10 19:00:45', '2026-09-10 19:00:45'),
(47, 'MARIBANK', 'sell', 6496.00, NULL, '2026-09-11', '2026-09-10 19:01:20', '2026-09-10 19:01:20');

-- --------------------------------------------------------

--
-- Table structure for table `budgets`
--

CREATE TABLE `budgets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `category_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `month` tinyint(3) UNSIGNED NOT NULL,
  `year` smallint(5) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `budgets`
--

INSERT INTO `budgets` (`id`, `user_id`, `category_id`, `amount`, `month`, `year`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 2500.00, 7, 2026, '2026-06-30 22:22:35', '2026-07-05 18:49:56'),
(2, 1, 1, 5000.00, 7, 2026, '2026-07-01 18:42:37', '2026-07-02 01:33:56'),
(3, 1, 6, 1000.00, 7, 2026, '2026-07-02 01:33:37', '2026-07-02 01:33:37'),
(4, 1, 7, 2500.00, 7, 2026, '2026-07-02 01:33:45', '2026-07-05 18:49:22'),
(21, 1, 1, 8000.00, 8, 2026, '2026-08-03 21:09:50', '2026-08-05 21:32:24'),
(22, 1, 2, 3000.00, 8, 2026, '2026-08-03 21:10:00', '2026-08-03 21:10:00'),
(23, 1, 6, 2000.00, 8, 2026, '2026-08-03 21:10:10', '2026-08-23 18:05:37'),
(24, 1, 7, 9000.00, 8, 2026, '2026-08-03 21:13:30', '2026-08-05 21:32:37'),
(25, 1, 20, 10000.00, 8, 2026, '2026-08-23 18:05:20', '2026-08-23 18:05:20'),
(26, 3, 22, 10000.00, 8, 2026, '2026-08-28 20:40:36', '2026-08-28 20:40:36'),
(27, 1, 6, 2000.00, 9, 2026, '2026-08-31 17:31:18', '2026-08-31 17:31:18'),
(28, 1, 20, 5000.00, 9, 2026, '2026-08-31 17:31:29', '2026-08-31 17:31:29'),
(29, 1, 1, 10000.00, 9, 2026, '2026-08-31 17:31:37', '2026-08-31 17:31:37'),
(30, 1, 2, 2000.00, 9, 2026, '2026-08-31 17:32:30', '2026-08-31 17:32:30'),
(31, 1, 7, 5000.00, 9, 2026, '2026-08-31 17:32:47', '2026-08-31 17:32:47');

-- --------------------------------------------------------

--
-- Table structure for table `business_budgets`
--

CREATE TABLE `business_budgets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `category_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `month` tinyint(3) UNSIGNED NOT NULL,
  `year` smallint(5) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `business_categories`
--

CREATE TABLE `business_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('account','gold','expense') NOT NULL,
  `color` varchar(7) NOT NULL DEFAULT '#6366f1',
  `icon` varchar(255) NOT NULL DEFAULT 'tag',
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
  `id` bigint(20) UNSIGNED NOT NULL,
  `account_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type` enum('account','gold','expense') NOT NULL,
  `action` enum('buy','sell') DEFAULT NULL,
  `price_rate` decimal(20,6) DEFAULT NULL,
  `cost_rate` decimal(20,6) DEFAULT NULL,
  `price_gold` decimal(20,0) DEFAULT NULL,
  `cost_gold` decimal(20,0) DEFAULT NULL,
  `php_rate` decimal(10,4) DEFAULT NULL,
  `cost_php_rate` decimal(10,4) DEFAULT NULL,
  `price_php` decimal(15,2) DEFAULT NULL,
  `cost_php` decimal(15,2) DEFAULT NULL,
  `profit_php` decimal(15,2) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `business_transactions`
--

INSERT INTO `business_transactions` (`id`, `account_id`, `type`, `action`, `price_rate`, `cost_rate`, `price_gold`, `cost_gold`, `php_rate`, `cost_php_rate`, `price_php`, `cost_php`, `profit_php`, `amount`, `description`, `date`, `notes`, `archived_at`, `created_at`, `updated_at`) VALUES
(18, 8, 'account', NULL, 0.200000, 0.170000, NULL, NULL, 61.0000, NULL, 12200.00, 7777.50, 4422.50, 4422.50, 'Leblanc 600 Melee', '2026-07-03', NULL, '2026-08-03 17:27:50', '2026-07-03 01:07:42', '2026-08-03 17:27:50'),
(19, 7, 'account', NULL, 0.200000, 0.170000, NULL, NULL, 60.6000, NULL, 26058.00, 19380.00, 6678.00, 6678.00, 'Leblanc 624 Melee', '2026-07-03', NULL, '2026-09-15 16:46:14', '2026-07-03 01:09:20', '2026-09-15 16:46:14'),
(20, 6, 'account', NULL, 0.239000, 0.216800, NULL, NULL, 61.5000, NULL, 22047.75, 19999.80, 2047.95, 2047.95, 'Leblanc 618 Dist', '2026-07-03', NULL, '2026-07-09 17:08:42', '2026-07-03 01:09:45', '2026-07-09 17:08:42'),
(21, 4, 'account', NULL, 0.200000, 0.170000, NULL, NULL, 61.5000, NULL, 30750.00, 19864.50, 10885.50, 10885.50, 'Leblanc 632 Dist', '2026-07-03', NULL, '2026-08-24 22:39:18', '2026-07-03 01:10:04', '2026-08-24 22:39:18'),
(22, 3, 'account', NULL, 0.200000, 0.170000, NULL, NULL, 60.0000, NULL, 40800.00, 24480.00, 16320.00, 16320.00, 'Leblanc 648 Dist', '2026-07-03', NULL, NULL, '2026-07-03 01:11:34', '2026-08-19 00:45:45'),
(23, 2, 'account', NULL, 0.220000, 0.170000, NULL, NULL, 61.4500, NULL, 78410.20, 52232.50, 26177.70, 26177.70, 'Leblanc 702 Melee', '2026-07-03', NULL, '2026-07-12 14:57:45', '2026-07-03 01:12:04', '2026-07-12 14:57:45'),
(25, 9, 'account', NULL, 0.200000, 0.160000, NULL, NULL, 61.6000, NULL, 23050.72, 18440.58, 4610.14, 4610.14, '1.5kkk (.16$ rate)', '2026-07-08', NULL, '2026-07-20 17:43:55', '2026-07-08 06:00:19', '2026-07-20 17:43:55'),
(26, 10, 'account', NULL, 0.220000, 0.170000, NULL, NULL, 61.5000, NULL, 8794.50, 0.00, 8794.50, 8794.50, 'Leblanc 560 Mage', '2026-07-10', NULL, '2026-07-27 17:43:59', '2026-07-09 18:11:33', '2026-07-27 17:43:59'),
(27, 11, 'account', NULL, 0.200000, 0.170000, NULL, NULL, 60.0000, NULL, 27600.00, 21420.00, 6180.00, 6180.00, 'Leblanc 642 Melee', '2026-07-12', NULL, '2026-08-28 21:42:26', '2026-07-11 23:16:20', '2026-08-28 21:42:26'),
(28, 13, 'account', NULL, 0.200000, 0.170000, NULL, NULL, 61.6000, NULL, 31650.08, 26902.57, 4747.51, 4747.51, '1.529kk (.17$ rate)', '2026-07-21', NULL, '2026-07-23 21:22:28', '2026-07-20 17:45:08', '2026-07-23 21:22:28'),
(29, 14, 'account', NULL, 0.220000, 0.170000, NULL, NULL, 59.8000, NULL, 4183.61, 3232.79, 950.82, 950.82, '318kk (.22$ paypal)', '2026-07-22', NULL, '2026-07-21 16:53:26', '2026-07-21 16:53:16', '2026-07-21 16:53:26'),
(30, 16, 'account', NULL, 0.250000, 0.170000, NULL, NULL, 59.4485, NULL, 14862.13, 6619.59, 8242.54, 8242.53, 'Leblanc 596 Magic', '2026-07-23', NULL, '2026-08-16 21:07:39', '2026-07-22 18:54:06', '2026-08-16 21:07:39'),
(31, 17, 'account', NULL, 0.200000, 0.170000, NULL, NULL, 60.0000, NULL, 28800.00, 19380.00, 9420.00, 9420.00, 'Leblanc 641 Magic', '2026-07-23', NULL, NULL, '2026-07-22 22:10:13', '2026-08-19 00:46:19'),
(32, 18, 'account', NULL, 0.200000, 0.170000, NULL, NULL, 61.5000, NULL, 14145.00, 10036.80, 4108.20, 4108.20, 'Leblanc 614 Melee', '2026-07-22', NULL, '2026-08-11 18:09:26', '2026-07-22 22:34:48', '2026-08-11 18:09:26'),
(33, 15, 'account', NULL, 0.200000, 0.180000, NULL, NULL, 61.0000, NULL, 1994.70, 0.00, 1994.70, 1994.70, 'MM Fee', '2026-07-28', NULL, '2026-08-03 17:29:16', '2026-07-27 17:17:32', '2026-08-03 17:29:16'),
(34, 19, 'account', NULL, 0.200000, 0.170000, NULL, NULL, 61.5000, NULL, 24600.00, 16728.00, 7872.00, 7872.00, 'Leblanc 632 Melee', '2026-07-29', NULL, '2026-08-24 22:34:20', '2026-07-28 17:30:26', '2026-08-24 22:34:20'),
(35, 20, 'gold', NULL, 0.213200, 0.170000, NULL, NULL, 60.9800, NULL, 12051.87, 9609.84, 2442.03, 2442.03, '927kk (.22$) Paypal', '2026-08-04', NULL, '2026-08-03 18:18:11', '2026-08-03 18:17:47', '2026-08-18 19:13:35'),
(36, 21, 'gold', NULL, 0.205900, 0.170000, NULL, NULL, 61.0000, NULL, 11291.35, 9322.63, 1968.72, 1968.72, '899kk (.2$)', '2026-08-04', NULL, '2026-08-03 18:26:59', '2026-08-03 18:26:43', '2026-08-18 19:13:33'),
(37, 22, 'account', NULL, 0.200000, 0.164000, NULL, NULL, 60.0000, NULL, 39600.00, 24600.00, 15000.00, 15000.00, 'Leblanc 641 Dist', '2026-08-04', NULL, NULL, '2026-08-03 18:52:34', '2026-08-19 00:46:01'),
(38, 23, 'gold', NULL, 0.220000, 0.170000, NULL, NULL, 58.9200, NULL, 5884.93, 4547.45, 1337.48, 1337.48, '454kk (.22$) paypal', '2026-08-06', NULL, '2026-08-11 18:23:26', '2026-08-05 17:05:26', '2026-08-18 19:13:25'),
(39, 24, 'account', NULL, 0.200000, 0.170000, NULL, NULL, 61.0000, NULL, 11730.61, 6222.00, 5508.61, 5508.61, 'Leblanc 582 Dist', '2026-08-07', NULL, '2026-08-28 17:46:31', '2026-08-06 17:50:06', '2026-08-28 17:46:31'),
(40, 25, 'gold', NULL, 0.209400, 0.170000, NULL, NULL, 60.0000, NULL, 25128.00, 20400.00, 4728.00, 4728.00, '2kkk gold .185 euro', '2026-08-12', NULL, '2026-08-11 18:20:09', '2026-08-11 18:19:51', '2026-08-18 19:13:18'),
(41, 26, 'gold', NULL, 0.210000, 0.170000, NULL, NULL, 59.2900, NULL, 24901.80, 20158.60, 4743.20, 4743.20, '2kkk gold .21$', '2026-08-14', NULL, '2026-08-13 19:27:34', '2026-08-13 19:27:24', '2026-08-18 19:13:17'),
(42, 27, 'gold', NULL, 0.220000, 0.170000, NULL, NULL, 60.0000, NULL, 2376.00, 1836.00, 540.00, 540.00, '180kk (.22$) paypal', '2026-08-15', NULL, '2026-08-14 20:57:51', '2026-08-14 20:57:42', '2026-08-18 19:11:14'),
(43, 28, 'gold', NULL, 0.200000, 0.170000, NULL, NULL, 61.0000, NULL, 5856.00, 4977.60, 878.40, 878.40, '480kk (.2$) binance', '2026-08-17', NULL, '2026-08-16 17:36:48', '2026-08-16 17:36:41', '2026-08-18 19:04:04'),
(44, 29, 'gold', NULL, 0.210000, 0.175000, NULL, NULL, 59.5000, NULL, 11245.50, 9371.25, 1874.25, 1874.25, '900kk (.175)', '2026-08-19', NULL, '2026-08-18 17:49:53', '2026-08-18 17:49:30', '2026-08-18 19:00:45'),
(45, 30, 'gold', NULL, 0.210000, 0.165000, NULL, NULL, 59.5000, NULL, 1874.25, 1472.63, 401.62, 401.63, '150kk (.165$ binance)', '2026-08-19', NULL, '2026-08-18 17:52:58', '2026-08-18 17:52:46', '2026-08-18 18:58:31'),
(46, 31, 'gold', NULL, 0.210000, 0.170000, NULL, NULL, 59.5000, NULL, 11870.25, 9609.25, 2261.00, 2261.00, '950kk (.21$ paypal)', '2026-08-19', NULL, '2026-08-18 17:55:35', '2026-08-18 17:55:27', '2026-08-18 18:58:06'),
(56, 32, 'account', NULL, 0.200000, 0.170000, NULL, NULL, 60.5000, NULL, 30250.00, 20125.88, 10124.12, 10124.13, 'Leblanc 637 Dist', '2026-08-19', NULL, NULL, '2026-08-18 22:08:54', '2026-09-17 18:42:54'),
(63, NULL, 'gold', NULL, 0.210000, 0.170000, 61500000, 61500000, 61.6300, NULL, 795.95, 644.34, 151.61, 151.61, '61.5 (.165$ binance)', '2026-08-20', NULL, '2026-08-19 19:05:52', '2026-08-19 17:27:42', '2026-08-19 19:18:38'),
(65, NULL, 'gold', NULL, 0.220000, 0.165000, 221500000, 221500000, 61.0000, NULL, 2972.53, 2229.40, 743.13, 743.13, '.165$ binance', '2026-08-20', NULL, '2026-08-23 17:40:58', '2026-08-19 21:57:01', '2026-08-23 17:40:58'),
(66, NULL, 'gold', NULL, 0.220000, 0.175000, 900000000, 900000000, 61.0000, NULL, 12078.00, 9607.50, 2470.50, 2470.50, '.175$', '2026-08-24', NULL, '2026-08-23 17:42:50', '2026-08-23 17:35:36', '2026-08-23 17:42:50'),
(67, NULL, 'gold', NULL, 0.220000, 0.170000, 1278500000, 1278500000, 61.0000, NULL, 17157.47, 13258.05, 3899.42, 3899.42, '.22$', '2026-08-24', NULL, '2026-08-23 17:42:44', '2026-08-23 17:38:26', '2026-08-23 17:42:44'),
(68, NULL, 'gold', NULL, 0.210000, 0.170000, 200000000, 200000000, 61.0000, NULL, 2562.00, 2074.00, 488.00, 488.00, '.21$ paypal', '2026-08-24', NULL, '2026-08-23 17:42:40', '2026-08-23 17:39:29', '2026-08-23 17:42:40'),
(69, NULL, 'gold', NULL, 0.210000, 0.170000, 261000000, 261000000, 61.0000, NULL, 3343.41, 2706.57, 636.84, 636.84, '.17$ paypal', '2026-08-24', NULL, '2026-08-23 17:42:27', '2026-08-23 17:39:43', '2026-08-23 17:42:27'),
(72, 33, 'account', NULL, 0.200000, 0.170000, NULL, NULL, 61.5000, NULL, 15990.00, 10455.00, 5535.00, 5535.00, 'Leblanc 621 Dist', '2026-08-25', NULL, NULL, '2026-08-24 23:05:21', '2026-08-24 23:05:21'),
(73, NULL, 'gold', NULL, 16.200000, 0.010000, 695000, 695000, 61.5000, NULL, 692.43, 0.43, 692.00, 692.00, 'Tip 2kkk trade', '2026-08-26', NULL, '2026-08-26 04:31:11', '2026-08-26 04:29:16', '2026-08-26 04:31:11'),
(74, NULL, 'gold', NULL, 0.200000, 0.170000, 1150000000, 1000000000, 61.5000, NULL, 14145.00, 10455.00, 3690.00, 3690.00, 'Wand 60', '2026-08-27', NULL, '2026-08-26 17:37:29', '2026-08-26 17:36:30', '2026-08-26 17:37:29'),
(80, NULL, 'gold', NULL, 0.204450, 0.165000, 342000000, 333333333, 59.8000, NULL, 4181.33, 3289.00, 892.33, 892.33, '.21$ paypal', '2026-08-29', NULL, '2026-08-28 16:18:47', '2026-08-28 16:15:59', '2026-08-28 16:18:47'),
(81, NULL, 'gold', NULL, 0.210000, 0.165000, 366666667, 366666667, 61.0000, NULL, 4697.00, 3690.50, 1006.50, 1006.50, '.165$', '2026-08-29', NULL, '2026-08-31 17:15:35', '2026-08-28 16:20:52', '2026-08-31 17:15:35'),
(83, NULL, 'gold', NULL, 0.210000, 0.170000, 617333333, 617333333, 60.2000, NULL, 7804.33, 6317.79, 1486.54, 1486.54, '.21$ paypal', '2026-09-01', NULL, '2026-08-31 17:17:53', '2026-08-31 17:17:09', '2026-08-31 17:17:53'),
(84, 34, 'account', NULL, 0.200000, 0.170000, NULL, NULL, 61.5000, NULL, 7380.00, 5227.50, 2152.50, 2152.50, 'Leblanc 561 Mage', '2026-09-01', NULL, NULL, '2026-08-31 17:18:29', '2026-08-31 17:18:29'),
(86, NULL, 'gold', NULL, 0.200000, 0.200000, 110000000, 1, 61.5000, NULL, 1353.00, 0.00, 1353.00, 1353.00, 'MM Fee', '2026-09-01', NULL, '2026-08-31 18:10:41', '2026-08-31 18:09:49', '2026-08-31 18:10:41'),
(87, NULL, 'gold', NULL, 0.210000, 0.170000, 138000000, 138000000, 61.0000, NULL, 1767.78, 1431.06, 336.72, 336.72, '.21$ paypal', '2026-09-02', NULL, '2026-09-01 17:26:17', '2026-09-01 17:21:45', '2026-09-01 17:26:17'),
(88, NULL, 'gold', NULL, 0.220000, 0.170000, 242000000, 242000000, 61.0000, NULL, 3247.64, 2509.54, 738.10, 738.10, '.22$', '2026-09-02', NULL, '2026-09-01 17:26:12', '2026-09-01 17:23:17', '2026-09-01 17:26:12'),
(89, NULL, 'gold', NULL, 0.223000, 0.170000, 500000000, 500000000, 61.0000, NULL, 6801.50, 5185.00, 1616.50, 1616.50, '.223', '2026-09-02', NULL, '2026-09-01 17:26:10', '2026-09-01 17:25:15', '2026-09-01 17:26:10'),
(90, 35, 'account', NULL, 0.200000, 0.170000, NULL, NULL, 61.0000, NULL, 24400.00, 16592.00, 7808.00, 7808.00, 'Leblanc 632 Melee', '2026-09-02', NULL, NULL, '2026-09-01 19:16:28', '2026-09-01 19:16:28'),
(91, 37, 'account', NULL, 0.200000, 0.170000, NULL, NULL, 61.0000, NULL, 3050.00, 1970.30, 1079.70, 1079.70, 'Leblanc 514 Dist', '2026-09-02', NULL, NULL, '2026-09-01 19:16:41', '2026-09-01 19:16:41'),
(92, 36, 'account', NULL, 0.200000, 0.170000, NULL, NULL, 61.0000, NULL, 9760.00, 5910.90, 3849.10, 3849.10, 'Leblanc 586 Magic', '2026-09-02', NULL, NULL, '2026-09-01 19:18:24', '2026-09-01 19:18:24'),
(93, 38, 'account', NULL, 0.200000, 0.170000, NULL, NULL, 61.0000, NULL, 9760.00, 5599.80, 4160.20, 4160.20, 'Leblanc 583 Dist', '2026-09-02', NULL, NULL, '2026-09-01 19:31:53', '2026-09-01 19:31:53'),
(94, NULL, 'gold', NULL, 0.218000, 0.170000, 3300000000, 3300000000, 61.0000, NULL, 43883.40, 34221.00, 9662.40, 9662.40, '.19€ paypal', '2026-09-02', NULL, '2026-09-02 08:22:03', '2026-09-02 08:16:59', '2026-09-02 08:22:03'),
(95, NULL, 'gold', NULL, 0.210000, 0.170000, 56000000, 56000000, 62.3000, NULL, 732.65, 593.10, 139.55, 139.55, '.21$', '2026-09-06', NULL, '2026-09-05 18:25:28', '2026-09-05 18:23:36', '2026-09-05 18:25:28'),
(96, NULL, 'gold', NULL, 0.210000, 0.170000, 86000000, 86000000, 61.0000, NULL, 1101.66, 891.82, 209.84, 209.84, '.21$ paypal', '2026-09-07', NULL, '2026-09-06 17:16:41', '2026-09-06 17:15:54', '2026-09-06 17:16:41'),
(97, NULL, 'gold', NULL, 0.220000, 0.170000, 1216000000, 1216000000, 60.4592, NULL, 16174.05, 12498.13, 3675.92, 3675.92, '.22$ paypal', '2026-09-09', NULL, '2026-09-07 16:53:40', '2026-09-07 13:58:32', '2026-09-07 16:53:40'),
(98, NULL, 'gold', NULL, 0.220000, 0.170000, 1000000000, 1000000000, 60.5000, NULL, 13310.00, 10285.00, 3025.00, 3025.00, '.22$ paypal', '2026-09-09', NULL, '2026-09-07 16:52:42', '2026-09-07 16:50:17', '2026-09-07 16:52:42'),
(101, NULL, 'gold', NULL, 0.220000, 0.175000, 989000000, 989000000, 62.0000, NULL, 13489.96, 10730.65, 2759.31, 2759.31, '.22$', '2026-09-10', NULL, '2026-09-09 14:21:05', '2026-09-09 14:19:20', '2026-09-09 14:21:05'),
(102, NULL, 'gold', NULL, 0.220000, 0.175000, 611000000, 611000000, 62.0000, NULL, 8334.04, 6629.35, 1704.69, 1704.69, '.175$', '2026-09-10', NULL, '2026-09-09 21:43:33', '2026-09-09 14:22:23', '2026-09-09 21:43:33'),
(103, NULL, 'gold', NULL, 0.220000, 0.170000, 229000000, 229000000, 62.0000, NULL, 3123.56, 2413.66, 709.90, 709.90, '.22$ paypal', '2026-09-10', NULL, '2026-09-09 21:45:31', '2026-09-09 21:44:33', '2026-09-09 21:45:31'),
(104, 39, 'account', NULL, 0.230000, 0.170000, NULL, NULL, 60.5950, NULL, 3484.21, 1215.54, 2268.67, 2268.68, 'Leblanc 510 Dist', '2026-09-14', NULL, '2026-09-18 00:23:28', '2026-09-13 22:08:03', '2026-09-18 00:23:28'),
(105, NULL, 'gold', NULL, 0.220000, 0.170000, 1253700000, 1253700000, 60.7400, NULL, 16752.94, 12945.46, 3807.48, 3807.49, '.17$', '2026-09-15', NULL, '2026-09-14 17:45:25', '2026-09-14 17:42:19', '2026-09-14 17:45:25'),
(106, NULL, 'gold', NULL, 0.220000, 0.175000, 746300000, 746300000, 60.7400, NULL, 9972.66, 7932.80, 2039.86, 2039.86, '.175$', '2026-09-15', NULL, '2026-09-14 17:45:22', '2026-09-14 17:44:04', '2026-09-14 17:45:22'),
(108, NULL, 'gold', NULL, 0.220000, 0.177500, 500000000, 500000000, 60.6978, NULL, 6676.76, 5458.13, 1218.63, 1218.63, '.22$', '2026-09-18', NULL, '2026-09-17 18:17:43', '2026-09-17 18:11:33', '2026-09-17 18:17:43'),
(109, NULL, 'gold', NULL, 0.220000, 0.210000, 500000000, 500000000, 60.0000, NULL, 6600.00, 4576.95, 2023.05, 2023.05, 'First payment of Leblanc 637 Dist', '2026-09-18', NULL, '2026-09-17 18:48:24', '2026-09-17 18:45:24', '2026-09-17 18:48:24'),
(110, NULL, 'gold', NULL, NULL, NULL, 90000000, 90000000, NULL, NULL, NULL, NULL, NULL, 0.01, '9/100 gcash', '2026-09-18', NULL, NULL, '2026-09-17 18:52:17', '2026-09-19 18:29:56'),
(111, NULL, 'gold', NULL, 0.220000, 0.170000, 709000000, 709000000, 62.7300, NULL, 10102.04, 7528.62, 2573.42, 0.01, '.17$ (62.66 pesos)', '2026-09-18', NULL, NULL, '2026-09-17 21:55:35', '2026-09-20 03:10:45'),
(112, NULL, 'gold', NULL, 0.230000, 0.170000, 200000000, 200000000, 60.6978, NULL, 2792.10, 2132.48, 659.62, 659.62, '.17$', '2026-09-18', NULL, '2026-09-18 00:45:26', '2026-09-18 00:43:06', '2026-09-18 00:45:26'),
(113, 40, 'account', NULL, 0.220000, 0.170000, NULL, NULL, 60.0000, 62.0000, 15840.00, 9486.00, 6354.00, 6354.00, 'Leblanc 609 Dist', '2026-09-19', NULL, NULL, '2026-09-18 17:14:49', '2026-09-18 17:14:49'),
(114, NULL, 'gold', NULL, NULL, NULL, 80000000, 80000000, NULL, NULL, NULL, NULL, NULL, 0.01, '.17$ binance (62.98)', '2026-09-20', NULL, NULL, '2026-09-19 18:45:14', '2026-09-19 18:45:14'),
(115, NULL, 'gold', NULL, NULL, NULL, 85000000, 85000000, NULL, NULL, NULL, NULL, NULL, 0.01, '9.5/100 gcash', '2026-09-20', NULL, NULL, '2026-09-20 03:05:19', '2026-09-20 03:05:19');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `color` varchar(7) NOT NULL DEFAULT '#6366f1',
  `icon` varchar(255) NOT NULL DEFAULT 'tag',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `user_id`, `name`, `type`, `color`, `icon`, `created_at`, `updated_at`) VALUES
(1, 1, 'Foods', 'expense', '#06b6d4', 'tag', '2026-06-30 00:42:16', '2026-07-01 18:45:23'),
(2, 1, 'Transportations', 'expense', '#f97316', 'tag', '2026-06-30 00:43:32', '2026-07-01 18:45:25'),
(5, 1, 'Savings', 'income', '#ef4444', 'tag', '2026-06-30 21:50:55', '2026-07-02 17:56:20'),
(6, 1, 'Bills', 'expense', '#22c55e', 'tag', '2026-07-01 18:43:23', '2026-07-01 18:45:20'),
(7, 1, 'Others', 'expense', '#ec4899', 'tag', '2026-07-02 01:29:04', '2026-07-02 21:44:11'),
(8, 1, 'Salary', 'income', '#4f46e5', 'Briefcase', '2026-07-06 19:12:34', '2026-07-06 19:12:34'),
(20, 1, 'Allowance', 'expense', '#3b82f6', 'tag', '2026-08-23 18:04:00', '2026-08-23 18:04:00'),
(21, 3, 'Salary', 'income', '#6366f1', 'tag', '2026-08-28 20:39:13', '2026-08-28 20:39:13'),
(22, 3, 'Food', 'expense', '#6366f1', 'tag', '2026-08-28 20:39:55', '2026-08-28 20:39:55'),
(23, 1, 'Payment', 'income', '#3b82f6', 'tag', '2026-08-31 22:04:59', '2026-08-31 22:04:59'),
(24, 5, 'Foods', 'expense', '#6366f1', 'tag', '2026-09-17 04:14:17', '2026-09-17 04:14:17'),
(25, 5, 'Salary', 'income', '#22c55e', 'tag', '2026-09-17 04:16:41', '2026-09-17 04:16:41'),
(26, 5, 'Transpo', 'expense', '#ef4444', 'tag', '2026-09-17 14:23:25', '2026-09-17 14:23:25'),
(27, 5, 'Miscellaneous', 'expense', '#8b5cf6', 'tag', '2026-09-17 15:46:41', '2026-09-17 15:46:41'),
(28, 5, 'Incentive Ter', 'expense', '#14b8a6', 'gift', '2026-09-17 15:50:10', '2026-09-17 15:50:10');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `golds`
--

CREATE TABLE `golds` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(20,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
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
(15, 0.00, NULL, '2026-07-02 21:16:08', '2026-08-13 17:03:03'),
(16, 0.00, 'Leblanc 593 Melee (Sold)', '2026-07-02 21:25:28', '2026-07-30 17:11:01'),
(17, 0.00, 'Buy gold for law (2k gcash)', '2026-07-05 17:35:48', '2026-08-11 18:16:51'),
(18, 0.00, 'MM Fee', '2026-07-05 18:06:09', '2026-08-13 17:03:03'),
(19, 0.00, 'MM fee 7/13 598', '2026-07-05 18:31:55', '2026-08-13 17:03:03'),
(20, 0.00, 'MM Fee 7/13 140 + Swift', '2026-07-05 23:58:23', '2026-08-13 17:03:03'),
(21, 0.00, '7/14 335 (MM Fee)', '2026-07-06 18:40:24', '2026-08-13 17:03:03'),
(22, 0.00, 'Current gold stash', '2026-07-06 19:12:34', '2026-08-13 17:03:03'),
(23, 0.00, 'Bought gold for 240$ (.16$ rate)', '2026-07-08 05:59:25', '2026-07-23 21:19:30'),
(24, 0.00, 'MM Fee', '2026-07-08 06:14:45', '2026-08-13 17:03:03'),
(25, 0.00, '7/16 3800 (MM Fee)', '2026-07-09 00:37:56', '2026-08-13 17:03:03'),
(27, 0.00, 'Sold: uzeroa6@gmail.com', '2026-07-09 05:16:41', '2026-07-09 05:19:01'),
(31, 0.00, 'Gold Adjustment', '2026-07-09 05:58:15', '2026-08-03 17:19:25'),
(34, 0.00, '7/16 130 (MM Fee)', '2026-07-09 06:31:10', '2026-08-13 17:03:03'),
(35, 0.00, 'Sold: Leblanc 618 Dist', '2026-07-09 17:08:42', '2026-08-06 17:42:53'),
(36, 0.00, 'MM Fee', '2026-07-09 17:12:46', '2026-08-13 17:03:03'),
(37, 0.00, 'Bought gold for .16', '2026-07-11 23:10:46', '2026-08-11 18:16:51'),
(38, 0.00, 'MM Fee', '2026-07-11 23:11:23', '2026-08-13 17:03:03'),
(39, 0.00, 'MM Fee', '2026-07-12 06:34:09', '2026-08-13 17:03:03'),
(40, 0.00, '7/19 83 (MM Fee)', '2026-07-12 06:37:21', '2026-08-13 17:03:03'),
(41, 0.00, 'Sold: Leblanc 702 Melee', '2026-07-12 14:57:45', '2026-08-11 18:16:51'),
(42, 0.00, 'MM Fee', '2026-07-14 19:00:49', '2026-08-13 17:03:03'),
(43, 0.00, 'MM Fee', '2026-07-15 01:39:28', '2026-08-13 17:03:03'),
(44, 0.00, 'MM Fee', '2026-07-18 03:21:38', '2026-08-13 17:03:03'),
(45, 0.00, 'MM Fee', '2026-07-20 17:26:51', '2026-08-13 17:03:03'),
(46, 0.00, 'Sold: 1.871kk (.16$ rate)', '2026-07-20 17:43:55', '2026-07-20 17:52:36'),
(47, 0.00, 'Sold: 1.529kk (.17$ rate)', '2026-07-20 17:45:19', '2026-07-20 17:52:36'),
(48, 0.00, 'System Error', '2026-07-21 00:57:35', '2026-08-13 17:03:03'),
(49, 0.00, 'Sold: 1.529kk (.17$ rate)', '2026-07-21 16:46:08', '2026-07-21 16:46:30'),
(50, 0.00, 'Sold: 318kk (.22$ paypal)', '2026-07-21 16:53:26', '2026-08-05 01:56:40'),
(51, 0.00, 'Toadsziron', '2026-07-21 23:05:02', '2026-08-11 18:16:51'),
(52, 0.00, 'System Error', '2026-07-22 17:08:23', '2026-08-13 17:03:03'),
(53, 0.00, 'Pantay', '2026-07-22 17:35:09', '2026-08-13 17:03:03'),
(54, 0.00, 'Total MM Fee (July 23rd)', '2026-07-22 17:40:53', '2026-08-11 18:16:51'),
(55, 0.00, 'Free on 641 Mage', '2026-07-22 22:37:34', '2026-08-13 17:03:03'),
(56, 0.00, 'excess gold', '2026-07-22 22:38:52', '2026-08-13 17:03:03'),
(57, 0.00, '7/30 350 2x', '2026-07-23 06:09:29', '2026-08-13 17:03:03'),
(58, 0.00, '7/30 230', '2026-07-23 06:11:52', '2026-08-13 17:03:03'),
(59, 0.00, '7/31 3547', '2026-07-23 17:17:50', '2026-08-13 17:03:03'),
(60, 0.00, 'Sold: 2569kk (.17$ rate)', '2026-07-23 21:22:28', '2026-07-23 21:23:26'),
(61, 0.00, 'MM Fee from 2nd highest trade', '2026-07-27 17:08:46', '2026-08-11 18:16:51'),
(63, 0.00, 'Sold: Leblanc 560 Mage', '2026-07-27 17:43:59', '2026-08-05 01:56:40'),
(64, 0.00, '8/3 39', '2026-07-28 02:14:30', '2026-08-13 17:03:03'),
(65, 0.00, 'Bought gold .17$', '2026-07-28 14:45:20', '2026-08-05 16:56:17'),
(66, 0.00, 'Bought gold for .16', '2026-07-28 23:04:28', '2026-08-11 18:16:51'),
(67, 0.00, 'Bought for .17 binance', '2026-07-29 16:36:40', '2026-07-30 17:11:01'),
(68, 0.00, '.17', '2026-07-29 23:18:08', '2026-08-13 17:03:03'),
(69, 0.00, '.17$ binance', '2026-07-30 18:11:14', '2026-08-05 01:56:40'),
(70, 0.00, '.17', '2026-07-30 19:34:46', '2026-08-03 17:18:57'),
(71, 0.00, '.17 gcash', '2026-07-30 19:48:07', '2026-08-11 18:16:51'),
(72, 0.00, NULL, '2026-07-30 21:03:12', '2026-08-13 17:03:03'),
(73, 0.00, '.17$ binance', '2026-08-03 17:18:21', '2026-08-11 18:16:51'),
(74, 0.00, 'Sold: Leblanc 600 Melee', '2026-08-03 17:27:50', '2026-08-05 01:56:40'),
(75, 0.00, 'Sold: MM Fee', '2026-08-03 17:29:16', '2026-08-11 18:16:51'),
(76, 0.00, 'MM Fee', '2026-08-03 17:56:33', '2026-08-13 17:03:03'),
(77, 0.00, 'Sold: 927kk (.22$) Paypal', '2026-08-03 18:18:11', '2026-08-03 18:18:22'),
(78, 0.00, 'Sold: 899kk (.2$)', '2026-08-03 18:26:59', '2026-08-03 18:27:14'),
(79, 0.00, '3 Letters', '2026-08-03 22:47:34', '2026-08-13 17:03:03'),
(80, 0.00, 'MM Fee gold', '2026-08-04 17:37:31', '2026-08-13 17:03:03'),
(81, 0.00, '.16$', '2026-08-04 18:58:58', '2026-08-13 17:03:03'),
(82, 0.00, '.15$ binance', '2026-08-04 21:20:21', '2026-08-11 18:16:51'),
(83, 0.00, '8/19 200', '2026-08-04 23:36:53', '2026-08-13 17:03:03'),
(84, 0.00, '8/12 730', '2026-08-05 16:57:43', '2026-08-13 17:03:03'),
(85, 0.00, '8/12 730', '2026-08-05 16:58:04', '2026-08-13 17:03:03'),
(86, 0.00, '.165$ binance', '2026-08-05 18:24:06', '2026-08-06 17:42:53'),
(87, 0.00, '559kks trade', '2026-08-06 01:56:24', '2026-08-13 17:03:03'),
(88, 0.00, 'Sold: Leblanc 614 Melee', '2026-08-11 18:09:26', '2026-08-11 18:16:51'),
(89, 0.00, '.17$ binance', '2026-08-11 18:16:39', '2026-08-11 18:16:51'),
(90, 0.00, 'Sold: 2kkk gold .185 euro', '2026-08-11 18:20:09', '2026-08-11 18:25:15'),
(91, 0.00, 'Sold: 454kk (.22$) paypal', '2026-08-11 18:23:26', '2026-08-11 18:25:15'),
(92, 0.00, '.17 gcash', '2026-08-11 18:29:15', '2026-08-13 17:03:03'),
(93, 0.00, 'Pantay', '2026-08-11 18:36:49', '2026-08-13 17:03:03'),
(94, 0.00, '8/19 160', '2026-08-12 16:56:11', '2026-08-13 17:03:03'),
(95, 0.00, '.17$ binance', '2026-08-12 22:21:44', '2026-08-13 17:03:03'),
(96, 0.00, '.17$ binance', '2026-08-12 22:47:16', '2026-08-13 17:03:03'),
(97, 0.00, '8/20 200', '2026-08-12 23:11:06', '2026-08-13 17:03:03'),
(98, 0.00, '8/20 124', '2026-08-13 02:01:27', '2026-08-13 17:03:03'),
(99, 0.00, NULL, '2026-08-13 17:03:03', '2026-09-09 06:59:14'),
(100, 0.00, '8/26 85', '2026-08-13 17:13:24', '2026-09-09 06:59:13'),
(101, 0.00, '8/21 49', '2026-08-13 17:57:23', '2026-09-09 06:59:13'),
(102, 0.00, 'item trade', '2026-08-13 17:58:02', '2026-09-09 06:59:13'),
(103, 0.00, 'Sold: 2kkk gold .21$', '2026-08-13 19:27:34', '2026-08-13 19:28:08'),
(104, 0.00, '.17$ binance', '2026-08-13 19:39:25', '2026-09-08 15:42:24'),
(105, 0.00, '.17$ binance', '2026-08-13 23:23:52', '2026-09-09 06:59:13'),
(106, 0.00, '.17$ binance', '2026-08-14 17:19:47', '2026-09-08 15:42:24'),
(107, 0.00, '.175$ binance', '2026-08-14 17:20:12', '2026-08-18 17:42:34'),
(108, 0.00, 'Pantay', '2026-08-14 17:23:46', '2026-09-09 06:59:13'),
(109, 0.00, '624kk', '2026-08-14 18:52:38', '2026-09-09 06:59:13'),
(110, 0.00, '.17$ gcash', '2026-08-14 20:25:41', '2026-08-18 17:42:34'),
(111, 0.00, 'Sold: 180kk (.22$) paypal', '2026-08-14 20:57:51', '2026-09-09 06:59:13'),
(112, 0.00, '.17$ gcash', '2026-08-14 21:14:33', '2026-08-18 17:42:34'),
(113, 0.00, '8/22 450', '2026-08-14 23:15:22', '2026-09-09 06:59:13'),
(114, 0.00, '.17$ gcash', '2026-08-14 23:43:11', '2026-09-09 06:59:13'),
(115, 0.00, '.17$ binance', '2026-08-14 23:57:54', '2026-08-18 17:42:34'),
(116, 0.00, '.17$ binance', '2026-08-16 17:03:31', '2026-08-18 17:42:34'),
(117, 0.00, '.17$ gcash', '2026-08-16 17:03:53', '2026-09-07 17:02:17'),
(118, 0.00, '.17$ gcash', '2026-08-16 17:04:09', '2026-09-08 15:42:24'),
(119, 0.00, '8/28 100', '2026-08-16 17:11:10', '2026-09-09 06:59:13'),
(120, 0.00, 'Sold: 480kk (.2$) binance', '2026-08-16 17:36:48', '2026-08-16 17:37:05'),
(121, 0.00, 'Sold: Leblanc 596 Magic', '2026-08-16 21:07:39', '2026-08-16 21:13:45'),
(122, 0.00, '.17$ binance', '2026-08-16 22:17:16', '2026-09-08 15:42:24'),
(123, 0.00, '.17$ binance', '2026-08-16 22:40:06', '2026-09-08 15:42:24'),
(124, 0.00, '.165$ binance', '2026-08-18 16:50:58', '2026-09-08 15:42:24'),
(125, 0.00, '.17$ binance', '2026-08-18 16:57:37', '2026-09-08 15:42:24'),
(126, 0.00, '.17$ binance', '2026-08-18 17:03:10', '2026-09-08 15:42:24'),
(127, 0.00, '.17$ binance', '2026-08-18 17:23:42', '2026-09-08 15:42:24'),
(128, 0.00, 'Sold: 900kk (.175)', '2026-08-18 17:49:53', '2026-08-18 17:50:06'),
(129, 0.00, 'Sold: 150kk (.165$ binance)', '2026-08-18 17:52:58', '2026-09-07 17:02:17'),
(130, 0.00, 'Sold: 950kk (.21$ paypal)', '2026-08-18 17:55:35', '2026-08-18 17:55:49'),
(131, 0.00, '8/26 580', '2026-08-18 22:37:27', '2026-09-09 06:59:13'),
(132, 0.00, '.165$ binance', '2026-08-18 22:42:23', '2026-09-08 15:42:24'),
(133, 0.00, 'Test MM feee 20kk', '2026-08-18 22:45:33', '2026-09-09 06:59:14'),
(134, 0.00, 'test ulit', '2026-08-18 23:00:15', '2026-09-09 06:59:13'),
(135, 0.00, '8/26 155', '2026-08-18 23:04:35', '2026-09-09 06:59:13'),
(136, 0.00, '8/25 133', '2026-08-19 00:03:42', '2026-09-09 06:59:13'),
(137, 0.00, 'pantay', '2026-08-19 00:11:27', '2026-09-08 15:42:24'),
(138, 0.00, 'pantay', '2026-08-19 01:07:54', '2026-09-09 06:59:14'),
(139, 0.00, '8/27 749', '2026-08-19 17:03:42', '2026-09-09 06:59:13'),
(140, 0.00, '8/27 100', '2026-08-19 17:04:02', '2026-09-09 06:59:13'),
(141, 0.00, '.17$ binance', '2026-08-19 17:07:47', '2026-09-08 15:42:24'),
(142, 0.00, '8/27 500', '2026-08-19 21:04:20', '2026-09-09 06:59:13'),
(143, 0.00, '.165$ binance', '2026-08-19 21:56:03', '2026-09-07 17:02:17'),
(144, 0.00, '8/31 119', '2026-08-23 17:22:11', '2026-09-09 06:59:13'),
(145, 0.00, '8/30 205', '2026-08-23 17:22:48', '2026-09-09 06:59:13'),
(146, 0.00, '8/28 485', '2026-08-23 17:23:15', '2026-09-09 06:59:13'),
(147, 0.00, '8/29 1.5', '2026-08-23 17:25:34', '2026-09-09 06:59:14'),
(148, 0.00, '641 mage payment', '2026-08-23 17:27:11', '2026-08-23 17:28:30'),
(149, 0.00, '.17$ binance', '2026-08-23 17:27:36', '2026-08-23 17:28:30'),
(150, 0.00, '.17$ binance', '2026-08-23 17:27:50', '2026-09-07 17:02:17'),
(151, 0.00, '.17$ binance', '2026-08-23 17:27:58', '2026-09-08 15:42:24'),
(152, 0.00, '.17$ binance', '2026-08-23 17:28:08', '2026-08-23 17:28:56'),
(153, 0.00, '8/27 1100 (Account Secure)', '2026-08-23 17:47:48', '2026-09-09 06:59:13'),
(154, 0.00, '8/28 130', '2026-08-23 17:48:21', '2026-09-09 06:59:13'),
(155, 0.00, 'MM Fee', '2026-08-23 17:51:34', '2026-09-09 06:59:13'),
(156, 0.00, 'other stuffs', '2026-08-23 17:51:48', '2026-09-09 06:59:14'),
(157, 0.00, '9/9 84', '2026-08-23 18:37:18', '2026-09-09 06:59:14'),
(158, 0.00, '.17$ binance', '2026-08-23 21:50:30', '2026-08-24 22:32:48'),
(159, 0.00, '.17$ binance', '2026-08-23 21:59:57', '2026-09-09 06:59:13'),
(160, 0.00, '.165$ binance', '2026-08-23 22:05:55', '2026-09-02 08:16:21'),
(162, 0.00, 'Sold: Leblanc 632 Dist', '2026-08-24 22:09:23', '2026-09-07 13:57:30'),
(164, 0.00, 'Sold: Leblanc 632 Melee', '2026-08-24 22:14:21', '2026-09-07 13:57:30'),
(168, 0.00, 'Sold: Leblanc 632 Melee', '2026-08-24 22:34:20', '2026-09-09 06:59:13'),
(170, 0.00, 'Sold: Leblanc 632 Dist', '2026-08-24 22:39:18', '2026-09-07 17:02:17'),
(171, 0.00, '9/1 30', '2026-08-24 23:11:27', '2026-09-09 06:59:14'),
(172, 0.00, '9/1 30 (after 3 days 160kk)', '2026-08-24 23:15:37', '2026-09-09 06:59:13'),
(173, 0.00, 'Leblanc 632 Dist', '2026-08-25 21:01:11', '2026-09-07 17:02:17'),
(174, 0.00, '9/2 81.5', '2026-08-26 05:26:24', '2026-09-09 06:59:13'),
(175, 0.00, 'pantay', '2026-08-26 16:56:37', '2026-09-09 06:59:14'),
(176, 0.00, 'Wand 60', '2026-08-26 17:34:46', '2026-08-27 17:50:35'),
(177, 0.00, '.17$ binance', '2026-08-27 00:43:32', '2026-09-09 06:59:13'),
(178, 0.00, '9/2 176.5', '2026-08-27 17:43:30', '2026-09-09 06:59:14'),
(179, 0.00, '384kk mm', '2026-08-27 17:51:05', '2026-09-09 06:59:13'),
(180, 0.00, '.165', '2026-08-27 17:53:16', '2026-09-08 15:42:24'),
(181, 0.00, 'MM Fee', '2026-08-27 17:54:30', '2026-09-09 06:59:14'),
(182, 0.00, '9/4 175', '2026-08-27 18:49:15', '2026-09-09 06:59:13'),
(183, 0.00, '.17$ gcash', '2026-08-28 00:38:38', '2026-09-07 17:02:17'),
(184, 0.00, '9/4 450', '2026-08-28 00:44:04', '2026-09-09 06:59:14'),
(185, 0.00, '9/4 247', '2026-08-28 01:18:09', '2026-09-09 06:59:13'),
(186, 0.00, '.17$ binance', '2026-08-28 05:20:04', '2026-09-07 17:02:17'),
(187, 0.00, '9/4 720', '2026-08-28 05:20:49', '2026-09-09 06:59:13'),
(188, 0.00, 'Sold: Leblanc 582 Dist', '2026-08-28 17:46:31', '2026-09-07 17:02:17'),
(189, 0.00, NULL, '2026-08-28 19:10:30', '2026-09-09 06:59:13'),
(190, 0.00, 'Gold trade', '2026-08-28 21:35:22', '2026-09-09 06:59:13'),
(191, 0.00, 'Sold: Leblanc 642 Melee', '2026-08-28 21:42:26', '2026-09-07 16:49:04'),
(192, 0.00, 'gold mm fee', '2026-08-29 05:37:03', '2026-09-09 06:59:13'),
(193, 0.00, '.17$ gcash', '2026-08-29 21:56:01', '2026-09-07 17:02:17'),
(194, 0.00, '.17$ gcash', '2026-08-31 21:41:55', '2026-09-09 06:59:13'),
(195, 0.00, '.17$ gcash', '2026-08-31 23:04:27', '2026-09-09 06:59:13'),
(196, 0.00, '.17$ gcash', '2026-09-01 08:37:13', '2026-09-07 16:49:04'),
(197, 0.00, '.17$ gcash', '2026-09-01 08:37:29', '2026-09-02 08:16:21'),
(198, 0.00, '7 days pa mag dededuct', '2026-09-01 17:52:22', '2026-09-02 08:16:21'),
(199, 0.00, '.17$ gcash', '2026-09-01 17:58:15', '2026-09-09 06:59:13'),
(200, 0.00, '9/9 1600', '2026-09-01 17:59:58', '2026-09-09 06:59:13'),
(201, 0.00, '.17$ gcash', '2026-09-01 21:05:30', '2026-09-09 06:59:13'),
(202, 0.00, '.17$ binance', '2026-09-02 00:53:45', '2026-09-08 15:42:24'),
(203, 0.00, '.17$ gcash', '2026-09-02 04:17:53', '2026-09-02 08:16:21'),
(204, 0.00, '.17$ gcash', '2026-09-02 16:50:18', '2026-09-09 06:59:13'),
(205, 0.00, '9/10 3300', '2026-09-02 20:50:21', '2026-09-09 06:59:13'),
(206, 0.00, 'ananeko gold trade', '2026-09-03 04:04:27', '2026-09-09 06:59:13'),
(207, 0.00, 'ananeko gold trade', '2026-09-03 04:05:07', '2026-09-09 06:59:13'),
(208, 0.00, '.17$ gcash', '2026-09-03 04:45:57', '2026-09-07 17:02:17'),
(209, 0.00, '9/10 395', '2026-09-03 04:51:17', '2026-09-09 06:59:13'),
(210, 0.00, '9/3 176.5', '2026-09-03 17:38:04', '2026-09-09 06:59:13'),
(211, 0.00, '.17$ gcash', '2026-09-03 20:58:52', '2026-09-09 06:59:13'),
(212, 0.00, 'MM gold fee', '2026-09-03 22:07:25', '2026-09-09 06:59:13'),
(213, 0.00, '9/11 133', '2026-09-04 00:05:50', '2026-09-09 06:59:13'),
(214, 0.00, '.17$ gcash', '2026-09-04 00:06:07', '2026-09-09 06:59:13'),
(215, 0.00, '.17$ gcash', '2026-09-04 00:11:55', '2026-09-07 17:02:17'),
(216, 0.00, 'Mm fee', '2026-09-05 18:19:49', '2026-09-09 06:59:13'),
(217, 0.00, '9/14 155', '2026-09-07 02:30:09', '2026-09-09 06:59:13'),
(218, 0.00, 'gold mm fee', '2026-09-07 17:59:36', '2026-09-09 06:59:13'),
(219, 0.00, '9/15 930', '2026-09-07 18:58:04', '2026-09-09 06:59:13'),
(220, 0.00, 'Gold mm fee', '2026-09-07 19:48:35', '2026-09-09 06:59:13'),
(221, 0.00, '.17$ binance', '2026-09-08 06:22:18', '2026-09-08 15:42:24'),
(222, 0.00, '9/16 228', '2026-09-08 15:44:32', '2026-09-09 06:59:13'),
(223, 0.00, NULL, '2026-09-08 16:39:48', '2026-09-09 06:59:13'),
(224, -2730285964.00, NULL, '2026-09-09 06:59:14', '2026-09-09 06:59:14'),
(225, 473000000.00, '.175$ binance', '2026-09-09 14:13:09', '2026-09-10 19:13:30'),
(226, 2000000.00, 'gold mm fee', '2026-09-09 18:27:52', '2026-09-09 18:27:52'),
(227, 2000000.00, '9/17 800 + acc x acc', '2026-09-09 21:47:28', '2026-09-09 21:47:28'),
(228, 248000000.00, 'First Payment for Leblanc 637 Dist', '2026-09-10 17:06:31', '2026-09-13 22:14:13'),
(229, 1000000.00, '9/18', '2026-09-10 19:12:32', '2026-09-10 19:12:32'),
(230, 206000000.00, '9/100 gcash', '2026-09-11 16:23:02', '2026-09-11 16:23:02'),
(231, 351000000.00, '9/100 gcash', '2026-09-11 19:35:18', '2026-09-11 19:35:18'),
(232, 1000000.00, '9/19 75', '2026-09-12 00:55:30', '2026-09-12 00:55:30'),
(233, 18000000.00, '9/100 gcash', '2026-09-12 20:05:03', '2026-09-12 20:05:03'),
(234, 9300000.00, '9/100', '2026-09-12 21:35:22', '2026-09-12 21:35:22'),
(235, 90000000.00, '9/100', '2026-09-13 17:16:42', '2026-09-13 17:16:42'),
(236, 659219.00, 'cleaning acc', '2026-09-13 17:17:40', '2026-09-13 17:17:40'),
(237, 153573.00, 'cleaning acc', '2026-09-13 17:20:30', '2026-09-13 17:20:30'),
(238, 25194.00, 'cleaning acc', '2026-09-13 17:23:14', '2026-09-13 17:23:14'),
(239, 51000.00, 'cleaning acc', '2026-09-13 17:25:54', '2026-09-13 17:25:54'),
(240, 78409.00, 'cleaning acc', '2026-09-13 17:28:24', '2026-09-13 17:28:24'),
(242, 1000000.00, 'gold mm fee', '2026-09-14 00:34:13', '2026-09-14 00:34:13'),
(243, 72000000.00, '.175$ binance', '2026-09-14 17:18:39', '2026-09-14 17:18:39'),
(244, 0.00, '.17$', '2026-09-14 17:40:56', '2026-09-14 17:41:48'),
(245, 1000000.00, 'mm fee', '2026-09-14 19:25:02', '2026-09-14 19:25:02'),
(246, 9000000.00, '9/100 (new)', '2026-09-15 00:19:29', '2026-09-15 00:19:29'),
(247, 720000000.00, '9/100 gcash', '2026-09-15 07:48:24', '2026-09-15 07:48:24'),
(248, 1022000000.00, 'Sold: Leblanc 624 Melee', '2026-09-15 16:46:14', '2026-09-18 15:54:06'),
(249, 2000000.00, '9/23 159', '2026-09-15 22:41:58', '2026-09-15 22:41:58'),
(250, 2000000.00, 'gold mm fee', '2026-09-16 19:23:27', '2026-09-16 19:23:27'),
(251, 2000000.00, '9/24 600', '2026-09-16 22:34:24', '2026-09-16 22:34:24'),
(252, 2000000.00, '9/24 123', '2026-09-17 00:02:01', '2026-09-17 00:02:01'),
(253, 2000000.00, '9/24 385', '2026-09-17 18:04:34', '2026-09-17 18:04:34'),
(254, 9000000.00, '9/100 gcash', '2026-09-17 18:51:59', '2026-09-17 18:51:59'),
(255, 732000000.00, '.17$ binance (62.73 peso)', '2026-09-17 21:59:42', '2026-09-17 21:59:42'),
(256, 250000000.00, 'Sold: Leblanc 510 Dist', '2026-09-18 00:23:28', '2026-09-18 00:23:28'),
(257, 250000000.00, 'cash back', '2026-09-18 00:42:16', '2026-09-18 00:42:16'),
(258, 177000000.00, '.17$ binance (62.66 peso)', '2026-09-18 15:25:10', '2026-09-18 15:25:10'),
(259, 177000000.00, '.17$ binance (62.66 peso)', '2026-09-18 15:25:45', '2026-09-18 15:25:45'),
(260, 2000000.00, '9/26 3700', '2026-09-18 15:53:40', '2026-09-18 15:53:40'),
(261, 1000000.00, '9/26 3700', '2026-09-18 15:53:54', '2026-09-18 15:53:54'),
(262, 1000000.00, '9/26 3700', '2026-09-18 15:54:24', '2026-09-18 15:54:24'),
(263, 2000000.00, '9/26', '2026-09-19 07:33:12', '2026-09-19 07:33:12'),
(264, 90000000.00, '9/100 gcash', '2026-09-19 18:28:09', '2026-09-19 18:28:09'),
(265, 2000000.00, '9/27 518', '2026-09-19 18:29:21', '2026-09-19 18:29:21'),
(266, 80000000.00, '.17$ binance (62.98 peso)', '2026-09-19 19:42:29', '2026-09-19 19:42:29'),
(267, 2000000.00, 'mm fee 127', '2026-09-19 19:42:52', '2026-09-19 19:42:52'),
(268, 1000000.00, '9/27 45', '2026-09-19 20:47:09', '2026-09-19 20:47:09'),
(269, 85500000.00, '9.5/100 gcash', '2026-09-20 03:04:43', '2026-09-20 03:04:43');

-- --------------------------------------------------------

--
-- Table structure for table `gold_logs`
--

CREATE TABLE `gold_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('add','sell','fee') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gold_logs`
--

INSERT INTO `gold_logs` (`id`, `type`, `amount`, `description`, `cancelled_at`, `created_at`, `updated_at`) VALUES
(5, 'add', 3000000.00, '2 MM Fee', NULL, '2026-07-01 17:19:44', '2026-07-01 17:19:44'),
(6, 'sell', 1250000000.00, 'Payment for nolife sil (650kk left)', NULL, '2026-07-02 18:02:53', '2026-07-02 18:02:53'),
(7, 'add', 1000000.00, 'MM Fee', NULL, '2026-07-02 18:03:48', '2026-07-02 18:03:48'),
(8, 'sell', 600000000.00, 'Buying Leblanc 618 Dist', NULL, '2026-07-02 18:31:02', '2026-07-02 18:31:02'),
(9, 'sell', 650000000.00, 'Buying Leblanc 624 Melee', NULL, '2026-07-02 21:02:28', '2026-07-02 21:02:28'),
(10, 'add', 650000000.00, NULL, NULL, '2026-07-02 21:02:59', '2026-07-02 21:02:59'),
(11, 'sell', 700000000.00, NULL, NULL, '2026-07-02 21:05:40', '2026-07-02 21:05:40'),
(12, 'add', 50000000.00, NULL, NULL, '2026-07-02 21:07:09', '2026-07-02 21:07:09'),
(13, 'add', 770885811.00, NULL, NULL, '2026-07-02 21:08:02', '2026-07-02 21:08:02'),
(14, 'sell', 650000000.00, 'Buying Leblanc 624 Melee (Not yet paid ig)', NULL, '2026-07-02 21:10:17', '2026-07-02 21:10:17'),
(15, 'sell', 600000000.00, 'Buying Leblanc 618 Dist (Not yet paid ig)', NULL, '2026-07-02 21:15:18', '2026-07-02 21:15:18'),
(16, 'sell', 750000000.00, 'Buying Leblanc 600 Melee (not yet paid ig)', NULL, '2026-07-02 21:16:08', '2026-07-02 21:16:08'),
(17, 'add', 750000000.00, 'Leblanc 593 Melee (Sold)', NULL, '2026-07-02 21:25:28', '2026-07-02 21:25:28'),
(18, 'add', 200000000.00, 'Buy gold for law (2k gcash)', NULL, '2026-07-05 17:35:48', '2026-07-05 17:35:48'),
(19, 'add', 14000000.00, 'MM Fee', NULL, '2026-07-05 18:06:09', '2026-07-05 18:06:09'),
(20, 'add', 2000000.00, 'MM fee 7/13 598', NULL, '2026-07-05 18:31:55', '2026-07-05 18:31:55'),
(21, 'add', 2000000.00, 'MM Fee 7/13 140 + Swift', NULL, '2026-07-05 23:58:23', '2026-07-05 23:58:23'),
(22, 'add', 2000000.00, '7/14 335 (MM Fee)', NULL, '2026-07-06 18:40:24', '2026-07-06 18:40:24'),
(25, 'sell', 50000.00, 'Sold to player A (KKS)', NULL, '2026-07-06 19:12:34', '2026-07-06 19:12:34'),
(26, 'add', 180000.00, 'Gold farming ??? week 3', NULL, '2026-07-06 19:12:34', '2026-07-06 19:12:34'),
(27, 'sell', 80000.00, 'Sold to player B (CASH)', NULL, '2026-07-06 19:12:34', '2026-07-06 19:12:34'),
(28, 'add', 220000.00, 'Gold farming ??? week 4', NULL, '2026-07-06 19:12:34', '2026-07-06 19:12:34'),
(29, 'sell', 620000.00, NULL, NULL, '2026-07-06 19:59:48', '2026-07-06 19:59:48'),
(30, 'add', 1500000000.00, 'Bought gold for 240$ (.16$ rate)', NULL, '2026-07-08 05:59:25', '2026-07-08 05:59:25'),
(31, 'add', 9000000.00, 'MM Fee', NULL, '2026-07-08 06:14:45', '2026-07-08 06:14:45'),
(32, 'add', 3000000.00, '7/16 3800 (MM Fee)', NULL, '2026-07-09 00:37:56', '2026-07-09 00:37:56'),
(33, 'sell', 650000000.00, 'Bought Leblanc 624 Melee (Fully Paid)', NULL, '2026-07-09 03:39:44', '2026-07-09 03:39:44'),
(34, 'add', 1100000000.00, 'Sold: uzeroa6@gmail.com', NULL, '2026-07-09 05:16:41', '2026-07-09 05:16:41'),
(36, 'sell', 1100000000.00, 'Bug', NULL, '2026-07-09 05:19:01', '2026-07-09 05:19:01'),
(39, 'add', 1397500001.00, 'Gold Adjustment', NULL, '2026-07-09 05:58:15', '2026-07-09 05:58:15'),
(42, 'add', 2000000.00, '7/16 130 (MM Fee)', NULL, '2026-07-09 06:31:10', '2026-07-09 06:31:10'),
(43, 'add', 1500000000.00, 'Sold: Leblanc 618 Dist', NULL, '2026-07-09 17:08:42', '2026-07-09 17:08:42'),
(44, 'add', 2000000.00, 'MM Fee', NULL, '2026-07-09 17:12:46', '2026-07-09 17:12:46'),
(45, 'sell', 750000000.00, 'Buying Leblanc 600 Melee', NULL, '2026-07-09 17:25:01', '2026-07-09 17:25:01'),
(46, 'sell', 1000000.00, 'Cancellation', NULL, '2026-07-09 21:19:11', '2026-07-09 21:19:11'),
(47, 'add', 171900000.00, 'Bought gold for .16', NULL, '2026-07-11 23:10:46', '2026-07-11 23:10:46'),
(48, 'add', 8000000.00, 'MM Fee', NULL, '2026-07-11 23:11:23', '2026-07-11 23:11:23'),
(49, 'add', 2000000.00, 'MM Fee', NULL, '2026-07-12 06:34:09', '2026-07-12 06:34:09'),
(50, 'add', 1000000.00, '7/19 83 (MM Fee)', NULL, '2026-07-12 06:37:21', '2026-07-12 06:37:21'),
(51, 'add', 5800000000.00, 'Sold: Leblanc 702 Melee', NULL, '2026-07-12 14:57:45', '2026-07-12 14:57:45'),
(52, 'sell', 999999.00, 'cancel trade', NULL, '2026-07-13 01:40:47', '2026-07-13 01:40:47'),
(53, 'add', 13000000.00, 'MM Fee', NULL, '2026-07-14 19:00:49', '2026-07-14 19:00:49'),
(54, 'add', 2000000.00, 'MM Fee', NULL, '2026-07-15 01:39:28', '2026-07-15 01:39:28'),
(55, 'sell', 2100000000.00, 'Leblanc 642 Melee (Bought)', NULL, '2026-07-17 23:58:20', '2026-07-17 23:58:20'),
(56, 'add', 2000000.00, 'MM Fee', NULL, '2026-07-18 03:21:38', '2026-07-18 03:21:38'),
(57, 'sell', 3397000000.00, 'Sold gold (.2) binance', NULL, '2026-07-20 17:26:15', '2026-07-20 17:26:15'),
(58, 'add', 7000000.00, 'MM Fee', NULL, '2026-07-20 17:26:51', '2026-07-20 17:26:51'),
(59, 'sell', 7000000.00, 'System Error', NULL, '2026-07-20 17:27:43', '2026-07-20 17:27:43'),
(60, 'add', 1871000000.00, 'Sold: 1.871kk (.16$ rate)', NULL, '2026-07-20 17:43:55', '2026-07-20 17:43:55'),
(62, 'sell', 3400000000.00, NULL, NULL, '2026-07-20 17:52:36', '2026-07-20 17:52:36'),
(63, 'sell', 7399990.00, 'Nagkulang', NULL, '2026-07-20 18:00:18', '2026-07-20 18:00:18'),
(64, 'add', 13000000.00, 'System Error', NULL, '2026-07-21 00:57:35', '2026-07-21 00:57:35'),
(65, 'sell', 318000000.00, 'Sold gold .22 (paypal)', NULL, '2026-07-21 14:06:15', '2026-07-21 14:06:15'),
(67, 'sell', 1529000000.00, 'System Error', NULL, '2026-07-21 16:46:30', '2026-07-21 16:46:30'),
(68, 'add', 318000000.00, 'Sold: 318kk (.22$ paypal)', NULL, '2026-07-21 16:53:26', '2026-07-21 16:53:26'),
(69, 'sell', 318000000.00, 'System Error', NULL, '2026-07-21 16:53:39', '2026-07-21 16:53:39'),
(70, 'add', 25000000.00, 'Toadsziron', NULL, '2026-07-21 23:05:02', '2026-07-21 23:05:02'),
(71, 'fee', 2000000.00, NULL, '2026-07-22 17:30:04', '2026-07-22 17:06:40', '2026-07-22 17:30:04'),
(72, 'fee', 2000000.00, 'System Error', '2026-07-22 17:30:08', '2026-07-22 17:08:23', '2026-07-22 17:30:08'),
(73, 'add', 5000000.00, 'Pantay', NULL, '2026-07-22 17:35:09', '2026-07-22 17:35:09'),
(74, 'sell', 600000.00, 'Pantay', NULL, '2026-07-22 17:36:04', '2026-07-22 17:36:04'),
(75, 'fee', 90000000.00, 'Total MM Fee (July 23rd)', NULL, '2026-07-22 17:40:53', '2026-07-22 17:40:53'),
(76, 'sell', 90000000.00, 'Pantay', NULL, '2026-07-22 17:41:05', '2026-07-22 17:41:05'),
(77, 'fee', 5000000.00, 'Free on 641 Mage', NULL, '2026-07-22 22:37:34', '2026-07-22 22:37:34'),
(78, 'add', 683438.00, 'excess gold', NULL, '2026-07-22 22:38:52', '2026-07-22 22:38:52'),
(79, 'fee', 4000000.00, '7/30 350 2x', NULL, '2026-07-23 06:09:29', '2026-07-23 06:09:29'),
(80, 'fee', 2000000.00, '7/30 230', NULL, '2026-07-23 06:11:52', '2026-07-23 06:11:52'),
(81, 'fee', 3000000.00, '7/31 3547', NULL, '2026-07-23 17:17:50', '2026-07-23 17:17:50'),
(82, 'sell', 1040000000.00, 'Sold (.2) gcash', NULL, '2026-07-23 21:19:30', '2026-07-23 21:19:30'),
(83, 'add', 2569000000.00, 'Sold: 2569kk (.17$ rate)', NULL, '2026-07-23 21:22:28', '2026-07-23 21:22:28'),
(84, 'sell', 2569000000.00, 'Revamp', NULL, '2026-07-23 21:23:26', '2026-07-23 21:23:26'),
(85, 'fee', 56000000.00, 'MM Fee from 2nd highest trade', NULL, '2026-07-27 17:08:46', '2026-07-27 17:08:46'),
(87, 'add', 650000000.00, 'Sold: Leblanc 560 Mage', NULL, '2026-07-27 17:43:59', '2026-07-27 17:43:59'),
(88, 'fee', 2000000.00, '8/3 39', NULL, '2026-07-28 02:14:30', '2026-07-28 02:14:30'),
(89, 'add', 300000000.00, 'Bought gold .17$', NULL, '2026-07-28 14:45:20', '2026-07-28 14:45:20'),
(90, 'add', 30000000.00, 'Bought gold for .16', NULL, '2026-07-28 23:04:28', '2026-07-28 23:04:28'),
(91, 'add', 2500000000.00, 'Bought for .17 binance', NULL, '2026-07-29 16:36:40', '2026-07-29 16:36:40'),
(92, 'sell', 655000000.00, 'Leblanc 596 Mage', NULL, '2026-07-29 18:52:08', '2026-07-29 18:52:08'),
(93, 'add', 9500000.00, '.17', NULL, '2026-07-29 23:18:08', '2026-07-29 23:18:08'),
(94, 'sell', 960000000.00, 'Leblanc 614 Melee', NULL, '2026-07-30 00:38:56', '2026-07-30 00:38:56'),
(95, 'sell', 1900000000.00, 'Leblanc 641 Magic', NULL, '2026-07-30 17:11:01', '2026-07-30 17:11:01'),
(96, 'add', 319000000.00, '.17$ binance', NULL, '2026-07-30 18:11:15', '2026-07-30 18:11:15'),
(97, 'add', 697000000.00, '.17', NULL, '2026-07-30 19:34:46', '2026-07-30 19:34:46'),
(98, 'add', 285000000.00, '.17 gcash', NULL, '2026-07-30 19:48:07', '2026-07-30 19:48:07'),
(99, 'fee', 1500000.00, NULL, NULL, '2026-07-30 21:03:12', '2026-07-30 21:03:12'),
(100, 'add', 35000000.00, '.17$ binance', NULL, '2026-08-03 17:18:21', '2026-08-03 17:18:21'),
(101, 'sell', 899000000.00, '.2$ Bank Transfer (Wise)', NULL, '2026-08-03 17:18:57', '2026-08-03 17:18:57'),
(102, 'sell', 737000000.00, '.22$ Paypal', NULL, '2026-08-03 17:19:25', '2026-08-03 17:19:25'),
(103, 'add', 1000000000.00, 'Sold: Leblanc 600 Melee', NULL, '2026-08-03 17:27:50', '2026-08-03 17:27:50'),
(104, 'add', 163500000.00, 'Sold: MM Fee', NULL, '2026-08-03 17:29:16', '2026-08-03 17:29:16'),
(105, 'sell', 163500000.00, 'Pantay', NULL, '2026-08-03 17:29:34', '2026-08-03 17:29:34'),
(106, 'sell', 741000.00, 'pamantay', NULL, '2026-08-03 17:45:37', '2026-08-03 17:45:37'),
(107, 'sell', 190000000.00, '.22$ Paypal', NULL, '2026-08-03 17:55:24', '2026-08-03 17:55:24'),
(108, 'fee', 4000000.00, 'MM Fee', NULL, '2026-08-03 17:56:33', '2026-08-03 17:56:33'),
(109, 'add', 927000000.00, 'Sold: 927kk (.22$) Paypal', NULL, '2026-08-03 18:18:11', '2026-08-03 18:18:11'),
(110, 'sell', 927000000.00, 'Pantay', NULL, '2026-08-03 18:18:22', '2026-08-03 18:18:22'),
(111, 'add', 899000000.00, 'Sold: 899kk (.2$)', NULL, '2026-08-03 18:26:59', '2026-08-03 18:26:59'),
(112, 'sell', 899000000.00, 'Pantay', NULL, '2026-08-03 18:27:14', '2026-08-03 18:27:14'),
(113, 'fee', 1000000.00, '3 Letters', NULL, '2026-08-03 22:47:34', '2026-08-03 22:47:34'),
(114, 'sell', 309000000.00, '.2$ binance', NULL, '2026-08-04 02:39:07', '2026-08-04 02:39:07'),
(115, 'fee', 4000000.00, 'MM Fee gold', NULL, '2026-08-04 17:37:31', '2026-08-04 17:37:31'),
(116, 'add', 10000000.00, '.16$', NULL, '2026-08-04 18:58:58', '2026-08-04 18:58:58'),
(117, 'add', 20000000.00, '.15$ binance', NULL, '2026-08-04 21:20:21', '2026-08-04 21:20:21'),
(118, 'fee', 2000000.00, '8/19 200', NULL, '2026-08-04 23:36:53', '2026-08-04 23:36:53'),
(119, 'sell', 1600000000.00, 'Leblanc 632 Melee', NULL, '2026-08-05 01:56:40', '2026-08-05 01:56:40'),
(120, 'sell', 454000000.00, '.22$ Paypal', NULL, '2026-08-05 16:56:17', '2026-08-05 16:56:17'),
(121, 'add', 2000000.00, '8/12 730', '2026-08-05 16:57:48', '2026-08-05 16:57:43', '2026-08-05 16:57:48'),
(122, 'fee', 2000000.00, '8/12 730', NULL, '2026-08-05 16:58:04', '2026-08-05 16:58:04'),
(123, 'add', 300000000.00, '.165$ binance', NULL, '2026-08-05 18:24:06', '2026-08-05 18:24:06'),
(124, 'fee', 2000000.00, '559kks trade', NULL, '2026-08-06 01:56:24', '2026-08-06 01:56:24'),
(125, 'sell', 600000000.00, 'Leblanc 582 Dist', NULL, '2026-08-06 17:42:53', '2026-08-06 17:42:53'),
(126, 'add', 1150000000.00, 'Sold: Leblanc 614 Melee', NULL, '2026-08-11 18:09:26', '2026-08-11 18:09:26'),
(127, 'sell', 395000000.00, '.2$ binance', NULL, '2026-08-11 18:16:17', '2026-08-11 18:16:17'),
(128, 'add', 280000000.00, '.17$ binance', NULL, '2026-08-11 18:16:39', '2026-08-11 18:16:39'),
(129, 'sell', 2000000000.00, '.17 euro paypal', NULL, '2026-08-11 18:16:51', '2026-08-11 18:16:51'),
(130, 'add', 2000000000.00, 'Sold: 2kkk gold .185 euro', NULL, '2026-08-11 18:20:09', '2026-08-11 18:20:09'),
(131, 'add', 454000000.00, 'Sold: 454kk (.22$) paypal', NULL, '2026-08-11 18:23:26', '2026-08-11 18:23:26'),
(132, 'sell', 2454000000.00, 'Pantay', NULL, '2026-08-11 18:25:15', '2026-08-11 18:25:15'),
(133, 'add', 142500000.00, '.17 gcash', NULL, '2026-08-11 18:29:15', '2026-08-11 18:29:15'),
(134, 'fee', 14000000.00, 'Pantay', NULL, '2026-08-11 18:36:49', '2026-08-11 18:36:49'),
(135, 'fee', 2000000.00, '8/19 160', NULL, '2026-08-12 16:56:11', '2026-08-12 16:56:11'),
(136, 'add', 150000000.00, '.17$ binance', NULL, '2026-08-12 22:21:44', '2026-08-12 22:21:44'),
(137, 'add', 100000000.00, '.17$ binance', NULL, '2026-08-12 22:47:16', '2026-08-12 22:47:16'),
(138, 'fee', 2000000.00, '8/20 200', NULL, '2026-08-12 23:11:06', '2026-08-12 23:11:06'),
(139, 'fee', 2000000.00, '8/20 124', NULL, '2026-08-13 02:01:27', '2026-08-13 02:01:27'),
(140, 'sell', 2000000000.00, '.22$ Paypal', NULL, '2026-08-13 17:03:03', '2026-08-13 17:03:03'),
(141, 'fee', 1000000.00, '8/26 85', NULL, '2026-08-13 17:13:24', '2026-08-13 17:13:24'),
(142, 'fee', 1000000.00, '8/21 49', NULL, '2026-08-13 17:57:23', '2026-08-13 17:57:23'),
(143, 'fee', 2000000.00, 'item trade', NULL, '2026-08-13 17:58:02', '2026-08-13 17:58:02'),
(144, 'add', 2000000000.00, 'Sold: 2kkk gold .21$', NULL, '2026-08-13 19:27:34', '2026-08-13 19:27:34'),
(145, 'sell', 2000000000.00, 'Pantay', NULL, '2026-08-13 19:28:08', '2026-08-13 19:28:08'),
(146, 'add', 100000000.00, '.17$ binance', NULL, '2026-08-13 19:39:25', '2026-08-13 19:39:25'),
(147, 'add', 150000000.00, '.17$ binance', NULL, '2026-08-13 23:23:52', '2026-08-13 23:23:52'),
(148, 'add', 100000000.00, '.17$ binance', NULL, '2026-08-14 17:19:47', '2026-08-14 17:19:47'),
(149, 'add', 900000000.00, '.175$ binance', NULL, '2026-08-14 17:20:12', '2026-08-14 17:20:12'),
(150, 'fee', 2000000.00, 'Pantay', NULL, '2026-08-14 17:23:46', '2026-08-14 17:23:46'),
(151, 'fee', 2000000.00, '624kk', NULL, '2026-08-14 18:52:38', '2026-08-14 18:52:38'),
(152, 'add', 463000000.00, '.17$ gcash', NULL, '2026-08-14 20:25:41', '2026-08-14 20:25:41'),
(153, 'sell', 180000000.00, '.22$ Paypal', NULL, '2026-08-14 20:54:49', '2026-08-14 20:54:49'),
(154, 'add', 180000000.00, 'Sold: 180kk (.22$) paypal', NULL, '2026-08-14 20:57:51', '2026-08-14 20:57:51'),
(155, 'sell', 180000000.00, 'Pantay', NULL, '2026-08-14 20:58:12', '2026-08-14 20:58:12'),
(156, 'add', 332500000.00, '.17$ gcash', NULL, '2026-08-14 21:14:33', '2026-08-14 21:14:33'),
(157, 'fee', 2000000.00, '8/22 450', NULL, '2026-08-14 23:15:22', '2026-08-14 23:15:22'),
(158, 'add', 60000000.00, '.17$ gcash', NULL, '2026-08-14 23:43:11', '2026-08-14 23:43:11'),
(159, 'add', 332500000.00, '.17$ binance', NULL, '2026-08-14 23:57:54', '2026-08-14 23:57:54'),
(160, 'add', 350000000.00, '.17$ binance', NULL, '2026-08-16 17:03:31', '2026-08-16 17:03:31'),
(161, 'add', 142500000.00, '.17$ gcash', NULL, '2026-08-16 17:03:53', '2026-08-16 17:03:53'),
(162, 'add', 325000000.00, '.17$ gcash', NULL, '2026-08-16 17:04:09', '2026-08-16 17:04:09'),
(163, 'sell', 165000000.00, '.2$ binance', NULL, '2026-08-16 17:04:28', '2026-08-16 17:04:28'),
(164, 'fee', 2000000.00, '8/28 100', NULL, '2026-08-16 17:11:10', '2026-08-16 17:11:10'),
(165, 'add', 480000000.00, 'Sold: 480kk (.2$) binance', NULL, '2026-08-16 17:36:48', '2026-08-16 17:36:48'),
(166, 'sell', 480000000.00, 'Pantay', NULL, '2026-08-16 17:37:05', '2026-08-16 17:37:05'),
(167, 'add', 1000000000.00, 'Sold: Leblanc 596 Magic', NULL, '2026-08-16 21:07:39', '2026-08-16 21:07:39'),
(168, 'sell', 1000000000.00, 'pantay', NULL, '2026-08-16 21:13:45', '2026-08-16 21:13:45'),
(169, 'add', 97000000.00, '.17$ binance', NULL, '2026-08-16 22:17:16', '2026-08-16 22:17:16'),
(170, 'add', 250000000.00, '.17$ binance', NULL, '2026-08-16 22:40:06', '2026-08-16 22:40:06'),
(171, 'sell', 100000000.00, 'Pantay', NULL, '2026-08-16 22:47:05', '2026-08-16 22:47:05'),
(172, 'add', 150000000.00, '.165$ binance', NULL, '2026-08-18 16:50:58', '2026-08-18 16:50:58'),
(173, 'add', 97000000.00, '.17$ binance', NULL, '2026-08-18 16:57:37', '2026-08-18 16:57:37'),
(174, 'add', 80000000.00, '.17$ binance', NULL, '2026-08-18 17:03:10', '2026-08-18 17:03:10'),
(175, 'add', 100000000.00, '.17$ binance', NULL, '2026-08-18 17:23:42', '2026-08-18 17:23:42'),
(176, 'sell', 2000000000.00, '.21$ paypal', NULL, '2026-08-18 17:42:34', '2026-08-18 17:42:34'),
(177, 'add', 900000000.00, 'Sold: 900kk (.175)', NULL, '2026-08-18 17:49:53', '2026-08-18 17:49:53'),
(178, 'sell', 900000000.00, 'pantay', NULL, '2026-08-18 17:50:06', '2026-08-18 17:50:06'),
(179, 'add', 150000000.00, 'Sold: 150kk (.165$ binance)', NULL, '2026-08-18 17:52:58', '2026-08-18 17:52:58'),
(180, 'sell', 150000000.00, 'Pantay', NULL, '2026-08-18 17:53:13', '2026-08-18 17:53:13'),
(181, 'add', 950000000.00, 'Sold: 950kk (.21$ paypal)', NULL, '2026-08-18 17:55:35', '2026-08-18 17:55:35'),
(182, 'sell', 950000000.00, 'Pantay', NULL, '2026-08-18 17:55:49', '2026-08-18 17:55:49'),
(183, 'fee', 2000000.00, '8/26 580', NULL, '2026-08-18 22:37:27', '2026-08-18 22:37:27'),
(184, 'add', 85000000.00, '.165$ binance', NULL, '2026-08-18 22:42:23', '2026-08-18 22:42:23'),
(185, 'fee', 1000000.00, 'Test MM feee 20kk', '2026-08-18 22:50:01', '2026-08-18 22:45:33', '2026-08-18 22:50:01'),
(186, 'fee', 2000000.00, 'test ulit', '2026-08-18 23:01:31', '2026-08-18 23:00:15', '2026-08-18 23:01:31'),
(187, 'fee', 2000000.00, '8/26 155', NULL, '2026-08-18 23:04:35', '2026-08-18 23:04:35'),
(188, 'fee', 2000000.00, '8/25 133', NULL, '2026-08-19 00:03:42', '2026-08-19 00:03:42'),
(190, 'sell', 100000000.00, 'pantay', NULL, '2026-08-19 00:20:41', '2026-08-19 00:20:41'),
(191, 'sell', 96000000.00, '96kk missing', NULL, '2026-08-19 00:40:26', '2026-08-19 00:40:26'),
(192, 'add', 2.00, 'pantay', NULL, '2026-08-19 01:07:54', '2026-08-19 01:07:54'),
(193, 'fee', 2000000.00, '8/27 749', NULL, '2026-08-19 17:03:42', '2026-08-19 17:03:42'),
(194, 'fee', 2000000.00, '8/27 100', NULL, '2026-08-19 17:04:02', '2026-08-19 17:04:02'),
(195, 'add', 102000000.00, '.17$ binance', NULL, '2026-08-19 17:07:47', '2026-08-19 17:07:47'),
(196, 'sell', 61500000.00, '.21$ paypal', NULL, '2026-08-19 17:13:58', '2026-08-19 17:13:58'),
(197, 'fee', 2000000.00, '8/27 500', NULL, '2026-08-19 21:04:20', '2026-08-19 21:04:20'),
(198, 'add', 200000000.00, '.165$ binance', NULL, '2026-08-19 21:56:03', '2026-08-19 21:56:03'),
(199, 'fee', 2000000.00, '8/31 119', NULL, '2026-08-23 17:22:11', '2026-08-23 17:22:11'),
(200, 'fee', 2000000.00, '8/30 205', NULL, '2026-08-23 17:22:48', '2026-08-23 17:22:48'),
(201, 'fee', 2000000.00, '8/28 485', NULL, '2026-08-23 17:23:15', '2026-08-23 17:23:15'),
(202, 'fee', 1000000.00, '8/29 1.5', NULL, '2026-08-23 17:25:34', '2026-08-23 17:25:34'),
(203, 'add', 925000000.00, '641 mage payment', NULL, '2026-08-23 17:27:11', '2026-08-23 17:27:11'),
(204, 'add', 1000000000.00, '.17$ binance', NULL, '2026-08-23 17:27:36', '2026-08-23 17:27:36'),
(205, 'add', 220000000.00, '.17$ binance', NULL, '2026-08-23 17:27:50', '2026-08-23 17:27:50'),
(206, 'add', 100000000.00, '.17$ binance', NULL, '2026-08-23 17:27:58', '2026-08-23 17:27:58'),
(207, 'add', 903000000.00, '.17$ binance', NULL, '2026-08-23 17:28:08', '2026-08-23 17:28:08'),
(208, 'sell', 2400000000.00, '.22$ Paypal', NULL, '2026-08-23 17:28:30', '2026-08-23 17:28:30'),
(209, 'sell', 200000000.00, '.21$ paypal', NULL, '2026-08-23 17:28:46', '2026-08-23 17:28:46'),
(210, 'sell', 261000000.00, '.21$ paypal', NULL, '2026-08-23 17:28:56', '2026-08-23 17:28:56'),
(211, 'fee', 15000000.00, '8/27 1100 (Account Secure)', NULL, '2026-08-23 17:47:48', '2026-08-23 17:47:48'),
(212, 'fee', 2000000.00, '8/28 130', NULL, '2026-08-23 17:48:21', '2026-08-23 17:48:21'),
(213, 'fee', 7000000.00, 'MM Fee', NULL, '2026-08-23 17:51:34', '2026-08-23 17:51:34'),
(214, 'add', 41415.00, 'other stuffs', NULL, '2026-08-23 17:51:48', '2026-08-23 17:51:48'),
(215, 'fee', 1000000.00, '9/9 84', NULL, '2026-08-23 18:37:18', '2026-08-23 18:37:18'),
(216, 'add', 1000000000.00, '.17$ binance', NULL, '2026-08-23 21:50:30', '2026-08-23 21:50:30'),
(217, 'add', 36000000.00, '.17$ binance', NULL, '2026-08-23 21:59:57', '2026-08-23 21:59:57'),
(218, 'add', 600000000.00, '.165$ binance', NULL, '2026-08-23 22:05:55', '2026-08-23 22:05:55'),
(227, 'sell', 1000000000.00, 'rollback', NULL, '2026-08-24 22:26:59', '2026-08-24 22:26:59'),
(228, 'sell', 600000000.00, NULL, NULL, '2026-08-24 22:29:03', '2026-08-24 22:29:03'),
(229, 'sell', 1000000000.00, 'rollback', NULL, '2026-08-24 22:32:48', '2026-08-24 22:32:48'),
(231, 'add', 2000000000.00, 'Sold: Leblanc 632 Melee', NULL, '2026-08-24 22:34:20', '2026-08-24 22:34:20'),
(232, 'sell', 1000000000.00, '60 Wand', NULL, '2026-08-24 22:34:38', '2026-08-24 22:34:38'),
(234, 'add', 2500000000.00, 'Sold: Leblanc 632 Dist', NULL, '2026-08-24 22:39:18', '2026-08-24 22:39:18'),
(235, 'sell', 575000000.00, 'Hindi pa nabibigay', NULL, '2026-08-24 22:40:27', '2026-08-24 22:40:27'),
(236, 'sell', 1000000000.00, 'Leblanc 621 Dist', NULL, '2026-08-24 22:40:42', '2026-08-24 22:40:42'),
(237, 'sell', 925000000.00, 'nabigay na', NULL, '2026-08-24 22:41:17', '2026-08-24 22:41:17'),
(238, 'fee', 1000000.00, '9/1 30', NULL, '2026-08-24 23:11:27', '2026-08-24 23:11:27'),
(239, 'fee', 2000000.00, '9/1 30 (after 3 days 160kk)', NULL, '2026-08-24 23:15:37', '2026-08-24 23:15:37'),
(240, 'add', 575000000.00, 'Leblanc 632 Dist', NULL, '2026-08-25 21:01:11', '2026-08-25 21:01:11'),
(241, 'fee', 2000000.00, '9/2 81.5', NULL, '2026-08-26 05:26:24', '2026-08-26 05:26:24'),
(242, 'add', 2000.00, 'pantay', NULL, '2026-08-26 16:56:37', '2026-08-26 16:56:37'),
(243, 'add', 1150000000.00, 'Wand 60', NULL, '2026-08-26 17:34:46', '2026-08-26 17:34:46'),
(244, 'add', 60000000.00, '.17$ binance', NULL, '2026-08-27 00:43:32', '2026-08-27 00:43:32'),
(245, 'fee', 1000000.00, '9/2 176.5', NULL, '2026-08-27 17:43:30', '2026-08-27 17:43:30'),
(246, 'sell', 1925000000.00, 'Leblanc 637 Dist', NULL, '2026-08-27 17:50:35', '2026-08-27 17:50:35'),
(247, 'fee', 2000000.00, '384kk mm', NULL, '2026-08-27 17:51:05', '2026-08-27 17:51:05'),
(248, 'add', 100000000.00, '.165', NULL, '2026-08-27 17:53:16', '2026-08-27 17:53:16'),
(250, 'sell', 1000000.00, 'Pantay', NULL, '2026-08-27 17:57:22', '2026-08-27 17:57:22'),
(251, 'sell', 3000000.00, 'pantay', NULL, '2026-08-27 18:03:18', '2026-08-27 18:03:18'),
(252, 'fee', 2000000.00, '9/4 175', NULL, '2026-08-27 18:49:15', '2026-08-27 18:49:15'),
(253, 'add', 950000000.00, '.17$ gcash', NULL, '2026-08-28 00:38:38', '2026-08-28 00:38:38'),
(254, 'fee', 1000000.00, '9/4 450', NULL, '2026-08-28 00:44:04', '2026-08-28 00:44:04'),
(255, 'fee', 2000000.00, '9/4 247', NULL, '2026-08-28 01:18:09', '2026-08-28 01:18:09'),
(256, 'add', 160000000.00, '.17$ binance', NULL, '2026-08-28 05:20:04', '2026-08-28 05:20:04'),
(257, 'fee', 2000000.00, '9/4 720', NULL, '2026-08-28 05:20:49', '2026-08-28 05:20:49'),
(258, 'sell', 333333333.00, '.21$ paypal', NULL, '2026-08-28 16:19:11', '2026-08-28 16:19:11'),
(259, 'add', 961525688.00, 'Sold: Leblanc 582 Dist', NULL, '2026-08-28 17:46:31', '2026-08-28 17:46:31'),
(260, 'sell', 500000000.00, 'Leblanc 561 Mage', NULL, '2026-08-28 17:46:49', '2026-08-28 17:46:49'),
(261, 'add', 47500000.00, NULL, NULL, '2026-08-28 19:10:30', '2026-08-28 19:10:30'),
(262, 'fee', 2000000.00, 'Gold trade', NULL, '2026-08-28 21:35:22', '2026-08-28 21:35:22'),
(263, 'add', 2300000000.00, 'Sold: Leblanc 642 Melee', NULL, '2026-08-28 21:42:26', '2026-08-28 21:42:26'),
(264, 'sell', 1300000000.00, '.185€ paypal', NULL, '2026-08-28 21:43:43', '2026-08-28 21:43:43'),
(265, 'fee', 2000000.00, 'gold mm fee', NULL, '2026-08-29 05:37:03', '2026-08-29 05:37:03'),
(266, 'add', 105000000.00, '.17$ gcash', NULL, '2026-08-29 21:56:01', '2026-08-29 21:56:01'),
(267, 'sell', 484000000.00, '.21$ paypal', NULL, '2026-08-31 17:08:06', '2026-08-31 17:08:06'),
(268, 'sell', 500000000.00, '.21$ paypal', NULL, '2026-08-31 17:12:08', '2026-08-31 17:12:08'),
(269, 'add', 9500000.00, '.17$ gcash', NULL, '2026-08-31 21:41:55', '2026-08-31 21:41:55'),
(270, 'add', 47500000.00, '.17$ gcash', NULL, '2026-08-31 23:04:27', '2026-08-31 23:04:27'),
(271, 'add', 364000000.00, '.17$ gcash', NULL, '2026-09-01 08:37:13', '2026-09-01 08:37:13'),
(272, 'add', 2614000000.00, '.17$ gcash', NULL, '2026-09-01 08:37:29', '2026-09-01 08:37:29'),
(273, 'sell', 138000000.00, NULL, NULL, '2026-09-01 08:40:48', '2026-09-01 08:40:48'),
(274, 'sell', 1600000000.00, 'Leblanc 632 Melee', NULL, '2026-09-01 17:36:38', '2026-09-01 17:36:38'),
(275, 'add', 1600000000.00, '7 days pa mag dededuct', NULL, '2026-09-01 17:52:22', '2026-09-01 17:52:22'),
(276, 'sell', 242000000.00, '.22$ Paypal', NULL, '2026-09-01 17:57:18', '2026-09-01 17:57:18'),
(277, 'sell', 500000000.00, '.223$ paypal', NULL, '2026-09-01 17:57:29', '2026-09-01 17:57:29'),
(278, 'add', 47500000.00, '.17$ gcash', NULL, '2026-09-01 17:58:15', '2026-09-01 17:58:15'),
(279, 'fee', 2000000.00, '9/9 1600', NULL, '2026-09-01 17:59:58', '2026-09-01 17:59:58'),
(280, 'add', 57000000.00, '.17$ gcash', NULL, '2026-09-01 21:05:30', '2026-09-01 21:05:30'),
(281, 'add', 102000000.00, '.17$ binance', NULL, '2026-09-02 00:53:45', '2026-09-02 00:53:45'),
(282, 'add', 684000000.00, '.17$ gcash', NULL, '2026-09-02 04:17:53', '2026-09-02 04:17:53'),
(283, 'sell', 3300000000.00, '.19€ paypal', NULL, '2026-09-02 08:16:21', '2026-09-02 08:16:21'),
(284, 'add', 76000000.00, '.17$ gcash', NULL, '2026-09-02 16:50:18', '2026-09-02 16:50:18'),
(285, 'fee', 2000000.00, '9/10 3300', NULL, '2026-09-02 20:50:21', '2026-09-02 20:50:21'),
(286, 'add', 4000000.00, 'ananeko gold trade', NULL, '2026-09-03 04:04:27', '2026-09-03 04:04:27'),
(287, 'sell', 4000000.00, 'ananeko bug', NULL, '2026-09-03 04:04:53', '2026-09-03 04:04:53'),
(288, 'fee', 4000000.00, 'ananeko gold trade', NULL, '2026-09-03 04:05:07', '2026-09-03 04:05:07'),
(289, 'add', 123500000.00, '.17$ gcash', NULL, '2026-09-03 04:45:57', '2026-09-03 04:45:57'),
(290, 'fee', 2000000.00, '9/10 395', NULL, '2026-09-03 04:51:17', '2026-09-03 04:51:17'),
(291, 'fee', 3000000.00, '9/3 176.5', NULL, '2026-09-03 17:38:04', '2026-09-03 17:38:04'),
(292, 'add', 105000000.00, '.17$ gcash', NULL, '2026-09-03 20:58:52', '2026-09-03 20:58:52'),
(293, 'fee', 2000000.00, 'MM gold fee', NULL, '2026-09-03 22:07:25', '2026-09-03 22:07:25'),
(294, 'fee', 2000000.00, '9/11 133', NULL, '2026-09-04 00:05:50', '2026-09-04 00:05:50'),
(295, 'add', 28500000.00, '.17$ gcash', NULL, '2026-09-04 00:06:07', '2026-09-04 00:06:07'),
(296, 'add', 213750000.00, '.17$ gcash', NULL, '2026-09-04 00:11:55', '2026-09-04 00:11:55'),
(297, 'fee', 15000000.00, 'Mm fee', NULL, '2026-09-05 18:19:49', '2026-09-05 18:19:49'),
(298, 'sell', 56000000.00, NULL, NULL, '2026-09-05 18:21:04', '2026-09-05 18:21:04'),
(299, 'fee', 2000000.00, '9/14 155', NULL, '2026-09-07 02:30:09', '2026-09-07 02:30:09'),
(300, 'sell', 1000000000.00, '.22$ paypal', NULL, '2026-09-07 13:57:30', '2026-09-07 13:57:30'),
(301, 'sell', 216000000.00, '.22$ paypal', NULL, '2026-09-07 13:57:55', '2026-09-07 13:57:55'),
(302, 'sell', 1000000000.00, '.22$ Paypal', NULL, '2026-09-07 16:49:04', '2026-09-07 16:49:04'),
(303, 'sell', 1999999997.00, '.22$ Paypal', NULL, '2026-09-07 17:02:17', '2026-09-07 17:02:17'),
(304, 'fee', 2000000.00, 'gold mm fee', NULL, '2026-09-07 17:59:36', '2026-09-07 17:59:36'),
(305, 'fee', 2000000.00, '9/15 930', NULL, '2026-09-07 18:58:04', '2026-09-07 18:58:04'),
(306, 'fee', 2000000.00, 'Gold mm fee', NULL, '2026-09-07 19:48:35', '2026-09-07 19:48:35'),
(307, 'add', 103000000.00, '.17$ binance', NULL, '2026-09-08 06:22:18', '2026-09-08 06:22:18'),
(308, 'sell', 1600000000.00, 'Leblanc 632 Melee', NULL, '2026-09-08 15:42:24', '2026-09-08 15:42:24'),
(309, 'fee', 2000000.00, '9/16 228', NULL, '2026-09-08 15:44:32', '2026-09-08 15:44:32'),
(310, 'fee', 2000000.00, NULL, NULL, '2026-09-08 16:39:48', '2026-09-08 16:39:48'),
(311, 'sell', 789000000.00, '.22$ paypal', NULL, '2026-09-09 06:59:14', '2026-09-09 06:59:14'),
(312, 'add', 1600000000.00, '.175$ binance', NULL, '2026-09-09 14:13:09', '2026-09-09 14:13:09'),
(313, 'sell', 200000000.00, '.22$ paypal', NULL, '2026-09-09 14:24:44', '2026-09-09 14:24:44'),
(314, 'fee', 2000000.00, 'gold mm fee', NULL, '2026-09-09 18:27:52', '2026-09-09 18:27:52'),
(315, 'sell', 840000000.00, '.22$ paypal', NULL, '2026-09-09 21:42:25', '2026-09-09 21:42:25'),
(316, 'fee', 2000000.00, '9/17 800 + acc x acc', NULL, '2026-09-09 21:47:28', '2026-09-09 21:47:28'),
(317, 'add', 500000000.00, 'First Payment for Leblanc 637 Dist', NULL, '2026-09-10 17:06:31', '2026-09-10 17:06:31'),
(318, 'fee', 1000000.00, '9/18', NULL, '2026-09-10 19:12:32', '2026-09-10 19:12:32'),
(319, 'sell', 87000000.00, '.21$ paypal', NULL, '2026-09-10 19:13:30', '2026-09-10 19:13:30'),
(320, 'sell', 2000000.00, '-2kk to 510 dist', NULL, '2026-09-10 19:50:42', '2026-09-10 19:50:42'),
(321, 'add', 206000000.00, '9/100 gcash', NULL, '2026-09-11 16:23:02', '2026-09-11 16:23:02'),
(322, 'add', 351000000.00, '9/100 gcash', NULL, '2026-09-11 19:35:18', '2026-09-11 19:35:18'),
(323, 'fee', 1000000.00, '9/19 75', NULL, '2026-09-12 00:55:30', '2026-09-12 00:55:30'),
(324, 'add', 18000000.00, '9/100 gcash', NULL, '2026-09-12 20:05:03', '2026-09-12 20:05:03'),
(325, 'add', 9300000.00, '9/100', NULL, '2026-09-12 21:35:22', '2026-09-12 21:35:22'),
(326, 'add', 90000000.00, '9/100', NULL, '2026-09-13 17:16:42', '2026-09-13 17:16:42'),
(327, 'add', 659219.00, 'cleaning acc', NULL, '2026-09-13 17:17:40', '2026-09-13 17:17:40'),
(328, 'add', 153573.00, 'cleaning acc', NULL, '2026-09-13 17:20:30', '2026-09-13 17:20:30'),
(329, 'add', 25194.00, 'cleaning acc', NULL, '2026-09-13 17:23:14', '2026-09-13 17:23:14'),
(330, 'add', 51000.00, 'cleaning acc', NULL, '2026-09-13 17:25:54', '2026-09-13 17:25:54'),
(331, 'add', 78409.00, 'cleaning acc', NULL, '2026-09-13 17:28:24', '2026-09-13 17:28:24'),
(333, 'sell', 250000000.00, '.23$ paypal', NULL, '2026-09-13 22:14:13', '2026-09-13 22:14:13'),
(334, 'fee', 1000000.00, 'gold mm fee', NULL, '2026-09-14 00:34:13', '2026-09-14 00:34:13'),
(335, 'add', 72000000.00, '.175$ binance', NULL, '2026-09-14 17:18:39', '2026-09-14 17:18:39'),
(337, 'sell', 1253700000.00, NULL, NULL, '2026-09-14 17:41:48', '2026-09-14 17:41:48'),
(338, 'add', 1000000.00, 'mm fee', NULL, '2026-09-14 19:25:02', '2026-09-14 19:25:02'),
(339, 'add', 9000000.00, '9/100 (new)', NULL, '2026-09-15 00:19:29', '2026-09-15 00:19:29'),
(340, 'add', 720000000.00, '9/100 gcash', NULL, '2026-09-15 07:48:24', '2026-09-15 07:48:24'),
(341, 'add', 2150000000.00, 'Sold: Leblanc 624 Melee', NULL, '2026-09-15 16:46:14', '2026-09-15 16:46:14'),
(342, 'fee', 2000000.00, '9/23 159', NULL, '2026-09-15 22:41:58', '2026-09-15 22:41:58'),
(343, 'fee', 2000000.00, 'gold mm fee', NULL, '2026-09-16 19:23:27', '2026-09-16 19:23:27'),
(344, 'fee', 2000000.00, '9/24 600', NULL, '2026-09-16 22:34:24', '2026-09-16 22:34:24'),
(345, 'fee', 2000000.00, '9/24 123', NULL, '2026-09-17 00:02:01', '2026-09-17 00:02:01'),
(346, 'fee', 2000000.00, '9/24 385', NULL, '2026-09-17 18:04:34', '2026-09-17 18:04:34'),
(347, 'sell', 500000000.00, '.22$ paypal', NULL, '2026-09-17 18:10:17', '2026-09-17 18:10:17'),
(348, 'add', 9000000.00, '9/100 gcash', NULL, '2026-09-17 18:51:59', '2026-09-17 18:51:59'),
(349, 'add', 732000000.00, '.17$ binance (62.73 peso)', NULL, '2026-09-17 21:59:42', '2026-09-17 21:59:42'),
(350, 'add', 250000000.00, 'Sold: Leblanc 510 Dist', NULL, '2026-09-18 00:23:28', '2026-09-18 00:23:28'),
(351, 'sell', 200000000.00, '.23$ paypal', NULL, '2026-09-18 00:39:35', '2026-09-18 00:39:35'),
(352, 'sell', 250000000.00, 'Cash', NULL, '2026-09-18 00:39:57', '2026-09-18 00:39:57'),
(353, 'add', 250000000.00, 'cash back', NULL, '2026-09-18 00:42:16', '2026-09-18 00:42:16'),
(354, 'add', 177000000.00, '.17$ binance (62.66 peso)', NULL, '2026-09-18 15:25:10', '2026-09-18 15:25:10'),
(355, 'add', 177000000.00, '.17$ binance (62.66 peso)', NULL, '2026-09-18 15:25:45', '2026-09-18 15:25:45'),
(356, 'sell', 177000000.00, 'doble', NULL, '2026-09-18 15:26:19', '2026-09-18 15:26:19'),
(357, 'fee', 2000000.00, '9/26 3700', NULL, '2026-09-18 15:53:40', '2026-09-18 15:53:40'),
(358, 'add', 1000000.00, '9/26 3700', NULL, '2026-09-18 15:53:54', '2026-09-18 15:53:54'),
(359, 'sell', 1000000.00, 'bug', NULL, '2026-09-18 15:54:06', '2026-09-18 15:54:06'),
(360, 'fee', 1000000.00, '9/26 3700', NULL, '2026-09-18 15:54:24', '2026-09-18 15:54:24'),
(361, 'fee', 2000000.00, '9/26', NULL, '2026-09-19 07:33:12', '2026-09-19 07:33:12'),
(362, 'add', 90000000.00, '9/100 gcash', NULL, '2026-09-19 18:28:09', '2026-09-19 18:28:09'),
(363, 'fee', 2000000.00, '9/27 518', NULL, '2026-09-19 18:29:21', '2026-09-19 18:29:21'),
(364, 'add', 80000000.00, '.17$ binance (62.98 peso)', NULL, '2026-09-19 19:42:29', '2026-09-19 19:42:29'),
(365, 'fee', 2000000.00, 'mm fee 127', NULL, '2026-09-19 19:42:52', '2026-09-19 19:42:52'),
(366, 'fee', 1000000.00, '9/27 45', NULL, '2026-09-19 20:47:09', '2026-09-19 20:47:09'),
(367, 'add', 85500000.00, '9.5/100 gcash', NULL, '2026-09-20 03:04:43', '2026-09-20 03:04:43');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

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
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `middleman_fees`
--

CREATE TABLE `middleman_fees` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `middleman_fees`
--

INSERT INTO `middleman_fees` (`id`, `amount`, `description`, `created_at`, `updated_at`) VALUES
(1, 2000000.00, NULL, '2026-07-22 17:01:16', '2026-07-22 17:01:16'),
(2, 2000000.00, NULL, '2026-07-22 17:06:40', '2026-07-22 17:06:40'),
(3, 2000000.00, 'System Error', '2026-07-22 17:08:23', '2026-07-22 17:08:23'),
(4, 90000000.00, 'Total MM Fee (July 23rd)', '2026-07-22 17:40:53', '2026-07-22 17:40:53'),
(5, 5000000.00, 'Free on 641 Mage', '2026-07-22 22:37:34', '2026-07-22 22:37:34'),
(6, 4000000.00, '7/30 350 2x', '2026-07-23 06:09:29', '2026-07-23 06:09:29'),
(7, 2000000.00, '7/30 230', '2026-07-23 06:11:52', '2026-07-23 06:11:52'),
(8, 3000000.00, '7/31 3547', '2026-07-23 17:17:50', '2026-07-23 17:17:50'),
(9, 56000000.00, 'MM Fee from 2nd highest trade', '2026-07-27 17:08:46', '2026-07-27 17:08:46'),
(10, 2000000.00, '8/3 39', '2026-07-28 02:14:30', '2026-07-28 02:14:30'),
(11, 1500000.00, NULL, '2026-07-30 21:03:12', '2026-07-30 21:03:12'),
(12, 4000000.00, 'MM Fee', '2026-08-03 17:56:33', '2026-08-03 17:56:33'),
(13, 1000000.00, '3 Letters', '2026-08-03 22:47:34', '2026-08-03 22:47:34'),
(14, 4000000.00, 'MM Fee gold', '2026-08-04 17:37:31', '2026-08-04 17:37:31'),
(15, 2000000.00, '8/19 200', '2026-08-04 23:36:53', '2026-08-04 23:36:53'),
(16, 2000000.00, '8/12 730', '2026-08-05 16:58:04', '2026-08-05 16:58:04'),
(17, 2000000.00, '559kks trade', '2026-08-06 01:56:24', '2026-08-06 01:56:24'),
(18, 14000000.00, 'Pantay', '2026-08-11 18:36:49', '2026-08-11 18:36:49'),
(19, 2000000.00, '8/19 160', '2026-08-12 16:56:11', '2026-08-12 16:56:11'),
(20, 2000000.00, '8/20 200', '2026-08-12 23:11:06', '2026-08-12 23:11:06'),
(21, 2000000.00, '8/20 124', '2026-08-13 02:01:27', '2026-08-13 02:01:27'),
(22, 1000000.00, '8/26 85', '2026-08-13 17:13:24', '2026-08-13 17:13:24'),
(23, 1000000.00, '8/21 49', '2026-08-13 17:57:23', '2026-08-13 17:57:23'),
(24, 2000000.00, 'item trade', '2026-08-13 17:58:02', '2026-08-13 17:58:02'),
(25, 2000000.00, 'Pantay', '2026-08-14 17:23:46', '2026-08-14 17:23:46'),
(26, 2000000.00, '624kk', '2026-08-14 18:52:38', '2026-08-14 18:52:38'),
(27, 2000000.00, '8/22 450', '2026-08-14 23:15:22', '2026-08-14 23:15:22'),
(28, 2000000.00, '8/28 100', '2026-08-16 17:11:10', '2026-08-16 17:11:10'),
(29, 2000000.00, '8/26 580', '2026-08-18 22:37:27', '2026-08-18 22:37:27'),
(30, 1000000.00, 'Test MM feee 20kk', '2026-08-18 22:45:33', '2026-08-18 22:45:33'),
(31, 2000000.00, 'test ulit', '2026-08-18 23:00:15', '2026-08-18 23:00:15'),
(32, 2000000.00, '8/26 155', '2026-08-18 23:04:35', '2026-08-18 23:04:35'),
(33, 2000000.00, '8/25 133', '2026-08-19 00:03:42', '2026-08-19 00:03:42'),
(34, 2000000.00, '8/27 749', '2026-08-19 17:03:42', '2026-08-19 17:03:42'),
(35, 2000000.00, '8/27 100', '2026-08-19 17:04:02', '2026-08-19 17:04:02'),
(36, 2000000.00, '8/27 500', '2026-08-19 21:04:20', '2026-08-19 21:04:20'),
(37, 2000000.00, '8/31 119', '2026-08-23 17:22:11', '2026-08-23 17:22:11'),
(38, 2000000.00, '8/30 205', '2026-08-23 17:22:48', '2026-08-23 17:22:48'),
(39, 2000000.00, '8/28 485', '2026-08-23 17:23:15', '2026-08-23 17:23:15'),
(40, 1000000.00, '8/29 1.5', '2026-08-23 17:25:34', '2026-08-23 17:25:34'),
(41, 15000000.00, '8/27 1100 (Account Secure)', '2026-08-23 17:47:48', '2026-08-23 17:47:48'),
(42, 2000000.00, '8/28 130', '2026-08-23 17:48:21', '2026-08-23 17:48:21'),
(43, 7000000.00, 'MM Fee', '2026-08-23 17:51:34', '2026-08-23 17:51:34'),
(44, 1000000.00, '9/9 84', '2026-08-23 18:37:18', '2026-08-23 18:37:18'),
(45, 1000000.00, '9/1 30', '2026-08-24 23:11:27', '2026-08-24 23:11:27'),
(46, 2000000.00, '9/1 30 (after 3 days 160kk)', '2026-08-24 23:15:37', '2026-08-24 23:15:37'),
(47, 2000000.00, '9/2 81.5', '2026-08-26 05:26:24', '2026-08-26 05:26:24'),
(48, 1000000.00, '9/2 176.5', '2026-08-27 17:43:30', '2026-08-27 17:43:30'),
(49, 2000000.00, '384kk mm', '2026-08-27 17:51:05', '2026-08-27 17:51:05'),
(50, 1000000.00, 'MM Fee', '2026-08-27 17:54:30', '2026-08-27 17:54:30'),
(51, 2000000.00, '9/4 175', '2026-08-27 18:49:15', '2026-08-27 18:49:15'),
(52, 1000000.00, '9/4 450', '2026-08-28 00:44:04', '2026-08-28 00:44:04'),
(53, 2000000.00, '9/4 247', '2026-08-28 01:18:09', '2026-08-28 01:18:09'),
(54, 2000000.00, '9/4 720', '2026-08-28 05:20:49', '2026-08-28 05:20:49'),
(55, 2000000.00, 'Gold trade', '2026-08-28 21:35:22', '2026-08-28 21:35:22'),
(56, 2000000.00, 'gold mm fee', '2026-08-29 05:37:03', '2026-08-29 05:37:03'),
(57, 2000000.00, '9/9 1600', '2026-09-01 17:59:58', '2026-09-01 17:59:58'),
(58, 2000000.00, '9/10 3300', '2026-09-02 20:50:21', '2026-09-02 20:50:21'),
(59, 4000000.00, 'ananeko gold trade', '2026-09-03 04:05:07', '2026-09-03 04:05:07'),
(60, 2000000.00, '9/10 395', '2026-09-03 04:51:17', '2026-09-03 04:51:17'),
(61, 3000000.00, '9/3 176.5', '2026-09-03 17:38:04', '2026-09-03 17:38:04'),
(62, 2000000.00, 'MM gold fee', '2026-09-03 22:07:25', '2026-09-03 22:07:25'),
(63, 2000000.00, '9/11 133', '2026-09-04 00:05:50', '2026-09-04 00:05:50'),
(64, 15000000.00, 'Mm fee', '2026-09-05 18:19:49', '2026-09-05 18:19:49'),
(65, 2000000.00, '9/14 155', '2026-09-07 02:30:09', '2026-09-07 02:30:09'),
(66, 2000000.00, 'gold mm fee', '2026-09-07 17:59:36', '2026-09-07 17:59:36'),
(67, 2000000.00, '9/15 930', '2026-09-07 18:58:04', '2026-09-07 18:58:04'),
(68, 2000000.00, 'Gold mm fee', '2026-09-07 19:48:35', '2026-09-07 19:48:35'),
(69, 2000000.00, '9/16 228', '2026-09-08 15:44:32', '2026-09-08 15:44:32'),
(70, 2000000.00, NULL, '2026-09-08 16:39:48', '2026-09-08 16:39:48'),
(71, 2000000.00, 'gold mm fee', '2026-09-09 18:27:52', '2026-09-09 18:27:52'),
(72, 2000000.00, '9/17 800 + acc x acc', '2026-09-09 21:47:28', '2026-09-09 21:47:28'),
(73, 1000000.00, '9/18', '2026-09-10 19:12:32', '2026-09-10 19:12:32'),
(74, 1000000.00, '9/19 75', '2026-09-12 00:55:30', '2026-09-12 00:55:30'),
(75, 1000000.00, 'gold mm fee', '2026-09-14 00:34:13', '2026-09-14 00:34:13'),
(76, 2000000.00, '9/23 159', '2026-09-15 22:41:58', '2026-09-15 22:41:58'),
(77, 2000000.00, 'gold mm fee', '2026-09-16 19:23:27', '2026-09-16 19:23:27'),
(78, 2000000.00, '9/24 600', '2026-09-16 22:34:24', '2026-09-16 22:34:24'),
(79, 2000000.00, '9/24 123', '2026-09-17 00:02:01', '2026-09-17 00:02:01'),
(80, 2000000.00, '9/24 385', '2026-09-17 18:04:34', '2026-09-17 18:04:34'),
(81, 2000000.00, '9/26 3700', '2026-09-18 15:53:40', '2026-09-18 15:53:40'),
(82, 1000000.00, '9/26 3700', '2026-09-18 15:54:24', '2026-09-18 15:54:24'),
(83, 2000000.00, '9/26', '2026-09-19 07:33:12', '2026-09-19 07:33:12'),
(84, 2000000.00, '9/27 518', '2026-09-19 18:29:21', '2026-09-19 18:29:21'),
(85, 2000000.00, 'mm fee 127', '2026-09-19 19:42:52', '2026-09-19 19:42:52'),
(86, 1000000.00, '9/27 45', '2026-09-19 20:47:09', '2026-09-19 20:47:09');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
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
(28, '2026_07_09_054146_add_payment_date_to_rucoy_accounts_table', 2),
(29, '2026_07_22_000001_create_balance_entries_table', 3),
(30, '2026_07_23_000001_create_middleman_fees_table', 4),
(31, '2026_07_23_000002_add_fee_type_to_gold_logs_table', 5),
(32, '2026_07_23_000003_add_cancelled_at_to_gold_logs_table', 6),
(33, '2026_08_07_000001_create_activity_logs_table', 7),
(34, '2026_08_14_000001_add_user_scope_to_daily_tables', 8),
(35, '2026_08_19_000001_widen_rate_columns_on_business_transactions_table', 9),
(36, '2026_08_19_000002_add_gold_amount_columns_to_business_transactions_table', 10),
(37, '2026_08_24_000001_expand_balance_entries_account_enum', 11),
(38, '2026_09_15_000001_add_cost_php_rate_to_business_transactions_table', 12),
(39, '2026_09_18_091900_add_user_id_to_activity_logs_table', 12);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
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
(6, 'App\\Models\\User', 1, 'api-token', '4d2ac54090708eb17d187d4c2b5a7be4066e11cf18137d23b90ecd2ecd5bc66f', '[\"*\"]', NULL, NULL, '2026-07-07 02:03:56', '2026-07-07 02:03:56'),
(7, 'App\\Models\\User', 1, 'api-token', '2db3613d91fef2bd7b354743f8d84d6efa472b2c1194cbdc02594a5b67fbe9dd', '[\"*\"]', NULL, NULL, '2026-07-14 18:05:25', '2026-07-14 18:05:25'),
(8, 'App\\Models\\User', 1, 'api-token', '22e637e17be4dc59a283db6578432221d60849b0a28859cd24c04a1688a098b0', '[\"*\"]', NULL, NULL, '2026-07-14 21:53:19', '2026-07-14 21:53:19'),
(9, 'App\\Models\\User', 1, 'api-token', '4aac86f17223f7a8c535788a0eb93e9f66b10216e3b7694391856e0f88ab1eb5', '[\"*\"]', NULL, NULL, '2026-07-15 00:24:55', '2026-07-15 00:24:55'),
(18, 'App\\Models\\User', 1, 'api-token', 'df44ce784432cd6c35a94004ba706909399053f19694a71b17e0a1c88a48178c', '[\"*\"]', '2026-08-14 00:52:42', NULL, '2026-08-13 21:00:04', '2026-08-14 00:52:42'),
(19, 'App\\Models\\User', 1, 'api-token', '2de8d48012c189419702f168f830967ace00a023db6a901c80ab9ac5eab00d47', '[\"*\"]', '2026-08-16 22:49:37', NULL, '2026-08-14 00:52:58', '2026-08-16 22:49:37'),
(21, 'App\\Models\\User', 1, 'api-token', 'c53db9a807992ad15aebb421df8d756eb95cab3ae1b0356d8fe1b50ae85afc20', '[\"*\"]', '2026-08-18 21:02:41', NULL, '2026-08-18 18:40:58', '2026-08-18 21:02:41'),
(22, 'App\\Models\\User', 1, 'api-token', '0fd0e5ac4464a42cf0fa693e2dddede4f4b51333bc423cfc58d021f4c9343508', '[\"*\"]', '2026-08-18 21:21:47', NULL, '2026-08-18 21:02:58', '2026-08-18 21:21:47'),
(23, 'App\\Models\\User', 1, 'api-token', '05b2d899718386a623133d4879ca8a5e4977a418a78ec148e368b574cb025a5a', '[\"*\"]', '2026-08-18 22:33:27', NULL, '2026-08-18 21:23:28', '2026-08-18 22:33:27'),
(24, 'App\\Models\\User', 1, 'api-token', '5c528404c79ee7bbd04dac394dcb53b179e19f4af75809f1081e6376cbcd9de4', '[\"*\"]', '2026-08-18 22:33:42', NULL, '2026-08-18 22:33:35', '2026-08-18 22:33:42'),
(25, 'App\\Models\\User', 1, 'api-token', 'f20ac1ae5da4482d623cbfcf10715ef2b0b3b8955be0beefee01e6ef8bdbbc92', '[\"*\"]', '2026-08-18 22:34:14', NULL, '2026-08-18 22:33:51', '2026-08-18 22:34:14'),
(26, 'App\\Models\\User', 1, 'api-token', 'a469bb3eaf8189f70bf09dd6e3792863e5afe57606f4c7fa30859b08453fedcb', '[\"*\"]', '2026-08-18 22:44:16', NULL, '2026-08-18 22:34:30', '2026-08-18 22:44:16'),
(29, 'App\\Models\\User', 1, 'api-token', '1bb34e2904b00d86a430271b79c83805863b2bac73a2790328648934fb39b448', '[\"*\"]', '2026-08-19 19:40:37', NULL, '2026-08-19 01:30:53', '2026-08-19 19:40:37'),
(30, 'App\\Models\\User', 1, 'api-token', '0ab1ee8b4a95caaf9029a1f7deb22fcaf9f87e1bc5d645d41e48a61f5c7f539b', '[\"*\"]', '2026-08-23 19:57:11', NULL, '2026-08-19 19:40:45', '2026-08-23 19:57:11'),
(31, 'App\\Models\\User', 1, 'api-token', '5d6191141a8b3b14712cc20af663869a0e56a3de2f51568d0454a44b1ae677f0', '[\"*\"]', '2026-08-24 23:06:41', NULL, '2026-08-23 19:57:30', '2026-08-24 23:06:41'),
(32, 'App\\Models\\User', 1, 'api-token', 'f12696f62570f6c9b41592a766b130d8e228540a9ea97f1e9e03c701f0a6549e', '[\"*\"]', '2026-08-24 23:27:48', NULL, '2026-08-24 23:06:59', '2026-08-24 23:27:48'),
(33, 'App\\Models\\User', 1, 'api-token', '6044f8e3506f32b064c9c350d820d4792605973369b544e058b919ab9255fd3f', '[\"*\"]', '2026-08-24 23:39:58', NULL, '2026-08-24 23:28:07', '2026-08-24 23:39:58'),
(34, 'App\\Models\\User', 1, 'api-token', '5cc3b23da931d997bf81e2b45a3add4358518267d0d5e50f8fc25ed60f67ede3', '[\"*\"]', '2026-08-26 00:45:19', NULL, '2026-08-24 23:40:14', '2026-08-26 00:45:19'),
(36, 'App\\Models\\User', 1, 'api-token', 'abbc8fe14827a4ba8fee289697eb097f5f3f7d105729621d4e9dd5fb26851e6e', '[\"*\"]', '2026-08-26 14:57:25', NULL, '2026-08-26 01:48:45', '2026-08-26 14:57:25'),
(38, 'App\\Models\\User', 1, 'api-token', 'c79cd677b9fad3da71c5f256cfc9c44c70ea8c52d375865eeb467b13b694fc2e', '[\"*\"]', '2026-08-26 19:09:54', NULL, '2026-08-26 02:24:06', '2026-08-26 19:09:54'),
(42, 'App\\Models\\User', 1, 'api-token', '979157eb9857cef7775589dad49cd145002a45989d310764e04261f9ea25af3d', '[\"*\"]', '2026-09-17 17:44:26', NULL, '2026-08-28 20:50:29', '2026-09-17 17:44:26'),
(47, 'App\\Models\\User', 1, 'api-token', '84fca769dac6498e949453a6c3712f06920a656ba78fd9cfed6ce424283187f5', '[\"*\"]', '2026-09-06 21:32:35', NULL, '2026-08-31 17:59:47', '2026-09-06 21:32:35'),
(48, 'App\\Models\\User', 1, 'api-token', 'caf54d9eaed53471be82ca4f69ee12d86f91b741529c16272dc89d78a0ecb089', '[\"*\"]', '2026-09-14 19:51:38', NULL, '2026-08-31 18:03:51', '2026-09-14 19:51:38'),
(49, 'App\\Models\\User', 1, 'api-token', '4f47de4b929a95be669fa91e1fdccfce1e58fa6fcbafcd9b19ddfb92833370d5', '[\"*\"]', '2026-09-10 19:31:02', NULL, '2026-09-06 21:36:42', '2026-09-10 19:31:02'),
(51, 'App\\Models\\User', 1, 'api-token', 'ba3ca0818ed14b09ba3015618c34a3ce30ee595e7204cc4be0047b21ef734fe6', '[\"*\"]', '2026-09-14 19:47:36', NULL, '2026-09-14 18:14:22', '2026-09-14 19:47:36'),
(52, 'App\\Models\\User', 1, 'api-token', '12c9364915d758c1beacefb24b72c84136c394e734827704ec60277d522ffe7e', '[\"*\"]', '2026-09-14 18:41:43', NULL, '2026-09-14 18:26:06', '2026-09-14 18:41:43'),
(53, 'App\\Models\\User', 1, 'api-token', '4c0884a6372832a24132deffb517109287843079899d47e6ccaed8ab266de685', '[\"*\"]', '2026-09-18 00:48:20', NULL, '2026-09-14 19:53:18', '2026-09-18 00:48:20'),
(54, 'App\\Models\\User', 5, 'api-token', '23f734861afd441629fb719fc3825ed96efd59ee2dc4ffe0e819953db4705fb5', '[\"*\"]', '2026-09-17 15:51:40', NULL, '2026-09-17 04:10:49', '2026-09-17 15:51:40'),
(55, 'App\\Models\\User', 1, 'api-token', '2744f2e743a674b73e7e30d8948b51295b9b246c48f2e0546882cd33c0c10d9f', '[\"*\"]', '2026-09-17 23:34:00', NULL, '2026-09-17 16:44:17', '2026-09-17 23:34:00'),
(56, 'App\\Models\\User', 1, 'api-token', '0a0e46aea9298b0268ed50701360405e70c65fbbb695487b31112976a7b859fc', '[\"*\"]', '2026-09-18 17:35:51', NULL, '2026-09-18 15:24:02', '2026-09-18 17:35:51'),
(57, 'App\\Models\\User', 1, 'api-token', '48922e6194489a3a2bf8e3093c375028a0ecb1cb1719d5d325ada2a9c1d74cee', '[\"*\"]', '2026-09-20 03:57:03', NULL, '2026-09-19 07:32:52', '2026-09-20 03:57:03');

-- --------------------------------------------------------

--
-- Table structure for table `rucoy_accounts`
--

CREATE TABLE `rucoy_accounts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `description` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  `cost` decimal(12,2) DEFAULT NULL,
  `payment_status` enum('not_paid','partially_paid','fully_paid') NOT NULL DEFAULT 'not_paid',
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
(2, 'Leblanc 702 Melee', 'chrystianrodrigues445@gmail.com', NULL, 5800000000.00, 5000000000.00, 'fully_paid', NULL, '2026-07-12 14:57:45', '2026-06-30 22:57:26', '2026-07-12 14:57:45'),
(3, 'Leblanc 648 Dist', 'johncurlyofficial@gmail.com', NULL, 3400000000.00, 2400000000.00, 'fully_paid', NULL, NULL, '2026-06-30 22:58:28', '2026-08-19 00:43:27'),
(4, 'Leblanc 632 Dist', 'mauricio.nto@gmail.com', NULL, 2500000000.00, 1900000000.00, 'fully_paid', NULL, '2026-08-24 22:39:18', '2026-06-30 22:59:04', '2026-08-24 22:39:18'),
(6, 'Leblanc 618 Dist', 'michaelbernal547@gmail.com', NULL, 1500000000.00, 1500000000.00, 'fully_paid', NULL, '2026-07-09 17:08:42', '2026-07-01 18:09:11', '2026-07-09 17:08:42'),
(7, 'Leblanc 624 Melee', 'msgamer273@gmail.com', NULL, 2150000000.00, 1900000000.00, 'fully_paid', NULL, '2026-09-15 16:46:14', '2026-07-02 17:29:37', '2026-09-15 16:46:14'),
(8, 'Leblanc 600 Melee', 'uzeroa6@gmail.com', NULL, 1000000000.00, 750000000.00, 'fully_paid', NULL, '2026-08-03 17:27:50', '2026-07-02 17:31:23', '2026-08-03 17:27:50'),
(9, '1.871kk (.16$ rate)', 'leblancrucoys@gmail.com', NULL, 1871000000.00, 1871000000.00, 'fully_paid', NULL, '2026-07-20 17:43:55', '2026-07-08 05:59:59', '2026-07-20 17:43:55'),
(10, 'Leblanc 560 Mage', 'muhammadse53@gmail.com', NULL, 650000000.00, 0.00, 'fully_paid', NULL, '2026-07-27 17:43:59', '2026-07-09 18:10:49', '2026-07-27 17:43:59'),
(11, 'Leblanc 642 Melee', 'zeta24595@gmail.com', NULL, 2300000000.00, 2100000000.00, 'fully_paid', NULL, '2026-08-28 21:42:26', '2026-07-11 23:15:51', '2026-08-28 21:42:26'),
(13, '2569kk (.17$ rate)', 'leblancrucoys@gmail.com', NULL, 2569000000.00, 2569000000.00, 'fully_paid', NULL, '2026-07-23 21:22:28', '2026-07-20 17:43:14', '2026-07-23 21:22:28'),
(14, '318kk (.22$ paypal)', 'leblancrucoys@gmail.com', NULL, 318000000.00, 318000000.00, 'fully_paid', NULL, '2026-07-21 16:53:26', '2026-07-21 16:47:30', '2026-07-21 16:53:26'),
(15, 'MM Fee', 'leblancrucoys@gmail.com', NULL, 163500000.00, 0.00, 'fully_paid', NULL, '2026-08-03 17:29:16', '2026-07-22 17:42:00', '2026-08-03 17:29:16'),
(16, 'Leblanc 596 Magic', 'vitorlucasdossantos0000@gmail.com', NULL, 1000000000.00, 655000000.00, 'fully_paid', NULL, '2026-08-16 21:07:39', '2026-07-22 18:53:21', '2026-08-16 21:07:39'),
(17, 'Leblanc 641 Magic', 'accpratop1@gmail.com', NULL, 2400000000.00, 1900000000.00, 'fully_paid', NULL, NULL, '2026-07-22 22:09:25', '2026-08-19 00:42:48'),
(18, 'Leblanc 614 Melee', 'Tsanimuhammad908@gmail.com', NULL, 1150000000.00, 960000000.00, 'fully_paid', NULL, '2026-08-11 18:09:26', '2026-07-22 22:32:04', '2026-08-11 18:09:26'),
(19, 'Leblanc 632 Melee', 'anotheraltomg@gmail.com', NULL, 2000000000.00, 1600000000.00, 'fully_paid', NULL, '2026-08-24 22:34:20', '2026-07-28 17:29:40', '2026-08-24 22:34:20'),
(20, '927kk (.22$) Paypal', 'leblancrucoys@gmail.com', NULL, 927000000.00, 927000000.00, 'fully_paid', NULL, '2026-08-03 18:18:11', '2026-08-03 17:58:08', '2026-08-03 18:18:11'),
(21, '899kk (.2$)', 'leblancrucoys@gmail.com', NULL, 899000000.00, 899000000.00, 'fully_paid', NULL, '2026-08-03 18:26:59', '2026-08-03 18:21:20', '2026-08-03 18:26:59'),
(22, 'Leblanc 641 Dist', 'luisjhonpogi@gmail.com', NULL, 3300000000.00, 2500000000.00, 'fully_paid', NULL, NULL, '2026-08-03 18:51:11', '2026-08-11 18:23:43'),
(23, '454kk (.22$) paypal', 'leblancrucoys@gmail.com', NULL, 454000000.00, 454000000.00, 'fully_paid', NULL, '2026-08-11 18:23:26', '2026-08-05 17:03:52', '2026-08-11 18:23:26'),
(24, 'Leblanc 582 Dist', 'muhamad.septiana15@gmail.com', NULL, 961525688.00, 600000000.00, 'fully_paid', NULL, '2026-08-28 17:46:31', '2026-08-06 17:49:27', '2026-08-28 17:46:31'),
(25, '2kkk gold .185 euro', 'leblancrucoys@gmail.com', NULL, 2000000000.00, 2000000000.00, 'fully_paid', NULL, '2026-08-11 18:20:09', '2026-08-11 18:12:29', '2026-08-11 18:20:09'),
(26, '2kkk gold .21$', 'leblancrucoys@gmail.com', NULL, 2000000000.00, 2000000000.00, 'fully_paid', NULL, '2026-08-13 19:27:34', '2026-08-13 19:25:17', '2026-08-13 19:27:34'),
(27, '180kk (.22$) paypal', 'leblancrucoys@gmail.com', NULL, 180000000.00, 180000000.00, 'fully_paid', NULL, '2026-08-14 20:57:51', '2026-08-14 20:56:19', '2026-08-14 20:57:51'),
(28, '480kk (.2$) binance', 'leblancrucoys@gmail.com', NULL, 480000000.00, 480000000.00, 'not_paid', NULL, '2026-08-16 17:36:48', '2026-08-16 17:35:54', '2026-08-16 17:36:48'),
(29, '900kk (.175)', 'leblancrucoys@gmail.com', NULL, 900000000.00, 900000000.00, 'not_paid', NULL, '2026-08-18 17:49:53', '2026-08-18 17:46:31', '2026-08-18 17:49:53'),
(30, '150kk (.165$ binance)', 'leblancrucoys@gmail.com', NULL, 150000000.00, 150000000.00, 'not_paid', NULL, '2026-08-18 17:52:58', '2026-08-18 17:50:55', '2026-08-18 17:52:58'),
(31, '950kk (.21$ paypal)', 'leblancrucoys@gmail.com', NULL, 950000000.00, 950000000.00, 'not_paid', NULL, '2026-08-18 17:55:35', '2026-08-18 17:53:55', '2026-08-18 17:55:35'),
(32, 'Leblanc 637 Dist', 'rafa12galmeida@gmail.com', NULL, 2500000000.00, 1925000000.00, 'partially_paid', '2027-01-10', NULL, '2026-08-18 22:08:16', '2026-09-10 18:54:18'),
(33, 'Leblanc 621 Dist', 'ptraindist02@gmail.com', NULL, 1300000000.00, 1000000000.00, 'fully_paid', NULL, NULL, '2026-08-24 23:04:46', '2026-08-24 23:04:46'),
(34, 'Leblanc 561 Mage', 'muhammadse53@gmail.com', NULL, 600000000.00, 500000000.00, 'fully_paid', NULL, NULL, '2026-08-28 17:50:07', '2026-08-28 17:50:07'),
(35, 'Leblanc 632 Melee', 'anotheraltomg@gmail.com', NULL, 2000000000.00, 1600000000.00, 'fully_paid', NULL, NULL, '2026-09-01 17:52:00', '2026-09-10 17:07:47'),
(36, 'Leblanc 586 Magic', 'dechavezmike68@gmail.com', NULL, 800000000.00, 570000000.00, 'fully_paid', NULL, NULL, '2026-09-01 19:13:47', '2026-09-10 17:07:41'),
(37, 'Leblanc 514 Dist', 'vegenabob484@gmail.com', NULL, 250000000.00, 190000000.00, 'fully_paid', NULL, NULL, '2026-09-01 19:15:06', '2026-09-10 17:07:37'),
(38, 'Leblanc 583 Dist', 'rucoybuyandsell@gmail.com', NULL, 800000000.00, 540000000.00, 'fully_paid', NULL, NULL, '2026-09-01 19:30:31', '2026-09-10 17:07:29'),
(39, 'Leblanc 510 Dist', 'stink3003mc@gmail.com', NULL, 250000000.00, 118000000.00, 'not_paid', '2026-09-18', '2026-09-18 00:23:28', '2026-09-10 17:20:50', '2026-09-18 00:23:28'),
(40, 'Leblanc 609 Dist', 'peytenbiyikliffako@gmail.com', NULL, 1200000000.00, 900000000.00, 'not_paid', '2026-09-26', NULL, '2026-09-18 17:14:22', '2026-09-18 17:14:22');

-- --------------------------------------------------------

--
-- Table structure for table `savings`
--

CREATE TABLE `savings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `mode_of_payment` enum('CIMB','MARIBANK','GCASH') NOT NULL,
  `type` enum('deposit','withdraw') NOT NULL,
  `transfer` enum('daily_expenses','business') DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `savings`
--

INSERT INTO `savings` (`id`, `mode_of_payment`, `type`, `transfer`, `description`, `amount`, `date`, `created_at`, `updated_at`) VALUES
(9, 'CIMB', 'deposit', NULL, 'Overall', 163605.00, '2026-07-10', '2026-07-09 17:44:15', '2026-07-09 17:44:25'),
(10, 'CIMB', 'withdraw', NULL, 'Pakak', 4472.62, '2026-07-21', '2026-07-20 19:57:42', '2026-07-20 19:57:42'),
(11, 'CIMB', 'deposit', NULL, 'Sold 1050 (.2 Gcash)', 9049.51, '2026-07-28', '2026-07-27 17:15:14', '2026-07-27 17:15:14'),
(12, 'MARIBANK', 'deposit', NULL, NULL, 10180.01, '2026-07-30', '2026-07-29 19:33:08', '2026-07-29 19:33:08'),
(13, 'CIMB', 'withdraw', NULL, 'tiktok ilaw', 3970.00, '2026-07-30', '2026-07-30 01:48:49', '2026-07-30 01:48:49'),
(14, 'CIMB', 'withdraw', NULL, 'bby', 4000.00, '2026-07-31', '2026-07-30 19:48:51', '2026-07-30 19:48:51'),
(15, 'CIMB', 'withdraw', NULL, '.17 gcash', 3000.00, '2026-07-31', '2026-07-30 19:49:05', '2026-07-30 19:49:05'),
(16, 'MARIBANK', 'deposit', NULL, NULL, 21363.19, '2026-08-05', '2026-08-04 19:15:10', '2026-08-04 19:15:10'),
(17, 'GCASH', 'withdraw', NULL, NULL, 3117.37, '2026-08-12', '2026-08-11 18:48:42', '2026-08-11 18:48:42'),
(18, 'MARIBANK', 'deposit', NULL, NULL, 16341.59, '2026-08-20', '2026-08-19 17:39:08', '2026-08-19 17:39:08'),
(19, 'MARIBANK', 'deposit', NULL, NULL, 16069.97, '2026-08-24', '2026-08-23 21:13:25', '2026-08-23 21:13:25');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('27rsxNzA9FPzO48OCoBACeExGi5jdJ4dvQEZp7Sk', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoicnFZVENabGNOeldWYTF3WGJvRE9IbnVhSjU3UFYzakxKVEV6enY3ZSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1789438432),
('7MpKjAawmC0qGVqJUi5gjjOGktMhNr6pKlkJMrN1', NULL, '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.51 Mobile/15E148 Safari/604.1', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiNWt0bVVpbm96b0cxamQxbndxWDVXNXo5MmtZZ0FGdVZTZk04MDJmRiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjY6Imh0dHA6Ly8xMDAuODEuMjIuMTE2L3J1Y295IjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1783867793),
('c3dIqa22QFGyaVjOadYCRC2YFaTEp5jKn1c8HqxV', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiaDhFdlo2ZnUxMUJibUhWZ2t1YkRJS2JnNnhPWDh5OHhoQ3dBQnBkTSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MTg6Imh0dHA6Ly9idWRnZXQudGVzdCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1784080379),
('cjrkOSuCy8G7bbRdAbXA2ACVfK2T2NJRz10e7fmh', NULL, '192.168.1.151', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiQXl6VXBONXAzYnZ2QlFtR0M3cVdPd1R6V29GNDNBYzFXUTB4YU93VSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6NjQ6Imh0dHA6Ly8xOTIuMTY4LjEuMjIwL0xhbW9peWFuL2JhY2tlbmQvcHVibGljL2FwaS9kYXNoYm9hcmQvc3RhdHMiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1787739697),
('lrRCl8jrdr78hfcby84nPcQlmFFjpn5hs4KzF1dc', NULL, '192.168.1.151', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoid0FTNUE3U0JSZDNIMzlQREZNWnJuckZoU2pzUGFrNjU3aHkxWW9VcSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6NTg6Imh0dHA6Ly8xOTIuMTY4LjEuMjIwL0xhbW9peWFuL2JhY2tlbmQvcHVibGljL2FwaS9jb21wYW5pZXMiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1787796019),
('NB1dgGpvshg9cc4y11FBcaFlMkJjNlj2rrZZD2CG', NULL, '100.105.230.63', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiU3UzTHl0N1VhUWNFSWVwaWNoUndwbERNVmhRdEFqdU1TM0xPYUFjRCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjk6Imh0dHA6Ly8xMDAuODEuMjIuMTE2L2J1c2luZXNzIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1783935258),
('xvTtaGNCAZF8a1yQTayLyl8vkIJkqRcvqFVeVLic', NULL, '100.81.22.116', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiZThpd2NLOG9SRlF1aHRGYlpuYTdGRG5qRlM1djd1NjNRQlJaSTRzQiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzI6Imh0dHA6Ly8xMDAuODEuMjIuMTE2L3J1Y295L2dvbGRzIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1783842208);

-- --------------------------------------------------------

--
-- Table structure for table `trades`
--

CREATE TABLE `trades` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `gold_id` bigint(20) UNSIGNED DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` enum('kks','cash') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `currency` varchar(3) DEFAULT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `completion_date` date DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `trades`
--

INSERT INTO `trades` (`id`, `gold_id`, `description`, `status`, `amount`, `currency`, `payment_method`, `completion_date`, `archived_at`, `created_at`, `updated_at`) VALUES
(1, NULL, '7/6 330', 'kks', 330000000.00, NULL, NULL, '2026-07-06', '2026-07-06 20:01:36', '2026-06-30 23:20:25', '2026-07-06 20:01:36'),
(2, NULL, '7/25 €2351 + 781 Melee x TOP 3 Melee', 'cash', 2351.00, 'EUR', 'paypal', '2026-07-24', '2026-08-11 17:26:46', '2026-07-01 00:22:27', '2026-08-11 17:26:46'),
(3, NULL, '7/4 69', 'kks', 69000000.00, NULL, NULL, '2026-07-04', '2026-07-05 17:00:11', '2026-07-01 00:23:34', '2026-07-05 17:00:11'),
(4, NULL, '7/1 600', 'kks', 600000000.00, NULL, NULL, '2026-07-01', '2026-07-01 17:43:14', '2026-07-01 00:27:15', '2026-07-01 17:43:14'),
(5, NULL, '7/7 120', 'kks', 120000000.00, NULL, NULL, '2026-07-07', '2026-07-08 06:08:23', '2026-07-01 00:28:48', '2026-07-08 06:08:23'),
(6, NULL, '7/3 188', 'kks', 188000000.00, NULL, NULL, '2026-07-03', '2026-07-02 21:19:41', '2026-07-01 00:29:17', '2026-07-02 21:19:41'),
(7, NULL, '7/5 1080', 'kks', 1080000000.00, NULL, NULL, '2026-07-05', '2026-07-05 17:33:38', '2026-07-01 00:29:53', '2026-07-05 17:33:38'),
(8, NULL, '7/2 300', 'kks', 300000000.00, NULL, NULL, '2026-07-02', '2026-07-05 17:03:48', '2026-07-01 00:30:27', '2026-07-05 17:03:48'),
(9, NULL, '7/6 800', 'kks', 800000000.00, NULL, NULL, '2026-07-06', '2026-07-08 05:53:57', '2026-07-01 00:30:52', '2026-07-08 05:53:57'),
(10, NULL, '7/27 328', 'kks', 328000000.00, NULL, NULL, '2026-07-27', '2026-07-28 17:35:51', '2026-07-01 00:31:08', '2026-07-28 17:35:51'),
(11, NULL, '7/7 15', 'kks', 15000000.00, NULL, NULL, '2026-07-07', '2026-07-08 09:02:47', '2026-07-01 00:31:27', '2026-07-08 09:02:47'),
(12, NULL, '7/3 2398', 'kks', 2398000000.00, NULL, NULL, '2026-07-03', '2026-07-05 17:04:06', '2026-07-01 00:31:49', '2026-07-05 17:04:06'),
(13, NULL, '7/7 430', 'kks', 430000000.00, NULL, NULL, '2026-07-07', '2026-07-08 05:57:00', '2026-07-01 00:32:06', '2026-07-08 05:57:00'),
(14, NULL, '6/28 22', 'kks', 22000000.00, NULL, NULL, '2026-06-22', '2026-07-14 18:48:45', '2026-07-01 00:46:25', '2026-07-14 18:48:45'),
(17, NULL, '7/8 440', 'kks', 440000000.00, NULL, NULL, '2026-07-08', '2026-07-09 00:36:07', '2026-07-01 16:56:15', '2026-07-09 00:36:07'),
(18, NULL, '7/8 29', 'kks', 29000000.00, NULL, NULL, '2026-07-08', '2026-07-09 00:36:45', '2026-07-01 16:57:03', '2026-07-09 00:36:45'),
(19, NULL, '7/9 55', 'kks', 55000000.00, NULL, NULL, '2026-07-09', '2026-07-10 00:54:04', '2026-07-02 17:59:58', '2026-07-10 00:54:04'),
(20, NULL, '7/10 265', 'kks', 265000000.00, NULL, NULL, '2026-07-10', '2026-07-09 21:59:04', '2026-07-02 21:22:03', '2026-07-09 21:59:04'),
(21, NULL, '7/14 344', 'kks', 344000000.00, NULL, NULL, '2026-07-14', '2026-07-11 23:06:25', '2026-07-05 17:28:36', '2026-07-11 23:06:25'),
(22, NULL, '7/13 598', 'kks', 598000000.00, NULL, NULL, '2026-07-13', '2026-07-14 18:53:01', '2026-07-05 18:32:20', '2026-07-14 18:53:01'),
(23, NULL, '7/13 140 + Swift', 'kks', 140000000.00, NULL, NULL, '2026-07-13', '2026-07-13 01:34:39', '2026-07-05 23:57:47', '2026-07-13 01:34:39'),
(24, NULL, '7/14 335', 'kks', 335000000.00, NULL, NULL, '2026-07-14', '2026-07-14 18:53:54', '2026-07-06 18:39:57', '2026-07-14 18:53:54'),
(25, NULL, '1080', 'kks', 1080000000.00, NULL, NULL, '2026-07-08', '2026-07-09 00:40:57', '2026-07-08 06:01:16', '2026-07-09 00:40:57'),
(26, NULL, '7/14 220', 'kks', 220000000.00, NULL, NULL, '2026-07-14', '2026-07-14 19:00:14', '2026-07-08 06:14:15', '2026-07-14 19:00:14'),
(27, NULL, '7/16 3800', 'kks', 3800000000.00, NULL, NULL, '2026-07-16', '2026-07-15 17:31:16', '2026-07-09 00:38:24', '2026-07-15 17:31:16'),
(28, NULL, '7/16 130', 'kks', 130000000.00, NULL, NULL, NULL, '2026-07-09 21:20:09', '2026-07-09 06:30:37', '2026-07-09 21:20:09'),
(29, NULL, '7/18 360', 'kks', 360000000.00, NULL, NULL, '2026-07-18', '2026-07-17 22:38:46', '2026-07-11 23:08:37', '2026-07-17 22:38:46'),
(30, NULL, '7/20 129', 'kks', 129000000.00, NULL, NULL, '2026-07-20', '2026-07-13 01:40:04', '2026-07-11 23:09:13', '2026-07-13 01:40:04'),
(31, NULL, '7/19 83', 'kks', 83000000.00, NULL, NULL, '2026-07-19', '2026-07-12 17:48:30', '2026-07-12 06:37:46', '2026-07-12 17:48:30'),
(32, NULL, '7/24 54', 'kks', 54000000.00, NULL, NULL, '2026-07-24', '2026-07-22 17:31:20', '2026-07-14 18:50:31', '2026-07-22 17:31:20'),
(33, NULL, '7/20 1050', 'kks', 1050000000.00, NULL, NULL, '2026-07-20', '2026-07-20 17:59:48', '2026-07-14 18:51:09', '2026-07-20 17:59:48'),
(34, NULL, '7/21 450', 'kks', 450000000.00, NULL, NULL, '2026-07-21', '2026-07-20 17:50:16', '2026-07-14 18:52:49', '2026-07-20 17:50:16'),
(35, NULL, '7/26 12.4', 'kks', 12400000.00, NULL, NULL, '2026-07-26', '2026-07-21 00:56:02', '2026-07-20 17:17:17', '2026-07-21 00:56:02'),
(36, NULL, '7/27 3397', 'kks', 3397000000.00, NULL, NULL, '2026-07-27', '2026-07-27 16:57:09', '2026-07-20 17:18:23', '2026-07-27 16:57:09'),
(37, NULL, '7/27 49 + Recovery Set', 'kks', 49000000.00, NULL, NULL, '2026-07-27', '2026-07-27 19:08:17', '2026-07-20 17:19:17', '2026-07-27 19:08:17'),
(38, NULL, '7/27 44', 'kks', 44000000.00, NULL, NULL, '2026-07-27', '2026-07-28 02:12:04', '2026-07-20 17:21:27', '2026-07-28 02:12:04'),
(39, NULL, '7/29 11', 'kks', 11000000.00, NULL, NULL, '2026-07-29', '2026-07-30 16:45:11', '2026-07-22 17:32:30', '2026-07-30 16:45:11'),
(40, NULL, '7/30 350', 'kks', 350000000.00, NULL, NULL, '2026-07-30', '2026-07-30 16:45:17', '2026-07-23 06:08:22', '2026-07-30 16:45:17'),
(41, NULL, '7/30 350', 'kks', 350000000.00, NULL, NULL, '2026-07-30', '2026-07-30 16:45:15', '2026-07-23 06:09:02', '2026-07-30 16:45:15'),
(42, NULL, '7/30 230', 'kks', 230000000.00, NULL, NULL, '2026-07-30', '2026-08-03 17:13:44', '2026-07-23 06:11:32', '2026-08-03 17:13:44'),
(43, NULL, '7/31 3547', 'kks', 3547000000.00, NULL, NULL, '2026-07-31', '2026-07-31 18:06:28', '2026-07-23 17:17:29', '2026-07-31 18:06:28'),
(44, NULL, '8/2 200', 'kks', 200000000.00, NULL, NULL, '2026-08-02', '2026-08-03 17:13:30', '2026-07-27 16:52:04', '2026-08-03 17:13:30'),
(45, NULL, '9/9 70', 'kks', 70000000.00, NULL, NULL, '2026-09-09', '2026-08-23 22:52:06', '2026-07-27 16:54:45', '2026-08-23 22:52:06'),
(46, NULL, '8/3 250', 'kks', 250000000.00, NULL, NULL, '2026-08-03', '2026-08-03 17:15:31', '2026-07-27 16:55:08', '2026-08-03 17:15:31'),
(47, NULL, '8/3 39', 'kks', 39000000.00, NULL, NULL, '2026-08-03', '2026-08-04 17:23:58', '2026-07-27 16:55:39', '2026-08-04 17:23:58'),
(48, NULL, '9/4 65', 'kks', 65000000.00, NULL, NULL, '2026-09-04', '2026-09-02 19:49:48', '2026-07-28 00:28:13', '2026-09-02 19:49:48'),
(49, NULL, '8/6 45', 'kks', 45000000.00, NULL, NULL, '2026-08-06', '2026-08-06 16:57:28', '2026-07-30 16:54:09', '2026-08-06 16:57:28'),
(50, NULL, '8/9 397', 'kks', 397000000.00, NULL, NULL, '2026-08-09', '2026-08-11 17:28:10', '2026-08-03 17:16:22', '2026-08-11 17:28:10'),
(51, NULL, '8/9 160', 'kks', 160000000.00, NULL, NULL, '2026-08-09', '2026-08-11 17:27:19', '2026-08-03 17:16:49', '2026-08-11 17:27:19'),
(52, NULL, '8/4 25', 'kks', 25000000.00, NULL, NULL, '2026-08-04', '2026-08-03 22:47:11', '2026-08-03 17:17:44', '2026-08-03 22:47:11'),
(53, NULL, '9/9 84', 'kks', 84000000.00, NULL, NULL, '2026-09-09', '2026-08-24 17:02:10', '2026-08-03 17:21:19', '2026-08-24 17:02:10'),
(54, NULL, '8/11 360', 'kks', 360000000.00, NULL, NULL, '2026-08-11', '2026-08-11 17:27:03', '2026-08-04 17:35:35', '2026-08-11 17:27:03'),
(55, NULL, '8/19 200', 'kks', 200000000.00, NULL, NULL, '2026-08-19', '2026-08-18 23:59:36', '2026-08-04 23:36:12', '2026-08-18 23:59:36'),
(56, NULL, '8/12 730', 'kks', 730000000.00, NULL, NULL, '2026-08-12', '2026-08-12 19:43:45', '2026-08-05 06:14:15', '2026-08-12 19:43:45'),
(57, NULL, '8/14 168', 'kks', 168000000.00, NULL, NULL, '2026-08-14', '2026-08-14 17:25:11', '2026-08-11 17:30:24', '2026-08-14 17:25:11'),
(58, NULL, '8/16 8', 'kks', 8000000.00, NULL, NULL, '2026-08-16', '2026-08-16 17:15:32', '2026-08-11 17:31:29', '2026-08-16 17:15:32'),
(59, NULL, '8/18 180', 'kks', 180000000.00, NULL, NULL, '2026-08-18', '2026-08-18 16:49:23', '2026-08-11 17:32:30', '2026-08-18 16:49:23'),
(60, NULL, '8/18 220', 'kks', 220000000.00, NULL, NULL, '2026-08-18', '2026-08-18 19:30:31', '2026-08-11 17:32:56', '2026-08-18 19:30:31'),
(61, NULL, '8/18 128', 'kks', 128000000.00, NULL, NULL, '2026-08-18', '2026-08-23 17:17:41', '2026-08-11 17:33:56', '2026-08-23 17:17:41'),
(62, NULL, '8/26 2000', 'kks', 2000000000.00, NULL, NULL, '2026-08-26', '2026-08-26 04:28:02', '2026-08-11 17:35:40', '2026-08-26 04:28:02'),
(63, NULL, '8/21 85', 'kks', 85000000.00, NULL, NULL, '2026-08-21', '2026-08-25 17:06:52', '2026-08-11 18:18:07', '2026-08-25 17:06:52'),
(64, NULL, '8/19 160', 'kks', 160000000.00, NULL, NULL, '2026-08-19', '2026-08-19 17:04:20', '2026-08-12 16:53:35', '2026-08-19 17:04:20'),
(65, NULL, '8/20 210', 'kks', 210000000.00, NULL, NULL, '2026-08-20', '2026-08-23 17:18:18', '2026-08-12 23:10:42', '2026-08-23 17:18:18'),
(66, NULL, '8/20 184', 'kks', 184000000.00, NULL, NULL, '2026-08-20', '2026-08-23 17:17:57', '2026-08-13 02:01:15', '2026-08-23 17:17:57'),
(67, NULL, '8/21 85', 'kks', 85000002.00, NULL, NULL, '2026-08-21', '2026-08-18 19:03:47', '2026-08-13 17:12:16', '2026-08-18 19:03:47'),
(68, NULL, '8/21 89', 'kks', 89000000.00, NULL, NULL, '2026-08-21', '2026-08-18 17:02:37', '2026-08-13 17:54:42', '2026-08-18 17:02:37'),
(69, NULL, '8/21 288', 'kks', 288000000.00, NULL, NULL, '2026-08-21', '2026-08-16 17:06:50', '2026-08-13 23:27:39', '2026-08-16 17:06:50'),
(70, NULL, '8/22 450', 'kks', 450000000.00, NULL, NULL, '2026-08-22', '2026-08-23 17:19:09', '2026-08-14 23:14:43', '2026-08-23 17:19:09'),
(71, NULL, '8/28 100', 'kks', 100000000.00, NULL, NULL, '2026-08-28', '2026-08-29 21:48:00', '2026-08-16 17:10:41', '2026-08-29 21:48:00'),
(72, NULL, '8/26 580', 'kks', 580000000.00, NULL, NULL, '2026-08-26', '2026-08-25 23:05:57', '2026-08-18 22:16:23', '2026-08-25 23:05:57'),
(75, NULL, '8/26 155', 'kks', 155000000.00, NULL, NULL, '2026-08-26', '2026-08-26 00:45:19', '2026-08-18 23:04:34', '2026-08-26 00:45:19'),
(76, NULL, '8/25 133', 'kks', 133000000.00, NULL, NULL, '2026-08-25', '2026-08-24 18:00:12', '2026-08-19 00:03:42', '2026-08-24 18:00:12'),
(77, NULL, '8/27 749', 'kks', 749000000.00, NULL, NULL, '2026-08-27', '2026-08-26 22:28:52', '2026-08-19 17:03:41', '2026-08-26 22:28:52'),
(78, NULL, '8/27 100', 'kks', 100000000.00, NULL, NULL, '2026-08-27', '2026-08-27 17:44:29', '2026-08-19 17:04:02', '2026-08-27 17:44:29'),
(79, NULL, '8/27 500', 'kks', 500000000.00, NULL, NULL, '2026-08-27', '2026-08-27 03:36:06', '2026-08-19 21:04:20', '2026-08-27 03:36:06'),
(80, NULL, '8/31 119', 'kks', 119000000.00, NULL, NULL, '2026-08-31', '2026-09-01 02:10:56', '2026-08-23 17:22:11', '2026-09-01 02:10:56'),
(81, NULL, '8/30 205', 'kks', 205000000.00, NULL, NULL, '2026-08-30', '2026-08-30 07:07:47', '2026-08-23 17:22:48', '2026-08-30 07:07:47'),
(82, NULL, '8/28 485', 'kks', 485000000.00, NULL, NULL, '2026-08-28', '2026-08-28 16:06:10', '2026-08-23 17:23:15', '2026-08-28 16:06:10'),
(83, NULL, '8/29 1.5', 'kks', 1500000.00, NULL, NULL, '2026-08-29', '2026-08-29 21:48:02', '2026-08-23 17:25:33', '2026-08-29 21:48:02'),
(84, NULL, '8/27 1100', 'kks', 1100000000.00, NULL, NULL, '2026-08-27', '2026-08-27 17:44:11', '2026-08-23 17:47:21', '2026-08-27 17:44:11'),
(85, NULL, '8/28 130', 'kks', 130000000.00, NULL, NULL, '2026-08-28', '2026-08-27 18:42:34', '2026-08-23 17:48:21', '2026-08-27 18:42:34'),
(86, NULL, '9/1 30', 'kks', 30000000.00, NULL, NULL, '2026-09-01', '2026-09-01 16:55:15', '2026-08-24 23:11:27', '2026-09-01 16:55:15'),
(87, NULL, '9/1 160', 'kks', 160000000.00, NULL, NULL, '2026-09-01', '2026-09-01 17:18:41', '2026-08-24 23:15:37', '2026-09-01 17:18:41'),
(88, NULL, '9/2 176.5', 'kks', 176500000.00, NULL, NULL, '2026-09-02', '2026-09-03 17:42:33', '2026-08-26 05:26:24', '2026-09-03 17:42:33'),
(89, NULL, '9/4 175', 'kks', 175000000.00, NULL, NULL, '2026-09-04', '2026-09-03 19:20:13', '2026-08-27 18:49:14', '2026-09-03 19:20:13'),
(90, NULL, '9/4 450', 'kks', 450000000.00, NULL, NULL, '2026-09-04', '2026-09-04 01:38:14', '2026-08-28 00:44:04', '2026-09-04 01:38:14'),
(91, NULL, '9/4 245', 'kks', 245000000.00, NULL, NULL, '2026-09-04', '2026-09-01 07:54:26', '2026-08-28 01:18:09', '2026-09-01 07:54:26'),
(92, NULL, '9/4 720', 'kks', 720000000.00, NULL, NULL, '2026-09-04', '2026-09-05 19:07:29', '2026-08-28 05:20:48', '2026-09-05 19:07:29'),
(93, NULL, '9/9 1600', 'kks', 1600000000.00, NULL, NULL, '2026-09-09', '2026-09-09 14:00:31', '2026-09-01 17:59:58', '2026-09-09 14:00:31'),
(94, NULL, '9/10 3300', 'kks', 3300000000.00, NULL, NULL, '2026-09-10', '2026-09-10 13:56:10', '2026-09-02 20:50:21', '2026-09-10 13:56:10'),
(95, NULL, '9/10 395', 'kks', 395000000.00, NULL, NULL, '2026-09-10', '2026-09-10 22:28:11', '2026-09-03 04:51:16', '2026-09-10 22:28:11'),
(96, NULL, '9/11 133', 'kks', 133000000.00, NULL, NULL, '2026-09-11', '2026-09-14 01:22:07', '2026-09-04 00:05:49', '2026-09-14 01:22:07'),
(97, NULL, '9/14 155', 'kks', 155000000.00, NULL, NULL, '2026-09-14', '2026-09-14 04:56:27', '2026-09-07 02:30:09', '2026-09-14 04:56:27'),
(98, NULL, '9/15 930', 'kks', 930000000.00, NULL, NULL, '2026-09-15', '2026-09-14 21:54:42', '2026-09-07 18:58:04', '2026-09-14 21:54:42'),
(99, NULL, '9/16 228', 'kks', 228000000.00, NULL, NULL, '2026-09-16', '2026-09-15 21:38:04', '2026-09-08 15:44:31', '2026-09-15 21:38:04'),
(100, NULL, '9/17 810', 'kks', 810000000.00, NULL, NULL, '2026-09-17', '2026-09-19 18:27:47', '2026-09-09 21:47:27', '2026-09-19 18:27:47'),
(101, NULL, '9/18 55', 'kks', 55000000.00, NULL, NULL, '2026-09-18', '2026-09-17 01:00:44', '2026-09-10 19:12:32', '2026-09-17 01:00:44'),
(102, NULL, '9/19 75', 'kks', 75000000.00, NULL, NULL, '2026-09-19', '2026-09-19 18:26:01', '2026-09-12 00:55:30', '2026-09-19 18:26:01'),
(103, NULL, '9/23 159', 'kks', 159000000.00, NULL, NULL, '2026-09-23', NULL, '2026-09-15 22:41:58', '2026-09-15 22:41:58'),
(104, NULL, '9/24 600', 'kks', 600000000.00, NULL, NULL, '2026-09-24', NULL, '2026-09-16 22:34:24', '2026-09-16 22:34:24'),
(105, NULL, '9/24 123', 'kks', 123000000.00, NULL, NULL, '2026-09-24', NULL, '2026-09-17 00:02:00', '2026-09-17 00:02:00'),
(106, NULL, '9/24 385', 'kks', 385000000.00, NULL, NULL, '2026-09-24', NULL, '2026-09-17 18:04:34', '2026-09-17 18:04:34'),
(107, NULL, '141 (not yet confirmed)', 'kks', 141000000.00, NULL, NULL, '2026-09-25', NULL, '2026-09-17 18:05:18', '2026-09-17 18:05:18'),
(108, NULL, 'not yet confirmed 127', 'kks', 127000000.00, NULL, NULL, '2026-09-25', '2026-09-19 19:41:00', '2026-09-17 18:06:01', '2026-09-19 19:41:00'),
(109, NULL, '9/26 3700', 'kks', 3700000000.00, NULL, NULL, '2026-09-26', NULL, '2026-09-18 15:53:40', '2026-09-18 15:53:40'),
(110, NULL, '9/26', 'kks', 2500000000.00, NULL, NULL, '2026-09-26', NULL, '2026-09-19 07:33:12', '2026-09-19 07:33:12'),
(111, NULL, '9/27 518', 'kks', 518000000.00, NULL, NULL, '2026-09-27', NULL, '2026-09-19 18:29:21', '2026-09-19 18:29:21'),
(112, NULL, '9/27 45', 'kks', 45000000.00, NULL, NULL, '2026-09-27', NULL, '2026-09-19 20:47:09', '2026-09-19 20:47:09');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `category_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `category_id`, `type`, `amount`, `description`, `date`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'expense', 74.00, 'Fried Noodles', '2026-07-01', NULL, '2026-06-30 21:32:08', '2026-07-01 00:01:29'),
(2, 1, 1, 'expense', 295.00, 'Dunkin Donut', '2026-07-01', NULL, '2026-07-01 16:30:48', '2026-07-01 16:30:48'),
(4, 1, 2, 'expense', 472.00, 'Gas Shell', '2026-07-02', NULL, '2026-07-02 16:58:51', '2026-07-02 16:58:51'),
(5, 1, 1, 'expense', 40.00, 'Lemon Juice', '2026-07-03', NULL, '2026-07-02 16:59:14', '2026-07-02 16:59:14'),
(6, 1, 1, 'expense', 75.00, 'Sarsa - Halo Halo', '2026-07-03', NULL, '2026-07-02 21:33:49', '2026-07-02 21:33:49'),
(7, 1, 2, 'expense', 551.00, NULL, '2026-07-06', 'Shell', '2026-07-05 18:07:21', '2026-07-05 18:07:21'),
(8, 1, 1, 'expense', 50.00, NULL, '2026-07-04', 'Mountain Dew', '2026-07-05 18:09:23', '2026-07-05 18:09:23'),
(9, 1, 1, 'expense', 434.00, 'Chowking breakfast', '2026-07-06', NULL, '2026-07-05 18:17:26', '2026-07-05 18:17:26'),
(10, 1, 1, 'expense', 790.00, 'Dinner and pasalubong', '2026-07-05', NULL, '2026-07-05 18:20:01', '2026-07-05 18:44:31'),
(11, 1, 1, 'expense', 300.00, 'Meryenda', '2026-07-06', NULL, '2026-07-05 18:20:25', '2026-07-05 18:20:25'),
(12, 1, 7, 'expense', 150.00, 'Deo', '2026-07-06', NULL, '2026-07-05 18:21:12', '2026-07-05 18:21:12'),
(13, 1, 1, 'expense', 346.00, 'Foods sa resort', '2026-07-06', NULL, '2026-07-05 18:22:49', '2026-07-05 18:22:49'),
(14, 1, 7, 'expense', 410.00, 'Resort', '2026-07-06', NULL, '2026-07-05 18:23:35', '2026-07-05 18:23:52'),
(15, 1, 1, 'expense', 410.00, 'Drinks', '2026-07-06', NULL, '2026-07-05 18:23:46', '2026-07-05 18:23:46'),
(16, 1, 7, 'expense', 467.00, 'Mich kuromi', '2026-07-06', NULL, '2026-07-05 18:24:27', '2026-07-05 18:24:27'),
(17, 1, 1, 'expense', 300.00, 'Groceries for office', '2026-07-06', NULL, '2026-07-05 20:55:57', '2026-07-05 20:55:57'),
(18, 1, 1, 'expense', 199.00, 'Chicken Wings', '2026-07-06', NULL, '2026-07-05 20:57:51', '2026-07-05 20:57:51'),
(19, 1, 7, 'expense', 98.00, 'Tissue', '2026-07-06', NULL, '2026-07-05 20:59:02', '2026-07-05 20:59:21'),
(20, 1, 7, 'expense', 271.00, 'Grace and Glow body wash', '2026-07-06', NULL, '2026-07-05 21:01:59', '2026-07-05 21:01:59'),
(21, 1, 7, 'expense', 279.00, 'Dove gold (Shampoo)', '2026-07-06', NULL, '2026-07-05 21:05:51', '2026-07-05 21:05:51'),
(44, 1, 7, 'expense', 75.00, 'Toothbrush for office', '2026-07-08', NULL, '2026-07-08 05:51:35', '2026-07-08 05:51:35'),
(45, 1, 7, 'expense', 522.00, 'Gambit Hair Creamer', '2026-07-08', NULL, '2026-07-08 05:52:10', '2026-07-08 05:52:10'),
(46, 1, 1, 'expense', 69.00, 'Avacado Crema', '2026-07-08', NULL, '2026-07-08 05:52:33', '2026-07-08 05:52:33'),
(47, 1, 1, 'expense', 80.00, 'Fishball, Kikiam, kwekwek', '2026-07-10', NULL, '2026-07-09 16:58:22', '2026-07-09 16:58:22'),
(48, 1, 1, 'expense', 12.00, 'Melon', '2026-07-12', NULL, '2026-07-11 22:13:59', '2026-07-11 22:13:59'),
(49, 1, 1, 'expense', 736.00, 'Shakeys', '2026-07-12', NULL, '2026-07-11 22:14:20', '2026-07-11 22:14:20'),
(50, 1, 2, 'expense', 609.00, 'Gas', '2026-07-12', NULL, '2026-07-11 22:15:11', '2026-07-11 22:15:11'),
(51, 1, 1, 'expense', 359.00, 'Breakfast', '2026-07-12', NULL, '2026-07-11 22:15:30', '2026-07-11 22:15:30'),
(52, 1, 1, 'expense', 658.00, 'Samgyup', '2026-07-12', NULL, '2026-07-12 06:33:26', '2026-07-12 06:33:26'),
(53, 1, 1, 'expense', 240.00, 'Breakfast', '2026-07-13', NULL, '2026-07-12 18:00:53', '2026-07-12 18:00:53'),
(54, 1, 1, 'expense', 509.00, 'jalibi', '2026-07-13', NULL, '2026-07-12 19:51:43', '2026-07-12 19:51:43'),
(55, 1, 7, 'expense', 1646.00, 'Tiktok', '2026-07-13', NULL, '2026-07-13 01:57:38', '2026-07-13 01:57:38'),
(56, 1, 2, 'expense', 511.00, 'Gas', '2026-07-14', NULL, '2026-07-14 08:45:11', '2026-07-14 08:45:11'),
(57, 1, 1, 'expense', 150.00, 'Coffee', '2026-07-14', NULL, '2026-07-14 08:45:34', '2026-07-14 08:45:34'),
(58, 1, 1, 'expense', 75.00, 'Meryenda', '2026-07-14', NULL, '2026-07-14 08:48:18', '2026-07-14 08:48:18'),
(59, 1, 8, 'income', 9750.00, 'July 15, 2026 (Salary)', '2026-07-14', NULL, '2026-07-14 08:56:01', '2026-07-14 08:56:01'),
(60, 1, 1, 'expense', 350.00, 'Coffee and Pastry', '2026-07-15', NULL, '2026-07-14 18:47:30', '2026-07-14 21:47:52'),
(61, 1, 1, 'expense', 174.00, 'Lunch', '2026-07-15', NULL, '2026-07-14 21:45:23', '2026-07-14 21:45:23'),
(62, 1, 7, 'expense', 3490.00, 'Perfume', '2026-07-16', NULL, '2026-07-15 17:25:56', '2026-07-15 17:25:56'),
(63, 1, 7, 'expense', 1000.00, 'Gift to papa', '2026-07-17', NULL, '2026-07-16 16:43:21', '2026-07-16 16:43:21'),
(64, 1, 7, 'expense', 175.00, 'CLVB', '2026-07-17', NULL, '2026-07-16 16:45:32', '2026-07-16 16:45:32'),
(65, 1, 1, 'expense', 180.00, 'Tokyo Tokyo', '2026-07-17', NULL, '2026-07-16 21:40:33', '2026-07-16 21:40:33'),
(66, 1, 2, 'expense', 70.00, 'Joyride', '2026-07-17', NULL, '2026-07-16 23:37:02', '2026-07-16 23:37:02'),
(67, 1, 1, 'expense', 75.00, 'Takoyaki', '2026-07-18', NULL, '2026-07-17 16:12:27', '2026-07-17 16:12:27'),
(68, 1, 1, 'expense', 130.00, 'Breakfast', '2026-07-18', NULL, '2026-07-17 16:12:45', '2026-07-17 16:12:45'),
(69, 1, 1, 'expense', 39.00, 'Milktea', '2026-07-18', NULL, '2026-07-18 15:21:33', '2026-07-18 15:21:33'),
(70, 1, 1, 'expense', 48.00, 'Bfast', '2026-07-19', NULL, '2026-07-18 17:30:25', '2026-07-18 17:30:25'),
(71, 1, 1, 'expense', 60.00, 'Merynda', '2026-07-19', NULL, '2026-07-20 17:09:55', '2026-07-20 17:09:55'),
(72, 1, 7, 'expense', 280.00, 'Vape', '2026-07-19', NULL, '2026-07-20 17:10:19', '2026-07-20 17:10:19'),
(73, 1, 7, 'expense', 280.00, 'Rh', '2026-07-21', NULL, '2026-07-20 17:10:30', '2026-07-20 17:10:30'),
(74, 1, 1, 'expense', 190.00, 'Sisig', '2026-07-21', NULL, '2026-07-20 17:10:39', '2026-07-20 17:10:39'),
(75, 1, 1, 'expense', 20.00, 'Pillows', '2026-07-21', NULL, '2026-07-20 17:10:46', '2026-07-20 17:10:46'),
(76, 1, 1, 'expense', 10.00, 'Ice', '2026-07-21', NULL, '2026-07-20 17:10:55', '2026-07-20 17:10:55'),
(77, 1, 1, 'expense', 50.00, '2 Mountain Dew', '2026-07-21', NULL, '2026-07-20 17:11:11', '2026-07-20 17:11:11'),
(78, 1, 1, 'expense', 80.00, 'Lunch', '2026-07-21', NULL, '2026-07-20 17:11:21', '2026-07-20 17:11:21'),
(79, 1, 1, 'expense', 50.00, 'Sangkap ng adobo', '2026-07-21', NULL, '2026-07-20 17:11:36', '2026-07-20 17:11:36'),
(80, 1, 1, 'expense', 75.00, 'Royal', '2026-07-21', NULL, '2026-07-20 17:11:44', '2026-07-20 17:11:44'),
(81, 1, 7, 'expense', 1000.00, 'Asunta', '2026-07-21', NULL, '2026-07-20 17:12:46', '2026-07-20 17:12:46'),
(82, 1, 7, 'expense', 695.00, 'Diane', '2026-07-21', NULL, '2026-07-20 18:03:33', '2026-07-20 18:03:33'),
(83, 1, 20, 'expense', 1000.00, 'Baby', '2026-07-21', NULL, '2026-07-20 19:40:52', '2026-08-23 18:04:22'),
(84, 1, 20, 'expense', 1000.00, 'baby', '2026-07-21', NULL, '2026-07-20 20:21:12', '2026-08-23 18:04:28'),
(85, 1, 1, 'expense', 75.00, 'dessert', '2026-07-22', NULL, '2026-07-21 21:11:11', '2026-07-21 21:11:11'),
(86, 1, 1, 'expense', 80.00, 'Meryenda', '2026-07-22', NULL, '2026-07-22 02:17:53', '2026-07-22 02:17:53'),
(87, 1, 1, 'expense', 20.00, 'Lunch', '2026-07-24', NULL, '2026-07-23 18:41:51', '2026-07-23 18:41:51'),
(88, 1, 7, 'expense', 3684.00, 'July 24 - 27', '2026-07-28', NULL, '2026-07-27 16:48:23', '2026-07-27 16:48:23'),
(89, 1, 1, 'expense', 150.00, 'Bingsu', '2026-07-28', NULL, '2026-07-27 21:22:38', '2026-07-27 21:22:38'),
(90, 1, 2, 'expense', 590.00, 'Gas', '2026-07-29', NULL, '2026-07-29 16:35:25', '2026-07-29 16:35:25'),
(91, 1, 1, 'expense', 16.00, 'Pancit Canton', '2026-07-30', NULL, '2026-07-29 16:35:33', '2026-07-29 16:35:33'),
(92, 1, 8, 'income', 11350.00, 'July 29th', '2026-07-30', NULL, '2026-07-29 18:10:53', '2026-07-29 18:10:53'),
(93, 1, 6, 'expense', 2000.00, 'Kuryente', '2026-07-30', NULL, '2026-07-30 01:31:38', '2026-07-30 01:31:38'),
(94, 1, 7, 'expense', 1990.00, 'Tiktok', '2026-07-30', NULL, '2026-07-30 01:46:54', '2026-07-30 01:46:54'),
(95, 1, 7, 'expense', 1000.00, 'asunta', '2026-08-01', NULL, '2026-07-31 23:59:35', '2026-07-31 23:59:35'),
(96, 1, 1, 'expense', 74.00, 'Kitkat', '2026-08-01', NULL, '2026-08-03 17:08:22', '2026-08-03 17:08:22'),
(97, 1, 1, 'expense', 649.00, 'food aug 2', '2026-08-02', NULL, '2026-08-03 17:09:00', '2026-08-03 17:09:00'),
(98, 1, 1, 'expense', 1116.00, 'Aug 3 expense', '2026-08-03', NULL, '2026-08-03 17:10:11', '2026-08-03 17:10:11'),
(99, 1, 20, 'expense', 1000.00, 'baby', '2026-08-04', NULL, '2026-08-03 17:10:20', '2026-08-23 18:04:33'),
(100, 1, 20, 'expense', 1000.00, 'baby', '2026-08-04', NULL, '2026-08-03 19:18:20', '2026-08-23 18:04:39'),
(101, 1, 20, 'expense', 4000.00, 'Phone ni baby', '2026-08-04', NULL, '2026-08-03 19:22:04', '2026-08-23 18:04:44'),
(102, 1, 1, 'expense', 220.00, 'Meryenda', '2026-08-04', NULL, '2026-08-04 00:04:38', '2026-08-04 00:04:38'),
(103, 1, 2, 'expense', 543.00, 'Gas', '2026-08-04', NULL, '2026-08-04 17:45:56', '2026-08-04 17:45:56'),
(104, 1, 7, 'expense', 190.00, 'Baonan', '2026-08-05', NULL, '2026-08-04 17:46:48', '2026-08-04 17:46:48'),
(105, 1, 7, 'expense', 341.00, 'Shaver', '2026-08-05', NULL, '2026-08-04 18:45:40', '2026-08-04 18:45:40'),
(106, 1, 1, 'expense', 214.00, 'Lunch', '2026-08-05', NULL, '2026-08-04 20:05:23', '2026-08-04 20:05:23'),
(109, 1, 7, 'expense', 519.37, 'Tshirt tiktok', '2026-08-07', NULL, '2026-08-06 18:15:29', '2026-08-06 18:15:29'),
(110, 1, 1, 'expense', 238.00, 'Dinner', '2026-08-07', NULL, '2026-08-11 17:06:56', '2026-08-11 17:06:56'),
(111, 1, 7, 'expense', 166.00, 'Bag', '2026-08-08', NULL, '2026-08-11 17:07:10', '2026-08-11 17:07:10'),
(112, 1, 1, 'expense', 1043.00, 'Lunch', '2026-08-08', NULL, '2026-08-11 17:07:47', '2026-08-11 17:07:47'),
(113, 1, 7, 'expense', 559.00, 'Pants', '2026-08-08', NULL, '2026-08-11 17:08:00', '2026-08-11 17:08:07'),
(114, 1, 1, 'expense', 440.00, 'Dinner', '2026-08-08', NULL, '2026-08-11 17:08:22', '2026-08-11 17:08:22'),
(115, 1, 7, 'expense', 1500.00, 'Utang kay mama', '2026-08-08', NULL, '2026-08-11 17:08:35', '2026-08-11 17:08:35'),
(116, 1, 1, 'expense', 320.00, 'Bfast', '2026-08-09', NULL, '2026-08-11 17:08:56', '2026-08-11 17:08:56'),
(117, 1, 1, 'expense', 1150.00, 'Pizza', '2026-08-09', NULL, '2026-08-11 17:09:05', '2026-08-11 17:09:05'),
(118, 1, 1, 'expense', 220.00, 'Gin', '2026-08-09', NULL, '2026-08-11 17:09:27', '2026-08-11 17:09:27'),
(119, 1, 1, 'expense', 25.00, 'MD', '2026-08-11', NULL, '2026-08-11 17:09:39', '2026-08-11 17:11:05'),
(120, 1, 1, 'expense', 477.00, 'Mcdo', '2026-08-10', NULL, '2026-08-11 17:10:11', '2026-08-11 17:10:11'),
(121, 1, 7, 'expense', 740.00, 'Pills', '2026-08-11', NULL, '2026-08-11 17:10:26', '2026-08-11 17:10:26'),
(122, 1, 1, 'expense', 295.00, 'Pares', '2026-08-11', NULL, '2026-08-11 17:10:35', '2026-08-11 17:11:10'),
(123, 1, 7, 'expense', 500.00, 'Brian', '2026-08-11', NULL, '2026-08-11 17:10:48', '2026-08-11 17:10:48'),
(124, 1, 1, 'expense', 219.00, '24 Chicken', '2026-08-13', NULL, '2026-08-12 18:56:01', '2026-08-12 18:56:01'),
(125, 1, 1, 'expense', 148.00, 'dinner', '2026-08-14', NULL, '2026-08-13 17:01:11', '2026-08-13 17:01:11'),
(126, 1, 7, 'expense', 250.00, 'pagupit', '2026-08-14', NULL, '2026-08-13 17:01:24', '2026-08-13 17:01:24'),
(127, 1, 2, 'expense', 519.00, 'Gas', '2026-08-14', NULL, '2026-08-13 17:01:33', '2026-08-13 17:01:33'),
(128, 1, 8, 'income', 10000.00, '8/14', '2026-08-14', NULL, '2026-08-13 20:56:01', '2026-08-13 20:56:01'),
(129, 1, 7, 'expense', 500.00, 'Flowers', '2026-08-15', NULL, '2026-08-16 17:45:58', '2026-08-16 17:45:58'),
(130, 1, 1, 'expense', 604.00, 'Starbucks', '2026-08-15', NULL, '2026-08-16 17:48:01', '2026-08-16 17:48:01'),
(131, 1, 1, 'expense', 363.00, 'Taco and water', '2026-08-15', NULL, '2026-08-16 17:48:27', '2026-08-16 17:48:27'),
(132, 1, 1, 'expense', 211.10, 'Mango Drink', '2026-08-15', NULL, '2026-08-16 17:49:09', '2026-08-16 17:49:09'),
(133, 1, 1, 'expense', 1000.00, 'Jollibee and other stuffs', '2026-08-16', NULL, '2026-08-16 17:50:32', '2026-08-16 17:50:32'),
(134, 1, 1, 'expense', 1000.00, 'Lugaw & other stuffs', '2026-08-16', NULL, '2026-08-16 17:52:19', '2026-08-16 17:52:19'),
(135, 1, 7, 'expense', 169.00, 'Spotify', '2026-08-17', NULL, '2026-08-18 17:15:35', '2026-08-18 17:15:35'),
(136, 1, 1, 'expense', 300.00, 'Sinigang', '2026-08-17', NULL, '2026-08-18 17:18:06', '2026-08-18 17:18:06'),
(137, 1, 1, 'expense', 145.00, 'Lunch (Hungarian & Siomai)', '2026-08-18', NULL, '2026-08-18 17:21:01', '2026-08-18 17:21:01'),
(138, 1, 1, 'expense', 254.00, 'Jollibee', '2026-08-19', NULL, '2026-08-18 21:08:19', '2026-08-18 21:08:19'),
(139, 1, 7, 'expense', 250.00, 'Vape', '2026-08-20', NULL, '2026-08-19 17:34:23', '2026-08-19 17:34:23'),
(140, 1, 1, 'expense', 40.00, NULL, '2026-08-20', NULL, '2026-08-19 19:40:37', '2026-08-19 19:40:37'),
(141, 1, 2, 'expense', 535.00, 'Gas', '2026-08-20', NULL, '2026-08-23 17:57:04', '2026-08-23 17:57:04'),
(142, 1, 1, 'expense', 798.00, 'Unli Wings', '2026-08-20', NULL, '2026-08-23 17:57:18', '2026-08-23 17:57:18'),
(143, 1, 7, 'expense', 270.00, 'Tiktok card holder', '2026-08-20', NULL, '2026-08-23 17:57:40', '2026-08-23 17:57:40'),
(144, 1, 1, 'expense', 400.00, 'Siopao', '2026-08-21', NULL, '2026-08-23 17:57:58', '2026-08-23 17:57:58'),
(145, 1, 1, 'expense', 198.00, 'Ice cream and idk', '2026-08-21', NULL, '2026-08-23 17:58:17', '2026-08-23 17:58:17'),
(146, 1, 1, 'expense', 15.00, 'Siomai', '2026-08-21', NULL, '2026-08-23 17:58:31', '2026-08-23 17:58:31'),
(147, 1, 1, 'expense', 273.00, 'Siopao', '2026-08-21', NULL, '2026-08-23 17:58:48', '2026-08-23 17:58:48'),
(148, 1, 1, 'expense', 99.00, 'Ice cream', '2026-08-22', NULL, '2026-08-23 17:59:03', '2026-08-23 17:59:03'),
(149, 1, 1, 'expense', 415.00, 'Chowking', '2026-08-22', NULL, '2026-08-23 17:59:17', '2026-08-23 17:59:17'),
(150, 1, 1, 'expense', 60.00, 'Shake', '2026-08-23', NULL, '2026-08-23 17:59:30', '2026-08-23 17:59:30'),
(151, 1, 1, 'expense', 32.00, 'Chocomucho and siomai', '2026-08-23', NULL, '2026-08-23 17:59:58', '2026-08-23 17:59:58'),
(152, 1, 1, 'expense', 88.00, 'Ice cream', '2026-08-22', NULL, '2026-08-23 18:00:27', '2026-08-23 18:00:27'),
(153, 1, 1, 'expense', 434.00, '24 Chicken and drinks', '2026-08-24', NULL, '2026-08-23 18:00:59', '2026-08-23 18:00:59'),
(154, 1, 20, 'expense', 1000.00, 'baby', '2026-08-24', NULL, '2026-08-23 18:02:14', '2026-08-23 18:04:48'),
(155, 1, 20, 'expense', 1000.00, 'Pilzerd', '2026-08-27', NULL, '2026-08-26 18:00:19', '2026-08-26 18:00:19'),
(156, 1, 1, 'expense', 74.00, 'McFlurry', '2026-08-28', NULL, '2026-08-27 23:16:31', '2026-08-27 23:16:31'),
(157, 1, 7, 'expense', 147.00, 'Helmet Cleaner', '2026-08-28', NULL, '2026-08-27 23:16:53', '2026-08-27 23:16:53'),
(158, 1, 7, 'expense', 199.00, 'Contact Lens Solution', '2026-08-28', NULL, '2026-08-27 23:18:21', '2026-08-27 23:18:21'),
(159, 1, 8, 'income', 10500.00, NULL, '2026-08-28', NULL, '2026-08-28 04:46:53', '2026-08-28 04:46:53'),
(160, 1, 1, 'expense', 196.00, 'Burger n tonkatsu', '2026-08-29', NULL, '2026-08-28 17:52:29', '2026-08-28 17:52:29'),
(161, 1, 8, 'income', 50.00, NULL, '2026-08-29', NULL, '2026-08-28 17:55:31', '2026-08-28 17:55:31'),
(162, 1, 1, 'expense', 580.00, 'Beef', '2026-08-29', NULL, '2026-08-28 20:08:53', '2026-08-28 20:08:53'),
(163, 3, 21, 'income', 10000.00, 'Kinsenas', '2026-08-29', NULL, '2026-08-28 20:39:34', '2026-08-28 20:39:34'),
(164, 3, 22, 'expense', 500.00, 'Dinner', '2026-08-29', NULL, '2026-08-28 20:40:09', '2026-08-28 20:40:09'),
(165, 1, 1, 'expense', 220.52, 'Cheese, butter, & milk', '2026-08-29', NULL, '2026-08-29 03:20:47', '2026-08-29 03:20:47'),
(166, 1, 1, 'expense', 143.00, 'Soft Drinks', '2026-08-29', NULL, '2026-08-29 03:21:08', '2026-08-29 03:21:08'),
(167, 1, 1, 'expense', 942.00, 'Siopao', '2026-08-29', NULL, '2026-08-29 03:21:58', '2026-08-29 03:21:58'),
(168, 1, 7, 'expense', 523.18, 'Couple Slippers', '2026-08-29', NULL, '2026-08-29 03:22:24', '2026-08-29 03:22:24'),
(169, 1, 7, 'expense', 982.63, 'Tiktok', '2026-08-30', NULL, '2026-08-30 17:22:54', '2026-08-31 19:48:41'),
(170, 1, 1, 'expense', 744.56, 'Baon sa Quezon', '2026-08-30', NULL, '2026-08-30 17:24:02', '2026-08-30 17:24:02'),
(171, 1, 1, 'expense', 970.00, 'Pasalubong and gastos', '2026-08-31', NULL, '2026-08-31 06:02:49', '2026-08-31 17:35:54'),
(172, 1, 2, 'expense', 560.00, 'gas', '2026-08-29', NULL, '2026-08-31 17:33:59', '2026-08-31 17:33:59'),
(173, 1, 1, 'expense', 832.00, 'Kfc', '2026-08-30', NULL, '2026-08-31 17:35:31', '2026-08-31 17:35:31'),
(174, 1, 20, 'expense', 2000.00, 'Phone ni baby', '2026-09-01', NULL, '2026-08-31 20:51:48', '2026-08-31 20:51:48'),
(175, 1, 1, 'expense', 167.00, 'Dunkin coffee', '2026-09-01', NULL, '2026-08-31 21:01:52', '2026-08-31 21:01:52'),
(176, 1, 20, 'expense', 3000.00, 'baby', '2026-09-01', NULL, '2026-08-31 21:49:13', '2026-08-31 21:49:13'),
(177, 1, 20, 'expense', 2000.00, 'Babyy', '2026-09-01', NULL, '2026-08-31 22:00:24', '2026-08-31 22:00:24'),
(178, 1, 23, 'income', 130.00, 'Suman', '2026-09-01', NULL, '2026-08-31 22:05:12', '2026-08-31 22:05:12'),
(180, 1, 7, 'expense', 100.00, 'papa', '2026-09-01', NULL, '2026-09-01 18:48:12', '2026-09-01 18:48:12'),
(181, 1, 1, 'expense', 100.00, 'meryenda', '2026-09-02', NULL, '2026-09-02 00:44:25', '2026-09-02 00:44:25'),
(182, 1, 1, 'expense', 950.00, 'bayad', '2026-09-02', NULL, '2026-09-02 00:47:08', '2026-09-02 00:47:08'),
(183, 1, 1, 'expense', 134.00, '24chicken', '2026-09-03', NULL, '2026-09-02 19:13:22', '2026-09-02 19:13:22'),
(184, 1, 7, 'expense', 688.00, 'Motor CP Holder', '2026-09-03', NULL, '2026-09-02 19:35:48', '2026-09-02 19:35:48'),
(185, 1, 20, 'expense', 1000.00, 'baby', '2026-09-04', NULL, '2026-09-03 20:54:21', '2026-09-03 20:54:21'),
(186, 1, 1, 'expense', 220.00, 'bfast', '2026-09-05', NULL, '2026-09-05 01:42:52', '2026-09-05 01:42:52'),
(187, 1, 1, 'expense', 60.00, 'siomai', '2026-09-05', NULL, '2026-09-05 01:43:09', '2026-09-05 01:43:09'),
(188, 1, 1, 'expense', 86.00, 'Royal', '2026-09-05', NULL, '2026-09-05 18:28:23', '2026-09-05 18:28:38'),
(189, 1, 7, 'expense', 90.00, 'Sahog', '2026-09-05', NULL, '2026-09-05 19:03:25', '2026-09-05 19:03:25'),
(190, 1, 7, 'expense', 200.00, 'Pedicure', '2026-09-06', NULL, '2026-09-05 19:03:47', '2026-09-05 19:03:47'),
(191, 1, 1, 'expense', 28.00, 'bread', '2026-09-05', NULL, '2026-09-05 19:08:54', '2026-09-05 19:08:54'),
(192, 1, 1, 'expense', 770.40, 'Samg', '2026-09-06', NULL, '2026-09-05 22:41:09', '2026-09-05 22:41:09'),
(193, 1, 7, 'expense', 5700.00, 'Top box', '2026-09-06', NULL, '2026-09-05 22:41:21', '2026-09-05 22:41:21'),
(194, 1, 1, 'expense', 56.00, 'bread', '2026-09-06', NULL, '2026-09-06 05:58:17', '2026-09-06 05:58:17'),
(195, 1, 1, 'expense', 100.00, 'puto bongbong', '2026-09-06', NULL, '2026-09-06 05:58:45', '2026-09-06 05:58:45'),
(196, 1, 1, 'expense', 313.00, 'Jollibee', '2026-09-06', NULL, '2026-09-06 05:59:13', '2026-09-06 05:59:13'),
(197, 1, 2, 'expense', 554.65, 'Gas', '2026-09-07', NULL, '2026-09-06 17:13:01', '2026-09-06 17:13:01'),
(198, 1, 1, 'expense', 156.14, 'ZUS coffee', '2026-09-07', NULL, '2026-09-06 21:37:35', '2026-09-06 21:37:35'),
(199, 1, 7, 'expense', 178.13, 'Motor Cover', '2026-09-07', NULL, '2026-09-07 00:09:22', '2026-09-07 00:09:22'),
(200, 1, 7, 'expense', 247.80, 'Liquid wash', '2026-09-08', NULL, '2026-09-07 19:03:31', '2026-09-07 19:03:31'),
(201, 1, 7, 'expense', 582.85, 'gamot', '2026-09-10', NULL, '2026-09-09 18:02:15', '2026-09-09 18:02:15'),
(202, 1, 1, 'expense', 75.00, 'Bfast lugaw champorado', '2026-09-10', NULL, '2026-09-09 18:02:46', '2026-09-09 18:02:46'),
(203, 1, 1, 'expense', 43.00, 'bfast', '2026-09-10', NULL, '2026-09-09 18:04:04', '2026-09-09 18:04:04'),
(204, 1, 1, 'expense', 320.00, 'dinner', '2026-09-11', NULL, '2026-09-11 07:45:27', '2026-09-11 07:45:27'),
(205, 1, 1, 'expense', 220.00, 'Branch', '2026-09-12', NULL, '2026-09-12 00:56:36', '2026-09-12 00:56:36'),
(206, 1, 7, 'expense', 202.50, 'gamot', '2026-09-12', NULL, '2026-09-12 00:56:56', '2026-09-12 00:56:56'),
(207, 1, 1, 'expense', 93.00, 'kape 7/11', '2026-09-12', NULL, '2026-09-12 00:57:09', '2026-09-12 00:57:09'),
(208, 1, 7, 'expense', 1800.00, 'Motor PMS', '2026-09-13', NULL, '2026-09-13 16:54:55', '2026-09-13 16:55:25'),
(209, 1, 7, 'expense', 500.00, 'gibo', '2026-09-13', NULL, '2026-09-13 16:57:59', '2026-09-13 16:57:59'),
(210, 1, 1, 'expense', 454.00, 'dinner', '2026-09-13', NULL, '2026-09-13 17:00:36', '2026-09-13 17:00:36'),
(211, 1, 8, 'income', 8675.82, NULL, '2026-09-14', NULL, '2026-09-13 23:29:44', '2026-09-13 23:29:44'),
(212, 1, 20, 'expense', 3000.00, 'baby', '2026-09-15', NULL, '2026-09-14 17:31:57', '2026-09-14 17:31:57'),
(213, 1, 7, 'expense', 175.00, 'meryenda at pa cash', '2026-09-15', NULL, '2026-09-15 00:13:47', '2026-09-15 00:13:47'),
(214, 1, 1, 'expense', 697.00, 'dinner date taco', '2026-09-15', NULL, '2026-09-15 17:26:05', '2026-09-15 17:26:05'),
(215, 1, 1, 'expense', 275.00, 'dunkin / dinner', '2026-09-15', NULL, '2026-09-15 17:26:31', '2026-09-15 17:26:41'),
(216, 1, 2, 'expense', 641.27, 'gas', '2026-09-15', NULL, '2026-09-15 17:27:14', '2026-09-15 17:27:14'),
(217, 1, 20, 'expense', 100.00, 'baby', '2026-09-16', NULL, '2026-09-15 18:10:52', '2026-09-15 18:10:52'),
(218, 1, 7, 'expense', 500.00, 'papa', '2026-09-16', NULL, '2026-09-15 19:06:55', '2026-09-15 19:06:55'),
(219, 1, 1, 'expense', 39.00, 'iced coffee', '2026-09-16', NULL, '2026-09-16 04:27:58', '2026-09-16 04:27:58'),
(220, 1, 1, 'expense', 29.00, 'milk tea', '2026-09-17', NULL, '2026-09-17 04:06:01', '2026-09-17 04:06:01'),
(221, 5, 24, 'expense', 30.00, 'Smart C', '2026-09-17', NULL, '2026-09-17 04:15:05', '2026-09-17 04:15:05'),
(222, 5, 24, 'expense', 50.00, 'Siomai', '2026-09-17', NULL, '2026-09-17 04:15:36', '2026-09-17 04:15:36'),
(223, 5, 25, 'income', 1350.00, 'Salary', '2026-09-17', NULL, '2026-09-17 04:16:59', '2026-09-17 04:16:59'),
(224, 5, 25, 'income', 2000.00, 'Sukli sa 10k', '2026-09-17', NULL, '2026-09-17 04:17:58', '2026-09-17 04:17:58'),
(225, 5, 24, 'expense', 282.00, 'dinner', '2026-09-17', NULL, '2026-09-17 04:19:26', '2026-09-17 04:19:26'),
(226, 5, 24, 'expense', 190.00, 'Bacon', '2026-09-17', NULL, '2026-09-17 04:20:13', '2026-09-17 04:20:13'),
(227, 5, 24, 'expense', 74.75, 'baon ni Edward', '2026-09-17', NULL, '2026-09-17 04:22:19', '2026-09-17 04:22:19'),
(228, 1, 20, 'expense', 1000.00, 'baby', '2026-09-17', NULL, '2026-09-17 07:11:09', '2026-09-17 07:11:09'),
(229, 5, 26, 'expense', 86.00, 'transpo to Mercury and regular', '2026-09-17', NULL, '2026-09-17 15:43:00', '2026-09-17 15:43:00'),
(230, 5, 27, 'expense', 129.00, 'Powdered Milk for Devotion', '2026-09-18', NULL, '2026-09-17 15:48:07', '2026-09-17 15:48:07'),
(231, 5, 27, 'expense', 50.00, 'baon ni Edward', '2026-09-18', NULL, '2026-09-17 15:48:57', '2026-09-17 15:48:57'),
(232, 5, 28, 'expense', 200.00, 'JDF', '2026-09-18', NULL, '2026-09-17 15:51:39', '2026-09-17 15:51:39'),
(233, 1, 1, 'expense', 86.00, 'dokito burger', '2026-09-19', NULL, '2026-09-19 18:49:47', '2026-09-19 18:49:47');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'admin',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `role`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Mikey', 'mikey@gmail.com', 'admin', '2026-07-06 19:12:34', '$2y$12$PctoprZK8SXU30RmHVrU9OvY4xJoTqffHomCizSta9r90Gk9Y6CAC', 'nvKNH9Ts8b', '2026-07-06 19:12:34', '2026-08-13 19:55:24'),
(3, 'miyuwi', 'miyuwi@gmail.com', 'daily_only', NULL, '$2y$12$lkViJUHAWztwHSN.yJf4E.kf4CJV1./FqtxjsHSlFjjN4Oz3P3gc2', NULL, '2026-08-13 19:33:44', '2026-08-13 19:55:25'),
(4, 'Admin', 'admin@budget.com', 'admin', '2026-08-26 02:22:49', '$2y$12$1SfeXyj.cq9wfY.JhloV8uh1rocm8ZBEFOWhQ/kSWt61zAdujQU..', 'WHO8vfD1kR', '2026-08-26 02:22:50', '2026-08-26 02:22:50'),
(5, 'Geh', 'geh@gmail.com', 'daily_only', NULL, '$2y$12$wacnjEyvf3uIb5z4o43/suqVDth.DSVv29Zo6ysdRCpXjuxN6Kg4S', NULL, '2026-08-31 17:41:53', '2026-08-31 17:48:57');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_logs_loggable_type_loggable_id_index` (`loggable_type`,`loggable_id`),
  ADD KEY `activity_logs_user_id_foreign` (`user_id`);

--
-- Indexes for table `balance_entries`
--
ALTER TABLE `balance_entries`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `budgets`
--
ALTER TABLE `budgets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `budgets_category_id_month_year_unique` (`category_id`,`month`,`year`),
  ADD KEY `budgets_user_id_foreign` (`user_id`);

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
  ADD PRIMARY KEY (`id`),
  ADD KEY `categories_user_id_foreign` (`user_id`);

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
-- Indexes for table `middleman_fees`
--
ALTER TABLE `middleman_fees`
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
  ADD KEY `transactions_category_id_foreign` (`category_id`),
  ADD KEY `transactions_user_id_foreign` (`user_id`);

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
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=633;

--
-- AUTO_INCREMENT for table `balance_entries`
--
ALTER TABLE `balance_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `budgets`
--
ALTER TABLE `budgets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `business_budgets`
--
ALTER TABLE `business_budgets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `business_categories`
--
ALTER TABLE `business_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `business_transactions`
--
ALTER TABLE `business_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=116;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `golds`
--
ALTER TABLE `golds`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=270;

--
-- AUTO_INCREMENT for table `gold_logs`
--
ALTER TABLE `gold_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=368;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `middleman_fees`
--
ALTER TABLE `middleman_fees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `rucoy_accounts`
--
ALTER TABLE `rucoy_accounts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `savings`
--
ALTER TABLE `savings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `trades`
--
ALTER TABLE `trades`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=113;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=234;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `budgets`
--
ALTER TABLE `budgets`
  ADD CONSTRAINT `budgets_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `budgets_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `trades`
--
ALTER TABLE `trades`
  ADD CONSTRAINT `trades_gold_id_foreign` FOREIGN KEY (`gold_id`) REFERENCES `golds` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
