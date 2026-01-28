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
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
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
                        <Button className="bg-primary hover:bg-primary-600 text-white px-4 md:px-6 rounded-lg shadow-sm text-sm md:text-base">
                            + Generate Report
                        </Button>
                    </div>
                </div>

                {/* Key Metrics - Clean Design */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Total Consumers */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                    >
                        <div className="text-center">
                            <div className="text-sm text-gray-500 uppercase tracking-wide mb-3 font-medium">
                                Total Consumers
                            </div>
                            <div className="text-5xl md:text-6xl font-bold text-gray-900 mb-2">
                                {animatedConsumers.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">
                                {totalConsumers} registered • {userStats.active} active ({userStats.activePercentage}%)
                            </div>
                        </div>
                    </motion.div>

                    {/* Avg Consumption */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-green-300 hover:shadow-lg transition-all duration-300"
                    >
                        <div className="text-center">
                            <div className="text-sm text-gray-500 uppercase tracking-wide mb-3 font-medium">
                                Average Consumption
                            </div>
                            <div className="flex items-baseline justify-center gap-2 mb-2">
                                <span className="text-5xl md:text-6xl font-bold text-gray-900">
                                    {animatedConsumption}
                                </span>
                                <span className="text-2xl text-gray-600 font-medium">
                                    m³
                                </span>
                            </div>
                            <div className="text-sm text-gray-600">
                                Per household • {consumptions.length} records
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Metrics Grid - Centered Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all duration-300"
                    >
                        <div className="text-center">
                            <div className="text-xs text-gray-600 mb-2 font-medium">Zones</div>
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{totalZones}</div>
                            <div className="text-xs text-gray-500">Active zones</div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.05 }}
                        className="bg-white border-2 border-green-200 rounded-xl p-6 hover:border-green-400 hover:shadow-md transition-all duration-300"
                    >
                        <div className="text-center">
                            <div className="text-xs text-gray-600 mb-2 font-medium">Meters</div>
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{totalMeters}</div>
                            <div className="text-xs text-gray-500">Registered</div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="bg-white border-2 border-purple-200 rounded-xl p-6 hover:border-purple-400 hover:shadow-md transition-all duration-300"
                    >
                        <div className="text-center">
                            <div className="text-xs text-gray-600 mb-2 font-medium">Tariff Settings</div>
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{totalTariffSettings}</div>
                            <div className="text-xs text-gray-500">Category settings</div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.15 }}
                        className="bg-white border-2 border-orange-200 rounded-xl p-6 hover:border-orange-400 hover:shadow-md transition-all duration-300"
                    >
                        <div className="text-center">
                            <div className="text-xs text-gray-600 mb-2 font-medium">Categories</div>
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{totalTariffCategories}</div>
                            <div className="text-xs text-gray-500">Active</div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="bg-white border-2 border-cyan-200 rounded-xl p-6 hover:border-cyan-400 hover:shadow-md transition-all duration-300"
                    >
                        <div className="text-center">
                            <div className="text-xs text-gray-600 mb-2 font-medium">WASAs</div>
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{totalWasas}</div>
                            <div className="text-xs text-gray-500">Authorities</div>
                        </div>
                    </motion.div>
                </div>

                {/* Activity & Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* This Month's Activity */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white border-2 border-gray-200 rounded-xl p-6 md:p-8 hover:border-blue-300 hover:shadow-md transition-all duration-300"
                    >
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-6 text-center">This Month</h3>
                        <div className="space-y-5">
                            <div className="text-center pb-4 border-b border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">New Consumers</div>
                                <div className="text-2xl md:text-3xl font-bold text-gray-900">{newConsumersThisMonth}</div>
                            </div>
                            <div className="text-center pb-4 border-b border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">Consumption Entries</div>
                                <div className="text-2xl md:text-3xl font-bold text-gray-900">{consumptionEntriesThisMonth}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Bills Generated</div>
                                <div className="text-2xl md:text-3xl font-bold text-gray-900">
                                    {waterBills.filter(bill => {
                                        const billDate = new Date(bill.billMonth);
                                        const currentMonth = new Date().getMonth();
                                        const currentYear = new Date().getFullYear();
                                        return billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear;
                                    }).length}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Bill Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="bg-white border-2 border-gray-200 rounded-xl p-6 md:p-8 hover:border-green-300 hover:shadow-md transition-all duration-300"
                    >
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-6 text-center">Bill Status</h3>
                        <div className="space-y-5">
                            <div className="text-center pb-4 border-b border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">Paid</div>
                                <div className="text-2xl md:text-3xl font-bold text-green-600">{billStats.paid}</div>
                            </div>
                            <div className="text-center pb-4 border-b border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">Unpaid</div>
                                <div className="text-2xl md:text-3xl font-bold text-amber-600">{billStats.unpaid}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Collection Rate</div>
                                <div className="text-2xl md:text-3xl font-bold text-gray-900">{billStats.collectionRate}%</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* System Overview */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="bg-white border-2 border-gray-200 rounded-xl p-6 md:p-8 hover:border-purple-300 hover:shadow-md transition-all duration-300"
                    >
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-6 text-center">Overview</h3>
                        <div className="space-y-5">
                            <div className="text-center pb-4 border-b border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">Total Bills</div>
                                <div className="text-2xl md:text-3xl font-bold text-gray-900">{billStats.total}</div>
                            </div>
                            <div className="text-center pb-4 border-b border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">Avg Bill Amount</div>
                                <div className="text-2xl md:text-3xl font-bold text-gray-900">৳{billStats.avgBillAmount.toFixed(0)}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Consumption Records</div>
                                <div className="text-2xl md:text-3xl font-bold text-gray-900">{consumptions.length}</div>
                            </div>
                        </div>
                    </motion.div>
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
