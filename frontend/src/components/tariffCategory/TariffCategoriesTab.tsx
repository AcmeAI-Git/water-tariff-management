import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../services/api';
import { useApiQuery, useApiMutation } from '../../hooks/useApiQuery';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'sonner';
import type { 
  TariffCategorySettings, 
  CreateTariffCategorySettingsDto
} from '../../types';
import { StatusBadge } from '../zoneScoring/StatusBadge';
import { DeleteConfirmationDialog } from '../zoneScoring/DeleteConfirmationDialog';
import { EmptyState } from '../zoneScoring/EmptyState';
import { PageHeader } from '../zoneScoring/PageHeader';

interface TariffCategoriesTabProps {
  settings: TariffCategorySettings[];
}

export function TariffCategoriesTab({ settings }: TariffCategoriesTabProps) {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settingsToDelete, setSettingsToDelete] = useState<TariffCategorySettings | null>(null);

  // Fetch all categories to show counts
  const { data: allCategories = [], isLoading: categoriesLoading } = useApiQuery(
    ['tariff-category'],
    () => api.tariffCategory.getAll()
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

  // Delete settings mutation
  const deleteSettingsMutation = useApiMutation(
    (id: number) => api.tariffCategorySettings.delete(id),
    {
      successMessage: 'Settings deleted successfully',
      errorMessage: 'Failed to delete settings',
      invalidateQueries: [['tariff-category-settings'], ['tariff-category']],
    }
  );

  // Create settings mutation (minimal - just required fields)
  const createSettingsMutation = useApiMutation(
    (data: CreateTariffCategorySettingsDto) => api.tariffCategorySettings.create(data),
    {
      onSuccess: () => {
        toast.success('Settings created successfully');
      },
      errorMessage: 'Failed to create settings',
      invalidateQueries: [['tariff-category-settings']],
    }
  );

  const handleCreateSettings = () => {
    // Create with minimal required fields (default values)
    const minimalData: CreateTariffCategorySettingsDto = {
      productionCost: 0,
      baseRate: 0,
      currentTariff: 0,
      currentTubewellTariff: 0,
    };
    createSettingsMutation.mutate(minimalData);
  };

  const handleEdit = (settingsId: number) => {
    navigate(`/tariff-admin/tariff-categories/${settingsId}`);
  };

  const handleDelete = (setting: TariffCategorySettings) => {
    setSettingsToDelete(setting);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (settingsToDelete) {
      await deleteSettingsMutation.mutateAsync(settingsToDelete.id);
      setSettingsToDelete(null);
    }
  };

  const handleSetActive = async (settingsId: number) => {
    await setSettingsActiveMutation.mutateAsync(settingsId);
  };

  // Get category count for a settings ID
  const getCategoryCount = (settingsId: number): number => {
    return allCategories.filter(cat => cat.settingsId === settingsId).length;
  };

  // Sort settings by ID descending (newest first)
  const sortedSettings = [...settings].sort((a, b) => b.id - a.id);

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-8 py-6">
        <PageHeader
          title="Tariff Settings"
          description="Manage tariff category settings and configurations"
          showBackButton={false}
        />

        {/* Create Button */}
        <div className="mb-6">
          <Button
            onClick={handleCreateSettings}
            disabled={createSettingsMutation.isPending}
            className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-11 px-6 flex items-center gap-2 disabled:opacity-50"
          >
            <Plus size={18} />
            {createSettingsMutation.isPending ? 'Creating...' : 'Create New Settings'}
          </Button>
        </div>

        {/* Settings Table */}
        {sortedSettings.length === 0 ? (
          <EmptyState
            title="No tariff settings found"
            actionLabel="Create Your First Settings"
            onAction={handleCreateSettings}
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Settings</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-gray-50">
                  <TableHead className="text-sm font-semibold text-gray-700">Settings ID</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Production Cost</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Base Rate</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Current Tariff</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Categories</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSettings.map((setting) => (
                  <TableRow key={setting.id} className="border-gray-100">
                    <TableCell className="text-sm font-medium text-gray-900">
                      Settings #{setting.id}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {setting.productionCost.toFixed(2)} BDT
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {setting.baseRate.toFixed(2)} BDT
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {setting.currentTariff.toFixed(2)} BDT
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {getCategoryCount(setting.id)} categories
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={setting.isActive ? 'active' : 'draft'} />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="grid grid-cols-[auto_160px_auto] items-center gap-2 mx-auto w-fit">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(setting.id)}
                          className="border-gray-300 text-gray-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                          title="View/Edit"
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
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setSettingsToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Settings"
          description="Are you sure you want to delete"
          itemName={settingsToDelete ? `Settings #${settingsToDelete.id}` : undefined}
          isPending={deleteSettingsMutation.isPending}
        />
      </div>
    </div>
  );
}
