import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n.use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: "zh",
        supportedLngs: ["zh", "en"],
        ns: ["common"],
        defaultNS: "common",
        interpolation: {
            escapeValue: false,
        },
        backend: {
            loadPath: "/locales/{{lng}}/{{ns}}.json",
        },
        detection: {
            order: ["cookie", "localStorage", "navigator"],
            caches: ["cookie"],
        },
        debug: false,
    });

export default i18n;
