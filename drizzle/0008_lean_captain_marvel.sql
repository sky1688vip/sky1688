CREATE TABLE `player_account_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerProfileId` int NOT NULL,
	`agentId` int NOT NULL,
	`eventType` enum('suspended','reactivated','password_reset') NOT NULL,
	`performedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_account_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `unit_transactions` MODIFY COLUMN `transactionType` enum('admin_issue','agent_transfer','agent_adjustment_credit','agent_adjustment_debit') NOT NULL;--> statement-breakpoint
CREATE INDEX `player_account_events_profile_created_index` ON `player_account_events` (`playerProfileId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `player_account_events_agent_created_index` ON `player_account_events` (`agentId`,`createdAt`);