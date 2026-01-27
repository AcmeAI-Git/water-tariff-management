import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";
import { api } from "../services/api";
import { useApiQuery } from "../hooks/useApiQuery";
import { mapAuditLogToDisplay } from "../utils/dataMappers";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

export function SystemAuditLog() {
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch audit logs (backend already populates user relation)
    const { data: auditLogs = [], isLoading } = useApiQuery(
        ['audit-logs'],
        () => api.auditLogs.getAll()
    );

    // Map audit logs to display format
    // Use the populated user relation from backend, or fallback to userId
    const displayLogs = useMemo(() => {
        return auditLogs.map((log) => {
            // Backend populates log.user if userId exists and user is found
            const userName = log.user?.fullName || (log.userId ? `User #${log.userId}` : 'System');
            return mapAuditLogToDisplay(log, userName);
        });
    }, [auditLogs]);

    // Filter logs by search term
    const filteredLogs = useMemo(() => {
        if (!searchTerm) return displayLogs;
        const term = searchTerm.toLowerCase();
        return displayLogs.filter(
            (log) =>
                log.user.toLowerCase().includes(term) ||
                log.module.toLowerCase().includes(term) ||
                log.action.toLowerCase().includes(term) ||
                log.details.toLowerCase().includes(term)
        );
    }, [displayLogs, searchTerm]);

    const getActionBadgeColor = (action: string) => {
        const upperAction = action.toUpperCase();
        if (upperAction.includes('CREATE')) return 'bg-green-50 text-green-700 border-green-200';
        if (upperAction.includes('UPDATE')) return 'bg-blue-50 text-blue-700 border-blue-200';
        if (upperAction.includes('DELETE')) return 'bg-red-50 text-red-700 border-red-200';
        if (upperAction.includes('APPROVE')) return 'bg-purple-50 text-purple-700 border-purple-200';
        if (upperAction.includes('REJECT')) return 'bg-orange-50 text-orange-700 border-orange-200';
        return 'bg-gray-50 text-gray-700 border-gray-200';
    };

    if (isLoading) {
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
                <div className="mb-6 md:mb-8">
                    <h1 className="text-xl md:text-[1.75rem] font-semibold text-gray-900 mb-1">
                        System Audit Log
                    </h1>
                    <p className="text-xs md:text-sm text-gray-500">
                        Track all system activities and changes
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative w-full max-w-md">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={18}
                        />
                        <Input
                            type="text"
                            placeholder="Search by user, module, or action..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-200 bg-gray-50">
                                <TableHead className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">ID</TableHead>
                                <TableHead className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap hidden md:table-cell">Timestamp</TableHead>
                                <TableHead className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">User</TableHead>
                                <TableHead className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Action</TableHead>
                                <TableHead className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap hidden lg:table-cell">Module</TableHead>
                                <TableHead className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap hidden lg:table-cell">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-gray-500 py-6 md:py-8 text-sm">
                                        No audit logs found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id} className="border-gray-100">
                                        <TableCell className="text-xs md:text-sm font-mono text-gray-600 whitespace-nowrap">{log.id}</TableCell>
                                        <TableCell className="text-xs md:text-sm text-gray-600 whitespace-nowrap hidden md:table-cell">{log.timestamp}</TableCell>
                                        <TableCell className="text-xs md:text-sm text-gray-900 font-medium whitespace-nowrap">{log.user}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <Badge className={getActionBadgeColor(log.action)}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs md:text-sm text-gray-600 whitespace-nowrap hidden lg:table-cell">{log.module}</TableCell>
                                        <TableCell className="text-xs md:text-sm text-gray-600 whitespace-nowrap hidden lg:table-cell">{log.details}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
