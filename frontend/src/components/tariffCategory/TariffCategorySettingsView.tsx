import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../services/api';
import { useApiQuery, useApiMutation } from '../../hooks/useApiQuery';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { toast } from 'sonner';
import { StatusBadge } from '../zoneScoring/StatusBadge';
import { DeleteConfirmationDialog } from '../zoneScoring/DeleteConfirmationDialog';
import { EmptyState } from '../zoneScoring/EmptyState';
import { TariffCategorySettingsModal } from '../modals/TariffCategorySettingsModal';
import type { 
  TariffCategorySettings, 
  CreateTariffCategorySettingsDto, 
  UpdateTariffCategorySettingsDto 
} from '../../types';

export function TariffCategorySettingsView() {
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

  // Create mutation
  const createMutation = useApiMutation(
    (data: CreateTariffCategorySettingsDto) => api.tariffCategorySettings.create(data),
    {
      onSuccess: () => {
        toast.success('Settings ruleset created successfully');
        setIsCreateModalOpen(false);
      },
      onError: (error) => {
        toast.error(`Failed to create settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        toast.success('Settings ruleset updated successfully');
        setIsEditModalOpen(false);
        setEditingSettings(null);
      },
      onError: (error) => {
        toast.error(`Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      },
      invalidateQueries: [['tariff-category-settings']],
    }
  );

  // Delete mutation
  const deleteMutation = useApiMutation(
    (id: number) => api.tariffCategorySettings.delete(id),
    {
      onSuccess: () => {
        toast.success('Settings ruleset deleted successfully');
        setSettingsToDelete(null);
      },
      onError: (error) => {
        toast.error(`Failed to delete settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const handleEdit = (settings: TariffCategorySettings) => {
    setEditingSettings(settings);
    setIsEditModalOpen(true);
  };

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
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Button */}
      <div className="flex justify-start">
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-gray-50">
                  <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Settings ID</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Production Cost</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Base Rate</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Current Tariff</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Current Tubewell Tariff</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Tubewell Ratio Standard</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Tubewell Ratio Commercial</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Above Base Increase</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Below Base Decrease</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Commercial Increase</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Government Increase</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSettings.map((setting) => {
                  // Convert decimal to percentage for display
                  const formatPercentage = (value: number | undefined): string => {
                    if (value === undefined || value === null) return 'N/A';
                    // If value > 1, assume it's already in percentage format
                    if (value > 1) return `${value.toFixed(2)}%`;
                    // Otherwise, convert from decimal to percentage
                    return `${(value * 100).toFixed(2)}%`;
                  };

                  return (
                    <TableRow key={setting.id} className="border-gray-100">
                      <TableCell className="text-sm font-medium text-gray-900 text-center">
                        {setting.id}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 text-center">
                        {setting.productionCost.toFixed(2)} BDT
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 text-center">
                        {setting.baseRate.toFixed(2)} BDT
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 text-center">
                        {setting.currentTariff.toFixed(2)} BDT
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 text-center">
                        {setting.currentTubewellTariff.toFixed(2)} BDT
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 text-center">
                        {formatPercentage(setting.tubewellRatioStandard)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 text-center">
                        {formatPercentage(setting.tubewellRatioCommercial)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 text-center">
                        {formatPercentage(setting.aboveBaseIncreasePercent)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 text-center">
                        {formatPercentage(setting.belowBaseDecreasePercent)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 text-center">
                        {formatPercentage(setting.commercialIncreasePercent)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 text-center">
                        {formatPercentage(setting.governmentIncreasePercent)}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={setting.isActive ? 'active' : 'draft'} />
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        <div className="grid grid-cols-[auto_160px_auto] items-center gap-2 mx-auto w-fit">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(setting)}
                            className="border-gray-300 text-gray-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </Button>
                          <div className="flex justify-center min-w-[160px]">
                            {!setting.isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetActive(setting.id)}
                                disabled={setSettingsActiveMutation.isPending}
                                className="border-green-300 text-green-700 rounded-lg h-8 px-3 bg-white hover:bg-green-50 inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                                title="Set as Active"
                              >
                                <CheckCircle size={14} />
                                Set as Active
                              </Button>
                            )}
                            {setting.isActive && (
                              <span className="text-xs text-gray-500 px-3 py-2 whitespace-nowrap">
                                Active
                              </span>
                            )}
                          </div>
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
                  );
                })}
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
  );
}
