-- AlterTable: add agent_trace column to report_logs
ALTER TABLE `report_logs` ADD COLUMN `agent_trace` JSON NULL;

-- CreateTable: report_feedback
CREATE TABLE `report_feedback` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `report_log_id` INTEGER NOT NULL,
    `rating` TINYINT NOT NULL,
    `comment` TEXT NULL,
    `created_by` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`),
    CONSTRAINT `report_feedback_report_log_id_fkey` FOREIGN KEY (`report_log_id`) REFERENCES `report_logs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
