import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { X, Send } from 'lucide-react';
import { useMemo } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation, useAdminId } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { toast } from 'sonner';
import type { ApprovalStatus } from '../types';

export function MeterAdminPendingSubmissions() {
  const adminId = useAdminId();

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

  // Fetch approval requests for Consumption module to check which consumptions already have approval requests
  const { data: consumptionApprovalRequests = [] } = useApiQuery(
    ['approval-requests', 'Consumption'],
    () => api.approvalRequests.getAll({ moduleName: 'Consumption' })
  );

  // Filter pending consumptions that don't have approval requests yet
  // These are the ones that should appear in "Pending Submissions"
  const consumptionsWithoutApprovalRequests = useMemo(() => {
    return consumptions.filter((consumption) => {
      // Check if status is pending
      const status = consumption.approvalStatus as ApprovalStatus | undefined;
      const statusName = status?.statusName || status?.name;
      if (statusName?.toLowerCase() !== 'pending') {
        return false; // Not pending, exclude
      }
      
      // Check if this consumption already has an approval request
      const hasApprovalRequest = consumptionApprovalRequests.some(
        (req) => req.moduleName === 'Consumption' && req.recordId === consumption.id
      );
      
      // Only include if pending AND no approval request exists yet
      return !hasApprovalRequest;
    }).sort((a, b) => {
      // Sort by creation date descending (newest first)
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [consumptions, consumptionApprovalRequests]);

  // Delete consumption mutation
  const deleteMutation = useApiMutation(
    (id: number) => api.consumption.delete(id),
    {
      successMessage: 'Reading removed successfully',
      errorMessage: 'Failed to remove reading',
      invalidateQueries: [['consumption']],
    }
  );

  // Batch create approval requests mutation
  const batchCreateApprovalRequestsMutation = useApiMutation(
    async (consumptionIds: number[]) => {
      if (!adminId) throw new Error('Admin ID not found');
      // Create approval requests for all consumptions
      const promises = consumptionIds.map(id =>
        api.approvalRequests.create({
          moduleName: 'Consumption',
          recordId: id,
          requestedBy: adminId,
        })
      );
      await Promise.all(promises);
    },
    {
      successMessage: 'Batch sent for approval successfully',
      errorMessage: 'Failed to send batch for approval',
      invalidateQueries: [
        ['approval-requests', 'Consumption'],
        ['approval-requests', 'pending'],
        ['approval-requests'],
        ['consumption'],
      ],
    }
  );

  const removeReading = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleSendBatchForApproval = async () => {
    if (consumptionsWithoutApprovalRequests.length === 0) {
      toast.error('No readings to send for approval');
      return;
    }
    
    const consumptionIds = consumptionsWithoutApprovalRequests.map(c => c.id);
    await batchCreateApprovalRequestsMutation.mutateAsync(consumptionIds);
  };

  // Map consumption to display format with user details
  const displayReadings = useMemo(() => {
    return consumptionsWithoutApprovalRequests.map((consumption) => {
      const user = users.find((u) => u.id === consumption.userId);
      const billMonthDate = new Date(consumption.billMonth);
      // Ensure currentReading is a number before calling toFixed
      const currentReading = typeof consumption.currentReading === 'number' 
        ? consumption.currentReading 
        : Number(consumption.currentReading) || 0;
      return {
        id: consumption.id,
        householdName: user?.fullName || 'Unknown',
        meterNo: user?.meterNo || 'N/A',
        reading: currentReading.toFixed(2),
        month: billMonthDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' }),
      };
    });
  }, [consumptionsWithoutApprovalRequests, users]);

  if (consumptionsLoading || usersLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">Pending Submissions</h1>
          <p className="text-sm text-gray-500">Review and submit readings for approval</p>
        </div>

        {/* Pending Readings Table */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Readings Pending Submission</h3>
            {consumptionsWithoutApprovalRequests.length > 0 && (
              <Button
                onClick={handleSendBatchForApproval}
                disabled={batchCreateApprovalRequestsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send size={16} className="mr-2" />
                Send Batch for Approval ({consumptionsWithoutApprovalRequests.length})
              </Button>
            )}
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-gray-50">
                  <TableHead className="text-sm font-semibold text-gray-700">Household Name</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Meter No</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Current Reading</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Bill Month</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayReadings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No readings in queue. Add readings from the Meter Data Entry page.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayReadings.map((reading) => (
                    <TableRow key={reading.id} className="border-gray-100">
                      <TableCell className="text-sm text-gray-900 font-medium">{reading.householdName}</TableCell>
                      <TableCell className="text-sm text-gray-600">{reading.meterNo}</TableCell>
                      <TableCell className="text-sm text-gray-600">{reading.reading} m³</TableCell>
                      <TableCell className="text-sm text-gray-600">{reading.month}</TableCell>
                      <TableCell className="text-center">
                        <Button 
                          onClick={() => removeReading(reading.id)}
                          variant="outline" 
                          className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg h-8 px-3 text-sm"
                          disabled={deleteMutation.isPending}
                        >
                          <X size={14} className="mr-1" />
                          Remove
                        </Button>
                      </TableCell>
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
