import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function CustomerAdminMetrics() {
  // Mock data for daily registrations
  const dailyData = [
    { date: 'Oct 10', registrations: 3 },
    { date: 'Oct 11', registrations: 1 },
    { date: 'Oct 12', registrations: 4 },
    { date: 'Oct 13', registrations: 2 },
    { date: 'Oct 14', registrations: 5 },
    { date: 'Oct 15', registrations: 3 },
    { date: 'Oct 16', registrations: 2 },
    { date: 'Oct 17', registrations: 6 },
    { date: 'Oct 18', registrations: 4 },
    { date: 'Oct 19', registrations: 3 },
    { date: 'Oct 20', registrations: 5 },
    { date: 'Oct 21', registrations: 2 },
    { date: 'Oct 22', registrations: 4 },
    { date: 'Oct 23', registrations: 7 },
    { date: 'Oct 24', registrations: 3 },
    { date: 'Oct 25', registrations: 5 },
    { date: 'Oct 26', registrations: 2 },
    { date: 'Oct 27', registrations: 4 },
    { date: 'Oct 28', registrations: 6 },
    { date: 'Oct 29', registrations: 3 },
    { date: 'Oct 30', registrations: 5 },
    { date: 'Oct 31', registrations: 4 },
    { date: 'Nov 1', registrations: 3 },
    { date: 'Nov 2', registrations: 6 },
    { date: 'Nov 3', registrations: 4 },
    { date: 'Nov 4', registrations: 5 },
    { date: 'Nov 5', registrations: 2 },
    { date: 'Nov 6', registrations: 7 },
    { date: 'Nov 7', registrations: 5 },
    { date: 'Nov 8', registrations: 4 },
  ];

  return (
    <div className="min-h-screen bg-app">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-gray-900 mb-1">My Monthly Metrics</h1>
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
                  <p className="text-2xl font-semibold text-gray-900 mt-1">47</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    +12% from last month
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Registrations Pending Approval</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">8</p>
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
                  <p className="text-2xl font-semibold text-gray-900 mt-1">324</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">Ward 3, Dhaka South</span>
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
              <p className="text-sm text-gray-600">November 6 with 7 registrations</p>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-sm font-medium text-gray-900 mb-1">Average Daily Registrations</p>
              <p className="text-sm text-gray-600">4.2 households per day</p>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm font-medium text-gray-900 mb-1">Approval Rate</p>
              <p className="text-sm text-gray-600">83% of registrations approved within 48 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

