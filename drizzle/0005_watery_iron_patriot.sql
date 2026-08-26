ALTER TABLE `player_profiles` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `player_profiles` MODIFY COLUMN `status` enum('invited','active','suspended') NOT NULL DEFAULT 'invited';--> statement-breakpoint
ALTER TABLE `player_invitations` ADD `playerProfileId` int;--> statement-breakpoint
ALTER TABLE `player_invitations` ADD `redeemedByPlayerProfileId` int;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `invitationId` int;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `playerCode` varchar(32);--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `passwordSalt` varchar(64);--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `mustChangePassword` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `temporaryPasswordExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `failedLoginCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `lockedUntil` timestamp;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `credentialIssuedAt` timestamp;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `lastCredentialLoginAt` timestamp;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `activatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `player_invitations` ADD CONSTRAINT `player_invitations_profile_id_unique` UNIQUE(`playerProfileId`);--> statement-breakpoint
ALTER TABLE `player_profiles` ADD CONSTRAINT `player_profiles_code_unique` UNIQUE(`playerCode`);--> statement-breakpoint
ALTER TABLE `player_profiles` ADD CONSTRAINT `player_profiles_invitation_id_unique` UNIQUE(`invitationId`);