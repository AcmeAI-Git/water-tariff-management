import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { X } from 'lucide-react';
import { useMemo } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation, useAdminId } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function MeterAdminPendingSubmissions() {
  const adminId = useAdminId();

  // Fetch pending consumption entries (filtered by approvalStatus=Pending)
  const { data: consumptions = [], isLoading: consumptionsLoading } = useApiQuery(
    ['consumption', 'pending'],
    () => api.consumption.getAll({ approvalStatus: 'Pending' })
  );

  // Fetch all users to map userId/account to user details
  const { data: users = [], isLoading: usersLoading } = useApiQuery(
    ['users'],
    () => api.users.getAll()
  );

  // Fetch all meters to get meter numbers (users API may not include meterNo)
  const { data: meters = [], isLoading: metersLoading } = useApiQuery(
    ['meters'],
    () => api.meters.getAll()
  );

  // Filter consumptions created by current meter admin and ensure they are pending
  const myConsumptions = useMemo(() => {
    if (!adminId) return [];
    return consumptions
      .filter((consumption) => {
        // Filter by creator and ensure it's pending (API should already filter, but double-check)
        const isCreatedByMe = consumption.createdBy === adminId;
        const isPending = !consumption.approvalStatus || 
                         (consumption.approvalStatus as any)?.statusName?.toLowerCase() === 'pending' ||
                         (consumption.approvalStatus as any)?.name?.toLowerCase() === 'pending' ||
                         (consumption as any).approvalStatus === 'Pending';
        return isCreatedByMe && isPending;
      })
      .sort((a, b) => {
        // Sort by creation date descending (newest first)
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
  }, [consumptions, adminId]);

  // Delete consumption mutation
  const deleteMutation = useApiMutation(
    (id: number) => api.consumption.delete(id),
    {
      successMessage: 'Reading removed successfully',
      errorMessage: 'Failed to remove reading',
      invalidateQueries: [['consumption']],
    }
  );

  const removeReading = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  // Map consumption to display format with user details
  const displayReadings = useMemo(() => {
    return myConsumptions.map((consumption) => {
      // Find user by userAccount (UUID) or userId (number) - handle both for compatibility
      const userAccount = (consumption as any).userAccount || (consumption as any).account;
      const userId = consumption.userId;

      const user = users.find((u) => {
        // Match by account UUID string
        if (userAccount && u.account) {
          return String(u.account) === String(userAccount);
        }
        // Match by numeric userId
        if (userId && u.id) {
          return u.id === userId || String(u.id) === String(userId);
        }
        return false;
      });

      // Get meter number from user or from meters table (users API may not include meterNo)
      let meterNo = user?.meterNo ?? '';
      if (!meterNo && user) {
        const accountForMeter = user.account || userAccount;
        const userMeter = (meters as { account?: string; userAccount?: string; user_account?: string; meterNo?: number | string }[]).find((m) => {
          const meterAccount = m.account || m.userAccount || m.user_account;
          return meterAccount && accountForMeter && String(meterAccount) === String(accountForMeter);
        });
        if (userMeter?.meterNo != null) {
          meterNo = typeof userMeter.meterNo === 'number' ? String(userMeter.meterNo) : String(userMeter.meterNo);
        }
      }
      if (!meterNo) meterNo = 'N/A';

      const billMonthDate = new Date(consumption.billMonth);
      // Ensure currentReading is a number before calling toFixed
      const currentReading = typeof consumption.currentReading === 'number'
        ? consumption.currentReading
        : Number(consumption.currentReading) || 0;

      // Get approval status
      const approvalStatus = consumption.approvalStatus
        ? ((consumption.approvalStatus as any)?.statusName || (consumption.approvalStatus as any)?.name || 'Pending')
        : 'Pending';

      return {
        id: consumption.id,
        householdName: user?.fullName || user?.name || 'Unknown',
        meterNo,
        reading: currentReading.toFixed(2),
        month: billMonthDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' }),
        status: approvalStatus,
        createdAt: consumption.createdAt ? new Date(consumption.createdAt).toLocaleString('en-US') : 'N/A',
      };
    });
  }, [myConsumptions, users, meters]);

  if (consumptionsLoading || usersLoading || metersLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="px-4 md:px-8 py-4 md:py-6">
        {/* Header - centered on mobile to avoid hamburger overlap */}
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h1 className="text-xl md:text-[1.75rem] font-semibold text-gray-900 mb-1">Pending Submissions</h1>
          <p className="text-xs md:text-sm text-gray-500">View all pending meter readings awaiting approval</p>
        </div>

        {/* Readings Table */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Pending Meter Readings</h3>
            <span className="text-sm text-gray-500">{displayReadings.length} pending</span>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle px-4 md:px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="text-sm font-semibold text-gray-700 min-w-[120px]">Household Name</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 min-w-[90px] hidden sm:table-cell">Meter No</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 min-w-[100px]">Current Reading</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 min-w-[90px]">Bill Month</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 min-w-[80px] hidden sm:table-cell">Status</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 text-right min-w-[100px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayReadings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          No pending readings found. Add readings from the Meter Data Entry page.
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayReadings.map((reading) => (
                        <TableRow key={reading.id} className="border-gray-100">
                          <TableCell className="text-sm text-gray-900 font-medium">{reading.householdName}</TableCell>
                          <TableCell className="text-sm text-gray-600 hidden sm:table-cell whitespace-nowrap">{reading.meterNo}</TableCell>
                          <TableCell className="text-sm text-gray-600 whitespace-nowrap">{reading.reading} m³</TableCell>
                          <TableCell className="text-sm text-gray-600 whitespace-nowrap">{reading.month}</TableCell>
                          <TableCell className="text-sm hidden sm:table-cell">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {reading.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              onClick={() => removeReading(reading.id)}
                              variant="outline" 
                              className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg h-8 px-2 sm:px-3 text-sm w-full sm:w-auto"
                              disabled={deleteMutation.isPending}
                            >
                              <X size={14} className="sm:mr-1" />
                              <span className="hidden sm:inline">Remove</span>
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
      </div>
    </div>
  );
}
