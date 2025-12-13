import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { api } from '../services/api';
import { useApiQuery, useAdminId } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function TariffAdminMyMetrics() {
  const adminId = useAdminId();

  // Fetch tariff plans
  const { data: tariffPlans = [], isLoading: plansLoading } = useApiQuery(
    ['tariff-plans'],
    () => api.tariffPlans.getAll()
  );

  // Fetch approval requests
  const { data: approvalRequests = [], isLoading: approvalsLoading } = useApiQuery(
    ['approval-requests'],
    () => api.approvalRequests.getAll()
  );

  // Filter to current admin's submissions
  const myPendingSubmissions = useMemo(() => {
    if (!adminId) return [];
    return approvalRequests.filter((req) => 
      req.requestedBy === adminId && 
      (!req.reviewedBy || req.reviewedBy === null)
    );
  }, [approvalRequests, adminId]);

  // Calculate active rules (active tariff plans)
  const activePlans = tariffPlans.filter((plan) => {
    if (plan.effectiveTo) {
      return new Date(plan.effectiveTo) > new Date();
    }
    return true;
  });

  // Prepare tariff changes data
  const tariffChangesData = useMemo(() => {
    const changesByMonth: Record<string, number> = {};
    
    tariffPlans.forEach((plan) => {
      if (plan.createdAt) {
        const date = new Date(plan.createdAt);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        changesByMonth[monthKey] = (changesByMonth[monthKey] || 0) + 1;
      }
    });

    return Object.entries(changesByMonth)
      .map(([month, changes]) => ({ month, changes }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-10); // Last 10 months
  }, [tariffPlans]);

  // Prepare residential and commercial tariff data from active plans
  const residentialTariffData = useMemo(() => {
    const residentialPlan = activePlans.find((plan) => 
      plan.name.toLowerCase().includes('residential')
    );
    
    if (!residentialPlan?.slabs) return [];
    
    return residentialPlan.slabs
      .sort((a, b) => a.slabOrder - b.slabOrder)
      .map((slab) => ({
        range: slab.maxConsumption 
          ? `${slab.minConsumption}-${slab.maxConsumption} m³`
          : `${slab.minConsumption}+ m³`,
        rate: parseFloat(slab.ratePerUnit.toString()),
      }));
  }, [activePlans]);

  const commercialTariffData = useMemo(() => {
    const commercialPlan = activePlans.find((plan) => 
      plan.name.toLowerCase().includes('commercial')
    );
    
    if (!commercialPlan?.slabs) return [];
    
    return commercialPlan.slabs
      .sort((a, b) => a.slabOrder - b.slabOrder)
      .map((slab) => ({
        range: slab.maxConsumption 
          ? `${slab.minConsumption}-${slab.maxConsumption} m³`
          : `${slab.minConsumption}+ m³`,
        rate: parseFloat(slab.ratePerUnit.toString()),
      }));
  }, [activePlans]);

  if (plansLoading || approvalsLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const totalActiveRules = activePlans.reduce((sum, plan) => 
    sum + (plan.slabs?.length || 0), 0
  );

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-gray-900 mb-1">My Monthly Metrics</h1>
          <p className="text-sm text-gray-500">Track your tariff management performance and system overview</p>
        </div>

        {/* Stats Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">My Submissions Pending Approval</p>
              <p className="text-[32px] font-semibold text-gray-900">{myPendingSubmissions.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Total Active Rules</p>
              <p className="text-[32px] font-semibold text-gray-900">{totalActiveRules}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Total Plans Created</p>
              <p className="text-[32px] font-semibold text-gray-900">{tariffPlans.length}</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-8"></div>

        {/* Chart Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tariff Changes Over Time</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={tariffChangesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ value: 'Number of Changes', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value) => [`${value} changes`, 'Tariff Edits']}
                />
                <Line 
                  type="monotone" 
                  dataKey="changes" 
                  stroke="#4C6EF5" 
                  strokeWidth={3}
                  dot={{ fill: '#4C6EF5', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tariff Structure Overview */}
        {residentialTariffData.length > 0 || commercialTariffData.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Tariff Structure Overview</h2>
            
            {/* Charts Grid */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Residential Tariff Structure */}
              {residentialTariffData.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Residential Tariff Structure</h3>
                  <p className="text-sm text-gray-500 mb-4">Current base rates by consumption range</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={residentialTariffData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="range" 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                        label={{ value: 'Rate (BDT/m³)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                      <Bar dataKey="rate" fill="#4C6EF5" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Commercial Tariff Structure */}
              {commercialTariffData.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Commercial Tariff Structure</h3>
                  <p className="text-sm text-gray-500 mb-4">Current base rates by consumption range</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={commercialTariffData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="range" 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                        label={{ value: 'Rate (BDT/m³)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                      <Bar dataKey="rate" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 text-center">No active tariff plans found</p>
          </div>
        )}
      </div>
    </div>
  );
}
