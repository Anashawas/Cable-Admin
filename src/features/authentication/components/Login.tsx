import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Box,
  CircularProgress,
  Typography,
  useMediaQuery,
  useTheme,
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

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: smallScreen ? "column" : "row",
        height: "100vh",
        overflowX: "hidden",
      }}
    >
      <Box
        sx={{
          width: smallScreen ? "100%" : "35.33%",
          height: smallScreen ? "auto" : "100%",
          minHeight: smallScreen ? "300px" : "auto",
          bgcolor: "primary.main",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            color: "primary.contrastText",
            textAlign: "center",
            p: 4,
          }}
        >
          <img
            src={`${window.env.host.virtualPath}/images/Cable-Logo.png`}
            alt="Cable Logo"
            style={{ height: "80px", marginBottom: "16px" }}
          />
          <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold" }}>
            {t("kmCamping")}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
            {import.meta.env.VITE_APP_VERSION}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            {t("employeesAccess")}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          width: smallScreen ? "100%" : "66.67%",
          flex: smallScreen ? 1 : "none",
          display: "flex",
          justifyContent: "center",
          alignItems: smallScreen ? "flex-start" : "center",
          padding: 3,
          overflow: "auto",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 500 }}>
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
  );
};

export default Login;
