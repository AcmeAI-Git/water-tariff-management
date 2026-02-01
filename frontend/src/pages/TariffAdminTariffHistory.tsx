import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useMemo, useState } from 'react';
import { api } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Input } from '../components/ui/input';
import { Dropdown } from '../components/ui/Dropdown';
import { Button } from '../components/ui/button';
import { Search, X } from 'lucide-react';
import type { TariffPolicy, TariffThresholdSlab, TariffCategorySettings, ZoneScoringRuleSet, Admin } from '../types';

export function TariffAdminTariffHistory() {
  const [ruleTypeFilter, setRuleTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Fetch all tariff policies
  const { data: tariffPolicies = [], isLoading: policiesLoading } = useApiQuery<TariffPolicy[]>(
    ['tariff-policy'],
    () => api.tariffPolicy.getAll()
  );

  // Fetch all threshold slabs
  const { data: thresholdSlabs = [], isLoading: slabsLoading } = useApiQuery<TariffThresholdSlab[]>(
    ['tariff-threshold-slabs'],
    () => api.tariffThresholdSlabs.getAll()
  );

  // Fetch all category settings
  const { data: categorySettings = [], isLoading: settingsLoading } = useApiQuery<TariffCategorySettings[]>(
    ['tariff-category-settings'],
    () => api.tariffCategorySettings.getAll()
  );

  // Fetch all zone scoring rulesets
  const { data: zoneScoringData = [], isLoading: zoneScoringLoading } = useApiQuery<ZoneScoringRuleSet[]>(
    ['zone-scoring'],
    () => api.zoneScoring.getAll()
  );

  // Fetch all admins to map createdBy IDs to names
  const { data: admins = [], isLoading: adminsLoading } = useApiQuery<Admin[]>(
    ['admins'],
    () => api.admins.getAll()
  );

  // Map tariff policies, threshold slabs, category settings, and zone scoring to history records
  const historyRecords = useMemo(() => {
    const records: any[] = [];
    
    // Add tariff policies
    tariffPolicies.forEach((policy) => {
      const policyWithCreator = policy as TariffPolicy & { createdBy?: number; created_by?: number; createdAt?: string };
      const creatorId = policyWithCreator.createdBy || policyWithCreator.created_by;
      const creator = creatorId ? (admins as Admin[]).find((a) => a.id === creatorId) : null;
      const createdBy = creator?.fullName || (creatorId ? `Admin #${creatorId}` : 'System');
      const createdAt = policyWithCreator.createdAt || '';
      
      const policyTypeLabel = policy.tariffType === 'AREA_BASED' ? 'Area Based' :
                              policy.tariffType === 'FIXED' ? 'Fixed' :
                              policy.tariffType === 'THRESHOLD' ? 'Volumetric' : policy.tariffType;
      
      records.push({
        id: `policy-${policy.id}`,
        ruleType: 'Tariff Policy',
        details: `Policy #${policy.id} - ${policyTypeLabel}`,
        newValue: policyTypeLabel,
        effectiveFrom: createdAt,
        effectiveTo: null,
        status: policy.isActive ? 'Active' : 'Inactive',
        approvalStatus: policy.isActive ? 'Active' : 'Inactive',
        createdBy,
        createdAt,
      });
    });

    // Add threshold slabs
    thresholdSlabs.forEach((slab) => {
      const slabWithCreator = slab as TariffThresholdSlab & { createdBy?: number; created_by?: number; createdAt?: string };
      const creatorId = slabWithCreator.createdBy || slabWithCreator.created_by;
      const creator = creatorId ? (admins as Admin[]).find((a) => a.id === creatorId) : null;
      const createdBy = creator?.fullName || (creatorId ? `Admin #${creatorId}` : 'System');
      const createdAt = slabWithCreator.createdAt || '';
      
      const range = slab.upperLimit !== null
        ? `${slab.lowerLimit}-${slab.upperLimit} m³`
        : `${slab.lowerLimit}+ m³`;
      
      // Ensure rate is a number before calling toFixed
      const rate = typeof slab.rate === 'number' ? slab.rate : Number(slab.rate) || 0;
      
      records.push({
        id: `threshold-slab-${slab.id}`,
        ruleType: 'Volumetric Slab',
        details: range,
        newValue: `৳${rate.toFixed(2)}/m³`,
        effectiveFrom: createdAt,
        effectiveTo: null,
        status: slab.isActive ? 'Active' : 'Inactive',
        approvalStatus: slab.isActive ? 'Active' : 'Inactive',
        createdBy,
        createdAt,
      });
    });

    // Add category settings
    categorySettings.forEach((settings) => {
      const settingsWithCreator = settings as TariffCategorySettings & { createdBy?: number; created_by?: number };
      const creatorId = settingsWithCreator.createdBy || settingsWithCreator.created_by;
      const creator = creatorId ? (admins as Admin[]).find((a) => a.id === creatorId) : null;
      const createdBy = creator?.fullName || (creatorId ? `Admin #${creatorId}` : 'System');
      const createdAt = settings.createdAt || '';
      
      records.push({
        id: `category-settings-${settings.id}`,
        ruleType: 'Category Settings',
        details: `Settings #${settings.id}`,
        newValue: `Base Rate: ৳${settings.baseRate.toFixed(2)}, Current Tariff: ৳${settings.currentTariff.toFixed(2)}`,
        effectiveFrom: createdAt,
        effectiveTo: null,
        status: settings.isActive ? 'Active' : 'Inactive',
        approvalStatus: settings.isActive ? 'Active' : 'Inactive',
        createdBy,
        createdAt,
      });
    });

    // Add zone scoring rulesets
    (zoneScoringData as ZoneScoringRuleSet[]).forEach((ruleset) => {
      const rulesetWithCreator = ruleset as ZoneScoringRuleSet & { createdBy?: number; created_by?: number };
      const creatorId = rulesetWithCreator.createdBy || rulesetWithCreator.created_by;
      const creator = creatorId ? (admins as Admin[]).find((a) => a.id === creatorId) : null;
      const createdBy = creator?.fullName || (creatorId ? `Admin #${creatorId}` : 'Tariff Admin');
      const createdAt = ruleset.createdAt || '';
      
      records.push({
        id: `zone-scoring-${ruleset.id}`,
        ruleType: 'Zone Scoring',
        details: ruleset.title,
        newValue: `${ruleset.scoringParams?.length || 0} parameters`,
        effectiveFrom: ruleset.effectiveFrom || createdAt,
        effectiveTo: null,
        status: ruleset.status === 'published' || ruleset.status === 'active' ? 'Active' : 
                ruleset.status === 'rejected' ? 'Rejected' : 'Pending',
        approvalStatus: ruleset.status || 'Pending',
        createdBy,
        createdAt,
      });
    });

    return records.sort((a, b) => {
      // Sort by created date if available, otherwise by effective from
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.effectiveFrom ? new Date(a.effectiveFrom).getTime() : 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.effectiveFrom ? new Date(b.effectiveFrom).getTime() : 0);
      return dateB - dateA; // Most recent first
    });
  }, [tariffPolicies, thresholdSlabs, categorySettings, zoneScoringData, admins]);

  // Apply filters
  const filteredRecords = useMemo(() => {
    return historyRecords.filter((record) => {
      // Rule type filter
      if (ruleTypeFilter !== 'all' && record.ruleType !== ruleTypeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && record.status !== statusFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          record.ruleType?.toLowerCase().includes(query) ||
          record.details?.toLowerCase().includes(query) ||
          record.newValue?.toLowerCase().includes(query) ||
          record.approvalStatus?.toLowerCase().includes(query);
        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
  }, [historyRecords, ruleTypeFilter, statusFilter, searchQuery]);

  // Check if any filters are active
  const hasActiveFilters = ruleTypeFilter !== 'all' || statusFilter !== 'all' || searchQuery.trim() !== '';

  // Clear all filters
  const clearFilters = () => {
    setRuleTypeFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700';
      case 'Inactive':
        return 'bg-gray-100 text-gray-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (policiesLoading || slabsLoading || settingsLoading || zoneScoringLoading || adminsLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-4 md:px-8 py-4 md:py-6">
        {/* Header - centered on mobile to avoid hamburger overlap */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-[28px] font-semibold text-gray-900 mb-1">Tariff History</h1>
          <p className="text-sm text-gray-500">View all tariff policy changes, volumetric slabs, category settings, and zone scoring rules</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search by rule type, details, value..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
            />
          </div>

          {/* Rule Type Filter */}
          <div className="w-48">
            <Dropdown
              options={[
                { value: 'all', label: 'All Rule Types' },
                { value: 'Tariff Policy', label: 'Tariff Policy' },
                { value: 'Volumetric Slab', label: 'Volumetric Slab' },
                { value: 'Category Settings', label: 'Category Settings' },
                { value: 'Zone Scoring', label: 'Zone Scoring' }
              ]}
              value={ruleTypeFilter}
              onChange={setRuleTypeFilter}
              placeholder="Filter by Rule Type"
              className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="w-48">
            <Dropdown
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Rejected', label: 'Rejected' }
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Filter by Status"
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
              <TableRow className="border-gray-200 bg-gray-50">
                <TableHead className="text-sm font-semibold text-gray-700">Rule Type</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Details</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Value</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Effective From</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Effective To</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Created By</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No tariff history found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id} className="border-gray-100">
                    <TableCell className="text-sm font-medium text-gray-900">{record.ruleType}</TableCell>
                    <TableCell className="text-sm text-gray-600">{record.details}</TableCell>
                    <TableCell className="text-sm text-gray-600">{record.newValue}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {record.effectiveFrom ? new Date(record.effectiveFrom).toLocaleDateString('en-US') : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {record.effectiveTo ? new Date(record.effectiveTo).toLocaleDateString('en-US') : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{record.createdBy || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
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
