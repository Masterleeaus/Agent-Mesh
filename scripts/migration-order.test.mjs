import assert from "node:assert/strict";
import test from "node:test";
import { orderMigrationNames } from "./list-migrations.mjs";

test("migration order uses full filenames, independent of directory enumeration order", () => {
  const names = [
    "152_field_service_report_acknowledgements.sql",
    "152_booking_routing_book_work.sql",
    "151_field_completion_evidence.sql",
    "151_business_pricing_settings.sql",
    "README.sql",
    "002_seed_dev.sql",
  ];

  const expected = [
    "002_seed_dev.sql",
    "151_business_pricing_settings.sql",
    "151_field_completion_evidence.sql",
    "152_booking_routing_book_work.sql",
    "152_field_service_report_acknowledgements.sql",
    "README.sql",
  ];

  assert.deepEqual(orderMigrationNames(names), expected);
  assert.deepEqual(orderMigrationNames([...names].reverse()), expected);
});

test("migration ordering excludes non-SQL files without filtering seeds", () => {
  assert.deepEqual(
    orderMigrationNames(["b.sql", "a.txt", "002_seed_dev.sql", "a.sql"]),
    ["002_seed_dev.sql", "a.sql", "b.sql"],
  );
});
