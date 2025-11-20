import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function TariffAdminMyMetrics() {
  const tariffChangesData = [
    { month: 'Feb 2024', changes: 2 },
    { month: 'Mar 2024', changes: 1 },
    { month: 'Apr 2024', changes: 3 },
    { month: 'May 2024', changes: 2 },
    { month: 'Jun 2024', changes: 4 },
    { month: 'Jul 2024', changes: 1 },
    { month: 'Aug 2024', changes: 5 },
    { month: 'Sep 2024', changes: 3 },
    { month: 'Oct 2024', changes: 2 },
    { month: 'Nov 2024', changes: 6 },
  ];

  const residentialTariffData = [
    { range: '0-10 m³', rate: 8.5 },
    { range: '11-20 m³', rate: 12.0 },
    { range: '21-50 m³', rate: 18.5 },
    { range: '51+ m³', rate: 25.0 },
  ];

  const commercialTariffData = [
    { range: '0-10 m³', rate: 15.0 },
    { range: '11-30 m³', rate: 22.5 },
    { range: '31+ m³', rate: 35.0 },
  ];

  const wardMultiplierData = [
    { ward: 'Ward 1', multiplier: 1.0 },
    { ward: 'Ward 2', multiplier: 1.05 },
    { ward: 'Ward 3', multiplier: 0.95 },
    { ward: 'Ward 4', multiplier: 1.10 },
    { ward: 'Ward 5', multiplier: 1.02 },
  ];

  const historicalRateData = [
    { month: 'Jan 2023', residential: 8.0, commercial: 14.0 },
    { month: 'Apr 2023', residential: 8.0, commercial: 14.5 },
    { month: 'Jul 2023', residential: 8.2, commercial: 14.5 },
    { month: 'Oct 2023', residential: 8.2, commercial: 15.0 },
    { month: 'Jan 2024', residential: 8.5, commercial: 15.0 },
    { month: 'Apr 2024', residential: 8.5, commercial: 15.0 },
  ];

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
              <p className="text-[32px] font-semibold text-gray-900">3</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Total Active Rules</p>
              <p className="text-[32px] font-semibold text-gray-900">24</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Total Rules Changed (Last 90 Days)</p>
              <p className="text-[32px] font-semibold text-gray-900">29</p>
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

        {/* Additional Metrics */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-2">Average Review Time</p>
              <p className="text-[28px] font-semibold text-gray-900">2.4 days</p>
              <p className="text-sm text-green-600 mt-1">↓ 15% from last month</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-2">Approval Rate</p>
              <p className="text-[28px] font-semibold text-gray-900">94.2%</p>
              <p className="text-sm text-green-600 mt-1">↑ 3% from last month</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-8"></div>

        {/* Tariff Structure Overview */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Tariff Structure Overview</h2>
          
          {/* Charts Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Residential Tariff Structure */}
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

            {/* Commercial Tariff Structure */}
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

            {/* Ward Multipliers */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Ward Multipliers</h3>
              <p className="text-sm text-gray-500 mb-4">Regional adjustment factors</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={wardMultiplierData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="ward" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    domain={[0.8, 1.2]}
                    label={{ value: 'Multiplier', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="multiplier" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Historical Rate Trends */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Historical Rate Trends</h3>
              <p className="text-sm text-gray-500 mb-4">Base rate changes over time (0-10 m³ slab)</p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    domain={[7, 16]}
                    label={{ value: 'Rate (BDT/m³)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="residential" 
                    stroke="#4C6EF5" 
                    strokeWidth={2}
                    dot={{ fill: '#4C6EF5', r: 4 }}
                    name="Residential"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="commercial" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    name="Commercial"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
