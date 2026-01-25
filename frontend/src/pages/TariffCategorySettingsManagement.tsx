import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { toast } from 'sonner';
import type { TariffCategorySettings, CreateTariffCategorySettingsDto, UpdateTariffCategorySettingsDto } from '../types';
import { TariffCategorySettingsModal } from '../components/modals/TariffCategorySettingsModal';
import { StatusBadge } from '../components/zoneScoring/StatusBadge';

export function TariffCategorySettingsManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSettings, setEditingSettings] = useState<TariffCategorySettings | null>(null);

  // Fetch all settings
  const { data: allSettings = [], isLoading } = useApiQuery(
    ['tariff-category-settings'],
    () => api.tariffCategorySettings.getAll()
  );

  // Create mutation
  const createMutation = useApiMutation(
    (data: CreateTariffCategorySettingsDto) => api.tariffCategorySettings.create(data),
    {
      onSuccess: () => {
        toast.success('Tariff category settings created successfully');
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
        toast.success('Tariff category settings updated successfully');
        setIsEditModalOpen(false);
        setEditingSettings(null);
      },
      onError: (error) => {
        toast.error(`Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      },
      invalidateQueries: [['tariff-category-settings']],
    }
  );

  // Activate mutation
  const activateMutation = useApiMutation(
    (id: number) => api.tariffCategorySettings.activate(id),
    {
      onSuccess: () => {
        toast.success('Settings activated successfully');
      },
      onError: (error) => {
        toast.error(`Failed to activate settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      },
      invalidateQueries: [['tariff-category-settings']],
    }
  );

  // Delete mutation
  const deleteMutation = useApiMutation(
    (id: number) => api.tariffCategorySettings.delete(id),
    {
      onSuccess: () => {
        toast.success('Settings deleted successfully');
      },
      onError: (error) => {
        toast.error(`Failed to delete settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      },
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

  const handleActivate = (id: number) => {
    if (window.confirm('Are you sure you want to activate these settings? This will deactivate the current active settings.')) {
      activateMutation.mutate(id);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete these settings? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-gray-900 mb-1">Tariff Category Settings</h1>
          <p className="text-sm text-gray-500">Manage tariff category calculation settings</p>
        </div>

        {/* Create Button */}
        <div className="mb-6">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-11 px-6 flex items-center gap-2"
          >
            <Plus size={18} />
            Create Settings
          </Button>
        </div>

        {/* Settings Table */}
        {allSettings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No settings found. Create your first settings to get started.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Settings</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-gray-50">
                  <TableHead className="text-sm font-semibold text-gray-700">ID</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Production Cost</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Base Rate</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Current Tariff</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Tubewell Tariff</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center">Status</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Created</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSettings.map((settings) => (
                  <TableRow key={settings.id} className="border-gray-100">
                    <TableCell className="text-sm font-medium text-gray-900">{settings.id}</TableCell>
                    <TableCell className="text-sm text-gray-600">{settings.productionCost} BDT/1000L</TableCell>
                    <TableCell className="text-sm text-gray-600">{settings.baseRate} BDT/1000L</TableCell>
                    <TableCell className="text-sm text-gray-600">{settings.currentTariff} BDT/1000L</TableCell>
                    <TableCell className="text-sm text-gray-600">{settings.currentTubewellTariff} BDT/1000L</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={settings.isActive ? 'active' : 'draft'} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(settings.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="grid grid-cols-[auto_160px_auto] items-center gap-2 mx-auto w-fit">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(settings)}
                          className="border-gray-300 text-gray-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </Button>
                        <div className="flex justify-center min-w-[160px]">
                          {!settings.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivate(settings.id)}
                              disabled={activateMutation.isPending}
                              className="border-green-300 text-green-700 rounded-lg h-8 px-3 bg-white hover:bg-green-50 inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                            >
                              <CheckCircle size={14} />
                              Set as Active
                            </Button>
                          )}
                          {settings.isActive && (
                            <span className="text-xs text-gray-500 px-3 py-2 whitespace-nowrap">
                              Active
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(settings.id)}
                          disabled={deleteMutation.isPending || settings.isActive}
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
      </div>

      {/* Create Modal */}
      <TariffCategorySettingsModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
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
    </div>
  );
}
