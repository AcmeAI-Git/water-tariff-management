import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { FileText, CheckCircle, Clock, XCircle } from 'lucide-react';

export function MeterAdminSubmittedReadings() {
  const submittedReadings = [
    {
      id: 1,
      batchId: 'BATCH-2025-001',
      householdName: 'Ahmed Residence',
      meterNo: 'MTR-2024-001',
      reading: '245.5',
      month: 'January 2025',
      submittedDate: '2025-01-15',
      status: 'Approved',
    },
    {
      id: 2,
      batchId: 'BATCH-2025-001',
      householdName: 'Rahman Villa',
      meterNo: 'MTR-2024-002',
      reading: '189.2',
      month: 'January 2025',
      submittedDate: '2025-01-15',
      status: 'Approved',
    },
    {
      id: 3,
      batchId: 'BATCH-2025-002',
      householdName: 'Sarah Khan',
      meterNo: 'MTR-2024-003',
      reading: '312.8',
      month: 'January 2025',
      submittedDate: '2025-01-20',
      status: 'Pending',
    },
    {
      id: 4,
      batchId: 'BATCH-2025-002',
      householdName: 'Karim Enterprises',
      meterNo: 'MTR-2024-004',
      reading: '567.4',
      month: 'January 2025',
      submittedDate: '2025-01-20',
      status: 'Pending',
    },
    {
      id: 5,
      batchId: 'BATCH-2025-003',
      householdName: 'Hossain Apartment',
      meterNo: 'MTR-2024-005',
      reading: '198.1',
      month: 'December 2024',
      submittedDate: '2025-01-05',
      status: 'Rejected',
    },
    {
      id: 6,
      batchId: 'BATCH-2024-128',
      householdName: 'Ali Trading Co.',
      meterNo: 'MTR-2024-006',
      reading: '423.7',
      month: 'December 2024',
      submittedDate: '2024-12-28',
      status: 'Approved',
    },
    {
      id: 7,
      batchId: 'BATCH-2024-128',
      householdName: 'Fatima Residence',
      meterNo: 'MTR-2024-007',
      reading: '156.9',
      month: 'December 2024',
      submittedDate: '2024-12-28',
      status: 'Approved',
    },
    {
      id: 8,
      batchId: 'BATCH-2025-004',
      householdName: 'Rahim Plaza',
      meterNo: 'MTR-2024-008',
      reading: '678.3',
      month: 'January 2025',
      submittedDate: '2025-01-22',
      status: 'Pending',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            Rejected
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-app">
      <div className="px-8 py-6">
        {/* Header with inline stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-semibold text-gray-900 mb-1">Submission History</h1>
              <p className="text-sm text-gray-500">View history of all submitted meter readings</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold text-gray-900">{submittedReadings.length}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Approved:</span>
                <span className="font-semibold text-green-600">{submittedReadings.filter(r => r.status === 'Approved').length}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Pending:</span>
                <span className="font-semibold text-yellow-600">{submittedReadings.filter(r => r.status === 'Pending').length}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Rejected:</span>
                <span className="font-semibold text-red-600">{submittedReadings.filter(r => r.status === 'Rejected').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div>
          
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-gray-50">
                  <TableHead className="text-sm font-semibold text-gray-700">Batch ID</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Household Name</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Meter No</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Reading (m³)</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Bill Month</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Submitted Date</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submittedReadings.map((reading) => (
                  <TableRow key={reading.id} className="border-gray-100">
                    <TableCell className="text-sm text-gray-600 font-mono">{reading.batchId}</TableCell>
                    <TableCell className="text-sm text-gray-900 font-medium">{reading.householdName}</TableCell>
                    <TableCell className="text-sm text-gray-600 font-mono">{reading.meterNo}</TableCell>
                    <TableCell className="text-sm text-gray-600">{reading.reading}</TableCell>
                    <TableCell className="text-sm text-gray-600">{reading.month}</TableCell>
                    <TableCell className="text-sm text-gray-600">{reading.submittedDate}</TableCell>
                    <TableCell>{getStatusBadge(reading.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

