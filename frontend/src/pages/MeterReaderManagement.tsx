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
import { useApiQuery, useApiMutation } from "../hooks/useApiQuery";
import { mapAdminToDisplay, type DisplayAdmin } from "../utils/dataMappers";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { toast } from "sonner";
import type { Admin } from "../types";

interface Agent {
    name: string;
    phone?: string;
    email: string;
    password?: string;
    confirm?: string;
    cityCorporation?: string;
    zone?: string;
    ward?: string;
    role: string;
}

interface EditingMeterReader extends DisplayAdmin {
    index: number;
}

// Hardcoded location values for all meter readers
const HARDCODED_LOCATION = {
    cityCorporation: 'Dhaka South City Corporation',
    cityCorporationId: 1, // DSCC
    zone: 'Zone 1',
    zoneId: 1,
    ward: 'Ward 1',
    wardId: 1,
};

export default function MeterReaderManagement() {
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingAgent, setEditingAgent] = useState<EditingMeterReader | null>(null);
    
    // Get current logged-in admin
    const getCurrentAdmin = (): Admin | null => {
        const adminStr = localStorage.getItem('admin');
        if (!adminStr) return null;
        try {
            return JSON.parse(adminStr);
        } catch {
            return null;
        }
    };
    
    const currentAdmin = getCurrentAdmin();

    // Calculate if delete button should be shown (only if editing other admin, not self)
    const shouldShowDeleteButton = useMemo(() => {
        if (!editMode || !editingAgent || !currentAdmin) return false;
        return editingAgent.id !== currentAdmin.id;
    }, [editMode, editingAgent, currentAdmin]);

    // Fetch roles to find Meter Admin role ID
    const { data: roles = [], isLoading: rolesLoading } = useApiQuery(
        ['roles'],
        () => api.roles.getAll()
    );

    // Find Meter Admin role ID
    const meterAdminRoleId = useMemo(() => {
        const role = roles.find(r => r.name.toLowerCase().includes('meter'));
        return role?.id;
    }, [roles]);

    // Fetch admins filtered by Meter Admin role
    const { data: admins = [], isLoading: adminsLoading } = useApiQuery(
        meterAdminRoleId ? ['admins', meterAdminRoleId] : ['admins'],
        () => api.admins.getAll(meterAdminRoleId || undefined),
        { enabled: !!meterAdminRoleId }
    );

    // Map admins to display format
    const displayAdmins = useMemo(() => {
        return admins.map((admin) => mapAdminToDisplay(admin, roles));
    }, [admins, roles]);

    // Filter admins by search term only (no location filtering since all have same location)
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
            successMessage: 'Meter Reader created successfully',
            errorMessage: 'Failed to create Meter Reader',
            invalidateQueries: [['admins']],
        }
    );

    // Update admin mutation
    const updateMutation = useApiMutation(
        ({ id, data }: { id: number; data: { fullName?: string; email?: string; phone?: string } }) =>
            api.admins.update(id, data),
        {
            successMessage: 'Meter Reader updated successfully',
            errorMessage: 'Failed to update Meter Reader',
            invalidateQueries: [['admins']],
        }
    );

    // Delete admin mutation
    const deleteMutation = useApiMutation(
        (id: number) => api.admins.delete(id),
        {
            successMessage: 'Meter Reader deleted successfully',
            errorMessage: 'Failed to delete Meter Reader',
            invalidateQueries: [['admins']],
        }
    );

    const getRoleBadgeColor = () => {
        return "bg-amber-50 text-amber-700"; // All Meter Readers have same color
    };

    const handleAddAgent = async (newAgent: Agent) => {
        if (!meterAdminRoleId || !newAgent.password) {
            return;
        }

        // Validate and trim required fields
        const trimmedName = newAgent.name?.trim();
        const trimmedEmail = newAgent.email?.trim();
        const trimmedPhone = newAgent.phone?.trim();

        if (!trimmedName || !trimmedEmail || !trimmedPhone) {
            return;
        }

        await createMutation.mutateAsync({
            fullName: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            password: newAgent.password,
            roleId: meterAdminRoleId,
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

        // Recalculate current admin to ensure we have the latest data
        const currentAdminData = getCurrentAdmin();

        // Prevent admin from deleting themselves
        if (currentAdminData && editingAgent.id === currentAdminData.id) {
            toast.error('You cannot delete your own account');
            return;
        }

        await deleteMutation.mutateAsync(editingAgent.id);
        setShowModal(false);
        setEditMode(false);
        setEditingAgent(null);
    };

    if (adminsLoading || rolesLoading) {
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
                            Meter Reader Management
                        </h1>
                        <p className="text-sm text-gray-500">
                            Manage all meter readers who handle meter readings
                        </p>
                    </div>
                    <Button
                        className="bg-primary hover:bg-primary-600 text-white px-6 rounded-lg shadow-sm"
                        onClick={() => setShowModal(true)}
                    >
                        + Add Meter Reader
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
                                    City Corporation
                                </TableHead>
                                <TableHead className="text-sm font-semibold text-gray-700">
                                    Zone
                                </TableHead>
                                <TableHead className="text-sm font-semibold text-gray-700">
                                    Ward
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
                                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                        {searchTerm ? 'No meter readers found matching your search' : 'No meter readers found'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAdmins.map((admin, index) => {
                                    return (
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
                                            <TableCell className="text-sm text-gray-600">
                                                {HARDCODED_LOCATION.cityCorporation}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {HARDCODED_LOCATION.zone}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {HARDCODED_LOCATION.ward}
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
                                    );
                                })
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
                roleFixed="Meter Admin"
                onDelete={shouldShowDeleteButton ? handleDelete : undefined}
                modalTitle={editMode ? "Edit Meter Reader" : "Add Meter Reader"}
                submitButtonText={editMode ? "Save Changes" : "Add Meter Reader"}
            />
        </div>
    );
}
