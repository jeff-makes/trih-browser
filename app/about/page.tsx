import type { Metadata } from "next";

import { StaticPageLayout } from "@/components/detail";

import styles from "../static-pages.module.css";

export const metadata: Metadata = {
  title: "About — The Rest Is History Explorer",
  description: "Why this fan-made explorer exists and what it is trying to solve."
};

export default function AboutPage(): JSX.Element {
  return (
    <StaticPageLayout
      title="About The Rest Is History Explorer"
      subtitle="Built by Jeff Talajic — a Rest Is History fan who wanted a faster way to revisit the archive."
    >
      <div className={styles.stack}>
        <p>
          This site started as a weekend tinkering project after one too many sessions scrolling through podcast apps
          to find a specific episode. I wanted a way to see the show as a living timeline, surface recurring people,
          places, and topics, and jump straight into deep dives without swiping through hundreds of tiles.
        </p>
        <p>
          What began as a personal reference quickly snowballed into a deterministic data pipeline, static JSON
          artefacts, and a polished web UI that anyone can browse. The goal is simple: make it easier for fellow fans to
          discover or rediscover episodes, series arcs, and thematic runs.
        </p>
        <ul>
          <li>Browse every series and standalone episode on a parchment-inspired vertical timeline.</li>
          <li>Open entity pages for people, places, and topics to see their full appearance history.</li>
          <li>Read lightweight notes on how the data is curated and how the site keeps things deterministic.</li>
        </ul>
        <div className={styles.callout}>
          This is an unofficial fan experience created for fun. It is not affiliated with Dominic Sandbrook, Tom
          Holland, Goalhanger, or the official Rest Is History podcast team.
        </div>
      </div>
    </StaticPageLayout>
  );
}
