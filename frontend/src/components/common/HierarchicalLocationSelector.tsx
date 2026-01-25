import { useMemo } from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { CityCorporation, Zone, Area } from '../../types';

export interface HierarchicalLocationSelectorProps {
  cityCorporations: CityCorporation[];
  zones: Zone[];
  areas: Area[];
  cityCorporationId?: string;
  zoneId?: string;
  areaId?: string;
  onCityCorporationChange: (cityCorporationId: string) => void;
  onZoneChange: (zoneId: string) => void;
  onAreaChange: (areaId: string) => void;
  required?: boolean;
  className?: string;
  cityCorporationLabel?: string;
  zoneLabel?: string;
  areaLabel?: string;
  cityCorporationPlaceholder?: string;
  zonePlaceholder?: string;
  areaPlaceholder?: string;
  disabled?: boolean;
  layout?: 'vertical' | 'horizontal';
  showArea?: boolean; // Whether to show area selection (default: true)
}

export function HierarchicalLocationSelector({
  cityCorporations,
  zones,
  areas,
  cityCorporationId,
  zoneId,
  areaId,
  onCityCorporationChange,
  onZoneChange,
  onAreaChange,
  required = false,
  className = '',
  cityCorporationLabel = 'City Corporation',
  zoneLabel = 'Zone',
  areaLabel = 'Area',
  cityCorporationPlaceholder = 'Select city corporation',
  zonePlaceholder = 'Select zone',
  areaPlaceholder = 'Select area',
  disabled = false,
  layout = 'vertical',
  showArea = true,
}: HierarchicalLocationSelectorProps) {
  // Filter zones by selected city corporation
  const filteredZones = useMemo(() => {
    if (!cityCorporationId) return [];
    return zones.filter((zone) => zone.cityCorporationId === parseInt(cityCorporationId));
  }, [zones, cityCorporationId]);

  // Filter areas by selected zone
  const filteredAreas = useMemo(() => {
    if (!zoneId) return [];
    const zoneIdNum = parseInt(zoneId);
    if (isNaN(zoneIdNum)) return [];
    
    // Handle both direct zoneId and nested zone.id
    const filtered = areas.filter((area) => {
      // Check direct zoneId property (number comparison)
      const directZoneId = area.zoneId !== undefined ? Number(area.zoneId) : null;
      const nestedZoneId = area.zone?.id !== undefined ? Number(area.zone.id) : null;
      
      return directZoneId === zoneIdNum || nestedZoneId === zoneIdNum;
    });
    
    return filtered;
  }, [areas, zoneId]);

  const handleCityCorporationChange = (value: string) => {
    onCityCorporationChange(value);
    onZoneChange(''); // Reset zone when city corp changes
    onAreaChange(''); // Reset area when city corp changes
  };

  const handleZoneChange = (value: string) => {
    onZoneChange(value);
    onAreaChange(''); // Reset area when zone changes
  };

  const requiredIndicator = required ? <span className="text-red-500">*</span> : null;

  if (layout === 'horizontal') {
    return (
      <div className={`grid ${showArea ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'} gap-4 ${className}`}>
        {/* City Corporation */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            {cityCorporationLabel} {requiredIndicator}
          </Label>
          <Select
            value={cityCorporationId || ''}
            onValueChange={handleCityCorporationChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white disabled:opacity-50 disabled:cursor-not-allowed min-w-0">
              <SelectValue placeholder={cityCorporationPlaceholder} />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 max-w-[var(--radix-select-trigger-width)] z-[100]" position="popper">
              {cityCorporations.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">No city corporations available</div>
              ) : (
                cityCorporations.map((cc) => (
                  <SelectItem key={cc.id} value={cc.id.toString()} className="whitespace-normal" title={`${cc.name} (${cc.code})`}>
                    {cc.name} ({cc.code})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Zone */}
        <div className="space-y-2 min-w-0">
          <Label className="text-sm font-medium text-gray-700">
            {zoneLabel} {requiredIndicator}
          </Label>
          <Select
            value={zoneId || ''}
            onValueChange={handleZoneChange}
            disabled={disabled || !cityCorporationId}
          >
            <SelectTrigger 
              className="w-full border-gray-300 rounded-lg h-11 bg-white disabled:opacity-50 disabled:cursor-not-allowed min-w-0" 
              title={zoneId ? filteredZones.find(z => z.id.toString() === zoneId)?.name + ' - ' + filteredZones.find(z => z.id.toString() === zoneId)?.cityName : ''}
            >
              <SelectValue placeholder={cityCorporationId ? zonePlaceholder : 'Select city corporation first'} />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 max-w-[var(--radix-select-trigger-width)] z-[100]" position="popper">
              {!cityCorporationId ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">Please select a city corporation first</div>
              ) : filteredZones.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">No zones available for this city corporation</div>
              ) : (
                filteredZones.map((zone) => (
                  <SelectItem
                    key={zone.id}
                    value={zone.id.toString()}
                    className="whitespace-normal"
                    title={`${zone.name} - ${zone.cityName}`}
                  >
                    {zone.name} - {zone.cityName}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Area */}
        <div className="space-y-2 min-w-0">
          <Label className="text-sm font-medium text-gray-700">
            {areaLabel} {requiredIndicator}
          </Label>
          <Select
            value={areaId || ''}
            onValueChange={onAreaChange}
            disabled={disabled || !zoneId}
          >
            <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white disabled:opacity-50 disabled:cursor-not-allowed min-w-0" title={areaId ? filteredAreas.find(a => a.id.toString() === areaId)?.name || '' : ''}>
              <SelectValue placeholder={zoneId ? areaPlaceholder : 'Select zone first'} />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 max-w-[var(--radix-select-trigger-width)] z-[100]" position="popper">
              {!zoneId ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">Please select a zone first</div>
              ) : filteredAreas.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">No areas available for this zone</div>
              ) : (
                filteredAreas.map((area) => (
                  <SelectItem
                    key={area.id}
                    value={area.id.toString()}
                    className="whitespace-normal"
                    title={area.name || area.id.toString()}
                  >
                    {area.name || area.id.toString()}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  // Vertical layout (default)
  return (
    <div className={`space-y-4 ${className}`}>
      {/* City Corporation */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          {cityCorporationLabel} {requiredIndicator}
        </Label>
        <Select
          value={cityCorporationId || ''}
          onValueChange={handleCityCorporationChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white disabled:opacity-50 disabled:cursor-not-allowed min-w-0">
            <SelectValue placeholder={cityCorporationPlaceholder} />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 max-w-[var(--radix-select-trigger-width)] z-[100]" position="popper">
            {cityCorporations.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-gray-500">No city corporations available</div>
            ) : (
              cityCorporations.map((cc) => (
                <SelectItem key={cc.id} value={cc.id.toString()} title={`${cc.name} (${cc.code})`}>
                  {cc.name} ({cc.code})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Zone and Area in a grid */}
      <div className={`grid ${showArea ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-4`}>
        {/* Zone */}
        <div className="space-y-2 min-w-0">
          <Label className="text-sm font-medium text-gray-700">
            {zoneLabel} {requiredIndicator}
          </Label>
          <Select
            value={zoneId || ''}
            onValueChange={handleZoneChange}
            disabled={disabled || !cityCorporationId}
          >
            <SelectTrigger 
              className="w-full border-gray-300 rounded-lg h-11 bg-white disabled:opacity-50 disabled:cursor-not-allowed min-w-0" 
              title={zoneId ? filteredZones.find(z => z.id.toString() === zoneId)?.name + ' - ' + filteredZones.find(z => z.id.toString() === zoneId)?.cityName : ''}
            >
              <SelectValue placeholder={cityCorporationId ? zonePlaceholder : 'Select city corporation first'} />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 max-w-[var(--radix-select-trigger-width)] z-[100]" position="popper">
              {!cityCorporationId ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">Please select a city corporation first</div>
              ) : filteredZones.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">No zones available for this city corporation</div>
              ) : (
                filteredZones.map((zone) => (
                  <SelectItem
                    key={zone.id}
                    value={zone.id.toString()}
                    className="whitespace-normal"
                    title={`${zone.name} - ${zone.cityName}`}
                  >
                    {zone.name} - {zone.cityName}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Area */}
        <div className="space-y-2 min-w-0">
          <Label className="text-sm font-medium text-gray-700">
            {areaLabel} {requiredIndicator}
          </Label>
          <Select
            value={areaId || ''}
            onValueChange={onAreaChange}
            disabled={disabled || !zoneId}
          >
            <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white disabled:opacity-50 disabled:cursor-not-allowed min-w-0" title={areaId ? filteredAreas.find(a => a.id.toString() === areaId)?.name || '' : ''}>
              <SelectValue placeholder={zoneId ? areaPlaceholder : 'Select zone first'} />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 max-w-[var(--radix-select-trigger-width)] z-[100]" position="popper">
              {!zoneId ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">Please select a zone first</div>
              ) : filteredAreas.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">No areas available for this zone</div>
              ) : (
                filteredAreas.map((area) => (
                  <SelectItem
                    key={area.id}
                    value={area.id.toString()}
                    className="whitespace-normal"
                    title={area.name || area.id.toString()}
                  >
                    {area.name || area.id.toString()}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
