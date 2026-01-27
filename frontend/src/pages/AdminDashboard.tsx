import { Button } from "../components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
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
    const [animatedRevenue, setAnimatedRevenue] = useState(0);
    const [animatedConsumption, setAnimatedConsumption] = useState(0);

    // Fetch data for metrics
    const { data: users = [], isLoading: usersLoading } = useApiQuery(
        ['users'],
        () => api.users.getAll()
    );

    // const { data: admins = [], isLoading: adminsLoading } = useApiQuery(
    //     ['admins'],
    //     () => api.admins.getAll()
    // );

    const { data: pendingApprovals = [], isLoading: approvalsLoading } = useApiQuery(
        ['approval-requests', 'pending'],
        () => api.approvalRequests.getPending()
    );

    // const { data: auditLogs = [], isLoading: auditLogsLoading } = useApiQuery(
    //     ['audit-logs'],
    //     () => api.auditLogs.getAll()
    // );

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
    // const totalAdmins = admins.length;
    const pendingCount = pendingApprovals.length;
    
    // Calculate average consumption from consumption data
    const avgConsumption = useMemo(() => {
        if (consumptions.length === 0) return 0;
        const totalConsumption = consumptions.reduce((sum, c) => {
            // Ensure values are numbers
            const current = typeof c.currentReading === 'number' 
                ? c.currentReading 
                : Number(c.currentReading) || 0;
            const previous = typeof c.previousReading === 'number' 
                ? c.previousReading 
                : Number(c.previousReading) || 0;
            const consumption = current - previous;
            return sum + Math.max(0, consumption); // Ensure non-negative
        }, 0);
        return parseFloat((totalConsumption / consumptions.length).toFixed(1));
    }, [consumptions]);

    // Calculate total revenue (current month) in millions
    const totalRevenue = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = waterBills
            .filter(bill => {
                const billDate = new Date(bill.billMonth);
                return billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear;
            })
            .reduce((sum, bill) => sum + (bill.totalBill || 0), 0);
        return parseFloat((monthlyRevenue / 1000000).toFixed(1)); // Convert to millions
    }, [waterBills]);

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
                setAnimatedRevenue(parseFloat((totalRevenue * progress).toFixed(1)));
                setAnimatedConsumption(parseFloat((avgConsumption * progress).toFixed(1)));

                if (step >= steps) {
                    clearInterval(timer);
                }
            }, interval);

            return () => clearInterval(timer);
        }
    }, [usersLoading, totalConsumers, totalRevenue, avgConsumption]);

    // Prepare revenue data grouped by month from water bills
    const revenueData = useMemo(() => {
        const monthlyRevenue: Record<string, number> = {};
        waterBills.forEach(bill => {
            try {
                const billDate = new Date(bill.billMonth);
                const month = billDate.toLocaleDateString('en-US', { month: 'short' });
                monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (bill.totalBill || 0);
            } catch {
                // Skip invalid dates
            }
        });
        
        // Convert to array and sort by date
        const entries = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }));
        
        // Sort by date (most recent first, limited to last 12 months)
        return entries
            .sort((a, b) => {
                const dateA = new Date(a.month + ' 1, 2024');
                const dateB = new Date(b.month + ' 1, 2024');
                return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 12)
            .reverse(); // Show oldest to newest
    }, [waterBills]);

    // Map pending approvals to display format
    const pendingData = useMemo(() => {
        return pendingApprovals.slice(0, 4).map((approval) => {
            const moduleName = approval.moduleName || 'Unknown';
            return {
                consumer: moduleName,
                type: moduleName.includes('Tariff') ? 'Commercial' : 'Residential',
                date: approval.requestedAt 
                    ? new Date(approval.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'N/A',
                time: '-',
                entry: moduleName,
                status: 'Pending',
            };
        });
    }, [pendingApprovals]);

    if (usersLoading || approvalsLoading || waterBillsLoading || consumptionsLoading) {
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

                {/* Top Stats - Horizontal Infographic Strip */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="relative bg-gradient-to-r from-[#5B7EFF] via-[#4C6EF5] to-[#3D5FE6] p-6 md:p-12 mb-6 md:mb-10 overflow-hidden rounded-xl md:rounded-none md:[clip-path:polygon(0_0,100%_0,100%_85%,0_100%)]"
                >
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-1/3 w-24 md:w-48 h-24 md:h-48 bg-white/10 rounded-full blur-2xl"></div>

                    <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-20">
                        {/* Total Consumers */}
                        <div className="relative min-w-0">
                            <div className="mb-3 md:mb-4">
                                <span className="text-white/80 text-xs md:text-sm tracking-wide uppercase font-medium">
                                    Total Consumers
                                </span>
                            </div>
                            <div className="mb-2 md:mb-3">
                                <div
                                    className="text-4xl md:text-6xl font-bold text-white tracking-tight"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    {animatedConsumers.toLocaleString()}
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-white/70 text-xs md:text-sm font-normal">
                                    {totalConsumers} total registered
                                </span>
                            </div>

                            {/* Vertical Divider */}
                            <div className="hidden md:block absolute -right-10 top-0 bottom-0 w-px bg-white/20"></div>
                            <div className="md:hidden border-b border-white/20 my-4"></div>
                        </div>

                        {/* Total Revenue */}
                        <div className="relative min-w-0">
                            <div className="mb-3 md:mb-4">
                                <span className="text-white/80 text-xs md:text-sm tracking-wide uppercase font-medium">
                                    Total Revenue
                                </span>
                            </div>
                            <div className="mb-2 md:mb-3">
                                <div
                                    className="text-4xl md:text-6xl font-bold text-white tracking-tight"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    ৳{animatedRevenue}M
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-white/70 text-xs md:text-sm font-normal">
                                    This month
                                </span>
                            </div>

                            {/* Vertical Divider */}
                            <div className="hidden md:block absolute -right-10 top-0 bottom-0 w-px bg-white/20"></div>
                            <div className="md:hidden border-b border-white/20 my-4"></div>
                        </div>

                        {/* Avg Consumption */}
                        <div className="relative min-w-0">
                            <div className="mb-3 md:mb-4">
                                <span className="text-white/80 text-xs md:text-sm tracking-wide uppercase font-medium">
                                    Avg Consumption
                                </span>
                            </div>
                            <div className="mb-2 md:mb-3">
                                <div>
                                    <span
                                        className="text-4xl md:text-6xl font-bold text-white tracking-tight"
                                        style={{
                                            fontFamily: "Inter, sans-serif",
                                        }}
                                    >
                                        {animatedConsumption}
                                    </span>
                                    <span className="text-2xl md:text-3xl text-white/90 ml-2 font-normal">
                                        m³
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-white/70 text-xs md:text-sm font-normal">
                                    Per household
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Charts Section */}
                <div className="mb-6 md:mb-10">
                    {/* Monthly Revenue */}
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                                Monthly Revenue
                            </h2>
                            <select className="text-sm text-gray-600 bg-white border border-gray-300 rounded-lg px-3 py-2 cursor-pointer focus:outline-none w-full sm:w-auto">
                                <option>Monthly</option>
                                <option>Yearly</option>
                            </select>
                        </div>
                        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 h-[300px] md:h-[380px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#f0f0f0"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: "#9ca3af" }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: "#9ca3af" }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: "8px",
                                            border: "none",
                                            boxShadow:
                                                "0 2px 8px rgba(0,0,0,0.1)",
                                            fontSize: "12px",
                                        }}
                                        formatter={(value) => `৳${value}`}
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        fill="#4C6EF5"
                                        radius={[8, 8, 0, 0]}
                                        maxBarSize={60}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 mb-6 md:mb-10"></div>

                {/* Pending Approvals Table */}
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                            Pending Approvals ({pendingCount})
                        </h2>
                        <Button
                            variant="outline"
                            className="border-gray-300 text-gray-700 rounded-lg bg-white w-full sm:w-auto"
                        >
                            View All
                        </Button>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-200 bg-gray-50">
                                    <TableHead className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">
                                        Module
                                    </TableHead>
                                    <TableHead className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">
                                        Type
                                    </TableHead>
                                    <TableHead className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">
                                        Date
                                    </TableHead>
                                    <TableHead className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap hidden sm:table-cell">
                                        Time
                                    </TableHead>
                                    <TableHead className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap hidden md:table-cell">
                                        Entry Type
                                    </TableHead>
                                    <TableHead className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">
                                        Status
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                            No pending approvals
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pendingData.map((item, index) => (
                                        <TableRow
                                            key={index}
                                            className="border-gray-100"
                                        >
                                            <TableCell className="text-xs md:text-sm text-gray-900 whitespace-nowrap">
                                                {item.consumer}
                                            </TableCell>
                                            <TableCell className="text-xs md:text-sm text-gray-600 whitespace-nowrap">
                                                {item.type}
                                            </TableCell>
                                            <TableCell className="text-xs md:text-sm text-gray-600 whitespace-nowrap">
                                                {item.date}
                                            </TableCell>
                                            <TableCell className="text-xs md:text-sm text-gray-600 whitespace-nowrap hidden sm:table-cell">
                                                {item.time}
                                            </TableCell>
                                            <TableCell className="text-xs md:text-sm text-gray-600 whitespace-nowrap hidden md:table-cell">
                                                {item.entry}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
                                                        item.status === "Confirmed"
                                                            ? "bg-teal-50 text-teal-700"
                                                            : "bg-amber-50 text-amber-700"
                                                    }`}
                                                >
                                                    {item.status}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
