-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'ai_manager',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `app_settings` (
    `id` INTEGER NOT NULL,
    `kiotviet_client_id` VARCHAR(255) NULL,
    `kiotviet_client_secret` VARCHAR(255) NULL,
    `kiotviet_retailer` VARCHAR(100) NULL,
    `kiotviet_token_url` VARCHAR(255) NOT NULL DEFAULT 'https://id.kiotviet.vn/connect/token',
    `kiotviet_api_base_url` VARCHAR(255) NOT NULL DEFAULT 'https://public.kiotviet.vn',
    `anthropic_api_key` VARCHAR(255) NULL,
    `smtp_host` VARCHAR(100) NULL,
    `smtp_port` INTEGER NOT NULL DEFAULT 465,
    `smtp_secure` BOOLEAN NOT NULL DEFAULT true,
    `smtp_user` VARCHAR(255) NULL,
    `smtp_pass` VARCHAR(255) NULL,
    `report_email_from` VARCHAR(255) NULL,
    `report_email_to` TEXT NULL,
    `report_send_hour` TINYINT NOT NULL DEFAULT 23,
    `report_send_minute` TINYINT NOT NULL DEFAULT 0,
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reportDate` DATE NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `invoiceCount` INTEGER NOT NULL DEFAULT 0,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

