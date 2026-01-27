import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dropdown } from '../components/ui/Dropdown';
import { Search, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { format } from 'date-fns';

export default function CustomerBillingHistory() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get logged-in customer
  const customerUserStr = localStorage.getItem('customerUser');
  const customerUser = customerUserStr ? JSON.parse(customerUserStr) : null;
  const userId = customerUser?.id;

  // Fetch water bills
  const { data: waterBills = [], isLoading: billsLoading } = useApiQuery(
    ['water-bills', userId],
    () => api.waterBills.getAll(userId),
    { enabled: !!userId }
  );

  // Mark as paid mutation
  const markPaidMutation = useApiMutation(
    (id: number) => api.waterBills.markPaid(id),
    {
      successMessage: 'Bill marked as paid',
      errorMessage: 'Failed to mark bill as paid',
      invalidateQueries: [['water-bills']],
    }
  );

  // Filter bills for current user
  const userBills = useMemo(() => {
    if (!userId) return [];
    return waterBills.filter((b) => b.userId === userId);
  }, [waterBills, userId]);

  // Filter and sort bills
  const filteredBills = useMemo(() => {
    let filtered = [...userBills];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Filter by search query (bill month)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((b) => {
        if (b.billMonth) {
          const monthStr = format(new Date(b.billMonth), 'MMM yyyy').toLowerCase();
          return monthStr.includes(query);
        }
        return false;
      });
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const dateA = a.billMonth ? new Date(a.billMonth).getTime() : 0;
      const dateB = b.billMonth ? new Date(b.billMonth).getTime() : 0;
      return dateB - dateA;
    });
  }, [userBills, statusFilter, searchQuery]);

  const handleMarkAsPaid = async (billId: number) => {
    if (window.confirm('Are you sure you want to mark this bill as paid?')) {
      try {
        await markPaidMutation.mutateAsync(billId);
      } catch (error) {
        console.error('Failed to mark bill as paid:', error);
      }
    }
  };

  if (billsLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="px-4 md:px-8 py-4 md:py-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-[1.75rem] font-semibold text-gray-900 mb-1">Billing History</h1>
          <p className="text-xs md:text-sm text-gray-500">View and manage your water bills</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search by month..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-300 rounded-lg h-11"
              />
            </div>
            <div className="w-full sm:w-48">
              <Dropdown
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Paid', label: 'Paid' },
                  { value: 'Unpaid', label: 'Unpaid' },
                  { value: 'Overdue', label: 'Overdue' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Filter by Status"
                className="bg-gray-50 border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
          {filteredBills.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm whitespace-nowrap">Bill Month</TableHead>
                  <TableHead className="text-xs md:text-sm whitespace-nowrap hidden sm:table-cell">Consumption (m³)</TableHead>
                  <TableHead className="text-xs md:text-sm whitespace-nowrap">Total Bill</TableHead>
                  <TableHead className="text-xs md:text-sm whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-xs md:text-sm whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="text-xs md:text-sm font-medium whitespace-nowrap">
                      {bill.billMonth
                        ? format(new Date(bill.billMonth), 'MMM yyyy')
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm whitespace-nowrap hidden sm:table-cell">
                      {/* Get consumption from related consumption record if available */}
                      {bill.consumptionId ? 'N/A' : 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">
                      ৳{bill.totalBill ? Number(bill.totalBill).toFixed(2) : '0.00'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
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
                    <TableCell className="whitespace-nowrap">
                      {bill.status !== 'Paid' && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsPaid(bill.id)}
                          disabled={markPaidMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm"
                        >
                          <CheckCircle2 size={16} className="mr-1" />
                          Mark as Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 md:p-12 text-center">
              <p className="text-sm text-gray-500">No bills found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
