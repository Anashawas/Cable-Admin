import { useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { alpha } from "@mui/material/styles";
import { Box, Button, Skeleton, Stack, Typography, useTheme } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import type { SvgIconComponent } from "@mui/icons-material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { TrendSeries } from "../utils/registration-trend";

/** Western digits, isolated for RTL (same as the hero). */
export const Num = ({ v }: { v: number }) => <bdi>{v.toLocaleString("en-US")}</bdi>;

const cardSx = {
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 3,
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
} as const;

const flipInRtl = { transform: (th: { direction: string }) => (th.direction === "rtl" ? "scaleX(-1)" : "none") };

const onEnterOrSpace = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
};

/** Small, consistent section heading (icon + text). */
export function SectionTitle({ icon, children, id }: { icon: ReactNode; children: ReactNode; id?: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, color: "text.secondary", "& svg": { fontSize: 18 } }}>
      {icon}
      <Typography id={id} component="h2" variant="subtitle2" fontWeight={800} color="text.primary" sx={{ fontSize: 13 }}>
        {children}
      </Typography>
    </Stack>
  );
}

function IconTile({ Icon, color, size = 36 }: { Icon: SvgIconComponent; color: string; size?: number }) {
  return (
    <Box aria-hidden sx={{ width: size, height: size, borderRadius: 2, bgcolor: alpha(color, 0.12), color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon sx={{ fontSize: size * 0.55 }} />
    </Box>
  );
}

// ───────────────────────────── 1) Action list ─────────────────────────────

export interface ActionItem { key: string; label: string; help: string; value: number; Icon: SvgIconComponent; accent: string; path: string }

export function ActionList({ items, loading, onOpen, labelledBy }: { items: ActionItem[]; loading: boolean; onOpen: (path: string) => void; labelledBy: string }) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ ...cardSx, p: 1 }}>
        {[0, 1].map((i) => (
          <Stack key={i} direction="row" spacing={1.5} alignItems="center" sx={{ p: 1 }}>
            <Skeleton variant="rounded" width={36} height={36} />
            <Box sx={{ flex: 1 }}><Skeleton variant="text" width="40%" /><Skeleton variant="text" width="60%" /></Box>
            <Skeleton variant="rounded" width={72} height={30} />
          </Stack>
        ))}
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Stack direction="row" spacing={1.5} alignItems="center" role="status" sx={{ ...cardSx, px: 2, py: 1.5 }}>
        <IconTile Icon={CheckCircleOutlineIcon} color={theme.palette.success.main} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700}>{t("dashboard@nothingToAction")}</Typography>
          <Typography variant="caption" color="text.secondary">{t("dashboard@nothingToActionSub")}</Typography>
        </Box>
      </Stack>
    );
  }

  const twoCols = items.length > 1;
  return (
    <Box
      component="ul"
      aria-labelledby={labelledBy}
      sx={{
        ...cardSx, m: 0, px: 1, py: 0.5, listStyle: "none",
        display: "grid", columnGap: 2,
        gridTemplateColumns: { xs: "1fr", md: twoCols ? "1fr 1fr" : "1fr" },
        // Hairlines between rows; on two columns the first row has none.
        "& > li + li": { borderTop: "1px solid", borderColor: "divider" },
        ...(twoCols && { "& > li:nth-of-type(2)": { borderTop: { md: "none" } } }),
      }}
    >
      {items.map((a) => (
        <Stack component="li" key={a.key} direction="row" spacing={1.5} alignItems="center" sx={{ px: 1, py: 1.25, minWidth: 0 }}>
          <IconTile Icon={a.Icon} color={a.accent} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="baseline" sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: a.accent, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}><Num v={a.value} /></Typography>
              <Typography variant="body2" fontWeight={700} noWrap sx={{ minWidth: 0 }}>{a.label}</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" noWrap component="p" sx={{ m: 0 }} title={a.help}>{a.help}</Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={() => onOpen(a.path)}
            aria-label={`${t("dashboard@review")}: ${a.value.toLocaleString("en-US")} ${a.label}`}
            endIcon={<ChevronRightIcon sx={flipInRtl} />}
            sx={{ flexShrink: 0, borderRadius: 2, borderColor: "divider", color: "text.primary", fontWeight: 700, textTransform: "none", "& .MuiButton-endIcon": { ml: 0.25, mr: 0 }, "&:hover": { borderColor: alpha(a.accent, 0.5), bgcolor: alpha(a.accent, 0.06) } }}
          >
            {t("dashboard@review")}
          </Button>
        </Stack>
      ))}
    </Box>
  );
}

// ───────────────────────────── 2) Overview strip ─────────────────────────────

