-- Wallet order payment: separate cash wallet from service prepaid credits.
-- Idempotent for MySQL 8+ (drop check if exists, re-add).

-- 1) billing_orders.payment_channel
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'billing_orders'
    AND COLUMN_NAME = 'payment_channel'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE `billing_orders` ADD COLUMN `payment_channel` varchar(16) DEFAULT NULL COMMENT ''EXTERNAL or WALLET'' AFTER `status`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ck_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'billing_orders'
    AND CONSTRAINT_NAME = 'ck_billing_orders_payment_channel'
);
SET @sql := IF(
  @ck_exists = 0,
  'ALTER TABLE `billing_orders` ADD CONSTRAINT `ck_billing_orders_payment_channel` CHECK (`payment_channel` IS NULL OR `payment_channel` IN (''EXTERNAL'',''WALLET''))',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) wallet_ledger source_type: only RECHARGE_ORDER credit + ORDER_PAYMENT debit for cash wallet
-- Drop old check, add new check including ORDER_PAYMENT (keep legacy source types for historical rows).
SET @ck_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'wallet_ledger_entries'
    AND CONSTRAINT_NAME = 'ck_wallet_ledger_entries_source_type'
);
SET @sql := IF(
  @ck_exists > 0,
  'ALTER TABLE `wallet_ledger_entries` DROP CHECK `ck_wallet_ledger_entries_source_type`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE `wallet_ledger_entries`
  ADD CONSTRAINT `ck_wallet_ledger_entries_source_type`
  CHECK (`source_type` IN ('PAID_ORDER','CONSUMPTION','RECHARGE_ORDER','ORDER_PAYMENT'));
