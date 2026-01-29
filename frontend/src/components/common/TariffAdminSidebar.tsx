import { BarChart3, LogOut, Layers, MapPin } from 'lucide-react';

interface TariffAdminSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function TariffAdminSidebar({ currentPage, onNavigate, onLogout }: TariffAdminSidebarProps) {
  const menuItems = [
    { id: 'tariff-config', label: 'Tariff Configuration', icon: BarChart3 },
    { id: 'zone-scoring', label: 'Zone Scoring', icon: Layers },
    { id: 'location-management', label: 'Location Management', icon: MapPin },
    // { id: 'tariff-history', label: 'Tariff History', icon: Clock }, // Disabled temporarily
    { id: 'my-metrics', label: 'My Metrics', icon: BarChart3 },
  ];

  return (
    <div className="w-[280px] bg-white h-screen fixed left-0 top-0 flex flex-col border-r border-gray-200">
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-900">
            Water Tariff
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Tariff Admin Portal
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <div key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[0.9375rem] font-medium">{item.label}</span>
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
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={20} strokeWidth={2} />
          <span className="text-[0.9375rem] font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
}
