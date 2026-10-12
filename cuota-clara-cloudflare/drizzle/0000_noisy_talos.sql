CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`amount` integer NOT NULL,
	`due_day` integer NOT NULL,
	`reminder_day` integer NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`consent` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contacts_phone_unique` ON `contacts` (`phone`);--> statement-breakpoint
CREATE TABLE `payments` (
	`contact_id` text NOT NULL,
	`period` text NOT NULL,
	`paid_at` text NOT NULL,
	PRIMARY KEY(`contact_id`, `period`)
);
--> statement-breakpoint
CREATE TABLE `sends` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_id` text NOT NULL,
	`name` text NOT NULL,
	`period` text NOT NULL,
	`status` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`template` text DEFAULT 'recordatorio_mensualidad' NOT NULL,
	`language` text DEFAULT 'es_CL' NOT NULL
);
