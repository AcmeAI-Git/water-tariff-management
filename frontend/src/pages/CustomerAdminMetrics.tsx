import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { api } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { MetricCard } from '../components/common/MetricCard';
import { MetricStatsCard } from '../components/common/MetricStatsCard';

export function CustomerAdminMetrics() {
  // Fetch users (customers)
  const { data: users = [], isLoading: usersLoading } = useApiQuery(
    ['users'],
    () => api.users.getAll()
  );

  // Fetch pending approval requests
  const { data: pendingApprovals = [] } = useApiQuery(
    ['approval-requests', 'pending'],
    () => api.approvalRequests.getPending()
  );

  // Calculate metrics
  const totalCustomers = users.length;
  const pendingCount = pendingApprovals.filter((req: any) => 
    req.moduleName?.toLowerCase().includes('customer')
  ).length;

  // Calculate customers registered this month
  const thisMonth = new Date();
  const customersThisMonth = users.filter((user) => {
    if (!user.createdAt) return false;
    const createdDate = new Date(user.createdAt);
    return createdDate.getMonth() === thisMonth.getMonth() && 
           createdDate.getFullYear() === thisMonth.getFullYear();
  }).length;

  // Prepare daily registration data (last 30 days)
  const dailyData = useMemo(() => {
    const data: { date: string; registrations: number }[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const count = users.filter((user) => {
        if (!user.createdAt) return false;
        const createdDate = new Date(user.createdAt);
        return createdDate.toDateString() === date.toDateString();
      }).length;
      
      data.push({ date: dateStr, registrations: count });
    }
    
    return data;
  }, [users]);

  if (usersLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const avgDailyRegistrations = (customersThisMonth / 30).toFixed(1);
  const peakDay = dailyData.reduce((max, day) => 
    day.registrations > max.registrations ? day : max, 
    { date: '', registrations: 0 }
  );

  return (
    <div className="min-h-screen bg-app">
      <div className="px-4 md:px-8 py-4 md:py-6">
        {/* Header - centered on mobile to avoid hamburger overlap */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">My Monthly Metrics</h1>
          <p className="text-sm text-gray-500">Track your customer registration performance</p>
        </div>

        {/* Stats - metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            label="Customers This Month"
            value={customersThisMonth}
            subtitle="Registered this month"
            variant="blue"
          />
          <MetricCard
            label="Pending Approval"
            value={pendingCount}
            subtitle="Awaiting review"
            variant="orange"
            animationDelay={0.05}
          />
          <MetricCard
            label="Total Customers"
            value={totalCustomers}
            subtitle="In ward"
            variant="green"
            animationDelay={0.1}
          />
        </div>

        {/* Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Registrations (Last 30 Days)</h3>
          
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-md transition-all duration-300">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  cursor={{ fill: 'rgba(76, 110, 245, 0.1)' }}
                />
                <Bar 
                  dataKey="registrations" 
                  fill="#4C6EF5" 
                  radius={[4, 4, 0, 0]}
                  name="Registrations"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Insights */}
        <div className="mt-8">
          <MetricStatsCard
            title="Key Insights"
            variant="purple"
            items={[
              { label: "Peak Registration Day", value: `${peakDay.date} — ${peakDay.registrations} registrations` },
              { label: "Average Daily Registrations", value: `${avgDailyRegistrations} per day` },
              { label: "Total Registrations", value: totalCustomers },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
