import { type ReactNode } from "react";

import { PillLink } from "./PillLink";
import styles from "./StaticPageLayout.module.css";

interface StaticPageLayoutProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  backHref?: string;
}

export function StaticPageLayout({ title, subtitle, children, backHref = "/" }: StaticPageLayoutProps): JSX.Element {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </header>

      <main className={styles.content}>{children}</main>

      {backHref ? (
        <footer className={styles.footer}>
          <PillLink href={backHref} variant="series">
            ← Back to timeline
          </PillLink>
        </footer>
      ) : null}
    </div>
  );
}

export default StaticPageLayout;
