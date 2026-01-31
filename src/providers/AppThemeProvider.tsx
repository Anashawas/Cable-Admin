import rtlPlugin from 'stylis-plugin-rtl';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { ReactNode, useMemo } from 'react';

import { THEMES } from '../constants/theme-constants';
import { LANGUAGE } from '../constants/language-constants';

import useThemeStore from '../stores/theme-store';
import useLanguageStore from '../stores/language-store';
import { useLanguageSync } from '../hooks/use-language-sync';

const cacheRtl = createCache({ key: 'rtl', stylisPlugins: [rtlPlugin] });

interface AppThemeProviderProps {
	children: ReactNode;
}

const AppThemeProvider = ({ children }: AppThemeProviderProps) => {
	useLanguageSync(); // Sync language store with i18n
	const language = useLanguageStore(state => state.language);
	const theme = useThemeStore(state => state.theme);

	const themeConfig = THEMES[theme.toUpperCase() as keyof typeof THEMES] || THEMES.LIGHT;
	
	const appTheme = useMemo(() => createTheme({
		...themeConfig,
		palette: {
			...themeConfig.palette
		},
		typography: {
			...themeConfig.typography
		},
		components: {
			MuiButtonBase: {
				defaultProps: {
					disableRipple: false
				}
			},
			MuiInputBase: {
				styleOverrides: {
					input: {
						'&:-webkit-autofill': {
							transitionDelay: '999999s',
							transitionProperty: 'background-color, color',
						}
					}
				},
				defaultProps: {
					autoComplete: 'off'
				}
			}
		},
		direction: language === LANGUAGE.AR ? 'rtl' : 'ltr'
	}), [themeConfig, language]);
	
	return (
		<ThemeProvider theme={appTheme}>
			<CssBaseline enableColorScheme />
			<LocalizationProvider dateAdapter={AdapterDateFns}>
				{language === LANGUAGE.AR ?
					<CacheProvider value={cacheRtl}>
						{children}
					</CacheProvider>
					:
					children}
			</LocalizationProvider>
		</ThemeProvider>
	);
};

export default AppThemeProvider;