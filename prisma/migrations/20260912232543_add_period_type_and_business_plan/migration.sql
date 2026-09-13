-- AlterTable
ALTER TABLE `report_logs` ADD COLUMN `period_type` VARCHAR(10) NOT NULL DEFAULT 'day';

-- CreateTable
CREATE TABLE `business_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `month` VARCHAR(7) NOT NULL,
    `target_revenue` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `business_plans_month_key`(`month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `report_logs_period_type_reportDate_key` ON `report_logs`(`period_type`, `reportDate`);

