import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useMemo } from 'react';
import { api } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function MeterAdminSubmittedReadings() {
  // Fetch all consumption entries
  const { data: consumptions = [], isLoading: consumptionsLoading } = useApiQuery(
    ['consumption'],
    () => api.consumption.getAll()
  );

  // Fetch all users to map userId to user details
  const { data: users = [], isLoading: usersLoading } = useApiQuery(
    ['users'],
    () => api.users.getAll()
  );

  // Map consumption to display format with user details
  const submittedReadings = useMemo(() => {
    return consumptions.map((consumption) => {
      const user = users.find((u) => u.id === consumption.userId);
      const billMonthDate = new Date(consumption.billMonth);
      // Note: Backend may not have explicit approval status for consumption
      // You may need to check approvalStatusId or similar field
      const status = 'Pending'; // Default - adjust based on your backend structure
      
      return {
        id: consumption.id,
        batchId: `BATCH-${consumption.id}`,
        householdName: user?.fullName || 'Unknown',
        meterNo: user?.meterNo || 'N/A',
        reading: consumption.currentReading.toFixed(2),
        month: billMonthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        submittedDate: consumption.createdAt 
          ? new Date(consumption.createdAt).toLocaleDateString('en-US')
          : billMonthDate.toLocaleDateString('en-US'),
        status,
      };
    }).reverse(); // Show most recent first
  }, [consumptions, users]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200">
            Approved
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            Rejected
          </Badge>
        );
      case 'Pending':
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-50 text-gray-700 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  if (consumptionsLoading || usersLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const approvedCount = submittedReadings.filter(r => r.status === 'Approved').length;
  const pendingCount = submittedReadings.filter(r => r.status === 'Pending').length;
  const rejectedCount = submittedReadings.filter(r => r.status === 'Rejected').length;

  return (
    <div className="min-h-screen bg-app">
      <div className="px-8 py-6">
        {/* Header with inline stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">Submission History</h1>
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
                <span className="font-semibold text-green-600">{approvedCount}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Pending:</span>
                <span className="font-semibold text-yellow-600">{pendingCount}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Rejected:</span>
                <span className="font-semibold text-red-600">{rejectedCount}</span>
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
                {submittedReadings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No submitted readings found
                    </TableCell>
                  </TableRow>
                ) : (
                  submittedReadings.map((reading) => (
                    <TableRow key={reading.id} className="border-gray-100">
                      <TableCell className="text-sm text-gray-600 font-mono">{reading.batchId}</TableCell>
                      <TableCell className="text-sm text-gray-900 font-medium">{reading.householdName}</TableCell>
                      <TableCell className="text-sm text-gray-600 font-mono">{reading.meterNo}</TableCell>
                      <TableCell className="text-sm text-gray-600">{reading.reading}</TableCell>
                      <TableCell className="text-sm text-gray-600">{reading.month}</TableCell>
                      <TableCell className="text-sm text-gray-600">{reading.submittedDate}</TableCell>
                      <TableCell>{getStatusBadge(reading.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
