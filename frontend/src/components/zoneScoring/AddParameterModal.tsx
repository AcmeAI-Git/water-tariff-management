import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useState, useMemo } from 'react';
import type { Area, CreateScoringParamDto, ScoringParam, Zone, Wasa } from '../../types';
import { initializeScoringParam } from '../../utils/zoneScoringUtils';
import { ScoringParameterFormFields } from './ScoringParameterFormFields';

interface AddParameterModalProps {
  isOpen: boolean;
  onClose: () => void;
  newParam: CreateScoringParamDto;
  setNewParam: (param: CreateScoringParamDto) => void;
  areas: Area[];
  zones?: Zone[];
  wasas?: Wasa[];
  onAdd: () => Promise<void>;
  isPending: boolean;
  calculatedParams?: ScoringParam[];
  ruleSetId?: number;
}

export function AddParameterModal({
  isOpen,
  onClose,
  newParam,
  setNewParam,
  areas,
  zones = [],
  wasas = [],
  onAdd,
  isPending,
  calculatedParams = [],
  ruleSetId,
}: AddParameterModalProps) {
  const [selectedCityCorpId, setSelectedCityCorpId] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  // Filter areas based on selected city corporation and zone
  const filteredAreas = useMemo(() => {
    let result = areas;

    // Filter by city corporation
    if (selectedCityCorpId) {
      result = result.filter(area => {
        // Use nested zone object from area if available
        const zone = area.zone || zones.find(z => z.id === area.zoneId);
        return zone?.wasaId === parseInt(selectedCityCorpId);
      });
    }

    // Filter by zone
    if (selectedZoneId) {
      result = result.filter(area => {
        // Use nested zone object from area if available
        const zone = area.zone || zones.find(z => z.id === area.zoneId);
        return zone?.id === parseInt(selectedZoneId);
      });
    }

    return result;
  }, [areas, selectedCityCorpId, selectedZoneId, zones]);

  // Get zones for selected city corporation
  const zonesForCityCorp = useMemo(() => {
    if (!selectedCityCorpId) return [];
    return zones.filter(z => z.wasaId === parseInt(selectedCityCorpId));
  }, [zones, selectedCityCorpId]);

  const handleClose = () => {
    setNewParam(initializeScoringParam());
    setSelectedCityCorpId('');
    setSelectedZoneId('');
    onClose();
  };

  const handleCityCorpChange = (value: string) => {
    // Handle placeholder value
    const cityCorpId = value === '__all_city_corps__' ? '' : value;
    setSelectedCityCorpId(cityCorpId);
    setSelectedZoneId(''); // Reset zone when city corp changes
    setNewParam({ ...newParam, areaId: 0 }); // Reset area selection
  };

  const handleZoneChange = (value: string) => {
    // Handle placeholder value
    const zoneId = value === '__all_zones__' ? '' : value;
    setSelectedZoneId(zoneId);
    setNewParam({ ...newParam, areaId: 0 }); // Reset area selection
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Add Scoring Parameter
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {/* City Corporation Filter */}
          {wasas.length > 0 && (
            <div className="space-y-2 w-full">
              <Label className="text-sm font-medium text-gray-700">
                City Corporation
              </Label>
              <Select value={selectedCityCorpId || '__all_city_corps__'} onValueChange={handleCityCorpChange}>
                <SelectTrigger className="bg-white border-gray-300 rounded-lg h-11 w-full">
                  <SelectValue placeholder="Filter by city corporation (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[300px] overflow-y-auto">
                  <SelectItem value="__all_city_corps__">All City Corporations</SelectItem>
                  {wasas.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id.toString()} className="hover:bg-gray-100 cursor-pointer">
                      {cc.name} ({cc.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Zone Filter */}
          {zones.length > 0 && selectedCityCorpId && (
            <div className="space-y-2 w-full">
              <Label className="text-sm font-medium text-gray-700">
                Zone
              </Label>
              <Select value={selectedZoneId || '__all_zones__'} onValueChange={handleZoneChange} disabled={!selectedCityCorpId}>
                <SelectTrigger className="bg-white border-gray-300 rounded-lg h-11 w-full disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder={selectedCityCorpId ? "Filter by zone (optional)" : "Select city corporation first"} />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[300px] overflow-y-auto">
                  <SelectItem value="__all_zones__">All Zones</SelectItem>
                  {zonesForCityCorp.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id.toString()} className="hover:bg-gray-100 cursor-pointer">
                      {zone.name} - {zone.cityName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Area Selection */}
          <div className="space-y-2 w-full">
            <Label className="text-sm font-medium text-gray-700">
              Area <span className="text-red-500">*</span>
            </Label>
            <Select
              value={newParam.areaId?.toString() || '0'}
              onValueChange={(value) => setNewParam({ ...newParam, areaId: parseInt(value) })}
            >
              <SelectTrigger className="bg-white border-gray-300 rounded-lg h-11 w-full">
                <SelectValue placeholder="Select an area" />
              </SelectTrigger>
              <SelectContent className="bg-white max-h-[300px] overflow-y-auto">
                {filteredAreas.length === 0 ? (
                  <SelectItem value="0" disabled>No areas available{selectedCityCorpId || selectedZoneId ? ' for selected filters' : ''}</SelectItem>
                ) : (
                  filteredAreas.map((area) => {
                    // Use nested zone object if available
                    const zone = area.zone || zones.find(z => z.id === area.zoneId);
                    const cityCorp = zone?.wasaId 
                      ? wasas.find(cc => cc.id === zone.wasaId)
                      : null;
                    const displayText = zone && cityCorp 
                      ? `${area.name} (${zone.name}, ${cityCorp.name})`
                      : area.name;
                    
                    return (
                      <SelectItem key={area.id} value={area.id.toString()} className="hover:bg-gray-100 cursor-pointer">
                        {displayText}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          <ScoringParameterFormFields
            values={newParam}
            onChange={(field, value) => setNewParam({ ...newParam, [field]: value })}
            calculatedParams={calculatedParams}
            showPercentages={true}
            showReadOnlyFields={true}
            ruleSetId={ruleSetId}
          />
        </div>
        <DialogFooter>
          <Button
            onClick={handleClose}
            variant="outline"
            className="border-gray-300 rounded-lg h-10 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={onAdd}
            disabled={isPending}
            className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
          >
            {isPending ? 'Adding...' : 'Add Parameter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
