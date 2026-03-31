import { useTranslation } from "react-i18next";
import {
  Box,
  InputAdornment,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import type { ValidationError } from "../validators/login";
import {
  EmailOutlined as EmailIcon,
  LockOutlined as LockIcon,
  LoginRounded as LoginIcon,
} from "@mui/icons-material";

interface LoginFormProps {
  emailInput: {
    value: string;
    ref: React.RefObject<HTMLInputElement | null>;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  };
  passwordInput: {
    value: string;
    ref: React.RefObject<HTMLInputElement | null>;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  };
  onSubmit: (e: React.FormEvent) => void;
  loginValidationResults: ValidationError[];
  loginLoading: boolean;
}

const LoginForm = ({
  emailInput,
  passwordInput,
  onSubmit,
  loginValidationResults,
  loginLoading,
}: LoginFormProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: isDark
        ? alpha(theme.palette.background.default, 0.5)
        : alpha("#F8FAFC", 0.8),
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: isDark
          ? alpha(theme.palette.background.default, 0.7)
          : "#F1F5F9",
      },
      "&.Mui-focused": {
        backgroundColor: isDark
          ? alpha(theme.palette.background.default, 0.8)
          : "#fff",
        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`,
      },
      "& fieldset": {
        borderColor: isDark ? alpha("#fff", 0.1) : alpha("#94A3B8", 0.3),
        transition: "border-color 0.2s ease",
      },
      "&:hover fieldset": {
        borderColor: isDark ? alpha("#fff", 0.2) : alpha("#94A3B8", 0.5),
      },
    },
    "& .MuiInputAdornment-root .MuiSvgIcon-root": {
      color: theme.palette.text.secondary,
      fontSize: "1.2rem",
    },
  };

  return (
    <Box component="form" onSubmit={onSubmit}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, mb: 0.5, color: "text.primary" }}
        >
          {t("login")}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {t("loginInstructions")}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <TextField
          inputRef={emailInput.ref}
          fullWidth
          type="email"
          autoComplete="email"
          label={t("email")}
          placeholder={t("enterEmail")}
          InputLabelProps={{ shrink: true }}
          value={emailInput.value}
          onChange={emailInput.onChange}
          error={!!loginValidationResults?.find((r) => r.email)}
          helperText={
            loginValidationResults?.find((r) => r.email)?.email
              ? t(loginValidationResults?.find((r) => r.email)?.email || "")
              : ""
          }
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon />
                </InputAdornment>
              ),
            },
          }}
          sx={inputSx}
        />

        <TextField
          inputRef={passwordInput.ref}
          fullWidth
          type="password"
          autoComplete="current-password"
          label={t("password")}
          placeholder={t("enterPassword")}
          InputLabelProps={{ shrink: true }}
          value={passwordInput.value}
          onChange={passwordInput.onChange}
          error={!!loginValidationResults?.find((r) => r.password)}
          helperText={
            loginValidationResults?.find((r) => r.password)?.password
              ? t(
                  loginValidationResults?.find((r) => r.password)?.password ||
                    ""
                )
              : ""
          }
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              ),
            },
          }}
          sx={inputSx}
        />

        <LoadingButton
          fullWidth
          variant="contained"
          size="large"
          type="submit"
          loading={loginLoading}
          loadingPosition="end"
          endIcon={<LoginIcon />}
          sx={{
            mt: 1,
            py: 1.6,
            borderRadius: "14px",
            fontWeight: 700,
            fontSize: "1rem",
            textTransform: "none",
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #1A237E 100%)`,
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
            transition: "all 0.2s ease",
            "&:hover": {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, #0D1457 100%)`,
              boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.45)}`,
              transform: "translateY(-1px)",
            },
            "&:active": {
              transform: "translateY(0)",
            },
          }}
        >
          {t("login")}
        </LoadingButton>
      </Box>
    </Box>
  );
};

export default LoginForm;
