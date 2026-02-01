import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  Typography,
  Box,
  Stack,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EvStation from "@mui/icons-material/EvStation";
import People from "@mui/icons-material/People";
import ReportProblem from "@mui/icons-material/ReportProblem";
import { getAllChargingPoints } from "../features/charge-management/services/charge-management-service";
import { getUsersList } from "../features/users/services/user-service";
import { getAllComplaints } from "../features/complaints/services/complaints-service";
import type { ChargingPointDto } from "../features/charge-management/types/api";
import type { UserSummaryDto } from "../features/users/types/api";
import type { UserComplaintDto } from "../features/complaints/types/api";
import useGlobalSearchStore from "../stores/global-search-store";

const MAX_RESULTS_PER_DOMAIN = 5;

type ResultKind = "station" | "user" | "complaint";

interface SearchResult {
  kind: ResultKind;
  id: number | string;
  label: string;
  sublabel?: string;
  path: string;
}

function normalize(s: string): string {
  return (s ?? "").trim().toLowerCase();
}

function matchQuery(query: string, ...parts: (string | number | null | undefined)[]): boolean {
  const q = normalize(query);
  if (!q) return true;
  const text = parts.map((p) => String(p ?? "")).join(" ");
  return normalize(text).includes(q);
}

export default function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const open = useGlobalSearchStore((s) => s.open);
  const setOpen = useGlobalSearchStore((s) => s.setOpen);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const { data: stations = [], isLoading: loadingStations } = useQuery({
    queryKey: ["global-search", "stations"],
    queryFn: ({ signal }) => getAllChargingPoints({ name: null, chargerPointTypeId: null, cityName: null }, signal),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users", "list"],
    queryFn: ({ signal }) => getUsersList(signal),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const { data: complaints = [], isLoading: loadingComplaints } = useQuery({
    queryKey: ["complaints"],
    queryFn: ({ signal }) => getAllComplaints(signal),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const results = useMemo((): SearchResult[] => {
    const q = query.trim().toLowerCase();
    const out: SearchResult[] = [];

    if (q) {
      const stationMatches = stations.filter(
        (s: ChargingPointDto) =>
          matchQuery(q, s.name, s.id, s.cityName, s.address)
      );
      stationMatches.slice(0, MAX_RESULTS_PER_DOMAIN).forEach((s) => {
        out.push({
          kind: "station",
          id: s.id,
          label: s.name || t("chargeManagement@unnamed", "Unnamed"),
          sublabel: s.cityName ?? undefined,
          path: `/charge-management/edit/${s.id}`,
        });
      });

      const userMatches = users.filter(
        (u: UserSummaryDto) =>
          matchQuery(q, u.name, u.email, u.id, u.phone)
      );
      userMatches
        .filter((u: UserSummaryDto) => u.id != null)
        .slice(0, MAX_RESULTS_PER_DOMAIN)
        .forEach((u) => {
          out.push({
            kind: "user",
            id: u.id!,
            label: u.name ?? u.email ?? "—",
            sublabel: u.email ?? undefined,
            path: `/users/${u.id}/edit`,
          });
        });

      const complaintMatches = complaints.filter((c: UserComplaintDto) => {
        const user = c.userAccount?.name;
        const station = c.chargingPoint?.name;
        return matchQuery(q, c.id, c.note, user, station);
      });
      complaintMatches.slice(0, MAX_RESULTS_PER_DOMAIN).forEach((c) => {
        const label =
          c.note?.slice(0, 40) ||
          `#${c.id} ${c.userAccount?.name ?? ""} ${c.chargingPoint?.name ?? ""}`.trim() ||
          `Complaint #${c.id}`;
        out.push({
          kind: "complaint",
          id: c.id,
          label: label.length > 40 ? label + "…" : label,
          sublabel: c.chargingPoint?.name ?? undefined,
          path: "/complaints",
        });
      });
    }

    return out;
  }, [query, stations, users, complaints, t]);

  const loading = loadingStations || loadingUsers || loadingComplaints;

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHighlightIndex(0);
  }, [setOpen]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      navigate(result.path);
      handleClose();
    },
    [navigate, handleClose]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        useGlobalSearchStore.getState().toggle();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => (i < results.length - 1 ? i + 1 : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => (i > 0 ? i - 1 : results.length - 1));
        return;
      }
      if (e.key === "Enter" && results[highlightIndex]) {
        e.preventDefault();
        handleSelect(results[highlightIndex]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, results, highlightIndex, handleSelect, handleClose]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const item = el.querySelector(`[data-index="${highlightIndex}"]`);
    item?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightIndex]);

  const getKindIcon = (kind: ResultKind) => {
    switch (kind) {
      case "station":
        return <EvStation fontSize="small" color="action" />;
      case "user":
        return <People fontSize="small" color="action" />;
      case "complaint":
        return <ReportProblem fontSize="small" color="action" />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: "80vh",
          mt: 6,
        },
      }}
      slotProps={{ backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.5)" } } }}
    >
      <DialogContent sx={{ p: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <TextField
          fullWidth
          autoFocus
          placeholder={t("search@globalPlaceholder", "Search stations, users, complaints…")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            sx: { "& fieldset": { border: "none" }, fontSize: "1rem" },
          }}
          sx={{ px: 2, pt: 2, pb: 1 }}
        />
        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1, pb: 2 }}>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
              <CircularProgress size={32} />
            </Stack>
          ) : query.trim() === "" ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, px: 2 }}>
              {t("search@typeToSearch", "Type to search across Stations, Users, and Complaints.")}
            </Typography>
          ) : results.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, px: 2 }}>
              {t("search@noResults", "No results found.")}
            </Typography>
          ) : (
            <List ref={listRef} dense disablePadding>
              {results.map((r, i) => (
                <ListItemButton
                  key={`${r.kind}-${r.id}`}
                  data-index={i}
                  selected={i === highlightIndex}
                  onClick={() => handleSelect(r)}
                  onMouseEnter={() => setHighlightIndex(i)}
                  sx={{ borderRadius: 1, py: 1 }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: "100%", minWidth: 0 }}>
                    <Box sx={{ color: "text.secondary" }}>{getKindIcon(r.kind)}</Box>
                    <Stack sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" noWrap>
                        {r.label}
                      </Typography>
                      {r.sublabel && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {r.sublabel}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
