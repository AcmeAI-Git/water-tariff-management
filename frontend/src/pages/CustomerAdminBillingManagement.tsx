import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dropdown } from '../components/ui/Dropdown';
import { Search, CheckCircle2, Eye } from 'lucide-react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';

export function CustomerAdminBillingManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Fetch water bills
  const { data: waterBills = [], isLoading: billsLoading } = useApiQuery(
    ['water-bills'],
    () => api.waterBills.getAll()
  );

  // Fetch users for customer names
  const { data: users = [], isLoading: usersLoading } = useApiQuery(
    ['users'],
    () => api.users.getAll()
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

  // Create a map of userId to user for quick lookup
  const userMap = useMemo(() => {
    const map: Record<number, any> = {};
    users.forEach((user) => {
      map[user.id] = user;
    });
    return map;
  }, [users]);

  // Filter and search bills
  const filteredBills = useMemo(() => {
    let filtered = [...waterBills];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Filter by search query (customer name or meter number)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((b) => {
        const user = userMap[b.userId];
        if (!user) return false;
        const nameMatch = user.fullName?.toLowerCase().includes(query);
        const meterMatch = user.meterNo?.toLowerCase().includes(query);
        return nameMatch || meterMatch;
      });
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const dateA = a.billMonth ? new Date(a.billMonth).getTime() : 0;
      const dateB = b.billMonth ? new Date(b.billMonth).getTime() : 0;
      return dateB - dateA;
    });
  }, [waterBills, statusFilter, searchQuery, userMap]);

  const handleMarkAsPaid = async (billId: number) => {
    if (window.confirm('Are you sure you want to mark this bill as paid?')) {
      try {
        await markPaidMutation.mutateAsync(billId);
      } catch (error) {
        console.error('Failed to mark bill as paid:', error);
      }
    }
  };

  const handleViewDetails = (bill: any) => {
    setSelectedBill(bill);
    setIsDetailDialogOpen(true);
  };

  if (billsLoading || usersLoading) {
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
        <div className="mb-8">
          <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">Billing Management</h1>
          <p className="text-sm text-gray-500">View and manage customer water bills</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search by customer name or meter number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-300 rounded-lg h-11"
              />
            </div>
            <div className="w-48">
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredBills.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Meter Number</TableHead>
                  <TableHead>Bill Month</TableHead>
                  <TableHead>Total Bill</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => {
                  const user = userMap[bill.userId];
                  return (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">
                        {user?.fullName || 'Unknown'}
                      </TableCell>
                      <TableCell>{user?.meterNo || 'N/A'}</TableCell>
                      <TableCell>
                        {bill.billMonth
                          ? format(new Date(bill.billMonth), 'MMM yyyy')
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        ৳{bill.totalBill ? Number(bill.totalBill).toFixed(2) : '0.00'}
                      </TableCell>
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(bill)}
                            className="border-gray-300"
                          >
                            <Eye size={16} className="mr-1" />
                            View
                          </Button>
                          {bill.status !== 'Paid' && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkAsPaid(bill.id)}
                              disabled={markPaidMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle2 size={16} className="mr-1" />
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500">No bills found</p>
            </div>
          )}
        </div>

        {/* Bill Details Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Bill Details</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Detailed information about the water bill
              </DialogDescription>
            </DialogHeader>
            {selectedBill && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium text-gray-900">
                      {userMap[selectedBill.userId]?.fullName || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Meter Number</p>
                    <p className="font-medium text-gray-900">
                      {userMap[selectedBill.userId]?.meterNo || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bill Month</p>
                    <p className="font-medium text-gray-900">
                      {selectedBill.billMonth
                        ? format(new Date(selectedBill.billMonth), 'MMMM yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                        selectedBill.status === 'Paid'
                          ? 'bg-green-100 text-green-800'
                          : selectedBill.status === 'Overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {selectedBill.status || 'Unpaid'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Bill</p>
                    <p className="font-semibold text-lg text-gray-900">
                      ৳{selectedBill.totalBill ? Number(selectedBill.totalBill).toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created At</p>
                    <p className="font-medium text-gray-900">
                      {selectedBill.createdAt
                        ? format(new Date(selectedBill.createdAt), 'MMM dd, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                {selectedBill.breakdown && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Bill Breakdown</p>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto">
                      {JSON.stringify(selectedBill.breakdown, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
