import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dropdown } from '../ui/Dropdown';
import { Checkbox } from '../ui/checkbox';
import { useState, useEffect } from 'react';
import type { TariffCategory, CreateTariffCategoryDto, UpdateTariffCategoryDto, TariffCategorySettings } from '../../types';

interface TariffCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTariffCategoryDto | UpdateTariffCategoryDto) => void;
  isSubmitting?: boolean;
  initialData?: TariffCategory;
  mode?: 'create' | 'edit';
  settings: TariffCategorySettings[];
}

export function TariffCategoryModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  initialData,
  mode = 'create',
  settings,
}: TariffCategoryModalProps) {
  const [formData, setFormData] = useState({
    slNo: '',
    category: 'Domestic' as 'Domestic' | 'Commercial' | 'Industrial' | 'Government' | 'Community',
    name: '',
    lowerRange: '',
    upperRange: '',
    rangeDescription: '',
    settingsId: '',
    isBaseCategory: false,
    isFixedRate: false,
    isActive: true,
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
        isBaseCategory: initialData.isBaseCategory,
        isFixedRate: initialData.isFixedRate,
        isActive: initialData.isActive,
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
        settingsId: settings.length > 0 ? settings[0].id.toString() : '',
        isBaseCategory: false,
        isFixedRate: false,
        isActive: true,
      });
    }
  }, [initialData, mode, isOpen, settings]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.slNo || !formData.name || !formData.settingsId) {
      return;
    }

    const submitData: CreateTariffCategoryDto | UpdateTariffCategoryDto = {
      slNo: parseInt(formData.slNo),
      category: formData.category,
      name: formData.name.trim(),
      settingsId: parseInt(formData.settingsId),
      isBaseCategory: formData.isBaseCategory,
      isFixedRate: formData.isFixedRate,
      isActive: formData.isActive,
      ...(formData.lowerRange && { lowerRange: parseFloat(formData.lowerRange) }),
      ...(formData.upperRange && { upperRange: parseFloat(formData.upperRange) }),
      ...(formData.rangeDescription && { rangeDescription: formData.rangeDescription.trim() }),
    };

    onSubmit(submitData);
  };

  const isFormValid = 
    formData.slNo.trim() !== '' &&
    formData.name.trim() !== '' &&
    formData.settingsId.trim() !== '' &&
    !isNaN(parseInt(formData.slNo)) &&
    !isNaN(parseInt(formData.settingsId));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Tariff Category' : 'Edit Tariff Category'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Required Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slNo" className="text-sm font-medium text-gray-700">
                  Serial Number *
                </Label>
                <Input
                  id="slNo"
                  type="number"
                  min="1"
                  value={formData.slNo}
                  onChange={(e) => handleInputChange('slNo', e.target.value)}
                  placeholder="Enter serial number"
                  className="bg-gray-50 border-gray-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                  Category *
                </Label>
                <Dropdown
                  options={[
                    { value: 'Domestic', label: 'Domestic' },
                    { value: 'Commercial', label: 'Commercial' },
                    { value: 'Industrial', label: 'Industrial' },
                    { value: 'Government', label: 'Government' },
                    { value: 'Community', label: 'Community' },
                  ]}
                  value={formData.category}
                  onChange={(value) => handleInputChange('category', value as typeof formData.category)}
                  placeholder="Select category"
                  className="bg-gray-50 border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter category name"
                className="bg-gray-50 border-gray-300"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settingsId" className="text-sm font-medium text-gray-700">
                Settings *
              </Label>
              <Dropdown
                options={settings.map(s => ({
                  value: s.id.toString(),
                  label: `Settings #${s.id} ${s.isActive ? '(Active)' : ''}`,
                }))}
                value={formData.settingsId}
                onChange={(value) => handleInputChange('settingsId', value)}
                placeholder="Select settings"
                className="bg-gray-50 border-gray-300"
              />
            </div>
          </div>

          {/* Range Fields */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Range Information (Optional)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lowerRange" className="text-sm font-medium text-gray-700">
                  Lower Range (sq ft)
                </Label>
                <Input
                  id="lowerRange"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.lowerRange}
                  onChange={(e) => handleInputChange('lowerRange', e.target.value)}
                  placeholder="Enter lower range"
                  className="bg-gray-50 border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="upperRange" className="text-sm font-medium text-gray-700">
                  Upper Range (sq ft)
                </Label>
                <Input
                  id="upperRange"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.upperRange}
                  onChange={(e) => handleInputChange('upperRange', e.target.value)}
                  placeholder="Enter upper range"
                  className="bg-gray-50 border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rangeDescription" className="text-sm font-medium text-gray-700">
                Range Description
              </Label>
              <Input
                id="rangeDescription"
                value={formData.rangeDescription}
                onChange={(e) => handleInputChange('rangeDescription', e.target.value)}
                placeholder="e.g., Tin shed"
                className="bg-gray-50 border-gray-300"
              />
            </div>
          </div>

          {/* Flags */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Category Flags</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isBaseCategory"
                  checked={formData.isBaseCategory}
                  onCheckedChange={(checked) => handleInputChange('isBaseCategory', checked === true)}
                />
                <Label htmlFor="isBaseCategory" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Base Category
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFixedRate"
                  checked={formData.isFixedRate}
                  onCheckedChange={(checked) => handleInputChange('isFixedRate', checked === true)}
                />
                <Label htmlFor="isFixedRate" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Fixed Rate
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked === true)}
                />
                <Label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Active
                </Label>
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
