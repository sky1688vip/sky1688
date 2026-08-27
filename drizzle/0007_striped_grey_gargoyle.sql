CREATE TABLE `unit_balances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerType` enum('agent','player') NOT NULL,
	`ownerId` int NOT NULL,
	`availableUnits` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unit_balances_id` PRIMARY KEY(`id`),
	CONSTRAINT `unit_balances_owner_unique` UNIQUE(`ownerType`,`ownerId`)
);
--> statement-breakpoint
CREATE TABLE `unit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionType` enum('admin_issue','agent_transfer') NOT NULL,
	`amount` int NOT NULL,
	`fromOwnerType` enum('system','agent') NOT NULL,
	`fromOwnerId` int,
	`toOwnerType` enum('agent','player') NOT NULL,
	`toOwnerId` int NOT NULL,
	`performedByUserId` int NOT NULL,
	`note` varchar(240),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `unit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `unit_balances_owner_type_units_index` ON `unit_balances` (`ownerType`,`availableUnits`);--> statement-breakpoint
CREATE INDEX `unit_transactions_to_owner_created_index` ON `unit_transactions` (`toOwnerType`,`toOwnerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `unit_transactions_from_owner_created_index` ON `unit_transactions` (`fromOwnerType`,`fromOwnerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `unit_transactions_performed_created_index` ON `unit_transactions` (`performedByUserId`,`createdAt`);