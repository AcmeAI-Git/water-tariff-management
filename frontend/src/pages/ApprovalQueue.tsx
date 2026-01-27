import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Eye } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ReviewChangeModal } from './ReviewChangeModal';
import { api } from '../services/api';
import { useApiQuery, useApiMutation, useAdminId } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { Consumption, ZoneScoringRuleSet, User, Area, Zone, Meter } from '../types';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mapUserToCustomer } from '../utils/dataMappers';

// Unified display item type for approval queue
interface ApprovalQueueItem {
  id: string;
  module: string;
  requestedBy: string;
  request: string;
  status: string;
  recordId: number;
  recordType: 'consumption' | 'zone-scoring' | 'customer';
  oldData?: unknown;
  newData?: unknown;
  account?: string; // UUID for customer records
  details?: string; // Context-specific description
  affectedEntity?: string; // Secondary info about what's affected
}

export function ApprovalQueue() {
  const [selectedRequest, setSelectedRequest] = useState<ApprovalQueueItem | null>(null);
  const [isLoadingRecordData, setIsLoadingRecordData] = useState(false);
  const adminId = useAdminId();
  const queryClient = useQueryClient();

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

  // Fetch ZoneScoring rulesets with pending status
  const { data: zoneScoringData = [] } = useApiQuery<ZoneScoringRuleSet[]>(
    ['zone-scoring'],
    () => api.zoneScoring.getAll()
  );
  const pendingZoneScoringRulesets = useMemo(() => {
    return (zoneScoringData as ZoneScoringRuleSet[]).filter(
      (ruleset) => ruleset.status?.toLowerCase() === 'pending'
    );
  }, [zoneScoringData]);

  // Fetch inactive customers (users with Inactive status)
  const { data: allUsers = [], isLoading: usersLoading } = useApiQuery<User[]>(
    ['users'],
    () => api.users.getAll()
  );

  // Fetch areas and zones to get zone information for customers
  const { data: allAreas = [] } = useApiQuery<Area[]>(
    ['areas'],
    () => api.area.getAll()
  );

  const { data: allZones = [] } = useApiQuery<Zone[]>(
    ['zones'],
    () => api.zones.getAll()
  );

  // Fetch all meters to match with users
  const { data: allMeters = [] } = useApiQuery<Meter[]>(
    ['meters'],
    () => api.meters.getAll()
  );

  const inactiveCustomers = useMemo(() => {
    return (allUsers as User[]).filter((user: User) => {
      const userData = user as any;
      const status = userData.activeStatus || userData.status || user.status;
      return status && String(status).toLowerCase() === 'inactive';
    });
  }, [allUsers]);

  // Filter pending consumptions
  const pendingConsumptions = useMemo(() => {
    return allConsumptions.filter((c: Consumption) => c.status?.toLowerCase() === 'pending');
  }, [allConsumptions]);

  // Combine all pending items into unified display format
  const displayRequests = useMemo(() => {
    const items: ApprovalQueueItem[] = [];

    // Add pending consumptions
    pendingConsumptions.forEach((consumption: Consumption) => {
      const creator = admins.find((a) => a.id === consumption.createdBy);
      // Find user/customer for this consumption
      const customer = (allUsers as User[]).find((u: User) => u.id === consumption.userId);
      const customerName = customer?.fullName || customer?.name || `Customer #${consumption.userId}`;
      
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
        details: `${consumption.billMonth} - ${customerName}`,
        affectedEntity: `${consumption.consumption || 0} m³`,
        oldData: null,
        newData: {
          userId: consumption.userId,
          billMonth: consumption.billMonth,
          currentReading: consumption.currentReading,
          previousReading: consumption.previousReading,
          consumption: consumption.consumption,
        },
      });
    });

    // Add pending ZoneScoring rulesets
    pendingZoneScoringRulesets.forEach((ruleset: ZoneScoringRuleSet) => {
      // ZoneScoringRuleSet doesn't have createdBy/requestedBy fields
      const areaCount = ruleset.scoringParams?.length || 0;
      
      items.push({
        id: `ZONE-SCORING-${ruleset.id}`,
        module: 'ZoneScoring',
        requestedBy: '-', // Not available for ZoneScoring
        request: ruleset.createdAt
          ? new Date(ruleset.createdAt).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : 'N/A',
        status: 'Pending',
        recordId: ruleset.id,
        recordType: 'zone-scoring',
        details: ruleset.title,
        affectedEntity: `${areaCount} area${areaCount !== 1 ? 's' : ''}`,
        oldData: null,
        newData: {
          title: ruleset.title,
          description: ruleset.description,
          parametersCount: ruleset.scoringParams?.length || 0,
          status: ruleset.status,
          scoringParams: ruleset.scoringParams || [],
        },
      });
    });

    // Add inactive customers
    inactiveCustomers.forEach((user: User) => {
      const userData = user as any;
      const customerAccount = userData.account || user.id;
      const customer = mapUserToCustomer(user);
      const creator = admins.find((a) => a.id === (userData.createdBy || userData.created_by));
      
      // Get zone information from area - check nested area.zone first, then lookup
      let zoneId = customer.zoneId;
      if (!zoneId && customer.areaId) {
        const area = (allAreas as Area[]).find((a) => a.id === customer.areaId);
        if (area) {
          // Check if area has nested zone object
          zoneId = (area as any).zone?.id || area.zoneId;
        }
      }
      
      // Get meter data from meters table by matching account UUID
      const userMeter = (allMeters as Meter[]).find((m: Meter) => {
        const meterAccount = (m as any).account || m.userAccount || (m as any).user_account;
        return meterAccount === customerAccount || meterAccount === String(customerAccount);
      });
      
      // Extract meter data from matched meter or fallback to customer data
      let meterNo = userMeter?.meterNo || customer.meterNo || '';
      let meterStatus = userMeter?.meterStatus || customer.meterStatus || '';
      let sizeOfDia = userMeter?.sizeOfDia || customer.sizeOfDia || '';
      let meterInstallationDate = userMeter?.meterInstallationDate || customer.meterInstallationDate || '';
      
      // Format meter number if it's a number
      const meterNoStr = meterNo 
        ? (typeof meterNo === 'number' ? meterNo.toString() : String(meterNo))
        : '';
      
      // Get createdAt from various possible locations
      // Note: The backend API for /users doesn't return createdAt/updatedAt fields
      // This is a backend limitation - zone scoring has timestamps, but users don't
      let createdAt = userData.createdAt || userData.created_at || (user as any).createdAt || (user as any).created_at;
      
      // If still not found, the backend doesn't provide this field for users
      // We'll show "N/A" as the backend API doesn't include timestamp fields for users
      // (Zone scoring has createdAt/updatedAt, but users endpoint doesn't return them)
      
      const customerName = customer.name || customer.fullName || 'Unknown Customer';
      const inspCodeStr = customer.inspCode ? `IC-${customer.inspCode}` : '-';
      
      items.push({
        id: `CUSTOMER-${customerAccount}`,
        module: 'Customer',
        requestedBy: creator?.fullName || 'Customer Admin',
        request: createdAt
          ? new Date(createdAt).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : 'N/A',
        status: 'Inactive',
        recordId: typeof customerAccount === 'string' ? 0 : customerAccount, // Use 0 for UUID, actual ID for number
        recordType: 'customer',
        account: typeof customerAccount === 'string' ? customerAccount : undefined,
        details: `${customerName} (${inspCodeStr})`,
        affectedEntity: customer.customerCategory || '-',
        oldData: null,
        newData: {
          name: customer.name || customer.fullName,
          address: customer.address,
          inspCode: customer.inspCode,
          accountType: customer.accountType,
          customerCategory: customer.customerCategory,
          waterStatus: customer.waterStatus,
          sewerStatus: customer.sewerStatus,
          areaId: customer.areaId,
          zoneId: zoneId || undefined,
          meterNo: meterNoStr,
          meterStatus: meterStatus || undefined,
          sizeOfDia: sizeOfDia || undefined,
          meterInstallationDate: meterInstallationDate || undefined,
        },
      });
    });

    // Sort by request date (newest first)
    return items.sort((a, b) => {
      const dateA = a.request === 'N/A' ? 0 : new Date(a.request).getTime();
      const dateB = b.request === 'N/A' ? 0 : new Date(b.request).getTime();
      return dateB - dateA;
    });
  }, [pendingConsumptions, pendingZoneScoringRulesets, inactiveCustomers, admins, allAreas, allZones, allMeters]);

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
      invalidateQueries: [
        ['consumption'],
      ],
    }
  );

  const isLoading = consumptionsLoading || usersLoading;

  const handleReview = async (request: ApprovalQueueItem) => {
    // Always fetch customer data to ensure we have complete meter information
    // For other modules, only fetch if data is missing
    const shouldFetch = (request.module === 'Customer' || request.recordType === 'customer') 
      ? true 
      : ((!request.oldData && !request.newData) || request.newData === null || request.newData === undefined);
    
    if (shouldFetch) {
      setIsLoadingRecordData(true);
      try {
        let newData: unknown = null;
        
        if (request.module === 'Consumption' || request.recordType === 'consumption') {
          // Fetch consumption data
          const consumption = await api.consumption.getById(request.recordId);
          newData = {
            userId: consumption.userId,
            billMonth: consumption.billMonth,
            currentReading: consumption.currentReading,
            previousReading: consumption.previousReading,
            consumption: consumption.consumption,
          };
        } else if (request.module === 'ZoneScoring' || request.recordType === 'zone-scoring') {
          // Fetch zone scoring ruleset data
          const ruleset = await api.zoneScoring.getById(request.recordId);
          newData = {
            title: ruleset.title,
            description: ruleset.description || '',
            status: ruleset.status,
            effectiveFrom: ruleset.effectiveFrom || '',
            createdAt: ruleset.createdAt,
            updatedAt: ruleset.updatedAt,
            scoringParams: ruleset.scoringParams?.map((param) => ({
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
        } else if (request.module === 'Customer' || request.recordType === 'customer') {
          // Fetch full customer data to ensure we have all fields including meter data
          if (request.account) {
            try {
              // Try to fetch user by account UUID (the backend supports this via /users/{account}/status, so might support GET too)
              // If that fails, fall back to using existing data
              const authToken = localStorage.getItem('authToken');
              const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://water-tariff-backend.onrender.com';
              const response = await fetch(`${baseUrl}/users/${request.account}`, {
                headers: {
                  'Authorization': `Bearer ${authToken || ''}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const userData = await response.json();
                const user = userData.data || userData;
                const customer = mapUserToCustomer(user);
                
                // Get zone from area
                let zoneId = customer.zoneId;
                if (!zoneId && customer.areaId) {
                  const area = (allAreas as Area[]).find((a) => a.id === customer.areaId);
                  if (area) {
                    zoneId = (area as any).zone?.id || area.zoneId;
                  }
                }
                
                // Get meter data from meters table by matching account UUID
                const userMeter = (allMeters as Meter[]).find((m: Meter) => {
                  const meterAccount = (m as any).account || m.userAccount || (m as any).user_account;
                  return meterAccount === request.account || meterAccount === String(request.account);
                });
                
                // Extract meter data from matched meter
                const meterNo = userMeter?.meterNo || '';
                const meterStatus = userMeter?.meterStatus || '';
                const sizeOfDia = userMeter?.sizeOfDia || '';
                const meterInstallationDate = userMeter?.meterInstallationDate || '';
                
                newData = {
                  name: customer.name || customer.fullName,
                  address: customer.address,
                  inspCode: customer.inspCode,
                  accountType: customer.accountType,
                  customerCategory: customer.customerCategory,
                  waterStatus: customer.waterStatus,
                  sewerStatus: customer.sewerStatus,
                  areaId: customer.areaId,
                  zoneId: zoneId || undefined,
                  // Include meter fields if they have values
                  ...(meterNo && { meterNo: typeof meterNo === 'number' ? meterNo.toString() : String(meterNo) }),
                  ...(meterStatus && { meterStatus }),
                  ...(sizeOfDia && { sizeOfDia }),
                  ...(meterInstallationDate && { meterInstallationDate }),
                };
              } else {
                // If fetch fails, use existing data but enhance it
                throw new Error('Failed to fetch user');
              }
            } catch (error) {
              console.error('Failed to fetch customer details, using existing data:', error);
              // Fallback to existing newData but try to enhance it with meter lookup
              const existingData: Record<string, any> = (request.newData as Record<string, any>) || {};
              
              // If zoneId is missing, try to get it from area
              if (!existingData.zoneId && existingData.areaId) {
                const area = (allAreas as Area[]).find((a) => a.id === existingData.areaId);
                if (area) {
                  existingData.zoneId = (area as any).zone?.id || area.zoneId;
                }
              }
              
              // Try to get meter data from meters table
              if (request.account) {
                const userMeter = (allMeters as Meter[]).find((m: Meter) => {
                  const meterAccount = (m as any).account || m.userAccount || (m as any).user_account;
                  return meterAccount === request.account || meterAccount === String(request.account);
                });
                
                if (userMeter) {
                  if (!existingData.meterNo && userMeter.meterNo) {
                    existingData.meterNo = typeof userMeter.meterNo === 'number' ? userMeter.meterNo.toString() : String(userMeter.meterNo);
                  }
                  if (!existingData.meterStatus && userMeter.meterStatus) {
                    existingData.meterStatus = userMeter.meterStatus;
                  }
                  if (!existingData.sizeOfDia && userMeter.sizeOfDia) {
                    existingData.sizeOfDia = userMeter.sizeOfDia;
                  }
                  if (!existingData.meterInstallationDate && userMeter.meterInstallationDate) {
                    existingData.meterInstallationDate = userMeter.meterInstallationDate;
                  }
                }
              }
              
              newData = existingData;
            }
          } else {
            // Use existing newData but enhance it
            const existingData: Record<string, any> = (request.newData as Record<string, any>) || {};
            
            // If zoneId is missing, try to get it from area
            if (!existingData.zoneId && existingData.areaId) {
              const area = (allAreas as Area[]).find((a) => a.id === existingData.areaId);
              if (area) {
                existingData.zoneId = (area as any).zone?.id || area.zoneId;
              }
            }
            
            newData = existingData;
          }
        }
        
        // Update request with fetched data, preserving the original request timestamp
        setSelectedRequest({
          ...request,
          oldData: null,
          newData: newData,
          // Preserve the original request timestamp
          request: request.request,
        });
      } catch (error) {
        console.error('Failed to fetch record data:', error);
        toast.error('Failed to load record data');
        // Still show modal with existing data, preserving timestamp
        setSelectedRequest({
          ...request,
          request: request.request, // Preserve timestamp
        });
      } finally {
        setIsLoadingRecordData(false);
      }
    } else {
      // Data already available, just set the request with preserved timestamp
      setSelectedRequest({
        ...request,
        request: request.request, // Preserve timestamp
      });
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
      if (request.recordType === 'zone-scoring') {
        // Use publish endpoint for ZoneScoring approval
        await api.zoneScoring.publish(request.recordId);
      } else if (request.recordType === 'consumption') {
        // Approve consumption
        await approveConsumptionMutation.mutateAsync({
          id: request.recordId,
        });
      } else if (request.recordType === 'customer') {
        // Approve customer - update status to Active
        if (!request.account) {
          throw new Error('Customer account UUID not found');
        }
        await api.users.updateStatus(request.account, 'Active');
        toast.success('Customer approved successfully');
      }
      
      // Invalidate and refetch all related queries to ensure UI updates immediately
      if (request.recordType === 'zone-scoring') {
        // For ZoneScoring, only invalidate zone-scoring queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['zone-scoring'], refetchType: 'active' }),
        ]);
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ['zone-scoring'] }),
        ]);
      } else if (request.recordType === 'consumption') {
        // For consumptions, invalidate consumption queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['consumption'], refetchType: 'active' }),
        ]);
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ['consumption'] }),
        ]);
      } else if (request.recordType === 'customer') {
        // For customers, invalidate users queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['users'], refetchType: 'active' }),
        ]);
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ['users'] }),
        ]);
      }
      
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to approve:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve';
      toast.error(`Failed to approve: ${errorMessage}`);
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
      if (recordType === 'zone-scoring') {
        // Use status endpoint with 'rejected' for ZoneScoring rejection
        await api.zoneScoring.updateStatus(recordId, 'rejected');
      } else if (recordType === 'consumption') {
        // Reject consumption
        await rejectConsumptionMutation.mutateAsync({
          id: recordId,
        });
      } else if (recordType === 'customer') {
        // Reject customer - ensure status remains Inactive (or explicitly set to Inactive)
        if (!requestToReject.account) {
          throw new Error('Customer account UUID not found');
        }
        await api.users.updateStatus(requestToReject.account, 'Inactive');
        toast.success('Customer rejected');
      }
      
      // Close modal after successful rejection
      setSelectedRequest(null);
      
      // Invalidate and refetch queries based on record type
      if (recordType === 'zone-scoring') {
        // For ZoneScoring, only invalidate zone-scoring queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['zone-scoring'], refetchType: 'active' }),
        ]);
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ['zone-scoring'] }),
        ]);
      } else if (recordType === 'consumption') {
        // Wait for backend to fully process
        await new Promise(resolve => setTimeout(resolve, 500));
        // Force refetch of consumption queries
        await Promise.all([
          queryClient.refetchQueries({ 
            queryKey: ['consumption'],
            type: 'active'
          }),
        ]);
      } else if (recordType === 'customer') {
        // For customers, invalidate users queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['users'], refetchType: 'active' }),
        ]);
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ['users'] }),
        ]);
      }
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
      <div className="px-4 md:px-8 py-4 md:py-6">
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
                <TableHead className="font-semibold text-gray-700">Details</TableHead>
                <TableHead className="font-semibold text-gray-700">Category</TableHead>
                <TableHead className="font-semibold text-gray-700">Requested By</TableHead>
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
                    <TableCell className="text-gray-700">{request.details || '-'}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{request.affectedEntity || '-'}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{request.requestedBy}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleReview(request)}
                        className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-9 px-4 flex items-center gap-2 ml-auto"
                        disabled={
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
