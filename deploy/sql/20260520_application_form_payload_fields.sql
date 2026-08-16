SET @has_premises_source_json := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'opc_applications'
    AND COLUMN_NAME = 'premises_source_json'
);
SET @sql := IF(
  @has_premises_source_json = 0,
  'ALTER TABLE `opc_applications` ADD COLUMN `premises_source_json` text NULL AFTER `form_snapshot_json`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_application_form_payload_json := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'opc_applications'
    AND COLUMN_NAME = 'application_form_payload_json'
);
SET @sql := IF(
  @has_application_form_payload_json = 0,
  'ALTER TABLE `opc_applications` ADD COLUMN `application_form_payload_json` text NULL AFTER `premises_source_json`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_payload_json := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'opc_application_drafts'
    AND COLUMN_NAME = 'payload_json'
);
SET @sql := IF(
  @has_payload_json = 0,
  'ALTER TABLE `opc_application_drafts` ADD COLUMN `payload_json` text NULL AFTER `material_refs`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
