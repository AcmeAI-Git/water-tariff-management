import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Area, CreateScoringParamDto } from '../../../types';
import { initializeScoringParam } from '../../utils/zoneScoringUtils';
import { ScoringParameterFormFields } from './ScoringParameterFormFields';

interface AddParameterModalProps {
  isOpen: boolean;
  onClose: () => void;
  newParam: CreateScoringParamDto;
  setNewParam: (param: CreateScoringParamDto) => void;
  areas: Area[];
  onAdd: () => Promise<void>;
  isPending: boolean;
}

export function AddParameterModal({
  isOpen,
  onClose,
  newParam,
  setNewParam,
  areas,
  onAdd,
  isPending,
}: AddParameterModalProps) {
  const handleClose = () => {
    setNewParam(initializeScoringParam());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Add Scoring Parameter
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Area <span className="text-red-500">*</span>
            </Label>
            <Select
              value={newParam.areaId?.toString() || '0'}
              onValueChange={(value) => setNewParam({ ...newParam, areaId: parseInt(value) })}
            >
              <SelectTrigger className="bg-white border-gray-300 rounded-lg h-11">
                <SelectValue placeholder="Select an area" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id.toString()}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScoringParameterFormFields
            values={newParam}
            onChange={(field, value) => setNewParam({ ...newParam, [field]: value })}
            showPercentages={false}
            showReadOnlyFields={false}
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
