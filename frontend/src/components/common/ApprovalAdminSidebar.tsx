import { FileCheck, History, FileText, LogOut } from 'lucide-react';

interface ApprovalAdminSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function ApprovalAdminSidebar({ activePage, onNavigate, onLogout }: ApprovalAdminSidebarProps) {
  const menuItems = [
    { id: 'approval-queue', label: 'Approval Queue', icon: FileCheck },
    { id: 'my-history', label: 'My History', icon: History },
    { id: 'system-audit', label: 'System Audit Log', icon: FileText },
  ];

  return (
    <div className="fixed left-0 top-0 w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4C6EF5] to-[#3B5EE5] flex items-center justify-center">
            <FileCheck className="text-white" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Approval Admin</h2>
            <p className="text-xs text-gray-500">Review & Approve</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-[#4C6EF5]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
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
