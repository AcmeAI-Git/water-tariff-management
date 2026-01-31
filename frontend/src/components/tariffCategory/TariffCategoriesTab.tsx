import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/input';
import { Plus, Edit, Trash2, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useApiQuery, useApiMutation } from '../../hooks/useApiQuery';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { toast } from 'sonner';
import type { TariffCategory, CreateTariffCategoryDto, UpdateTariffCategoryDto } from '../../types';
import { TariffCategoryModal } from '../modals/TariffCategoryModal';

interface TariffCategoriesTabProps {
  settingsId: number;
}

export function TariffCategoriesTab({ settingsId }: TariffCategoriesTabProps) {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TariffCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoryType, setFilterCategoryType] = useState<string>('all');
  const [settingBaseCategoryId, setSettingBaseCategoryId] = useState<number | null>(null);

  // Fetch settings to pass to modal (commented out as not currently used)
  // const { data: settingsData } = useApiQuery(
  //   ['tariff-category-settings', settingsId],
  //   () => api.tariffCategorySettings.getById(settingsId)
  // );

  // Fetch all settings for modal dropdown
  const { data: allSettings = [] } = useApiQuery(
    ['tariff-category-settings'],
    () => api.tariffCategorySettings.getAll()
  );

  // Fetch categories filtered by settingsId
  const { data: allCategories = [], isLoading } = useApiQuery(
    ['tariff-category', settingsId],
    () => api.tariffCategory.getAll(settingsId),
    { enabled: !!settingsId }
  );

  // Filter categories to only those matching the settingsId (additional client-side filter for safety)
  const categories = useMemo(() => {
    return allCategories.filter(cat => cat.settingsId === settingsId);
  }, [allCategories, settingsId]);

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
      invalidateQueries: [['tariff-category']],
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
      invalidateQueries: [['tariff-category']],
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
      invalidateQueries: [['tariff-category']],
    }
  );

  // Set base category mutation - dedicated mutation without modal side effects
  // Note: Currently unused but kept for potential future use
  // const setBaseMutation = useApiMutation(
  //   ({ id, data }: { id: number; data: UpdateTariffCategoryDto }) =>
  //     api.tariffCategory.update(id, data),
  //   {
  //     onError: (error) => {
  //       toast.error(`Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}`);
  //     },
  //     invalidateQueries: [['tariff-category'], ['tariff-category', settingsId]],
  //   }
  // );

  // Set category as active mutation
  const setActiveMutation = useApiMutation(
    ({ id, data }: { id: number; data: UpdateTariffCategoryDto }) =>
      api.tariffCategory.update(id, data),
    {
      onSuccess: () => {
        toast.success('Category set as active successfully');
      },
      onError: (error) => {
        toast.error(`Failed to set category as active: ${error instanceof Error ? error.message : 'Unknown error'}`);
      },
      invalidateQueries: [['tariff-category']],
    }
  );

  const handleCreate = (data: CreateTariffCategoryDto | UpdateTariffCategoryDto) => {
    const createData = {
      ...data as CreateTariffCategoryDto,
      settingsId: settingsId, // Ensure settingsId is set
    };
    createMutation.mutate(createData);
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

    setSettingBaseCategoryId(category.id);

    try {
      // Set this category as base. Backend may return a single category or all
      // updated categories (with recalculated tariff rates for other domestic categories).
      const response = await api.tariffCategory.update(category.id, {
        isBaseCategory: true,
      }) as TariffCategory | TariffCategory[];

      if (Array.isArray(response)) {
        // Backend sent all changed categories – update cache so UI shows new rates immediately
        queryClient.setQueryData(['tariff-category', settingsId], response);
        queryClient.setQueryData(['tariff-category'], (old: TariffCategory[] | undefined) => {
          if (!old) return response;
          return old.filter((c) => c.settingsId !== settingsId).concat(response);
        });
      } else {
        // Backend returned only the updated category – refetch to get recalculated rates
        queryClient.invalidateQueries({ queryKey: ['tariff-category'] });
        queryClient.invalidateQueries({ queryKey: ['tariff-category', settingsId] });
      }

      toast.success('Base category set successfully');
    } catch (error) {
      console.error('Error setting base category:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to set base category: ${errorMessage}`);
    } finally {
      setSettingBaseCategoryId(null);
    }
  };

  const handleSetActive = (category: TariffCategory) => {
    setActiveMutation.mutate({ 
      id: category.id, 
      data: { isActive: true } 
    });
  };


  // Format range display
  const formatRange = (category: TariffCategory): string => {
    if (category.lowerRange !== undefined && category.upperRange !== undefined) {
      if (category.lowerRange === category.upperRange) {
        // Single threshold - could be "> X" or "<= X"
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

  // Get categories grouped by category type
  const groupedCategories = useMemo(() => {
    const filtered = categories.filter(cat => {
      const matchesSearch = !searchQuery.trim() || 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterCategoryType === 'all' || cat.category === filterCategoryType;
      return matchesSearch && matchesType;
    });

    // Group by category type
    const grouped: Record<string, TariffCategory[]> = {
      Domestic: [],
      Commercial: [],
      Industrial: [],
      Government: [],
      Community: [],
    };

    filtered.forEach(cat => {
      if (grouped[cat.category]) {
        grouped[cat.category].push(cat);
      }
    });

    // Sort Domestic categories by range to show tier structure
    grouped.Domestic.sort((a, b) => {
      const aRange = a.lowerRange ?? 0;
      const bRange = b.lowerRange ?? 0;
      return bRange - aRange; // Descending order (highest first)
    });

    // Sort other categories by name
    Object.keys(grouped).forEach(key => {
      if (key !== 'Domestic') {
        grouped[key].sort((a, b) => a.name.localeCompare(b.name));
      }
    });

    return grouped;
  }, [categories, settingsId, searchQuery, filterCategoryType]);

  // Check for multiple base categories per type
  const getBaseCategoryCount = (categoryType: string): number => {
    return groupedCategories[categoryType]?.filter(cat => cat.isBaseCategory).length || 0;
  };

  // Get base categories for a type
  const getBaseCategories = (categoryType: string): TariffCategory[] => {
    return groupedCategories[categoryType]?.filter(cat => cat.isBaseCategory) || [];
  };

  // Get total category count
  const getTotalCategoryCount = (): number => {
    return Object.values(groupedCategories).reduce((sum, cats) => sum + cats.length, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const categoryTypes = ['all', 'Domestic', 'Commercial', 'Industrial', 'Government', 'Community'];

  const totalCount = getTotalCategoryCount();

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-11 px-6 flex items-center gap-2"
        >
          <Plus size={18} />
          Create Category
        </Button>
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
          />
        </div>

        <select
          value={filterCategoryType}
          onChange={(e) => setFilterCategoryType(e.target.value)}
          className="h-11 px-4 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
        >
          {categoryTypes.map(type => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Types' : type}
            </option>
          ))}
        </select>
      </div>

      {/* Categories Display */}
      {totalCount > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="space-y-6">
            {/* Iterate over category types */}
            {Object.keys(groupedCategories).map(categoryType => {
              const typeCategories = groupedCategories[categoryType as keyof typeof groupedCategories];
              if (typeCategories.length === 0) return null;

              const baseCount = getBaseCategoryCount(categoryType);
              const hasMultipleBases = baseCount > 1;

              return (
                <div key={categoryType} className="border-t border-gray-200 first:border-t-0">
                  {/* Category Type Header */}
                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <h4 className="text-base font-semibold text-gray-900">
                        {categoryType} Categories ({typeCategories.length})
                      </h4>
                      {hasMultipleBases && (
                        <div className="flex items-center gap-1 text-amber-600 text-sm">
                          <AlertTriangle size={14} />
                          <span>Multiple base categories detected</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Categories Table */}
                  <div className="overflow-x-auto -mx-4 md:mx-0">
                    <div className="inline-block min-w-full align-middle px-4 md:px-6">
                      <Table className="w-full min-w-[640px]">
                        <TableHeader>
                          <TableRow className="border-gray-200 bg-gray-50">
                            <TableHead className="text-sm font-semibold text-gray-700 py-2 min-w-[60px]">SL No</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 py-2 min-w-[120px]">Name</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 py-2 min-w-[100px] hidden sm:table-cell">Range</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 py-2 text-right min-w-[100px]">Tariff Rate</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 py-2 text-right min-w-[100px] hidden sm:table-cell">Tubewell Tariff</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 text-center py-2 min-w-[200px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                    <TableBody>
                      {typeCategories.map((category) => {
                        const baseCategoriesForType = getBaseCategories(categoryType);
                        const hasMultipleBasesForCategory = baseCategoriesForType.length > 1;
                        
                        return (
                          <TableRow key={category.id} className="border-gray-100">
                            <TableCell className="text-sm font-medium text-gray-900">{category.slNo}</TableCell>
                            <TableCell className="text-sm text-gray-900">
                              {category.name}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 hidden sm:table-cell">{formatRange(category)}</TableCell>
                            <TableCell className="text-sm text-gray-600 text-right whitespace-nowrap">
                              {category.tariffRate !== undefined && category.tariffRate !== null 
                                ? `${category.tariffRate.toFixed(2)} BDT` 
                                : 'N/A'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 text-right whitespace-nowrap hidden sm:table-cell">
                              {category.tubewellTariff !== undefined && category.tubewellTariff !== null 
                                ? `${category.tubewellTariff.toFixed(2)} BDT` 
                                : 'N/A'}
                            </TableCell>
                            <TableCell className="text-center align-middle">
                              <div className="flex items-center justify-center gap-1 md:gap-2 flex-wrap">
                                {/* Active/Base indicators - before Edit button */}
                                {category.isActive && (
                                  <span className="text-xs text-gray-700 bg-gray-100 rounded-md px-2.5 py-1 whitespace-nowrap inline-flex items-center justify-center h-8 font-medium min-w-[70px] md:w-[135px]">
                                    Active
                                  </span>
                                )}
                                {category.category === 'Domestic' && category.isBaseCategory && (
                                  <span className="text-xs text-green-700 bg-green-100 rounded-md px-2 py-1 whitespace-nowrap inline-flex items-center justify-center h-8 font-medium w-[72px]" title="Base category (used for increment/decrement calculations)">
                                    Base
                                  </span>
                                )}
                                {hasMultipleBasesForCategory && category.isBaseCategory && (
                                  <span title="Multiple base categories exist for this settings ID">
                                    <AlertTriangle size={14} className="text-amber-600 inline-flex items-center h-8" />
                                  </span>
                                )}
                                
                                {/* Set Base button - before Edit for Domestic categories */}
                                {category.category === 'Domestic' && !category.isBaseCategory && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSetBase(category)}
                                    disabled={settingBaseCategoryId !== null}
                                    className="border-blue-300 text-blue-700 rounded-lg h-8 px-2 bg-white hover:bg-blue-50 inline-flex items-center justify-center text-xs disabled:opacity-50 w-[72px]"
                                    title="Set as base category (only for Domestic)"
                                  >
                                    Set Base
                                  </Button>
                                )}
                                
                                {/* Set as Active button - before Edit */}
                                {!category.isActive && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSetActive(category)}
                                    disabled={setActiveMutation.isPending}
                                    className="border-green-300 text-green-700 rounded-lg h-8 px-2 md:px-3 bg-white hover:bg-green-50 inline-flex items-center justify-center gap-1 disabled:opacity-50 whitespace-nowrap min-w-[32px] md:w-[135px]"
                                    title="Set as Active"
                                  >
                                    <CheckCircle size={14} />
                                    <span className="hidden sm:inline">Set as Active</span>
                                  </Button>
                                )}
                                
                                {/* Edit button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(category)}
                                  className="border-gray-300 text-gray-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                                  title="Edit"
                                >
                                  <Edit size={14} />
                                </Button>
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
                        );
                      })}
                    </TableBody>
                  </Table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalCount === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            {searchQuery.trim() || filterCategoryType !== 'all'
              ? `No categories found matching your filters.`
              : 'No categories found for this Settings Ruleset. Create your first category to get started.'}
          </p>
        </div>
      )}

      {/* Create Modal */}
      <TariffCategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
        settings={allSettings}
        defaultSettingsId={settingsId}
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
          settings={allSettings}
          defaultSettingsId={settingsId}
        />
      )}
    </div>
  );
}
