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
import { useState, useMemo } from "react";
import { AddAgentModal } from "../components/modals/AddAgentModal";
import { api } from "../services/api";
import { useApiQuery, useApiMutation, useAdminId } from "../hooks/useApiQuery";
import { mapAdminToDisplay, type DisplayAdmin } from "../utils/dataMappers";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

interface Agent {
    name: string;
    phone?: string;
    email: string;
    password?: string;
    confirm?: string;
    zone?: string;
    ward?: string;
    role: string;
}

interface EditingAgent extends DisplayAdmin {
    index: number;
}

export function AgentManagement() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedZone, setSelectedZone] = useState("");
    const [selectedWard, setSelectedWard] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingAgent, setEditingAgent] = useState<EditingAgent | null>(null);
    const adminId = useAdminId();

    // Fetch admins and roles
    const { data: admins = [], isLoading: adminsLoading } = useApiQuery(
        ['admins'],
        () => api.admins.getAll()
    );

    const { data: roles = [], isLoading: rolesLoading } = useApiQuery(
        ['roles'],
        () => api.roles.getAll()
    );

    // Fetch zones and wards for dropdowns
    const { data: zones = [], isLoading: zonesLoading } = useApiQuery(
        ['zones'],
        () => api.zones.getAll()
    );

    const { data: wards = [], isLoading: wardsLoading } = useApiQuery(
        ['wards'],
        () => api.wards.getAll()
    );

    // Map admins to display format
    const displayAdmins = useMemo(() => {
        return admins.map((admin) => mapAdminToDisplay(admin, roles));
    }, [admins, roles]);

    // Filter admins by search term
    const filteredAdmins = useMemo(() => {
        if (!searchTerm) return displayAdmins;
        const term = searchTerm.toLowerCase();
        return displayAdmins.filter(
            (admin) =>
                admin.name.toLowerCase().includes(term) ||
                admin.email.toLowerCase().includes(term) ||
                admin.role.toLowerCase().includes(term)
        );
    }, [displayAdmins, searchTerm]);

    // Create admin mutation
    const createMutation = useApiMutation(
        (data: { fullName: string; email: string; phone: string; password: string; roleId: number }) =>
            api.admins.create(data),
        {
            successMessage: 'Agent created successfully',
            errorMessage: 'Failed to create agent',
            invalidateQueries: [['admins']],
        }
    );

    // Update admin mutation
    const updateMutation = useApiMutation(
        ({ id, data }: { id: number; data: { fullName?: string; email?: string; phone?: string } }) =>
            api.admins.update(id, data),
        {
            successMessage: 'Agent updated successfully',
            errorMessage: 'Failed to update agent',
            invalidateQueries: [['admins']],
        }
    );

    // Delete admin mutation
    const deleteMutation = useApiMutation(
        (id: number) => api.admins.delete(id),
        {
            successMessage: 'Agent deleted successfully',
            errorMessage: 'Failed to delete agent',
            invalidateQueries: [['admins']],
        }
    );

    const getRoleBadgeColor = (role: string) => {
        if (role === "Super Admin") return "bg-purple-50 text-purple-700";
        if (role === "Tariff Admin") return "bg-blue-50 text-blue-700";
        if (role === "Customer Admin") return "bg-green-50 text-green-700";
        return "bg-amber-50 text-amber-700";
    };

    // Find roleId by role name
    const getRoleIdByName = (roleName: string): number | null => {
        const role = roles.find((r) => r.name === roleName);
        return role?.id || null;
    };

    const handleAddAgent = async (newAgent: Agent) => {
        const roleId = getRoleIdByName(newAgent.role);
        if (!roleId || !newAgent.password) {
            return;
        }

        await createMutation.mutateAsync({
            fullName: newAgent.name,
            email: newAgent.email,
            phone: newAgent.phone || '',
            password: newAgent.password,
            roleId,
        });
        setShowModal(false);
        setEditMode(false);
    };

    const handleEditClick = (admin: DisplayAdmin, index: number) => {
        setEditingAgent({ ...admin, index });
        setEditMode(true);
        setShowModal(true);
    };

    const handleEditSave = async (updatedAgent: Agent) => {
        if (!editingAgent) return;

        await updateMutation.mutateAsync({
            id: editingAgent.id,
            data: {
                fullName: updatedAgent.name,
                email: updatedAgent.email,
                phone: updatedAgent.phone,
            },
        });
        setShowModal(false);
        setEditMode(false);
        setEditingAgent(null);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditMode(false);
        setEditingAgent(null);
    };

    const handleDelete = async () => {
        if (!editingAgent) return;

        await deleteMutation.mutateAsync(editingAgent.id);
        setShowModal(false);
        setEditMode(false);
        setEditingAgent(null);
    };

    // Prepare role options for dropdown
    const roleOptions = roles.map((role) => ({
        value: role.name,
        label: role.name,
    }));

    // Prepare zone options for dropdown
    const zoneOptions = useMemo(() => {
        return zones.map((zone) => ({
            value: zone.id.toString(),
            label: zone.name || zone.zoneNo,
        }));
    }, [zones]);

    // Prepare ward options for dropdown
    const wardOptions = useMemo(() => {
        return wards.map((ward) => ({
            value: ward.id.toString(),
            label: ward.name || ward.wardNo,
        }));
    }, [wards]);

    if (adminsLoading || rolesLoading || zonesLoading || wardsLoading) {
        return (
            <div className="min-h-screen bg-app flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app">
            <div className="px-8 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">
                            Agent Management
                        </h1>
                        <p className="text-sm text-gray-500">
                            Manage other system administrators (Tariff, Customer,
                            Super Admins)
                        </p>
                    </div>
                    <Button
                        className="bg-primary hover:bg-primary-600 text-white px-6 rounded-lg shadow-sm"
                        onClick={() => setShowModal(true)}
                    >
                        + Add New Agent
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
                            placeholder="Search Agents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                        />
                    </div>
                </div>
                {/* Drop Downs */}
                <div className="mb-6 flex gap-4">
                    <Dropdown
                        options={zoneOptions}
                        value={selectedZone}
                        onChange={setSelectedZone}
                        placeholder="Select Zone"
                        className="w-48"
                    />
                    <Dropdown
                        options={wardOptions}
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
                            {filteredAdmins.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                                        No agents found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAdmins.map((admin, index) => (
                                    <TableRow
                                        key={admin.id}
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
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                                                    admin.role
                                                )}`}
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
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <AddAgentModal
                open={showModal}
                onClose={handleModalClose}
                onSave={editMode ? handleEditSave : handleAddAgent}
                editMode={editMode}
                agent={editingAgent ? {
                    name: editingAgent.name,
                    email: editingAgent.email,
                    phone: editingAgent.phone,
                    role: editingAgent.role,
                } : null}
                onDelete={editMode ? handleDelete : undefined}
                zoneOptions={zoneOptions}
                wardOptions={wardOptions}
                roleOptions={roleOptions}
            />
        </div>
    );
}
