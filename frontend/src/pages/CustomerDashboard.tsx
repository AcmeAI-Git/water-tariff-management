import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getStaticTranslation } from '../constants/staticTranslations';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { MetricCard } from '../components/common/MetricCard';
import { useApiQuery } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { format } from 'date-fns';
import type { User, WaterBill } from '../types';

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
  const { language } = useLanguage();
  const t = (key: string) => getStaticTranslation(language, key);
  const customer = getCustomerUser();
  // Backend uses account (UUID string) - prioritize account over id
  const userAccount = customer?.account || customer?.id?.toString();

  const { data: allBills = [], isLoading: billsLoading } = useApiQuery(
    ['water-bills'],
    () => api.waterBills.getAll(),
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

  // Extract consumption data from bills (each bill has nested consumption object)
  const consumptions = useMemo(() => {
    if (!userAccount) return [];
    return bills
      .filter((bill): bill is WaterBill & { consumption: NonNullable<WaterBill['consumption']> } => 
        !!bill.consumption && !!bill.consumption.id && !!bill.consumption.billMonth
      )
      .map((bill) => ({
        id: bill.consumption.id,
        billMonth: bill.consumption.billMonth,
        currentReading: bill.consumption.currentReading,
        previousReading: bill.consumption.previousReading,
        consumption: bill.consumption.consumption,
      }))
      .sort((a, b) => {
        const tA = a.billMonth ? new Date(a.billMonth).getTime() : 0;
        const tB = b.billMonth ? new Date(b.billMonth).getTime() : 0;
        return tA - tB; // Sort ascending for chart
      });
  }, [bills, userAccount]);

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

  if (!userAccount) {
    navigate('/customer/login', { replace: true });
    return null;
  }

  if (billsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="px-4 md:px-8 py-4 md:py-6">
        {/* Header - centered on mobile to avoid hamburger overlap */}
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">
            Welcome, {customer?.fullName || customer?.name || 'Customer'}
          </h1>
          <p className="text-sm text-gray-500 notranslate" translate="no">
            {t('pages.overviewSubtitle')}
          </p>
        </div>

        {/* Analytics Stats - all MetricCard for consistent styling */}
        {monthlyData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricCard
              label={t('pages.averageConsumption')}
              value={
                <span className="flex items-baseline justify-center gap-2">
                  <span>{analyticsStats.average}</span>
                  <span className="text-xl text-gray-600 font-medium">m³</span>
                </span>
              }
              subtitle={t('pages.perMonth')}
              variant="blue"
            />
            <MetricCard
              label={t('pages.peak')}
              value={analyticsStats.highest.value}
              subtitle={analyticsStats.highest.month}
              variant="green"
              animationDelay={0.05}
            />
            <MetricCard
              label={t('pages.lowest')}
              value={analyticsStats.lowest.value}
              subtitle={analyticsStats.lowest.month}
              variant="green"
              animationDelay={0.1}
            />
          </div>
        )}

        {/* Recent Usage - Admin-style card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 md:p-8 hover:border-gray-300 hover:shadow-md transition-all duration-300 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 notranslate" translate="no">
            {t('pages.recentUsage')}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/customer/billing')}
            className="text-primary hover:text-primary/80"
          >
            <span className="notranslate" translate="no">{t('pages.viewBilling')}</span> <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
        {recentConsumptions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm notranslate" translate="no">{t('pages.month')}</TableHead>
                  <TableHead className="text-xs md:text-sm hidden sm:table-cell notranslate" translate="no">{t('pages.current')}</TableHead>
                  <TableHead className="text-xs md:text-sm hidden md:table-cell notranslate" translate="no">{t('pages.previous')}</TableHead>
                  <TableHead className="text-xs md:text-sm notranslate" translate="no">{t('pages.consumptionM3')}</TableHead>
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
                      {c.consumption != null ? Number(c.consumption).toFixed(2) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8 text-sm notranslate" translate="no">{t('pages.noUsageDataYet')}</p>
        )}
      </div>

        {/* Consumption Trends Chart - Admin-style card */}
        {monthlyData.length > 0 && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 md:p-8 hover:border-gray-300 hover:shadow-md transition-all duration-300 mt-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4 notranslate" translate="no">
              {t('pages.consumptionTrendsTitle')}
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
    </div>
  );
}
