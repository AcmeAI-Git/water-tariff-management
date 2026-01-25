import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useState, useEffect } from 'react';
import type { TariffCategorySettings, CreateTariffCategorySettingsDto, UpdateTariffCategorySettingsDto } from '../../types';

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
      setFormData({
        productionCost: initialData.productionCost.toString(),
        baseRate: initialData.baseRate.toString(),
        currentTariff: initialData.currentTariff.toString(),
        currentTubewellTariff: initialData.currentTubewellTariff.toString(),
        tubewellRatioStandard: initialData.tubewellRatioStandard?.toString() || '',
        tubewellRatioCommercial: initialData.tubewellRatioCommercial?.toString() || '',
        aboveBaseIncreasePercent: initialData.aboveBaseIncreasePercent?.toString() || '',
        belowBaseDecreasePercent: initialData.belowBaseDecreasePercent?.toString() || '',
        commercialIncreasePercent: initialData.commercialIncreasePercent?.toString() || '',
        governmentIncreasePercent: initialData.governmentIncreasePercent?.toString() || '',
      });
    } else {
      // Reset form for create mode
      setFormData({
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
    }
  }, [initialData, mode, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.productionCost || !formData.baseRate || !formData.currentTariff || !formData.currentTubewellTariff) {
      return;
    }

    const submitData: CreateTariffCategorySettingsDto | UpdateTariffCategorySettingsDto = {
      productionCost: parseFloat(formData.productionCost),
      baseRate: parseFloat(formData.baseRate),
      currentTariff: parseFloat(formData.currentTariff),
      currentTubewellTariff: parseFloat(formData.currentTubewellTariff),
      ...(formData.tubewellRatioStandard && { tubewellRatioStandard: parseFloat(formData.tubewellRatioStandard) }),
      ...(formData.tubewellRatioCommercial && { tubewellRatioCommercial: parseFloat(formData.tubewellRatioCommercial) }),
      ...(formData.aboveBaseIncreasePercent && { aboveBaseIncreasePercent: parseFloat(formData.aboveBaseIncreasePercent) }),
      ...(formData.belowBaseDecreasePercent && { belowBaseDecreasePercent: parseFloat(formData.belowBaseDecreasePercent) }),
      ...(formData.commercialIncreasePercent && { commercialIncreasePercent: parseFloat(formData.commercialIncreasePercent) }),
      ...(formData.governmentIncreasePercent && { governmentIncreasePercent: parseFloat(formData.governmentIncreasePercent) }),
    };

    onSubmit(submitData);
  };

  const isFormValid = 
    formData.productionCost.trim() !== '' &&
    formData.baseRate.trim() !== '' &&
    formData.currentTariff.trim() !== '' &&
    formData.currentTubewellTariff.trim() !== '' &&
    !isNaN(parseFloat(formData.productionCost)) &&
    !isNaN(parseFloat(formData.baseRate)) &&
    !isNaN(parseFloat(formData.currentTariff)) &&
    !isNaN(parseFloat(formData.currentTubewellTariff));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Tariff Category Settings' : 'Edit Tariff Category Settings'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Required Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Required Fields</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productionCost" className="text-sm font-medium text-gray-700">
                  Production Cost (BDT/1000L) *
                </Label>
                <Input
                  id="productionCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.productionCost}
                  onChange={(e) => handleInputChange('productionCost', e.target.value)}
                  placeholder="Enter production cost"
                  className="bg-gray-50 border-gray-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseRate" className="text-sm font-medium text-gray-700">
                  Base Rate (BDT/1000L) *
                </Label>
                <Input
                  id="baseRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.baseRate}
                  onChange={(e) => handleInputChange('baseRate', e.target.value)}
                  placeholder="Enter base rate"
                  className="bg-gray-50 border-gray-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentTariff" className="text-sm font-medium text-gray-700">
                  Current Tariff (BDT/1000L) *
                </Label>
                <Input
                  id="currentTariff"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.currentTariff}
                  onChange={(e) => handleInputChange('currentTariff', e.target.value)}
                  placeholder="Enter current tariff"
                  className="bg-gray-50 border-gray-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentTubewellTariff" className="text-sm font-medium text-gray-700">
                  Current Tubewell Tariff (BDT/1000L) *
                </Label>
                <Input
                  id="currentTubewellTariff"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.currentTubewellTariff}
                  onChange={(e) => handleInputChange('currentTubewellTariff', e.target.value)}
                  placeholder="Enter tubewell tariff"
                  className="bg-gray-50 border-gray-300"
                  required
                />
              </div>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Optional Fields</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tubewellRatioStandard" className="text-sm font-medium text-gray-700">
                  Tubewell Ratio Standard (%)
                </Label>
                <Input
                  id="tubewellRatioStandard"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.tubewellRatioStandard}
                  onChange={(e) => handleInputChange('tubewellRatioStandard', e.target.value)}
                  placeholder="e.g., 40"
                  className="bg-gray-50 border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tubewellRatioCommercial" className="text-sm font-medium text-gray-700">
                  Tubewell Ratio Commercial (%)
                </Label>
                <Input
                  id="tubewellRatioCommercial"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.tubewellRatioCommercial}
                  onChange={(e) => handleInputChange('tubewellRatioCommercial', e.target.value)}
                  placeholder="e.g., 60"
                  className="bg-gray-50 border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aboveBaseIncreasePercent" className="text-sm font-medium text-gray-700">
                  Above Base Increase (%)
                </Label>
                <Input
                  id="aboveBaseIncreasePercent"
                  type="number"
                  step="0.01"
                  value={formData.aboveBaseIncreasePercent}
                  onChange={(e) => handleInputChange('aboveBaseIncreasePercent', e.target.value)}
                  placeholder="Enter increase percentage"
                  className="bg-gray-50 border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="belowBaseDecreasePercent" className="text-sm font-medium text-gray-700">
                  Below Base Decrease (%)
                </Label>
                <Input
                  id="belowBaseDecreasePercent"
                  type="number"
                  step="0.01"
                  value={formData.belowBaseDecreasePercent}
                  onChange={(e) => handleInputChange('belowBaseDecreasePercent', e.target.value)}
                  placeholder="Enter decrease percentage"
                  className="bg-gray-50 border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commercialIncreasePercent" className="text-sm font-medium text-gray-700">
                  Commercial Increase (%)
                </Label>
                <Input
                  id="commercialIncreasePercent"
                  type="number"
                  step="0.01"
                  value={formData.commercialIncreasePercent}
                  onChange={(e) => handleInputChange('commercialIncreasePercent', e.target.value)}
                  placeholder="e.g., 100"
                  className="bg-gray-50 border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="governmentIncreasePercent" className="text-sm font-medium text-gray-700">
                  Government Increase (%)
                </Label>
                <Input
                  id="governmentIncreasePercent"
                  type="number"
                  step="0.01"
                  value={formData.governmentIncreasePercent}
                  onChange={(e) => handleInputChange('governmentIncreasePercent', e.target.value)}
                  placeholder="e.g., 0"
                  className="bg-gray-50 border-gray-300"
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
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="bg-primary hover:bg-primary-600 text-white"
            >
              {isSubmitting ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create' : 'Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
