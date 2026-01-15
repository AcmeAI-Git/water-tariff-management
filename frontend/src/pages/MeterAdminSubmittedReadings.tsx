import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useMemo, useState } from 'react';
import { api } from '../services/api';
import { useApiQuery, useAdminId } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Input } from '../components/ui/input';
import { Dropdown } from '../components/ui/Dropdown';
import { Button } from '../components/ui/button';
import { Search, X } from 'lucide-react';

export function MeterAdminSubmittedReadings() {
  const adminId = useAdminId();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  // Fetch all consumption entries
  const { data: consumptions = [], isLoading: consumptionsLoading } = useApiQuery(
    ['consumption'],
    () => api.consumption.getAll()
  );

  // Fetch all users to map userId/account to user details
  const { data: users = [], isLoading: usersLoading } = useApiQuery(
    ['users'],
    () => api.users.getAll()
  );

  // Filter consumptions created by current meter admin
  const myConsumptions = useMemo(() => {
    if (!adminId) return [];
    return consumptions.filter(c => c.createdBy === adminId);
  }, [consumptions, adminId]);

  // Map consumptions to display format
  const submittedReadings = useMemo(() => {
    return myConsumptions.map((consumption) => {
      // Find user by userId or account
      const user = users.find((u) => 
        u.id === consumption.userId || 
        u.account === consumption.userId ||
        (consumption as any).account === u.account ||
        (consumption as any).account === u.id
      );
      const billMonthDate = new Date(consumption.billMonth);
      
      // Get status from consumption directly (no approval status)
      const status = (consumption as any).status || 
                    (consumption as any).activeStatus || 
                    'Active';
      
      // Ensure currentReading is a number
      const currentReading = typeof consumption.currentReading === 'number' 
        ? consumption.currentReading 
        : Number(consumption.currentReading) || 0;
      
      // Use consumption's createdAt as submission date
      const submittedDate = consumption.createdAt 
        ? new Date(consumption.createdAt)
        : billMonthDate;
      
      return {
        id: consumption.id,
        consumptionId: consumption.id,
        batchId: `READING-${consumption.id}`,
        householdName: user?.fullName || user?.name || 'Unknown',
        meterNo: user?.meterNo || 'N/A',
        reading: currentReading.toFixed(2),
        month: billMonthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        submitted: submittedDate.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        submittedTimestamp: submittedDate.getTime(),
        status: status === 'Active' ? 'Active' : status === 'Inactive' ? 'Inactive' : 'Active',
      };
    })
    .sort((a, b) => {
      // Sort by submission date descending (newest first)
      return b.submittedTimestamp - a.submittedTimestamp;
    });
  }, [myConsumptions, users]);

  // Get unique months for filter
  const uniqueMonths = useMemo(() => {
    const months = new Set(submittedReadings.map(r => r.month));
    return Array.from(months).sort((a, b) => {
      // Sort months chronologically
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB.getTime() - dateA.getTime();
    });
  }, [submittedReadings]);

  // Apply filters
  const filteredReadings = useMemo(() => {
    return submittedReadings.filter((reading) => {
      // Status filter
      if (statusFilter !== 'all' && reading.status !== statusFilter) {
        return false;
      }

      // Month filter
      if (monthFilter !== 'all' && reading.month !== monthFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          reading.batchId?.toLowerCase().includes(query) ||
          reading.householdName?.toLowerCase().includes(query) ||
          reading.meterNo?.toLowerCase().includes(query) ||
          reading.reading?.toLowerCase().includes(query) ||
          reading.month?.toLowerCase().includes(query);
        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
  }, [submittedReadings, statusFilter, monthFilter, searchQuery]);

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'all' || monthFilter !== 'all' || searchQuery.trim() !== '';

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('all');
    setMonthFilter('all');
    setSearchQuery('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200">
            Active
          </Badge>
        );
      case 'Inactive':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            Inactive
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


  return (
    <div className="min-h-screen bg-app">
      <div className="px-8 py-6">
        {/* Header with inline stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">Reading History</h1>
              <p className="text-sm text-gray-500">View history of all meter readings you have created</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold text-gray-900">{filteredReadings.length}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Active:</span>
                <span className="font-semibold text-green-600">{filteredReadings.filter(r => r.status === 'Active').length}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Inactive:</span>
                <span className="font-semibold text-red-600">{filteredReadings.filter(r => r.status === 'Inactive').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search by name, meter no, reading ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="w-48">
            <Dropdown
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' }
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Filter by Status"
              className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
            />
          </div>

          {/* Month Filter */}
          {uniqueMonths.length > 0 && (
            <div className="w-48">
              <Dropdown
                options={[
                  { value: 'all', label: 'All Months' },
                  ...uniqueMonths.map(month => ({ value: month, label: month }))
                ]}
                value={monthFilter}
                onChange={setMonthFilter}
                placeholder="Filter by Month"
                className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
              />
            </div>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="h-11 px-4 border-gray-300 hover:bg-gray-50"
            >
              <X size={16} className="mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Table */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-gray-50">
                  <TableHead className="text-sm font-semibold text-gray-700">Reading ID</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Household Name</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Meter No</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Reading (m³)</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Bill Month</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Submitted</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReadings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No readings found. Add readings from the Meter Data Entry page.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReadings.map((reading) => (
                    <TableRow key={reading.id} className="border-gray-100">
                      <TableCell className="text-sm text-gray-600 font-mono">{reading.batchId}</TableCell>
                      <TableCell className="text-sm text-gray-900 font-medium">{reading.householdName}</TableCell>
                      <TableCell className="text-sm text-gray-600 font-mono">{reading.meterNo}</TableCell>
                      <TableCell className="text-sm text-gray-600">{reading.reading} m³</TableCell>
                      <TableCell className="text-sm text-gray-600">{reading.month}</TableCell>
                      <TableCell className="text-sm text-gray-600">{reading.submitted}</TableCell>
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
