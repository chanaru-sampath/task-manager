CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`dueOn` text NOT NULL,
	`priority` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`index` real NOT NULL
);
