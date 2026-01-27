import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dropdown } from '../ui/Dropdown';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useApiQuery, useApiMutation } from '../../hooks/useApiQuery';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { toast } from 'sonner';
import { StatusBadge } from '../zoneScoring/StatusBadge';
import type { TariffCategorySettings, UpdateTariffCategorySettingsDto } from '../../types';

export function TariffCategorySettingsView() {
  const [selectedSettingsId, setSelectedSettingsId] = useState<string>('');
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
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch all settings for dropdown
  const { data: allSettings = [], isLoading: settingsLoading } = useApiQuery(
    ['tariff-category-settings'],
    () => api.tariffCategorySettings.getAll()
  );

  // Fetch selected setting details
  const { data: selectedSettings, isLoading: detailsLoading } = useApiQuery(
    ['tariff-category-settings', selectedSettingsId],
    () => api.tariffCategorySettings.getById(parseInt(selectedSettingsId)),
    { enabled: !!selectedSettingsId }
  );

  // Update mutation
  const updateMutation = useApiMutation(
    ({ id, data }: { id: number; data: UpdateTariffCategorySettingsDto }) =>
      api.tariffCategorySettings.update(id, data),
    {
      onSuccess: () => {
        toast.success('Settings updated successfully');
        setHasChanges(false);
      },
      onError: (error) => {
        toast.error(`Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      },
      invalidateQueries: [['tariff-category-settings'], ['tariff-category-settings', selectedSettingsId]],
    }
  );

  // Load form data when settings are selected
  useEffect(() => {
    if (selectedSettings) {
      setFormData({
        productionCost: selectedSettings.productionCost.toString(),
        baseRate: selectedSettings.baseRate.toString(),
        currentTariff: selectedSettings.currentTariff.toString(),
        currentTubewellTariff: selectedSettings.currentTubewellTariff.toString(),
        tubewellRatioStandard: selectedSettings.tubewellRatioStandard?.toString() || '',
        tubewellRatioCommercial: selectedSettings.tubewellRatioCommercial?.toString() || '',
        aboveBaseIncreasePercent: selectedSettings.aboveBaseIncreasePercent?.toString() || '',
        belowBaseDecreasePercent: selectedSettings.belowBaseDecreasePercent?.toString() || '',
        commercialIncreasePercent: selectedSettings.commercialIncreasePercent?.toString() || '',
        governmentIncreasePercent: selectedSettings.governmentIncreasePercent?.toString() || '',
      });
      setHasChanges(false);
    }
  }, [selectedSettings]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSettingsId) {
      toast.error('Please select a settings configuration');
      return;
    }

    // Validate required fields
    if (!formData.productionCost || !formData.baseRate || !formData.currentTariff || !formData.currentTubewellTariff) {
      toast.error('Please fill in all required fields');
      return;
    }

    const submitData: UpdateTariffCategorySettingsDto = {
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

    updateMutation.mutate({ id: parseInt(selectedSettingsId), data: submitData });
  };

  const handleCancel = () => {
    if (selectedSettings) {
      setFormData({
        productionCost: selectedSettings.productionCost.toString(),
        baseRate: selectedSettings.baseRate.toString(),
        currentTariff: selectedSettings.currentTariff.toString(),
        currentTubewellTariff: selectedSettings.currentTubewellTariff.toString(),
        tubewellRatioStandard: selectedSettings.tubewellRatioStandard?.toString() || '',
        tubewellRatioCommercial: selectedSettings.tubewellRatioCommercial?.toString() || '',
        aboveBaseIncreasePercent: selectedSettings.aboveBaseIncreasePercent?.toString() || '',
        belowBaseDecreasePercent: selectedSettings.belowBaseDecreasePercent?.toString() || '',
        commercialIncreasePercent: selectedSettings.commercialIncreasePercent?.toString() || '',
        governmentIncreasePercent: selectedSettings.governmentIncreasePercent?.toString() || '',
      });
      setHasChanges(false);
    }
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

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-selector" className="text-sm font-semibold text-gray-700">
              Select Settings Configuration
            </Label>
            <Dropdown
              options={allSettings.map(s => ({
                value: s.id.toString(),
                label: `Settings #${s.id} ${s.isActive ? '(Active)' : ''}`,
              }))}
              value={selectedSettingsId}
              onChange={(value) => {
                setSelectedSettingsId(value);
                setHasChanges(false);
              }}
              placeholder="Select a settings configuration"
              className="bg-gray-50 border-gray-300"
            />
          </div>

          {selectedSettings && (
            <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <StatusBadge status={selectedSettings.isActive ? 'active' : 'draft'} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Created:</span>
                <span className="text-sm text-gray-900">
                  {new Date(selectedSettings.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Form */}
      {selectedSettingsId && (
        <>
          {detailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
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
                    <p className="text-xs text-gray-500">
                      Percentage increase for Domestic categories above the base category (only applies to Domestic)
                    </p>
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
                    <p className="text-xs text-gray-500">
                      Percentage decrease for Domestic categories below the base category (only applies to Domestic)
                    </p>
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

              {/* Action Buttons */}
              {hasChanges && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                    className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isFormValid || updateMutation.isPending}
                    className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </form>
          )}
        </>
      )}

      {!selectedSettingsId && allSettings.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No settings configurations found. Create one from the Tariff Category Settings page.</p>
        </div>
      )}
    </div>
  );
}
