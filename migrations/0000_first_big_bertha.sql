CREATE TABLE `emails` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`labelIds` text,
	`snippet` text,
	`subject` text,
	`from` text,
	`date` text,
	`threadId` text,
	`replyTo` text,
	`plainText` text,
	`htmlBody` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `emails_id_unique` ON `emails` (`id`);--> statement-breakpoint
CREATE TABLE `linked_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`primaryEmail` text NOT NULL,
	`email` text NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`image` text,
	`historyId` text,
	`expires_at` integer,
	`firstSync` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `linked_accounts_email_unique` ON `linked_accounts` (`email`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`historyId` text,
	`createdAt` integer,
	`firstSync` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);