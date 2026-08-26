ALTER TABLE `agents` MODIFY COLUMN `email` varchar(320);--> statement-breakpoint
ALTER TABLE `agents` MODIFY COLUMN `activationCodeHash` varchar(64);--> statement-breakpoint
ALTER TABLE `agents` MODIFY COLUMN `activationExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `agents` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `agents` ADD `passwordSalt` varchar(64);--> statement-breakpoint
ALTER TABLE `agents` ADD `mustChangePassword` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `agents` ADD `temporaryPasswordExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `agents` ADD `failedLoginCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `agents` ADD `lockedUntil` timestamp;--> statement-breakpoint
ALTER TABLE `agents` ADD `credentialIssuedAt` timestamp;--> statement-breakpoint
ALTER TABLE `agents` ADD `lastCredentialLoginAt` timestamp;