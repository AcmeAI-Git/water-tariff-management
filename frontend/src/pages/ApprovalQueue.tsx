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
import type { User, Consumption, ApprovalStatus } from '../types';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Unified display item type for approval queue
interface ApprovalQueueItem {
  id: string;
  module: string;
  requestedBy: string;
  request: string;
  status: string;
  recordId: number;
  recordType: 'approval-request' | 'household' | 'consumption';
  oldData?: unknown;
  newData?: unknown;
}

export function ApprovalQueue() {
  const [selectedRequest, setSelectedRequest] = useState<ApprovalQueueItem | null>(null);
  const [isLoadingRecordData, setIsLoadingRecordData] = useState(false);
  const adminId = useAdminId();
  const queryClient = useQueryClient();

  // Fetch pending approval requests
  const { data: approvalRequests = [], isLoading: approvalRequestsLoading } = useApiQuery(
    ['approval-requests', 'pending'],
    () => api.approvalRequests.getPending()
  );

  // Fetch all Customer approval requests to find requesters for households
  const { data: allCustomerApprovalRequests = [] } = useApiQuery(
    ['approval-requests', 'Customer'],
    () => api.approvalRequests.getAll({ moduleName: 'Customer' })
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
      // Backend uses statusName, frontend type supports both for compatibility
      const approvalStatus = request.approvalStatus as ApprovalStatus | undefined;
      const statusName = approvalStatus?.statusName || approvalStatus?.name;
      
      // Skip if status is not pending (case-insensitive)
      if (!statusName || statusName.toLowerCase() !== 'pending') {
        return;
      }
      
      // Skip if already reviewed (has reviewer or reviewed date)
      if (request.reviewedBy || request.reviewedAt) {
        return;
      }
      
      // Prioritize populated requester relation, fallback to admins array lookup
      const requesterName = request.requester?.fullName || admins.find((a) => a.id === request.requestedBy)?.fullName;
      const mapped = mapApprovalRequestToDisplay(request, requesterName);
      items.push({
        ...mapped,
        recordId: request.recordId,
        recordType: 'approval-request',
      });
    });

    // Add pending households (that don't have approval requests)
    pendingHouseholds.forEach((household: User) => {
      // Safety check: Skip if household doesn't have an ID (shouldn't happen, but safety)
      if (!household.id) {
        return;
      }
      
      // Check if this household already has a pending approval request
      const hasPendingApprovalRequest = approvalRequests.some(
        (req) => req.moduleName === 'Customer' && req.recordId === household.id
      );
      
      if (!hasPendingApprovalRequest) {
        // IMPORTANT: Use UNFILTERED list to check if household should be excluded
        // This catches rejected requests that are filtered out from filteredCustomerApprovalRequests
        const relatedApprovalRequest = allCustomerApprovalRequests.find(
          (req) => req.recordId === household.id
        );
        
        // Skip if related request is rejected or already reviewed
        if (relatedApprovalRequest) {
          const reqStatus = relatedApprovalRequest.approvalStatus as ApprovalStatus | undefined;
          const reqStatusName = reqStatus?.statusName || reqStatus?.name;
          if (reqStatusName?.toLowerCase() === 'rejected' || relatedApprovalRequest.reviewedBy || relatedApprovalRequest.reviewedAt) {
            return; // Skip rejected/reviewed households
          }
        }
        
        // Get requester name from approval request or fallback to admin lookup
        let requesterName = 'Unknown';
        if (relatedApprovalRequest) {
          requesterName = relatedApprovalRequest.requester?.fullName || 
                         admins.find((a) => a.id === relatedApprovalRequest.requestedBy)?.fullName || 
                         `Admin #${relatedApprovalRequest.requestedBy}`;
        }
        
        items.push({
          id: `HOUSEHOLD-${household.id}`,
          module: 'Customer',
          requestedBy: requesterName,
          request: household.createdAt 
            ? new Date(household.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
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
          request: consumption.createdAt
            ? new Date(consumption.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
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
      const dateA = new Date(a.request).getTime();
      const dateB = new Date(b.request).getTime();
      return dateB - dateA;
    });
  }, [approvalRequests, allCustomerApprovalRequests, pendingHouseholds, pendingConsumptions, admins]);

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
        ['approval-requests', 'Customer'],
        ['approval-requests'],
        ['users', 'pending'],
        ['users', 'active'],
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
        ['users', 'active'],
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
      // Remove errorMessage - we handle errors manually in catch block with custom logic
      invalidateQueries: [
        ['consumption'],
        ['approval-requests', 'pending'],
        ['approval-requests'],
      ],
    }
  );

  const handleReview = async (request: ApprovalQueueItem) => {
    // If oldData/newData are missing (null/undefined), fetch the actual record data
    if ((!request.oldData && !request.newData) || request.newData === null || request.newData === undefined) {
      setIsLoadingRecordData(true);
      try {
        let newData: unknown = null;
        
        if (request.module === 'Customer' || request.recordType === 'household') {
          // Fetch household/user data
          const household = await api.users.getById(request.recordId);
          newData = {
            fullName: household.fullName,
            meterNo: household.meterNo,
            phone: household.phone,
            email: household.email,
            address: household.address,
            hourseType: household.hourseType,
            installDate: household.installDate,
            zoneId: household.zoneId,
            wardId: household.wardId,
          };
        } else if (request.module === 'Consumption' || request.recordType === 'consumption') {
          // Fetch consumption data
          const consumption = await api.consumption.getById(request.recordId);
          newData = {
            userId: consumption.userId,
            billMonth: consumption.billMonth,
            currentReading: consumption.currentReading,
            previousReading: consumption.previousReading,
            consumption: consumption.consumption,
          };
        } else if (request.module === 'ZoneScoring') {
          // Fetch zone scoring ruleset data
          const ruleset = await api.zoneScoring.getById(request.recordId);
          newData = {
            title: ruleset.title,
            description: ruleset.description || '',
            status: ruleset.status,
            effectiveFrom: ruleset.effectiveFrom || '',
            createdAt: ruleset.createdAt,
            updatedAt: ruleset.updatedAt,
            scoringParams: ruleset.scoringParams?.map((param: any) => ({
              areaId: param.areaId,
              areaName: param.area?.name || `Area ${param.areaId}`,
              landHomeRate: param.landHomeRate,
              landHomeRatePercentage: param.landHomeRatePercentage,
              landRate: param.landRate,
              landRatePercentage: param.landRatePercentage,
              landTaxRate: param.landTaxRate,
              landTaxRatePercentage: param.landTaxRatePercentage,
              buildingTaxRateUpto120sqm: param.buildingTaxRateUpto120sqm,
              buildingTaxRateUpto120sqmPercentage: param.buildingTaxRateUpto120sqmPercentage,
              buildingTaxRateUpto200sqm: param.buildingTaxRateUpto200sqm,
              buildingTaxRateUpto200sqmPercentage: param.buildingTaxRateUpto200sqmPercentage,
              buildingTaxRateAbove200sqm: param.buildingTaxRateAbove200sqm,
              buildingTaxRateAbove200sqmPercentage: param.buildingTaxRateAbove200sqmPercentage,
              highIncomeGroupConnectionPercentage: param.highIncomeGroupConnectionPercentage,
              geoMean: param.geoMean,
            })) || [],
            totalParameters: ruleset.scoringParams?.length || 0,
          };
        }
        
        // Update request with fetched data
        setSelectedRequest({
          ...request,
          oldData: null,
          newData: newData,
        });
      } catch (error) {
        console.error('Failed to fetch record data:', error);
        toast.error('Failed to load record data');
        // Still show modal with existing data
        setSelectedRequest(request);
      } finally {
        setIsLoadingRecordData(false);
      }
    } else {
      // Data already available, just set the request
      setSelectedRequest(request);
    }
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
  };

  const handleApprove = async (request: ApprovalQueueItem) => {
    if (!adminId) {
      console.error('Admin ID not found');
      return;
    }

    try {
      if (request.recordType === 'approval-request') {
        // Extract numeric ID from "REQ-001" format
        const numericId = parseInt(request.id.replace('REQ-', ''));
        const approvalRequest = approvalRequests.find((req) => req.id === numericId);
        
        // Review the approval request
        await reviewApprovalRequestMutation.mutateAsync({
          id: numericId,
          status: 'Approved',
        });
        
        // If it's a Customer module request, also activate the household
        if ((request.module === 'Customer' || approvalRequest?.moduleName === 'Customer') && request.recordId) {
          await activateHouseholdMutation.mutateAsync(request.recordId);
        }
        
        // If it's a ZoneScoring module request, also update the ruleset status to approved
        if ((request.module === 'ZoneScoring' || approvalRequest?.moduleName === 'ZoneScoring') && request.recordId) {
          await api.zoneScoring.updateStatus(request.recordId, 'approved');
        }
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
          });
        }
      } else if (request.recordType === 'consumption') {
        // Approve consumption
        await approveConsumptionMutation.mutateAsync({
          id: request.recordId,
        });
        // Also create/update approval request if it exists
        const approvalRequest = approvalRequests.find(
          (req) => req.moduleName === 'Consumption' && req.recordId === request.recordId
        );
        if (approvalRequest) {
          await reviewApprovalRequestMutation.mutateAsync({
            id: approvalRequest.id,
            status: 'Approved',
          });
        }
      }
      
      // Invalidate and refetch all related queries to ensure UI updates immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['approval-requests', 'pending'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['approval-requests', 'Customer'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['approval-requests'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['users', 'pending'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['users', 'active'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['users'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['consumption'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['zone-scoring'], refetchType: 'active' }),
      ]);
      
      // Explicitly refetch to ensure data is fresh
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['approval-requests', 'pending'] }),
        queryClient.refetchQueries({ queryKey: ['approval-requests', 'Customer'] }),
        queryClient.refetchQueries({ queryKey: ['users', 'pending'] }),
        queryClient.refetchQueries({ queryKey: ['users', 'active'] }),
        queryClient.refetchQueries({ queryKey: ['consumption'] }),
        queryClient.refetchQueries({ queryKey: ['zone-scoring'] }),
      ]);
      
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async (request: ApprovalQueueItem) => {
    if (!adminId) {
      console.error('Admin ID not found');
      toast.error('Admin ID not found. Please refresh and try again.');
      return;
    }

    if (!request) {
      console.error('Request is null or undefined');
      toast.error('Invalid request. Please try again.');
      return;
    }

    // Capture request data to prevent stale closures
    const requestToReject = { ...request };
    const recordId = requestToReject.recordId;
    const recordType = requestToReject.recordType;

    try {
      // Execute mutations first (wait for completion)
      if (recordType === 'approval-request') {
        // Extract numeric ID from "REQ-001" format
        const numericId = parseInt(requestToReject.id.replace('REQ-', ''));
        await reviewApprovalRequestMutation.mutateAsync({
          id: numericId,
          status: 'Rejected',
        });
      } else if (recordType === 'household') {
        // When rejecting a household, we should:
        // 1. Update the approval request status to Rejected (if it exists and is pending)
        // 2. Delete the household since it was never activated
        const approvalRequest = approvalRequests.find(
          (req) => req.moduleName === 'Customer' && req.recordId === recordId
        );
        
        // Update approval request first (if it exists and is still pending)
        if (approvalRequest) {
          const reqStatus = approvalRequest.approvalStatus as ApprovalStatus | undefined;
          const reqStatusName = reqStatus?.statusName || reqStatus?.name;
          
          // Only reject if it's still pending
          if (reqStatusName?.toLowerCase() === 'pending' && !approvalRequest.reviewedBy) {
            await reviewApprovalRequestMutation.mutateAsync({
              id: approvalRequest.id,
              status: 'Rejected',
            });
          }
          // If already rejected, skip silently (no error)
        }
        
        // Delete the household since it was rejected
        await deleteHouseholdMutation.mutateAsync(recordId);
      } else if (recordType === 'consumption') {
        // Reject consumption
        await rejectConsumptionMutation.mutateAsync({
          id: recordId,
        });
        // Also create/update approval request if it exists
        const approvalRequest = approvalRequests.find(
          (req) => req.moduleName === 'Consumption' && req.recordId === recordId
        );
        if (approvalRequest) {
          await reviewApprovalRequestMutation.mutateAsync({
            id: approvalRequest.id,
            status: 'Rejected',
          });
        }
      }
      
      // Close modal after successful rejection
      setSelectedRequest(null);
      
      // Wait for backend to fully process (slightly longer delay to ensure transaction is committed)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force refetch of pending queries (mutation hook already invalidated)
      // Only refetch the critical queries needed to update the queue
      await Promise.all([
        queryClient.refetchQueries({ 
          queryKey: ['approval-requests', 'pending'],
          type: 'active'
        }),
        queryClient.refetchQueries({ 
          queryKey: ['approval-requests', 'Customer'],
          type: 'active'
        }),
        queryClient.refetchQueries({ 
          queryKey: ['users', 'pending'],
          type: 'active',
          exact: false  // Ensure all users queries are refetched
        }),
      ]);
    } catch (error) {
      console.error('Failed to reject:', error);
      
      // Check if error is due to already-rejected request
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isAlreadyRejected = errorMessage.includes('Only pending requests can be reviewed') ||
                                errorMessage.includes('already reviewed');
      
      if (!isAlreadyRejected) {
        // Only show error toast if it's not an "already rejected" error
        toast.error('Failed to reject request. Please try again.');
        // Keep modal open on error so user can try again
      } else {
        // If already rejected, close modal and refresh
        setSelectedRequest(null);
        await queryClient.invalidateQueries({ queryKey: ['approval-requests', 'pending'] });
        await queryClient.invalidateQueries({ queryKey: ['approval-requests', 'Customer'] });
        await queryClient.invalidateQueries({ queryKey: ['users', 'pending'] });
      }
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
                <TableHead className="font-semibold text-gray-700">Request</TableHead>
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
                    <TableCell className="text-gray-600">{request.request}</TableCell>
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
            request: selectedRequest.request,
            oldData: selectedRequest.oldData,
            newData: selectedRequest.newData,
          }}
          onClose={handleCloseModal}
          onApprove={() => {
            // Capture request before closing modal
            const requestToApprove = selectedRequest;
            handleApprove(requestToApprove);
          }}
          onReject={() => {
            // Capture request before closing modal to prevent stale closure
            const requestToReject = selectedRequest;
            handleReject(requestToReject);
          }}
          isLoading={isLoadingRecordData}
        />
      )}
    </div>
  );
}
