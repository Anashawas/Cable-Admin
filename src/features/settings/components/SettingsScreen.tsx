import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  useTheme,
} from "@mui/material";
import { Grid } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  Palette as ThemeIcon,
  Language as LanguageIcon,
  ViewSidebar as SidebarIcon,
} from "@mui/icons-material";
import {
  useThemeStore,
  useLanguageStore,
  useLayoutStore,
} from "../../../stores";
import { LANGUAGE } from "../../../constants/language-constants";

const SettingsScreen = () => {
  const { t } = useTranslation(["settings", "common"]);
  const theme = useTheme();

  const currentTheme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const sidebarExpanded = useLayoutStore((state) => state.sidebarExpanded);
  const setSidebarExpanded = useLayoutStore(
    (state) => state.setSidebarExpanded
  );
  const smallScreen = useLayoutStore((state) => state.smallScreen);

  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTheme(event.target.value as "light" | "dark");
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLanguage(event.target.value);
  };

  const handleSidebarToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSidebarExpanded(event.target.checked);
  };

  return (
    <Box
      sx={{
        p: smallScreen ? 2 : 3,
        maxWidth: 1200,
        mx: "auto",
      }}
    >
      <Typography
        variant={smallScreen ? "h5" : "h4"}
        gutterBottom
        sx={{
          mb: smallScreen ? 3 : 4,
          fontWeight: "bold",
          color: theme.palette.text.primary,
        }}
      >
        {t("settings")}
      </Typography>

      <Grid container spacing={smallScreen ? 2 : 3}>
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <Card
            sx={{
              height: "100%",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: theme.shadows[4],
              },
            }}
          >
            <CardContent sx={{ p: smallScreen ? 2 : 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <ThemeIcon
                  sx={{
                    mr: 2,
                    color: theme.palette.primary.main,
                    fontSize: "2rem",
                  }}
                />
                <Typography variant="h6" fontWeight="bold">
                  {t("appearance")}
                </Typography>
              </Box>

              <FormControl component="fieldset">
                <FormLabel
                  component="legend"
                  sx={{
                    mb: 2,
                    color: theme.palette.text.secondary,
                    fontWeight: "medium",
                  }}
                >
                  {t("themeMode")}
                </FormLabel>
                <RadioGroup
                  value={currentTheme}
                  onChange={handleThemeChange}
                  sx={{ gap: 1 }}
                >
                  <FormControlLabel
                    value="light"
                    control={<Radio />}
                    label={t("lightMode")}
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        fontSize: "0.95rem",
                      },
                    }}
                  />
                  <FormControlLabel
                    value="dark"
                    control={<Radio />}
                    label={t("darkMode")}
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        fontSize: "0.95rem",
                      },
                    }}
                  />
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <Card
            sx={{
              height: "100%",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: theme.shadows[4],
              },
            }}
          >
            <CardContent sx={{ p: smallScreen ? 2 : 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <LanguageIcon
                  sx={{
                    mr: 2,
                    color: theme.palette.primary.main,
                    fontSize: "2rem",
                  }}
                />
                <Typography variant="h6" fontWeight="bold">
                  {t("language")}
                </Typography>
              </Box>

              <FormControl component="fieldset">
                <FormLabel
                  component="legend"
                  sx={{
                    mb: 2,
                    color: theme.palette.text.secondary,
                    fontWeight: "medium",
                  }}
                >
                  {t("selectLanguage")}
                </FormLabel>
                <RadioGroup
                  value={language}
                  onChange={handleLanguageChange}
                  sx={{ gap: 1 }}
                >
                  <FormControlLabel
                    value={LANGUAGE.EN}
                    control={<Radio />}
                    label={t("english")}
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        fontSize: "0.95rem",
                      },
                    }}
                  />
                  <FormControlLabel
                    value={LANGUAGE.AR}
                    control={<Radio />}
                    label={t("arabic")}
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        fontSize: "0.95rem",
                      },
                    }}
                  />
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <Card
            sx={{
              height: "100%",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: theme.shadows[4],
              },
            }}
          >
            <CardContent sx={{ p: smallScreen ? 2 : 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <SidebarIcon
                  sx={{
                    mr: 2,
                    color: theme.palette.primary.main,
                    fontSize: "2rem",
                  }}
                />
                <Typography variant="h6" fontWeight="bold">
                  {t("layout")}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {t("expandSidebar")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("showSidebarExpanded")}
                  </Typography>
                </Box>
                <Switch
                  checked={sidebarExpanded}
                  onChange={handleSidebarToggle}
                  color="primary"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsScreen;
