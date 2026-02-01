import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useState, useEffect } from 'react';
import type { 
  TariffCategorySettings, 
  CreateTariffCategorySettingsDto, 
  UpdateTariffCategorySettingsDto 
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getStaticTranslation } from '../../constants/staticTranslations';

interface TariffCategorySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTariffCategorySettingsDto | UpdateTariffCategorySettingsDto) => void;
  isSubmitting?: boolean;
  initialData?: TariffCategorySettings;
  mode?: 'create' | 'edit';
}

export function TariffCategorySettingsModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  initialData,
  mode = 'create',
}: TariffCategorySettingsModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    productionCost: '',
    baseRate: '',
    currentTariff: '',
    currentTubewellTariff: '',
    tubewellRatioStandard: '',
    tubewellRatioCommercial: '',
    aboveBaseIncreasePercent: '',
    belowBaseDecreasePercent: '',
    commercialIncreasePercent: '',
    governmentIncreasePercent: '',
  });

  useEffect(() => {
    if (initialData && mode === 'edit') {
      // Convert decimals to percentages for display
      // Handle both decimal (<= 1) and percentage (> 1) formats from backend
      const convertToPercentage = (value: number | undefined, defaultVal: number): string => {
        if (value === undefined || value === null) return defaultVal.toString();
        // If value > 1, assume it's already in percentage format
        if (value > 1) return value.toString();
        // Otherwise, convert from decimal to percentage
        return (value * 100).toString();
      };

      setFormData({
        title: initialData.title ?? '',
        description: initialData.description ?? '',
        productionCost: initialData.productionCost.toString(),
        baseRate: initialData.baseRate.toString(),
        currentTariff: initialData.currentTariff.toString(),
        currentTubewellTariff: initialData.currentTubewellTariff.toString(),
        tubewellRatioStandard: convertToPercentage(initialData.tubewellRatioStandard, 40),
        tubewellRatioCommercial: convertToPercentage(initialData.tubewellRatioCommercial, 60),
        aboveBaseIncreasePercent: convertToPercentage(initialData.aboveBaseIncreasePercent, 10),
        belowBaseDecreasePercent: convertToPercentage(initialData.belowBaseDecreasePercent, 5),
        commercialIncreasePercent: convertToPercentage(initialData.commercialIncreasePercent, 100),
        governmentIncreasePercent: convertToPercentage(initialData.governmentIncreasePercent, 0),
      });
    } else {
      // Reset form for create mode with default values
      setFormData({
        title: '',
        description: '',
        productionCost: '',
        baseRate: '',
        currentTariff: '',
        currentTubewellTariff: '',
        tubewellRatioStandard: '40',
        tubewellRatioCommercial: '60',
        aboveBaseIncreasePercent: '10',
        belowBaseDecreasePercent: '5',
        commercialIncreasePercent: '100',
        governmentIncreasePercent: '0',
      });
    }
  }, [initialData, mode, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (mode === 'create' && !formData.title.trim()) return;
    if (!formData.productionCost || !formData.baseRate || !formData.currentTariff || !formData.currentTubewellTariff) {
      return;
    }

    // Convert percentages to decimals for backend (divide by 100)
    const base = {
      productionCost: parseFloat(formData.productionCost),
      baseRate: parseFloat(formData.baseRate),
      currentTariff: parseFloat(formData.currentTariff),
      currentTubewellTariff: parseFloat(formData.currentTubewellTariff),
      tubewellRatioStandard: parseFloat(formData.tubewellRatioStandard) / 100,
      tubewellRatioCommercial: parseFloat(formData.tubewellRatioCommercial) / 100,
      aboveBaseIncreasePercent: parseFloat(formData.aboveBaseIncreasePercent) / 100,
      belowBaseDecreasePercent: parseFloat(formData.belowBaseDecreasePercent) / 100,
      commercialIncreasePercent: parseFloat(formData.commercialIncreasePercent) / 100,
      governmentIncreasePercent: parseFloat(formData.governmentIncreasePercent) / 100,
    };
    const submitData: CreateTariffCategorySettingsDto | UpdateTariffCategorySettingsDto = {
      ...(formData.title.trim() ? { title: formData.title.trim() } : {}),
      ...(formData.description.trim() ? { description: formData.description.trim() } : {}),
      ...base,
    };
    if (mode === 'create') (submitData as CreateTariffCategorySettingsDto).title = formData.title.trim();

    onSubmit(submitData);
  };

  const isFormValid = 
    (mode !== 'create' || formData.title.trim() !== '') &&
    formData.productionCost.trim() !== '' &&
    formData.baseRate.trim() !== '' &&
    formData.currentTariff.trim() !== '' &&
    formData.currentTubewellTariff.trim() !== '' &&
    formData.tubewellRatioStandard.trim() !== '' &&
    formData.tubewellRatioCommercial.trim() !== '' &&
    formData.aboveBaseIncreasePercent.trim() !== '' &&
    formData.belowBaseDecreasePercent.trim() !== '' &&
    formData.commercialIncreasePercent.trim() !== '' &&
    formData.governmentIncreasePercent.trim() !== '' &&
    !isNaN(parseFloat(formData.productionCost)) &&
    !isNaN(parseFloat(formData.baseRate)) &&
    !isNaN(parseFloat(formData.currentTariff)) &&
    !isNaN(parseFloat(formData.currentTubewellTariff)) &&
    !isNaN(parseFloat(formData.tubewellRatioStandard)) &&
    !isNaN(parseFloat(formData.tubewellRatioCommercial)) &&
    !isNaN(parseFloat(formData.aboveBaseIncreasePercent)) &&
    !isNaN(parseFloat(formData.belowBaseDecreasePercent)) &&
    !isNaN(parseFloat(formData.commercialIncreasePercent)) &&
    !isNaN(parseFloat(formData.governmentIncreasePercent));

  const { language } = useLanguage();
  const t = (key: string) => getStaticTranslation(language, key);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white notranslate" aria-describedby={undefined} translate="no">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('modals.createSettingsRuleset') : t('modals.editSettingsRuleset')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 items-start">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700 min-h-[2.5rem] flex items-start">
                  {t('modals.titleLabel')}
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder={t('modals.titlePlaceholder')}
                  className="bg-gray-50 border-gray-300"
                  required={mode === 'create'}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 min-h-[2.5rem] flex items-start">
                  {t('modals.descriptionLabel')}
                </Label>
                <Input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder={t('modals.optionalDescription')}
                  className="bg-gray-50 border-gray-300"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 items-start">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="productionCost" className="text-sm font-medium text-gray-700 min-h-[2.5rem] flex items-start">
                  {t('modals.productionCost')}
                </Label>
                <Input
                  id="productionCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.productionCost}
                  onChange={(e) => handleInputChange('productionCost', e.target.value)}
                  placeholder={t('modals.enterProductionCost')}
                  className="bg-gray-50 border-gray-300"
                  required
                />
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="baseRate" className="text-sm font-medium text-gray-700 min-h-[2.5rem] flex items-start">
                  {t('modals.baseRate')}
                </Label>
                <Input
                  id="baseRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.baseRate}
                  onChange={(e) => handleInputChange('baseRate', e.target.value)}
                  placeholder={t('modals.enterBaseRate')}
                  className="bg-gray-50 border-gray-300"
                  required
                />
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="currentTariff" className="text-sm font-medium text-gray-700 min-h-[2.5rem] flex items-start">
                  {t('modals.currentTariff')}
                </Label>
                <Input
                  id="currentTariff"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.currentTariff}
                  onChange={(e) => handleInputChange('currentTariff', e.target.value)}
                  placeholder={t('modals.enterCurrentTariff')}
                  className="bg-gray-50 border-gray-300"
                  required
                />
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="currentTubewellTariff" className="text-sm font-medium text-gray-700 min-h-[2.5rem] flex items-start">
                  {t('modals.currentTubewellTariff')}
                </Label>
                <Input
                  id="currentTubewellTariff"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.currentTubewellTariff}
                  onChange={(e) => handleInputChange('currentTubewellTariff', e.target.value)}
                  placeholder={t('modals.enterTubewellTariff')}
                  className="bg-gray-50 border-gray-300"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 items-start">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="tubewellRatioStandard" className="text-sm font-medium text-gray-700 min-h-[2.5rem] flex items-start">
                  {t('modals.tubewellRatioStandard')}
                </Label>
                <Input
                  id="tubewellRatioStandard"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.tubewellRatioStandard}
                  onChange={(e) => handleInputChange('tubewellRatioStandard', e.target.value)}
                  placeholder={t('modals.eg40')}
                  className="bg-gray-50 border-gray-300"
                  required
                />
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="tubewellRatioCommercial" className="text-sm font-medium text-gray-700 min-h-[2.5rem] flex items-start">
                  {t('modals.tubewellRatioCommercial')}
                </Label>
                <Input
                  id="tubewellRatioCommercial"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.tubewellRatioCommercial}
                  onChange={(e) => handleInputChange('tubewellRatioCommercial', e.target.value)}
                  placeholder={t('modals.eg60')}
                  className="bg-gray-50 border-gray-300"
                  required
                />
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="aboveBaseIncreasePercent" className="text-sm font-medium text-gray-700 min-h-[2.5rem] flex items-start">
                  {t('modals.aboveBaseIncrease')}
                </Label>
                <Input
                  id="aboveBaseIncreasePercent"
                  type="number"
                  step="0.01"
                  value={formData.aboveBaseIncreasePercent}
                  onChange={(e) => handleInputChange('aboveBaseIncreasePercent', e.target.value)}
                  placeholder={t('modals.enterIncreasePercentage')}
                  className="bg-gray-50 border-gray-300"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('modals.percentageAboveBase')}
                </p>
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="belowBaseDecreasePercent" className="text-sm font-medium text-gray-700 min-h-[2.5rem] flex items-start">
                  {t('modals.belowBaseDecrease')}
                </Label>
                <Input
                  id="belowBaseDecreasePercent"
                  type="number"
                  step="0.01"
                  value={formData.belowBaseDecreasePercent}
                  onChange={(e) => handleInputChange('belowBaseDecreasePercent', e.target.value)}
                  placeholder={t('modals.enterDecreasePercentage')}
                  className="bg-gray-50 border-gray-300"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('modals.percentageBelowBase')}
                </p>
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="commercialIncreasePercent" className="text-sm font-medium text-gray-700 min-h-[2.5rem] flex items-start">
                  {t('modals.commercialIncrease')}
                </Label>
                <Input
                  id="commercialIncreasePercent"
                  type="number"
                  step="0.01"
                  value={formData.commercialIncreasePercent}
                  onChange={(e) => handleInputChange('commercialIncreasePercent', e.target.value)}
                  placeholder={t('modals.eg100')}
                  className="bg-gray-50 border-gray-300"
                  required
                />
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="governmentIncreasePercent" className="text-sm font-medium text-gray-700 min-h-[2.5rem] flex items-start">
                  {t('modals.governmentIncrease')}
                </Label>
                <Input
                  id="governmentIncreasePercent"
                  type="number"
                  step="0.01"
                  value={formData.governmentIncreasePercent}
                  onChange={(e) => handleInputChange('governmentIncreasePercent', e.target.value)}
                  placeholder={t('modals.eg0')}
                  className="bg-gray-50 border-gray-300"
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
            >
              {isSubmitting ? (mode === 'create' ? t('modals.creating') : t('modals.saving')) : (mode === 'create' ? t('modals.create') : t('common.save'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
