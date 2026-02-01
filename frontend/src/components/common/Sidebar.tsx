import {
    Home,
    Users2,
    ClipboardList,
    LogOut,
    Map,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import { getStaticTranslation } from "../../constants/staticTranslations";

export type SidebarProps = {
    activePage?: string;
    onNavigate?: (page: string) => void;
};

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { language } = useLanguage();
    const t = (key: string) => getStaticTranslation(language, key);

    const routeMap: Record<string, string> = {
        "tariff-map": "/tariff-admin/map",
        dashboard: "/admin/dashboard",
        agents: "/admin/agents",
        audit: "/admin/audit",
    };

    const handleNav = (id: string) => {
        if (onNavigate) {
            try {
                onNavigate(id);
            } catch {
                /* ignore handler errors */
            }
        }

        if (id === "logout") {
            localStorage.removeItem("authToken");
            sessionStorage.clear();
            try {
                qc?.clear?.();
            } catch {
                // Ignore query client errors
            }
            toast(t("common.loggedOut"));
            navigate("/login");
            return;
        }

        const path = routeMap[id] ?? "/";
        navigate(path);
    };

    const menuItems = [
        { id: "tariff-map", label: t("nav.tariffMap"), icon: Map },
        { id: "dashboard", label: t("nav.dashboard"), icon: Home },
        { id: "agents", label: t("nav.agentManagement"), icon: Users2 },
        { id: "audit", label: t("nav.systemAuditLog"), icon: ClipboardList },
    ];

    return (
        <div className="w-[280px] bg-white h-screen fixed left-0 top-0 flex flex-col border-r border-gray-200">
            {/* Header */}
            <div className="px-6 py-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-gray-900 notranslate" translate="no">
                        {t("common.appTitle")}
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6">
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    return (
                        <div key={item.id}>
                            <button
                                onClick={() => handleNav(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                    isActive
                                        ? "bg-primary text-white"
                                        : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
                                <span className="text-[0.9375rem] font-medium whitespace-nowrap text-left notranslate" translate="no">
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
                    onClick={() => handleNav("logout")}
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
