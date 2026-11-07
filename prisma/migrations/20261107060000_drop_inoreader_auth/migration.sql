-- DropTable
-- Reverts the Inoreader-based "News Feeds" implementation in favor of
-- pulling directly from the site's own curated RSS sources (no third-party
-- account/OAuth needed) — see migration 20261107050000_add_inoreader_auth.
DROP TABLE "InoreaderAuth";
