import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useMemo } from 'react';
import { api } from '../services/api';
import { useApiQuery, useAdminId } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { mapUserToHousehold } from '../utils/dataMappers';
import type { ApprovalStatus } from '../types';

export function CustomerAdminSubmissionHistory() {
  const adminId = useAdminId();

  // Fetch approval requests for Customer module
  // Only fetch if adminId is available
  const { data: customerApprovalRequests = [], isLoading: approvalRequestsLoading } = useApiQuery(
    ['approval-requests', 'Customer', adminId ?? 'no-admin'],
    () => api.approvalRequests.getAll({ moduleName: 'Customer' }),
    {
      enabled: adminId !== null,
    }
  );

  // Filter approval requests requested by current admin
  const approvalRequests = useMemo(() => {
    if (!adminId) return [];
    return customerApprovalRequests.filter(req => req.requestedBy === adminId);
  }, [customerApprovalRequests, adminId]);

  // Fetch all users to get household details
  const { data: users = [], isLoading: usersLoading } = useApiQuery(
    ['users'],
    () => api.users.getAll()
  );

  // Map approval requests to submission history format
  const submissionHistory = useMemo(() => {
    return approvalRequests.map((request) => {
      const user = users.find((u) => u.id === request.recordId);
      const household = user ? mapUserToHousehold(user) : null;
      
      // Get status from approval request - properly typed
      const approvalStatus = request.approvalStatus as ApprovalStatus | undefined;
      const statusName = approvalStatus?.statusName || approvalStatus?.name || 'Pending';
      const status = statusName === 'Pending' ? 'Pending' : 
                     statusName === 'Approved' ? 'Approved' : 
                     statusName === 'Rejected' ? 'Rejected' : 'Pending';
      
      return {
        id: request.id,
        requestId: `REQ-${String(request.id).padStart(3, '0')}`,
        fullName: household?.fullName || user?.fullName || 'Unknown',
        meterNo: household?.meterNo || user?.meterNo || 'N/A',
        phone: household?.phone || user?.phone || 'N/A',
        address: household?.address || user?.address || 'N/A',
        submissionDate: request.requestedAt
          ? new Date(request.requestedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : 'N/A',
        reviewedDate: request.reviewedAt
          ? new Date(request.reviewedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : null,
        status,
        comments: request.comments || null,
        reviewer: request.reviewer?.fullName || null,
      };
    }).sort((a, b) => {
      // Sort by submission date (newest first)
      const dateA = new Date(a.submissionDate).getTime();
      const dateB = new Date(b.submissionDate).getTime();
      return dateB - dateA;
    });
  }, [approvalRequests, users]);

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

  if (approvalRequestsLoading || usersLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const approvedCount = submissionHistory.filter(s => s.status === 'Approved').length;
  const pendingCount = submissionHistory.filter(s => s.status === 'Pending').length;
  const rejectedCount = submissionHistory.filter(s => s.status === 'Rejected').length;
  const totalCount = submissionHistory.length;

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-8 py-6">
        {/* Header with inline stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-semibold text-gray-900 mb-1">Submission History</h1>
              <p className="text-sm text-gray-500">View history of all your household submissions</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold text-gray-900">{totalCount}</span>
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

        {/* Submission History Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 bg-gray-50">
                <TableHead className="text-sm font-semibold text-gray-700">Request ID</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Full Name</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Meter No</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Phone</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Address</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Submission Date</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Status</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Reviewed Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissionHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                    No submission history found. Submit households from the Household Management page.
                  </TableCell>
                </TableRow>
              ) : (
                submissionHistory.map((submission) => (
                  <TableRow key={submission.id} className="border-gray-100">
                    <TableCell className="text-sm text-gray-600 font-mono">{submission.requestId}</TableCell>
                    <TableCell className="text-sm text-gray-900 font-medium">{submission.fullName}</TableCell>
                    <TableCell className="text-sm text-gray-600 font-mono">{submission.meterNo}</TableCell>
                    <TableCell className="text-sm text-gray-600">{submission.phone}</TableCell>
                    <TableCell className="text-sm text-gray-600">{submission.address}</TableCell>
                    <TableCell className="text-sm text-gray-600">{submission.submissionDate}</TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {submission.reviewedDate || '-'}
                    </TableCell>
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
