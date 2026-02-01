import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dropdown } from '../ui/Dropdown';
import { HierarchicalLocationSelector } from '../common/HierarchicalLocationSelector';
import { Download, Upload } from 'lucide-react';
import type { Wasa, Zone, Area } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getStaticTranslation } from '../../constants/staticTranslations';

export interface CustomerMeterFormData {
  name: string;
  address: string;
  inspCode: string;
  accountType: string;
  customerCategory: string;
  waterStatus: string;
  sewerStatus: string;
  wasaId: string;
  zoneId: string;
  areaId: string;
  meterNo: string;
  meterStatus: string;
  sizeOfDia: string;
  meterInstallationDate: string;
  landSizeDecimal: string;
  numberOfStories: string;
  numberOfFlats: string;
}

interface CustomerMeterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CustomerMeterFormData;
  onFormDataChange: (field: keyof CustomerMeterFormData, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  wasas: Wasa[];
  zones: Zone[];
  areas: Area[];
  mode?: 'add' | 'edit';
  // CSV bulk import props
  onDownloadTemplate?: () => void;
  onCSVUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  csvFileInputRef?: React.RefObject<HTMLInputElement | null>;
  isParsingCSV?: boolean;
  showBulkImport?: boolean;
}

export function CustomerMeterModal({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  wasas,
  zones,
  areas,
  mode = 'add',
  onDownloadTemplate,
  onCSVUpload,
  csvFileInputRef,
  isParsingCSV = false,
  showBulkImport = false,
}: CustomerMeterModalProps) {
  const { language } = useLanguage();
  const t = (key: string) => getStaticTranslation(language, key);
  const handleInputChange = (field: keyof CustomerMeterFormData, value: string) => {
    onFormDataChange(field, value);
  };

  const isFormValid = 
    formData.name.trim() &&
    formData.address.trim() &&
    formData.inspCode.trim() &&
    formData.accountType &&
    formData.customerCategory &&
    formData.waterStatus &&
    formData.sewerStatus &&
    formData.wasaId &&
    formData.zoneId &&
    formData.areaId &&
    (formData.waterStatus !== 'Metered' || (formData.meterNo && formData.sizeOfDia));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-[700px] max-h-[95vh] h-[90vh] sm:h-[85vh] bg-white flex flex-col overflow-hidden m-4 sm:m-0" aria-describedby={undefined}>
        {/* Header */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 border-b border-gray-200 flex-shrink-0 notranslate" translate="no">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 pb-3">
            {mode === 'add' ? t('modals.addNewCustomer') : t('modals.editCustomer')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {mode === 'add' ? t('modals.fillFormAddCustomer') : t('modals.updateCustomerInfo')}
          </DialogDescription>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 px-4 sm:px-6 py-4 min-h-0">
          {/* Bulk Import Section - Only show in add mode */}
          {mode === 'add' && showBulkImport && onDownloadTemplate && onCSVUpload && csvFileInputRef && (
            <div className="space-y-3 pb-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">{t('modals.bulkImport')}</h3>
              <p className="text-sm text-gray-600">
                {t('modals.importMultipleCSV')}
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDownloadTemplate}
                  className="border-gray-300 text-gray-700 rounded-lg h-10 px-4 flex items-center justify-center gap-2 bg-white hover:bg-gray-50"
                >
                  <Download size={16} />
                  {t('modals.downloadTemplate')}
                </Button>
                <input
                  ref={csvFileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={onCSVUpload}
                  className="hidden"
                  id="csv-upload-input-modal"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => csvFileInputRef.current?.click()}
                  disabled={areas.length === 0 || isParsingCSV}
                  className="border-gray-300 text-gray-700 rounded-lg h-10 px-4 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={16} />
                  {isParsingCSV ? t('modals.parsing') : t('modals.uploadCSV')}
                </Button>
              </div>
            </div>
          )}
          
          {/* Customer Information Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">{t('modals.customerInformation')}</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  {t('modals.customerNameLabel')}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('modals.enterCustomerName')}
                  maxLength={255}
                  className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inspCode" className="text-sm font-medium text-gray-700">
                  {t('modals.inspectionCode')}
                </Label>
                <Input
                  id="inspCode"
                  type="number"
                  value={formData.inspCode}
                  onChange={(e) => handleInputChange('inspCode', e.target.value)}
                  placeholder={t('modals.enterInspectionCode')}
                  className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                {t('modals.addressLabel')}
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder={t('modals.enterCompleteAddress')}
                className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 min-h-[80px]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountType" className="text-sm font-medium text-gray-700">
                  {t('modals.accountType')}
                </Label>
                <Dropdown
                  options={[
                    { value: 'General', label: 'General' },
                    { value: 'Tubewell', label: 'Tubewell' }
                  ]}
                  value={formData.accountType}
                  onChange={(value) => handleInputChange('accountType', value)}
                  placeholder={t('modals.selectAccountType')}
                  className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerCategory" className="text-sm font-medium text-gray-700">
                  {t('modals.customerCategoryLabel')}
                </Label>
                <Dropdown
                  options={[
                    { value: 'Domestic', label: 'Domestic' },
                    { value: 'Commercial/Industrial', label: 'Commercial/Industrial' },
                    { value: 'Government/Community', label: 'Government/Community' }
                  ]}
                  value={formData.customerCategory}
                  onChange={(value) => handleInputChange('customerCategory', value)}
                  placeholder={t('pages.selectCategory')}
                  className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="waterStatus" className="text-sm font-medium text-gray-700">
                  {t('modals.waterStatusLabel')}
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
                  placeholder={t('modals.selectWaterStatus')}
                  className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sewerStatus" className="text-sm font-medium text-gray-700">
                  {t('modals.sewerStatusLabel')}
                </Label>
                <Dropdown
                  options={[
                    { value: 'Connected', label: 'Connected' },
                    { value: 'Not Connected', label: 'Not Connected' },
                    { value: 'Within 100 feet', label: 'Within 100 feet' }
                  ]}
                  value={formData.sewerStatus}
                  onChange={(value) => handleInputChange('sewerStatus', value)}
                  placeholder={t('modals.selectSewerStatus')}
                  className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                />
              </div>
            </div>

            <HierarchicalLocationSelector
              wasas={wasas}
              zones={zones}
              areas={areas}
              wasaId={formData.wasaId}
              zoneId={formData.zoneId}
              areaId={formData.areaId}
              onWasaChange={(value) => handleInputChange('wasaId', value)}
              onZoneChange={(value) => handleInputChange('zoneId', value)}
              onAreaChange={(value) => handleInputChange('areaId', value)}
              required
              className="bg-gray-50"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="landSizeDecimal" className="text-sm font-medium text-gray-700">
                  {t('modals.landSizeSqFt')}
                </Label>
                <Input
                  id="landSizeDecimal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.landSizeDecimal}
                  onChange={(e) => handleInputChange('landSizeDecimal', e.target.value)}
                  placeholder={t('modals.enterLandSize')}
                  className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfStories" className="text-sm font-medium text-gray-700">
                  {t('modals.numberOfStories')}
                </Label>
                <Input
                  id="numberOfStories"
                  type="number"
                  min="0"
                  value={formData.numberOfStories}
                  onChange={(e) => handleInputChange('numberOfStories', e.target.value)}
                  placeholder={t('modals.enterNumberOfStories')}
                  className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfFlats" className="text-sm font-medium text-gray-700">
                  {t('modals.numberOfFlats')}
                </Label>
                <Input
                  id="numberOfFlats"
                  type="number"
                  min="0"
                  value={formData.numberOfFlats}
                  onChange={(e) => handleInputChange('numberOfFlats', e.target.value)}
                  placeholder={t('modals.enterNumberOfFlats')}
                  className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Meter Information Section - Conditionally Rendered */}
          {formData.waterStatus === 'Metered' && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">{t('modals.meterInformation')}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meterNo" className="text-sm font-medium text-gray-700">
                    {t('modals.meterNumber')}
                  </Label>
                  <Input
                    id="meterNo"
                    type="number"
                    value={formData.meterNo}
                    onChange={(e) => handleInputChange('meterNo', e.target.value)}
                    placeholder={t('modals.enterMeterNumber')}
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meterStatus" className="text-sm font-medium text-gray-700">
                    {t('modals.meterStatusLabel')}
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
                    placeholder={t('modals.selectMeterStatus')}
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sizeOfDia" className="text-sm font-medium text-gray-700">
                    {t('modals.sizeOfDiameter')}
                  </Label>
                  <Input
                    id="sizeOfDia"
                    value={formData.sizeOfDia}
                    onChange={(e) => handleInputChange('sizeOfDia', e.target.value)}
                    placeholder={t('modals.sizeOfDiameterPlaceholder')}
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meterInstallationDate" className="text-sm font-medium text-gray-700">
                    {t('modals.installationDate')}
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
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 px-4 sm:px-6 pb-4 sm:pb-6 pt-4 border-t border-gray-200 flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto border-gray-300 text-gray-700 rounded-lg h-10 px-5 bg-white hover:bg-gray-50"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={!isFormValid || isSubmitting}
            className="w-full sm:w-auto bg-primary hover:bg-primary-600 text-white rounded-lg h-10 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting 
              ? (mode === 'add' ? t('modals.registering') : t('modals.saving')) 
              : formData.waterStatus === 'Metered' 
                ? (mode === 'add' ? t('modals.registerCustomerMeter') : t('modals.saveCustomerMeter'))
                : (mode === 'add' ? t('modals.registerCustomer') : t('modals.saveCustomer'))
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
