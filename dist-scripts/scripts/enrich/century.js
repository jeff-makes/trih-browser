"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.centuryLabelToRange = centuryLabelToRange;
exports.loadCenturyMap = loadCenturyMap;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sync_1 = require("csv-parse/sync");
const CANDIDATE_FILES = [
    ["data", "century-map.csv"],
    ["docs", "century-map.csv"],
    ["data", "century-map.json"],
    ["docs", "century-map.json"],
];
function centuryLabelToRange(label) {
    const trimmed = label.trim().toLowerCase();
    const simple = trimmed.match(/^(\d{3,4})s$/);
    if (simple) {
        const start = Number.parseInt(simple[1], 10);
        if (!Number.isNaN(start)) {
            return { from: start, to: start + 99 };
        }
    }
    const centuryMatch = trimmed.match(/^(\d{1,2})(st|nd|rd|th)\s+century\s*(bc|ad)?$/);
    if (centuryMatch) {
        const order = Number.parseInt(centuryMatch[1], 10);
        if (Number.isNaN(order))
            return null;
        const era = centuryMatch[3];
        const from = (order - 1) * 100 + 1;
        const to = order * 100;
        if (era === "bc") {
            return { from: -to, to: -(from - 1) };
        }
        return { from, to };
    }
    return null;
}
function loadCsv(filePath) {
    const raw = fs_1.default.readFileSync(filePath, "utf8");
    const records = (0, sync_1.parse)(raw, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });
    const map = new Map();
    for (const record of records) {
        const keys = Object.keys(record);
        if (!keys.length)
            continue;
        const episodeKey = keys.find((key) => key.toLowerCase().includes("episode")) ?? keys[0];
        const labelKey = keys.find((key) => key.toLowerCase().includes("century")) ?? keys[1];
        if (!labelKey)
            continue;
        const episodeValue = Number.parseInt(record[episodeKey], 10);
        if (Number.isNaN(episodeValue))
            continue;
        const labelValue = record[labelKey];
        if (!labelValue)
            continue;
        map.set(episodeValue, labelValue);
    }
    return map;
}
function loadJson(filePath) {
    const raw = fs_1.default.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    const map = new Map();
    if (Array.isArray(parsed)) {
        for (const item of parsed) {
            if (!item)
                continue;
            const episode = Number(item.episode);
            if (Number.isNaN(episode))
                continue;
            if (typeof item.label !== "string")
                continue;
            map.set(episode, item.label);
        }
        return map;
    }
    for (const [key, value] of Object.entries(parsed)) {
        const episode = Number.parseInt(key, 10);
        if (Number.isNaN(episode))
            continue;
        if (typeof value !== "string")
            continue;
        map.set(episode, value);
    }
    return map;
}
function loadCenturyMap(rootDir) {
    for (const segments of CANDIDATE_FILES) {
        const resolved = path_1.default.join(rootDir, ...segments);
        if (!fs_1.default.existsSync(resolved))
            continue;
        try {
            if (resolved.endsWith(".csv")) {
                return loadCsv(resolved);
            }
            if (resolved.endsWith(".json")) {
                return loadJson(resolved);
            }
        }
        catch (error) {
            console.warn(`Failed to parse century map at ${resolved}:`, error);
        }
    }
    return new Map();
}
