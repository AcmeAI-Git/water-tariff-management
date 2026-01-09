import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import type { ScoringParam, ZoneScoringRuleSet } from '../../../types';
import { calculatePercentages } from '../../utils/zoneScoringUtils';
import { ScoringParameterFormFields } from './ScoringParameterFormFields';

interface EditParameterModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingParam: ScoringParam | null;
  editingParamValues: Partial<ScoringParam> | null;
  setEditingParamValues: (values: Partial<ScoringParam> | null) => void;
  activeRuleSet: ZoneScoringRuleSet | null;
  calculatedParams: ScoringParam[];
  onSave: (updatedParams: ScoringParam[]) => Promise<void>;
}

export function EditParameterModal({
  isOpen,
  onClose,
  editingParam,
  editingParamValues,
  setEditingParamValues,
  activeRuleSet,
  calculatedParams,
  onSave,
}: EditParameterModalProps) {
  const handleSave = async () => {
    if (!editingParamValues || !activeRuleSet || !editingParam) return;
    
    // Update the scoring param in the rule set
    const updatedParams = activeRuleSet.scoringParams.map(p => 
      p.id === editingParam.id ? { ...p, ...editingParamValues } : p
    );
    
    // Recalculate with updated values
    const recalculated = calculatePercentages(updatedParams);
    
    await onSave(recalculated);
    onClose();
  };

  if (!editingParam || !editingParamValues) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Edit Zone Scoring Parameter
            <span className="text-base font-normal text-gray-600 ml-2">
              - {editingParam.area?.name || `Area ${editingParam.areaId}`}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <ScoringParameterFormFields
            values={editingParamValues}
            onChange={(field, value) => setEditingParamValues({ ...editingParamValues, [field]: value })}
            calculatedParams={calculatedParams}
            editingParamId={editingParam.id}
            showPercentages={true}
            showReadOnlyFields={true}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
