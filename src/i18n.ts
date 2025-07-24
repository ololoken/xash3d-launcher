import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ru from './locales/ru.json';

const fallbackLng = 'ru-RU';

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    debug: import.meta.env.MODE === 'development',
    fallbackLng,
    interpolation: {
      escapeValue: false // react already safes from xss
    },
    resources: {
      //'en-US': en,
      'ru-RU': ru,
    },
    nsSeparator: ''
  });
