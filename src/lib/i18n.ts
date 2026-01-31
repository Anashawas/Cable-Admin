import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: "ar",
    fallbackLng: "ar",
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    backend: {
      loadPath:
        `${window.env.host.virtualPath}/locales/{{lng}}/{{ns}}.json?v=`.replace(
          /\/\//g,
          "/"
        ) + new Date().getTime(),
    },

    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
    nsSeparator: "@",

    defaultNS: "common",
     ns: [
      "common",
      "app",
      "features",
      "map",
      "user",
      "search",
      "directions",
      "print",
      "camping",
      "reservations",
      "refunds",
      "users",
      "roles",
      "campingSeasons",
      "campingConfigurations",
      "campingAreas",
    ],
  });

export default i18n;
