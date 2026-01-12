import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useMemo, useState } from 'react';
import { api } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { mapApprovalRequestToDisplay } from '../utils/dataMappers';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Input } from '../components/ui/input';
import { Dropdown } from '../components/ui/Dropdown';
import { Button } from '../components/ui/button';
import { Search, X } from 'lucide-react';

export function ApprovalHistory() {
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [decisionFilter, setDecisionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch all approval requests
  const { data: approvalRequests = [], isLoading } = useApiQuery(
    ['approval-requests', 'all'],
    () => api.approvalRequests.getAll()
  );

  // Fetch all admins to map requestedBy IDs to names
  const { data: admins = [] } = useApiQuery(
    ['admins'],
    () => api.admins.getAll()
  );

  // Filter to show only reviewed requests (not pending)
  const reviewedRequests = useMemo(() => {
    return approvalRequests.filter((request) => {
      // Check if request has been reviewed (has reviewedBy and reviewedAt)
      return request.reviewedBy !== null && request.reviewedBy !== undefined && 
             request.reviewedAt !== null && request.reviewedAt !== undefined;
    });
  }, [approvalRequests]);

  // Map approval requests to display format
  const displayRequests = useMemo(() => {
    return reviewedRequests.map((request) => {
      const requester = admins.find((a) => a.id === request.requestedBy);
      const reviewer = request.reviewer ? admins.find((a) => a.id === request.reviewedBy) : null;
      const mapped = mapApprovalRequestToDisplay(request, requester?.fullName);
      // Backend uses statusName, frontend type might have name - check both
      const decision = (request.approvalStatus as any)?.statusName || 
                      request.approvalStatus?.name || 
                      'Unknown';
      return {
        ...mapped,
        reviewedBy: reviewer?.fullName || mapped.reviewedBy,
        review: mapped.review || '',
        reviewedAt: request.reviewedAt ? new Date(request.reviewedAt).getTime() : 0,
        decision,
        module: mapped.module || request.moduleName || 'Unknown',
      };
    }).sort((a, b) => {
      // Sort by review date descending (newest first)
      return b.reviewedAt - a.reviewedAt;
    });
  }, [reviewedRequests, admins]);

  // Get unique modules for filter
  const uniqueModules = useMemo(() => {
    const modules = new Set(displayRequests.map(r => r.module));
    return Array.from(modules).sort();
  }, [displayRequests]);

  // Check if any filters are active
  const hasActiveFilters = moduleFilter !== 'all' || decisionFilter !== 'all' || searchQuery.trim() !== '';

  // Clear all filters
  const clearFilters = () => {
    setModuleFilter('all');
    setDecisionFilter('all');
    setSearchQuery('');
  };

  // Apply filters
  const filteredRequests = useMemo(() => {
    return displayRequests.filter((item) => {
      // Module filter
      if (moduleFilter !== 'all' && item.module !== moduleFilter) {
        return false;
      }

      // Decision filter
      if (decisionFilter !== 'all' && item.decision !== decisionFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          item.module?.toLowerCase().includes(query) ||
          item.requestedBy?.toLowerCase().includes(query) ||
          item.request?.toLowerCase().includes(query) ||
          item.review?.toLowerCase().includes(query);
        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
  }, [displayRequests, moduleFilter, decisionFilter, searchQuery]);

  // Calculate stats based on filtered results
  const totalReviewed = filteredRequests.length;
  const approved = filteredRequests.filter(item => item.decision === 'Approved').length;
  const rejected = filteredRequests.filter(item => item.decision === 'Rejected').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

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

        {/* Filters */}
        <div className="mb-6 flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search by module, requester, request..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
            />
          </div>

          {/* Module Filter */}
          <div className="w-48">
            <Dropdown
              options={[
                { value: 'all', label: 'All Modules' },
                ...uniqueModules.map(module => ({ value: module, label: module }))
              ]}
              value={moduleFilter}
              onChange={setModuleFilter}
              placeholder="Filter by Module"
              className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
            />
          </div>

          {/* Decision Filter */}
          <div className="w-48">
            <Dropdown
              options={[
                { value: 'all', label: 'All Decisions' },
                { value: 'Approved', label: 'Approved' },
                { value: 'Rejected', label: 'Rejected' }
              ]}
              value={decisionFilter}
              onChange={setDecisionFilter}
              placeholder="Filter by Decision"
              className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
            />
          </div>

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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Module</TableHead>
                <TableHead className="font-semibold text-gray-700">Requested By</TableHead>
                <TableHead className="font-semibold text-gray-700">Request</TableHead>
                <TableHead className="font-semibold text-gray-700">My Decision</TableHead>
                <TableHead className="font-semibold text-gray-700">Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No approval history found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((item) => (
                  <TableRow key={item.id} className="border-gray-100">
                    <TableCell className="font-medium text-gray-900">{item.module}</TableCell>
                    <TableCell className="text-gray-600">{item.requestedBy}</TableCell>
                    <TableCell className="text-gray-600">{item.request}</TableCell>
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
                    <TableCell className="text-gray-600">{item.review}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
