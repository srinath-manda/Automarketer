import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, LANGUAGES } from '../utils/translations';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');

    // Load saved language from localStorage
    useEffect(() => {
        const savedLang = localStorage.getItem('app_language');
        if (savedLang && translations[savedLang]) {
            setLanguage(savedLang);
        }
    }, []);

    const changeLanguage = (langCode) => {
        if (translations[langCode]) {
            setLanguage(langCode);
            localStorage.setItem('app_language', langCode);
        }
    };

    const t = (key) => {
        // Handle nested keys like 'nav.home'
        const keys = key.split('.');
        let value = translations[language];

        for (const k of keys) {
            value = value?.[k];
        }

        if (value) return value;

        // Fallback to English
        let fallback = translations['en'];
        for (const k of keys) {
            fallback = fallback?.[k];
        }

        return fallback || key;
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t, LANGUAGES }}>
            {children}
        </LanguageContext.Provider>
    );
};
