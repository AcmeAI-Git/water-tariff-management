import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import type { ScoringParam, ZoneScoringRuleSet } from '../../types';
import { calculatePercentages } from '../../utils/zoneScoringUtils';
import { ScoringParameterFormFields } from './ScoringParameterFormFields';
import { useLanguage } from '../../context/LanguageContext';
import { getStaticTranslation } from '../../constants/staticTranslations';

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
  const { language } = useLanguage();
  const t = (key: string) => getStaticTranslation(language, key);
  const handleSave = async () => {
    if (!editingParamValues || !activeRuleSet || !editingParam) return;
    
    // Update the scoring param in the rule set
    const updatedParams = activeRuleSet.scoringParams.map((p: ScoringParam) => 
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
      <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 notranslate" aria-describedby={undefined} translate="no">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {t('modals.editZoneScoringParameter')}
            <span className="text-base font-normal text-gray-600 ml-2">
              - {editingParam.area?.name || `${t('modals.area')} ${editingParam.areaId}`}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          <ScoringParameterFormFields
            values={editingParamValues}
            onChange={(field, value) => setEditingParamValues({ ...editingParamValues, [field]: value })}
            calculatedParams={calculatedParams}
            editingParamId={editingParam.id}
            showPercentages={true}
            showReadOnlyFields={true}
            ruleSetId={activeRuleSet?.id}
          />
        </div>

        <DialogFooter className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6"
          >
            {t('modals.saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
