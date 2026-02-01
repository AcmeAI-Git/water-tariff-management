import { Home, FileText, MessageSquare, LogOut } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { getStaticTranslation } from "../../constants/staticTranslations";

interface CustomerPortalSidebarProps {
    activePage: string;
    onNavigate: (page: string) => void;
}

export function CustomerPortalSidebar({
    activePage,
    onNavigate,
}: CustomerPortalSidebarProps) {
    const { language } = useLanguage();
    const t = (key: string) => getStaticTranslation(language, key);
    const menuItems = [
        { id: "customer-dashboard", label: t("nav.dashboard"), icon: Home },
        { id: "customer-billing", label: t("nav.billingHistory"), icon: FileText },
        { id: "customer-feedback", label: t("nav.feedback"), icon: MessageSquare },
    ];

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="px-6 py-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-gray-900 notranslate" translate="no">
                        {t("common.appTitle")}
                    </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 notranslate" translate="no">
                    {t("portals.customerPortal")}
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6">
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    return (
                        <div key={item.id}>
                            <button
                                onClick={() => onNavigate(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                    isActive
                                        ? "bg-primary text-white"
                                        : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[0.9375rem] font-medium notranslate" translate="no">
                                    {item.label}
                                </span>
                            </button>
                            {index < menuItems.length - 1 && (
                                <div className="border-b border-gray-400 mx-4"></div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="px-4 pb-6 border-t border-gray-200 pt-4">
                <button
                    onClick={() => onNavigate("logout")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
                >
                    <LogOut size={20} strokeWidth={2} />
                    <span className="text-[0.9375rem] font-medium notranslate" translate="no">
                        {t("common.logOut")}
                    </span>
                </button>
            </div>
        </div>
    );
}
