import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";

export type Language = "en" | "bn";

type LanguageContextValue = {
    language: Language;
    updateLanguage: (newLang: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage(): LanguageContextValue {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}

function getCookieValue(name: string): string | null {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        const [key, value] = cookie.split("=").map((c) => c.trim());
        if (key === name) return value;
    }
    return null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");

    useEffect(() => {
        let detectedLang: Language = "en";

        const savedLang = localStorage.getItem("preferredLanguage");
        if (savedLang === "bn" || savedLang === "en") {
            detectedLang = savedLang;
        } else {
            const googtransCookie = getCookieValue("googtrans");
            if (googtransCookie) {
                const parts = googtransCookie.split("/");
                const targetLang = parts[parts.length - 1];
                if (targetLang === "bn") {
                    detectedLang = "bn";
                }
            }
        }

        setLanguage(detectedLang);
    }, []);

    useEffect(() => {
        if (language === "bn") {
            document.body.classList.add("lang-bn");
            document.documentElement.lang = "bn";
        } else {
            document.body.classList.remove("lang-bn");
            document.documentElement.lang = "en";
        }
    }, [language]);

    const updateLanguage = (newLang: Language) => {
        setLanguage(newLang);
        localStorage.setItem("preferredLanguage", newLang);
    };

    const value: LanguageContextValue = {
        language,
        updateLanguage,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}
