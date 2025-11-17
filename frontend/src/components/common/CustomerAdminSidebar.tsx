import { Users, TrendingUp, BarChart3, LogOut } from 'lucide-react';

interface CustomerAdminSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export function CustomerAdminSidebar({ activePage, onNavigate }: CustomerAdminSidebarProps) {
  const menuItems = [
    { id: 'customer-admin-households', label: 'Household Management', icon: Users },
    { id: 'customer-admin-visualizer', label: 'Tariff Visualizer', icon: TrendingUp },
    { id: 'customer-admin-metrics', label: 'My Metrics', icon: BarChart3 },
  ];

  return (
    <div className="w-[260px] bg-white h-screen fixed left-0 top-0 flex flex-col border-r border-gray-200">
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-900">Water Tariff</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Customer Admin Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${
                isActive
                  ? 'bg-[#4C6EF5] text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[15px] font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-4 pb-6 border-t border-gray-200 pt-4">
        <button
          onClick={() => onNavigate('logout')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={20} strokeWidth={2} />
          <span className="text-[15px] font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
}
