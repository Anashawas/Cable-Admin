import { useId } from "react";
import { useTheme } from "@mui/material/styles";
import type { OcppChargePointListItemDto, OcppConnectorDto } from "../types/api";

/**
 * The Cable charger "cabinet" icon — same drawing and rules as the Cable / Cable Partner
 * apps (cable_partner/lib/feature/connect/ui/widgets/charger_icon.dart) and the reference
 * SVGs in design/charger-icons: one holster per plug (max 2), green = free, orange =
 * charging with the connector out, red = fault, grey with a slash = out of service,
 * all grey = charger offline. Plug 1 is drawn on the reading-start side.
 */
export type IconPlug = "free" | "busy" | "fault" | "off";

export const ICON_PLUG_COLORS: Record<IconPlug, string> = {
  free: "#149A57",
  busy: "#E8781F",
  fault: "#C93434",
  off: "#B7C0CE",
};

const GREY = "#B7C0CE";
const INK = "#14213A";
const GRAD: Partial<Record<IconPlug, [string, string]>> = {
  free: ["#22C77A", "#0B9488"],
  busy: ["#FFB547", "#E8631A"],
  fault: ["#F26B6B", "#C93434"],
};

const BUSY_STATUSES = new Set(["Preparing", "Charging", "SuspendedEV", "SuspendedEVSE", "Finishing"]);

/** Same mapping drivers see in the Cable app, adapted to the admin connector DTO. */
export function iconPlugOf(c: Pick<OcppConnectorDto, "status" | "errorCode" | "isFree" | "isOccupied">): IconPlug {
  if (c.status === "Unavailable") return "off";
  if (c.status === "Faulted") return "fault";
  if (c.status === "Available" || c.isFree) return "free";
  if (BUSY_STATUSES.has(c.status) || c.isOccupied) return "busy";
  return "off";
}

export function iconPlugColor(s: IconPlug, online = true): string {
  return online ? ICON_PLUG_COLORS[s] : GREY;
}

const FAMILY_BY_ID: Record<number, "chinese" | "korean" | "euro" | "japanese" | "tesla"> = {
  14: "chinese", 15: "chinese",
  16: "korean", 20: "korean",
  17: "euro", 21: "euro", 23: "euro",
  18: "japanese", 22: "japanese",
  19: "tesla",
};
const FAMILY_LABEL = {
  chinese: ["صيني", "Chinese"],
  euro: ["أوروبي", "Euro"],
  korean: ["كوري", "Korean"],
  tesla: ["تسلا", "Tesla"],
  japanese: ["ياباني", "Japanese"],
} as const;

/** Short family name for small labels: صيني · أوروبي · كوري · تسلا · ياباني. */
export function plugFamily(p: { plugTypeId?: number | null; plugTypeName?: string | null; plugTypeFamily?: string | null }, ar: boolean): string {
  let fam = p.plugTypeId != null ? FAMILY_BY_ID[p.plugTypeId] : undefined;
  if (!fam) {
    const n = `${p.plugTypeFamily ?? ""} ${p.plugTypeName ?? ""}`.toLowerCase();
    if (n.includes("chin") || n.includes("gb/t") || n.includes("gbt")) fam = "chinese";
    else if (n.includes("euro") || n.includes("type 2") || n.includes("ccs2")) fam = "euro";
    else if (n.includes("korea")) fam = "korean";
    else if (n.includes("tesla")) fam = "tesla";
    else if (n.includes("japan") || n.includes("chademo")) fam = "japanese";
  }
  if (fam) return FAMILY_LABEL[fam][ar ? 0 : 1];
  return p.plugTypeName ?? "";
}

/** Real connectors (connector 0 is the whole charger in OCPP 1.6). */
export function plugConnectors(connectors: OcppConnectorDto[]): OcppConnectorDto[] {
  return connectors.filter((c) => c.connectorId > 0).sort((a, b) => a.connectorId - b.connectorId);
}

/**
 * The list endpoint only carries counts, not per-connector states, so the list icon is
 * built from them (worst first): faulted, then charging, then free, the rest out of service.
 */
