import { useState, useMemo, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Edit, Trash2, Search, FileText } from 'lucide-react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { DeleteConfirmationDialog } from '../components/zoneScoring/DeleteConfirmationDialog';
import { HierarchicalLocationSelector } from '../components/common/HierarchicalLocationSelector';
import type { 
  Area, CreateAreaDto, UpdateAreaDto,
  Wasa, CreateWasaDto, UpdateWasaDto,
  Zone, CreateZoneDto, UpdateZoneDto
} from '../types';

export function LocationManagement() {
  const [activeTab, setActiveTab] = useState<'wasas' | 'zones' | 'areas'>('wasas');
  
  // WASA states
  const [isWasaCreateModalOpen, setIsWasaCreateModalOpen] = useState(false);
  const [isWasaEditModalOpen, setIsWasaEditModalOpen] = useState(false);
  const [isWasaDeleteDialogOpen, setIsWasaDeleteDialogOpen] = useState(false);
  const [editingWasa, setEditingWasa] = useState<Wasa | null>(null);
  const [wasaToDelete, setWasaToDelete] = useState<Wasa | null>(null);
  const [createWasaName, setCreateWasaName] = useState('');
  const [createWasaCode, setCreateWasaCode] = useState('');
  const [createWasaAddress, setCreateWasaAddress] = useState('');
  const [editWasaName, setEditWasaName] = useState('');
  const [editWasaCode, setEditWasaCode] = useState('');
  const [editWasaAddress, setEditWasaAddress] = useState('');
  const [wasaSearchQuery, setWasaSearchQuery] = useState('');

  // Zone states - add filter states
  const [isZoneCreateModalOpen, setIsZoneCreateModalOpen] = useState(false);
  const [isZoneEditModalOpen, setIsZoneEditModalOpen] = useState(false);
  const [isZoneDeleteDialogOpen, setIsZoneDeleteDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);
  const [createZoneNo, setCreateZoneNo] = useState('');
  const [createZoneName, setCreateZoneName] = useState('');
  const [createZoneCityName, setCreateZoneCityName] = useState('');
  const [createZoneWasaId, setCreateZoneWasaId] = useState<string>('');
  const [editZoneNo, setEditZoneNo] = useState('');
  const [editZoneName, setEditZoneName] = useState('');
  const [editZoneCityName, setEditZoneCityName] = useState('');
  const [editZoneWasaId, setEditZoneWasaId] = useState<string>('');
  const [zoneSearchQuery, setZoneSearchQuery] = useState('');
  const [zoneFilterWasaId, setZoneFilterWasaId] = useState<string>('');

  // Area states
  const [isAreaCreateModalOpen, setIsAreaCreateModalOpen] = useState(false);
  const [isAreaEditModalOpen, setIsAreaEditModalOpen] = useState(false);
  const [isAreaDeleteDialogOpen, setIsAreaDeleteDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);
  const [createAreaName, setCreateAreaName] = useState('');
  const [createAreaZoneId, setCreateAreaZoneId] = useState<string>('');
  const [createAreaWasaId, setCreateAreaWasaId] = useState<string>('');
  const [createAreaGeoJson, setCreateAreaGeoJson] = useState('');
  const [editAreaName, setEditAreaName] = useState('');
  const [editAreaZoneId, setEditAreaZoneId] = useState<string>('');
  const [editAreaWasaId, setEditAreaWasaId] = useState<string>('');
  const [editAreaGeoJson, setEditAreaGeoJson] = useState('');
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [geoJsonTypeFilter, setGeoJsonTypeFilter] = useState<string>('all');
  const [areaFilterWasaId, setAreaFilterWasaId] = useState<string>('all');
  const [areaFilterZoneId, setAreaFilterZoneId] = useState<string>('all');
  
  // Ref to track if we're initializing edit form (to prevent zone reset)
  const isInitializingEdit = useRef(false);

  // Fetch data
  const { data: wasasData, isLoading: wasasLoading } = useApiQuery<Wasa[]>(
    ['wasas'],
    () => api.wasas.getAll()
  );
  const wasas: Wasa[] = (wasasData ?? []) as Wasa[];

  const { data: zonesData, isLoading: zonesLoading } = useApiQuery<Zone[]>(
    ['zones'],
    () => api.zones.getAll()
  );
  const zones: Zone[] = (zonesData ?? []) as Zone[];

  const { data: areasData, isLoading: areasLoading } = useApiQuery<Area[]>(
    ['areas'],
    () => api.area.getAll()
  );
  const areas: Area[] = (areasData ?? []) as Area[];

  // Filtered data
  const filteredWasas = useMemo(() => {
    if (!wasaSearchQuery.trim()) return wasas;
    const query = wasaSearchQuery.toLowerCase();
    return wasas.filter(wasa => 
      wasa.name.toLowerCase().includes(query) ||
      wasa.code.toLowerCase().includes(query) ||
      wasa.id.toString().includes(query)
    );
  }, [wasas, wasaSearchQuery]);

  const filteredZones = useMemo(() => {
    let result = zones;
    
    // Filter by WASA
    if (zoneFilterWasaId && zoneFilterWasaId !== 'all') {
      result = result.filter(zone => zone.wasaId === parseInt(zoneFilterWasaId));
    }
    
    // Filter by search query
    if (zoneSearchQuery.trim()) {
      const query = zoneSearchQuery.toLowerCase();
      result = result.filter(zone => {
        const wasa = wasas.find(w => w.id === zone.wasaId);
        return (
          zone.name.toLowerCase().includes(query) ||
          zone.zoneNo.toLowerCase().includes(query) ||
          zone.cityName.toLowerCase().includes(query) ||
          zone.id.toString().includes(query) ||
          wasa?.name.toLowerCase().includes(query)
        );
      });
    }
    
    return result;
  }, [zones, zoneSearchQuery, zoneFilterWasaId, wasas]);

  const filteredAreas = useMemo(() => {
    let result = areas;
    
    // Filter by WASA
    if (areaFilterWasaId && areaFilterWasaId !== 'all') {
      result = result.filter(area => {
        // Use nested zone object from area if available, otherwise fallback to lookup
        const zone = area.zone || zones.find(z => z.id === area.zoneId);
        return zone?.wasaId === parseInt(areaFilterWasaId);
      });
    }
    
    // Filter by zone
    if (areaFilterZoneId && areaFilterZoneId !== 'all') {
      result = result.filter(area => {
        // Use nested zone.id if available, otherwise use area.zoneId
        const zone = area.zone || zones.find(z => z.id === area.zoneId);
        return zone?.id === parseInt(areaFilterZoneId);
      });
    }
    
    // Filter by search query
    if (areaSearchQuery.trim()) {
      const query = areaSearchQuery.toLowerCase();
      result = result.filter(area => 
        area.name.toLowerCase().includes(query) ||
        area.id.toString().includes(query)
      );
    }

    // Filter by GeoJSON type
    if (geoJsonTypeFilter !== 'all') {
      result = result.filter(area => area.geojson.type === geoJsonTypeFilter);
    }

    return result;
  }, [areas, areaSearchQuery, geoJsonTypeFilter, areaFilterWasaId, areaFilterZoneId, zones]);

  const uniqueGeoJsonTypes = useMemo(() => {
    const types = new Set(areas.map(area => area.geojson.type));
    return Array.from(types).sort();
  }, [areas]);

  // WASA mutations
  const createWasaMutation = useApiMutation(
    (data: CreateWasaDto) => api.wasas.create(data),
    {
      successMessage: 'WASA created successfully',
      errorMessage: 'Failed to create WASA',
      invalidateQueries: [['wasas']],
    }
  );

  const updateWasaMutation = useApiMutation(
    (data: { id: number; dto: UpdateWasaDto }) => api.wasas.update(data.id, data.dto),
    {
      successMessage: 'WASA updated successfully',
      errorMessage: 'Failed to update WASA',
      invalidateQueries: [['wasas']],
    }
  );

  const deleteWasaMutation = useApiMutation(
    (id: number) => api.wasas.delete(id),
    {
      successMessage: 'WASA deleted successfully',
      errorMessage: 'Failed to delete WASA',
      invalidateQueries: [['wasas']],
    }
  );

  // Zone mutations
  const createZoneMutation = useApiMutation(
    (data: CreateZoneDto) => api.zones.create(data),
    {
      successMessage: 'Zone created successfully',
      errorMessage: 'Failed to create zone',
      invalidateQueries: [['zones']],
    }
  );

  const updateZoneMutation = useApiMutation(
    (data: { id: number; dto: UpdateZoneDto }) => api.zones.update(data.id, data.dto),
    {
      successMessage: 'Zone updated successfully',
      errorMessage: 'Failed to update zone',
      invalidateQueries: [['zones']],
    }
  );

  const deleteZoneMutation = useApiMutation(
    (id: number) => api.zones.delete(id),
    {
      successMessage: 'Zone deleted successfully',
      errorMessage: 'Failed to delete zone',
      invalidateQueries: [['zones']],
    }
  );

  // Area mutations
  const createAreaMutation = useApiMutation(
    (data: CreateAreaDto) => api.area.create(data),
    {
      successMessage: 'Area created successfully',
      errorMessage: 'Failed to create area',
      invalidateQueries: [['areas']],
    }
  );

  const updateAreaMutation = useApiMutation(
    (data: { id: number; dto: UpdateAreaDto }) => api.area.update(data.id, data.dto),
    {
      successMessage: 'Area updated successfully',
      errorMessage: 'Failed to update area',
      invalidateQueries: [['areas']],
    }
  );

  const deleteAreaMutation = useApiMutation(
    (id: number) => api.area.delete(id),
    {
      successMessage: 'Area deleted successfully',
      errorMessage: 'Failed to delete area',
      invalidateQueries: [['areas']],
    }
  );

  // WASA handlers
  const handleCreateWasa = async () => {
    if (!createWasaName.trim() || !createWasaCode.trim()) {
      alert('Please enter name and code');
      return;
    }

    await createWasaMutation.mutateAsync({
      name: createWasaName.trim(),
      code: createWasaCode.trim(),
      address: createWasaAddress.trim() || undefined,
    });

    setCreateWasaName('');
    setCreateWasaCode('');
    setCreateWasaAddress('');
    setIsWasaCreateModalOpen(false);
  };

  const handleEditWasa = (wasa: Wasa) => {
    setEditingWasa(wasa);
    setEditWasaName(wasa.name);
    setEditWasaCode(wasa.code);
    setEditWasaAddress(wasa.address || '');
    setIsWasaEditModalOpen(true);
  };

  const handleUpdateWasa = async () => {
    if (!editingWasa) return;
    if (!editWasaName.trim() || !editWasaCode.trim()) {
      alert('Please enter name and code');
      return;
    }

    await updateWasaMutation.mutateAsync({
      id: editingWasa.id,
      dto: {
        name: editWasaName.trim(),
        code: editWasaCode.trim(),
        address: editWasaAddress.trim() || undefined,
      },
    });

    setIsWasaEditModalOpen(false);
    setEditingWasa(null);
    setEditWasaName('');
    setEditWasaCode('');
    setEditWasaAddress('');
  };

  const handleDeleteWasa = (wasa: Wasa) => {
    setWasaToDelete(wasa);
    setIsWasaDeleteDialogOpen(true);
  };

  const confirmDeleteWasa = async () => {
    if (wasaToDelete) {
      try {
        await deleteWasaMutation.mutateAsync(wasaToDelete.id);
        setWasaToDelete(null);
        setIsWasaDeleteDialogOpen(false);
      } catch (error: any) {
        console.error('WASA deletion error:', error);
        // Error toast is already shown by mutation hook
        if (error?.response?.status === 404) {
          alert('WASA not found. It may have already been deleted.');
        } else if (error?.response?.status === 409) {
          alert('Cannot delete WASA. It may be in use by zones or other entities.');
        }
      }
    }
  };

  // Zone handlers
  const handleCreateZone = async () => {
    // Validation
    if (!createZoneNo.trim()) {
      alert('Please enter Zone No');
      return;
    }
    // Validate zoneNo is numeric
    if (!/^\d+$/.test(createZoneNo.trim())) {
      alert('Zone No must contain only numbers');
      return;
    }
    if (createZoneNo.trim().length > 20) {
      alert('Zone No must be 20 digits or less');
      return;
    }
    if (!createZoneName.trim()) {
      alert('Please enter Zone Name');
      return;
    }
    if (createZoneName.trim().length > 100) {
      alert('Zone Name must be 100 characters or less');
      return;
    }
    if (!createZoneCityName.trim()) {
      alert('Please enter City Name');
      return;
    }
    if (createZoneCityName.trim().length > 100) {
      alert('City Name must be 100 characters or less');
      return;
    }
    if (!createZoneWasaId) {
      alert('Please select a WASA');
      return;
    }

    try {
      await createZoneMutation.mutateAsync({
        zoneNo: createZoneNo.trim(),
        name: createZoneName.trim(),
        cityName: createZoneCityName.trim(),
        wasaId: parseInt(createZoneWasaId),
        // Note: tariffCategory is not included as backend DTO doesn't accept it
      });

      setCreateZoneNo('');
      setCreateZoneName('');
      setCreateZoneCityName('');
      setCreateZoneWasaId('');
      setIsZoneCreateModalOpen(false);
    } catch (error: any) {
      // Error is already handled by mutation hook, but log for debugging
      console.error('Zone creation error:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response,
        stack: error?.stack
      });
      // The mutation hook will show the toast with the error message
    }
  };

  const handleEditZone = (zone: Zone) => {
    setEditingZone(zone);
    setEditZoneNo(zone.zoneNo);
    setEditZoneName(zone.name);
    setEditZoneCityName(zone.cityName);
    setEditZoneWasaId(zone.wasaId.toString());
    setIsZoneEditModalOpen(true);
  };

  const handleUpdateZone = async () => {
    if (!editingZone) return;
    if (!editZoneNo.trim() || !editZoneName.trim() || !editZoneCityName.trim() || !editZoneWasaId) {
      alert('Please fill in all required fields');
      return;
    }

    await updateZoneMutation.mutateAsync({
      id: editingZone.id,
      dto: {
        zoneNo: editZoneNo.trim(),
        name: editZoneName.trim(),
        cityName: editZoneCityName.trim(),
        wasaId: parseInt(editZoneWasaId),
      },
    });

    setIsZoneEditModalOpen(false);
    setEditingZone(null);
    setEditZoneNo('');
    setEditZoneName('');
    setEditZoneCityName('');
    setEditZoneWasaId('');
  };

  const handleDeleteZone = (zone: Zone) => {
    setZoneToDelete(zone);
    setIsZoneDeleteDialogOpen(true);
  };

  const confirmDeleteZone = async () => {
    if (zoneToDelete) {
      try {
        await deleteZoneMutation.mutateAsync(zoneToDelete.id);
        setZoneToDelete(null);
        setIsZoneDeleteDialogOpen(false);
      } catch (error: any) {
        console.error('Zone deletion error:', error);
        // Error toast is already shown by mutation hook
        if (error?.response?.status === 404) {
          alert('Zone not found. It may have already been deleted.');
        } else if (error?.response?.status === 409) {
          alert('Cannot delete zone. It may be in use by areas, wards, or other entities.');
        }
      }
    }
  };

  // Area handlers
  const validateGeoJson = (jsonString: string): { valid: boolean; geojson?: CreateAreaDto['geojson']; error?: string } => {
    if (!jsonString.trim()) {
      return { valid: false, error: 'GeoJSON is required' };
    }

    try {
      const parsed = JSON.parse(jsonString);
      
      if (!parsed.type || !parsed.coordinates) {
        return { valid: false, error: 'GeoJSON must have "type" and "coordinates" properties' };
      }

      const validTypes = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'];
      if (!validTypes.includes(parsed.type)) {
        return { valid: false, error: `Invalid GeoJSON type. Supported types: ${validTypes.join(', ')}` };
      }

      if (!Array.isArray(parsed.coordinates)) {
        return { valid: false, error: 'GeoJSON coordinates must be an array' };
      }

      if (parsed.type === 'Point' && parsed.coordinates.length !== 2) {
        return { valid: false, error: 'Point coordinates must be [longitude, latitude]' };
      }

      return { valid: true, geojson: parsed };
    } catch (error) {
      return { valid: false, error: 'Invalid JSON format' };
    }
  };

  const handleCreateArea = async () => {
    if (!createAreaName.trim()) {
      alert('Please enter an area name');
      return;
    }

    if (!createAreaWasaId) {
      alert('Please select a WASA first');
      return;
    }

    if (!createAreaZoneId) {
      alert('Please select a zone');
      return;
    }

    const geoJsonValidation = validateGeoJson(createAreaGeoJson);
    if (!geoJsonValidation.valid) {
      alert(geoJsonValidation.error || 'Invalid GeoJSON format');
      return;
    }

    const createData: CreateAreaDto = {
      name: createAreaName.trim(),
      zoneId: parseInt(createAreaZoneId),
      geojson: geoJsonValidation.geojson!,
    };

    await createAreaMutation.mutateAsync(createData);
    
    setCreateAreaName('');
    setCreateAreaZoneId('');
    setCreateAreaGeoJson('');
    setIsAreaCreateModalOpen(false);
  };

  const handleEditArea = (area: Area) => {
    setEditingArea(area);
    setEditAreaName(area.name);
    
    // Always use nested zone object from area (API returns zone nested, not zoneId at top level)
    const zone = area.zone;
    
    if (!zone) {
      console.error('Area does not have nested zone object:', area);
      setIsAreaEditModalOpen(true);
      return;
    }
    
    // Set WASA first (this is required for zone dropdown to be enabled)
    const wasaId = zone.wasaId.toString();
    // Use zone.id from nested object (this is the actual zone ID, not zoneNo)
    const zoneId = zone.id.toString();
    
    // Mark that we're initializing to prevent zone reset
    isInitializingEdit.current = true;
    
    // Set both values - WASA first, then zone
    setEditAreaWasaId(wasaId);
    // Set zone after WASA is set (using setTimeout to ensure state update order)
    setTimeout(() => {
      setEditAreaZoneId(zoneId);
      isInitializingEdit.current = false;
    }, 0);
    
    setEditAreaGeoJson(JSON.stringify(area.geojson, null, 2));
    setIsAreaEditModalOpen(true);
  };

  const handleUpdateArea = async () => {
    if (!editingArea) return;

    if (!editAreaName.trim()) {
      alert('Please enter an area name');
      return;
    }

    if (!editAreaWasaId) {
      alert('Please select a WASA first');
      return;
    }

    if (!editAreaZoneId) {
      alert('Please select a zone');
      return;
    }

    const updateData: UpdateAreaDto = {
      name: editAreaName.trim(),
      zoneId: parseInt(editAreaZoneId),
    };

    if (editAreaGeoJson.trim()) {
      const geoJsonValidation = validateGeoJson(editAreaGeoJson);
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

    setIsAreaEditModalOpen(false);
    setEditingArea(null);
    setEditAreaName('');
    setEditAreaZoneId('');
    setEditAreaWasaId('');
    setEditAreaGeoJson('');
  };

  const handleDeleteArea = (area: Area) => {
    setAreaToDelete(area);
    setIsAreaDeleteDialogOpen(true);
  };

  const confirmDeleteArea = async () => {
    if (areaToDelete) {
      await deleteAreaMutation.mutateAsync(areaToDelete.id);
      setAreaToDelete(null);
    }
  };

  const geoJsonExample = `{
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
}`;

  const generateTemplateGeoJson = () => {
    return JSON.stringify({
      type: "Polygon",
      coordinates: [
        [
          [90.4021, 23.7935],
          [90.4078, 23.7935],
          [90.4078, 23.7982],
          [90.4021, 23.7982],
          [90.4021, 23.7935]
        ]
      ]
    }, null, 2);
  };

  if (wasasLoading || zonesLoading || areasLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-4 md:px-8 py-4 md:py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Location Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage WASAs, zones, and areas</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('wasas')}
              className={`pb-3 text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === 'wasas'
                  ? 'border-[#4C6EF5] text-[#4C6EF5]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              WASAs
            </button>
            <button
              onClick={() => setActiveTab('zones')}
              className={`pb-3 text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === 'zones'
                  ? 'border-[#4C6EF5] text-[#4C6EF5]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Zones
            </button>
            <button
              onClick={() => setActiveTab('areas')}
              className={`pb-3 text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === 'areas'
                  ? 'border-[#4C6EF5] text-[#4C6EF5]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Areas
            </button>
          </div>
        </div>

        {/* WASAs Tab */}
        {activeTab === 'wasas' && (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <Button 
                onClick={() => setIsWasaCreateModalOpen(true)}
                className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-11 px-6 flex items-center gap-2"
              >
                <Plus size={18} />
                Add New WASA
              </Button>

              <div className="flex items-center gap-3 flex-1 justify-end">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    type="text"
                    placeholder="Search by name, code, or ID..."
                    value={wasaSearchQuery}
                    onChange={(e) => setWasaSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {filteredWasas.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500 text-lg mb-4">No WASAs found</p>
                <p className="text-gray-400 text-sm">Create your first WASA to get started</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    All WASAs ({filteredWasas.length})
                  </h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="text-sm font-semibold text-gray-700">ID</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700">Name</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700">Code</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700">Address</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWasas.map((wasa) => (
                      <TableRow key={wasa.id} className="border-gray-100">
                        <TableCell className="text-sm text-gray-600">{wasa.id}</TableCell>
                        <TableCell className="text-sm font-medium text-gray-900">{wasa.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{wasa.code}</TableCell>
                        <TableCell className="text-sm text-gray-600">{wasa.address || '-'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditWasa(wasa)}
                              className="border-gray-300 text-gray-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteWasa(wasa)}
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

            {/* Create WASA Modal */}
            <Dialog open={isWasaCreateModalOpen} onOpenChange={setIsWasaCreateModalOpen}>
              <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-900">Add New WASA</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    Create a new WASA
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-wasa-name" className="text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-wasa-name"
                      placeholder="e.g., Dhaka WASA"
                      value={createWasaName}
                      onChange={(e) => setCreateWasaName(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-wasa-code" className="text-sm font-medium text-gray-700">
                      Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-wasa-code"
                      placeholder="e.g., DWASA"
                      value={createWasaCode}
                      onChange={(e) => setCreateWasaCode(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-wasa-address" className="text-sm font-medium text-gray-700">
                      Address
                    </Label>
                    <Input
                      id="create-wasa-address"
                      placeholder="Optional address"
                      value={createWasaAddress}
                      onChange={(e) => setCreateWasaAddress(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsWasaCreateModalOpen(false);
                      setCreateWasaName('');
                      setCreateWasaCode('');
                      setCreateWasaAddress('');
                    }}
                    className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWasa}
                    disabled={createWasaMutation.isPending}
                    className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
                  >
                    {createWasaMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit WASA Modal */}
            <Dialog open={isWasaEditModalOpen} onOpenChange={setIsWasaEditModalOpen}>
              <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-900">Edit WASA</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    Update WASA details
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-wasa-name" className="text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-wasa-name"
                      value={editWasaName}
                      onChange={(e) => setEditWasaName(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-wasa-code" className="text-sm font-medium text-gray-700">
                      Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-wasa-code"
                      value={editWasaCode}
                      onChange={(e) => setEditWasaCode(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-wasa-address" className="text-sm font-medium text-gray-700">
                      Address
                    </Label>
                    <Input
                      id="edit-wasa-address"
                      value={editWasaAddress}
                      onChange={(e) => setEditWasaAddress(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsWasaEditModalOpen(false);
                      setEditingWasa(null);
                      setEditWasaName('');
                      setEditWasaCode('');
                      setEditWasaAddress('');
                    }}
                    className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateWasa}
                    disabled={updateWasaMutation.isPending}
                    className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
                  >
                    {updateWasaMutation.isPending ? 'Updating...' : 'Update'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <DeleteConfirmationDialog
              isOpen={isWasaDeleteDialogOpen}
              onClose={() => {
                setIsWasaDeleteDialogOpen(false);
                setWasaToDelete(null);
              }}
              onConfirm={confirmDeleteWasa}
              title="Delete WASA"
              description="Are you sure you want to delete the WASA"
              itemName={wasaToDelete?.name}
              isPending={deleteWasaMutation.isPending}
            />
          </>
        )}

        {/* Zones Tab */}
        {activeTab === 'zones' && (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <Button 
                onClick={() => setIsZoneCreateModalOpen(true)}
                className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-11 px-6 flex items-center gap-2"
              >
                <Plus size={18} />
                Add New Zone
              </Button>

              <div className="flex items-center gap-3 flex-1 justify-end">
                <div className="w-48">
                  <Select 
                    value={zoneFilterWasaId} 
                    onValueChange={(value) => {
                      setZoneFilterWasaId(value);
                    }}
                  >
                    <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white min-w-0 [&>*:first-child]:truncate [&>*:first-child]:min-w-0">
                      <SelectValue placeholder="Filter by WASA" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="all">All WASAs</SelectItem>
                      {wasas.map(cc => (
                        <SelectItem key={cc.id} value={cc.id.toString()}>
                          {cc.name} ({cc.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    type="text"
                    placeholder="Search by name, zone no, or ID..."
                    value={zoneSearchQuery}
                    onChange={(e) => setZoneSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {filteredZones.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500 text-lg mb-4">No zones found</p>
                <p className="text-gray-400 text-sm">Create your first zone to get started</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    All Zones ({filteredZones.length})
                  </h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="text-sm font-semibold text-gray-700">ID</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700">Zone No</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700">Name</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700">City Name</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700">WASA</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredZones.map((zone) => {
                      const wasa = wasas.find(w => w.id === zone.wasaId);
                      return (
                        <TableRow key={zone.id} className="border-gray-100">
                          <TableCell className="text-sm text-gray-600">{zone.id}</TableCell>
                          <TableCell className="text-sm text-gray-600">{zone.zoneNo}</TableCell>
                          <TableCell className="text-sm font-medium text-gray-900">{zone.name}</TableCell>
                          <TableCell className="text-sm text-gray-600">{zone.cityName}</TableCell>
                          <TableCell className="text-sm text-gray-600">{wasa?.name || '-'}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditZone(zone)}
                                className="border-gray-300 text-gray-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                                title="Edit"
                              >
                                <Edit size={14} />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteZone(zone)}
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
            )}

            {/* Create Zone Modal */}
            <Dialog open={isZoneCreateModalOpen} onOpenChange={setIsZoneCreateModalOpen}>
              <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-900">Add New Zone</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    Create a new zone
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-zone-no" className="text-sm font-medium text-gray-700">
                      Zone No <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-zone-no"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g., 2"
                      value={createZoneNo}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setCreateZoneNo(value);
                      }}
                      className="border-gray-300 rounded-lg h-11"
                      maxLength={20}
                      required
                    />
                    <p className="text-xs text-gray-500">Numbers only, maximum 20 digits</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-zone-name" className="text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-zone-name"
                      placeholder="e.g., Zone-2"
                      value={createZoneName}
                      onChange={(e) => setCreateZoneName(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                      maxLength={100}
                      required
                    />
                    <p className="text-xs text-gray-500">Maximum 100 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-zone-city-name" className="text-sm font-medium text-gray-700">
                      City Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-zone-city-name"
                      placeholder="e.g., Khilgaon, Meradia, Bashabo, Goran"
                      value={createZoneCityName}
                      onChange={(e) => setCreateZoneCityName(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                      maxLength={100}
                      required
                    />
                    <p className="text-xs text-gray-500">Maximum 100 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-zone-wasa" className="text-sm font-medium text-gray-700">
                      WASA <span className="text-red-500">*</span>
                    </Label>
                    <Select value={createZoneWasaId} onValueChange={setCreateZoneWasaId}>
                      <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white">
                        <SelectValue placeholder="Select WASA" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        {wasas.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No WASAs available</div>
                        ) : (
                          wasas.map(cc => (
                            <SelectItem key={cc.id} value={cc.id.toString()}>
                              {cc.name} ({cc.code})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsZoneCreateModalOpen(false);
                      setCreateZoneNo('');
                      setCreateZoneName('');
                      setCreateZoneCityName('');
                      setCreateZoneWasaId('');
                    }}
                    className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateZone}
                    disabled={createZoneMutation.isPending}
                    className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
                  >
                    {createZoneMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Zone Modal */}
            <Dialog open={isZoneEditModalOpen} onOpenChange={setIsZoneEditModalOpen}>
              <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-900">Edit Zone</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    Update zone details
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-zone-no" className="text-sm font-medium text-gray-700">
                      Zone No <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-zone-no"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={editZoneNo}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setEditZoneNo(value);
                      }}
                      className="border-gray-300 rounded-lg h-11"
                      maxLength={20}
                      required
                    />
                    <p className="text-xs text-gray-500">Numbers only, maximum 20 digits</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-zone-name" className="text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-zone-name"
                      value={editZoneName}
                      onChange={(e) => setEditZoneName(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-zone-city-name" className="text-sm font-medium text-gray-700">
                      City Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-zone-city-name"
                      value={editZoneCityName}
                      onChange={(e) => setEditZoneCityName(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-zone-wasa" className="text-sm font-medium text-gray-700">
                      WASA <span className="text-red-500">*</span>
                    </Label>
                    <Select value={editZoneWasaId} onValueChange={setEditZoneWasaId}>
                      <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white">
                        <SelectValue placeholder="Select WASA" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        {wasas.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No WASAs available</div>
                        ) : (
                          wasas.map(cc => (
                            <SelectItem key={cc.id} value={cc.id.toString()}>
                              {cc.name} ({cc.code})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsZoneEditModalOpen(false);
                      setEditingZone(null);
                      setEditZoneNo('');
                      setEditZoneName('');
                      setEditZoneCityName('');
                      setEditZoneWasaId('');
                    }}
                    className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateZone}
                    disabled={updateZoneMutation.isPending}
                    className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
                  >
                    {updateZoneMutation.isPending ? 'Updating...' : 'Update'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <DeleteConfirmationDialog
              isOpen={isZoneDeleteDialogOpen}
              onClose={() => {
                setIsZoneDeleteDialogOpen(false);
                setZoneToDelete(null);
              }}
              onConfirm={confirmDeleteZone}
              title="Delete Zone"
              description="Are you sure you want to delete the zone"
              itemName={zoneToDelete?.name}
              isPending={deleteZoneMutation.isPending}
            />
          </>
        )}

        {/* Areas Tab */}
        {activeTab === 'areas' && (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <Button 
                onClick={() => setIsAreaCreateModalOpen(true)}
                className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-11 px-6 flex items-center gap-2"
              >
                <Plus size={18} />
                Add New Area
              </Button>

              <div className="flex items-center gap-3 flex-1 justify-end">
                <div className="w-48">
                  <Select 
                    value={areaFilterWasaId} 
                    onValueChange={(value) => {
                      setAreaFilterWasaId(value);
                      setAreaFilterZoneId('all'); // Reset zone filter when WASA changes
                    }}
                  >
                    <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white min-w-0 [&>*:first-child]:truncate [&>*:first-child]:min-w-0">
                      <SelectValue placeholder="Filter by WASA" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="all">All WASAs</SelectItem>
                      {wasas.map(cc => (
                        <SelectItem key={cc.id} value={cc.id.toString()}>
                          {cc.name} ({cc.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-48">
                  <Select 
                    value={areaFilterZoneId} 
                    onValueChange={setAreaFilterZoneId}
                    disabled={!areaFilterWasaId || areaFilterWasaId === 'all'}
                  >
                    <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white disabled:opacity-50 disabled:cursor-not-allowed min-w-0 [&>*:first-child]:truncate [&>*:first-child]:min-w-0">
                      <SelectValue placeholder={areaFilterWasaId ? "Filter by Zone" : "Select WASA first"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      {!areaFilterWasaId || areaFilterWasaId === 'all' ? (
                        <SelectItem value="__placeholder__" disabled className="text-gray-500 cursor-not-allowed">
                          Select WASA first
                        </SelectItem>
                      ) : (() => {
                        // Get zones from areas that belong to the selected WASA
                        // Use nested zone object from areas
                        const zonesFromAreas = areas
                          .filter(area => {
                            // Use nested zone object if available, otherwise fallback to lookup
                            const zone = area.zone || zones.find(z => z.id === area.zoneId);
                            return zone?.wasaId === parseInt(areaFilterWasaId);
                          })
                          .map(area => {
                            // Use nested zone object if available, otherwise fallback to lookup
                            return area.zone || zones.find(z => z.id === area.zoneId);
                          })
                          .filter((zone): zone is Zone => zone !== undefined)
                          // Remove duplicates by zone id
                          .filter((zone, index, self) => 
                            index === self.findIndex(z => z.id === zone.id)
                          );
                        
                        if (zonesFromAreas.length === 0) {
                          return (
                            <SelectItem value="__no_zones__" disabled className="text-gray-500 cursor-not-allowed">
                              No zones with areas found for this WASA
                            </SelectItem>
                          );
                        }
                        
                        return (
                          <>
                            <SelectItem value="all">All Zones</SelectItem>
                            {zonesFromAreas.map(zone => (
                              <SelectItem 
                                key={zone.id} 
                                value={zone.id.toString()}
                                title={`${zone.name} - ${zone.cityName}`}
                                className="truncate"
                              >
                                {zone.name} - {zone.cityName}
                              </SelectItem>
                            ))}
                          </>
                        );
                      })()}
                    </SelectContent>
                  </Select>
                </div>
                {uniqueGeoJsonTypes.length > 0 && (
                  <div className="w-48">
                    <Select value={geoJsonTypeFilter} onValueChange={setGeoJsonTypeFilter}>
                      <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white">
                        <SelectValue placeholder="Filter by Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        <SelectItem value="all">All Types</SelectItem>
                        {uniqueGeoJsonTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={areaSearchQuery}
                    onChange={(e) => setAreaSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {filteredAreas.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500 text-lg mb-4">No areas found</p>
                <p className="text-gray-400 text-sm">Create your first area to get started</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    All Areas ({filteredAreas.length})
                  </h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="text-sm font-semibold text-gray-700">ID</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700">Name</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700">Zone</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700">WASA</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700">GeoJSON Type</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAreas.map((area) => {
                      // Use nested zone object from area if available, otherwise fallback to lookup
                      const zone = area.zone || zones.find(z => z.id === area.zoneId);
                      const wasa = zone?.wasaId 
                        ? wasas.find(cc => cc.id === zone.wasaId) 
                        : null;
                      return (
                        <TableRow key={area.id} className="border-gray-100">
                          <TableCell className="text-sm text-gray-600">{area.id}</TableCell>
                          <TableCell className="text-sm font-medium text-gray-900">{area.name}</TableCell>
                          <TableCell className="text-sm text-gray-600">{zone?.name || '-'}</TableCell>
                          <TableCell className="text-sm text-gray-600">{wasa?.name || '-'}</TableCell>
                          <TableCell className="text-sm text-gray-600">{area.geojson.type}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditArea(area)}
                                className="border-gray-300 text-gray-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                                title="Edit"
                              >
                                <Edit size={14} />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteArea(area)}
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
            )}

            {/* Create Area Modal */}
            <Dialog open={isAreaCreateModalOpen} onOpenChange={setIsAreaCreateModalOpen}>
              <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-900">Add New Area</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    Create a new area with geographic boundaries defined by GeoJSON
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-area-name" className="text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-area-name"
                      placeholder="e.g., Banani Block C"
                      value={createAreaName}
                      onChange={(e) => setCreateAreaName(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <HierarchicalLocationSelector
                    wasas={wasas}
                    zones={zones}
                    areas={[]}
                    wasaId={createAreaWasaId}
                    zoneId={createAreaZoneId}
                    areaId=""
                    onWasaChange={(value) => {
                      setCreateAreaWasaId(value);
                      setCreateAreaZoneId(''); // Reset zone when WASA changes
                    }}
                    onZoneChange={setCreateAreaZoneId}
                    onAreaChange={() => {}}
                    required
                    showArea={false}
                  />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="create-area-geojson" className="text-sm font-medium text-gray-700">
                        GeoJSON <span className="text-red-500">*</span>
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCreateAreaGeoJson(generateTemplateGeoJson())}
                        className="border-gray-300 text-gray-700 rounded-lg h-8 px-3 bg-white hover:bg-gray-50 inline-flex items-center gap-1.5"
                      >
                        <FileText size={14} />
                        Generate Template
                      </Button>
                    </div>
                    <Textarea
                      id="create-area-geojson"
                      placeholder={geoJsonExample}
                      value={createAreaGeoJson}
                      onChange={(e) => setCreateAreaGeoJson(e.target.value)}
                      className="border-gray-300 rounded-lg min-h-[200px] font-mono text-sm"
                    />
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">
                        Enter valid GeoJSON format. Supported geometry types:
                      </p>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>• <strong>Polygon</strong> - Closed area boundary (most common for areas)</p>
                        <p>• <strong>MultiPolygon</strong> - Multiple polygons</p>
                        <p>• <strong>Point</strong> - Single location [longitude, latitude]</p>
                        <p>• <strong>LineString</strong> - Line path</p>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAreaCreateModalOpen(false);
                      setCreateAreaName('');
                      setCreateAreaZoneId('');
                      setCreateAreaWasaId('');
                      setCreateAreaGeoJson('');
                    }}
                    className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateArea}
                    disabled={createAreaMutation.isPending}
                    className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
                  >
                    {createAreaMutation.isPending ? 'Creating...' : 'Create Area'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Area Modal */}
            <Dialog open={isAreaEditModalOpen} onOpenChange={setIsAreaEditModalOpen}>
              <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-900">Edit Area</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    Update the area details and geographic boundaries
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-area-name" className="text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-area-name"
                      placeholder="e.g., Banani Block C"
                      value={editAreaName}
                      onChange={(e) => setEditAreaName(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <HierarchicalLocationSelector
                    wasas={wasas}
                    zones={zones}
                    areas={[]}
                    wasaId={editAreaWasaId}
                    zoneId={editAreaZoneId}
                    areaId=""
                    onWasaChange={(value) => {
                      setEditAreaWasaId(value);
                      // Only reset zone if WASA is actually changing (not during initialization)
                      if (!isInitializingEdit.current && value !== editAreaWasaId) {
                        setEditAreaZoneId(''); // Reset zone when WASA changes
                      }
                    }}
                    onZoneChange={setEditAreaZoneId}
                    onAreaChange={() => {}}
                    required
                    showArea={false}
                  />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="edit-area-geojson" className="text-sm font-medium text-gray-700">
                        GeoJSON
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditAreaGeoJson(generateTemplateGeoJson())}
                        className="border-gray-300 text-gray-700 rounded-lg h-8 px-3 bg-white hover:bg-gray-50 inline-flex items-center gap-1.5"
                      >
                        <FileText size={14} />
                        Generate Template
                      </Button>
                    </div>
                    <Textarea
                      id="edit-area-geojson"
                      placeholder={geoJsonExample}
                      value={editAreaGeoJson}
                      onChange={(e) => setEditAreaGeoJson(e.target.value)}
                      className="border-gray-300 rounded-lg min-h-[200px] font-mono text-sm"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAreaEditModalOpen(false);
                      setEditingArea(null);
                      setEditAreaName('');
                      setEditAreaZoneId('');
                      setEditAreaWasaId('');
                      setEditAreaGeoJson('');
                    }}
                    className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateArea}
                    disabled={updateAreaMutation.isPending}
                    className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
                  >
                    {updateAreaMutation.isPending ? 'Updating...' : 'Update Area'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <DeleteConfirmationDialog
              isOpen={isAreaDeleteDialogOpen}
              onClose={() => {
                setIsAreaDeleteDialogOpen(false);
                setAreaToDelete(null);
              }}
              onConfirm={confirmDeleteArea}
              title="Delete Area"
              description="Are you sure you want to delete the area"
              itemName={areaToDelete?.name}
              isPending={deleteAreaMutation.isPending}
            />
          </>
        )}
      </div>
    </div>
  );
}
