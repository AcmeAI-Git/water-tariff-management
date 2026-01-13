import { useState, useMemo } from 'react';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dropdown } from '../components/ui/Dropdown';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { DeleteConfirmationDialog } from '../components/zoneScoring/DeleteConfirmationDialog';
import type { Area, CreateAreaDto, UpdateAreaDto } from '../types';

export function AreaManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [geoJsonTypeFilter, setGeoJsonTypeFilter] = useState<string>('all');

  // Form states for create
  const [createName, setCreateName] = useState('');
  const [createGeoJson, setCreateGeoJson] = useState('');

  // Form states for edit
  const [editName, setEditName] = useState('');
  const [editGeoJson, setEditGeoJson] = useState('');

  // Fetch areas
  const { data: areasData, isLoading: areasLoading } = useApiQuery<Area[]>(
    ['areas'],
    () => api.area.getAll()
  );
  const areas: Area[] = (areasData ?? []) as Area[];

  // Get unique GeoJSON types from areas
  const uniqueGeoJsonTypes = useMemo(() => {
    const types = new Set(areas.map(area => area.geojson.type));
    return Array.from(types).sort();
  }, [areas]);

  // Apply filters
  const filteredAreas = useMemo(() => {
    return areas.filter((area) => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          area.name.toLowerCase().includes(query) ||
          area.id.toString().includes(query) ||
          area.geojson.type.toLowerCase().includes(query);
        if (!matchesSearch) {
          return false;
        }
      }

      // GeoJSON type filter
      if (geoJsonTypeFilter !== 'all' && area.geojson.type !== geoJsonTypeFilter) {
        return false;
      }

      return true;
    });
  }, [areas, searchQuery, geoJsonTypeFilter]);

  // Check if any filters are active
  const hasActiveFilters = geoJsonTypeFilter !== 'all' || searchQuery.trim() !== '';

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setGeoJsonTypeFilter('all');
  };

  // Create mutation
  const createAreaMutation = useApiMutation(
    (data: CreateAreaDto) => api.area.create(data),
    {
      successMessage: 'Area created successfully',
      errorMessage: 'Failed to create area',
      invalidateQueries: [['areas']],
    }
  );

  // Update mutation
  const updateAreaMutation = useApiMutation(
    (data: { id: number; dto: UpdateAreaDto }) => api.area.update(data.id, data.dto),
    {
      successMessage: 'Area updated successfully',
      errorMessage: 'Failed to update area',
      invalidateQueries: [['areas']],
    }
  );

  // Delete mutation
  const deleteAreaMutation = useApiMutation(
    (id: number) => api.area.delete(id),
    {
      successMessage: 'Area deleted successfully',
      errorMessage: 'Failed to delete area',
      invalidateQueries: [['areas']],
    }
  );

  const validateGeoJson = (jsonString: string): { valid: boolean; geojson?: CreateAreaDto['geojson']; error?: string } => {
    if (!jsonString.trim()) {
      return { valid: false, error: 'GeoJSON is required' };
    }

    try {
      const parsed = JSON.parse(jsonString);
      
      if (!parsed.type || !parsed.coordinates) {
        return { valid: false, error: 'GeoJSON must have "type" and "coordinates" properties' };
      }

      // Valid GeoJSON geometry types
      const validTypes = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'];
      if (!validTypes.includes(parsed.type)) {
        return { valid: false, error: `Invalid GeoJSON type. Supported types: ${validTypes.join(', ')}` };
      }

      if (!Array.isArray(parsed.coordinates)) {
        return { valid: false, error: 'GeoJSON coordinates must be an array' };
      }

      // Basic structure validation based on type
      if (parsed.type === 'Point' && parsed.coordinates.length !== 2) {
        return { valid: false, error: 'Point coordinates must be [longitude, latitude]' };
      }

      return { valid: true, geojson: parsed };
    } catch (error) {
      return { valid: false, error: 'Invalid JSON format' };
    }
  };

  const handleCreate = async () => {
    if (!createName.trim()) {
      alert('Please enter an area name');
      return;
    }

    const geoJsonValidation = validateGeoJson(createGeoJson);
    if (!geoJsonValidation.valid) {
      alert(geoJsonValidation.error || 'Invalid GeoJSON format');
      return;
    }

    const createData: CreateAreaDto = {
      name: createName.trim(),
      geojson: geoJsonValidation.geojson!,
    };

    await createAreaMutation.mutateAsync(createData);
    
    // Reset form
    setCreateName('');
    setCreateGeoJson('');
    setIsCreateModalOpen(false);
  };

  const handleEdit = (area: Area) => {
    setEditingArea(area);
    setEditName(area.name);
    setEditGeoJson(JSON.stringify(area.geojson, null, 2));
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingArea) return;

    if (!editName.trim()) {
      alert('Please enter an area name');
      return;
    }

    const updateData: UpdateAreaDto = {
      name: editName.trim(),
    };

    // Only include geojson if it was modified
    if (editGeoJson.trim()) {
      const geoJsonValidation = validateGeoJson(editGeoJson);
      if (!geoJsonValidation.valid) {
        alert(geoJsonValidation.error || 'Invalid GeoJSON format');
        return;
      }
      updateData.geojson = geoJsonValidation.geojson!;
    }


    await updateAreaMutation.mutateAsync({
      id: editingArea.id,
      dto: updateData,
    });

    setIsEditModalOpen(false);
    setEditingArea(null);
    setEditName('');
    setEditGeoJson('');
  };

  const handleDelete = (area: Area) => {
    setAreaToDelete(area);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (areaToDelete) {
      await deleteAreaMutation.mutateAsync(areaToDelete.id);
      setAreaToDelete(null);
    }
  };

  const geoJsonExamples = {
    Polygon: `{
  "type": "Polygon",
  "coordinates": [
    [
      [90.4021, 23.7935],
      [90.4078, 23.7935],
      [90.4078, 23.7982],
      [90.4021, 23.7982],
      [90.4021, 23.7935]
    ]
  ]
}`,
    MultiPolygon: `{
  "type": "MultiPolygon",
  "coordinates": [
    [
      [
        [90.4021, 23.7935],
        [90.4078, 23.7935],
        [90.4078, 23.7982],
        [90.4021, 23.7982],
        [90.4021, 23.7935]
      ]
    ],
    [
      [
        [90.4100, 23.8000],
        [90.4150, 23.8000],
        [90.4150, 23.8050],
        [90.4100, 23.8050],
        [90.4100, 23.8000]
      ]
    ]
  ]
}`,
    Point: `{
  "type": "Point",
  "coordinates": [90.4021, 23.7935]
}`,
    LineString: `{
  "type": "LineString",
  "coordinates": [
    [90.4021, 23.7935],
    [90.4078, 23.7935],
    [90.4078, 23.7982]
  ]
}`
  };

  const geoJsonExample = geoJsonExamples.Polygon;

  if (areasLoading) {
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Area Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage areas and their geographic boundaries</p>
        </div>

        {/* Add Button and Filters */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-11 px-6 flex items-center gap-2"
          >
            <Plus size={18} />
            Add New Area
          </Button>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            {/* Search Bar */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search by name, ID, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
              />
            </div>

            {/* GeoJSON Type Filter */}
            {uniqueGeoJsonTypes.length > 0 && (
              <div className="w-48">
                <Dropdown
                  options={[
                    { value: 'all', label: 'All Types' },
                    ...uniqueGeoJsonTypes.map(type => ({ value: type, label: type }))
                  ]}
                  value={geoJsonTypeFilter}
                  onChange={setGeoJsonTypeFilter}
                  placeholder="Filter by Type"
                  className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                />
              </div>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-gray-300 text-gray-700 rounded-lg h-11 px-4 bg-white hover:bg-gray-50 flex items-center gap-2"
              >
                <X size={16} />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Areas Table */}
        {areas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No areas found</p>
            <p className="text-gray-400 text-sm">Create your first area to get started</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                All Areas
                {hasActiveFilters && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({filteredAreas.length} of {areas.length})
                  </span>
                )}
              </h3>
              {!hasActiveFilters && (
                <span className="text-sm text-gray-500">{areas.length} total</span>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-gray-50">
                  <TableHead className="text-sm font-semibold text-gray-700">ID</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Name</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">GeoJSON Type</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAreas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      No areas match your filters. Try adjusting your search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAreas.map((area) => (
                  <TableRow key={area.id} className="border-gray-100">
                    <TableCell className="text-sm text-gray-600">
                      {area.id}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-900">
                      {area.name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {area.geojson.type}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(area)}
                          className="border-gray-300 text-gray-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(area)}
                          className="border-red-300 text-red-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-red-50 inline-flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Add New Area</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Create a new area with geographic boundaries defined by GeoJSON.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name" className="text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-name"
                  placeholder="e.g., Banani Block C"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="border-gray-300 rounded-lg h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-geojson" className="text-sm font-medium text-gray-700">
                  GeoJSON <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="create-geojson"
                  placeholder={geoJsonExample}
                  value={createGeoJson}
                  onChange={(e) => setCreateGeoJson(e.target.value)}
                  className="border-gray-300 rounded-lg min-h-[200px] font-mono text-sm"
                />
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">
                    Enter valid GeoJSON format. Supported geometry types:
                  </p>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <p>• <strong>Polygon</strong> - Closed area boundary (most common for areas)</p>
                    <p>• <strong>MultiPolygon</strong> - Multiple polygons (for complex areas with holes or separate parts)</p>
                    <p>• <strong>Point</strong> - Single location [longitude, latitude]</p>
                    <p>• <strong>LineString</strong> - Line path [[lon, lat], [lon, lat], ...]</p>
                    <p>• <strong>MultiPoint</strong> - Multiple points</p>
                    <p>• <strong>MultiLineString</strong> - Multiple lines</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateName('');
                  setCreateGeoJson('');
                }}
                className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createAreaMutation.isPending}
                className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
              >
                {createAreaMutation.isPending ? 'Creating...' : 'Create Area'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Edit Area</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Update the area details and geographic boundaries.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  placeholder="e.g., Banani Block C"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border-gray-300 rounded-lg h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-geojson" className="text-sm font-medium text-gray-700">
                  GeoJSON <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="edit-geojson"
                  placeholder={geoJsonExample}
                  value={editGeoJson}
                  onChange={(e) => setEditGeoJson(e.target.value)}
                  className="border-gray-300 rounded-lg min-h-[200px] font-mono text-sm"
                />
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">
                    Enter valid GeoJSON format. Supported geometry types:
                  </p>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <p>• <strong>Polygon</strong> - Closed area boundary (most common for areas)</p>
                    <p>• <strong>MultiPolygon</strong> - Multiple polygons (for complex areas with holes or separate parts)</p>
                    <p>• <strong>Point</strong> - Single location [longitude, latitude]</p>
                    <p>• <strong>LineString</strong> - Line path [[lon, lat], [lon, lat], ...]</p>
                    <p>• <strong>MultiPoint</strong> - Multiple points</p>
                    <p>• <strong>MultiLineString</strong> - Multiple lines</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingArea(null);
                  setEditName('');
                  setEditGeoJson('');
                }}
                className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateAreaMutation.isPending}
                className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
              >
                {updateAreaMutation.isPending ? 'Updating...' : 'Update Area'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setAreaToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Area"
          description="Are you sure you want to delete the area"
          itemName={areaToDelete?.name}
          isPending={deleteAreaMutation.isPending}
        />
      </div>
    </div>
  );
}
