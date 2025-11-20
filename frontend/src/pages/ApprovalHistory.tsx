import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';

export function ApprovalHistory() {
  // Mock data for approval history
  const approvalHistory = [
    {
      id: 'REQ-097',
      module: 'Household Registration',
      requestedBy: 'Rahim Ahmed',
      requestDate: '2025-11-05 14:30',
      decision: 'Approved',
      reviewedDate: '2025-11-05 16:45',
    },
    {
      id: 'REQ-096',
      module: 'Tariff Configuration',
      requestedBy: 'Karim Hassan',
      requestDate: '2025-11-04 11:20',
      decision: 'Rejected',
      reviewedDate: '2025-11-04 15:10',
    },
    {
      id: 'REQ-095',
      module: 'Meter Reading',
      requestedBy: 'Nasrin Khan',
      requestDate: '2025-11-04 09:15',
      decision: 'Approved',
      reviewedDate: '2025-11-04 11:30',
    },
    {
      id: 'REQ-094',
      module: 'Household Registration',
      requestedBy: 'Salma Akter',
      requestDate: '2025-11-03 16:45',
      decision: 'Approved',
      reviewedDate: '2025-11-03 17:20',
    },
    {
      id: 'REQ-093',
      module: 'Tariff Configuration',
      requestedBy: 'Karim Hassan',
      requestDate: '2025-11-03 10:30',
      decision: 'Approved',
      reviewedDate: '2025-11-03 14:15',
    },
    {
      id: 'REQ-092',
      module: 'Meter Reading',
      requestedBy: 'Nasrin Khan',
      requestDate: '2025-11-02 13:20',
      decision: 'Rejected',
      reviewedDate: '2025-11-02 15:40',
    },
    {
      id: 'REQ-091',
      module: 'Household Registration',
      requestedBy: 'Rahim Ahmed',
      requestDate: '2025-11-02 08:45',
      decision: 'Approved',
      reviewedDate: '2025-11-02 10:30',
    },
    {
      id: 'REQ-090',
      module: 'Tariff Configuration',
      requestedBy: 'Karim Hassan',
      requestDate: '2025-11-01 15:10',
      decision: 'Approved',
      reviewedDate: '2025-11-01 16:50',
    },
    {
      id: 'REQ-089',
      module: 'Meter Reading',
      requestedBy: 'Nasrin Khan',
      requestDate: '2025-11-01 11:30',
      decision: 'Approved',
      reviewedDate: '2025-11-01 13:15',
    },
    {
      id: 'REQ-088',
      module: 'Household Registration',
      requestedBy: 'Salma Akter',
      requestDate: '2025-10-31 14:20',
      decision: 'Rejected',
      reviewedDate: '2025-10-31 16:00',
    },
  ];

  // Stats
  const totalReviewed = approvalHistory.length;
  const approved = approvalHistory.filter(item => item.decision === 'Approved').length;
  const rejected = approvalHistory.filter(item => item.decision === 'Rejected').length;

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-8 py-6">
        {/* Header with inline stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-semibold text-gray-900 mb-1">My Approval History</h1>
              <p className="text-sm text-gray-500">A log of all changes you have approved or rejected</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold text-gray-900">{totalReviewed}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Approved:</span>
                <span className="font-semibold text-green-600">{approved}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Rejected:</span>
                <span className="font-semibold text-red-600">{rejected}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Module</TableHead>
                <TableHead className="font-semibold text-gray-700">Requested By</TableHead>
                <TableHead className="font-semibold text-gray-700">Request Date</TableHead>
                <TableHead className="font-semibold text-gray-700">My Decision</TableHead>
                <TableHead className="font-semibold text-gray-700">Reviewed Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvalHistory.map((item) => (
                <TableRow key={item.id} className="border-gray-100">
                  <TableCell className="font-medium text-gray-900">{item.module}</TableCell>
                  <TableCell className="text-gray-600">{item.requestedBy}</TableCell>
                  <TableCell className="text-gray-600">{item.requestDate}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={
                        item.decision === 'Approved'
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50'
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50'
                      }
                    >
                      {item.decision}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{item.reviewedDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
