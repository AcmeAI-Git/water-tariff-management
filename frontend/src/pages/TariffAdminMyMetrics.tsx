import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useApiQuery, useAdminId } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { MetricCard } from '../components/common/MetricCard';
import type { TariffPolicy, TariffThresholdSlab, TariffCategorySettings } from '../types';

// Backend may return createdAt on policy/slab even if not in base type
type PolicyWithDate = TariffPolicy & { createdAt?: string };
type SlabWithDate = TariffThresholdSlab & { createdAt?: string };

export function TariffAdminMyMetrics() {
  const adminId = useAdminId();

  // Use same APIs as Tariff History: tariff-policy, tariff-threshold-slabs, tariff-category-settings
  const { data: tariffPolicies = [], isLoading: policiesLoading } = useApiQuery<TariffPolicy[]>(
    ['tariff-policy'],
    () => api.tariffPolicy.getAll()
  );

  const { data: thresholdSlabs = [], isLoading: slabsLoading } = useApiQuery<TariffThresholdSlab[]>(
    ['tariff-threshold-slabs'],
    () => api.tariffThresholdSlabs.getAll()
  );

  const { data: categorySettings = [], isLoading: settingsLoading } = useApiQuery<TariffCategorySettings[]>(
    ['tariff-category-settings'],
    () => api.tariffCategorySettings.getAll()
  );

  // Optional: approval-requests can 500 on backend (e.g. schema/approvalStatus). Don't block page or toast.
  const { data: approvalRequests } = useQuery({
    queryKey: ['approval-requests'],
    queryFn: () => api.approvalRequests.getAll(),
    retry: false,
    staleTime: 60_000,
  });

  const safeApprovalRequests = Array.isArray(approvalRequests) ? approvalRequests : [];

  // Filter to current admin's pending submissions
  const myPendingSubmissions = useMemo(() => {
    if (!adminId) return [];
    return safeApprovalRequests.filter(
      (req: { requestedBy?: number; reviewedBy?: number | null }) =>
        req.requestedBy === adminId && (req.reviewedBy == null || req.reviewedBy === null)
    );
  }, [safeApprovalRequests, adminId]);

  const activeSlabs = useMemo(
    () => thresholdSlabs.filter((s) => s.isActive),
    [thresholdSlabs]
  );

  // Tariff changes over time: group policies, slabs, and category settings by month (using createdAt when present)
  const tariffChangesData = useMemo(() => {
    const changesByMonth: Record<string, number> = {};

    const addDate = (dateStr: string | undefined) => {
      if (!dateStr) return;
      try {
        const date = new Date(dateStr);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        changesByMonth[monthKey] = (changesByMonth[monthKey] || 0) + 1;
      } catch {
        // skip invalid dates
      }
    };

    (tariffPolicies as PolicyWithDate[]).forEach((p) => addDate(p.createdAt));
    (thresholdSlabs as SlabWithDate[]).forEach((s) => addDate(s.createdAt));
    categorySettings.forEach((s) => addDate(s.createdAt));

    return Object.entries(changesByMonth)
      .map(([month, changes]) => ({ month, changes }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-10);
  }, [tariffPolicies, thresholdSlabs, categorySettings]);

  // Threshold slab structure for chart (active slabs: range + rate)
  const thresholdSlabChartData = useMemo(() => {
    return activeSlabs
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((slab) => ({
        range:
          slab.upperLimit != null
            ? `${slab.lowerLimit}-${slab.upperLimit} m³`
            : `${slab.lowerLimit}+ m³`,
        rate: slab.rate,
      }));
  }, [activeSlabs]);

  const isLoading = policiesLoading || slabsLoading || settingsLoading;

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
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-[28px] font-semibold text-gray-900 mb-1">My Monthly Metrics</h1>
          <p className="text-sm text-gray-500">
            Track your tariff management performance and system overview
          </p>
        </div>

        {/* Key Metrics - metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            label="My Submissions Pending"
            value={myPendingSubmissions.length}
            variant="blue"
          />
          <MetricCard
            label="Active Volumetric Slabs"
            value={activeSlabs.length}
            variant="green"
            animationDelay={0.05}
          />
          <MetricCard
            label="Tariff Policies"
            value={tariffPolicies.length}
            variant="purple"
            animationDelay={0.1}
          />
          <MetricCard
            label="Category Settings"
            value={categorySettings.length}
            variant="orange"
            animationDelay={0.15}
          />
        </div>

        {/* Tariff Changes Over Time */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tariff Changes Over Time</h2>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-md transition-all duration-300 mb-8">
            {tariffChangesData.length > 0 ? (
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
                    label={{
                      value: 'Number of Changes',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 12 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value} changes`, 'Tariff Edits']}
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
            ) : (
              <p className="text-sm text-gray-500 text-center py-12">
                No tariff change history yet. Changes to policies, slabs, or category settings will appear here.
              </p>
            )}
          </div>
        </div>

        {/* Current volumetric slab structure */}
        {thresholdSlabChartData.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Current Volumetric Slab Structure
            </h2>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all duration-300">
              <p className="text-sm text-gray-500 mb-4">
                Active slab rates by consumption range (m³)
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={thresholdSlabChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    label={{
                      value: 'Rate (BDT/m³)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 12 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="rate" fill="#4C6EF5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-all duration-300">
            <p className="text-sm text-gray-500 text-center">
              No active volumetric slabs. Configure slabs in Tariff Configuration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
