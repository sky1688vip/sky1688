CREATE TABLE `player_home_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slot` enum('brand_logo','hero_banner','quick_result','quick_dream','quick_unit','quick_profile','notice_icon') NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`imageUrl` varchar(1024) NOT NULL,
	`altText` varchar(180) NOT NULL,
	`updatedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_home_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `player_home_assets_slot_unique` UNIQUE(`slot`)
);
