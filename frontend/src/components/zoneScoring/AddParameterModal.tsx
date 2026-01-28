import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useState, useMemo } from 'react';
import type { Area, CreateScoringParamDto, ScoringParam, Zone, Wasa } from '../../types';
import { initializeScoringParam } from '../../utils/zoneScoringUtils';
import { ScoringParameterFormFields } from './ScoringParameterFormFields';
import { HierarchicalLocationSelector } from '../common/HierarchicalLocationSelector';

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
  const [selectedWasaId, setSelectedWasaId] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');

  // Note: zonesForWasa is no longer needed since HierarchicalLocationSelector handles zone filtering internally

  const handleClose = () => {
    setNewParam(initializeScoringParam());
    setSelectedWasaId('');
    setSelectedZoneId('');
    setSelectedAreaId('');
    onClose();
  };

  const handleWasaChange = (value: string) => {
    setSelectedWasaId(value);
    setSelectedZoneId(''); // Reset zone when wasa changes
    setSelectedAreaId(''); // Reset area when wasa changes
    setNewParam({ ...newParam, areaId: 0 }); // Reset area selection
  };

  const handleZoneChange = (value: string) => {
    setSelectedZoneId(value);
    setSelectedAreaId(''); // Reset area when zone changes
    setNewParam({ ...newParam, areaId: 0 }); // Reset area selection
  };

  const handleAreaChange = (value: string) => {
    setSelectedAreaId(value);
    setNewParam({ ...newParam, areaId: value ? parseInt(value) : 0 });
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
          {/* WASA, Zone, and Area Selection */}
          <HierarchicalLocationSelector
            wasas={wasas}
            zones={zones}
            areas={areas}
            wasaId={selectedWasaId}
            zoneId={selectedZoneId}
            areaId={selectedAreaId}
            onWasaChange={handleWasaChange}
            onZoneChange={handleZoneChange}
            onAreaChange={handleAreaChange}
            required={true}
            showArea={true}
            wasaPlaceholder="Filter by WASA"
            zonePlaceholder="Filter by zone"
            areaPlaceholder="Select an area"
            areaLabel="Area"
          />

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
