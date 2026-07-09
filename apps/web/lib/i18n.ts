import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from '../public/locales/es/common.json';
import en from '../public/locales/en/common.json';

const savedLang =
  typeof window !== 'undefined' ? (window.localStorage.getItem('holocron_lang') ?? 'es') : 'es';

i18n.use(initReactI18next).init({
  resources: { es: { common: es }, en: { common: en } },
  lng: savedLang,
  fallbackLng: 'es',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export default i18n;
