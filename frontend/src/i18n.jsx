import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// 🔹 Import translation JSON files
import en from "./locals/en.json";
import ta from "./locals/ta.json";

// 🔹 Load saved language
const savedLang = localStorage.getItem("LANG") || "en";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ta: { translation: ta },
    },
    lng: savedLang,        // ✅ DEFAULT LANGUAGE
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,  // React already safe
    },
  });

export default i18n;
