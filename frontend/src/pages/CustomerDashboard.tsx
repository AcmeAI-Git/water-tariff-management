import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Droplet, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { format } from 'date-fns';
import type { User } from '../types';

function getCustomerUser(): User | null {
  try {
    const raw = localStorage.getItem('customerUser');
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const customer = getCustomerUser();
  // Backend uses account (UUID string) - prioritize account over id
  const userAccount = customer?.account || customer?.id?.toString();

  const { data: allBills = [], isLoading: billsLoading } = useApiQuery(
    ['water-bills'],
    () => api.waterBills.getAll(),
    { enabled: !!userAccount }
  );

  const { data: allConsumption = [], isLoading: consumptionLoading } = useApiQuery(
    ['consumption'],
    () => api.consumption.getAll(),
    { enabled: !!userAccount }
  );

  const bills = useMemo(() => {
    if (!userAccount) return [];
    return allBills
      .filter((b: { userAccount?: string; userId?: number; user?: { account?: string; id?: number } }) => {
        // Backend returns userAccount (UUID string) or userId (number)
        // Also check nested user object
        const billAccount = b.userAccount || b.userId || b.user?.account || b.user?.id;
        return String(billAccount) === String(userAccount);
      })
      .sort((a, b) => {
        const tA = a.billMonth ? new Date(a.billMonth).getTime() : 0;
        const tB = b.billMonth ? new Date(b.billMonth).getTime() : 0;
        return tB - tA;
      });
  }, [allBills, userAccount]);

  const consumptions = useMemo(() => {
    if (!userAccount) return [];
    return allConsumption
      .filter((c: { userAccount?: string; account?: string | number; userId?: number }) => {
        const consAccount = c.userAccount || c.account || c.userId;
        return String(consAccount) === String(userAccount);
      })
      .sort((a, b) => {
        const tA = a.billMonth ? new Date(a.billMonth).getTime() : 0;
        const tB = b.billMonth ? new Date(b.billMonth).getTime() : 0;
        return tA - tB; // Sort ascending for chart
      });
  }, [allConsumption, userAccount]);

  // Group consumption by month for chart
  const monthlyData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    consumptions.forEach((c) => {
      if (c.billMonth && c.consumption !== undefined && c.consumption !== null) {
        const monthKey = format(new Date(c.billMonth), 'yyyy-MM');
        const consumptionValue = Math.max(0, Number(c.consumption));
        grouped[monthKey] = (grouped[monthKey] || 0) + consumptionValue;
      }
    });

    return Object.entries(grouped)
      .map(([month, consumption]) => ({
        month,
        monthLabel: format(new Date(month + '-01'), 'MMM yyyy'),
        consumption: Number(Number(consumption).toFixed(2)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }, [consumptions]);

  // Calculate analytics stats
  const analyticsStats = useMemo(() => {
    const consumptions = monthlyData.map((d) => d.consumption);
    if (consumptions.length === 0) {
      return {
        average: 0,
        highest: { value: 0, month: '' },
        lowest: { value: 0, month: '' },
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

    return {
      average: Number(average.toFixed(2)),
      highest: { value: highest.consumption, month: highest.monthLabel },
      lowest: { value: lowest.consumption, month: lowest.monthLabel },
    };
  }, [monthlyData]);


  const recentConsumptions = consumptions.slice(-5).reverse(); // Last 5, newest first
  const recentBills = bills.slice(0, 5);

  if (!userAccount) {
    navigate('/login', { replace: true });
    return null;
  }

  if (billsLoading || consumptionLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">
          Welcome, {customer?.fullName || customer?.name || 'Customer'}
        </h1>
        <p className="text-sm text-gray-500">
          Overview of your water usage and bills
        </p>
      </div>

      {/* Analytics Stats Cards */}
      {monthlyData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-5 md:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Average</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-900">{analyticsStats.average}</p>
                <p className="text-sm text-blue-600 mt-1">m³/month</p>
              </div>
              <div className="p-2 bg-blue-200/50 rounded-lg">
                <Droplet className="text-blue-700" size={20} />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-5 md:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-red-700 uppercase tracking-wide mb-1">Peak</p>
                <p className="text-2xl md:text-3xl font-bold text-red-900">{analyticsStats.highest.value}</p>
                <p className="text-sm text-red-600 mt-1">{analyticsStats.highest.month}</p>
              </div>
              <div className="p-2 bg-red-200/50 rounded-lg">
                <TrendingUp className="text-red-700" size={20} />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-5 md:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Lowest</p>
                <p className="text-2xl md:text-3xl font-bold text-green-900">{analyticsStats.lowest.value}</p>
                <p className="text-sm text-green-600 mt-1">{analyticsStats.lowest.month}</p>
              </div>
              <div className="p-2 bg-green-200/50 rounded-lg">
                <TrendingDown className="text-green-700" size={20} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Usage */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">
            Recent usage
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/customer/billing')}
            className="text-primary hover:text-primary/80"
          >
            View billing <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
        {recentConsumptions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Month</TableHead>
                  <TableHead className="text-xs md:text-sm hidden sm:table-cell">Current</TableHead>
                  <TableHead className="text-xs md:text-sm hidden md:table-cell">Previous</TableHead>
                  <TableHead className="text-xs md:text-sm">Consumption (m³)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentConsumptions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs md:text-sm">
                      {c.billMonth ? format(new Date(c.billMonth), 'MMM yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm hidden sm:table-cell">
                      {c.currentReading != null ? Number(c.currentReading).toFixed(2) : '—'}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm hidden md:table-cell">
                      {c.previousReading != null ? Number(c.previousReading).toFixed(2) : '—'}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">
                      {c.consumption != null ? Math.max(0, Number(c.consumption)).toFixed(2) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8 text-sm">No usage data yet</p>
        )}
      </div>

      {/* Recent Bills */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">
            Recent bills
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/customer/billing')}
            className="text-primary hover:text-primary/80"
          >
            View all <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
        {recentBills.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Month</TableHead>
                  <TableHead className="text-xs md:text-sm">Amount</TableHead>
                  <TableHead className="text-xs md:text-sm">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="text-xs md:text-sm">
                      {bill.billMonth ? format(new Date(bill.billMonth), 'MMM yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm font-medium">
                      ৳{bill.totalBill != null ? Number(bill.totalBill).toFixed(2) : '0.00'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          bill.status === 'Paid'
                            ? 'bg-green-100 text-green-800'
                            : bill.status === 'Overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {bill.status || 'Unpaid'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8 text-sm">No bills yet</p>
        )}
      </div>

      {/* Consumption Trends Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mt-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
            Consumption Trends (Last 12 Months)
          </h2>
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
                width={80}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }}
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
        </div>
      )}
    </div>
  );
}
