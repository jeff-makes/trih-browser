"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeUmbrella = normalizeUmbrella;
exports.sanitizeUmbrellas = sanitizeUmbrellas;
exports.getControlledUmbrellas = getControlledUmbrellas;
const utils_1 = require("./utils");
const CONTROLLED_LABELS = [
    "Nelson",
    "Napoleonic Era",
    "WWII",
    "WWI",
    "American Revolution",
    "Reformation",
    "Byzantium",
    "Rome",
    "Cleopatra",
    "Charlemagne/Franks",
    "Hundred Years' War",
    "Luther",
    "Titanic",
    "Elections UK",
    "Churchill",
    "Reagan",
    "Columbus",
    "Vikings",
    "Middle Ages",
    "Ancient Egypt",
    "Cold War",
    "French Revolution",
    "Great Northern War",
];
const CONTROLLED_SET = new Set(CONTROLLED_LABELS.map((label) => (0, utils_1.toKebabCase)(label)));
function normalizeUmbrella(label) {
    return (0, utils_1.toKebabCase)(label);
}
function sanitizeUmbrellas(input) {
    const extras = [];
    const result = [];
    for (const label of input) {
        if (!label)
            continue;
        const normalized = normalizeUmbrella(label);
        if (!normalized)
            continue;
        if (CONTROLLED_SET.has(normalized)) {
            if (!result.includes(normalized)) {
                result.push(normalized);
            }
            continue;
        }
        if (extras.includes(normalized)) {
            continue;
        }
        if (extras.length < 2) {
            extras.push(normalized);
            result.push(normalized);
        }
    }
    return result;
}
function getControlledUmbrellas() {
    return Array.from(CONTROLLED_SET);
}
