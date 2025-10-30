type JsonPrimitive = string | number | boolean | null;

type JsonValue = JsonPrimitive | JsonObject | JsonArray;

interface JsonObject {
  [key: string]: JsonValue;
}

type JsonArray = JsonValue[];

const isPlainObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && (value as Record<string, unknown>).constructor === Object;

const sortJsonValue = (value: JsonValue): JsonValue => {
  if (Array.isArray(value)) {
    return value.map((item) => sortJsonValue(item));
  }

  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce<JsonObject>((acc, key) => {
        acc[key] = sortJsonValue(value[key]);
        return acc;
      }, {});
  }

  return value;
};

/**
 * Serialises JSON deterministically by sorting object keys alphabetically at every level.
 * @param value Arbitrary JSON-compatible value.
 */
export const stableStringify = (value: JsonValue): string => {
  const sorted = sortJsonValue(value);
  return JSON.stringify(sorted);
};

export default stableStringify;
