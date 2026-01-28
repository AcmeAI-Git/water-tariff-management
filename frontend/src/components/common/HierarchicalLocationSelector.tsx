import { useMemo } from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Wasa, Zone, Area } from '../../types';

export interface HierarchicalLocationSelectorProps {
  wasas: Wasa[];
  zones: Zone[];
  areas: Area[];
  wasaId?: string;
  zoneId?: string;
  areaId?: string;
  onWasaChange: (wasaId: string) => void;
  onZoneChange: (zoneId: string) => void;
  onAreaChange: (areaId: string) => void;
  required?: boolean;
  className?: string;
  wasaLabel?: string;
  zoneLabel?: string;
  areaLabel?: string;
  wasaPlaceholder?: string;
  zonePlaceholder?: string;
  areaPlaceholder?: string;
  disabled?: boolean;
  layout?: 'vertical' | 'horizontal';
  showArea?: boolean; // Whether to show area selection (default: true)
}

export function HierarchicalLocationSelector({
  wasas,
  zones,
  areas,
  wasaId,
  zoneId,
  areaId,
  onWasaChange,
  onZoneChange,
  onAreaChange,
  required = false,
  className = '',
  wasaLabel = 'WASA',
  zoneLabel = 'Zone',
  areaLabel = 'Area',
  wasaPlaceholder = 'Select WASA',
  zonePlaceholder = 'Select zone',
  areaPlaceholder = 'Select area',
  disabled = false,
  layout = 'vertical',
  showArea = true,
}: HierarchicalLocationSelectorProps) {
  // Filter zones by selected WASA
  const filteredZones = useMemo(() => {
    if (!wasaId) return [];
    return zones.filter((zone) => zone.wasaId === parseInt(wasaId));
  }, [zones, wasaId]);

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

  const handleWasaChange = (value: string) => {
    onWasaChange(value);
    onZoneChange(''); // Reset zone when WASA changes
    onAreaChange(''); // Reset area when WASA changes
  };

  const handleZoneChange = (value: string) => {
    onZoneChange(value);
    onAreaChange(''); // Reset area when zone changes
  };

  const requiredIndicator = required ? <span className="text-red-500">*</span> : null;

  if (layout === 'horizontal') {
    return (
      <div className={`grid ${showArea ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'} gap-4 ${className}`}>
        {/* WASA */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            {wasaLabel} {requiredIndicator}
          </Label>
          <Select
            value={wasaId || ''}
            onValueChange={handleWasaChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white disabled:opacity-50 disabled:cursor-not-allowed min-w-0">
              <SelectValue placeholder={wasaPlaceholder} />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 max-w-[var(--radix-select-trigger-width)] z-[100]" position="popper">
              {wasas.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">No WASAs available</div>
              ) : (
                wasas.map((wasa) => (
                  <SelectItem key={wasa.id} value={wasa.id.toString()} className="whitespace-normal" title={`${wasa.name} (${wasa.code})`}>
                    {wasa.name} ({wasa.code})
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
            disabled={disabled || !wasaId}
          >
            <SelectTrigger 
              className="w-full border-gray-300 rounded-lg h-11 bg-white disabled:opacity-50 disabled:cursor-not-allowed min-w-0" 
              title={zoneId ? filteredZones.find(z => z.id.toString() === zoneId)?.name + ' - ' + filteredZones.find(z => z.id.toString() === zoneId)?.cityName : ''}
            >
              <SelectValue placeholder={wasaId ? zonePlaceholder : 'Select WASA first'} />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 max-w-[var(--radix-select-trigger-width)] z-[100]" position="popper">
              {!wasaId ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">Please select a WASA first</div>
              ) : filteredZones.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">No zones available for this WASA</div>
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
        {showArea && (
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
        )}
      </div>
    );
  }

  // Vertical layout (default)
  return (
    <div className={`space-y-4 ${className}`}>
      {/* WASA */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          {wasaLabel} {requiredIndicator}
        </Label>
        <Select
          value={wasaId || ''}
          onValueChange={handleWasaChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white disabled:opacity-50 disabled:cursor-not-allowed min-w-0">
            <SelectValue placeholder={wasaPlaceholder} />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 max-w-[var(--radix-select-trigger-width)] z-[100]" position="popper">
            {wasas.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-gray-500">No WASAs available</div>
            ) : (
              wasas.map((wasa) => (
                <SelectItem key={wasa.id} value={wasa.id.toString()} title={`${wasa.name} (${wasa.code})`}>
                  {wasa.name} ({wasa.code})
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
          disabled={disabled || !wasaId}
        >
          <SelectTrigger 
            className="w-full border-gray-300 rounded-lg h-11 bg-white disabled:opacity-50 disabled:cursor-not-allowed min-w-0" 
            title={zoneId ? filteredZones.find(z => z.id.toString() === zoneId)?.name + ' - ' + filteredZones.find(z => z.id.toString() === zoneId)?.cityName : ''}
          >
            <SelectValue placeholder={wasaId ? zonePlaceholder : 'Select WASA first'} />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 max-w-[var(--radix-select-trigger-width)] z-[100]" position="popper">
            {!wasaId ? (
              <div className="px-2 py-1.5 text-sm text-gray-500">Please select a WASA first</div>
            ) : filteredZones.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-gray-500">No zones available for this WASA</div>
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
      {showArea && (
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
      )}
    </div>
  );
}
