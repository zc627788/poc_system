SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `billing_products` (
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

INSERT INTO `billing_products` (
  `product_code`,
  `service_code`,
  `service_name`,
  `supplier_name`,
  `name`,
  `description`,
  `billing_mode`,
  `price`,
  `currency`,
  `sort_order`,
  `status`,
  `created_by`,
  `updated_by`,
  `created_at`,
  `updated_at`
)
SELECT
  'AI_COMPUTE_MONTHLY',
  'AI_COMPUTE',
  'AI 算力服务',
  '创新算力服务商',
  'AI 算力包月服务',
  '按月提供稳定算力资源，适合持续开发和模型推理场景。',
  'MONTHLY',
  299.00,
  'CNY',
  10,
  'ON_SALE',
  1,
  1,
  '2026-07-14 00:00:00',
  '2026-07-14 00:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM `billing_products` WHERE `product_code` = 'AI_COMPUTE_MONTHLY'
);

INSERT INTO `billing_products` (
  `product_code`,
  `service_code`,
  `service_name`,
  `supplier_name`,
  `name`,
  `description`,
  `billing_mode`,
  `price`,
  `currency`,
  `sort_order`,
  `status`,
  `created_by`,
  `updated_by`,
  `created_at`,
  `updated_at`
)
SELECT
  'AI_COMPUTE_1000',
  'AI_COMPUTE',
  'AI 算力服务',
  '创新算力服务商',
  'AI 算力充值 1000 元',
  '固定面额预充值，用于后续按实际算力消费明细扣减。',
  'PREPAID',
  1000.00,
  'CNY',
  20,
  'ON_SALE',
  1,
  1,
  '2026-07-14 00:00:00',
  '2026-07-14 00:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM `billing_products` WHERE `product_code` = 'AI_COMPUTE_1000'
);

INSERT INTO `billing_products` (
  `product_code`,
  `service_code`,
  `service_name`,
  `supplier_name`,
  `name`,
  `description`,
  `billing_mode`,
  `price`,
  `currency`,
  `sort_order`,
  `status`,
  `created_by`,
  `updated_by`,
  `created_at`,
  `updated_at`
)
SELECT
  'AI_COMPUTE_2000',
  'AI_COMPUTE',
  'AI 算力服务',
  '创新算力服务商',
  'AI 算力充值 2000 元',
  '固定面额预充值，适合较高频的算力使用场景。',
  'PREPAID',
  2000.00,
  'CNY',
  30,
  'OFF_SALE',
  1,
  1,
  '2026-07-14 00:00:00',
  '2026-07-14 00:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM `billing_products` WHERE `product_code` = 'AI_COMPUTE_2000'
);
