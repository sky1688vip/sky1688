CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`fullName` varchar(160) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(40),
	`agentCode` varchar(32) NOT NULL,
	`status` enum('invited','active','suspended') NOT NULL DEFAULT 'invited',
	`activationCodeHash` varchar(64) NOT NULL,
	`activationExpiresAt` timestamp NOT NULL,
	`activatedAt` timestamp,
	`suspendedAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `agents_user_id_unique` UNIQUE(`userId`),
	CONSTRAINT `agents_email_unique` UNIQUE(`email`),
	CONSTRAINT `agents_code_unique` UNIQUE(`agentCode`),
	CONSTRAINT `agents_activation_hash_unique` UNIQUE(`activationCodeHash`)
);
--> statement-breakpoint
CREATE TABLE `player_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(160),
	`status` enum('active','suspended') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `player_profiles_user_id_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','agent','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE INDEX `agents_status_created_index` ON `agents` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `player_profiles_status_created_index` ON `player_profiles` (`status`,`createdAt`);