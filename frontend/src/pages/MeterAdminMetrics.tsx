import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function MeterAdminMetrics() {
  const dailyData = [
    { date: 'Nov 1', readings: 12 },
    { date: 'Nov 2', readings: 15 },
    { date: 'Nov 3', readings: 8 },
    { date: 'Nov 4', readings: 18 },
    { date: 'Nov 5', readings: 22 },
    { date: 'Nov 6', readings: 16 },
    { date: 'Nov 7', readings: 19 },
    { date: 'Nov 8', readings: 14 },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-gray-900 mb-1">My Monthly Metrics</h1>
          <p className="text-sm text-gray-500">Track your data entry performance</p>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Readings Entered This Month</p>
              <p className="text-3xl font-semibold text-gray-900">247</p>
              <p className="text-xs text-gray-500 mt-2">As of November 8, 2025</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Entries Pending Approval</p>
              <p className="text-3xl font-semibold text-gray-900">12</p>
              <p className="text-xs text-gray-500 mt-2">Awaiting supervisor review</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Average Daily Entries</p>
              <p className="text-3xl font-semibold text-gray-900">16</p>
              <p className="text-xs text-gray-500 mt-2">Last 30 days average</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-8"></div>

        {/* Chart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Readings Entered (Last 30 Days)</h3>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200">
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

        {/* Additional Stats */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Details</h3>
          
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Total Households Covered</p>
                <p className="text-xs text-gray-500 mt-0.5">In your assigned ward</p>
              </div>
              <p className="text-base font-semibold text-gray-900">342</p>
            </div>

            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Coverage Rate</p>
                <p className="text-xs text-gray-500 mt-0.5">Percentage of households with data</p>
              </div>
              <p className="text-base font-semibold text-gray-900">72%</p>
            </div>

            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Accuracy Score</p>
                <p className="text-xs text-gray-500 mt-0.5">Based on validation checks</p>
              </div>
              <p className="text-base font-semibold text-gray-900">98.5%</p>
            </div>

            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Rejected Entries</p>
                <p className="text-xs text-gray-500 mt-0.5">This month</p>
              </div>
              <p className="text-base font-semibold text-gray-900">3</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
