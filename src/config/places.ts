import registry from "../../data/rules/places.json";

export interface PlaceDefinition {
  id: string;
  preferredName: string;
  aliases: string[];
  type?: string;
  description?: string;
  notes?: string;
}

export const PLACE_DEFINITIONS: PlaceDefinition[] = registry;

const PLACE_BY_KEY: Record<string, PlaceDefinition> = PLACE_DEFINITIONS.reduce(
  (acc, definition) => {
    const preferred = definition.preferredName.trim().toLowerCase();
    acc[preferred] = definition;
    acc[definition.id.trim().toLowerCase()] = definition;
    definition.aliases.forEach((alias) => {
      acc[alias.trim().toLowerCase()] = definition;
    });
    return acc;
  },
  {} as Record<string, PlaceDefinition>
);

export function findPlace(value: string): PlaceDefinition | undefined {
  const key = value.trim().toLowerCase();
  return PLACE_BY_KEY[key];
}

export function findPlaceById(id: string): PlaceDefinition | undefined {
  return PLACE_BY_KEY[id.trim().toLowerCase()];
}
