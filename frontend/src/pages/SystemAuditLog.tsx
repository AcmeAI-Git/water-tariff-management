import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';
import { useState } from 'react';

export function SystemAuditLog() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for audit logs
  const auditLogs = [
    {
      id: 'LOG-1245',
      timestamp: '2025-11-10 09:30:15',
      user: 'Rahim Ahmed',
      action: 'CREATE',
      module: 'Household',
      details: 'Created new household HH-2891',
    },
    {
      id: 'LOG-1244',
      timestamp: '2025-11-10 09:15:42',
      user: 'Approval Admin',
      action: 'APPROVE',
      module: 'Tariff',
      details: 'Approved tariff change REQ-002',
    },
    {
      id: 'LOG-1243',
      timestamp: '2025-11-10 08:45:20',
      user: 'Karim Hassan',
      action: 'UPDATE',
      module: 'Tariff',
      details: 'Updated rate for slab 0-10 m³ from ৳12.00 to ৳15.00',
    },
    {
      id: 'LOG-1242',
      timestamp: '2025-11-10 08:30:10',
      user: 'Nasrin Khan',
      action: 'CREATE',
      module: 'Meter Reading',
      details: 'Submitted meter reading for MTR-10456',
    },
    {
      id: 'LOG-1241',
      timestamp: '2025-11-09 17:20:35',
      user: 'Approval Admin',
      action: 'REJECT',
      module: 'Household',
      details: 'Rejected household update REQ-015',
    },
    {
      id: 'LOG-1240',
      timestamp: '2025-11-09 16:45:18',
      user: 'Salma Akter',
      action: 'UPDATE',
      module: 'Household',
      details: 'Updated category for HH-1523 from Residential to Commercial',
    },
    {
      id: 'LOG-1239',
      timestamp: '2025-11-09 15:30:50',
      user: 'Karim Hassan',
      action: 'VIEW',
      module: 'Tariff',
      details: 'Viewed tariff configuration record TC-042',
    },
    {
      id: 'LOG-1238',
      timestamp: '2025-11-09 14:10:22',
      user: 'Nasrin Khan',
      action: 'DELETE',
      module: 'Meter Reading',
      details: 'Deleted duplicate reading MR-8821',
    },
    {
      id: 'LOG-1237',
      timestamp: '2025-11-09 13:25:40',
      user: 'Rahim Ahmed',
      action: 'CREATE',
      module: 'Household',
      details: 'Created new household HH-2890',
    },
    {
      id: 'LOG-1236',
      timestamp: '2025-11-09 12:15:30',
      user: 'Approval Admin',
      action: 'APPROVE',
      module: 'Meter Reading',
      details: 'Approved meter reading correction REQ-003',
    },
    {
      id: 'LOG-1235',
      timestamp: '2025-11-09 11:40:15',
      user: 'Karim Hassan',
      action: 'UPDATE',
      module: 'Tariff',
      details: 'Updated rate for slab 11-20 m³ from ৳18.00 to ৳20.00',
    },
    {
      id: 'LOG-1234',
      timestamp: '2025-11-09 10:20:45',
      user: 'Nasrin Khan',
      action: 'CREATE',
      module: 'Meter Reading',
      details: 'Submitted meter reading for MTR-11234',
    },
    {
      id: 'LOG-1233',
      timestamp: '2025-11-09 09:55:10',
      user: 'Salma Akter',
      action: 'VIEW',
      module: 'Household',
      details: 'Viewed household record HH-1523',
    },
    {
      id: 'LOG-1232',
      timestamp: '2025-11-08 17:30:22',
      user: 'Approval Admin',
      action: 'APPROVE',
      module: 'Household',
      details: 'Approved household registration REQ-001',
    },
    {
      id: 'LOG-1231',
      timestamp: '2025-11-08 16:15:50',
      user: 'Rahim Ahmed',
      action: 'UPDATE',
      module: 'Household',
      details: 'Updated contact information for HH-2889',
    },
  ];

  const filteredLogs = auditLogs.filter(log =>
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50';
      case 'UPDATE':
        return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50';
      case 'DELETE':
        return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50';
      case 'VIEW':
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50';
      case 'APPROVE':
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50';
      case 'REJECT':
        return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-8 py-6">
        {/* Header with inline stats */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-semibold text-gray-900 mb-1">System Audit Log</h1>
              <p className="text-sm text-gray-500">A read-only log of all actions taken in the system</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold text-gray-900">{auditLogs.length}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Today:</span>
                <span className="font-semibold text-gray-900">8</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Approvals:</span>
                <span className="font-semibold text-green-600">3</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Rejections:</span>
                <span className="font-semibold text-red-600">1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Timestamp</TableHead>
                <TableHead className="font-semibold text-gray-700">User</TableHead>
                <TableHead className="font-semibold text-gray-700">Action</TableHead>
                <TableHead className="font-semibold text-gray-700">Module</TableHead>
                <TableHead className="font-semibold text-gray-700">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="border-gray-100">
                  <TableCell className="text-gray-600 whitespace-nowrap">{log.timestamp}</TableCell>
                  <TableCell className="font-medium text-gray-900">{log.user}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={getActionBadgeColor(log.action)}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{log.module}</TableCell>
                  <TableCell className="text-gray-600">{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
