import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Plus, Edit, Trash2, Search, ChevronDown, ChevronRight, Star, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { api } from '../../services/api';
import { useApiQuery, useApiMutation } from '../../hooks/useApiQuery';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { toast } from 'sonner';
import type { TariffCategory, CreateTariffCategoryDto, UpdateTariffCategoryDto, TariffCategorySettings } from '../../types';
import { TariffCategoryModal } from '../modals/TariffCategoryModal';
import { StatusBadge } from '../zoneScoring/StatusBadge';

interface TariffCategoriesTabProps {
  settings: TariffCategorySettings[];
}

export function TariffCategoriesTab({ settings }: TariffCategoriesTabProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TariffCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoryType, setFilterCategoryType] = useState<string>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Domestic', 'Commercial', 'Industrial', 'Government', 'Community']));

  // Fetch all categories
  const { data: categories = [], isLoading } = useApiQuery(
    ['tariff-category'],
    () => api.tariffCategory.getAll(),
    { enabled: true }
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

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
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

  // Group and filter categories
  const groupedCategories = useMemo(() => {
    const filtered = categories.filter(cat => {
      const matchesSearch = !searchQuery.trim() || 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterCategoryType === 'all' || cat.category === filterCategoryType;
      return matchesSearch && matchesType;
    });

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
  }, [categories, searchQuery, filterCategoryType]);

  // Check for multiple base categories per type
  const getBaseCategoryCount = (categoryType: string): number => {
    return groupedCategories[categoryType]?.filter(cat => cat.isBaseCategory).length || 0;
  };

  // Get base categories for a type
  const getBaseCategories = (categoryType: string): TariffCategory[] => {
    return groupedCategories[categoryType]?.filter(cat => cat.isBaseCategory) || [];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const categoryTypes = ['all', 'Domestic', 'Commercial', 'Industrial', 'Government', 'Community'];

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

      {/* Grouped Categories Display */}
      {Object.keys(groupedCategories).map(categoryType => {
        const typeCategories = groupedCategories[categoryType];
        if (typeCategories.length === 0) return null;

        const baseCount = getBaseCategoryCount(categoryType);
        const isExpanded = expandedGroups.has(categoryType);

        return (
          <div key={categoryType} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div 
              className="px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleGroup(categoryType)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="text-gray-400" size={20} />
                  ) : (
                    <ChevronRight className="text-gray-400" size={20} />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {categoryType} Categories ({typeCategories.length})
                  </h3>
                  {baseCount > 0 && (
                    <Badge variant="default" className="bg-green-600 flex items-center gap-1">
                      <Star size={12} />
                      {baseCount} Base{baseCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {baseCount > 1 && (
                    <div className="flex items-center gap-1 text-amber-600 text-sm">
                      <AlertTriangle size={14} />
                      <span>Multiple base categories</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isExpanded && (
              <>
                {/* Tier Visualization for Domestic */}
                {categoryType === 'Domestic' && typeCategories.length > 0 && (
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Category Tiers (Area-based):</div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                      {typeCategories.map((cat, index) => (
                        <div key={cat.id} className="flex items-center gap-2">
                          {index > 0 && <span className="text-gray-400">→</span>}
                          <div className={`px-3 py-1 rounded-lg border ${
                            cat.isBaseCategory 
                              ? 'bg-green-50 border-green-300 text-green-700 font-medium' 
                              : 'bg-white border-gray-200'
                          }`}>
                            <div className="flex items-center gap-1">
                              {cat.isBaseCategory && <Star size={12} className="text-green-600" />}
                              <span>{cat.name}</span>
                            </div>
                            {cat.lowerRange !== undefined && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {formatRange(cat)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-gray-500 italic">
                      Base category is the default tier that matches the calculated area. Categories are evaluated from highest to lowest threshold.
                    </div>
                  </div>
                )}

                {/* Categories Table */}
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="text-sm font-semibold text-gray-700">SL No</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700">Name</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700">Range</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 text-center">Base</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 text-center">Fixed Rate</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 text-center">Active</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700">Settings ID</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typeCategories.map((category) => (
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
                        <TableCell className="text-sm text-gray-600">{category.settingsId}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
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
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        );
      })}

      {/* Empty State */}
      {Object.values(groupedCategories).every(group => group.length === 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            {searchQuery.trim() || filterCategoryType !== 'all'
              ? `No categories found matching your filters.`
              : 'No categories found. Create your first category to get started.'}
          </p>
        </div>
      )}

      {/* Create Modal */}
      <TariffCategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
        settings={settings}
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
          settings={settings}
        />
      )}
    </div>
  );
}
