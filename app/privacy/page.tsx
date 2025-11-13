import type { Metadata } from "next";

import { LayoutDetail } from "@/components/detail";

import styles from "../static-pages.module.css";

export const metadata: Metadata = {
  title: "Privacy — The Rest Is History Explorer",
  description: "Plain-language privacy details for this fan-built site."
};

export default function PrivacyPage(): JSX.Element {
  return (
    <LayoutDetail
      title="Privacy Policy"
      subtitle="This fan site keeps things lightweight—no accounts, trackers, or behavioural profiling."
      heroVariant="condensed"
      hideBreadcrumbs
    >
      <div className={styles.stack}>
        <p>
          The Rest Is History Explorer is a static site backed by deterministic JSON files. It does not accept user
          submissions, run forms, or ask for personal information. Visiting the site is equivalent to loading any other
          static page on the web.
        </p>
        <p>
          Basic server logs (handled by the hosting provider) may capture anonymised request data such as IP address,
          user-agent, and timestamp for the sole purpose of operating the service and preventing abuse. These logs are
          automatically rotated by the host and are never pulled into a separate database.
        </p>
        <p>
          There are currently no analytics, ad tags, or third-party trackers embedded in the site. If light-weight
          instrumentation is added in the future, this page will be updated before it goes live.
        </p>
        <p>
          If you have questions or need something removed, reach out directly to Jeff Talajic via the project’s GitHub
          issues list or the contact details shared with collaborators.
        </p>
        <div className={styles.callout}>
          tl;dr — browse freely. This project stores no personal data beyond the transient infrastructure logs required
          to keep the site online.
        </div>
      </div>
    </LayoutDetail>
  );
}
