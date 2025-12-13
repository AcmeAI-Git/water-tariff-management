import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Eye } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ReviewChangeModal } from './ReviewChangeModal';
import { api } from '../services/api';
import { useApiQuery, useApiMutation, useAdminId } from '../hooks/useApiQuery';
import { mapApprovalRequestToDisplay } from '../utils/dataMappers';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { User, Consumption } from '../types';
import { useQueryClient } from '@tanstack/react-query';

// Unified display item type for approval queue
interface ApprovalQueueItem {
  id: string;
  module: string;
  requestedBy: string;
  requestDate: string;
  status: string;
  recordId: number;
  recordType: 'approval-request' | 'household' | 'consumption';
  oldData?: unknown;
  newData?: unknown;
}

export function ApprovalQueue() {
  const [selectedRequest, setSelectedRequest] = useState<ApprovalQueueItem | null>(null);
  const adminId = useAdminId();
  const queryClient = useQueryClient();

  // Fetch pending approval requests
  const { data: approvalRequests = [], isLoading: approvalRequestsLoading } = useApiQuery(
    ['approval-requests', 'pending'],
    () => api.approvalRequests.getPending()
  );

  // Fetch pending households (users with status='pending')
  const { data: pendingHouseholds = [], isLoading: householdsLoading } = useApiQuery(
    ['users', 'pending'],
    () => api.users.getAll('pending')
  );

  // Fetch all consumptions and filter for pending ones
  const { data: allConsumptions = [], isLoading: consumptionsLoading } = useApiQuery(
    ['consumption'],
    () => api.consumption.getAll()
  );

  // Fetch all admins to map requestedBy IDs to names
  const { data: admins = [] } = useApiQuery(
    ['admins'],
    () => api.admins.getAll()
  );

  // Filter pending consumptions
  const pendingConsumptions = useMemo(() => {
    return allConsumptions.filter((c: Consumption) => c.status?.toLowerCase() === 'pending');
  }, [allConsumptions]);

  // Combine all pending items into unified display format
  const displayRequests = useMemo(() => {
    const items: ApprovalQueueItem[] = [];

    // Add approval requests - filter to ensure only pending items are shown
    approvalRequests.forEach((request) => {
      // Safety check: only include items that are actually pending
      const statusName = (request.approvalStatus as any)?.statusName || request.approvalStatus?.name;
      if (statusName && statusName.toLowerCase() !== 'pending') {
        return; // Skip non-pending items
      }
      
      const requester = admins.find((a) => a.id === request.requestedBy);
      const mapped = mapApprovalRequestToDisplay(request, requester?.fullName);
      items.push({
        ...mapped,
        recordId: request.recordId,
        recordType: 'approval-request',
      });
    });

    // Add pending households (that don't have approval requests)
    pendingHouseholds.forEach((household: User) => {
      // Check if this household already has an approval request
      const hasApprovalRequest = approvalRequests.some(
        (req) => req.moduleName === 'Customer' && req.recordId === household.id
      );
      
      if (!hasApprovalRequest) {
        // Try to find who created it (if we had createdBy field, but we don't)
        // For now, we'll show it as "Unknown" or we could skip it
        items.push({
          id: `HOUSEHOLD-${household.id}`,
          module: 'Customer',
          requestedBy: 'Unknown', // Could be improved if we add createdBy to User entity
          requestDate: household.createdAt 
            ? new Date(household.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'N/A',
          status: 'Pending',
          recordId: household.id,
          recordType: 'household',
          oldData: null,
          newData: {
            fullName: household.fullName,
            meterNo: household.meterNo,
            phone: household.phone,
            email: household.email,
            address: household.address,
            hourseType: household.hourseType,
            installDate: household.installDate,
            zoneId: household.zoneId,
            wardId: household.wardId,
          },
        });
      }
    });

    // Add pending consumptions (that don't have approval requests)
    pendingConsumptions.forEach((consumption: Consumption) => {
      // Check if this consumption already has an approval request
      const hasApprovalRequest = approvalRequests.some(
        (req) => req.moduleName === 'Consumption' && req.recordId === consumption.id
      );
      
      if (!hasApprovalRequest) {
        const creator = admins.find((a) => a.id === consumption.createdBy);
        items.push({
          id: `CONSUMPTION-${consumption.id}`,
          module: 'Consumption',
          requestedBy: creator?.fullName || `Admin #${consumption.createdBy}`,
          requestDate: consumption.createdAt
            ? new Date(consumption.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'N/A',
          status: 'Pending',
          recordId: consumption.id,
          recordType: 'consumption',
          oldData: null,
          newData: {
            userId: consumption.userId,
            billMonth: consumption.billMonth,
            currentReading: consumption.currentReading,
            previousReading: consumption.previousReading,
            consumption: consumption.consumption,
          },
        });
      }
    });

    // Sort by request date (newest first)
    return items.sort((a, b) => {
      const dateA = new Date(a.requestDate).getTime();
      const dateB = new Date(b.requestDate).getTime();
      return dateB - dateA;
    });
  }, [approvalRequests, pendingHouseholds, pendingConsumptions, admins]);

  const isLoading = approvalRequestsLoading || householdsLoading || consumptionsLoading;

  // Review approval request mutation
  const reviewApprovalRequestMutation = useApiMutation(
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
      invalidateQueries: [
        ['approval-requests', 'pending'],
        ['approval-requests'],
        ['users', 'pending'],
        ['users'],
        ['consumption'],
      ],
    }
  );

  // Activate household mutation
  const activateHouseholdMutation = useApiMutation(
    (id: number) => api.users.activate(id),
    {
      successMessage: 'Household activated successfully',
      errorMessage: 'Failed to activate household',
      invalidateQueries: [
        ['users', 'pending'],
        ['users'],
        ['approval-requests', 'pending'],
        ['approval-requests'],
      ],
    }
  );

  // Delete household mutation (for rejection)
  const deleteHouseholdMutation = useApiMutation(
    (id: number) => api.users.delete(id),
    {
      successMessage: 'Household rejected and removed successfully',
      errorMessage: 'Failed to reject household',
      invalidateQueries: [
        ['users', 'pending'],
        ['users'],
        ['approval-requests', 'pending'],
        ['approval-requests'],
      ],
    }
  );

  // Approve consumption mutation
  const approveConsumptionMutation = useApiMutation(
    ({ id, comments }: { id: number; comments?: string }) => {
      if (!adminId) throw new Error('Admin ID not found');
      return api.consumption.approve(id, {
        approvedBy: adminId,
        comments,
      });
    },
    {
      successMessage: 'Consumption approved successfully',
      errorMessage: 'Failed to approve consumption',
      invalidateQueries: [
        ['consumption'],
        ['approval-requests', 'pending'],
        ['approval-requests'],
      ],
    }
  );

  // Reject consumption mutation
  const rejectConsumptionMutation = useApiMutation(
    ({ id, comments }: { id: number; comments?: string }) => {
      if (!adminId) throw new Error('Admin ID not found');
      return api.consumption.reject(id, {
        approvedBy: adminId,
        comments,
      });
    },
    {
      successMessage: 'Consumption rejected successfully',
      errorMessage: 'Failed to reject consumption',
      invalidateQueries: [
        ['consumption'],
        ['approval-requests', 'pending'],
        ['approval-requests'],
      ],
    }
  );

  const handleReview = (request: ApprovalQueueItem) => {
    setSelectedRequest(request);
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
  };

  const handleApprove = async (request: ApprovalQueueItem, comments: string) => {
    if (!adminId) {
      console.error('Admin ID not found');
      return;
    }

    try {
      if (request.recordType === 'approval-request') {
        // Extract numeric ID from "REQ-001" format
        const numericId = parseInt(request.id.replace('REQ-', ''));
        await reviewApprovalRequestMutation.mutateAsync({
          id: numericId,
          status: 'Approved',
          comments: comments || undefined,
        });
      } else if (request.recordType === 'household') {
        // Activate household
        await activateHouseholdMutation.mutateAsync(request.recordId);
        // Also create/update approval request if it exists
        const approvalRequest = approvalRequests.find(
          (req) => req.moduleName === 'Customer' && req.recordId === request.recordId
        );
        if (approvalRequest) {
          await reviewApprovalRequestMutation.mutateAsync({
            id: approvalRequest.id,
            status: 'Approved',
            comments: comments || undefined,
          });
        }
      } else if (request.recordType === 'consumption') {
        // Approve consumption
        await approveConsumptionMutation.mutateAsync({
          id: request.recordId,
          comments: comments || undefined,
        });
        // Also create/update approval request if it exists
        const approvalRequest = approvalRequests.find(
          (req) => req.moduleName === 'Consumption' && req.recordId === request.recordId
        );
        if (approvalRequest) {
          await reviewApprovalRequestMutation.mutateAsync({
            id: approvalRequest.id,
            status: 'Approved',
            comments: comments || undefined,
          });
        }
      }
      
      // Explicitly refetch pending approval requests to ensure UI updates
      await queryClient.refetchQueries({ queryKey: ['approval-requests', 'pending'] });
      await queryClient.refetchQueries({ queryKey: ['users', 'pending'] });
      await queryClient.refetchQueries({ queryKey: ['consumption'] });
      
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async (request: ApprovalQueueItem, comments: string) => {
    if (!adminId) {
      console.error('Admin ID not found');
      return;
    }

    try {
      if (request.recordType === 'approval-request') {
        // Extract numeric ID from "REQ-001" format
        const numericId = parseInt(request.id.replace('REQ-', ''));
        await reviewApprovalRequestMutation.mutateAsync({
          id: numericId,
          status: 'Rejected',
          comments: comments || undefined,
        });
      } else if (request.recordType === 'household') {
        // When rejecting a household, we should:
        // 1. Update the approval request status to Rejected (if it exists)
        // 2. Delete the household since it was never activated
        const approvalRequest = approvalRequests.find(
          (req) => req.moduleName === 'Customer' && req.recordId === request.recordId
        );
        
        // Update approval request first (if it exists)
        if (approvalRequest) {
          await reviewApprovalRequestMutation.mutateAsync({
            id: approvalRequest.id,
            status: 'Rejected',
            comments: comments || undefined,
          });
        }
        
        // Delete the household since it was rejected
        await deleteHouseholdMutation.mutateAsync(request.recordId);
      } else if (request.recordType === 'consumption') {
        // Reject consumption
        await rejectConsumptionMutation.mutateAsync({
          id: request.recordId,
          comments: comments || undefined,
        });
        // Also create/update approval request if it exists
        const approvalRequest = approvalRequests.find(
          (req) => req.moduleName === 'Consumption' && req.recordId === request.recordId
        );
        if (approvalRequest) {
          await reviewApprovalRequestMutation.mutateAsync({
            id: approvalRequest.id,
            status: 'Rejected',
            comments: comments || undefined,
          });
        }
      }
      
      // Explicitly refetch pending approval requests to ensure UI updates
      await queryClient.refetchQueries({ queryKey: ['approval-requests', 'pending'] });
      await queryClient.refetchQueries({ queryKey: ['users', 'pending'] });
      await queryClient.refetchQueries({ queryKey: ['consumption'] });
      
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to reject:', error);
    }
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
                        disabled={
                          reviewApprovalRequestMutation.isPending ||
                          activateHouseholdMutation.isPending ||
                          deleteHouseholdMutation.isPending ||
                          approveConsumptionMutation.isPending ||
                          rejectConsumptionMutation.isPending
                        }
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
          request={{
            id: selectedRequest.id,
            module: selectedRequest.module,
            requestedBy: selectedRequest.requestedBy,
            requestDate: selectedRequest.requestDate,
            oldData: selectedRequest.oldData,
            newData: selectedRequest.newData,
          }}
          onClose={handleCloseModal}
          onApprove={(_requestId, comments) => handleApprove(selectedRequest, comments)}
          onReject={(_requestId, comments) => handleReject(selectedRequest, comments)}
        />
      )}
    </div>
  );
}
