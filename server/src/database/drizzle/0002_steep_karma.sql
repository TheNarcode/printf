PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_files` (
	`id` text PRIMARY KEY NOT NULL,
	`order` text NOT NULL,
	`orientation` text NOT NULL,
	`color` text NOT NULL,
	`copies` text NOT NULL,
	`paper_format` text NOT NULL,
	`file` text NOT NULL,
	`page_ranges` text NOT NULL,
	`number_up` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_files`("id", "order", "orientation", "color", "copies", "paper_format", "file", "page_ranges", "number_up") SELECT "id", "order", "orientation", "color", "copies", "paper_format", "file", "page_ranges", "number_up" FROM `files`;--> statement-breakpoint
DROP TABLE `files`;--> statement-breakpoint
ALTER TABLE `__new_files` RENAME TO `files`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `orders` ADD `name` text NOT NULL;