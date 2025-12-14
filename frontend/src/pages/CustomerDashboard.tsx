import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Droplet, FileText, TrendingUp, BarChart3, MessageSquare, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { format } from 'date-fns';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  
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

  // Fetch water bills
  const { data: waterBills = [], isLoading: billsLoading } = useApiQuery(
    ['water-bills', userId],
    () => api.waterBills.getAll(userId),
    { enabled: !!userId }
  );

  // Filter data for current user
  const userConsumptions = useMemo(() => {
    if (!userId) return [];
    return consumptions
      .filter((c) => c.userId === userId)
      .sort((a, b) => {
        const dateA = a.billMonth ? new Date(a.billMonth).getTime() : 0;
        const dateB = b.billMonth ? new Date(b.billMonth).getTime() : 0;
        return dateB - dateA;
      });
  }, [consumptions, userId]);

  const userBills = useMemo(() => {
    if (!userId) return [];
    return waterBills
      .filter((b) => b.userId === userId)
      .sort((a, b) => {
        const dateA = a.billMonth ? new Date(a.billMonth).getTime() : 0;
        const dateB = b.billMonth ? new Date(b.billMonth).getTime() : 0;
        return dateB - dateA;
      });
  }, [waterBills, userId]);

  // Calculate stats
  const stats = useMemo(() => {
    const currentMonth = new Date();
    const currentMonthStr = format(currentMonth, 'yyyy-MM');
    
    const currentMonthConsumption = userConsumptions.find(
      (c) => c.billMonth && format(new Date(c.billMonth), 'yyyy-MM') === currentMonthStr
    );
    
    const pendingBills = userBills.filter((b) => b.status === 'Unpaid' || b.status === 'Overdue').length;
    const totalBills = userBills.length;
    
    return {
      currentConsumption: currentMonthConsumption?.consumption || 0,
      pendingBills,
      totalBills,
    };
  }, [userConsumptions, userBills]);

  // Get recent records
  const recentConsumptions = userConsumptions.slice(0, 5);
  const recentBills = userBills.slice(0, 5);

  if (consumptionsLoading || billsLoading) {
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
          <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">
            Welcome back, {customerUser?.fullName || 'Customer'}!
          </h1>
          <p className="text-sm text-gray-500">Here's an overview of your water usage and bills</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Month Consumption</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.currentConsumption.toFixed(2)} m³</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Droplet className="text-blue-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Bills</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingBills}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <FileText className="text-orange-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bills</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalBills}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <FileText className="text-green-600" size={24} />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 border-gray-200 hover:bg-gray-50"
            onClick={() => navigate('/customer/billing')}
          >
            <FileText size={24} className="text-primary" />
            <span className="text-sm font-medium">Billing History</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 border-gray-200 hover:bg-gray-50"
            onClick={() => navigate('/customer/visualizer')}
          >
            <TrendingUp size={24} className="text-primary" />
            <span className="text-sm font-medium">Tariff Visualizer</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 border-gray-200 hover:bg-gray-50"
            onClick={() => navigate('/customer/analytics')}
          >
            <BarChart3 size={24} className="text-primary" />
            <span className="text-sm font-medium">Usage Analytics</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 border-gray-200 hover:bg-gray-50"
            onClick={() => navigate('/customer/feedback')}
          >
            <MessageSquare size={24} className="text-primary" />
            <span className="text-sm font-medium">Feedback</span>
          </Button>
        </div>

        {/* Recent Usage History */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Usage History</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/customer/analytics')}
              className="text-primary hover:text-primary-600"
            >
              View All <ArrowRight size={16} className="ml-1" />
            </Button>
          </div>
          {recentConsumptions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill Month</TableHead>
                    <TableHead>Current Reading</TableHead>
                    <TableHead>Previous Reading</TableHead>
                    <TableHead>Consumption (m³)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentConsumptions.map((consumption) => (
                    <TableRow key={consumption.id}>
                      <TableCell>
                        {consumption.billMonth
                          ? format(new Date(consumption.billMonth), 'MMM yyyy')
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{consumption.currentReading?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell>{consumption.previousReading?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell>{consumption.consumption?.toFixed(2) || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No usage history available</p>
          )}
        </div>

        {/* Recent Billing History */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Billing History</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/customer/billing')}
              className="text-primary hover:text-primary-600"
            >
              View All <ArrowRight size={16} className="ml-1" />
            </Button>
          </div>
          {recentBills.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill Month</TableHead>
                    <TableHead>Total Bill</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell>
                        {bill.billMonth
                          ? format(new Date(bill.billMonth), 'MMM yyyy')
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="font-semibold">৳{bill.totalBill?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bill.status === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : bill.status === 'Overdue'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
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
            <p className="text-gray-500 text-center py-8">No billing history available</p>
          )}
        </div>
      </div>
    </div>
  );
}
