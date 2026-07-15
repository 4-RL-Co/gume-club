-- The ISBNs already on editions have to exist in identifiers too, or the import
-- matcher (which looks up identifiers first) would re-import books we already
-- have, and the seeded shelf would collide with the Open Library catalog.
INSERT INTO "identifiers" ("edition_id", "kind", "value")
SELECT "id", 'isbn13', "isbn13"
FROM "editions"
WHERE "isbn13" IS NOT NULL
ON CONFLICT ("kind", "value") DO NOTHING;
