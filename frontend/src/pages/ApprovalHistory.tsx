import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useMemo } from 'react';
import { api } from '../services/api';
import { useApiQuery, useAdminId } from '../hooks/useApiQuery';
import { mapApprovalRequestToDisplay, type DisplayApprovalRequest } from '../utils/dataMappers';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { ApprovalRequest } from '../types';

export function ApprovalHistory() {
  const adminId = useAdminId();

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
      return {
        ...mapped,
        reviewedBy: reviewer?.fullName || mapped.reviewedBy,
        reviewedDate: mapped.reviewedDate || '',
        decision: request.approvalStatus?.name || 'Unknown',
      };
    });
  }, [reviewedRequests, admins]);

  // Calculate stats
  const totalReviewed = displayRequests.length;
  const approved = displayRequests.filter(item => item.decision === 'Approved').length;
  const rejected = displayRequests.filter(item => item.decision === 'Rejected').length;

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
              {displayRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No approval history found
                  </TableCell>
                </TableRow>
              ) : (
                displayRequests.map((item) => (
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
