import test from "node:test";
import assert from "node:assert/strict";
import { romanToInt } from "../roman";

test("roman numerals convert correctly", () => {
  assert.equal(romanToInt("I"), 1);
  assert.equal(romanToInt("IV"), 4);
  assert.equal(romanToInt("IX"), 9);
  assert.equal(romanToInt("XII"), 12);
  assert.equal(romanToInt("XXIX"), 29);
  assert.equal(romanToInt("LXXX"), 80);
  assert.equal(romanToInt("c"), 100);
});

test("roman numerals reject invalid strings", () => {
  assert.equal(romanToInt(""), null);
  assert.equal(romanToInt("ggg"), null);
});
