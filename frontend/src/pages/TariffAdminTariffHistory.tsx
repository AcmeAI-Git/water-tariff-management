import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useMemo } from 'react';
import { api } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function TariffAdminTariffHistory() {
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
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-gray-900 mb-1">Tariff History</h1>
          <p className="text-sm text-gray-500">View all tariff plan changes and their effective periods</p>
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
              {historyRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No tariff history found
                  </TableCell>
                </TableRow>
              ) : (
                historyRecords.map((record) => (
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
