import { useMemo } from "react";
import { Box } from "@mui/material";
import DOMPurify from "dompurify";

/**
 * Renders admin-authored policy HTML.
 *
 * This is the only `dangerouslySetInnerHTML` in the codebase, so the rules are
 * strict: an explicit tag/attribute allow-list, no scripts, no inline event
 * handlers, no iframes/forms. Anything outside the list is stripped, which also
 * matches what the partner app's HTML renderer can actually display.
 */

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr", "div", "span",
  "strong", "b", "em", "i", "u", "s",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "a",
  "table", "thead", "tbody", "tr", "th", "td",
];

const ALLOWED_ATTR = ["href", "target", "rel", "dir", "style", "colspan", "rowspan"];

export function sanitizeTermsHtml(html: string): string {
  return DOMPurify.sanitize(html ?? "", {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ["script", "style", "iframe", "form", "input", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick"],
  });
}

interface Props {
  html: string;
  /** Drives text direction and font — "ar" renders RTL. */
  lang: "ar" | "en";
  /** Constrain height and scroll internally. Defaults to 420. */
  maxHeight?: number | string;
}

export default function TermsHtmlPreview({ html, lang, maxHeight = 420 }: Props) {
  const clean = useMemo(() => sanitizeTermsHtml(html), [html]);
  const isRtl = lang === "ar";

  return (
    <Box
      dir={isRtl ? "rtl" : "ltr"}
      sx={{
        maxHeight,
        overflowY: "auto",
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        textAlign: isRtl ? "right" : "left",
        fontFamily: isRtl ? "Cairo, Tahoma, sans-serif" : undefined,
        fontSize: 14,
        lineHeight: 1.7,
        color: "text.primary",
        wordBreak: "break-word",
        "& h1": { fontSize: 20, fontWeight: 700, mt: 2, mb: 1 },
        "& h2": { fontSize: 17, fontWeight: 700, mt: 2, mb: 1 },
        "& h3": { fontSize: 15, fontWeight: 700, mt: 1.5, mb: 0.75 },
        "& p": { my: 1 },
        "& ul, & ol": { my: 1, [isRtl ? "pr" : "pl"]: 3 },
        "& li": { mb: 0.5 },
        "& a": { color: "primary.main" },
        "& table": { width: "100%", borderCollapse: "collapse", my: 1.5 },
        "& th, & td": { border: "1px solid", borderColor: "divider", p: 1 },
        "& :first-of-type": { mt: 0 },
      }}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
