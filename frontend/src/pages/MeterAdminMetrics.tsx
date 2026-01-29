import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { api } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { MetricCard } from '../components/common/MetricCard';

export function MeterAdminMetrics() {
  // Fetch consumption entries
  const { data: consumptions = [], isLoading: consumptionsLoading } = useApiQuery(
    ['consumption'],
    () => api.consumption.getAll()
  );

  // Fetch users (households)
  const { data: users = [], isLoading: usersLoading } = useApiQuery(
    ['users'],
    () => api.users.getAll()
  );

  // Calculate metrics
  const thisMonth = new Date();
  const readingsThisMonth = consumptions.filter((consumption) => {
    if (!consumption.createdAt) return false;
    const createdDate = new Date(consumption.createdAt);
    return createdDate.getMonth() === thisMonth.getMonth() && 
           createdDate.getFullYear() === thisMonth.getFullYear();
  }).length;

  // Prepare daily readings data (last 30 days)
  const dailyData = useMemo(() => {
    const data: { date: string; readings: number }[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const count = consumptions.filter((consumption) => {
        if (!consumption.createdAt) return false;
        const createdDate = new Date(consumption.createdAt);
        return createdDate.toDateString() === date.toDateString();
      }).length;
      
      data.push({ date: dateStr, readings: count });
    }
    
    return data;
  }, [consumptions]);

  // Calculate days elapsed in current month for accurate daily average
  const daysElapsedThisMonth = thisMonth.getDate(); // Day of month (1-31)
  const avgDailyEntries = daysElapsedThisMonth > 0
    ? (readingsThisMonth / daysElapsedThisMonth).toFixed(1)
    : '0.0';
  
  const totalHouseholds = users.length;
  const coverageRate = totalHouseholds > 0 
    ? ((consumptions.length / totalHouseholds) * 100).toFixed(0)
    : '0';

  if (consumptionsLoading || usersLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="px-4 md:px-8 py-4 md:py-6">
        {/* Header - centered on mobile to avoid hamburger overlap */}
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h1 className="text-xl md:text-[1.75rem] font-semibold text-gray-900 mb-1">My Monthly Metrics</h1>
          <p className="text-xs md:text-sm text-gray-500">Track your data entry performance</p>
        </div>

        {/* Stats - first row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <MetricCard
            label="Readings This Month"
            value={readingsThisMonth}
            subtitle={`As of ${thisMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
            variant="blue"
          />
          <MetricCard
            label="Total Readings"
            value={consumptions.length}
            subtitle="All time entries"
            variant="green"
            animationDelay={0.05}
          />
          <MetricCard
            label="Average Daily Entries"
            value={avgDailyEntries}
            subtitle="Last 30 days average"
            variant="purple"
            animationDelay={0.1}
          />
        </div>

        {/* Performance Details - second row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <MetricCard
            label="Total Households Covered"
            value={totalHouseholds}
            variant="blue"
          />
          <MetricCard
            label="Coverage Rate"
            value={`${coverageRate}%`}
            variant="green"
            animationDelay={0.05}
          />
          <MetricCard
            label="Total Readings"
            value={consumptions.length}
            variant="purple"
            animationDelay={0.1}
          />
        </div>

        {/* Chart */}
        <div className="mb-6 md:mb-8">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Daily Readings Entered (Last 30 Days)</h3>
          
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6 hover:border-gray-300 hover:shadow-md transition-all duration-300 overflow-x-auto min-h-[280px]">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar 
                  dataKey="readings" 
                  fill="#4C6EF5" 
                  radius={[6, 6, 0, 0]}
                  name="Readings"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
