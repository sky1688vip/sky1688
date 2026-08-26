CREATE TABLE `player_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`status` enum('issued','redeemed','revoked') NOT NULL DEFAULT 'issued',
	`expiresAt` timestamp NOT NULL,
	`redeemedByUserId` int,
	`redeemedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `player_invitations_token_hash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `agentId` int;--> statement-breakpoint
CREATE INDEX `player_invitations_agent_status_created_index` ON `player_invitations` (`agentId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `player_invitations_status_expires_index` ON `player_invitations` (`status`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `player_profiles_agent_created_index` ON `player_profiles` (`agentId`,`createdAt`);