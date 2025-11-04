import registry from "../../data/rules/people.json";

export interface PersonDefinition {
  id: string;
  preferredName: string;
  aliases: string[];
  type?: string;
  description?: string;
  notes?: string;
}

export const PEOPLE_DEFINITIONS: PersonDefinition[] = registry;

const PERSON_BY_KEY: Record<string, PersonDefinition> = PEOPLE_DEFINITIONS.reduce(
  (acc, definition) => {
    const preferred = definition.preferredName.trim().toLowerCase();
    acc[preferred] = definition;
    acc[definition.id.trim().toLowerCase()] = definition;
    definition.aliases.forEach((alias) => {
      acc[alias.trim().toLowerCase()] = definition;
    });
    return acc;
  },
  {} as Record<string, PersonDefinition>
);

export function findPerson(value: string): PersonDefinition | undefined {
  const key = value.trim().toLowerCase();
  return PERSON_BY_KEY[key];
}

export function findPersonById(id: string): PersonDefinition | undefined {
  return PERSON_BY_KEY[id.trim().toLowerCase()];
}
