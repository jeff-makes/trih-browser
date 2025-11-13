"use client";

import { useState } from "react";

import { linkifyParagraph } from "@/lib/description";

import styles from "./ReadMoreDescription.module.css";

export interface ReadMoreDescriptionProps {
  introParagraphs: string[];
  promoParagraphs?: string[];
  className?: string;
}

const classNames = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

const renderParagraph = (paragraph: string, key: string) => {
  const lines = paragraph.split(/\n+/);
  return (
    <p key={key}>
      {lines.map((line, lineIndex) => (
        <span key={`${key}-line-${lineIndex}`}>
          {linkifyParagraph(line).map((segment, segmentIndex) =>
            segment.href ? (
              <a
                key={`${key}-line-${lineIndex}-segment-${segmentIndex}`}
                href={segment.href}
                target="_blank"
                rel="noreferrer"
              >
                {segment.text}
              </a>
            ) : (
              <span key={`${key}-line-${lineIndex}-segment-${segmentIndex}`}>{segment.text}</span>
            )
          )}
          {lineIndex < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </p>
  );
};

export function ReadMoreDescription({
  introParagraphs,
  promoParagraphs = [],
  className
}: ReadMoreDescriptionProps): JSX.Element {
  const [isExpanded, setExpanded] = useState(false);
  const showPromo = promoParagraphs.length > 0;

  return (
    <div className={classNames(styles.container, className)}>
      {introParagraphs.map((paragraph, index) => renderParagraph(paragraph, `intro-${index}`))}

      {showPromo && isExpanded
        ? promoParagraphs.map((paragraph, index) => renderParagraph(paragraph, `promo-${index}`))
        : null}

      {showPromo ? (
        <div className={styles.toggleRow}>
          <button type="button" className={styles.toggleButton} onClick={() => setExpanded((value) => !value)}>
            {isExpanded ? "Show less" : "Read more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default ReadMoreDescription;
