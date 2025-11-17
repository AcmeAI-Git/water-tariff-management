import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Edit2 } from 'lucide-react';

export function AgentManagement() {
  const admins = [
    { name: 'Sarah Ahmed', email: 'sarah.ahmed@wateraid.org', role: 'Super Admin' },
    { name: 'Kamal Hassan', email: 'kamal.hassan@wateraid.org', role: 'Tariff Admin' },
    { name: 'Nadia Chowdhury', email: 'nadia.c@wateraid.org', role: 'Customer Admin' },
    { name: 'Rahim Uddin', email: 'rahim.uddin@wateraid.org', role: 'Meter Admin' },
    { name: 'Ayesha Khan', email: 'ayesha.khan@wateraid.org', role: 'Customer Admin' },
    { name: 'Ibrahim Ali', email: 'ibrahim.ali@wateraid.org', role: 'Meter Admin' },
  ];

  const getRoleBadgeColor = (role: string) => {
    if (role === 'Super Admin') return 'bg-purple-50 text-purple-700';
    if (role === 'Tariff Admin') return 'bg-blue-50 text-blue-700';
    if (role === 'Customer Admin') return 'bg-green-50 text-green-700';
    return 'bg-amber-50 text-amber-700';
  };

  return (
    <div className="min-h-screen bg-app">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">User Management</h1>
            <p className="text-sm text-gray-500">Manage all system administrators and their permissions</p>
          </div>
          <Button className="bg-primary hover:bg-primary-600 text-white px-6 rounded-lg shadow-sm">
            + Add New Admin
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 bg-gray-50">
                <TableHead className="text-sm font-semibold text-gray-700">Full Name</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Email</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Role</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin, index) => (
                <TableRow key={index} className="border-gray-100">
                  <TableCell className="text-sm text-gray-900 font-medium">{admin.name}</TableCell>
                  <TableCell className="text-sm text-gray-600">{admin.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(admin.role)}`}>
                      {admin.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      <Edit2 size={14} className="mr-1.5" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}


