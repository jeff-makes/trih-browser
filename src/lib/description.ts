export interface DescriptionSegments {
  intro: string[];
  promo: string[];
}

export interface TextSegment {
  text: string;
  href?: string;
}

const AD_CHOICES_REGEX = /learn more about your ad choices\.?\s+visit podcastchoices\.com\/adchoices/i;
const DIVIDER_REGEX = /^[-_*]{3,}$|^_{3,}$/;
const CREDIT_PREFIXES = [
  "producer",
  "assistant producer",
  "associate producer",
  "executive producer",
  "senior producer",
  "video editor",
  "social producer",
  "assistant editor",
  "research",
  "researcher",
  "editor"
];
const SOCIAL_HEADINGS = ["twitter", "instagram", "facebook", "youtube", "tiktok", "threads", "mastodon"];
const PROMO_KEYWORDS = [
  "the rest is history club",
  "rest is history club",
  "rest is history live",
  "rest is history live tour",
  "rest is history live in",
  "rest is history live at",
  "restishistorypod.com",
  "restishistory.com",
  "therestishistory.com",
  "goalhanger",
  "bonus episodes",
  "ad-free listening",
  "discord chatroom",
  "members-only newsletter",
  "tickets on sale",
  "buy your tickets",
  "book your tickets",
  "live on stage",
  "live in",
  "live at",
  "exclusive deal",
  "exclusive nordvpn deal",
  "use code",
  "sponsored by",
  "nordvpn",
  "merch store",
  "shop.the rest is history"
];
const PROMO_URL_REGEX = /https?:\/\/\S*(restishistory|therestishistory|restishistorypod|goalhanger|nordvpn|podcastchoices)\S*/i;
const TRUSTED_DOMAINS = ["goalhanger.com", "restishistory.com", "restishistorypod.com", "therestishistory.com"];
const TRUSTED_URL_REGEX = new RegExp(
  `((?:https?:\\/\\/)?(?:www\\.)?(?:${TRUSTED_DOMAINS.map((domain) => domain.replace(/\./g, "\\.")).join("|")})(?:[\\w\\-./?%=&+#]*)?)`,
  "gi"
);
const SOCIAL_HANDLE_REGEX = /@([a-z0-9_.]+)/gi;
const URL_INDICATOR_REGEX = /(https?:\/\/|www\.)/i;
const TRAILING_PUNCTUATION_REGEX = /[),.;:!?]+$/;

const normalizeParagraph = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .replace(/[*`_]/g, " ")
    .trim();

const isDivider = (value: string) => {
  const compact = value.replace(/\s+/g, "");
  return DIVIDER_REGEX.test(compact);
};

const hasPromoKeyword = (value: string) => PROMO_KEYWORDS.some((keyword) => value.includes(keyword));

const startsWithCredit = (value: string) =>
  CREDIT_PREFIXES.some((prefix) => value.startsWith(`${prefix}:`) || value.startsWith(`${prefix} -`));

const isSocialHeading = (value: string) =>
  SOCIAL_HEADINGS.some((heading) => value === heading || value === `${heading}:`);

const shouldHideParagraph = (paragraph: string): boolean => {
  const trimmed = paragraph.trim();
  if (isDivider(trimmed)) {
    return true;
  }
  const normalized = normalizeParagraph(trimmed);
  if (!normalized) {
    return false;
  }
  const lower = normalized.toLowerCase();

  if (AD_CHOICES_REGEX.test(lower)) {
    return true;
  }
  if (startsWithCredit(lower)) {
    return true;
  }
  if (isSocialHeading(lower)) {
    return true;
  }
  if (PROMO_URL_REGEX.test(paragraph)) {
    return true;
  }
  if (containsUntrustedLink(paragraph)) {
    return true;
  }
  if (hasPromoKeyword(lower)) {
    return true;
  }
  return false;
};

export function segmentDescription(markdown: string): DescriptionSegments {
  const paragraphs = markdown
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  if (paragraphs.length === 0) {
    return { intro: [], promo: [] };
  }

  let promoIndex = paragraphs.length;
  for (let index = 0; index < paragraphs.length; index += 1) {
    if (shouldHideParagraph(paragraphs[index])) {
      promoIndex = index;
      break;
    }
  }

  if (promoIndex === paragraphs.length || promoIndex === 0) {
    return { intro: paragraphs, promo: [] };
  }

  const intro = paragraphs.slice(0, promoIndex);
  const hasMeaningfulIntro = intro.join(" ").length >= 120 || intro.length >= 2;
  if (!hasMeaningfulIntro) {
    return { intro: paragraphs, promo: [] };
  }

  return {
    intro,
    promo: paragraphs.slice(promoIndex)
  };
}

export function stripAdChoices(value: string): string {
  return value.replace(AD_CHOICES_REGEX, "").trim();
}

const normalizeTrustedHref = (value: string): string => {
  const trimmed = value.trim().replace(TRAILING_PUNCTUATION_REGEX, "");
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^www\./i, "")}`;
  return withProtocol;
};

const containsUntrustedLink = (value: string): boolean => {
  if (!URL_INDICATOR_REGEX.test(value)) {
    return false;
  }
  const stripped = value.replace(TRUSTED_URL_REGEX, "");
  return URL_INDICATOR_REGEX.test(stripped);
};

const stripTrailingPunctuation = (value: string): { core: string; trailing: string } => {
  const match = value.match(TRAILING_PUNCTUATION_REGEX);
  if (!match) {
    return { core: value, trailing: "" };
  }
  const trailing = match[0];
  const core = value.slice(0, value.length - trailing.length);
  return { core, trailing };
};

export function splitTrustedUrls(paragraph: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  TRUSTED_URL_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TRUSTED_URL_REGEX.exec(paragraph)) !== null) {
    const [fullMatch] = match;
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      segments.push({ text: paragraph.slice(lastIndex, matchIndex) });
    }

    const { core, trailing } = stripTrailingPunctuation(fullMatch);
    const href = normalizeTrustedHref(core);
    segments.push({ text: core, href });
    if (trailing) {
      segments.push({ text: trailing });
    }
    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < paragraph.length) {
    segments.push({ text: paragraph.slice(lastIndex) });
  }

  if (segments.length === 0) {
    return [{ text: paragraph }];
  }

  return segments;
}

const normalizeHandleHref = (handle: string): string => {
  const normalized = handle.replace(/^@/, "");
  return `https://twitter.com/${normalized}`;
};

const splitSocialHandles = (text: string): TextSegment[] => {
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  SOCIAL_HANDLE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = SOCIAL_HANDLE_REGEX.exec(text)) !== null) {
    const [fullMatch] = match;
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      segments.push({ text: text.slice(lastIndex, matchIndex) });
    }

    const { core, trailing } = stripTrailingPunctuation(fullMatch);
    if (core.length > 1) {
      segments.push({ text: core, href: normalizeHandleHref(core) });
    } else {
      segments.push({ text: core });
    }
    if (trailing) {
      segments.push({ text: trailing });
    }
    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  if (segments.length === 0) {
    return [{ text }];
  }

  return segments;
};

export function linkifyParagraph(paragraph: string): TextSegment[] {
  const urlSegments = splitTrustedUrls(paragraph);
  const expanded: TextSegment[] = [];

  urlSegments.forEach((segment) => {
    if (segment.href) {
      expanded.push(segment);
    } else {
      expanded.push(...splitSocialHandles(segment.text));
    }
  });

  return expanded;
}
