import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Edit, Trash2, Star, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { toast } from 'sonner';
import { PageHeader } from '../components/zoneScoring/PageHeader';
import { StatusBadge } from '../components/zoneScoring/StatusBadge';
import type { TariffCategory, CreateTariffCategoryDto, UpdateTariffCategoryDto, TariffCategorySettings, UpdateTariffCategorySettingsDto } from '../types';
import { TariffCategoryModal } from '../components/modals/TariffCategoryModal';

export function TariffCategoryView() {
  const { settingsId } = useParams<{ settingsId: string }>();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TariffCategory | null>(null);
  const [settingsFormData, setSettingsFormData] = useState({
    productionCost: '',
    baseRate: '',
    currentTariff: '',
    currentTubewellTariff: '',
    tubewellRatioStandard: '',
    tubewellRatioCommercial: '',
    aboveBaseIncreasePercent: '',
    belowBaseDecreasePercent: '',
    commercialIncreasePercent: '',
    governmentIncreasePercent: '',
  });
  const [hasSettingsChanges, setHasSettingsChanges] = useState(false);

  // Fetch settings
  const { data: settingsData, isLoading: settingsLoading } = useApiQuery<TariffCategorySettings>(
    ['tariff-category-settings', settingsId],
    () => api.tariffCategorySettings.getById(parseInt(settingsId || '0', 10)),
    { enabled: !!settingsId }
  );

  // Fetch all settings for modal
  const { data: allSettings = [] } = useApiQuery(
    ['tariff-category-settings'],
    () => api.tariffCategorySettings.getAll()
  );

  // Fetch categories for this settings ID
  const { data: categories = [], isLoading: categoriesLoading } = useApiQuery<TariffCategory[]>(
    ['tariff-category', settingsId],
    () => api.tariffCategory.getAll(parseInt(settingsId || '0', 10)),
    { enabled: !!settingsId }
  );

  // Create mutation
  const createMutation = useApiMutation(
    (data: CreateTariffCategoryDto) => api.tariffCategory.create(data),
    {
      onSuccess: () => {
        toast.success('Tariff category created successfully');
        setIsCreateModalOpen(false);
      },
      onError: (error) => {
        toast.error(`Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}`);
      },
      invalidateQueries: [['tariff-category'], ['tariff-category', settingsId]],
    }
  );

  // Update mutation
  const updateMutation = useApiMutation(
    ({ id, data }: { id: number; data: UpdateTariffCategoryDto }) =>
      api.tariffCategory.update(id, data),
    {
      onSuccess: () => {
        toast.success('Tariff category updated successfully');
        setIsEditModalOpen(false);
        setEditingCategory(null);
      },
      onError: (error) => {
        toast.error(`Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}`);
      },
      invalidateQueries: [['tariff-category'], ['tariff-category', settingsId]],
    }
  );

  // Delete mutation
  const deleteMutation = useApiMutation(
    (id: number) => api.tariffCategory.delete(id),
    {
      onSuccess: () => {
        toast.success('Category deleted successfully');
      },
      onError: (error) => {
        toast.error(`Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`);
      },
      invalidateQueries: [['tariff-category'], ['tariff-category', settingsId]],
    }
  );

  // Set as Base mutation
  const setBaseMutation = useApiMutation(
    ({ id, data }: { id: number; data: UpdateTariffCategoryDto }) =>
      api.tariffCategory.update(id, data),
    {
      onSuccess: () => {
        toast.success('Category set as base successfully');
      },
      onError: (error) => {
        toast.error(`Failed to set base category: ${error instanceof Error ? error.message : 'Unknown error'}`);
      },
      invalidateQueries: [['tariff-category'], ['tariff-category', settingsId]],
    }
  );

  // Set as Active mutation
  const setActiveMutation = useApiMutation(
    ({ id, data }: { id: number; data: UpdateTariffCategoryDto }) =>
      api.tariffCategory.update(id, data),
    {
      onSuccess: () => {
        toast.success('Category set as active successfully');
      },
      onError: (error) => {
        toast.error(`Failed to set active category: ${error instanceof Error ? error.message : 'Unknown error'}`);
      },
      invalidateQueries: [['tariff-category'], ['tariff-category', settingsId]],
    }
  );

  // Update settings mutation
  const updateSettingsMutation = useApiMutation(
    ({ id, data }: { id: number; data: UpdateTariffCategorySettingsDto }) =>
      api.tariffCategorySettings.update(id, data),
    {
      onSuccess: () => {
        toast.success('Settings updated successfully');
        setHasSettingsChanges(false);
      },
      onError: (error) => {
        toast.error(`Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      },
      invalidateQueries: [['tariff-category-settings'], ['tariff-category-settings', settingsId], ['tariff-category']],
    }
  );

  // Load settings form data when settings are loaded
  useEffect(() => {
    if (settingsData) {
      setSettingsFormData({
        productionCost: settingsData.productionCost.toString(),
        baseRate: settingsData.baseRate.toString(),
        currentTariff: settingsData.currentTariff.toString(),
        currentTubewellTariff: settingsData.currentTubewellTariff.toString(),
        tubewellRatioStandard: settingsData.tubewellRatioStandard?.toString() || '',
        tubewellRatioCommercial: settingsData.tubewellRatioCommercial?.toString() || '',
        aboveBaseIncreasePercent: settingsData.aboveBaseIncreasePercent?.toString() || '',
        belowBaseDecreasePercent: settingsData.belowBaseDecreasePercent?.toString() || '',
        commercialIncreasePercent: settingsData.commercialIncreasePercent?.toString() || '',
        governmentIncreasePercent: settingsData.governmentIncreasePercent?.toString() || '',
      });
      setHasSettingsChanges(false);
    }
  }, [settingsData]);

  const handleSettingsInputChange = (field: string, value: string) => {
    setSettingsFormData(prev => ({ ...prev, [field]: value }));
    setHasSettingsChanges(true);
  };

  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!settingsId) {
      toast.error('Settings ID is required');
      return;
    }

    // Validate required fields
    if (!settingsFormData.productionCost || !settingsFormData.baseRate || !settingsFormData.currentTariff || !settingsFormData.currentTubewellTariff) {
      toast.error('Please fill in all required fields');
      return;
    }

    const submitData: UpdateTariffCategorySettingsDto = {
      productionCost: parseFloat(settingsFormData.productionCost),
      baseRate: parseFloat(settingsFormData.baseRate),
      currentTariff: parseFloat(settingsFormData.currentTariff),
      currentTubewellTariff: parseFloat(settingsFormData.currentTubewellTariff),
      ...(settingsFormData.tubewellRatioStandard && { tubewellRatioStandard: parseFloat(settingsFormData.tubewellRatioStandard) }),
      ...(settingsFormData.tubewellRatioCommercial && { tubewellRatioCommercial: parseFloat(settingsFormData.tubewellRatioCommercial) }),
      ...(settingsFormData.aboveBaseIncreasePercent && { aboveBaseIncreasePercent: parseFloat(settingsFormData.aboveBaseIncreasePercent) }),
      ...(settingsFormData.belowBaseDecreasePercent && { belowBaseDecreasePercent: parseFloat(settingsFormData.belowBaseDecreasePercent) }),
      ...(settingsFormData.commercialIncreasePercent && { commercialIncreasePercent: parseFloat(settingsFormData.commercialIncreasePercent) }),
      ...(settingsFormData.governmentIncreasePercent && { governmentIncreasePercent: parseFloat(settingsFormData.governmentIncreasePercent) }),
    };

    updateSettingsMutation.mutate({ id: parseInt(settingsId), data: submitData });
  };

  const handleSettingsCancel = () => {
    if (settingsData) {
      setSettingsFormData({
        productionCost: settingsData.productionCost.toString(),
        baseRate: settingsData.baseRate.toString(),
        currentTariff: settingsData.currentTariff.toString(),
        currentTubewellTariff: settingsData.currentTubewellTariff.toString(),
        tubewellRatioStandard: settingsData.tubewellRatioStandard?.toString() || '',
        tubewellRatioCommercial: settingsData.tubewellRatioCommercial?.toString() || '',
        aboveBaseIncreasePercent: settingsData.aboveBaseIncreasePercent?.toString() || '',
        belowBaseDecreasePercent: settingsData.belowBaseDecreasePercent?.toString() || '',
        commercialIncreasePercent: settingsData.commercialIncreasePercent?.toString() || '',
        governmentIncreasePercent: settingsData.governmentIncreasePercent?.toString() || '',
      });
      setHasSettingsChanges(false);
    }
  };

  const isSettingsFormValid = 
    settingsFormData.productionCost.trim() !== '' &&
    settingsFormData.baseRate.trim() !== '' &&
    settingsFormData.currentTariff.trim() !== '' &&
    settingsFormData.currentTubewellTariff.trim() !== '' &&
    !isNaN(parseFloat(settingsFormData.productionCost)) &&
    !isNaN(parseFloat(settingsFormData.baseRate)) &&
    !isNaN(parseFloat(settingsFormData.currentTariff)) &&
    !isNaN(parseFloat(settingsFormData.currentTubewellTariff));

  const handleCreate = (data: CreateTariffCategoryDto | UpdateTariffCategoryDto) => {
    createMutation.mutate(data as CreateTariffCategoryDto);
  };

  const handleEdit = (category: TariffCategory) => {
    setEditingCategory(category);
    setIsEditModalOpen(true);
  };

  const handleUpdate = (data: CreateTariffCategoryDto | UpdateTariffCategoryDto) => {
    if (!editingCategory) return;
    updateMutation.mutate({ id: editingCategory.id, data: data as UpdateTariffCategoryDto });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSetBase = async (category: TariffCategory) => {
    // Base category can only be set for Domestic categories
    if (category.category !== 'Domestic') {
      toast.error('Base category can only be set for Domestic categories');
      return;
    }

    // First, unset all other base categories of the same type and settings
    const sameTypeCategories = categories.filter(
      cat => 
        cat.category === 'Domestic' &&
        cat.settingsId === category.settingsId &&
        cat.id !== category.id &&
        cat.isBaseCategory
    );

    // Unset other base categories
    for (const cat of sameTypeCategories) {
      await updateMutation.mutateAsync({ 
        id: cat.id, 
        data: { isBaseCategory: false } 
      });
    }

    // Set this category as base
    setBaseMutation.mutate({ 
      id: category.id, 
      data: { isBaseCategory: true } 
    });
  };

  const handleSetActive = async (category: TariffCategory) => {
    setActiveMutation.mutate({ 
      id: category.id, 
      data: { isActive: true } 
    });
  };

  // Format range display
  const formatRange = (category: TariffCategory): string => {
    if (category.lowerRange !== undefined && category.upperRange !== undefined) {
      if (category.lowerRange === category.upperRange) {
        return `${category.lowerRange} sq ft`;
      }
      return `${category.lowerRange} - ${category.upperRange} sq ft`;
    } else if (category.lowerRange !== undefined) {
      return `${category.lowerRange}+ sq ft`;
    } else if (category.rangeDescription) {
      return category.rangeDescription;
    }
    return 'N/A';
  };

  if (settingsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!settingsData) {
    return (
      <div className="min-h-screen bg-[#f8f9fb]">
        <div className="px-4 md:px-8 py-4 md:py-6">
          <PageHeader
            title="Settings Not Found"
            description="The requested settings configuration could not be found"
            backUrl="/tariff-admin/config"
            backLabel="Back to Tariff Categories"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-8 py-6">
        <PageHeader
          title={`Settings #${settingsId} Configuration`}
          description={`Manage settings and categories for configuration #${settingsId}`}
          backUrl="/tariff-admin/config"
          backLabel="Back to Tariff Categories"
        >
          <div className="mt-2 flex items-center gap-3">
            <StatusBadge status={settingsData.isActive ? 'active' : 'draft'} />
          </div>
        </PageHeader>

        {/* Unified Layout: Settings Form and Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings Configuration Form - Left/Top */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Settings Configuration</h2>
              <p className="text-sm text-gray-500 mt-1">Configure tariff calculation parameters</p>
            </div>

            <form onSubmit={handleSettingsSave} className="space-y-6">
              {/* Required Fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Required Fields</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productionCost" className="text-sm font-medium text-gray-700">
                      Production Cost (BDT/1000L) *
                    </Label>
                    <Input
                      id="productionCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={settingsFormData.productionCost}
                      onChange={(e) => handleSettingsInputChange('productionCost', e.target.value)}
                      placeholder="Enter production cost"
                      className="bg-gray-50 border-gray-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="baseRate" className="text-sm font-medium text-gray-700">
                      Base Rate (BDT/1000L) *
                    </Label>
                    <Input
                      id="baseRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={settingsFormData.baseRate}
                      onChange={(e) => handleSettingsInputChange('baseRate', e.target.value)}
                      placeholder="Enter base rate"
                      className="bg-gray-50 border-gray-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentTariff" className="text-sm font-medium text-gray-700">
                      Current Tariff (BDT/1000L) *
                    </Label>
                    <Input
                      id="currentTariff"
                      type="number"
                      step="0.01"
                      min="0"
                      value={settingsFormData.currentTariff}
                      onChange={(e) => handleSettingsInputChange('currentTariff', e.target.value)}
                      placeholder="Enter current tariff"
                      className="bg-gray-50 border-gray-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentTubewellTariff" className="text-sm font-medium text-gray-700">
                      Current Tubewell Tariff (BDT/1000L) *
                    </Label>
                    <Input
                      id="currentTubewellTariff"
                      type="number"
                      step="0.01"
                      min="0"
                      value={settingsFormData.currentTubewellTariff}
                      onChange={(e) => handleSettingsInputChange('currentTubewellTariff', e.target.value)}
                      placeholder="Enter tubewell tariff"
                      className="bg-gray-50 border-gray-300"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Optional Fields */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">Optional Fields</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tubewellRatioStandard" className="text-sm font-medium text-gray-700">
                      Tubewell Ratio Standard (%)
                    </Label>
                    <Input
                      id="tubewellRatioStandard"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={settingsFormData.tubewellRatioStandard}
                      onChange={(e) => handleSettingsInputChange('tubewellRatioStandard', e.target.value)}
                      placeholder="e.g., 40"
                      className="bg-gray-50 border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tubewellRatioCommercial" className="text-sm font-medium text-gray-700">
                      Tubewell Ratio Commercial (%)
                    </Label>
                    <Input
                      id="tubewellRatioCommercial"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={settingsFormData.tubewellRatioCommercial}
                      onChange={(e) => handleSettingsInputChange('tubewellRatioCommercial', e.target.value)}
                      placeholder="e.g., 60"
                      className="bg-gray-50 border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aboveBaseIncreasePercent" className="text-sm font-medium text-gray-700">
                      Above Base Increase (%)
                    </Label>
                    <Input
                      id="aboveBaseIncreasePercent"
                      type="number"
                      step="0.01"
                      value={settingsFormData.aboveBaseIncreasePercent}
                      onChange={(e) => handleSettingsInputChange('aboveBaseIncreasePercent', e.target.value)}
                      placeholder="Enter increase percentage"
                      className="bg-gray-50 border-gray-300"
                    />
                    <p className="text-xs text-gray-500">
                      Percentage increase for Domestic categories above the base category (only applies to Domestic)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="belowBaseDecreasePercent" className="text-sm font-medium text-gray-700">
                      Below Base Decrease (%)
                    </Label>
                    <Input
                      id="belowBaseDecreasePercent"
                      type="number"
                      step="0.01"
                      value={settingsFormData.belowBaseDecreasePercent}
                      onChange={(e) => handleSettingsInputChange('belowBaseDecreasePercent', e.target.value)}
                      placeholder="Enter decrease percentage"
                      className="bg-gray-50 border-gray-300"
                    />
                    <p className="text-xs text-gray-500">
                      Percentage decrease for Domestic categories below the base category (only applies to Domestic)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commercialIncreasePercent" className="text-sm font-medium text-gray-700">
                      Commercial Increase (%)
                    </Label>
                    <Input
                      id="commercialIncreasePercent"
                      type="number"
                      step="0.01"
                      value={settingsFormData.commercialIncreasePercent}
                      onChange={(e) => handleSettingsInputChange('commercialIncreasePercent', e.target.value)}
                      placeholder="e.g., 100"
                      className="bg-gray-50 border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="governmentIncreasePercent" className="text-sm font-medium text-gray-700">
                      Government Increase (%)
                    </Label>
                    <Input
                      id="governmentIncreasePercent"
                      type="number"
                      step="0.01"
                      value={settingsFormData.governmentIncreasePercent}
                      onChange={(e) => handleSettingsInputChange('governmentIncreasePercent', e.target.value)}
                      placeholder="e.g., 0"
                      className="bg-gray-50 border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {hasSettingsChanges && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSettingsCancel}
                    disabled={updateSettingsMutation.isPending}
                    className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isSettingsFormValid || updateSettingsMutation.isPending}
                    className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
                  >
                    {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </form>
          </div>

          {/* Categories Section - Right/Bottom */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
                <p className="text-sm text-gray-500 mt-1">Manage tariff categories for this settings</p>
              </div>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-4 flex items-center gap-2"
              >
                <Plus size={16} />
                Create Category
              </Button>
            </div>

                {categories.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500">
                  No categories found for Settings #{settingsId}. Create your first category to get started.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-gray-50">
                  <TableHead className="text-sm font-semibold text-gray-700">SL No</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Name</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Category</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Range</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center">Base</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center">Fixed Rate</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center">Active</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} className="border-gray-100">
                    <TableCell className="text-sm font-medium text-gray-900">{category.slNo}</TableCell>
                    <TableCell className="text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        {category.name}
                        {category.isBaseCategory && (
                          <Star size={14} className="text-green-600" title="Base Category" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{category.category}</TableCell>
                    <TableCell className="text-sm text-gray-600">{formatRange(category)}</TableCell>
                    <TableCell className="text-center">
                      {category.isBaseCategory ? (
                        <Badge variant="default" className="bg-green-600 flex items-center gap-1 w-fit mx-auto">
                          <Star size={12} />
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {category.isFixedRate ? (
                        <Badge variant="default" className="bg-blue-600">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={category.isActive ? 'active' : 'draft'} />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="grid grid-cols-[auto_160px_auto] items-center gap-2 mx-auto w-fit">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          className="border-gray-300 text-gray-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </Button>
                        <div className="flex justify-center min-w-[160px]">
                          {!category.isBaseCategory && category.category === 'Domestic' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSetBase(category)}
                              disabled={setBaseMutation.isPending}
                              className="border-green-300 text-green-700 rounded-lg h-8 px-3 bg-white hover:bg-green-50 inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                              title="Set as base category (only for Domestic categories)"
                            >
                              <Star size={14} />
                              Set as Base
                            </Button>
                          )}
                          {category.isBaseCategory && (
                            <span className="text-xs text-gray-500 px-3 py-2 whitespace-nowrap" title="Base category (used for increment/decrement calculations)">
                              Base Category
                            </span>
                          )}
                          {!category.isActive && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSetActive(category)}
                              disabled={setActiveMutation.isPending}
                              className="border-blue-300 text-blue-700 rounded-lg h-8 px-3 bg-white hover:bg-blue-50 inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap ml-2"
                            >
                              <CheckCircle size={14} />
                              Set as Active
                            </Button>
                          )}
                          {category.isActive && !category.isBaseCategory && (
                            <span className="text-xs text-gray-500 px-3 py-2 whitespace-nowrap">
                              Active
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          disabled={deleteMutation.isPending}
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
        </div>

        {/* Create Modal */}
        <TariffCategoryModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreate}
          isSubmitting={createMutation.isPending}
          settings={allSettings as TariffCategorySettings[]}
        />

        {/* Edit Modal */}
        {editingCategory && (
          <TariffCategoryModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingCategory(null);
            }}
            onSubmit={handleUpdate}
            isSubmitting={updateMutation.isPending}
            initialData={editingCategory}
            mode="edit"
            settings={allSettings as TariffCategorySettings[]}
          />
        )}
      </div>
    </div>
  );
}
