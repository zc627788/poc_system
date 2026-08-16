SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `billing_orders` (
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
  CONSTRAINT `ck_billing_orders_period` CHECK (
    (`billing_mode` = 'MONTHLY' AND `month_count` BETWEEN 1 AND 36 AND `service_start_date` IS NOT NULL AND `service_end_date` IS NOT NULL)
    OR (`billing_mode` = 'PREPAID' AND `month_count` IS NULL AND `service_start_date` IS NULL AND `service_end_date` IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
