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
import { useState, useEffect } from "react";

export default function AdminDashboard() {
    const [animatedConsumers, setAnimatedConsumers] = useState(0);
    const [animatedRevenue, setAnimatedRevenue] = useState(0);
    const [animatedConsumption, setAnimatedConsumption] = useState(0);

    useEffect(() => {
        const duration = 2000;
        const steps = 60;
        const interval = duration / steps;

        let step = 0;
        const timer = setInterval(() => {
            step++;
            const progress = step / steps;

            setAnimatedConsumers(Math.floor(15342 * progress));
            setAnimatedRevenue(parseFloat((45.2 * progress).toFixed(1)));
            setAnimatedConsumption(parseFloat((24.5 * progress).toFixed(1)));

            if (step >= steps) {
                clearInterval(timer);
            }
        }, interval);

        return () => clearInterval(timer);
    }, []);

    const revenueData = [
        { month: "Jan", revenue: 35000 },
        { month: "Feb", revenue: 42000 },
        { month: "Mar", revenue: 48000 },
        { month: "Apr", revenue: 38000 },
    ];

    const pendingData = [
        {
            consumer: "John S.",
            type: "Residential",
            date: "Nov 22",
            time: "9 AM - 5 PM",
            entry: "Meter Reading",
            status: "Confirmed",
        },
        {
            consumer: "Sarah A.",
            type: "Commercial",
            date: "Nov 22",
            time: "2 PM - 10 PM",
            entry: "Bill Payment",
            status: "Confirmed",
        },
        {
            consumer: "Ahmed K.",
            type: "Residential",
            date: "Nov 22",
            time: "-",
            entry: "Registration",
            status: "Pending",
        },
        {
            consumer: "Nadia I.",
            type: "Commercial",
            date: "Nov 23",
            time: "10 AM - 6 PM",
            entry: "Meter Reading",
            status: "Confirmed",
        },
    ];

    return (
        <div className="min-h-screen bg-app">
            <div className="px-8 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">
                            Welcome back, Admin
                        </h1>
                        <p className="text-sm text-gray-500">
                            Here's what's happening with your water tariff
                            system today.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button className="bg-primary hover:bg-primary-600 text-white px-6 rounded-lg shadow-sm">
                            + Generate Report
                        </Button>
                    </div>
                </div>

                {/* Top Stats - Horizontal Infographic Strip */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="relative bg-gradient-to-r from-[#5B7EFF] via-[#4C6EF5] to-[#3D5FE6] p-12 mb-10 overflow-hidden"
                    style={{
                        clipPath: "polygon(0 0, 100% 0, 100% 85%, 0 100%)",
                    }}
                >
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>

                    <div className="relative grid grid-cols-3 gap-20">
                        {/* Total Consumers */}
                        <div className="relative min-w-0">
                            <div className="mb-4">
                                <span className="text-white/80 text-sm tracking-wide uppercase font-medium">
                                    Total Consumers
                                </span>
                            </div>
                            <div className="mb-3">
                                <div
                                    className="text-6xl font-bold text-white tracking-tight"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    {animatedConsumers.toLocaleString()}
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-white/70 text-sm font-normal">
                                    150 new this month
                                </span>
                                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                    <span className="text-white font-semibold text-sm">
                                        +8.5%
                                    </span>
                                </div>
                            </div>

                            {/* Vertical Divider */}
                            <div className="absolute -right-10 top-0 bottom-0 w-px bg-white/20"></div>
                        </div>

                        {/* Total Revenue */}
                        <div className="relative min-w-0">
                            <div className="mb-4">
                                <span className="text-white/80 text-sm tracking-wide uppercase font-medium">
                                    Total Revenue
                                </span>
                            </div>
                            <div className="mb-3">
                                <div
                                    className="text-6xl font-bold text-white tracking-tight"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    ৳{animatedRevenue}M
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-white/70 text-sm font-normal">
                                    This month
                                </span>
                                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                    <span className="text-white font-semibold text-sm">
                                        +12.3%
                                    </span>
                                </div>
                            </div>

                            {/* Vertical Divider */}
                            <div className="absolute -right-10 top-0 bottom-0 w-px bg-white/20"></div>
                        </div>

                        {/* Avg Consumption */}
                        <div className="relative min-w-0">
                            <div className="mb-4">
                                <span className="text-white/80 text-sm tracking-wide uppercase font-medium">
                                    Avg Consumption
                                </span>
                            </div>
                            <div className="mb-3">
                                <div>
                                    <span
                                        className="text-6xl font-bold text-white tracking-tight"
                                        style={{
                                            fontFamily: "Inter, sans-serif",
                                        }}
                                    >
                                        {animatedConsumption}
                                    </span>
                                    <span className="text-3xl text-white/90 ml-2 font-normal">
                                        m³
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-white/70 text-sm font-normal">
                                    Per household
                                </span>
                                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                    <span className="text-white font-semibold text-sm">
                                        +6.2%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Charts Section */}
                <div className="mb-10">
                    {/* Monthly Revenue */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Monthly Revenue
                            </h2>
                            <select className="text-sm text-gray-600 bg-white border border-gray-300 rounded-lg px-3 py-2 cursor-pointer focus:outline-none">
                                <option>Monthly</option>
                                <option>Yearly</option>
                            </select>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 h-[380px]">
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
                <div className="border-t border-gray-200 mb-10"></div>

                {/* Pending Approvals Table */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Pending Approvals
                        </h2>
                        <Button
                            variant="outline"
                            className="border-gray-300 text-gray-700 rounded-lg bg-white"
                        >
                            Edit Schedule
                        </Button>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-200 bg-gray-50">
                                    <TableHead className="text-sm font-semibold text-gray-700">
                                        Consumer
                                    </TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700">
                                        Type
                                    </TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700">
                                        Date
                                    </TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700">
                                        Time
                                    </TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700">
                                        Entry Type
                                    </TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700">
                                        Status
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingData.map((item, index) => (
                                    <TableRow
                                        key={index}
                                        className="border-gray-100"
                                    >
                                        <TableCell className="text-sm text-gray-900">
                                            {item.consumer}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {item.type}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {item.date}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {item.time}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {item.entry}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                    item.status === "Confirmed"
                                                        ? "bg-teal-50 text-teal-700"
                                                        : "bg-amber-50 text-amber-700"
                                                }`}
                                            >
                                                {item.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