export function iconPlugsFromCounts(row: Pick<OcppChargePointListItemDto, "connectorCount" | "freeConnectors" | "faultedConnectors" | "openSessions">): IconPlug[] {
  const n = Math.min(Math.max(row.connectorCount, 0), 2);
  const out: IconPlug[] = [];
  const push = (s: IconPlug, k: number) => { for (let i = 0; i < k && out.length < n; i++) out.push(s); };
  push("fault", row.faultedConnectors);
  push("busy", row.openSessions);
  push("free", row.freeConnectors);
  push("off", n);
  return out;
}

interface ChargerIconProps {
  /** Plug 1 first; only the first two are drawn. */
  plugs: IconPlug[];
  offline?: boolean;
  /** Width in px; height follows the 64×84 viewBox. */
  size?: number;
  title?: string;
}

export default function ChargerIcon({ plugs, offline = false, size = 40, title }: ChargerIconProps) {
  const theme = useTheme();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const rtl = theme.direction === "rtl";
  const dark = theme.palette.mode === "dark";

  const first = plugs[0] ?? null;
  const second = plugs[1] ?? null;
  const left = rtl ? (second ?? first) : first;
  const right = rtl ? (second == null ? null : first) : second;

  const ink = offline ? GREY : INK;
  // On a dark surface the outline + base would vanish; lift them (the screen keeps the ink).
  const outline = offline ? GREY : dark ? "#8FA0BA" : INK;
  const gid = (s: IconPlug | "body") => `cb${uid}${s}`;
  const used = Array.from(new Set([left, right].filter((s): s is IconPlug => s != null && s in GRAD)));

  const side = (st: IconPlug | null, mirror: boolean) => {
    if (st == null) return null;
    const m = (x: number) => (mirror ? 64 - x : x);
    const paint = offline || st === "off" ? GREY : `url(#${gid(st)})`;
    const hx = Math.min(m(8), m(17));
    if (st === "busy" && !offline) {
      return (
        <g>
          <rect x={hx} y={30} width={9} height={15} rx={3} fill="none" stroke="#D5DBE4" strokeWidth={1.6} strokeDasharray="3 2" />
          <path d={`M${m(18)} 58 C ${m(8)} 58 ${m(4)} 64 ${m(1)} 72`} fill="none" stroke={paint} strokeWidth={3} strokeLinecap="round" />
          <circle cx={m(1.5)} cy={74} r={3.2} fill={paint} />
        </g>
      );
    }
    const tx = Math.min(m(10), m(15));
    return (
      <g>
        <path d={`M${m(18)} 58 C ${m(6)} 58 ${m(6)} 50 ${m(12.5)} 45`} fill="none" stroke={paint} strokeWidth={3} strokeLinecap="round" />
        <rect x={hx} y={30} width={9} height={15} rx={3} fill={paint} />
        <rect x={tx} y={26} width={5} height={5} rx={1.5} fill={paint} />
        {st === "off" && !offline && <line x1={m(4)} y1={26} x2={m(21)} y2={49} stroke="#5B6576" strokeWidth={2.4} strokeLinecap="round" />}
      </g>
    );
  };

  const states = [left, right].filter((s): s is IconPlug => s != null);
  const bar = offline
    ? GREY
    : states.includes("fault") ? `url(#${gid("fault")})`
    : states.includes("busy") ? `url(#${gid("busy")})`
    : states.includes("free") ? `url(#${gid("free")})`
    : GREY;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 84"
      width={size}
      height={(size * 84) / 64}
      role="img"
      aria-label={title}
      style={{ display: "block", flexShrink: 0 }}
    >
      {title && <title>{title}</title>}
      <defs>
        {!offline && used.map((k) => (
          <linearGradient key={k} id={gid(k)} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={GRAD[k]![0]} />
            <stop offset="1" stopColor={GRAD[k]![1]} />
          </linearGradient>
        ))}
        <linearGradient id={gid("body")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E6EDF8" />
        </linearGradient>
      </defs>
      {side(left, false)}
      {side(right, true)}
      <rect x={18} y={6} width={28} height={64} rx={7} fill={offline ? "#F1F3F7" : `url(#${gid("body")})`} stroke={outline} strokeWidth={2.6} />
      <rect x={22} y={11} width={20} height={14} rx={3} fill={ink} />
      <rect x={25} y={20} width={14} height={2.4} rx={1.2} fill={bar} />
      <rect x={14} y={70} width={36} height={6} rx={3} fill={outline} />
    </svg>
  );
}
