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
  CityCorporation, CreateCityCorporationDto, UpdateCityCorporationDto,
  Zone, CreateZoneDto, UpdateZoneDto
} from '../types';

export function LocationManagement() {
  const [activeTab, setActiveTab] = useState<'city-corporations' | 'zones' | 'areas'>('city-corporations');
  
  // City Corporation states
  const [isCityCorpCreateModalOpen, setIsCityCorpCreateModalOpen] = useState(false);
  const [isCityCorpEditModalOpen, setIsCityCorpEditModalOpen] = useState(false);
  const [isCityCorpDeleteDialogOpen, setIsCityCorpDeleteDialogOpen] = useState(false);
  const [editingCityCorp, setEditingCityCorp] = useState<CityCorporation | null>(null);
  const [cityCorpToDelete, setCityCorpToDelete] = useState<CityCorporation | null>(null);
  const [createCityCorpName, setCreateCityCorpName] = useState('');
  const [createCityCorpCode, setCreateCityCorpCode] = useState('');
  const [createCityCorpAddress, setCreateCityCorpAddress] = useState('');
  const [editCityCorpName, setEditCityCorpName] = useState('');
  const [editCityCorpCode, setEditCityCorpCode] = useState('');
  const [editCityCorpAddress, setEditCityCorpAddress] = useState('');
  const [cityCorpSearchQuery, setCityCorpSearchQuery] = useState('');

  // Zone states - add filter states
  const [isZoneCreateModalOpen, setIsZoneCreateModalOpen] = useState(false);
  const [isZoneEditModalOpen, setIsZoneEditModalOpen] = useState(false);
  const [isZoneDeleteDialogOpen, setIsZoneDeleteDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);
  const [createZoneNo, setCreateZoneNo] = useState('');
  const [createZoneName, setCreateZoneName] = useState('');
  const [createZoneCityName, setCreateZoneCityName] = useState('');
  const [createZoneCityCorpId, setCreateZoneCityCorpId] = useState<string>('');
  const [editZoneNo, setEditZoneNo] = useState('');
  const [editZoneName, setEditZoneName] = useState('');
  const [editZoneCityName, setEditZoneCityName] = useState('');
  const [editZoneCityCorpId, setEditZoneCityCorpId] = useState<string>('');
  const [zoneSearchQuery, setZoneSearchQuery] = useState('');
  const [zoneFilterCityCorpId, setZoneFilterCityCorpId] = useState<string>('');

  // Area states
  const [isAreaCreateModalOpen, setIsAreaCreateModalOpen] = useState(false);
  const [isAreaEditModalOpen, setIsAreaEditModalOpen] = useState(false);
  const [isAreaDeleteDialogOpen, setIsAreaDeleteDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);
  const [createAreaName, setCreateAreaName] = useState('');
  const [createAreaZoneId, setCreateAreaZoneId] = useState<string>('');
  const [createAreaCityCorpId, setCreateAreaCityCorpId] = useState<string>('');
  const [createAreaGeoJson, setCreateAreaGeoJson] = useState('');
  const [editAreaName, setEditAreaName] = useState('');
  const [editAreaZoneId, setEditAreaZoneId] = useState<string>('');
  const [editAreaCityCorpId, setEditAreaCityCorpId] = useState<string>('');
  const [editAreaGeoJson, setEditAreaGeoJson] = useState('');
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [geoJsonTypeFilter, setGeoJsonTypeFilter] = useState<string>('all');
  const [areaFilterCityCorpId, setAreaFilterCityCorpId] = useState<string>('all');
  const [areaFilterZoneId, setAreaFilterZoneId] = useState<string>('all');
  
  // Ref to track if we're initializing edit form (to prevent zone reset)
  const isInitializingEdit = useRef(false);

  // Fetch data
  const { data: cityCorpsData, isLoading: cityCorpsLoading } = useApiQuery<CityCorporation[]>(
    ['city-corporations'],
    () => api.cityCorporations.getAll()
  );
  const cityCorporations: CityCorporation[] = (cityCorpsData ?? []) as CityCorporation[];

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
  const filteredCityCorps = useMemo(() => {
    if (!cityCorpSearchQuery.trim()) return cityCorporations;
    const query = cityCorpSearchQuery.toLowerCase();
    return cityCorporations.filter(cc => 
      cc.name.toLowerCase().includes(query) ||
      cc.code.toLowerCase().includes(query) ||
      cc.id.toString().includes(query)
    );
  }, [cityCorporations, cityCorpSearchQuery]);

  const filteredZones = useMemo(() => {
    let result = zones;
    
    // Filter by city corporation
    if (zoneFilterCityCorpId && zoneFilterCityCorpId !== 'all') {
      result = result.filter(zone => zone.cityCorporationId === parseInt(zoneFilterCityCorpId));
    }
    
    // Filter by search query
    if (zoneSearchQuery.trim()) {
      const query = zoneSearchQuery.toLowerCase();
      result = result.filter(zone => {
        const cityCorp = cityCorporations.find(cc => cc.id === zone.cityCorporationId);
        return (
          zone.name.toLowerCase().includes(query) ||
          zone.zoneNo.toLowerCase().includes(query) ||
          zone.cityName.toLowerCase().includes(query) ||
          zone.id.toString().includes(query) ||
          cityCorp?.name.toLowerCase().includes(query)
        );
      });
    }
    
    return result;
  }, [zones, zoneSearchQuery, zoneFilterCityCorpId, cityCorporations]);

  const filteredAreas = useMemo(() => {
    let result = areas;
    
    // Filter by city corporation
    if (areaFilterCityCorpId && areaFilterCityCorpId !== 'all') {
      result = result.filter(area => {
        // Use nested zone object from area if available, otherwise fallback to lookup
        const zone = area.zone || zones.find(z => z.id === area.zoneId);
        return zone?.cityCorporationId === parseInt(areaFilterCityCorpId);
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
  }, [areas, areaSearchQuery, geoJsonTypeFilter, areaFilterCityCorpId, areaFilterZoneId, zones]);

  const uniqueGeoJsonTypes = useMemo(() => {
    const types = new Set(areas.map(area => area.geojson.type));
    return Array.from(types).sort();
  }, [areas]);

  // City Corporation mutations
  const createCityCorpMutation = useApiMutation(
    (data: CreateCityCorporationDto) => api.cityCorporations.create(data),
    {
      successMessage: 'City Corporation created successfully',
      errorMessage: 'Failed to create city corporation',
      invalidateQueries: [['city-corporations']],
    }
  );

  const updateCityCorpMutation = useApiMutation(
    (data: { id: number; dto: UpdateCityCorporationDto }) => api.cityCorporations.update(data.id, data.dto),
    {
      successMessage: 'City Corporation updated successfully',
      errorMessage: 'Failed to update city corporation',
      invalidateQueries: [['city-corporations']],
    }
  );

  const deleteCityCorpMutation = useApiMutation(
    (id: number) => api.cityCorporations.delete(id),
    {
      successMessage: 'City Corporation deleted successfully',
      errorMessage: 'Failed to delete city corporation',
      invalidateQueries: [['city-corporations']],
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

  // City Corporation handlers
  const handleCreateCityCorp = async () => {
    if (!createCityCorpName.trim() || !createCityCorpCode.trim()) {
      alert('Please enter name and code');
      return;
    }

    await createCityCorpMutation.mutateAsync({
      name: createCityCorpName.trim(),
      code: createCityCorpCode.trim(),
      address: createCityCorpAddress.trim() || undefined,
    });

    setCreateCityCorpName('');
    setCreateCityCorpCode('');
    setCreateCityCorpAddress('');
    setIsCityCorpCreateModalOpen(false);
  };

  const handleEditCityCorp = (cityCorp: CityCorporation) => {
    setEditingCityCorp(cityCorp);
    setEditCityCorpName(cityCorp.name);
    setEditCityCorpCode(cityCorp.code);
    setEditCityCorpAddress(cityCorp.address || '');
    setIsCityCorpEditModalOpen(true);
  };

  const handleUpdateCityCorp = async () => {
    if (!editingCityCorp) return;
    if (!editCityCorpName.trim() || !editCityCorpCode.trim()) {
      alert('Please enter name and code');
      return;
    }

    await updateCityCorpMutation.mutateAsync({
      id: editingCityCorp.id,
      dto: {
        name: editCityCorpName.trim(),
        code: editCityCorpCode.trim(),
        address: editCityCorpAddress.trim() || undefined,
      },
    });

    setIsCityCorpEditModalOpen(false);
    setEditingCityCorp(null);
    setEditCityCorpName('');
    setEditCityCorpCode('');
    setEditCityCorpAddress('');
  };

  const handleDeleteCityCorp = (cityCorp: CityCorporation) => {
    setCityCorpToDelete(cityCorp);
    setIsCityCorpDeleteDialogOpen(true);
  };

  const confirmDeleteCityCorp = async () => {
    if (cityCorpToDelete) {
      try {
        await deleteCityCorpMutation.mutateAsync(cityCorpToDelete.id);
        setCityCorpToDelete(null);
        setIsCityCorpDeleteDialogOpen(false);
      } catch (error: any) {
        console.error('City corporation deletion error:', error);
        // Error toast is already shown by mutation hook
        if (error?.response?.status === 404) {
          alert('City Corporation not found. It may have already been deleted.');
        } else if (error?.response?.status === 409) {
          alert('Cannot delete city corporation. It may be in use by zones or other entities.');
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
    if (!createZoneCityCorpId) {
      alert('Please select a City Corporation');
      return;
    }

    try {
      await createZoneMutation.mutateAsync({
        zoneNo: createZoneNo.trim(),
        name: createZoneName.trim(),
        cityName: createZoneCityName.trim(),
        cityCorporationId: parseInt(createZoneCityCorpId),
        // Note: tariffCategory is not included as backend DTO doesn't accept it
      });

      setCreateZoneNo('');
      setCreateZoneName('');
      setCreateZoneCityName('');
      setCreateZoneCityCorpId('');
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
    setEditZoneCityCorpId(zone.cityCorporationId.toString());
    setIsZoneEditModalOpen(true);
  };

  const handleUpdateZone = async () => {
    if (!editingZone) return;
    if (!editZoneNo.trim() || !editZoneName.trim() || !editZoneCityName.trim() || !editZoneCityCorpId) {
      alert('Please fill in all required fields');
      return;
    }

    await updateZoneMutation.mutateAsync({
      id: editingZone.id,
      dto: {
        zoneNo: editZoneNo.trim(),
        name: editZoneName.trim(),
        cityName: editZoneCityName.trim(),
        cityCorporationId: parseInt(editZoneCityCorpId),
      },
    });

    setIsZoneEditModalOpen(false);
    setEditingZone(null);
    setEditZoneNo('');
    setEditZoneName('');
    setEditZoneCityName('');
    setEditZoneCityCorpId('');
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

    if (!createAreaCityCorpId) {
      alert('Please select a City Corporation first');
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
    
    // Set city corporation first (this is required for zone dropdown to be enabled)
    const cityCorpId = zone.cityCorporationId.toString();
    // Use zone.id from nested object (this is the actual zone ID, not zoneNo)
    const zoneId = zone.id.toString();
    
    // Mark that we're initializing to prevent zone reset
    isInitializingEdit.current = true;
    
    // Set both values - city corp first, then zone
    setEditAreaCityCorpId(cityCorpId);
    // Set zone after city corp is set (using setTimeout to ensure state update order)
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

    if (!editAreaCityCorpId) {
      alert('Please select a City Corporation first');
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
    setEditAreaCityCorpId('');
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

  if (cityCorpsLoading || zonesLoading || areasLoading) {
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
          <p className="text-sm text-gray-500 mt-1">Manage city corporations, zones, and areas</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('city-corporations')}
              className={`pb-3 text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === 'city-corporations'
                  ? 'border-[#4C6EF5] text-[#4C6EF5]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              City Corporations
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

        {/* City Corporations Tab */}
        {activeTab === 'city-corporations' && (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <Button 
                onClick={() => setIsCityCorpCreateModalOpen(true)}
                className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-11 px-6 flex items-center gap-2"
              >
                <Plus size={18} />
                Add New City Corporation
              </Button>

              <div className="flex items-center gap-3 flex-1 justify-end">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    type="text"
                    placeholder="Search by name, code, or ID..."
                    value={cityCorpSearchQuery}
                    onChange={(e) => setCityCorpSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {filteredCityCorps.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500 text-lg mb-4">No city corporations found</p>
                <p className="text-gray-400 text-sm">Create your first city corporation to get started</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    All City Corporations ({filteredCityCorps.length})
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
                    {filteredCityCorps.map((cityCorp) => (
                      <TableRow key={cityCorp.id} className="border-gray-100">
                        <TableCell className="text-sm text-gray-600">{cityCorp.id}</TableCell>
                        <TableCell className="text-sm font-medium text-gray-900">{cityCorp.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{cityCorp.code}</TableCell>
                        <TableCell className="text-sm text-gray-600">{cityCorp.address || '-'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditCityCorp(cityCorp)}
                              className="border-gray-300 text-gray-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteCityCorp(cityCorp)}
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

            {/* Create City Corporation Modal */}
            <Dialog open={isCityCorpCreateModalOpen} onOpenChange={setIsCityCorpCreateModalOpen}>
              <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-900">Add New City Corporation</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    Create a new city corporation
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-city-corp-name" className="text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-city-corp-name"
                      placeholder="e.g., Dhaka North City Corporation"
                      value={createCityCorpName}
                      onChange={(e) => setCreateCityCorpName(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-city-corp-code" className="text-sm font-medium text-gray-700">
                      Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-city-corp-code"
                      placeholder="e.g., DNCC"
                      value={createCityCorpCode}
                      onChange={(e) => setCreateCityCorpCode(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-city-corp-address" className="text-sm font-medium text-gray-700">
                      Address
                    </Label>
                    <Input
                      id="create-city-corp-address"
                      placeholder="Optional address"
                      value={createCityCorpAddress}
                      onChange={(e) => setCreateCityCorpAddress(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCityCorpCreateModalOpen(false);
                      setCreateCityCorpName('');
                      setCreateCityCorpCode('');
                      setCreateCityCorpAddress('');
                    }}
                    className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCityCorp}
                    disabled={createCityCorpMutation.isPending}
                    className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
                  >
                    {createCityCorpMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit City Corporation Modal */}
            <Dialog open={isCityCorpEditModalOpen} onOpenChange={setIsCityCorpEditModalOpen}>
              <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-900">Edit City Corporation</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    Update city corporation details
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-city-corp-name" className="text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-city-corp-name"
                      value={editCityCorpName}
                      onChange={(e) => setEditCityCorpName(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-city-corp-code" className="text-sm font-medium text-gray-700">
                      Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-city-corp-code"
                      value={editCityCorpCode}
                      onChange={(e) => setEditCityCorpCode(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-city-corp-address" className="text-sm font-medium text-gray-700">
                      Address
                    </Label>
                    <Input
                      id="edit-city-corp-address"
                      value={editCityCorpAddress}
                      onChange={(e) => setEditCityCorpAddress(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCityCorpEditModalOpen(false);
                      setEditingCityCorp(null);
                      setEditCityCorpName('');
                      setEditCityCorpCode('');
                      setEditCityCorpAddress('');
                    }}
                    className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateCityCorp}
                    disabled={updateCityCorpMutation.isPending}
                    className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
                  >
                    {updateCityCorpMutation.isPending ? 'Updating...' : 'Update'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <DeleteConfirmationDialog
              isOpen={isCityCorpDeleteDialogOpen}
              onClose={() => {
                setIsCityCorpDeleteDialogOpen(false);
                setCityCorpToDelete(null);
              }}
              onConfirm={confirmDeleteCityCorp}
              title="Delete City Corporation"
              description="Are you sure you want to delete the city corporation"
              itemName={cityCorpToDelete?.name}
              isPending={deleteCityCorpMutation.isPending}
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
                    value={zoneFilterCityCorpId} 
                    onValueChange={(value) => {
                      setZoneFilterCityCorpId(value);
                    }}
                  >
                    <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white min-w-0 [&>*:first-child]:truncate [&>*:first-child]:min-w-0">
                      <SelectValue placeholder="Filter by City Corp" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="all">All City Corporations</SelectItem>
                      {cityCorporations.map(cc => (
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
                      <TableHead className="text-sm font-semibold text-gray-700">City Corporation</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredZones.map((zone) => {
                      const cityCorp = cityCorporations.find(cc => cc.id === zone.cityCorporationId);
                      return (
                        <TableRow key={zone.id} className="border-gray-100">
                          <TableCell className="text-sm text-gray-600">{zone.id}</TableCell>
                          <TableCell className="text-sm text-gray-600">{zone.zoneNo}</TableCell>
                          <TableCell className="text-sm font-medium text-gray-900">{zone.name}</TableCell>
                          <TableCell className="text-sm text-gray-600">{zone.cityName}</TableCell>
                          <TableCell className="text-sm text-gray-600">{cityCorp?.name || '-'}</TableCell>
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
                    <Label htmlFor="create-zone-city-corp" className="text-sm font-medium text-gray-700">
                      City Corporation <span className="text-red-500">*</span>
                    </Label>
                    <Select value={createZoneCityCorpId} onValueChange={setCreateZoneCityCorpId}>
                      <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white">
                        <SelectValue placeholder="Select city corporation" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        {cityCorporations.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No city corporations available</div>
                        ) : (
                          cityCorporations.map(cc => (
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
                      setCreateZoneCityCorpId('');
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
                    <Label htmlFor="edit-zone-city-corp" className="text-sm font-medium text-gray-700">
                      City Corporation <span className="text-red-500">*</span>
                    </Label>
                    <Select value={editZoneCityCorpId} onValueChange={setEditZoneCityCorpId}>
                      <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white">
                        <SelectValue placeholder="Select city corporation" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        {cityCorporations.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No city corporations available</div>
                        ) : (
                          cityCorporations.map(cc => (
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
                      setEditZoneCityCorpId('');
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
                    value={areaFilterCityCorpId} 
                    onValueChange={(value) => {
                      setAreaFilterCityCorpId(value);
                      setAreaFilterZoneId('all'); // Reset zone filter when city corp changes
                    }}
                  >
                    <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white min-w-0 [&>*:first-child]:truncate [&>*:first-child]:min-w-0">
                      <SelectValue placeholder="Filter by City Corp" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="all">All City Corporations</SelectItem>
                      {cityCorporations.map(cc => (
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
                    disabled={!areaFilterCityCorpId || areaFilterCityCorpId === 'all'}
                  >
                    <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white disabled:opacity-50 disabled:cursor-not-allowed min-w-0 [&>*:first-child]:truncate [&>*:first-child]:min-w-0">
                      <SelectValue placeholder={areaFilterCityCorpId ? "Filter by Zone" : "Select City Corp first"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      {!areaFilterCityCorpId || areaFilterCityCorpId === 'all' ? (
                        <SelectItem value="__placeholder__" disabled className="text-gray-500 cursor-not-allowed">
                          Select city corporation first
                        </SelectItem>
                      ) : (() => {
                        // Get zones from areas that belong to the selected city corporation
                        // Use nested zone object from areas
                        const zonesFromAreas = areas
                          .filter(area => {
                            // Use nested zone object if available, otherwise fallback to lookup
                            const zone = area.zone || zones.find(z => z.id === area.zoneId);
                            return zone?.cityCorporationId === parseInt(areaFilterCityCorpId);
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
                              No zones with areas found for this city corporation
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
                      <TableHead className="text-sm font-semibold text-gray-700">City Corporation</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700">GeoJSON Type</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAreas.map((area) => {
                      // Use nested zone object from area if available, otherwise fallback to lookup
                      const zone = area.zone || zones.find(z => z.id === area.zoneId);
                      const cityCorp = zone?.cityCorporationId 
                        ? cityCorporations.find(cc => cc.id === zone.cityCorporationId) 
                        : null;
                      return (
                        <TableRow key={area.id} className="border-gray-100">
                          <TableCell className="text-sm text-gray-600">{area.id}</TableCell>
                          <TableCell className="text-sm font-medium text-gray-900">{area.name}</TableCell>
                          <TableCell className="text-sm text-gray-600">{zone?.name || '-'}</TableCell>
                          <TableCell className="text-sm text-gray-600">{cityCorp?.name || '-'}</TableCell>
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
                    cityCorporations={cityCorporations}
                    zones={zones}
                    areas={[]}
                    cityCorporationId={createAreaCityCorpId}
                    zoneId={createAreaZoneId}
                    areaId=""
                    onCityCorporationChange={(value) => {
                      setCreateAreaCityCorpId(value);
                      setCreateAreaZoneId(''); // Reset zone when city corp changes
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
                      setCreateAreaCityCorpId('');
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
                    cityCorporations={cityCorporations}
                    zones={zones}
                    areas={[]}
                    cityCorporationId={editAreaCityCorpId}
                    zoneId={editAreaZoneId}
                    areaId=""
                    onCityCorporationChange={(value) => {
                      setEditAreaCityCorpId(value);
                      // Only reset zone if city corp is actually changing (not during initialization)
                      if (!isInitializingEdit.current && value !== editAreaCityCorpId) {
                        setEditAreaZoneId(''); // Reset zone when city corp changes
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
                      setEditAreaCityCorpId('');
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
