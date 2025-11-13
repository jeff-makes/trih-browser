import { describe, expect, it } from "vitest";

import { linkifyParagraph, segmentDescription } from "../description";

describe("segmentDescription", () => {
  it("splits narrative and promo paragraphs", () => {
    const markdown = [
      "Paragraph one about the story.",
      "Paragraph two keeps building context.",
      "*The Rest Is History Live Tour 2023*:",
      "Buy your tickets here: restishistorypod.com",
      "Twitter:",
      "@TheRestHistory",
      "Learn more about your ad choices. Visit podcastchoices.com/adchoices"
    ].join("\n\n");

    const result = segmentDescription(markdown);

    expect(result.intro).toEqual([
      "Paragraph one about the story.",
      "Paragraph two keeps building context."
    ]);
    expect(result.promo).toEqual([
      "*The Rest Is History Live Tour 2023*:",
      "Buy your tickets here: restishistorypod.com",
      "Twitter:",
      "@TheRestHistory",
      "Learn more about your ad choices. Visit podcastchoices.com/adchoices"
    ]);
  });

  it("returns all paragraphs when no promo markers are found", () => {
    const markdown = ["Only a single block.", "Another block."].join("\n\n");
    const result = segmentDescription(markdown);

    expect(result.promo).toHaveLength(0);
    expect(result.intro).toEqual(["Only a single block.", "Another block."]);
  });

  it("keeps all paragraphs when the first block is promo content", () => {
    const markdown = ["Twitter:", "@TheRestHistory"].join("\n\n");
    const result = segmentDescription(markdown);

    expect(result.promo).toHaveLength(0);
    expect(result.intro).toEqual(["Twitter:", "@TheRestHistory"]);
  });

  it("moves paragraphs with untrusted links into promo", () => {
    const markdown = [
      "Story paragraph one that provides plenty of context before any promos.",
      "Second paragraph keeps elaborating so the guard passes.",
      "Learn more at https://www.adobe.com/some/path"
    ].join("\n\n");
    const result = segmentDescription(markdown);

    expect(result.intro).toEqual([
      "Story paragraph one that provides plenty of context before any promos.",
      "Second paragraph keeps elaborating so the guard passes."
    ]);
    expect(result.promo).toEqual(["Learn more at https://www.adobe.com/some/path"]);
  });
});

describe("linkifyParagraph", () => {
  it("converts trusted domains into absolute links", () => {
    const segments = linkifyParagraph("Visit restishistory.com or www.goalhanger.com for more.");
    const links = segments.filter((segment) => segment.href);
    expect(links).toEqual([
      { text: "restishistory.com", href: "https://restishistory.com" },
      { text: "www.goalhanger.com", href: "https://goalhanger.com" }
    ]);
  });

  it("converts twitter handles into links", () => {
    const segments = linkifyParagraph("Follow @TheRestHistory and @holland_tom.");
    const links = segments.filter((segment) => segment.href);
    expect(links).toEqual([
      { text: "@TheRestHistory", href: "https://twitter.com/TheRestHistory" },
      { text: "@holland_tom", href: "https://twitter.com/holland_tom" }
    ]);
  });
});
