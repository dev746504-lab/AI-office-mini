-- AlterTable
ALTER TABLE `app_settings` ADD COLUMN `content_send_hour` TINYINT NOT NULL DEFAULT 8,
    ADD COLUMN `content_send_minute` TINYINT NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `brand_context` (
    `id` INTEGER NOT NULL,
    `store_name` VARCHAR(255) NULL,
    `store_address` VARCHAR(500) NULL,
    `products_overview` TEXT NULL,
    `target_audience` TEXT NULL,
    `tone_of_voice` TEXT NULL,
    `unique_points` TEXT NULL,
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_schedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `day_of_week` TINYINT NOT NULL,
    `theme` VARCHAR(255) NULL,
    `notes` TEXT NULL,

    UNIQUE INDEX `content_schedule_day_of_week_key`(`day_of_week`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content_date` DATE NOT NULL,
    `fb_post` MEDIUMTEXT NULL,
    `ad_script` MEDIUMTEXT NULL,
    `status` VARCHAR(20) NOT NULL,
    `error_message` TEXT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `content_logs_content_date_key`(`content_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
