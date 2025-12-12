import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { X } from 'lucide-react';
import { useMemo } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { Consumption, User } from '../types';

export function MeterAdminPendingSubmissions() {
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

  // Filter pending consumptions (those not yet approved)
  // Note: Backend may not have explicit approval status, so we'll show all recent entries
  // In a real system, you'd filter by approvalStatusId
  const pendingConsumptions = useMemo(() => {
    // For now, show all consumptions as pending
    // You may need to add approval status filtering based on your backend structure
    return consumptions.slice().reverse(); // Show most recent first
  }, [consumptions]);

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
    return pendingConsumptions.map((consumption) => {
      const user = users.find((u) => u.id === consumption.userId);
      const billMonthDate = new Date(consumption.billMonth);
      return {
        id: consumption.id,
        householdName: user?.fullName || 'Unknown',
        meterNo: user?.meterNo || 'N/A',
        reading: consumption.currentReading.toFixed(2),
        month: billMonthDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' }),
      };
    });
  }, [pendingConsumptions, users]);

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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Readings Pending Submission</h3>
          
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
