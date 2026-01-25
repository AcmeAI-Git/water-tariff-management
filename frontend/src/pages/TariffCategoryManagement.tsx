import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dropdown } from '../components/ui/Dropdown';
import { Label } from '../components/ui/label';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { toast } from 'sonner';
import type { TariffCategory, CreateTariffCategoryDto, UpdateTariffCategoryDto } from '../types';
import { TariffCategoryModal } from '../components/modals/TariffCategoryModal';

export function TariffCategoryManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TariffCategory | null>(null);
  const [selectedSettingsId, setSelectedSettingsId] = useState<number | undefined>(undefined);

  // Fetch all settings for filter dropdown
  const { data: allSettings = [] } = useApiQuery(
    ['tariff-category-settings'],
    () => api.tariffCategorySettings.getAll()
  );

  // Fetch categories (filtered by settings if selected)
  const { data: categories = [], isLoading } = useApiQuery(
    ['tariff-category', selectedSettingsId ?? 'all'],
    () => api.tariffCategory.getAll(selectedSettingsId),
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

  // Filter categories by selected settings
  const filteredCategories = useMemo(() => {
    if (!selectedSettingsId) return categories;
    return categories.filter(cat => cat.settingsId === selectedSettingsId);
  }, [categories, selectedSettingsId]);

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
          <h1 className="text-2xl font-bold text-gray-900">Tariff Categories</h1>
          <p className="text-sm text-gray-600 mt-1">Manage tariff categories and their configurations</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary hover:bg-primary-600 text-white"
        >
          <Plus size={16} className="mr-2" />
          Create Category
        </Button>
      </div>

      {/* Settings Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Filter by Settings:
          </Label>
          <Dropdown
            options={[
              { value: '', label: 'All Settings' },
              ...allSettings.map(settings => ({
                value: settings.id.toString(),
                label: `Settings #${settings.id} ${settings.isActive ? '(Active)' : ''}`,
              })),
            ]}
            value={selectedSettingsId?.toString() || ''}
            onChange={(value) => setSelectedSettingsId(value ? parseInt(value) : undefined)}
            placeholder="Select settings"
            className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
          />
          {selectedSettingsId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSettingsId(undefined)}
            >
              Clear Filter
            </Button>
          )}
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SL No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Range</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Fixed Rate</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Settings ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  {selectedSettingsId 
                    ? `No categories found for selected settings. Create a category to get started.`
                    : 'No categories found. Create your first category to get started.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.slNo}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{category.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {category.lowerRange !== undefined && category.upperRange !== undefined
                      ? `${category.lowerRange} - ${category.upperRange} sq ft`
                      : category.lowerRange !== undefined
                      ? `${category.lowerRange}+ sq ft`
                      : category.rangeDescription || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {category.isBaseCategory ? (
                      <Badge variant="default" className="bg-green-600">Yes</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {category.isFixedRate ? (
                      <Badge variant="default" className="bg-blue-600">Yes</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {category.isActive ? (
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>{category.settingsId}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        disabled={deleteMutation.isPending}
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
      <TariffCategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
        settings={allSettings}
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
        />
      )}
    </div>
  );
}
