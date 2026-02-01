import { useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";

declare global {
    interface Window {
        google?: {
            translate?: {
                TranslateElement: (new (
                    options: {
                        pageLanguage: string;
                        includedLanguages: string;
                        layout: number;
                        autoDisplay: boolean;
                    },
                    elementId: string
                ) => void) & { InlineLayout: { SIMPLE: number } };
            };
        };
        googleTranslateElementInit?: () => void;
        _DumpException?: unknown;
    }
}

function clearGoogleTranslateCookies() {
    const hostname = window.location.hostname;
    const domainParts = hostname.split(".");
    const domains: string[] = ["", hostname];
    if (domainParts.length >= 2) {
        domains.push("." + hostname);
        domains.push("." + domainParts.slice(-2).join("."));
    }
    const paths = ["/", ""];
    const cookieNames = ["googtrans", "googtrans_token"];

    for (const name of cookieNames) {
        for (const domain of domains) {
            for (const path of paths) {
                const domainStr = domain ? `; domain=${domain}` : "";
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path || "/"}${domainStr}`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path || "/"}${domainStr}; SameSite=Lax`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path || "/"}${domainStr}; SameSite=None; Secure`;
            }
        }
    }

    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        if (name.includes("goog") || name.includes("translate")) {
            for (const domain of domains) {
                for (const path of paths) {
                    const domainStr = domain ? `; domain=${domain}` : "";
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path || "/"}${domainStr}`;
                }
            }
        }
    }
}

export default function LanguageSwitcher() {
    const { language, updateLanguage } = useLanguage();

    useEffect(() => {
        document.documentElement.lang = "en";

        if (window.google?.translate) {
            return;
        }

        window.googleTranslateElementInit = () => {
            try {
                if (window.google?.translate?.TranslateElement) {
                    new window.google.translate.TranslateElement(
                        {
                            pageLanguage: "en",
                            includedLanguages: "bn,en",
                            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                            autoDisplay: false,
                        },
                        "google_translate_element"
                    );
                }
            } catch (err) {
                console.warn("Google Translate init error:", err);
            }
        };

        if (!document.getElementById("google-translate-script")) {
            const script = document.createElement("script");
            script.id = "google-translate-script";
            script.src =
                "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
            script.async = true;
            script.onerror = () => console.warn("Google Translate script failed to load");
            document.body.appendChild(script);
        }
    }, []);

    const toggleLanguage = () => {
        const newLang = language === "en" ? "bn" : "en";

        // Only remove nodes that are NOT inside React's root to avoid "removeChild" error.
        // Do not remove google_translate_element - it is rendered by React.
        const elementsToRemove = [
            document.querySelector(".skiptranslate"),
            document.querySelector(".goog-te-banner-frame"),
            document.querySelector(".goog-te-spinner-pos"),
            document.querySelector(".VIpgJd-ZVi9od-aZ2wEe-wOHMyf"),
            ...document.querySelectorAll('iframe[src*="translate.google"]'),
            ...document.querySelectorAll('iframe[src*="translate.googleapis"]'),
            ...document.querySelectorAll("[class*=\"goog-te\"]"),
            ...document.querySelectorAll("[class*=\"VIpgJd\"]"),
        ].filter((el) => {
            const root = document.getElementById("root");
            if (!el || !root) return false;
            return !root.contains(el);
        });

        elementsToRemove.forEach((el) => {
            if (el?.parentNode) el.remove();
        });

        if (window.google) {
            delete window.google.translate;
        }
        delete window.googleTranslateElementInit;
        delete window._DumpException;

        clearGoogleTranslateCookies();
        updateLanguage(newLang);

        if (newLang === "bn") {
            const expireDate = new Date();
            expireDate.setTime(expireDate.getTime() + 365 * 24 * 60 * 60 * 1000);
            const expireDateString = expireDate.toUTCString();
            document.cookie = `googtrans=/en/bn; path=/; expires=${expireDateString}; SameSite=Lax`;
            const hostname = window.location.hostname;
            if (!hostname.includes("vercel.app") && !hostname.includes("localhost")) {
                document.cookie = `googtrans=/en/bn; path=/; domain=.${hostname}; expires=${expireDateString}; SameSite=Lax`;
            }
        } else {
            document.cookie = "googtrans=/en/en; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
        }

        setTimeout(() => {
            const url = new URL(window.location.href);
            url.searchParams.delete("_reload");
            url.searchParams.delete("lr");
            url.searchParams.set("_t", Date.now().toString());
            window.location.href = url.toString();
        }, 150);
    };

    return (
        <div
            className={`relative z-[1000] min-w-[100px] flex items-center ${language === "bn" ? "noto-sans-bengali" : ""}`}
        >
            <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex items-center justify-center min-w-[7rem] px-3 py-2.5 bg-primary text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]"
                translate="no"
            >
                {language === "en" ? "⇆ English" : "⇆ বাংলা"}
            </button>

            <div id="google_translate_element" style={{ display: "none" }} />

            <style>{`
                .goog-te-banner-frame { display: none !important; height: 0 !important; visibility: hidden !important; }
                body { top: 0px !important; position: static !important; }
                .skiptranslate { display: none !important; }
                .goog-te-gadget { font-size: 0 !important; }
                .goog-logo-link { display: none !important; }
                .VIpgJd-ZVi9od-aZ2wEe-wOHMyf, .goog-te-spinner-pos, .VIpgJd-ZVi9od-aZ2wEe-OiiCO { display: none !important; visibility: hidden !important; }
                .translated-ltr, .translated-rtl, .translated-ltr *, .translated-rtl *, font[face], font[face] * { font-family: inherit !important; }
                body.lang-bn, body.lang-bn *,.lang-bn, .lang-bn * { font-family: 'Noto Sans Bengali', sans-serif !important; }
                [style*="Noto Serif"] { font-family: 'Noto Sans Bengali', sans-serif !important; }
            `}</style>
        </div>
    );
}
