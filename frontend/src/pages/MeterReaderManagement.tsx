import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { Edit2, Search, Trash } from "lucide-react";
import { useState } from "react";
import { Dropdown } from "../components/ui/Dropdown";

export default function MeterReaderManagement() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedZone, setSelectedZone] = useState("");
    const [selectedWord, setSelectedWord] = useState("");
    const admins = [
        {
            name: "Sarah Ahmed",
            email: "sarah.ahmed@wateraid.org",
            phone: "019378473285",
        },
        {
            name: "Kamal Hassan",
            email: "kamal.hassan@wateraid.org",
            phone: "01712345678",
        },
        {
            name: "Nadia Chowdhury",
            email: "nadia.c@wateraid.org",
            phone: "01898765432",
        },
        {
            name: "Rahim Uddin",
            email: "rahim.uddin@wateraid.org",
            phone: "01987654321",
        },
        {
            name: "Ayesha Khan",
            email: "ayesha.khan@wateraid.org",
            phone: "01612349876",
        },
        {
            name: "Ibrahim Ali",
            email: "ibrahim.ali@wateraid.org",
            phone: "01598761234",
        },
    ];

    return (
        <div className="min-h-screen bg-app">
            <div className="px-8 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">
                            Meter Reader Management
                        </h1>
                        <p className="text-sm text-gray-500">
                            Manage all meter readers registered in the system.
                        </p>
                    </div>
                    <Button className="bg-primary hover:bg-primary-600 text-white px-6 rounded-lg shadow-sm">
                        + Add New Meter Reader
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative w-full">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={18}
                        />
                        <Input
                            type="text"
                            placeholder="Search Meter Readers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                        />
                    </div>
                </div>
                {/* Drop Downs */}
                <div className="mb-6 flex gap-4">
                    <Dropdown
                        options={[
                            { value: "zone-1", label: "Zone-1" },
                            { value: "zone-2", label: "Zone-2" },
                            { value: "zone-3", label: "Zone-3" },
                            { value: "zone-4", label: "Zone-4" },
                        ]}
                        value={selectedZone}
                        onChange={setSelectedZone}
                        placeholder="Select Zone"
                        className="w-48"
                    />
                    <Dropdown
                        options={[
                            { value: "word-1", label: "Word-1" },
                            { value: "word-2", label: "Word-2" },
                            { value: "word-3", label: "Word-3" },
                            { value: "word-4", label: "Word-4" },
                        ]}
                        value={selectedWord}
                        onChange={setSelectedWord}
                        placeholder="Select Word"
                        className="w-48"
                    />
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-200 bg-gray-50">
                                <TableHead className="text-sm font-semibold text-gray-700">
                                    Full Name
                                </TableHead>
                                <TableHead className="text-sm font-semibold text-gray-700">
                                    Email
                                </TableHead>
                                <TableHead className="text-sm font-semibold text-gray-700">
                                    Phone
                                </TableHead>
                                <TableHead className="text-sm font-semibold text-gray-700 flex justify-center items-center">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admins.map((admin, index) => (
                                <TableRow
                                    key={index}
                                    className="border-gray-100"
                                >
                                    <TableCell className="text-sm text-gray-900 font-medium">
                                        {admin.name}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {admin.email}
                                    </TableCell>
                                    <TableCell>{admin.phone}</TableCell>
                                    <TableCell className="flex justify-center gap-x-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                        >
                                            <Edit2
                                                size={14}
                                                className="mr-1.5"
                                            />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-gray-300 text-red-700 rounded-lg hover:bg-gray-50"
                                        >
                                            <Trash size={14} />
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
