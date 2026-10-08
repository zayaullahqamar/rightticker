CREATE TABLE `watchlist` (
	`visitor_id` text NOT NULL,
	`ticker` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`visitor_id`, `ticker`)
);
