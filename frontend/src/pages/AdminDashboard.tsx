import { Button } from "../components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { motion } from "motion/react";
import { useState, useEffect, useMemo } from "react";
import { api } from "../services/api";
import { useApiQuery } from "../hooks/useApiQuery";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { MetricHeroCard } from "../components/common/MetricHeroCard";
import { MetricCard } from "../components/common/MetricCard";
import { MetricStatsCard } from "../components/common/MetricStatsCard";

export default function AdminDashboard() {
    const [animatedConsumers, setAnimatedConsumers] = useState(0);
    const [animatedConsumption, setAnimatedConsumption] = useState(0);
    const [revenueView, setRevenueView] = useState<'monthly' | 'yearly'>('monthly');

    // Fetch data for metrics
    const { data: users = [], isLoading: usersLoading } = useApiQuery(
        ['users'],
        () => api.users.getAll()
    );

    // Fetch additional data for enhanced metrics
    const { data: zones = [], isLoading: zonesLoading } = useApiQuery(
        ['zones'],
        () => api.zones.getAll()
    );

    const { data: meters = [], isLoading: metersLoading } = useApiQuery(
        ['meters'],
        () => api.meters.getAll()
    );

    const { data: tariffCategorySettings = [], isLoading: tariffCategorySettingsLoading } = useApiQuery(
        ['tariff-category-settings'],
        () => api.tariffCategorySettings.getAll()
    );

    const { data: tariffCategories = [], isLoading: tariffCategoriesLoading } = useApiQuery(
        ['tariff-categories'],
        () => api.tariffCategory.getAll()
    );

    const { data: wasas = [], isLoading: wasasLoading } = useApiQuery(
        ['wasas'],
        () => api.wasas.getAll()
    );

    // Fetch water bills for revenue calculations
    const { data: waterBills = [], isLoading: waterBillsLoading } = useApiQuery(
        ['water-bills'],
        () => api.waterBills.getAll()
    );

    // Fetch consumption data for average consumption calculation
    const { data: consumptions = [], isLoading: consumptionsLoading } = useApiQuery(
        ['consumption'],
        () => api.consumption.getAll()
    );

    // Calculate metrics
    const totalConsumers = users.length;
    const totalZones = zones.length;
    const totalMeters = meters.length;
    const totalTariffSettings = tariffCategorySettings.length;
    const totalTariffCategories = tariffCategories.length;
    const totalWasas = wasas.length;
    
    // Calculate new consumers this month
    const newConsumersThisMonth = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return users.filter(user => {
            if (!user.createdAt) return false;
            const createdDate = new Date(user.createdAt);
            return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
        }).length;
    }, [users]);

    // Calculate consumption entries this month
    const consumptionEntriesThisMonth = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return consumptions.filter(consumption => {
            if (!consumption.createdAt) return false;
            const createdDate = new Date(consumption.createdAt);
            return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
        }).length;
    }, [consumptions]);
    
    // Calculate average consumption from consumption data
    const avgConsumption = useMemo(() => {
        if (consumptions.length === 0) return 0;
        const totalConsumption = consumptions.reduce((sum, c) => {
            // Use the consumption field directly if available (backend already calculates it)
            // Fallback to calculating from readings if consumption field is missing
            let consumption = 0;
            if (c.consumption !== undefined && c.consumption !== null) {
                consumption = typeof c.consumption === 'number' 
                    ? c.consumption 
                    : Number(c.consumption) || 0;
            } else {
                // Fallback: calculate from readings if consumption field not available
                const current = typeof c.currentReading === 'number' 
                    ? c.currentReading 
                    : Number(c.currentReading) || 0;
                const previous = typeof c.previousReading === 'number' 
                    ? c.previousReading 
                    : Number(c.previousReading) || 0;
                consumption = current - previous;
            }
            return sum + Math.max(0, consumption); // Ensure non-negative
        }, 0);
        return parseFloat((totalConsumption / consumptions.length).toFixed(1));
    }, [consumptions]);

    // Calculate bill payment statistics
    const billStats = useMemo(() => {
        const paid = waterBills.filter(bill => bill.status === 'Paid').length;
        const unpaid = waterBills.filter(bill => bill.status === 'Unpaid').length;
        const overdue = waterBills.filter(bill => bill.status === 'Overdue').length;
        const total = waterBills.length;
        const collectionRate = total > 0 ? ((paid / total) * 100).toFixed(1) : '0';
        
        const avgBillAmount = total > 0 
            ? waterBills.reduce((sum, bill) => {
                const billAmount = typeof bill.totalBill === 'number' 
                    ? bill.totalBill 
                    : Number(bill.totalBill) || 0;
                return sum + billAmount;
            }, 0) / total
            : 0;

        return { paid, unpaid, overdue, total, collectionRate, avgBillAmount };
    }, [waterBills]);

    // Calculate active vs inactive users
    const userStats = useMemo(() => {
        const active = users.filter(user => {
            // Check both activeStatus (from API) and status (from User type)
            const status = (user as any).activeStatus || user.status || '';
            return status.toLowerCase() === 'active';
        }).length;
        const inactive = users.length - active;
        const activePercentage = users.length > 0 ? ((active / users.length) * 100).toFixed(1) : '0';
        return { active, inactive, activePercentage };
    }, [users]);

    useEffect(() => {
        if (!usersLoading && totalConsumers > 0) {
            const duration = 2000;
            const steps = 60;
            const interval = duration / steps;

            let step = 0;
            const timer = setInterval(() => {
                step++;
                const progress = step / steps;

                setAnimatedConsumers(Math.floor(totalConsumers * progress));
                setAnimatedConsumption(parseFloat((avgConsumption * progress).toFixed(1)));

                if (step >= steps) {
                    clearInterval(timer);
                }
            }, interval);

            return () => clearInterval(timer);
        }
    }, [usersLoading, totalConsumers, avgConsumption]);

    // Prepare revenue data grouped by month or year from water bills
    const revenueData = useMemo(() => {
        if (revenueView === 'yearly') {
            // Group by year
            const yearlyRevenue: Record<string, number> = {};
            waterBills.forEach(bill => {
                try {
                    const billDate = new Date(bill.billMonth);
                    const year = billDate.getFullYear().toString();
                    const billAmount = typeof bill.totalBill === 'number' 
                        ? bill.totalBill 
                        : Number(bill.totalBill) || 0;
                    yearlyRevenue[year] = (yearlyRevenue[year] || 0) + billAmount;
                } catch {
                    // Skip invalid dates
                }
            });
            
            // Convert to array and sort by year
            const entries = Object.entries(yearlyRevenue)
                .map(([year, revenue]) => ({ month: year, revenue }))
                .sort((a, b) => parseInt(a.month) - parseInt(b.month))
                .slice(-10); // Last 10 years
            
            return entries;
        } else {
            // Group by month-year for proper sorting
            const monthlyRevenue: Record<string, { month: string; year: number; revenue: number }> = {};
            waterBills.forEach(bill => {
                try {
                    const billDate = new Date(bill.billMonth);
                    const year = billDate.getFullYear();
                    const month = billDate.toLocaleDateString('en-US', { month: 'short' });
                    const key = `${year}-${billDate.getMonth()}`; // Unique key for sorting
                    const billAmount = typeof bill.totalBill === 'number' 
                        ? bill.totalBill 
                        : Number(bill.totalBill) || 0;
                    
                    if (!monthlyRevenue[key]) {
                        monthlyRevenue[key] = { month, year, revenue: 0 };
                    }
                    monthlyRevenue[key].revenue += billAmount;
                } catch {
                    // Skip invalid dates
                }
            });
            
            // Convert to array, sort by date, and format
            const entries = Object.values(monthlyRevenue)
                .sort((a, b) => {
                    // Sort by year first, then by month
                    if (a.year !== b.year) {
                        return a.year - b.year;
                    }
                    // Get month index for comparison
                    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
                })
                .slice(-12) // Last 12 months
                .map(item => ({
                    month: item.month + ' ' + item.year,
                    revenue: item.revenue
                }));
            
            return entries;
        }
    }, [waterBills, revenueView]);

    const handlePrintReport = () => {
        const billsThisMonth = waterBills.filter(bill => {
            const billDate = new Date(bill.billMonth);
            return billDate.getMonth() === new Date().getMonth() && billDate.getFullYear() === new Date().getFullYear();
        }).length;
        const chartRows = revenueData.map(d => `<tr><td>${d.month}</td><td class="num">৳${Number(d.revenue).toLocaleString()}</td></tr>`).join("");
        const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Admin Dashboard Report</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 32px; color: #1f2937; background: #f9fafb; line-height: 1.5; }
  @media print { body { background: #fff; padding: 0; } .card { break-inside: avoid; box-shadow: none; border: 1px solid #e5e7eb; } }
  .container { max-width: 720px; margin: 0 auto; }
  .header { text-align: center; padding: 24px 0 32px; border-bottom: 2px solid #4C6EF5; margin-bottom: 28px; }
  .header h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #111827; }
  .header .sub { margin-top: 6px; font-size: 0.875rem; color: #6b7280; }
  .card { background: #fff; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; }
  .card h2 { margin: 0 0 16px; font-size: 1rem; font-weight: 600; color: #4C6EF5; text-transform: uppercase; letter-spacing: 0.03em; }
  .card .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
  .card .row:last-child { border-bottom: none; }
  .card .label { color: #6b7280; font-size: 0.875rem; }
  .card .value { font-weight: 600; color: #111827; }
  table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #e5e7eb; }
  th { background: #f8fafc; font-weight: 600; color: #475569; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .revenue-table th:last-child, .revenue-table td.num { text-align: right; }
</style>
</head><body>
<div class="container">
  <div class="header">
    <h1>Water Tariff — Admin Dashboard Report</h1>
    <p class="sub">Generated ${new Date().toLocaleString()}</p>
  </div>
  <div class="card">
    <h2>Key metrics</h2>
    <div class="row"><span class="label">Total Consumers</span><span class="value">${totalConsumers} (${userStats.active} active, ${userStats.activePercentage}%)</span></div>
    <div class="row"><span class="label">Average Consumption</span><span class="value">${avgConsumption} m³ (${consumptions.length} records)</span></div>
  </div>
  <div class="card">
    <h2>Counts</h2>
    <div class="row"><span class="label">Zones</span><span class="value">${totalZones}</span></div>
    <div class="row"><span class="label">Meters</span><span class="value">${totalMeters}</span></div>
    <div class="row"><span class="label">Tariff Settings</span><span class="value">${totalTariffSettings}</span></div>
    <div class="row"><span class="label">Tariff Categories</span><span class="value">${totalTariffCategories}</span></div>
    <div class="row"><span class="label">WASAs</span><span class="value">${totalWasas}</span></div>
  </div>
  <div class="card">
    <h2>This month</h2>
    <div class="row"><span class="label">New Consumers</span><span class="value">${newConsumersThisMonth}</span></div>
    <div class="row"><span class="label">Consumption Entries</span><span class="value">${consumptionEntriesThisMonth}</span></div>
    <div class="row"><span class="label">Bills Generated</span><span class="value">${billsThisMonth}</span></div>
  </div>
  <div class="card">
    <h2>Bill status</h2>
    <div class="row"><span class="label">Paid</span><span class="value">${billStats.paid}</span></div>
    <div class="row"><span class="label">Unpaid</span><span class="value">${billStats.unpaid}</span></div>
    <div class="row"><span class="label">Overdue</span><span class="value">${billStats.overdue}</span></div>
    <div class="row"><span class="label">Collection Rate</span><span class="value">${billStats.collectionRate}%</span></div>
  </div>
  <div class="card">
    <h2>Overview</h2>
    <div class="row"><span class="label">Total Bills</span><span class="value">${billStats.total}</span></div>
    <div class="row"><span class="label">Avg Bill Amount</span><span class="value">৳${billStats.avgBillAmount.toFixed(0)}</span></div>
    <div class="row"><span class="label">Consumption Records</span><span class="value">${consumptions.length}</span></div>
  </div>
  <div class="card">
    <h2>Revenue trend (${revenueView})</h2>
    <table class="revenue-table"><thead><tr><th>Period</th><th>Revenue (৳)</th></tr></thead><tbody>${chartRows}</tbody></table>
  </div>
</div>
</body></html>`;
        const w = window.open("", "_blank");
        if (w) {
            w.document.write(html);
            w.document.close();
            w.focus();
            w.print();
        }
    };

    if (usersLoading || zonesLoading || metersLoading || tariffCategorySettingsLoading || tariffCategoriesLoading || wasasLoading || waterBillsLoading || consumptionsLoading) {
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
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8 items-center text-center md:text-left">
                    <div>
                        <h1 className="text-xl md:text-[1.75rem] font-semibold text-gray-900 mb-1">
                            Welcome back, Admin
                        </h1>
                        <p className="text-xs md:text-sm text-gray-500">
                            Here's what's happening with your water tariff
                            system today.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={handlePrintReport}
                            className="bg-primary hover:bg-primary-600 text-white px-4 md:px-6 rounded-lg shadow-sm text-sm md:text-base"
                        >
                            + Generate Report
                        </Button>
                    </div>
                </div>

                {/* Key Metrics - Clean Design */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <MetricHeroCard
                        label="Total Consumers"
                        value={animatedConsumers.toLocaleString()}
                        subtitle={`${totalConsumers} registered • ${userStats.active} active (${userStats.activePercentage}%)`}
                        variant="blue"
                    />
                    <MetricHeroCard
                        label="Average Consumption"
                        value={
                            <span className="flex items-baseline justify-center gap-2">
                                <span>{animatedConsumption}</span>
                                <span className="text-2xl text-gray-600 font-medium">m³</span>
                            </span>
                        }
                        subtitle={`Per household • ${consumptions.length} records`}
                        variant="green"
                        animationDelay={0.1}
                    />
                </div>

                {/* Metrics Grid - Centered Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-8">
                    <MetricCard label="Zones" value={totalZones} variant="blue" />
                    <MetricCard label="Meters" value={totalMeters} variant="green" animationDelay={0.05} />
                    <MetricCard label="Tariff Settings" value={totalTariffSettings} variant="purple" animationDelay={0.1} />
                    <MetricCard label="Tariff Categories" value={totalTariffCategories} variant="orange" animationDelay={0.15} />
                    <MetricCard label="WASAs" value={totalWasas} variant="cyan" animationDelay={0.2} />
                </div>

                {/* Activity & Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <MetricStatsCard
                        title="This Month"
                        variant="blue"
                        items={[
                            { label: "New Consumers", value: newConsumersThisMonth },
                            { label: "Consumption Entries", value: consumptionEntriesThisMonth },
                            {
                                label: "Bills Generated",
                                value: waterBills.filter(bill => {
                                    const billDate = new Date(bill.billMonth);
                                    return billDate.getMonth() === new Date().getMonth() && billDate.getFullYear() === new Date().getFullYear();
                                }).length,
                            },
                        ]}
                    />
                    <MetricStatsCard
                        title="Bill Status"
                        variant="green"
                        animationDelay={0.1}
                        items={[
                            { label: "Paid", value: billStats.paid, valueClassName: "text-green-600" },
                            { label: "Unpaid", value: billStats.unpaid, valueClassName: "text-amber-600" },
                            { label: "Collection Rate", value: `${billStats.collectionRate}%` },
                        ]}
                    />
                    <MetricStatsCard
                        title="Overview"
                        variant="purple"
                        animationDelay={0.2}
                        items={[
                            { label: "Total Bills", value: billStats.total },
                            { label: "Avg Bill Amount", value: `৳${billStats.avgBillAmount.toFixed(0)}` },
                            { label: "Consumption Records", value: consumptions.length },
                        ]}
                    />
                </div>

                {/* Charts Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="mb-6 flex items-center justify-between">
                        <div className="text-center flex-1">
                            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
                                Revenue Trend
                            </h2>
                            <p className="text-sm text-gray-500">
                                Revenue generated over time
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <Select value={revenueView} onValueChange={(value: 'monthly' | 'yearly') => setRevenueView(value)}>
                                <SelectTrigger className="w-[140px] border-2 border-gray-200 hover:border-gray-300 focus:border-blue-400 transition-colors">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 md:p-8 hover:border-gray-300 hover:shadow-md transition-all duration-300 h-[350px] md:h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5e7eb"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }}
                                    angle={revenueView === 'monthly' ? -45 : 0}
                                    textAnchor={revenueView === 'monthly' ? 'end' : 'middle'}
                                    height={revenueView === 'monthly' ? 80 : 60}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "12px",
                                        border: "2px solid #e5e7eb",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                        fontSize: "13px",
                                        backgroundColor: "white",
                                    }}
                                    formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, 'Revenue']}
                                />
                                <Bar
                                    dataKey="revenue"
                                    fill="url(#colorGradient)"
                                    radius={[12, 12, 0, 0]}
                                    maxBarSize={70}
                                />
                                <defs>
                                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#4C6EF5" stopOpacity={1}/>
                                        <stop offset="100%" stopColor="#3D5FE6" stopOpacity={0.8}/>
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
