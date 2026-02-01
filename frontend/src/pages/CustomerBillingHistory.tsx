import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dropdown } from '../components/ui/Dropdown';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Search, Eye } from 'lucide-react';
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

export default function CustomerBillingHistory() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const customer = getCustomerUser();
  // Backend uses account (UUID string) - prioritize account over id
  const userAccount = customer?.account || customer?.id?.toString();

  const { data: allBills = [], isLoading } = useApiQuery(
    ['water-bills'],
    () => api.waterBills.getAll(),
    { enabled: !!userAccount }
  );


  const bills = useMemo(() => {
    if (!userAccount) return [];
    
    let list = allBills.filter((b: { userAccount?: string; userId?: number; user?: { account?: string; id?: number } }) => {
      // Backend returns userAccount (UUID string) or userId (number)
      // Also check nested user object
      const billAccount = b.userAccount || b.userId || b.user?.account || b.user?.id;
      return String(billAccount) === String(userAccount);
    });
    if (statusFilter !== 'all') {
      list = list.filter((b) => (b.status || '').toLowerCase() === statusFilter.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) => {
        if (b.billMonth) {
          const monthStr = format(new Date(b.billMonth), 'MMM yyyy').toLowerCase();
          if (monthStr.includes(q)) return true;
        }
        return false;
      });
    }
    return list.sort((a, b) => {
      const tA = a.billMonth ? new Date(a.billMonth).getTime() : 0;
      const tB = b.billMonth ? new Date(b.billMonth).getTime() : 0;
      return tB - tA;
    });
  }, [allBills, userAccount, statusFilter, search]);

  const handleViewDetails = (bill: any) => {
    setSelectedBill(bill);
    setIsDetailDialogOpen(true);
  };

  if (!userAccount) return null;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Overdue', label: 'Overdue' },
  ];

  return (
    <div className="min-h-screen bg-app">
      <div className="px-4 md:px-8 py-4 md:py-6">
        {/* Header - centered on mobile to avoid hamburger overlap */}
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">
            Billing History
          </h1>
          <p className="text-sm text-gray-500">View and manage your water bills</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              placeholder="Search by month..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dropdown
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Status"
            className="w-full sm:w-[180px]"
          />
        </div>

        {/* Bills table - Admin-style card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 md:p-8 hover:border-gray-300 hover:shadow-md transition-all duration-300">
        {bills.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Month</TableHead>
                  <TableHead className="text-xs md:text-sm">Amount</TableHead>
                  <TableHead className="text-xs md:text-sm">Status</TableHead>
                  <TableHead className="text-xs md:text-sm text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill: { id: number; billMonth?: string; totalBill?: number | string; status?: string; breakdown?: any; user?: any; userAccount?: string; userId?: number; consumption?: any; consumptionId?: number; tariffPlanId?: number; tariffPlan?: any; createdAt?: string; updatedAt?: string }) => (
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
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(bill)}
                        className="border-gray-300 h-8 px-2 sm:px-3"
                      >
                        <Eye size={14} className="sm:mr-1" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">No bills found</p>
        )}
        </div>

        {/* Bill Details Dialog - same as Customer Admin Billing Management */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 w-[calc(100%-2rem)]">
            <DialogHeader className="shrink-0">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">Bill Details</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Detailed information about your water bill
              </DialogDescription>
            </DialogHeader>
            {selectedBill && (
              <div className="space-y-4 py-4 overflow-y-auto overflow-x-hidden min-h-0 flex-1 pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium text-gray-900">
                      {selectedBill.user?.name || selectedBill.user?.fullName || customer?.name || customer?.fullName || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bill Month</p>
                    <p className="font-medium text-gray-900">
                      {selectedBill.billMonth ? format(new Date(selectedBill.billMonth), 'MMMM yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                        selectedBill.status === 'Paid' ? 'bg-green-100 text-green-800'
                          : selectedBill.status === 'Overdue' ? 'bg-red-100 text-red-800'
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
                      {selectedBill.createdAt ? format(new Date(selectedBill.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                  {selectedBill.updatedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Updated At</p>
                      <p className="font-medium text-gray-900">{format(new Date(selectedBill.updatedAt), 'MMM dd, yyyy')}</p>
                    </div>
                  )}
                  {selectedBill.tariffPlanId && (
                    <div>
                      <p className="text-sm text-gray-600">Tariff Plan ID</p>
                      <p className="font-medium text-gray-900">{selectedBill.tariffPlanId}</p>
                    </div>
                  )}
                  {selectedBill.tariffPlan && (
                    <div>
                      <p className="text-sm text-gray-600">Tariff Plan</p>
                      <p className="font-medium text-gray-900">{(selectedBill.tariffPlan as any)?.name || 'N/A'}</p>
                    </div>
                  )}
                  {selectedBill.consumptionId && (
                    <div>
                      <p className="text-sm text-gray-600">Consumption ID</p>
                      <p className="font-medium text-gray-900">{selectedBill.consumptionId}</p>
                    </div>
                  )}
                  {selectedBill.breakdown && (() => {
                    const breakdown = selectedBill.breakdown as any;
                    const zoneScore = breakdown.zoneScore;
                    return zoneScore != null ? (
                      <div>
                        <p className="text-sm text-gray-600">Zone Score</p>
                        <p className="font-medium text-gray-900">{Number(zoneScore).toFixed(2)}</p>
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
                          <span className="font-medium text-gray-900">{Number(selectedBill.consumption.currentReading).toFixed(2)} m³</span>
                        </div>
                      )}
                      {selectedBill.consumption.previousReading != null && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                          <span className="text-gray-600">Previous Reading</span>
                          <span className="font-medium text-gray-900">{Number(selectedBill.consumption.previousReading).toFixed(2)} m³</span>
                        </div>
                      )}
                      {selectedBill.consumption.consumption != null && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm pt-2 border-t border-gray-200">
                          <span className="text-gray-600 font-semibold">Consumption</span>
                          <span className="font-semibold text-gray-900">{Number(selectedBill.consumption.consumption).toFixed(2)} m³</span>
                        </div>
                      )}
                      {selectedBill.consumption.billMonth && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                          <span className="text-gray-600">Bill Month</span>
                          <span className="font-medium text-gray-900">{format(new Date(selectedBill.consumption.billMonth), 'MMMM yyyy')}</span>
                        </div>
                      )}
                      {selectedBill.consumption.createdAt && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                          <span className="text-gray-600">Reading Date</span>
                          <span className="font-medium text-gray-900">{format(new Date(selectedBill.consumption.createdAt), 'MMM dd, yyyy')}</span>
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
                      const consumption = breakdown.consumption || selectedBill.consumption?.consumption || 0;
                      const baseRate = breakdown.baseRate;
                      const zoneScore = breakdown.zoneScore;
                      const policyRaw = breakdown.policy || 'UNKNOWN';
                      const policyLabel = policyRaw === 'AREA_BASED' ? 'Area Based' : policyRaw === 'FIXED' ? 'Fixed' : policyRaw === 'THRESHOLD' ? 'Volumetric' : policyRaw.replace(/_/g, ' ');
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
                          {policyRaw && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                              <span className="text-gray-600">Policy</span>
                              <span className="font-medium text-gray-900">{policyLabel}</span>
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
      </div>
    </div>
  );
}
