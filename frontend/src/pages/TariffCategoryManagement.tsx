import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { toast } from 'sonner';
import type { TariffCategory, CreateTariffCategoryDto, UpdateTariffCategoryDto } from '../types';
import { TariffCategoryModal } from '../components/modals/TariffCategoryModal';
import { StatusBadge } from '../components/zoneScoring/StatusBadge';

export function TariffCategoryManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TariffCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all settings for modal dropdown
  const { data: allSettings = [] } = useApiQuery(
    ['tariff-category-settings'],
    () => api.tariffCategorySettings.getAll()
  );

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

  // Filter categories by search query (name)
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

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
          <h1 className="text-[28px] font-semibold text-gray-900 mb-1">Tariff Categories</h1>
          <p className="text-sm text-gray-500">Manage tariff categories and their configurations</p>
        </div>

        {/* Create Button and Search */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-11 px-6 flex items-center gap-2"
          >
            <Plus size={18} />
            Create Category
          </Button>
          
          {/* Search Bar */}
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
        </div>

        {/* Categories Table */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">
              {searchQuery.trim()
                ? `No categories found matching "${searchQuery}".`
                : 'No categories found. Create your first category to get started.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Categories</h3>
            </div>
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
                  <TableHead className="text-sm font-semibold text-gray-700">Settings ID</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id} className="border-gray-100">
                    <TableCell className="text-sm font-medium text-gray-900">{category.slNo}</TableCell>
                    <TableCell className="text-sm text-gray-900">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{category.category}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {category.lowerRange !== undefined && category.upperRange !== undefined
                        ? `${category.lowerRange} - ${category.upperRange} sq ft`
                        : category.lowerRange !== undefined
                        ? `${category.lowerRange}+ sq ft`
                        : category.rangeDescription || 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">
                      {category.isBaseCategory ? (
                        <Badge variant="default" className="bg-green-600">Yes</Badge>
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
          </div>
        )}
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