export interface StatItem { key: string; label: string; value: number | null; sub?: ReactNode; Icon: SvgIconComponent; accent: string; path: string; loading?: boolean }

export function StatsStrip({ items, onOpen, labelledBy }: { items: StatItem[]; onOpen: (path: string) => void; labelledBy: string }) {
  const { t } = useTranslation();
  return (
    <Box
      role="list"
      aria-labelledby={labelledBy}
      sx={{ ...cardSx, p: 1, display: "grid", gap: 0.5, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", md: `repeat(${items.length}, minmax(0, 1fr))` } }}
    >
      {items.map((s) => {
        const open = () => onOpen(s.path);
        const valueText = s.value === null ? t("dashboard@hero.unavailable") : s.value.toLocaleString("en-US");
        return (
          <Box role="listitem" key={s.key} sx={{ minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1.25}
              alignItems="center"
              role="link"
              tabIndex={0}
              aria-label={`${s.label}: ${valueText}`}
              onClick={open}
              onKeyDown={onEnterOrSpace(open)}
              sx={{
                p: 1.25, borderRadius: 2, cursor: "pointer", height: "100%", boxSizing: "border-box",
                transition: "background-color .15s",
                "&:hover": { bgcolor: alpha(s.accent, 0.06) },
                "&:focus-visible": { outline: `2px solid ${s.accent}`, outlineOffset: -2 },
              }}
            >
              <IconTile Icon={s.Icon} color={s.accent} />
              <Box sx={{ minWidth: 0 }}>
                {s.loading ? (
                  <Skeleton variant="text" width={56} height={28} />
                ) : (
                  <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, color: s.value === null ? "text.disabled" : "text.primary" }}>
                    {s.value === null ? "—" : <Num v={s.value} />}
                  </Typography>
                )}
                <Typography variant="caption" fontWeight={600} color="text.secondary" noWrap component="p" sx={{ m: 0 }} title={s.label}>{s.label}</Typography>
                {s.sub && !s.loading && (
                  <Typography variant="caption" color="text.secondary" noWrap component="p" sx={{ m: 0, fontSize: 11, opacity: 0.85 }}>{s.sub}</Typography>
                )}
              </Box>
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
}

// ───────────────────────────── 3) Analytics ─────────────────────────────

export function AnalyticsCard({ title, Icon, action, children }: { title: string; Icon: SvgIconComponent; action?: ReactNode; children: ReactNode }) {
  const theme = useTheme();
  return (
    <Box component="section" aria-label={title} sx={{ ...cardSx, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider", minHeight: 52, boxSizing: "border-box" }}>
        <IconTile Icon={Icon} color={theme.palette.primary.main} size={28} />
        <Typography component="h3" variant="subtitle2" fontWeight={800} noWrap sx={{ flex: 1, minWidth: 0 }} title={title}>{title}</Typography>
        {action}
      </Stack>
      <Box sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>{children}</Box>
    </Box>
  );
}

const ROWS_COLLAPSED = 5;

export interface RankedRow { key: string; label: string; value: number; path?: string }

/** Ranked list: rank · name · number (end-aligned) with a thin proportional bar. */
export function RankedList({ rows, color, loading, emptyLabel, onOpen }: { rows: RankedRow[]; color: string; loading: boolean; emptyLabel: string; onOpen?: (path: string) => void }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <Stack spacing={1.5}>
        {Array.from({ length: ROWS_COLLAPSED }, (_, i) => (
          <Box key={i}><Skeleton variant="text" width={`${80 - i * 10}%`} /><Skeleton variant="rounded" height={4} /></Box>
        ))}
      </Stack>
    );
  }
  if (rows.length === 0) return <EmptyNote text={emptyLabel} />;

  const max = Math.max(...rows.map((r) => r.value), 1);
  const visible = expanded ? rows : rows.slice(0, ROWS_COLLAPSED);

  return (
    <>
      <Box component="ol" sx={{ m: 0, p: 0, listStyle: "none" }}>
        {visible.map((r, idx) => {
          const clickable = !!(r.path && onOpen);
          const open = () => r.path && onOpen?.(r.path);
          return (
            <Box
              component="li"
              key={r.key}
              {...(clickable && { role: "link", tabIndex: 0, onClick: open, onKeyDown: onEnterOrSpace(open) })}
              aria-label={`${idx + 1}. ${r.label}: ${r.value.toLocaleString("en-US")}`}
              sx={{
                px: 1, py: 0.75, mx: -1, borderRadius: 1.5,
                ...(clickable && { cursor: "pointer", "&:hover": { bgcolor: "action.hover" }, "&:focus-visible": { outline: `2px solid ${color}`, outlineOffset: -2 } }),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ width: 18, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}><bdi>{idx + 1}</bdi></Typography>
                <Typography variant="body2" fontWeight={600} noWrap title={r.label} sx={{ flex: 1, minWidth: 0 }}>{r.label}</Typography>
                <Typography variant="body2" fontWeight={800} sx={{ flexShrink: 0, textAlign: "end", fontVariantNumeric: "tabular-nums" }}><Num v={r.value} /></Typography>
              </Stack>
              <Box sx={{ height: 4, borderRadius: 2, bgcolor: alpha(color, 0.12), overflow: "hidden", marginInlineStart: "26px" }}>
                <Box sx={{ height: "100%", width: `${(r.value / max) * 100}%`, minWidth: 4, borderRadius: 2, bgcolor: color, transition: "width .4s ease" }} />
              </Box>
            </Box>
          );
        })}
      </Box>
      {rows.length > ROWS_COLLAPSED && (
        <Box sx={{ mt: "auto", pt: 1 }}>
          <Button
            size="small"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ textTransform: "none", fontWeight: 700, px: 1 }}
          >
            {expanded ? t("dashboard@showLess") : <>{t("dashboard@viewAll")} (<Num v={rows.length} />)</>}
          </Button>
        </Box>
      )}
    </>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <Stack role="status" alignItems="center" justifyContent="center" spacing={1} sx={{ flex: 1, py: 3, textAlign: "center", color: "text.secondary" }}>
      <InfoOutlinedIcon sx={{ fontSize: 28, opacity: 0.6 }} />
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }}>{text}</Typography>
    </Stack>
  );
}

export const TREND_CHART_HEIGHT = 240;

/** Daily new-user bars for the last 30 days. */
export function RegistrationTrendChart({ series, loading, error }: { series: TrendSeries; loading: boolean; error: boolean }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isAr = i18n.language.startsWith("ar");
  const isRtl = theme.direction === "rtl";

  const fmt = useMemo(() => {
    const locale = isAr ? "ar-JO-u-nu-latn" : "en-GB";
    return {
      short: new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }),
      long: new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "long", year: "numeric" }),
    };
  }, [isAr]);

  if (loading) return <Skeleton variant="rounded" height={TREND_CHART_HEIGHT} />;
  if (error) return <EmptyNote text={t("dashboard@trend.error")} />;
  if (series.status === "single") return <EmptyNote text={t("dashboard@trend.singleBucket", { count: series.singleValue })} />;
  if (series.status === "empty") return <EmptyNote text={t("dashboard@trend.empty")} />;

  const keys = series.points.map((p) => p.key);
  const byKey = new Map(series.points.map((p) => [p.key, p.date]));
  const maxCount = Math.max(...series.points.map((p) => p.count), 1);
  const lastIdx = keys.length - 1;

  return (
    <Box
      role="img"
      aria-label={t("dashboard@trend.aria", { total: series.total.toLocaleString("en-US") })}
      sx={{ mx: -1, direction: "ltr" /* the chart handles RTL itself via axis reverse/position */ }}
    >
      <BarChart
        height={TREND_CHART_HEIGHT}
        margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
        hideLegend
        borderRadius={3}
        grid={{ horizontal: true }}
        xAxis={[{
          scaleType: "band",
          data: keys,
          reverse: isRtl,
          categoryGapRatio: 0.25,
          disableTicks: true,
          height: 28,
          tickLabelStyle: { fontSize: 11, fill: theme.palette.text.secondary },
          // Every 7th day plus today, counted back from today so the latest day is always labelled.
          tickLabelInterval: (_v: string, i: number) => (lastIdx - i) % 7 === 0,
          valueFormatter: (key: string, ctx) => {
            const d = byKey.get(key);
            if (!d) return key;
            return ctx.location === "tick" ? fmt.short.format(d) : fmt.long.format(d);
          },
        }]}
        yAxis={[{
          min: 0,
          max: maxCount < 4 ? 4 : undefined,
          tickNumber: Math.min(maxCount, 4),
          position: isRtl ? "right" : "left",
          width: 36,
          disableLine: true,
          disableTicks: true,
          tickLabelStyle: { fontSize: 11, fill: theme.palette.text.secondary },
          valueFormatter: (v: number) => (Number.isInteger(v) ? v.toLocaleString("en-US") : ""),
        }]}
        series={[{
          data: series.points.map((p) => p.count),
          label: t("dashboard@trend.newUsers"),
          color: theme.palette.primary.main,
          valueFormatter: (v) => (v == null ? "" : v.toLocaleString("en-US")),
        }]}
        sx={{ "& .MuiChartsGrid-line": { stroke: theme.palette.divider, strokeDasharray: "3 3" } }}
      />
    </Box>
  );
}
