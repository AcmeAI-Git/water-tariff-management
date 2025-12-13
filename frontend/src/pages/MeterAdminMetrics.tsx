import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { api } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { Admin } from '../types';

export function MeterAdminMetrics() {
  // Get logged-in admin from localStorage
  const loggedInAdmin = useMemo(() => {
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) return null;
    try {
      return JSON.parse(adminStr) as Admin;
    } catch {
      return null;
    }
  }, []);

  // Fetch consumption entries
  const { data: consumptions = [], isLoading: consumptionsLoading } = useApiQuery(
    ['consumption'],
    () => api.consumption.getAll()
  );

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useApiQuery(
    ['users'],
    () => api.users.getAll()
  );

  // Find the Meter Admin's user record by matching email
  const meterAdminUser = useMemo(() => {
    if (!loggedInAdmin?.email) return null;
    return users.find(user => user.email === loggedInAdmin.email) || null;
  }, [users, loggedInAdmin]);

  // Get ward name
  const wardName = useMemo(() => {
    if (!meterAdminUser?.wardId) return 'your assigned ward';
    // Check if ward relation is populated in the user object (from API response)
    const userWithWard = meterAdminUser as typeof meterAdminUser & { ward?: { name?: string; wardNo?: string } };
    if (userWithWard && 'ward' in userWithWard && userWithWard.ward) {
      return userWithWard.ward.name || `Ward ${userWithWard.ward.wardNo}` || 'your assigned ward';
    }
    // If ward relation not populated, return generic message
    return 'your assigned ward';
  }, [meterAdminUser]);

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

  const avgDailyEntries = (readingsThisMonth / 30).toFixed(0);
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
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">My Monthly Metrics</h1>
          <p className="text-sm text-gray-500">Track your data entry performance</p>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Readings Entered This Month</p>
              <p className="text-3xl font-semibold text-gray-900">{readingsThisMonth}</p>
              <p className="text-xs text-gray-500 mt-2">As of {thisMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Total Readings</p>
              <p className="text-3xl font-semibold text-gray-900">{consumptions.length}</p>
              <p className="text-xs text-gray-500 mt-2">All time entries</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Average Daily Entries</p>
              <p className="text-3xl font-semibold text-gray-900">{avgDailyEntries}</p>
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
                <p className="text-xs text-gray-500 mt-0.5">In {wardName}</p>
              </div>
              <p className="text-base font-semibold text-gray-900">{totalHouseholds}</p>
            </div>

            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Coverage Rate</p>
                <p className="text-xs text-gray-500 mt-0.5">Percentage of households with data</p>
              </div>
              <p className="text-base font-semibold text-gray-900">{coverageRate}%</p>
            </div>

            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Total Readings</p>
                <p className="text-xs text-gray-500 mt-0.5">All meter readings entered</p>
              </div>
              <p className="text-base font-semibold text-gray-900">{consumptions.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
