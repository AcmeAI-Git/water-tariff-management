import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useMemo, useState } from 'react';
import { api } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { mapUserToCustomer } from '../utils/dataMappers';
import { Input } from '../components/ui/input';
import { Dropdown } from '../components/ui/Dropdown';
import { Button } from '../components/ui/button';
import { Search, X } from 'lucide-react';
import type { User, Meter, Admin } from '../types';

export function CustomerAdminSubmissionHistory() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch all customers (users)
  const { data: users = [], isLoading: usersLoading } = useApiQuery<User[]>(
    ['users'],
    () => api.users.getAll()
  );

  // Fetch all meters to get meter numbers
  const { data: meters = [], isLoading: metersLoading } = useApiQuery<Meter[]>(
    ['meters'],
    () => api.meters.getAll()
  );

  // Fetch all admins to map createdBy IDs to names
  const { data: admins = [], isLoading: adminsLoading } = useApiQuery<Admin[]>(
    ['admins'],
    () => api.admins.getAll()
  );

  // Map customers to submission history format
  const submissionHistory = useMemo(() => {
    return users.map((user) => {
      const userData = user as any;
      const customer = mapUserToCustomer(user);
      
      // Get customer ID - handle both id (number) and account (UUID)
      const customerId = user.id || user.account || (userData.account || userData.id);
      // customerIdStr is unused but kept for potential future use
      // const customerIdStr = customerId 
      //   ? (typeof customerId === 'string' ? customerId.substring(0, 8) : String(customerId))
      //   : 'N/A';
      
      // Get meter number from meters table if not in user
      let meterNo = customer.meterNo || user.meterNo || '';
      if (!meterNo || meterNo === 'N/A') {
        const userAccount = user.account || customerId;
        const userMeter = (meters as Meter[]).find((m: Meter) => {
          const meterAccount = (m as any).account || m.userAccount || (m as any).user_account;
          return meterAccount && userAccount && String(meterAccount) === String(userAccount);
        });
        if (userMeter?.meterNo) {
          meterNo = typeof userMeter.meterNo === 'number' ? userMeter.meterNo.toString() : String(userMeter.meterNo);
        }
      }
      
      // Get phone from user
      const phone = user.phone || userData.phone || '';
      
      // Get created date - check multiple possible locations
      const createdAt = user.createdAt || 
                       userData.createdAt || 
                       userData.created_at ||
                       (user as any).createdAt ||
                       (user as any).created_at;
      
      // Get createdBy admin
      const createdById = userData.createdBy || userData.created_by;
      const creator = createdById ? (admins as Admin[]).find((a) => a.id === createdById) : null;
      
      // Get status
      const status = user.status?.toLowerCase() === 'active' ? 'Active' : 
                     user.status?.toLowerCase() === 'inactive' ? 'Inactive' : 
                     (userData.activeStatus?.toLowerCase() === 'active' ? 'Active' :
                      userData.activeStatus?.toLowerCase() === 'inactive' ? 'Inactive' : 'Active');
      
      return {
        id: customerId,
        requestId: customerId 
          ? (typeof customerId === 'string' 
              ? `CUST-${customerId.substring(0, 8).toUpperCase()}` 
              : `CUST-${String(customerId).padStart(4, '0')}`)
          : 'N/A',
        name: customer.name || customer.fullName || user.fullName || 'Unknown',
        fullName: customer.fullName || customer.name || user.fullName || 'Unknown',
        meterNo: meterNo || 'N/A',
        phone: phone || 'N/A',
        address: customer.address || user.address || 'N/A',
        submission: createdAt
          ? new Date(createdAt).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : 'N/A',
        createdBy: creator?.fullName || (createdById ? `Admin #${createdById}` : 'N/A'),
        status,
      };
    }).sort((a, b) => {
      // Sort by submission date (newest first), but handle 'N/A' dates
      if (a.submission === 'N/A' && b.submission === 'N/A') return 0;
      if (a.submission === 'N/A') return 1;
      if (b.submission === 'N/A') return -1;
      const dateA = new Date(a.submission).getTime();
      const dateB = new Date(b.submission).getTime();
      return dateB - dateA;
    });
  }, [users, meters, admins]);

  // Apply filters
  const filteredSubmissions = useMemo(() => {
    return submissionHistory.filter((submission) => {
      // Status filter
      if (statusFilter !== 'all' && submission.status !== statusFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          submission.requestId?.toLowerCase().includes(query) ||
          submission.name?.toLowerCase().includes(query) ||
          submission.fullName?.toLowerCase().includes(query) ||
          (typeof submission.meterNo === 'string' ? submission.meterNo.toLowerCase() : String(submission.meterNo || '')).includes(query) ||
          submission.phone?.toLowerCase().includes(query) ||
          submission.address?.toLowerCase().includes(query);
        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
  }, [submissionHistory, statusFilter, searchQuery]);

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'all' || searchQuery.trim() !== '';

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('all');
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

  if (usersLoading || metersLoading || adminsLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const activeCount = filteredSubmissions.filter(s => s.status === 'Active').length;
  const inactiveCount = filteredSubmissions.filter(s => s.status === 'Inactive').length;
  const totalCount = filteredSubmissions.length;

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-4 md:px-8 py-4 md:py-6">
        {/* Header with inline stats - centered on mobile to avoid hamburger overlap */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 items-center text-center md:text-left">
            <div>
              <h1 className="text-xl md:text-[28px] font-semibold text-gray-900 mb-1">Customer History</h1>
              <p className="text-xs md:text-sm text-gray-500">View history of all registered customers</p>
            </div>
            <div className="flex items-center gap-4 md:gap-6 text-sm flex-wrap justify-center md:justify-start">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold text-gray-900">{totalCount}</span>
              </div>
              <span className="text-gray-300 hidden sm:inline">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Active:</span>
                <span className="font-semibold text-green-600">{activeCount}</span>
              </div>
              <span className="text-gray-300 hidden sm:inline">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Inactive:</span>
                <span className="font-semibold text-red-600">{inactiveCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-0 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 shrink-0" size={18} />
            <Input
              type="text"
              placeholder="Search by name, meter no, phone, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full min-w-0 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48 min-w-0">
            <Dropdown
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' }
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Filter by Status"
              className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 w-full"
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="h-11 px-4 border-gray-300 hover:bg-gray-50 w-full sm:w-auto shrink-0"
            >
              <X size={16} className="mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Submission History Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle px-4 md:px-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 bg-gray-50">
                    <TableHead className="text-sm font-semibold text-gray-700 min-w-[100px] hidden sm:table-cell">Customer ID</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 min-w-[120px]">Name</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 min-w-[90px] hidden md:table-cell">Meter No</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 min-w-[100px] hidden lg:table-cell">Phone</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 min-w-[140px] hidden lg:table-cell">Address</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 min-w-[120px]">Created Date</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 min-w-[100px] hidden md:table-cell">Created By</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 min-w-[90px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                        No customers found. Add customers from the Customer Management page.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubmissions.map((submission) => (
                      <TableRow key={submission.id || submission.requestId} className="border-gray-100">
                        <TableCell className="text-sm text-gray-600 font-mono hidden sm:table-cell">{submission.requestId}</TableCell>
                        <TableCell className="text-sm text-gray-900 font-medium">{submission.name || submission.fullName}</TableCell>
                        <TableCell className="text-sm text-gray-600 font-mono hidden md:table-cell whitespace-nowrap">{submission.meterNo}</TableCell>
                        <TableCell className="text-sm text-gray-600 hidden lg:table-cell whitespace-nowrap">{submission.phone}</TableCell>
                        <TableCell className="text-sm text-gray-600 hidden lg:table-cell max-w-[200px] truncate" title={submission.address}>{submission.address}</TableCell>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">{submission.submission}</TableCell>
                        <TableCell className="text-sm text-gray-600 hidden md:table-cell max-w-[120px] truncate" title={submission.createdBy}>{submission.createdBy}</TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
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
  );
}
