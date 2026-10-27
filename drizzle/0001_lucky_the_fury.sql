CREATE TABLE `ai_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`encrypted_key` text NOT NULL,
	`updated` integer NOT NULL,
	`last_request` integer DEFAULT 0 NOT NULL
);
