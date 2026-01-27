import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { PageHeader } from '../components/zoneScoring/PageHeader';
import { EmptyState } from '../components/zoneScoring/EmptyState';
import { DeleteConfirmationDialog } from '../components/zoneScoring/DeleteConfirmationDialog';
import { TariffCategorySettingsModal } from '../components/modals/TariffCategorySettingsModal';
import type { 
  TariffCategorySettings, 
  CreateTariffCategorySettingsDto, 
  UpdateTariffCategorySettingsDto 
} from '../types';

export function TariffConfiguration() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSettings, setEditingSettings] = useState<TariffCategorySettings | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settingsToDelete, setSettingsToDelete] = useState<TariffCategorySettings | null>(null);

  // Fetch all settings
  const { data: allSettings = [], isLoading: settingsLoading } = useApiQuery(
    ['tariff-category-settings'],
    () => api.tariffCategorySettings.getAll()
  );

  // Fetch all categories to count per settingsId
  const { data: allCategories = [] } = useApiQuery(
    ['tariff-category'],
    () => api.tariffCategory.getAll()
  );

  // Calculate category count per settingsId
  const categoryCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    allCategories.forEach(cat => {
      counts[cat.settingsId] = (counts[cat.settingsId] || 0) + 1;
    });
    return counts;
  }, [allCategories]);

  // Create mutation
  const createMutation = useApiMutation(
    (data: CreateTariffCategorySettingsDto) => api.tariffCategorySettings.create(data),
    {
      onSuccess: () => {
        setIsCreateModalOpen(false);
      },
      invalidateQueries: [['tariff-category-settings']],
    }
  );

  // Update mutation
  const updateMutation = useApiMutation(
    ({ id, data }: { id: number; data: UpdateTariffCategorySettingsDto }) =>
      api.tariffCategorySettings.update(id, data),
    {
      onSuccess: () => {
        setIsEditModalOpen(false);
        setEditingSettings(null);
      },
      invalidateQueries: [['tariff-category-settings']],
    }
  );

  // Delete mutation
  const deleteMutation = useApiMutation(
    (id: number) => api.tariffCategorySettings.delete(id),
    {
      onSuccess: () => {
        setSettingsToDelete(null);
      },
      invalidateQueries: [['tariff-category-settings'], ['tariff-category']],
    }
  );

  // Set settings as active mutation
  const setSettingsActiveMutation = useApiMutation(
    (id: number) => api.tariffCategorySettings.activate(id),
    {
      successMessage: 'Settings activated successfully',
      errorMessage: 'Failed to activate settings',
      invalidateQueries: [['tariff-category-settings']],
    }
  );

  const handleCreate = (data: CreateTariffCategorySettingsDto | UpdateTariffCategorySettingsDto) => {
    createMutation.mutate(data as CreateTariffCategorySettingsDto);
  };

  // const handleEdit = (settings: TariffCategorySettings) => {
  //   setEditingSettings(settings);
  //   setIsEditModalOpen(true);
  // };

  const handleUpdate = (data: CreateTariffCategorySettingsDto | UpdateTariffCategorySettingsDto) => {
    if (!editingSettings) return;
    updateMutation.mutate({ id: editingSettings.id, data: data as UpdateTariffCategorySettingsDto });
  };

  const handleDelete = (settings: TariffCategorySettings) => {
    setSettingsToDelete(settings);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (settingsToDelete) {
      await deleteMutation.mutateAsync(settingsToDelete.id);
      setSettingsToDelete(null);
    }
  };

  const handleSetActive = async (settingsId: number) => {
    await setSettingsActiveMutation.mutateAsync(settingsId);
  };

  // Sort settings by ID descending (newest first)
  const sortedSettings = [...allSettings].sort((a, b) => b.id - a.id);

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] overflow-x-hidden w-full">
      <div className="px-4 md:px-8 py-4 md:py-6 w-full max-w-full">
        <PageHeader
          title="Tariff Configuration"
          description="Manage tariff settings rulesets and their categories"
          showBackButton={false}
        />

        {/* Create Button */}
        <div className="mb-6">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={createMutation.isPending}
            className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-11 px-6 flex items-center gap-2 disabled:opacity-50"
          >
            <Plus size={18} />
            {createMutation.isPending ? 'Creating...' : 'Create New Settings'}
          </Button>
        </div>

        {/* Settings Table */}
        {sortedSettings.length === 0 ? (
          <EmptyState
            title="No settings rulesets found"
            actionLabel="Create Your First Settings Ruleset"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 bg-gray-50">
                    <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Settings ID</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Categories</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSettings.map((setting) => (
                    <TableRow key={setting.id} className="border-gray-100">
                      <TableCell className="text-sm font-medium text-gray-900 text-center whitespace-nowrap">
                        {setting.id}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 text-center whitespace-nowrap">
                        {categoryCounts[setting.id] || 0}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap align-middle">
                        <div className="flex items-center gap-2">
                          {/* Status indicator or action button - takes available space */}
                          <div className="flex-1 flex justify-end">
                            {setting.isActive && (
                              <span className="text-xs text-gray-700 bg-gray-100 rounded-md px-2.5 py-1 whitespace-nowrap inline-flex items-center h-8 font-medium">
                                Active
                              </span>
                            )}
                            {!setting.isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetActive(setting.id)}
                                disabled={setSettingsActiveMutation.isPending}
                                className="border-green-300 text-green-700 rounded-lg h-8 px-3 bg-white hover:bg-green-50 inline-flex items-center justify-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                                title="Set as Active"
                              >
                                <CheckCircle size={14} />
                                Set as Active
                              </Button>
                            )}
                          </div>
                          
                          {/* Edit button - fixed position */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/tariff-admin/config/${setting.id}`)}
                            className="border-gray-300 text-gray-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                            title="View/Edit"
                          >
                            <Edit size={14} />
                          </Button>
                          
                          {/* Delete button - fixed position */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(setting)}
                            className="border-red-300 text-red-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-red-50 inline-flex items-center justify-center"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Create Modal */}
        <TariffCategorySettingsModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreate}
          isSubmitting={createMutation.isPending}
          mode="create"
        />

        {/* Edit Modal */}
        {editingSettings && (
          <TariffCategorySettingsModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingSettings(null);
            }}
            onSubmit={handleUpdate}
            isSubmitting={updateMutation.isPending}
            initialData={editingSettings}
            mode="edit"
          />
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setSettingsToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Settings Ruleset"
          description="Are you sure you want to delete"
          itemName={settingsToDelete ? `Settings #${settingsToDelete.id}` : undefined}
          isPending={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
