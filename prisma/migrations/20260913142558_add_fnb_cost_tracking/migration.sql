-- AlterTable
ALTER TABLE `business_plans` ADD COLUMN `cost_budget_total` INTEGER NULL,
    ADD COLUMN `target_avg_ticket` INTEGER NULL,
    ADD COLUMN `target_orders` INTEGER NULL;

-- CreateTable
CREATE TABLE `cost_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `description` VARCHAR(500) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_fixed` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_costs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `category_id` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `notes` VARCHAR(500) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `daily_costs_date_idx`(`date`),
    UNIQUE INDEX `daily_costs_date_category_id_key`(`date`, `category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monthly_cost_budgets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `month` VARCHAR(7) NOT NULL,
    `category_id` INTEGER NOT NULL,
    `budget_amount` INTEGER NOT NULL,
    `notes` VARCHAR(500) NULL,
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `monthly_cost_budgets_month_category_id_key`(`month`, `category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `daily_costs` ADD CONSTRAINT `daily_costs_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `cost_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monthly_cost_budgets` ADD CONSTRAINT `monthly_cost_budgets_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `cost_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
