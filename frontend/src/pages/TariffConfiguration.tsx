import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { PageHeader } from '../components/zoneScoring/PageHeader';
import { EmptyState } from '../components/zoneScoring/EmptyState';
import { DeleteConfirmationDialog } from '../components/zoneScoring/DeleteConfirmationDialog';
import { TariffCategorySettingsModal } from '../components/modals/TariffCategorySettingsModal';
import { ThresholdSlabsSection } from '../components/tariff/ThresholdSlabsSection';
import type {
  TariffCategorySettings,
  CreateTariffCategorySettingsDto,
  UpdateTariffCategorySettingsDto,
  TariffPolicy,
} from '../types';

export function TariffConfiguration() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSettings, setEditingSettings] = useState<TariffCategorySettings | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settingsToDelete, setSettingsToDelete] = useState<TariffCategorySettings | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'threshold'>('settings');

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

  // Tariff policy: all policies and active one
  const { data: allPolicies = [] } = useApiQuery<TariffPolicy[]>(
    ['tariff-policy'],
    () => api.tariffPolicy.getAll()
  );
  const { data: activePolicy } = useApiQuery<TariffPolicy>(
    ['tariff-policy', 'active'],
    () => api.tariffPolicy.getActive()
  );
  const activatePolicyMutation = useApiMutation(
    (id: number) => api.tariffPolicy.activate(id),
    {
      successMessage: 'Tariff policy activated successfully',
      errorMessage: 'Failed to activate tariff policy',
      invalidateQueries: [['tariff-policy', 'active']], // Only invalidate active, not all policies
    }
  );

  const getPolicyTypeLabel = (type: string) => {
    switch (type) {
      case 'AREA_BASED':
        return 'Area Based';
      case 'FIXED':
        return 'Fixed';
      case 'THRESHOLD':
        return 'Threshold';
      default:
        return type;
    }
  };
  const getPolicyTypeDescription = (type: string) => {
    switch (type) {
      case 'AREA_BASED':
        return 'Billing based on area/zones';
      case 'FIXED':
        return 'Fixed rate billing';
      case 'THRESHOLD':
        return 'Billing based on consumption slabs';
      default:
        return '';
    }
  };

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

  // Auto-switch tab when policy changes (but not for FIXED - let user choose)
  useEffect(() => {
    if (activePolicy?.tariffType === 'AREA_BASED') {
      setActiveTab('settings');
    } else if (activePolicy?.tariffType === 'THRESHOLD') {
      setActiveTab('threshold');
    }
    // For FIXED, don't auto-switch - keep current tab
  }, [activePolicy?.tariffType]);

  // Sort settings by ID descending (newest first)
  const sortedSettings = [...allSettings].sort((a, b) => b.id - a.id);

  // Check if tabs should be enabled
  const isAreaBased = activePolicy?.tariffType === 'AREA_BASED';
  const isThreshold = activePolicy?.tariffType === 'THRESHOLD';
  const isFixed = activePolicy?.tariffType === 'FIXED';

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

        {/* Tariff Policy dropdown */}
        <div className="mt-6 mb-6">
          <Label className="text-lg font-semibold text-gray-900 block mb-3">
            Tariff Policy
          </Label>
          <p className="text-sm text-gray-600 mb-3">Set active tariff policy</p>
          <Select
            value={activePolicy?.id?.toString() ?? ''}
            onValueChange={(value) => {
              const id = parseInt(value, 10);
              if (!isNaN(id)) activatePolicyMutation.mutate(id);
            }}
            disabled={activatePolicyMutation.isPending}
          >
            <SelectTrigger className="w-full bg-white border-gray-300">
              <SelectValue placeholder="Select tariff policy" />
            </SelectTrigger>
            <SelectContent>
              {allPolicies.map((policy) => (
                <SelectItem key={policy.id} value={policy.id.toString()}>
                  {`${getPolicyTypeLabel(policy.tariffType)} — ${getPolicyTypeDescription(policy.tariffType)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <div className="mt-6 mb-8 border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('settings')}
              disabled={!isAreaBased || isFixed}
              className={`pb-3 text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-[#4C6EF5] text-[#4C6EF5]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              } ${(!isAreaBased || isFixed) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Settings Rulesets
            </button>
            <button
              onClick={() => setActiveTab('threshold')}
              disabled={!isThreshold || isFixed}
              className={`pb-3 text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === 'threshold'
                  ? 'border-[#4C6EF5] text-[#4C6EF5]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              } ${(!isThreshold || isFixed) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Threshold Slabs
            </button>
          </div>
        </div>

        {/* Settings Rulesets Tab */}
        {activeTab === 'settings' && (
          <>
            {!isAreaBased && !isFixed ? (
              <div className="text-sm text-gray-600">
                Select <span className="font-medium text-gray-900">Area Based</span> in the Tariff Policy dropdown above to manage settings and categories.
              </div>
            ) : isFixed ? (
              null
            ) : (
              <>
                {/* Create Button */}
                <div className="mb-6">
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    disabled={createMutation.isPending || !isAreaBased}
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
                    <div className="overflow-x-auto -mx-4 md:mx-0 w-full">
                      <div className="inline-block min-w-full align-middle px-4 md:px-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-200 bg-gray-50">
                              <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap min-w-[100px]">Settings ID</TableHead>
                              <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap min-w-[100px]">Categories</TableHead>
                              <TableHead className="text-sm font-semibold text-gray-700 text-right whitespace-nowrap min-w-[140px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedSettings.map((setting) => (
                              <TableRow 
                                key={setting.id} 
                                className="border-gray-100 cursor-pointer hover:bg-gray-50"
                                onClick={() => navigate(`/tariff-admin/config/${setting.id}`)}
                              >
                                <TableCell className="text-sm font-medium text-gray-900 text-center whitespace-nowrap">
                                  {setting.id}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 text-center whitespace-nowrap">
                                  {categoryCounts[setting.id] || 0}
                                </TableCell>
                                <TableCell className="text-right align-middle">
                                  <div className="flex items-center justify-end gap-1 md:gap-2 flex-wrap">
                                    {setting.isActive && (
                                      <span className="text-xs text-gray-700 bg-gray-100 rounded-md px-2.5 py-1 whitespace-nowrap inline-flex items-center justify-center h-8 font-medium min-w-[80px] md:w-[135px]">
                                        Active
                                      </span>
                                    )}
                                    {!setting.isActive && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSetActive(setting.id);
                                        }}
                                        disabled={setSettingsActiveMutation.isPending || !isAreaBased}
                                        className="border-green-300 text-green-700 rounded-lg h-8 px-2 md:px-3 bg-white hover:bg-green-50 inline-flex items-center justify-center gap-1 disabled:opacity-50 whitespace-nowrap min-w-[32px] md:w-[135px]"
                                        title="Set as Active"
                                      >
                                        <CheckCircle size={14} />
                                        <span className="hidden sm:inline">Set as Active</span>
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/tariff-admin/config/${setting.id}`);
                                      }}
                                      className="border-gray-300 text-gray-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                                      title="View/Edit"
                                    >
                                      <Edit size={14} />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(setting);
                                      }}
                                      disabled={!isAreaBased}
                                      className="border-red-300 text-red-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-red-50 inline-flex items-center justify-center disabled:opacity-50"
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
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Threshold Slabs Tab */}
        {activeTab === 'threshold' && (
          <>
            {!isThreshold && !isFixed ? (
              <div className="text-sm text-gray-600">
                Select <span className="font-medium text-gray-900">Threshold</span> in the Tariff Policy dropdown above to manage slabs.
              </div>
            ) : isFixed ? (
              null
            ) : (
              <ThresholdSlabsSection disabled={!isThreshold} />
            )}
          </>
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
