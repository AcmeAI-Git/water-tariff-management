import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dropdown } from '../ui/Dropdown';
import { useState, useEffect } from 'react';
import type { TariffCategory, CreateTariffCategoryDto, UpdateTariffCategoryDto, TariffCategorySettings, CustomerCategory } from '../../types';
import { CUSTOMER_CATEGORIES } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getStaticTranslation } from '../../constants/staticTranslations';

interface TariffCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTariffCategoryDto | UpdateTariffCategoryDto) => void;
  isSubmitting?: boolean;
  initialData?: TariffCategory;
  mode?: 'create' | 'edit';
  settings: TariffCategorySettings[];
  defaultSettingsId?: number;
}

export function TariffCategoryModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  initialData,
  mode = 'create',
  settings,
  defaultSettingsId,
}: TariffCategoryModalProps) {
  const [formData, setFormData] = useState({
    slNo: '',
    category: 'Domestic' as CustomerCategory,
    name: '',
    lowerRange: '',
    upperRange: '',
    rangeDescription: '',
    settingsId: '',
  });


  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        slNo: initialData.slNo.toString(),
        category: initialData.category,
        name: initialData.name,
        lowerRange: initialData.lowerRange?.toString() || '',
        upperRange: initialData.upperRange?.toString() || '',
        rangeDescription: initialData.rangeDescription || '',
        settingsId: initialData.settingsId.toString(),
      });
    } else {
      // Reset form for create mode
      setFormData({
        slNo: '',
        category: 'Domestic',
        name: '',
        lowerRange: '',
        upperRange: '',
        rangeDescription: '',
        settingsId: defaultSettingsId ? defaultSettingsId.toString() : (settings.length > 0 ? settings[0].id.toString() : ''),
      });
    }
  }, [initialData, mode, isOpen, settings, defaultSettingsId]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Use defaultSettingsId if provided (auto mode from ruleset context), otherwise use formData
    const finalSettingsId = defaultSettingsId || parseInt(formData.settingsId);

    // Validate required fields
    if (!formData.slNo || !formData.name || !finalSettingsId) {
      return;
    }

    const submitData: CreateTariffCategoryDto | UpdateTariffCategoryDto = {
      slNo: parseInt(formData.slNo),
      category: formData.category,
      name: formData.name.trim(),
      settingsId: finalSettingsId,
      ...(formData.lowerRange && { lowerRange: parseFloat(formData.lowerRange) }),
      ...(formData.upperRange && { upperRange: parseFloat(formData.upperRange) }),
      ...(formData.rangeDescription && { rangeDescription: formData.rangeDescription.trim() }),
    };

    onSubmit(submitData);
  };

  const { language } = useLanguage();
  const t = (key: string) => getStaticTranslation(language, key);
  const isFormValid = 
    formData.slNo.trim() !== '' &&
    formData.name.trim() !== '' &&
    (defaultSettingsId || formData.settingsId.trim() !== '') &&
    !isNaN(parseInt(formData.slNo)) &&
    (defaultSettingsId || !isNaN(parseInt(formData.settingsId)));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white notranslate" aria-describedby={undefined} translate="no">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('modals.createTariffCategory') : t('modals.editTariffCategory')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Required Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 items-start">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="slNo" className="text-sm font-medium text-gray-700 min-h-[2.5rem] flex items-start">
                  {t('modals.serialNumber')}
                </Label>
                <Input
                  id="slNo"
                  type="number"
                  min="1"
                  value={formData.slNo}
                  onChange={(e) => handleInputChange('slNo', e.target.value)}
                  placeholder={t('modals.enterSerialNumber')}
                  className="bg-gray-50 border-gray-300"
                  required
                />
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700 min-h-[2.5rem] flex items-start">
                  {t('modals.categoryLabel')}
                </Label>
                <Dropdown
                  options={CUSTOMER_CATEGORIES.map(c => ({ value: c, label: c }))}
                  value={formData.category}
                  onChange={(value) => handleInputChange('category', value as CustomerCategory)}
                  placeholder={t('pages.selectCategory')}
                  className="bg-gray-50 border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                {t('modals.nameLabel')}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('modals.enterCategoryName')}
                className="bg-gray-50 border-gray-300"
                required
              />
            </div>

            {/* Hide settings dropdown when defaultSettingsId is provided (auto mode from ruleset context) */}
            {!defaultSettingsId && (
              <div className="space-y-2">
                <Label htmlFor="settingsId" className="text-sm font-medium text-gray-700">
                  {t('modals.settingsLabel')}
                </Label>
                <Dropdown
                  options={settings.map(s => ({
                    value: s.id.toString(),
                    label: `Settings #${s.id} ${s.isActive ? '(Active)' : ''}`,
                  }))}
                  value={formData.settingsId}
                  onChange={(value) => handleInputChange('settingsId', value)}
                  placeholder={t('modals.selectSettings')}
                  className="bg-gray-50 border-gray-300"
                />
              </div>
            )}
          </div>

          {/* Range Fields */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">{t('modals.rangeInfoOptional')}</h3>
            
            <div className="grid grid-cols-2 gap-4 items-start">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="lowerRange" className="text-sm font-medium text-gray-700 min-h-[2.5rem] flex items-start">
                  {t('modals.lowerRangeSqFt')}
                </Label>
                <Input
                  id="lowerRange"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.lowerRange}
                  onChange={(e) => handleInputChange('lowerRange', e.target.value)}
                  placeholder={t('modals.lowerRangePlaceholder')}
                  className="bg-gray-50 border-gray-300"
                  disabled={!!formData.rangeDescription}
                  readOnly={!!formData.rangeDescription}
                />
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="upperRange" className="text-sm font-medium text-gray-700 min-h-[2.5rem] flex items-start">
                  {t('modals.upperRangeSqFt')}
                </Label>
                <Input
                  id="upperRange"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.upperRange}
                  onChange={(e) => handleInputChange('upperRange', e.target.value)}
                  placeholder={t('modals.upperRangePlaceholder')}
                  className="bg-gray-50 border-gray-300"
                  disabled={!!formData.rangeDescription}
                  readOnly={!!formData.rangeDescription}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rangeDescription" className="text-sm font-medium text-gray-700">
                {t('modals.rangeDescription')}
              </Label>
              <Input
                id="rangeDescription"
                value={formData.rangeDescription}
                onChange={(e) => handleInputChange('rangeDescription', e.target.value)}
                placeholder={t('modals.rangeDescriptionPlaceholder')}
                className="bg-gray-50 border-gray-300"
              />
            </div>

          </div>


          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="bg-primary hover:bg-primary-600 text-white"
            >
              {isSubmitting ? (mode === 'create' ? t('modals.creating') : t('modals.saving')) : (mode === 'create' ? t('modals.create') : t('common.save'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
