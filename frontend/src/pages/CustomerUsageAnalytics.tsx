import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '../components/ui/card';
import { Droplet, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { format } from 'date-fns';

export default function CustomerUsageAnalytics() {
  // Get logged-in customer
  const customerUserStr = localStorage.getItem('customerUser');
  const customerUser = customerUserStr ? JSON.parse(customerUserStr) : null;
  const userId = customerUser?.id;

  // Fetch consumption records
  const { data: consumptions = [], isLoading: consumptionsLoading } = useApiQuery(
    ['consumption'],
    () => api.consumption.getAll(),
    { enabled: !!userId }
  );

  // Filter and process consumption data
  const userConsumptions = useMemo(() => {
    if (!userId) return [];
    return consumptions
      .filter((c) => c.userId === userId)
      .sort((a, b) => {
        const dateA = a.billMonth ? new Date(a.billMonth).getTime() : 0;
        const dateB = b.billMonth ? new Date(b.billMonth).getTime() : 0;
        return dateA - dateB;
      });
  }, [consumptions, userId]);

  // Group consumption by month
  const monthlyData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    userConsumptions.forEach((c) => {
      if (c.billMonth && c.consumption) {
        const monthKey = format(new Date(c.billMonth), 'yyyy-MM');
        grouped[monthKey] = (grouped[monthKey] || 0) + Number(c.consumption);
      }
    });

    return Object.entries(grouped)
      .map(([month, consumption]) => ({
        month,
        monthLabel: format(new Date(month + '-01'), 'MMM yyyy'),
        consumption: Number(consumption.toFixed(2)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }, [userConsumptions]);

  // Calculate statistics
  const stats = useMemo(() => {
    const consumptions = monthlyData.map((d) => d.consumption);
    if (consumptions.length === 0) {
      return {
        average: 0,
        highest: { value: 0, month: '' },
        lowest: { value: 0, month: '' },
        trend: 'stable',
      };
    }

    const sum = consumptions.reduce((a, b) => a + b, 0);
    const average = sum / consumptions.length;
    const highest = monthlyData.reduce((max, d) => 
      d.consumption > max.consumption ? d : max, monthlyData[0]
    );
    const lowest = monthlyData.reduce((min, d) => 
      d.consumption < min.consumption ? d : min, monthlyData[0]
    );

    // Calculate trend (comparing last 3 months average with previous 3 months)
    let trend = 'stable';
    if (monthlyData.length >= 6) {
      const recent = monthlyData.slice(-3);
      const previous = monthlyData.slice(-6, -3);
      const recentAvg = recent.reduce((sum, d) => sum + d.consumption, 0) / recent.length;
      const previousAvg = previous.reduce((sum, d) => sum + d.consumption, 0) / previous.length;
      const change = ((recentAvg - previousAvg) / previousAvg) * 100;
      if (change > 10) trend = 'increasing';
      else if (change < -10) trend = 'decreasing';
    }

    return {
      average: Number(average.toFixed(2)),
      highest: { value: highest.consumption, month: highest.monthLabel },
      lowest: { value: lowest.consumption, month: lowest.monthLabel },
      trend,
    };
  }, [monthlyData]);

  // Generate conservation recommendations
  const recommendations = useMemo(() => {
    const recs: string[] = [];
    
    if (stats.average > 50) {
      recs.push('Your average consumption is above typical household levels. Consider checking for leaks.');
    }
    
    if (stats.trend === 'increasing') {
      recs.push('Your consumption has been increasing recently. Review your water usage habits.');
    }
    
    if (monthlyData.length > 0) {
      const recentConsumption = monthlyData[monthlyData.length - 1].consumption;
      if (recentConsumption > stats.average * 1.2) {
        recs.push('Your recent consumption is significantly higher than your average. Investigate potential issues.');
      }
    }

    // General recommendations
    if (recs.length === 0) {
      recs.push('Your water usage is within normal ranges. Keep up the good conservation efforts!');
    }
    
    recs.push('Fix any leaking faucets or pipes immediately.');
    recs.push('Consider installing water-efficient fixtures.');
    recs.push('Monitor your usage regularly to identify patterns.');

    return recs;
  }, [stats, monthlyData]);

  // Seasonal trends analysis
  const seasonalTrends = useMemo(() => {
    const byMonth: Record<number, number[]> = {};
    
    monthlyData.forEach((d) => {
      const month = new Date(d.month + '-01').getMonth();
      if (!byMonth[month]) byMonth[month] = [];
      byMonth[month].push(d.consumption);
    });

    const averages = Object.entries(byMonth).map(([month, values]) => ({
      month: parseInt(month),
      monthName: format(new Date(2024, parseInt(month), 1), 'MMM'),
      average: values.reduce((a, b) => a + b, 0) / values.length,
    }));

    return averages.sort((a, b) => a.month - b.month);
  }, [monthlyData]);

  if (consumptionsLoading) {
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
          <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">Usage Analytics</h1>
          <p className="text-sm text-gray-500">Analyze your water consumption patterns and trends</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Average Monthly</p>
              <Droplet className="text-blue-600" size={20} />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats.average} m³</p>
          </Card>

          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Highest Month</p>
              <TrendingUp className="text-red-600" size={20} />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats.highest.value} m³</p>
            <p className="text-xs text-gray-500 mt-1">{stats.highest.month}</p>
          </Card>

          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Lowest Month</p>
              <TrendingDown className="text-green-600" size={20} />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats.lowest.value} m³</p>
            <p className="text-xs text-gray-500 mt-1">{stats.lowest.month}</p>
          </Card>

          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Trend</p>
              {stats.trend === 'increasing' ? (
                <TrendingUp className="text-orange-600" size={20} />
              ) : stats.trend === 'decreasing' ? (
                <TrendingDown className="text-green-600" size={20} />
              ) : (
                <AlertCircle className="text-gray-600" size={20} />
              )}
            </div>
            <p className="text-2xl font-semibold text-gray-900 capitalize">{stats.trend}</p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Consumption Trends */}
          <Card className="p-6 bg-white border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Consumption Trends (Last 12 Months)</h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="monthLabel" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    label={{ value: 'Consumption (m³)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="consumption" 
                    stroke="#4C6EF5" 
                    strokeWidth={2}
                    dot={{ fill: '#4C6EF5', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No consumption data available
              </div>
            )}
          </Card>

          {/* Monthly Comparison */}
          <Card className="p-6 bg-white border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Comparison</h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="monthLabel" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    label={{ value: 'Consumption (m³)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="consumption" fill="#4C6EF5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No consumption data available
              </div>
            )}
          </Card>
        </div>

        {/* Seasonal Trends */}
        {seasonalTrends.length > 0 && (
          <Card className="p-6 bg-white border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={seasonalTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="monthName" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ value: 'Avg Consumption (m³)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="average" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Conservation Recommendations */}
        <Card className="p-6 bg-white border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conservation Recommendations</h3>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-primary mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
