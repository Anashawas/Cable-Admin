import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Drawer,
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Divider,
  Button,
  Tooltip,
  Paper,
  Skeleton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StoreIcon from "@mui/icons-material/Store";
import VerifiedIcon from "@mui/icons-material/Verified";
import type { UserSummaryDto } from "../types/api";
import { getUserById } from "../services/user-service";
import { getAllServiceProviders } from "../../service-providers/services/service-provider-service";

interface UserDetailDrawerProps {
  user: UserSummaryDto | null;
  onClose: () => void;
  onEdit: (user: UserSummaryDto) => void;
  onDelete: (user: UserSummaryDto) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function UserDetailDrawer({ user, onClose, onEdit, onDelete }: UserDetailDrawerProps) {
  const { t } = useTranslation();

  const { data: detail, isLoading } = useQuery({
    queryKey: ["users", "detail", user?.id],
    queryFn: () => getUserById(user!.id!),
    enabled: user?.id != null && user.id > 0,
    staleTime: 30 * 1000,
  });

  const { data: allProviders = [] } = useQuery({
    queryKey: ["service-providers-all"],
    queryFn: () => getAllServiceProviders(),
    staleTime: 5 * 60 * 1000,
    enabled: user != null,
  });

  const userProviders = useMemo(
    () => allProviders.filter((sp) => sp.ownerId === user?.id),
    [allProviders, user?.id]
  );

  // Use fresh detail data when available, fall back to list summary
  const name = detail?.name ?? user?.name ?? "?";
  const roleName = detail?.role?.name ?? user?.role?.name ?? "—";
  const isActive = detail?.isActive ?? user?.isActive ?? true;
  const email = detail?.email ?? user?.email ?? "—";
  const phone = detail?.phone ?? user?.phone;
  const country = detail?.country;
  const city = detail?.city;
  const createdAt = user?.createdAt;
  const userCars = user?.userCars;

  return (
    <Drawer
      anchor="right"
      open={user !== null}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100vw", sm: 360 }, display: "flex", flexDirection: "column" } }}
    >
      {user && (
        <>
          {/* Header */}
          <Box
            sx={{
              px: 2.5,
              pt: 2.5,
              pb: 2,
              background: (t) => `linear-gradient(135deg, ${t.palette.primary.dark} 0%, ${t.palette.primary.main} 100%)`,
              color: "#fff",
            }}
          >
            <Stack direction="row" justifyContent="flex-end">
              <IconButton size="small" onClick={onClose} sx={{ color: "rgba(255,255,255,0.8)" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: 700,
                  border: "2px solid rgba(255,255,255,0.4)",
                }}
              >
                {getInitials(name)}
              </Avatar>
              <Box>
                {isLoading ? (
                  <>
                    <Skeleton variant="text" width={120} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                    <Skeleton variant="text" width={80} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                  </>
                ) : (
                  <>
                    <Typography variant="h6" fontWeight={700} color="#fff" lineHeight={1.2}>
                      {name}
                    </Typography>
                    <Stack direction="row" spacing={0.5} mt={0.5}>
                      <Chip
                        label={roleName}
                        size="small"
                        sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600, fontSize: 11 }}
                      />
                      <Chip
                        label={isActive ? t("userManagement@columns.active") : t("userManagement@columns.inactive")}
                        size="small"
                        color={isActive ? "success" : "error"}
                        variant="filled"
                        sx={{ fontWeight: 600, fontSize: 11 }}
                      />
                    </Stack>
                  </>
                )}
              </Box>
            </Stack>
          </Box>

          {/* Details */}
          <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2 }}>
            <Stack spacing={2}>
              {/* ID */}
              <Stack direction="row" spacing={1.5} alignItems="center">
                <BadgeIcon fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">{t("userManagement@columns.id")}</Typography>
                  <Typography variant="body2" fontWeight={600}>{user.id ?? "—"}</Typography>
                </Box>
              </Stack>

