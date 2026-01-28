import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Dropdown } from '../components/ui/Dropdown';
import { Search } from 'lucide-react';
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
    <div>
      <div className="mb-6 md:mb-8">
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

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        {bills.length > 0 ? (
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
                {bills.map((bill: { id: number; billMonth?: string; totalBill?: number | string; status?: string; breakdown?: any }) => (
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
          <p className="text-gray-500 text-center py-12">No bills found</p>
        )}
      </div>
    </div>
  );
}
