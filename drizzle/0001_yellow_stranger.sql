CREATE TABLE `dream_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dream_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `dream_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `dream_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int,
	`slug` varchar(120) NOT NULL,
	`title` varchar(180) NOT NULL,
	`summary` text NOT NULL,
	`meaning` text NOT NULL,
	`luckyNumbers` varchar(120) NOT NULL,
	`imageUrl` varchar(1024),
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dream_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `dream_entries_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `lottery_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameType` enum('2d','3d') NOT NULL,
	`resultNumber` varchar(8) NOT NULL,
	`title` varchar(180) NOT NULL,
	`note` text,
	`sourceLabel` varchar(160),
	`drawAt` timestamp NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lottery_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `dream_entries_visibility_category_index` ON `dream_entries` (`status`,`categoryId`);--> statement-breakpoint
CREATE INDEX `lottery_results_visibility_draw_index` ON `lottery_results` (`status`,`drawAt`);--> statement-breakpoint
CREATE INDEX `lottery_results_type_draw_index` ON `lottery_results` (`gameType`,`drawAt`);