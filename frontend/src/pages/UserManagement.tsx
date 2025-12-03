import { Dropdown } from "../components/ui/Dropdown";
import { Button } from "../components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { Edit2, Search } from "lucide-react";
import { Input } from "../components/ui/input";
import { useState } from "react";
import { AddAgentModal } from "../components/modals/AddAgentModal";

interface MeterAdmin {
    name: string;
    email: string;
    role: string;
    phone?: string;
}

interface EditingMeterAdmin extends MeterAdmin {
    index: number;
}

export default function UserManagement() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedZone, setSelectedZone] = useState("");
    const [selectedWard, setSelectedWard] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingAgent, setEditingAgent] = useState<EditingMeterAdmin | null>(null);
    const [admins, setAdmins] = useState([
        {
            name: "Rahim Uddin",
            email: "rahim.uddin@wateraid.org",
            role: "Meter Admin",
            phone: "01987654321",
        },
        {
            name: "Ibrahim Ali",
            email: "ibrahim.ali@wateraid.org",
            role: "Meter Admin",
            phone: "01598761234",
        },
        {
            name: "Sarah Ahmed",
            email: "sarah.ahmed@wateraid.org",
            role: "Meter Admin",
            phone: "019378473285",
        },
        {
            name: "Kamal Hassan",
            email: "kamal.hassan@wateraid.org",
            role: "Meter Admin",
            phone: "01712345678",
        },
    ]);

    const getRoleBadgeColor = () => {
        return "bg-amber-50 text-amber-700"; // All Meter Admins have same color
    };

    const handleAddAgent = (newAgent: { name: string; email: string; role: string; phone?: string }) => {
        setAdmins([
            ...admins,
            { name: newAgent.name, email: newAgent.email, role: "Meter Admin", phone: newAgent.phone || "" },
        ]);
        setShowModal(false);
        setEditMode(false);
    };

    const handleEditClick = (admin: MeterAdmin, index: number) => {
        setEditingAgent({ ...admin, index });
        setEditMode(true);
        setShowModal(true);
    };

    const handleEditSave = (updatedAgent: MeterAdmin) => {
        if (!editingAgent) return;
        
        const newAdmins = [...admins];
        newAdmins[editingAgent.index] = {
            name: updatedAgent.name,
            email: updatedAgent.email,
            role: "Meter Admin",
            phone: updatedAgent.phone || "",
        };
        setAdmins(newAdmins);
        setShowModal(false);
        setEditMode(false);
        setEditingAgent(null);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditMode(false);
        setEditingAgent(null);
    };

    const handleDelete = () => {
        if (!editingAgent) return;
        
        const newAdmins = admins.filter((_, index) => index !== editingAgent.index);
        setAdmins(newAdmins);
        setShowModal(false);
        setEditMode(false);
        setEditingAgent(null);
    };

    return (
        <div className="min-h-screen bg-app">
            <div className="px-8 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">
                            User Management (Meter Admins)
                        </h1>
                        <p className="text-sm text-gray-500">
                            Manage all meter admins who handle meter readings
                        </p>
                    </div>
                    <Button
                        className="bg-primary hover:bg-primary-600 text-white px-6 rounded-lg shadow-sm"
                        onClick={() => setShowModal(true)}
                    >
                        + Add Meter Admin
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
                            placeholder="Search Meter Admins..."
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
                            { value: "ward-1", label: "Ward-1" },
                            { value: "ward-2", label: "Ward-2" },
                            { value: "ward-3", label: "Ward-3" },
                            { value: "ward-4", label: "Ward-4" },
                        ]}
                        value={selectedWard}
                        onChange={setSelectedWard}
                        placeholder="Select Ward"
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
                                    Role
                                </TableHead>
                                <TableHead className="text-sm font-semibold text-gray-700">
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
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor()}`}
                                        >
                                            {admin.role}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                            onClick={() => handleEditClick(admin, index)}
                                        >
                                            <Edit2
                                                size={14}
                                                className="mr-1.5"
                                            />
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <AddAgentModal
                open={showModal}
                onClose={handleModalClose}
                onSave={editMode ? handleEditSave : handleAddAgent}
                editMode={editMode}
                agent={editingAgent}
                roleFixed="Meter Admin"
                onDelete={editMode ? handleDelete : undefined}
            />
        </div>
    );
}
