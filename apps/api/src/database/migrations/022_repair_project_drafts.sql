SET
  @column_exists := (
    SELECT
      COUNT(*)
    FROM
      INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'projects'
      AND COLUMN_NAME = 'is_draft'
  );

SET
  @alter_sql := IF(
    @column_exists = 0,
    'ALTER TABLE projects ADD COLUMN is_draft TINYINT(1) NOT NULL DEFAULT 0 AFTER discipline_ids',
    'SELECT 1'
  );

PREPARE stmt
FROM
  @alter_sql;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;
