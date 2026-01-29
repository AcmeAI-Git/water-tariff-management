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
  const [billToMarkPaid, setBillToMarkPaid] = useState<any>(null);
  const [isMarkPaidDialogOpen, setIsMarkPaidDialogOpen] = useState(false);

  // Fetch water bills (bills already include nested user data)
  const { data: waterBills = [], isLoading: billsLoading } = useApiQuery(
    ['water-bills'],
    () => api.waterBills.getAll()
  );

  // Fetch meters to get meter numbers (water-bills API doesn't include meterNo)
  const { data: meters = [], isLoading: metersLoading } = useApiQuery(
    ['meters'],
    () => api.meters.getAll()
  );

  // Create a map of user account to meter number
  const meterMap = useMemo(() => {
    const map: Record<string, number | string> = {};
    meters.forEach((meter: any) => {
      const account = meter.account || meter.userAccount;
      if (account && meter.meterNo != null) {
        map[account] = meter.meterNo;
      }
    });
    return map;
  }, [meters]);

  // Mark as paid mutation
  const markPaidMutation = useApiMutation(
    (id: number) => api.waterBills.markPaid(id),
    {
      successMessage: 'Bill marked as paid',
      errorMessage: 'Failed to mark bill as paid',
      invalidateQueries: [['water-bills']],
    }
  );

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
        // Use nested user object from bill, or fallback to userAccount/userId
        const user = b.user || {};
        const name = String(user.name || user.fullName || '');
        const userAccount = b.userAccount || b.user?.account || b.user?.id?.toString();
        const meterNo = userAccount ? (meterMap[userAccount]?.toString() || '') : '';
        const nameMatch = name.toLowerCase().includes(query);
        const meterMatch = meterNo.toLowerCase().includes(query);
        return nameMatch || meterMatch;
      });
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const dateA = a.billMonth ? new Date(a.billMonth).getTime() : 0;
      const dateB = b.billMonth ? new Date(b.billMonth).getTime() : 0;
      return dateB - dateA;
    });
  }, [waterBills, statusFilter, searchQuery, meterMap]);

  const handleMarkAsPaidClick = (bill: any) => {
    setBillToMarkPaid(bill);
    setIsMarkPaidDialogOpen(true);
  };

  const handleMarkAsPaidConfirm = async () => {
    if (!billToMarkPaid) return;
    try {
      await markPaidMutation.mutateAsync(billToMarkPaid.id);
      setIsMarkPaidDialogOpen(false);
      setBillToMarkPaid(null);
    } catch (error) {
      console.error('Failed to mark bill as paid:', error);
    }
  };

  const handleMarkAsPaidCancel = () => {
    setIsMarkPaidDialogOpen(false);
    setBillToMarkPaid(null);
  };

  const handleViewDetails = (bill: any) => {
    setSelectedBill(bill);
    setIsDetailDialogOpen(true);
  };

  if (billsLoading || metersLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="px-4 md:px-8 py-4 md:py-6">
        {/* Header - centered on mobile to avoid hamburger overlap */}
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h1 className="text-xl md:text-[1.75rem] font-semibold text-gray-900 mb-1">Billing Management</h1>
          <p className="text-xs md:text-sm text-gray-500">View and manage customer water bills</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            <div className="relative flex-1 min-w-0 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 shrink-0" size={18} />
              <Input
                type="text"
                placeholder="Search by customer name or meter number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full min-w-0 bg-gray-50 border-gray-300 rounded-lg h-11"
              />
            </div>
            <div className="w-full sm:w-48 min-w-0">
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
                className="bg-gray-50 border-gray-300 rounded-lg w-full"
              />
            </div>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredBills.length > 0 ? (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle px-4 md:px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="text-sm font-semibold text-gray-700 min-w-[120px]">Customer Name</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 min-w-[90px] hidden sm:table-cell">Meter Number</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 min-w-[90px]">Bill Month</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 min-w-[90px]">Total Bill</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 min-w-[80px]">Status</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 text-right min-w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBills.map((bill) => {
                      // Use nested user object from bill
                      const user = bill.user || {};
                      const customerName = String(user.name || user.fullName || 'Unknown');
                      // Get meter number from meterMap since water-bills API doesn't include it
                      const userAccount = bill.userAccount || user.account || user.id?.toString();
                      const meterNo = userAccount 
                        ? (meterMap[userAccount]?.toString() || (user.waterStatus === 'Non-Metered' ? 'N/A' : 'N/A'))
                        : (user.waterStatus === 'Non-Metered' ? 'N/A' : 'N/A');
                      return (
                        <TableRow key={bill.id} className="border-gray-100">
                          <TableCell className="font-medium text-gray-900">{customerName}</TableCell>
                          <TableCell className="text-gray-600 hidden sm:table-cell whitespace-nowrap">{meterNo}</TableCell>
                          <TableCell className="text-gray-600 whitespace-nowrap">
                            {bill.billMonth
                              ? format(new Date(bill.billMonth), 'MMM yyyy')
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="font-semibold text-gray-900 whitespace-nowrap">
                            ৳{bill.totalBill ? Number(bill.totalBill).toFixed(2) : '0.00'}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap inline-block ${
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
                          <TableCell className="text-right align-middle">
                            <div className="flex items-center justify-end gap-1 sm:gap-2 flex-wrap">
                              {bill.status !== 'Paid' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleMarkAsPaidClick(bill)}
                                  disabled={markPaidMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 h-8"
                                >
                                  <CheckCircle2 size={14} className="sm:mr-1" />
                                  <span className="hidden sm:inline">Mark Paid</span>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(bill)}
                                className="border-gray-300 h-8 px-2 sm:px-3"
                              >
                                <Eye size={14} className="sm:mr-1" />
                                <span className="hidden sm:inline">View</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="p-8 md:p-12 text-center">
              <p className="text-gray-500">No bills found</p>
            </div>
          )}
        </div>

        {/* Bill Details Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 w-[calc(100%-2rem)]">
            <DialogHeader className="shrink-0">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">Bill Details</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Detailed information about the water bill
              </DialogDescription>
            </DialogHeader>
            {selectedBill && (
              <div className="space-y-4 py-4 overflow-y-auto overflow-x-hidden min-h-0 flex-1 pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium text-gray-900">
                      {selectedBill.user?.name || selectedBill.user?.fullName || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Meter Number</p>
                    <p className="font-medium text-gray-900">
                      {(() => {
                        const userAccount = selectedBill.userAccount || selectedBill.user?.account || selectedBill.user?.id?.toString();
                        return userAccount 
                          ? (meterMap[userAccount]?.toString() || (selectedBill.user?.waterStatus === 'Non-Metered' ? 'N/A' : 'N/A'))
                          : (selectedBill.user?.waterStatus === 'Non-Metered' ? 'N/A' : 'N/A');
                      })()}
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
                  {selectedBill.updatedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Updated At</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(selectedBill.updatedAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                  {selectedBill.tariffPlanId && (
                    <div>
                      <p className="text-sm text-gray-600">Tariff Plan ID</p>
                      <p className="font-medium text-gray-900">
                        {selectedBill.tariffPlanId}
                      </p>
                    </div>
                  )}
                  {selectedBill.tariffPlan && (
                    <div>
                      <p className="text-sm text-gray-600">Tariff Plan</p>
                      <p className="font-medium text-gray-900">
                        {(selectedBill.tariffPlan as any)?.name || 'N/A'}
                      </p>
                    </div>
                  )}
                  {selectedBill.consumptionId && (
                    <div>
                      <p className="text-sm text-gray-600">Consumption ID</p>
                      <p className="font-medium text-gray-900">
                        {selectedBill.consumptionId}
                      </p>
                    </div>
                  )}
                  {selectedBill.userId && (
                    <div>
                      <p className="text-sm text-gray-600">User ID</p>
                      <p className="font-medium text-gray-900">
                        {selectedBill.userId}
                      </p>
                    </div>
                  )}
                  {selectedBill.breakdown && (() => {
                    const breakdown = selectedBill.breakdown as any;
                    const zoneScore = breakdown.zoneScore;
                    return zoneScore != null ? (
                      <div>
                        <p className="text-sm text-gray-600">Zone Score</p>
                        <p className="font-medium text-gray-900">
                          {Number(zoneScore).toFixed(2)}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>
                {selectedBill.consumption && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Consumption Details</p>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2.5">
                      {selectedBill.consumption.currentReading != null && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                          <span className="text-gray-600">Current Reading</span>
                          <span className="font-medium text-gray-900">
                            {Number(selectedBill.consumption.currentReading).toFixed(2)} m³
                          </span>
                        </div>
                      )}
                      {selectedBill.consumption.previousReading != null && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                          <span className="text-gray-600">Previous Reading</span>
                          <span className="font-medium text-gray-900">
                            {Number(selectedBill.consumption.previousReading).toFixed(2)} m³
                          </span>
                        </div>
                      )}
                      {selectedBill.consumption.consumption != null && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm pt-2 border-t border-gray-200">
                          <span className="text-gray-600 font-semibold">Consumption</span>
                          <span className="font-semibold text-gray-900">
                            {Number(selectedBill.consumption.consumption).toFixed(2)} m³
                          </span>
                        </div>
                      )}
                      {selectedBill.consumption.billMonth && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                          <span className="text-gray-600">Bill Month</span>
                          <span className="font-medium text-gray-900">
                            {format(new Date(selectedBill.consumption.billMonth), 'MMMM yyyy')}
                          </span>
                        </div>
                      )}
                      {selectedBill.consumption.createdAt && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                          <span className="text-gray-600">Reading Date</span>
                          <span className="font-medium text-gray-900">
                            {format(new Date(selectedBill.consumption.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {selectedBill.breakdown && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Bill Calculation Breakdown</p>
                    {(() => {
                      const breakdown = selectedBill.breakdown as any;
                      // Get values directly from breakdown object (from API)
                      const consumption = breakdown.consumption || selectedBill.consumption?.consumption || 0;
                      const baseRate = breakdown.baseRate;
                      const zoneScore = breakdown.zoneScore;
                      const policy = breakdown.policy || 'UNKNOWN';
                      const preTaxTotal = breakdown.preTaxTotal;
                      const taxRate = breakdown.taxRate;
                      const taxAmount = breakdown.taxAmount;
                      const total = breakdown.total || selectedBill.totalBill || 0;

                      return (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                            <span className="text-gray-600">Water Consumption</span>
                            <span className="font-medium text-gray-900">{consumption.toFixed(2)} m³</span>
                          </div>
                          {policy && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                              <span className="text-gray-600">Policy</span>
                              <span className="font-medium text-gray-900">{policy.replace('_', ' ')}</span>
                            </div>
                          )}
                          {baseRate != null && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                              <span className="text-gray-600">Base Rate</span>
                              <span className="font-medium text-gray-900">৳{Number(baseRate).toFixed(2)}</span>
                            </div>
                          )}
                          {zoneScore != null && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                              <span className="text-gray-600">Zone Score</span>
                              <span className="font-medium text-gray-900">{Number(zoneScore).toFixed(2)}</span>
                            </div>
                          )}
                          {preTaxTotal != null && (
                            <div className="pt-2 border-t border-gray-200">
                              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                                <span className="text-gray-600">Pre-tax Amount</span>
                                <span className="font-semibold text-gray-900">৳{Number(preTaxTotal).toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                          {taxRate != null && taxAmount != null && taxRate > 0 && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                              <span className="text-gray-600">Tax ({(Number(taxRate) * 100).toFixed(1)}%)</span>
                              <span className="font-medium text-gray-900">৳{Number(taxAmount).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="pt-2 border-t-2 border-gray-300">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="text-sm font-semibold text-gray-900">Total Bill</span>
                              <span className="text-lg font-bold text-gray-900">৳{Number(total).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Mark Paid Confirmation Dialog */}
        <Dialog open={isMarkPaidDialogOpen} onOpenChange={setIsMarkPaidDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-white p-4 sm:p-6 w-[calc(100%-2rem)]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">Mark Bill as Paid</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Are you sure you want to mark this bill as paid?
              </DialogDescription>
            </DialogHeader>
            {billToMarkPaid && (
              <div className="space-y-4 py-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium text-gray-900">
                      {billToMarkPaid.user?.name || billToMarkPaid.user?.fullName || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                    <span className="text-gray-600">Bill Month:</span>
                    <span className="font-medium text-gray-900">
                      {billToMarkPaid.billMonth
                        ? format(new Date(billToMarkPaid.billMonth), 'MMMM yyyy')
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold text-gray-900">
                      ৳{billToMarkPaid.totalBill ? Number(billToMarkPaid.totalBill).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleMarkAsPaidCancel}
                    disabled={markPaidMutation.isPending}
                    className="border-gray-300 w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleMarkAsPaidConfirm}
                    disabled={markPaidMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                  >
                    {markPaidMutation.isPending ? 'Marking...' : 'Mark as Paid'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