              {/* Email */}
              <Stack direction="row" spacing={1.5} alignItems="center">
                <EmailIcon fontSize="small" color="action" />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary">{t("userManagement@columns.email")}</Typography>
                  {isLoading ? <Skeleton width={160} /> : <Typography variant="body2" fontWeight={600} noWrap>{email}</Typography>}
                </Box>
              </Stack>

              {/* Phone */}
              {(isLoading || phone) && (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <PhoneIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t("userManagement@columns.phone")}</Typography>
                    {isLoading ? <Skeleton width={120} /> : <Typography variant="body2" fontWeight={600}>{phone}</Typography>}
                  </Box>
                </Stack>
              )}

              {/* Country / City */}
              {(isLoading || country || city) && (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <LocationOnIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t("userManagement@form.country")}</Typography>
                    {isLoading ? (
                      <Skeleton width={100} />
                    ) : (
                      <Typography variant="body2" fontWeight={600}>
                        {[city, country].filter(Boolean).join(", ") || "—"}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              )}

              {/* Registered */}
              {createdAt && (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <BadgeIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t("userManagement@insights_registrationDate")}</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {new Date(createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Stack>
              )}

              {/* Service Providers owned by this user */}
              {userProviders.length > 0 && (
                <>
                  <Divider />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <StoreIcon sx={{ fontSize: 18, color: "primary.main" }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      {t("userManagement@providers.title")} ({userProviders.length})
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    {userProviders.map((sp) => (
                      <Paper
                        key={sp.id}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "primary.50",
                          border: 1,
                          borderColor: "primary.100",
                          transition: "all 0.2s",
                          "&:hover": { borderColor: "primary.300", bgcolor: "primary.100" },
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            src={sp.icon || undefined}
                            sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: 14 }}
                          >
                            <StoreIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Typography variant="body2" fontWeight={700} noWrap>{sp.name}</Typography>
                              {sp.isVerified && <VerifiedIcon sx={{ fontSize: 14, color: "success.main" }} />}
                            </Stack>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {sp.serviceCategoryName} {sp.cityName ? `· ${sp.cityName}` : ""}
                            </Typography>
                          </Box>
                          <Chip
                            label={`#${sp.id}`}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ fontSize: 10, fontWeight: 700 }}
                          />
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </>
              )}

              {/* Cars */}
              {(userCars?.length ?? 0) > 0 && (
                <>
                  <Divider />
                  <Typography variant="subtitle2" fontWeight={700}>
                    {t("userManagement@cars.title")}
                  </Typography>
                  <Stack spacing={1}>
                    {userCars!.map((car, i) => (
                      <Paper key={i} elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: "grey.50", border: 1, borderColor: "grey.200" }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <DirectionsCarIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                          <Typography variant="body2" fontWeight={700}>{car.carTypeName ?? "—"}</Typography>
                          <Typography variant="body2" color="text.secondary">· {car.carModelName ?? "—"}</Typography>
                        </Stack>
                        {car.plugTypeName && (
                          <Chip
                            icon={<ElectricBoltIcon sx={{ fontSize: "13px !important" }} />}
                            label={car.plugTypeName}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ fontSize: 11 }}
                          />
                        )}
                      </Paper>
                    ))}
                  </Stack>
                </>
              )}
            </Stack>
          </Box>

          {/* Actions */}
          <Box sx={{ px: 2.5, py: 2, borderTop: 1, borderColor: "divider" }}>
            <Stack direction="row" spacing={1.5}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => { onEdit(user); onClose(); }}
              >
                {t("userManagement@actions.edit")}
              </Button>
              <Tooltip title={t("userManagement@actions.delete")}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => { onDelete(user); onClose(); }}
                  sx={{ minWidth: 0, px: 2 }}
                >
                  {t("userManagement@actions.delete")}
                </Button>
              </Tooltip>
            </Stack>
          </Box>
        </>
      )}
    </Drawer>
  );
}
