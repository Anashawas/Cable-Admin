import { useMemo } from "react";
import type { UserSummaryDto } from "../types/api";

// ── Date range stats ─────────────────────────────────────────────────────────
// Computes registration counts entirely from the already-loaded user list.
// Zero extra API calls.

export interface DateRangeStats {
  /** Users whose createdAt falls within the selected range. */
  inRange: number;
  /** Whether any user in the list actually has a createdAt value. */
  hasDateData: boolean;
}

// ── Car type stats ────────────────────────────────────────────────────────────
// Pure client-side aggregation from the already-loaded user list.
// Zero extra API calls — possible because GetAllUsers now returns userCars.

export interface CarSubStat { name: string; count: number; }

export interface CarTypeStat {
  name: string;
  count: number;
  models: CarSubStat[];
  plugs: CarSubStat[];
}

export function useCarTypeStats(users: UserSummaryDto[]): CarTypeStat[] {
  return useMemo(() => {
    const brandMap = new Map<string, { count: number; models: Map<string, number>; plugs: Map<string, number> }>();

    for (const user of users) {
      for (const car of user.userCars ?? []) {
        const brand = car.carTypeName?.trim();
        if (!brand) continue;

        if (!brandMap.has(brand)) {
          brandMap.set(brand, { count: 0, models: new Map(), plugs: new Map() });
        }
        const data = brandMap.get(brand)!;
        data.count += 1;

        const model = car.carModelName?.trim();
        if (model) data.models.set(model, (data.models.get(model) ?? 0) + 1);

        const plug = car.plugTypeName?.trim();
        if (plug) data.plugs.set(plug, (data.plugs.get(plug) ?? 0) + 1);
      }
    }

    return Array.from(brandMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) => ({
        name,
        count: data.count,
        models: Array.from(data.models.entries()).sort((a, b) => b[1] - a[1]).map(([n, c]) => ({ name: n, count: c })),
        plugs: Array.from(data.plugs.entries()).sort((a, b) => b[1] - a[1]).map(([n, c]) => ({ name: n, count: c })),
      }));
  }, [users]);
}

// ── Monthly registration trend ───────────────────────────────────────────────
// Groups users by year+month based on createdAt. Zero extra API calls.

export interface MonthStat {
  key: string;   // "2025-06" — used for sorting
  label: string; // "Jun '25"
  count: number;
}

export function useMonthlyStats(users: UserSummaryDto[]): MonthStat[] {
  return useMemo(() => {
    const map = new Map<string, number>();
    for (const user of users) {
      if (!user.createdAt) continue;
      const d = new Date(user.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, count]) => {
        const [y, m] = key.split("-");
        const d = new Date(parseInt(y), parseInt(m) - 1, 1);
        const label = d.toLocaleDateString("en", { month: "short", year: "2-digit" });
        return { key, label, count };
      });
  }, [users]);
}

// ── Date range stats ─────────────────────────────────────────────────────────
// Computes registration counts entirely from the already-loaded user list.
// Zero extra API calls.

export function useDateStats(
  users: UserSummaryDto[],
  dateFrom: Date | null,
  dateTo: Date | null
): DateRangeStats {
  return useMemo(() => {
    const hasDateData = users.some((u) => u.createdAt != null);

    if (!dateFrom && !dateTo) {
      return { inRange: users.length, hasDateData };
    }

    const from = dateFrom ? dateFrom.getTime() : 0;
    const to = dateTo
      ? new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59, 999).getTime()
      : Infinity;

    const inRange = users.filter((u) => {
      if (!u.createdAt) return false;
      const ms = new Date(u.createdAt).getTime();
      return ms >= from && ms <= to;
    }).length;

    return { inRange, hasDateData };
  }, [users, dateFrom, dateTo]);
}

