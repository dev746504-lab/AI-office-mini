-- CreateTable
CREATE TABLE `agent_send_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agent_name` VARCHAR(50) NOT NULL,
    `send_hour` TINYINT NOT NULL DEFAULT 8,
    `send_minute` TINYINT NOT NULL DEFAULT 0,
    `enabled` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `agent_send_config_agent_name_key`(`agent_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agent_schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agent_name` VARCHAR(50) NOT NULL,
    `day_of_week` TINYINT NOT NULL,
    `theme` VARCHAR(255) NULL,
    `notes` TEXT NULL,

    UNIQUE INDEX `agent_schedules_agent_name_day_of_week_key`(`agent_name`, `day_of_week`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agent_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agent_name` VARCHAR(50) NOT NULL,
    `run_date` DATE NOT NULL,
    `output` MEDIUMTEXT NULL,
    `status` VARCHAR(20) NOT NULL,
    `error_message` TEXT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `agent_logs_agent_name_run_date_key`(`agent_name`, `run_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
