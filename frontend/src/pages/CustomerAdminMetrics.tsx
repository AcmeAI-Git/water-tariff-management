import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { api } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function CustomerAdminMetrics() {
  // Fetch users (households)
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
  const totalHouseholds = users.length;
  const pendingCount = pendingApprovals.filter((req: any) => 
    req.moduleName?.toLowerCase().includes('household') || 
    req.moduleName?.toLowerCase().includes('customer')
  ).length;

  // Calculate households registered this month
  const thisMonth = new Date();
  const householdsThisMonth = users.filter((user) => {
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

  const avgDailyRegistrations = (householdsThisMonth / 30).toFixed(1);
  const peakDay = dailyData.reduce((max, day) => 
    day.registrations > max.registrations ? day : max, 
    { date: '', registrations: 0 }
  );

  return (
    <div className="min-h-screen bg-app">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">My Monthly Metrics</h1>
          <p className="text-sm text-gray-500">Track your household registration performance</p>
        </div>

        {/* Stats - Text-based */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
          
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            <div className="px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Households Registered This Month</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{householdsThisMonth}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Registrations Pending Approval</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{pendingCount}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    Awaiting review
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Households in Ward</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{totalHouseholds}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Registrations (Last 30 Days)</h3>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
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

        {/* Additional Insights */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            <div className="px-6 py-4">
              <p className="text-sm font-medium text-gray-900 mb-1">Peak Registration Day</p>
              <p className="text-sm text-gray-600">
                {peakDay.date} with {peakDay.registrations} registrations
              </p>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-sm font-medium text-gray-900 mb-1">Average Daily Registrations</p>
              <p className="text-sm text-gray-600">{avgDailyRegistrations} households per day</p>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm font-medium text-gray-900 mb-1">Total Registrations</p>
              <p className="text-sm text-gray-600">{totalHouseholds} households registered</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
