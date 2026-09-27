import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile("app/titan/components/role-details.tsx", "utf8");
const css = await readFile("app/globals.css", "utf8");

test("Schedule exposes proactive risk intelligence and recovery", () => {
  assert.match(source, /go-schedule-intelligence\.mjs/);
  assert.match(source, /Day risk forecast/);
  assert.match(source, /Access not confirmed/);
  assert.match(source, /Spot cleaner missing/);
  assert.match(source, /Prepare customer ETA/);
  assert.match(source, /Notify dispatch/);
  assert.match(source, /No schedule change without a receipt/);
});

test("Schedule cards retain alternating colours and readable responsive details", () => {
  assert.match(css, /\.schedule-intelligence/);
  assert.match(css, /\.field-card\.tone-0/);
  assert.match(css, /\.field-card\.tone-1/);
  assert.match(css, /\.field-card\.tone-2/);
  assert.match(css, /\.job-risk-detail/);
  assert.match(css, /@media \(max-width:\s*600px\)/);
});
