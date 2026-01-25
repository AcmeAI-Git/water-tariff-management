import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { toast } from 'sonner';
import type { TariffCategorySettings, CreateTariffCategorySettingsDto, UpdateTariffCategorySettingsDto } from '../types';
import { TariffCategorySettingsModal } from '../components/modals/TariffCategorySettingsModal';

export function TariffCategorySettingsManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSettings, setEditingSettings] = useState<TariffCategorySettings | null>(null);

  // Fetch all settings
  const { data: allSettings = [], isLoading } = useApiQuery(
    ['tariff-category-settings'],
    () => api.tariffCategorySettings.getAll()
  );

  // Fetch active settings
  const { data: activeSettings } = useApiQuery(
    ['tariff-category-settings', 'active'],
    () => api.tariffCategorySettings.getActive(),
    { retry: false } // Don't retry if no active settings exist
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
      <div className="min-h-screen bg-app flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tariff Category Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage tariff category calculation settings</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary hover:bg-primary-600 text-white"
        >
          <Plus size={16} className="mr-2" />
          Create Settings
        </Button>
      </div>

      {/* Active Settings Banner */}
      {activeSettings && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-blue-600" size={20} />
              <div>
                <h3 className="font-semibold text-blue-900">Active Settings</h3>
                <p className="text-sm text-blue-700">
                  Production Cost: {activeSettings.productionCost} BDT/1000L | 
                  Base Rate: {activeSettings.baseRate} BDT/1000L | 
                  Current Tariff: {activeSettings.currentTariff} BDT/1000L
                </p>
              </div>
            </div>
            <Badge variant="default" className="bg-blue-600">Active</Badge>
          </div>
        </div>
      )}

      {/* Settings Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Production Cost</TableHead>
              <TableHead>Base Rate</TableHead>
              <TableHead>Current Tariff</TableHead>
              <TableHead>Tubewell Tariff</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allSettings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No settings found. Create your first settings to get started.
                </TableCell>
              </TableRow>
            ) : (
              allSettings.map((settings) => (
                <TableRow key={settings.id}>
                  <TableCell className="font-medium">{settings.id}</TableCell>
                  <TableCell>{settings.productionCost} BDT/1000L</TableCell>
                  <TableCell>{settings.baseRate} BDT/1000L</TableCell>
                  <TableCell>{settings.currentTariff} BDT/1000L</TableCell>
                  <TableCell>{settings.currentTubewellTariff} BDT/1000L</TableCell>
                  <TableCell>
                    {settings.isActive ? (
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(settings.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!settings.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivate(settings.id)}
                          disabled={activateMutation.isPending}
                        >
                          <CheckCircle size={14} className="mr-1" />
                          Activate
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(settings)}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(settings.id)}
                        disabled={deleteMutation.isPending || settings.isActive}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
