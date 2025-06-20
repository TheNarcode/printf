CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`order` text NOT NULL,
	`is_landscape` integer DEFAULT false NOT NULL,
	`is_color` integer DEFAULT false NOT NULL,
	`copies` integer DEFAULT 1 NOT NULL,
	`paper_format` text DEFAULT 'a4' NOT NULL,
	`file` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user` text NOT NULL,
	`amount` real NOT NULL,
	`paid` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`email` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
