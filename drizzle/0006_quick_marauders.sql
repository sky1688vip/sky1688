ALTER TABLE `player_profiles` ADD `phone` varchar(40);--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `bankAccountName` varchar(160);--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `bankType` varchar(120);--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `streamerAccount` varchar(120);--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `bankAccountNumberEncrypted` text;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `bankAccountNumberIv` varchar(32);