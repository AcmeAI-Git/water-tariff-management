import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Eye } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ReviewChangeModal } from './ReviewChangeModal';
import { api } from '../services/api';
import { useApiQuery, useApiMutation, useAdminId } from '../hooks/useApiQuery';
import { mapApprovalRequestToDisplay, type DisplayApprovalRequest } from '../utils/dataMappers';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function ApprovalQueue() {
  const [selectedRequest, setSelectedRequest] = useState<DisplayApprovalRequest | null>(null);
  const adminId = useAdminId();

  // Fetch pending approval requests
  const { data: approvalRequests = [], isLoading } = useApiQuery(
    ['approval-requests', 'pending'],
    () => api.approvalRequests.getPending()
  );

  // Fetch all admins to map requestedBy IDs to names
  const { data: admins = [] } = useApiQuery(
    ['admins'],
    () => api.admins.getAll()
  );

  // Map approval requests to display format
  const displayRequests = useMemo(() => {
    return approvalRequests.map((request) => {
      const requester = admins.find((a) => a.id === request.requestedBy);
      return mapApprovalRequestToDisplay(request, requester?.fullName);
    });
  }, [approvalRequests, admins]);

  // Review mutation
  const reviewMutation = useApiMutation(
    ({ id, status, comments }: { id: number; status: 'Approved' | 'Rejected'; comments?: string }) => {
      if (!adminId) throw new Error('Admin ID not found');
      return api.approvalRequests.review(id, {
        reviewedBy: adminId,
        status,
        comments,
      });
    },
    {
      successMessage: 'Approval request reviewed successfully',
      errorMessage: 'Failed to review approval request',
      invalidateQueries: [['approval-requests']],
    }
  );

  const handleReview = (request: DisplayApprovalRequest) => {
    setSelectedRequest(request);
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
  };

  const handleApprove = async (requestId: string, comments: string) => {
    // Extract numeric ID from "REQ-001" format
    const numericId = parseInt(requestId.replace('REQ-', ''));
    await reviewMutation.mutateAsync({
      id: numericId,
      status: 'Approved',
      comments: comments || undefined,
    });
    setSelectedRequest(null);
  };

  const handleReject = async (requestId: string, comments: string) => {
    // Extract numeric ID from "REQ-001" format
    const numericId = parseInt(requestId.replace('REQ-', ''));
    await reviewMutation.mutateAsync({
      id: numericId,
      status: 'Rejected',
      comments: comments || undefined,
    });
    setSelectedRequest(null);
  };

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
              <h1 className="text-[28px] font-semibold text-gray-900 mb-1">Approval Queue</h1>
              <p className="text-sm text-gray-500">All pending changes from other admins</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold text-gray-900">{displayRequests.length}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Pending:</span>
                <span className="font-semibold text-yellow-600">{displayRequests.length}</span>
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
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No pending approval requests
                  </TableCell>
                </TableRow>
              ) : (
                displayRequests.map((request) => (
                  <TableRow key={request.id} className="border-gray-100">
                    <TableCell className="font-medium text-gray-900">{request.module}</TableCell>
                    <TableCell className="text-gray-600">{request.requestedBy}</TableCell>
                    <TableCell className="text-gray-600">{request.requestDate}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50"
                      >
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleReview(request)}
                        className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-9 px-4 flex items-center gap-2 ml-auto"
                        disabled={reviewMutation.isPending}
                      >
                        <Eye size={16} />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <ReviewChangeModal
          request={selectedRequest}
          onClose={handleCloseModal}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
