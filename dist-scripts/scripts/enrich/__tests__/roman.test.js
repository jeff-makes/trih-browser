"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const roman_1 = require("../roman");
(0, node_test_1.default)("roman numerals convert correctly", () => {
    strict_1.default.equal((0, roman_1.romanToInt)("I"), 1);
    strict_1.default.equal((0, roman_1.romanToInt)("IV"), 4);
    strict_1.default.equal((0, roman_1.romanToInt)("IX"), 9);
    strict_1.default.equal((0, roman_1.romanToInt)("XII"), 12);
    strict_1.default.equal((0, roman_1.romanToInt)("XXIX"), 29);
    strict_1.default.equal((0, roman_1.romanToInt)("LXXX"), 80);
    strict_1.default.equal((0, roman_1.romanToInt)("c"), 100);
});
(0, node_test_1.default)("roman numerals reject invalid strings", () => {
    strict_1.default.equal((0, roman_1.romanToInt)(""), null);
    strict_1.default.equal((0, roman_1.romanToInt)("ggg"), null);
});
