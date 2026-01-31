import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useLanguageStore from '../stores/language-store';

export const useLanguageSync = () => {
  const { i18n } = useTranslation();
  const { language } = useLanguageStore();

  useEffect(() => {
    // Sync store with i18n when i18n language changes (external changes only)
    const handleLanguageChanged = (lng: string) => {
      const currentStoreLanguage = useLanguageStore.getState().language;
      if (lng !== currentStoreLanguage) {
        useLanguageStore.setState({ language: lng });
      }
    };

    i18n.on('languageChanged', handleLanguageChanged);

    // Initial sync - set store to match i18n
    if (i18n.language && i18n.language !== language) {
      useLanguageStore.setState({ language: i18n.language });
    }

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]); // Remove language dependency to prevent circular updates

  useEffect(() => {
    // Sync i18n with store when store language changes (only if different)
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);
};