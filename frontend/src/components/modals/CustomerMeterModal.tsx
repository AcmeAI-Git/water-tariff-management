import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dropdown } from '../ui/Dropdown';
import { HierarchicalLocationSelector } from '../common/HierarchicalLocationSelector';
import type { CityCorporation, Zone, Area } from '../../types';

export interface CustomerMeterFormData {
  name: string;
  address: string;
  inspCode: string;
  accountType: string;
  customerCategory: string;
  waterStatus: string;
  sewerStatus: string;
  cityCorporationId: string;
  zoneId: string;
  areaId: string;
  meterNo: string;
  meterStatus: string;
  sizeOfDia: string;
  meterInstallationDate: string;
}

interface CustomerMeterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CustomerMeterFormData;
  onFormDataChange: (field: keyof CustomerMeterFormData, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  cityCorporations: CityCorporation[];
  zones: Zone[];
  areas: Area[];
  mode?: 'add' | 'edit';
}

export function CustomerMeterModal({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  cityCorporations,
  zones,
  areas,
  mode = 'add',
}: CustomerMeterModalProps) {
  const [activeTab, setActiveTab] = useState<'customer' | 'meter'>('customer');

  const handleInputChange = (field: keyof CustomerMeterFormData, value: string) => {
    onFormDataChange(field, value);
    
    // Auto-switch to meter tab when Metered is selected
    if (field === 'waterStatus' && value === 'Metered') {
      setActiveTab('meter');
    } else if (field === 'waterStatus' && value !== 'Metered') {
      setActiveTab('customer');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setActiveTab('customer');
    }
  };

  const isFormValid = 
    formData.name.trim() &&
    formData.address.trim() &&
    formData.inspCode.trim() &&
    formData.accountType &&
    formData.customerCategory &&
    formData.waterStatus &&
    formData.sewerStatus &&
    formData.cityCorporationId &&
    formData.zoneId &&
    formData.areaId &&
    (formData.waterStatus !== 'Metered' || (formData.meterNo && formData.sizeOfDia));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-[700px] max-h-[95vh] h-[90vh] sm:h-[85vh] bg-white flex flex-col overflow-hidden m-4 sm:m-0">
        {/* Custom Tabs styled like LocationManagement */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex gap-3 sm:gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('customer')}
              className={`pb-3 text-sm sm:text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === 'customer'
                  ? 'border-[#4C6EF5] text-[#4C6EF5]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Customer Information
            </button>
            <button
              type="button"
              onClick={() => formData.waterStatus === 'Metered' && setActiveTab('meter')}
              disabled={formData.waterStatus !== 'Metered'}
              className={`pb-3 text-sm sm:text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === 'meter'
                  ? 'border-[#4C6EF5] text-[#4C6EF5]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              } ${formData.waterStatus !== 'Metered' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Meter Information
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Customer Tab Content */}
          {activeTab === 'customer' && (
            <div className="flex-1 overflow-y-auto space-y-4 px-4 sm:px-6 py-4 min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Customer Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter customer name"
                    maxLength={255}
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inspCode" className="text-sm font-medium text-gray-700">
                    Inspection Code *
                  </Label>
                  <Input
                    id="inspCode"
                    type="number"
                    value={formData.inspCode}
                    onChange={(e) => handleInputChange('inspCode', e.target.value)}
                    placeholder="Enter inspection code"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                  Address *
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter complete address"
                  className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 min-h-[80px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountType" className="text-sm font-medium text-gray-700">
                    Account Type *
                  </Label>
                  <Dropdown
                    options={[
                      { value: 'General', label: 'General' },
                      { value: 'Tubewell', label: 'Tubewell' }
                    ]}
                    value={formData.accountType}
                    onChange={(value) => handleInputChange('accountType', value)}
                    placeholder="Select account type"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerCategory" className="text-sm font-medium text-gray-700">
                    Customer Category *
                  </Label>
                  <Dropdown
                    options={[
                      { value: 'Domestic', label: 'Domestic' },
                      { value: 'Commercial', label: 'Commercial' },
                      { value: 'Industrial', label: 'Industrial' },
                      { value: 'Government', label: 'Government' },
                      { value: 'Community', label: 'Community' }
                    ]}
                    value={formData.customerCategory}
                    onChange={(value) => handleInputChange('customerCategory', value)}
                    placeholder="Select category"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="waterStatus" className="text-sm font-medium text-gray-700">
                    Water Status *
                  </Label>
                  <Dropdown
                    options={[
                      { value: 'Metered', label: 'Metered' },
                      { value: 'Meter Temporarilly Disconnected', label: 'Meter Temporarily Disconnected' },
                      { value: 'Non-Metered', label: 'Non-Metered' },
                      { value: 'Connected', label: 'Connected' },
                      { value: 'Not-connected', label: 'Not Connected' }
                    ]}
                    value={formData.waterStatus}
                    onChange={(value) => handleInputChange('waterStatus', value)}
                    placeholder="Select water status"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sewerStatus" className="text-sm font-medium text-gray-700">
                    Sewer Status *
                  </Label>
                  <Dropdown
                    options={[
                      { value: 'Connected', label: 'Connected' },
                      { value: 'Not Connected', label: 'Not Connected' },
                      { value: 'Within 100 feet', label: 'Within 100 feet' }
                    ]}
                    value={formData.sewerStatus}
                    onChange={(value) => handleInputChange('sewerStatus', value)}
                    placeholder="Select sewer status"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <HierarchicalLocationSelector
                cityCorporations={cityCorporations}
                zones={zones}
                areas={areas}
                cityCorporationId={formData.cityCorporationId}
                zoneId={formData.zoneId}
                areaId={formData.areaId}
                onCityCorporationChange={(value) => handleInputChange('cityCorporationId', value)}
                onZoneChange={(value) => handleInputChange('zoneId', value)}
                onAreaChange={(value) => handleInputChange('areaId', value)}
                required
                className="bg-gray-50"
              />
            </div>
          )}

          {/* Meter Tab Content */}
          {activeTab === 'meter' && (
            <div className="flex-1 overflow-y-auto space-y-4 px-4 sm:px-6 py-4 min-h-0">
              {formData.waterStatus !== 'Metered' ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Please select "Metered" as Water Status in the Customer tab to register a meter.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="meterNo" className="text-sm font-medium text-gray-700">
                        Meter Number *
                      </Label>
                      <Input
                        id="meterNo"
                        type="number"
                        value={formData.meterNo}
                        onChange={(e) => handleInputChange('meterNo', e.target.value)}
                        placeholder="Enter meter number"
                        className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meterStatus" className="text-sm font-medium text-gray-700">
                        Meter Status *
                      </Label>
                      <Dropdown
                        options={[
                          { value: 'Functional', label: 'Functional' },
                          { value: 'Non-Functional', label: 'Non-Functional' },
                          { value: 'Stolen', label: 'Stolen' },
                          { value: 'N/A', label: 'N/A' }
                        ]}
                        value={formData.meterStatus}
                        onChange={(value) => handleInputChange('meterStatus', value)}
                        placeholder="Select meter status"
                        className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sizeOfDia" className="text-sm font-medium text-gray-700">
                        Size of Diameter *
                      </Label>
                      <Input
                        id="sizeOfDia"
                        value={formData.sizeOfDia}
                        onChange={(e) => handleInputChange('sizeOfDia', e.target.value)}
                        placeholder="e.g., 15mm, 20mm"
                        className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meterInstallationDate" className="text-sm font-medium text-gray-700">
                        Installation Date
                      </Label>
                      <Input
                        id="meterInstallationDate"
                        type="date"
                        value={formData.meterInstallationDate}
                        onChange={(e) => handleInputChange('meterInstallationDate', e.target.value)}
                        className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 px-4 sm:px-6 pb-4 sm:pb-6 pt-4 border-t border-gray-200 flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto border-gray-300 text-gray-700 rounded-lg h-10 px-5 bg-white hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={!isFormValid || isSubmitting}
            className="w-full sm:w-auto bg-primary hover:bg-primary-600 text-white rounded-lg h-10 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting 
              ? (mode === 'add' ? 'Registering...' : 'Saving...') 
              : formData.waterStatus === 'Metered' 
                ? (mode === 'add' ? 'Register Customer & Meter' : 'Save Customer & Meter')
                : (mode === 'add' ? 'Register Customer' : 'Save Customer')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
