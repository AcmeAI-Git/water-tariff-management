import { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getStaticTranslation } from '../constants/staticTranslations';
import { api } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { MetricCard } from '../components/common/MetricCard';

/**
 * Customer Admin Metrics – only shows data available from the API.
 * GET /users: account, name, areaId, area, activeStatus. GET /water-bills: status (Paid/Unpaid), totalBill, billMonth.
 */
type UserShape = {
  account?: string;
  areaId?: number;
  area?: { id: number; name: string };
  activeStatus?: string;
  status?: string;
};

type BillShape = { status?: string; totalBill?: number | string };

export function CustomerAdminMetrics() {
  const { language } = useLanguage();
  const t = (key: string) => getStaticTranslation(language, key);
  const { data: users = [], isLoading: usersLoading } = useApiQuery(
    ['users'],
    () => api.users.getAll()
  );
  const { data: waterBills = [] } = useApiQuery(
    ['water-bills'],
    () => api.waterBills.getAll()
  );

  const userList = useMemo(() => (Array.isArray(users) ? users : []) as UserShape[], [users]);
  const billList = useMemo(() => (Array.isArray(waterBills) ? waterBills : []) as BillShape[], [waterBills]);

  const totalCustomers = userList.length;
  const activeCount = useMemo(
    () =>
      userList.filter(
        (u) => ((u.activeStatus ?? u.status) ?? '').toLowerCase() === 'active'
      ).length,
    [userList]
  );
  const inactiveCount = useMemo(
    () =>
      userList.filter(
        (u) => ((u.activeStatus ?? u.status) ?? '').toLowerCase() === 'inactive'
      ).length,
    [userList]
  );

  const paidCount = useMemo(
    () => billList.filter((b) => (b.status ?? '').toLowerCase() === 'paid').length,
    [billList]
  );
  const unpaidCount = useMemo(
    () => billList.filter((b) => (b.status ?? '').toLowerCase() === 'unpaid').length,
    [billList]
  );
  const totalBills = billList.length;

  const byArea = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of userList) {
      const areaName = u.area?.name ?? `Area ${u.areaId ?? '—'}`;
      map.set(areaName, (map.get(areaName) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [userList]);

  if (usersLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="px-4 md:px-8 py-4 md:py-6">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1 notranslate" translate="no">{t('pages.customerAdminMetricsTitle')}</h1>
          <p className="text-sm text-gray-500">Customers and billing in your area</p>
        </div>

        {/* Customers */}
        <h3 className="text-base font-semibold text-gray-900 mb-4">Customers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            label="Total Customers"
            value={totalCustomers}
            variant="green"
          />
          <MetricCard
            label="Active"
            value={activeCount}
            variant="blue"
            animationDelay={0.05}
          />
          <MetricCard
            label="Inactive"
            value={inactiveCount}
            variant="orange"
            animationDelay={0.1}
          />
        </div>

        {/* Billing – same API as Customer Admin Billing page */}
        <h3 className="text-base font-semibold text-gray-900 mb-4">Billing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            label="Total Bills"
            value={totalBills}
            variant="green"
          />
          <MetricCard
            label="Paid"
            value={paidCount}
            variant="blue"
            animationDelay={0.05}
          />
          <MetricCard
            label="Unpaid"
            value={unpaidCount}
            variant="orange"
            animationDelay={0.1}
          />
        </div>

        {byArea.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customers by area</h3>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <ul className="space-y-2">
                {byArea.map(({ name, count }) => (
                  <li key={name} className="flex justify-between text-gray-700">
                    <span>{name}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
