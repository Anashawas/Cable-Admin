import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LANGUAGE } from "../constants/language-constants";
import i18n from "../lib/i18n";

interface LanguageState {
  language: string;
  setLanguage: (language: string) => void;
}

const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: i18n.language || LANGUAGE.AR,
      setLanguage: (language) => {
        i18n.changeLanguage(language);
        set({ language });
      },
    }),
    {
      name: "language-storage",
    }
  )
);

export default useLanguageStore;
