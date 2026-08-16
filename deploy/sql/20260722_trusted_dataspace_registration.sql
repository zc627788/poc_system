-- Trusted data space enterprise registration integration.
-- Idempotent for MySQL 8+: preserves all existing OPC data.

CREATE TABLE IF NOT EXISTS `trusted_dataspace_registrations` (
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

CREATE TABLE IF NOT EXISTS `trusted_dataspace_submission_attempts` (
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

UPDATE `resource_categories`
SET `action_type` = 'internal',
    `action_value` = '/trusted-data-space',
    `button_text` = '创建企业账号'
WHERE `code` = 'marketplace_city_dataspace';
