import { BarChart3, Clock, TrendingUp, LogOut } from 'lucide-react';

interface TariffAdminSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function TariffAdminSidebar({ currentPage, onNavigate, onLogout }: TariffAdminSidebarProps) {
  const menuItems = [
    { id: 'tariff-config', label: 'Tariff Configuration', icon: BarChart3 },
    { id: 'tariff-multiplier', label: 'Tariff Multiplier', icon: BarChart3 },
    { id: 'tariff-history', label: 'Tariff History', icon: Clock },
    { id: 'tariff-visualizer', label: 'Tariff Visualizer', icon: TrendingUp },
    { id: 'my-metrics', label: 'My Metrics', icon: BarChart3 },
  ];

  return (
    <div className="w-[260px] bg-white h-screen fixed left-0 top-0 flex flex-col border-r border-gray-200">
      {/* Logo/Header */}
      <div className="px-6 py-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Water Tariff System</h1>
        <p className="text-sm text-gray-500 mt-1">Tariff Admin</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#4C6EF5] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="px-4 pb-6 border-t border-gray-200 pt-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={20} strokeWidth={2} />
          <span className="text-[15px] font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
}
