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

export function TariffAdminTariffHistory() {
  const [ruleTypeFilter, setRuleTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Fetch all tariff plans
  const { data: tariffPlans = [], isLoading } = useApiQuery(
    ['tariff-plans'],
    () => api.tariffPlans.getAll()
  );

  // Map tariff plans to history records
  const historyRecords = useMemo(() => {
    const records: any[] = [];
    
    tariffPlans.forEach((plan) => {
      // Add plan-level record
      records.push({
        id: plan.id,
        ruleType: 'Plan',
        details: plan.name,
        newValue: plan.description || 'N/A',
        effectiveFrom: plan.effectiveFrom,
        effectiveTo: plan.effectiveTo || null,
        status: plan.effectiveTo ? 'Expired' : 'Active',
        approvalStatus: (plan as any).approvalStatus?.name || 'Unknown',
      });

      // Add slab records
      if (plan.slabs && plan.slabs.length > 0) {
        plan.slabs.forEach((slab) => {
          const range = slab.maxConsumption 
            ? `${slab.minConsumption}-${slab.maxConsumption} m³`
            : `${slab.minConsumption}+ m³`;
          
          records.push({
            id: `${plan.id}-slab-${slab.id}`,
            ruleType: 'Slab',
            details: range,
            newValue: `৳${slab.ratePerUnit.toFixed(2)}/m³`,
            effectiveFrom: plan.effectiveFrom,
            effectiveTo: plan.effectiveTo || null,
            status: plan.effectiveTo ? 'Expired' : 'Active',
            approvalStatus: (plan as any).approvalStatus?.name || 'Unknown',
          });
        });
      }
    });

    return records.sort((a, b) => {
      const dateA = new Date(a.effectiveFrom).getTime();
      const dateB = new Date(b.effectiveFrom).getTime();
      return dateB - dateA; // Most recent first
    });
  }, [tariffPlans]);

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
      case 'Expired':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-gray-900 mb-1">Tariff History</h1>
          <p className="text-sm text-gray-500">View all tariff plan changes and their effective periods</p>
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
                { value: 'Plan', label: 'Plan' },
                { value: 'Slab', label: 'Slab' }
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
                { value: 'Expired', label: 'Expired' }
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
                <TableHead className="text-sm font-semibold text-gray-700">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
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
                      {new Date(record.effectiveFrom).toLocaleDateString('en-US')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {record.effectiveTo ? new Date(record.effectiveTo).toLocaleDateString('en-US') : '-'}
                    </TableCell>
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
