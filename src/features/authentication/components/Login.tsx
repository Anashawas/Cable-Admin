import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import LoginForm from "./LoginForm";

import {
  useAuthenticationStore,
  useLayoutStore,
  useSnackbarStore,
} from "../../../stores";

import useFormInput from "../../../hooks/use-form-input";
import validateLogin from "../validators/login";
import { authenticate } from "../services/authentication-service";
import type { ValidationError } from "../validators/login";

const Login = () => {
  const [validationResult, setValidationResult] = useState<ValidationError[]>(
    []
  );
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();

  const smallScreen = useLayoutStore((state) => state.smallScreen);
  const user = useAuthenticationStore((state) => state.user);
  const setLoggedInUser = useAuthenticationStore(
    (state) => state.setLoggedInUser
  );

  const openErrorSnackbar = useSnackbarStore(
    (state) => state.openErrorSnackbar
  );

  const emailInput = useFormInput("");
  const passwordInput = useFormInput("");

  const loginAction = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authenticate({ email, password }),
    onSuccess: (loginResponse) => {
      setLoggedInUser({ loginResponse, persist: true });
      navigate("/");
    },
    onError: (error: any) => {
      openErrorSnackbar({
        message: error?.message || "Login failed",
      });
    },
  });

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (loginAction.isPending) return;

      const { errors, isValid } = validateLogin({
        email: emailInput.value,
        password: passwordInput.value,
      });

      setValidationResult(errors);

      if (isValid) {
        loginAction.mutate({
          email: emailInput.value,
          password: passwordInput.value,
        });
      }
    },
    [loginAction, emailInput.value, passwordInput.value]
  );

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [navigate, user]);

  if (user) {
    return (
      <Box
        height="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: isDark
          ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #0D1B2A 50%, #1B2838 100%)`
          : `linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 30%, #E8EAF6 70%, #F3E5F5 100%)`,
      }}
    >
      {/* Decorative background circles */}
      <Box
        sx={{
          position: "fixed",
          top: "-15%",
          right: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: isDark
            ? alpha(theme.palette.primary.main, 0.06)
            : alpha(theme.palette.primary.main, 0.08),
          filter: "blur(2px)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "fixed",
          bottom: "-20%",
          left: "-5%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: isDark
            ? alpha(theme.palette.secondary.main, 0.05)
            : alpha("#9C27B0", 0.05),
          filter: "blur(2px)",
          pointerEvents: "none",
        }}
      />

      {/* Branding panel — hidden on small screens */}
      {!smallScreen && (
        <Box
          sx={{
            width: "45%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            p: 6,
            background: isDark
              ? `linear-gradient(160deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${alpha("#1A237E", 0.85)} 100%)`
              : `linear-gradient(160deg, ${theme.palette.primary.main} 0%, #1A237E 60%, #4A148C 100%)`,
            borderRadius: "0 48px 48px 0",
            boxShadow: isDark
              ? `20px 0 60px ${alpha(theme.palette.primary.main, 0.15)}`
              : `20px 0 60px ${alpha(theme.palette.primary.main, 0.2)}`,
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.05) 0%, transparent 40%)",
              pointerEvents: "none",
            },
          }}
        >
          {/* Floating decorative elements */}
          <Box
            sx={{
              position: "absolute",
              top: "10%",
              left: "10%",
              width: 80,
              height: 80,
              borderRadius: "20px",
              border: "2px solid rgba(255,255,255,0.1)",
              transform: "rotate(45deg)",
              animation: "float 6s ease-in-out infinite",
              "@keyframes float": {
                "0%, 100%": { transform: "rotate(45deg) translateY(0px)" },
                "50%": { transform: "rotate(45deg) translateY(-20px)" },
              },
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: "15%",
              right: "15%",
              width: 60,
              height: 60,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.08)",
              animation: "float2 8s ease-in-out infinite",
              "@keyframes float2": {
                "0%, 100%": { transform: "translateY(0px)" },
                "50%": { transform: "translateY(-15px)" },
              },
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: "60%",
              left: "5%",
              width: 40,
              height: 40,
              borderRadius: "12px",
              background: "rgba(255,255,255,0.05)",
              animation: "float3 7s ease-in-out infinite",
              "@keyframes float3": {
                "0%, 100%": { transform: "rotate(20deg) translateY(0px)" },
                "50%": { transform: "rotate(20deg) translateY(-12px)" },
              },
            }}
          />

          <Box sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: "#fff",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 4,
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              }}
            >
              <img
                src={`${window.env.host.virtualPath}/images/Cable-Logo.png`}
                alt="Cable Logo"
                style={{ height: "64px" }}
              />
            </Box>
            <Typography
              variant="h3"
              sx={{
                color: "#fff",
                fontWeight: 800,
                mb: 1,
                letterSpacing: "-0.5px",
              }}
            >
              {t("kmCamping")}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.5)",
                mb: 3,
                fontSize: "0.85rem",
              }}
            >
              {import.meta.env.VITE_APP_VERSION}
            </Typography>
            <Box
              sx={{
                display: "inline-block",
                px: 3,
                py: 1,
                borderRadius: "100px",
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography
                variant="body1"
                sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 500 }}
              >
                {t("employeesAccess")}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Form panel */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: smallScreen ? "flex-start" : "center",
          p: smallScreen ? 3 : 6,
          pt: smallScreen ? 6 : 6,
          overflow: "auto",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 440 }}>
          {/* Logo on small screens */}
          {smallScreen && (
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "20px",
                  background: isDark
                    ? alpha(theme.palette.primary.main, 0.15)
                    : `linear-gradient(135deg, ${theme.palette.primary.main}, #1A237E)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2,
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
              >
                <img
                  src={`${window.env.host.virtualPath}/images/Cable-Logo.png`}
                  alt="Cable Logo"
                  style={{ height: "44px" }}
                />
              </Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "text.primary" }}
              >
                {t("kmCamping")}
              </Typography>
            </Box>
          )}

          {/* Glass card */}
          <Box
            sx={{
              p: { xs: 3, sm: 4.5 },
              borderRadius: "24px",
              background: isDark
                ? alpha(theme.palette.background.paper, 0.6)
                : alpha("#FFFFFF", 0.75),
              backdropFilter: "blur(20px)",
              border: `1px solid ${isDark ? alpha("#fff", 0.08) : alpha("#fff", 0.6)}`,
              boxShadow: isDark
                ? `0 20px 60px ${alpha("#000", 0.3)}, 0 0 0 1px ${alpha("#fff", 0.05)} inset`
                : `0 20px 60px ${alpha(theme.palette.primary.main, 0.08)}, 0 0 0 1px rgba(255,255,255,0.8) inset`,
            }}
          >
            <LoginForm
              emailInput={emailInput}
              passwordInput={passwordInput}
              onSubmit={onSubmit}
              loginValidationResults={validationResult}
              loginLoading={loginAction.isPending}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
