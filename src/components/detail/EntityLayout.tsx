import type { ReactNode } from "react";

import { PillLink } from "./PillLink";
import styles from "./EntityLayout.module.css";

export interface EntityLayoutProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}

const hasVisibleContent = (value?: ReactNode): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return true;
};

export function EntityLayout({ title, subtitle, children }: EntityLayoutProps): JSX.Element {
  const showSubtitle = hasVisibleContent(subtitle);

  return (
    <div className={styles.page}>
      <header className={showSubtitle ? styles.hero : styles.heroCompact}>
        <h1 className={styles.title}>{title}</h1>
        {showSubtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
      </header>

      <main className={styles.content}>{children}</main>

      <footer className={styles.footer}>
        <PillLink href="/" variant="series">
          ← Back to timeline
        </PillLink>
      </footer>
    </div>
  );
}

export default EntityLayout;
