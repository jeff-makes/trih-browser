import Link from "next/link";
import { type ReactNode } from "react";

import { PillLink } from "./PillLink";
import styles from "./LayoutDetail.module.css";

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface LayoutDetailProps {
  title: string;
  subtitle?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  hideBreadcrumbs?: boolean;
  heroVariant?: "default" | "condensed";
}

const classNames = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

export function LayoutDetail({
  title,
  subtitle,
  breadcrumbs = [],
  meta,
  actions,
  children,
  hideBreadcrumbs = false,
  heroVariant = "default"
}: LayoutDetailProps): JSX.Element {
  const useCondensedHero = heroVariant === "condensed";
  const hasSupportingHeroContent = Boolean(subtitle || meta || actions);
  const isTitleOnlyHero = !useCondensedHero && !hasSupportingHeroContent;

  const pageClass = classNames(
    styles.page,
    useCondensedHero && styles.pageCondensed,
    isTitleOnlyHero && styles.pageHeroCompact
  );
  const heroClass = classNames(
    styles.hero,
    useCondensedHero && styles.heroCondensed,
    isTitleOnlyHero && styles.heroTitleOnly
  );
  const contentClass = classNames(
    styles.content,
    useCondensedHero && styles.contentCondensed,
    isTitleOnlyHero && styles.contentCompact
  );
  const footerClass = classNames(
    styles.footer,
    useCondensedHero && styles.footerCondensed,
    isTitleOnlyHero && styles.footerCompact
  );

  return (
    <div className={pageClass}>
      {!hideBreadcrumbs && breadcrumbs.length > 0 ? (
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href}>
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              <Link href={crumb.href}>{crumb.label}</Link>
            </span>
          ))}
        </nav>
      ) : null}
      <header className={heroClass}>
        <h1 className={styles.heroTitle}>{title}</h1>
        {subtitle ? <div className={styles.heroSubtitle}>{subtitle}</div> : null}
        {meta ? <div className={styles.metaRow}>{meta}</div> : null}
        {actions ? <div>{actions}</div> : null}
      </header>

      <main className={contentClass}>{children}</main>

      <footer className={footerClass}>
        <PillLink href="/" variant="series" className={styles.backLink}>
          ← Back to timeline
        </PillLink>
      </footer>
    </div>
  );
}

export default LayoutDetail;
