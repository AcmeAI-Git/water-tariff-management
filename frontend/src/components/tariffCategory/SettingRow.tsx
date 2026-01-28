import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Edit, Trash2, CheckCircle, ChevronDown, ChevronRight, Save, X, Plus, Star } from 'lucide-react';
import type { 
  TariffCategorySettings, 
  UpdateTariffCategorySettingsDto,
  TariffCategory,
  CreateTariffCategoryDto,
  UpdateTariffCategoryDto
} from '../../types';
import { StatusBadge } from '../zoneScoring/StatusBadge';
import { TariffCategoryModal } from '../modals/TariffCategoryModal';

interface SettingRowProps {
  setting: TariffCategorySettings;
  categories: TariffCategory[];
  isExpanded: boolean;
  name: string;
  editingName: boolean;
  onToggleExpand: () => void;
  onStartEditingName: () => void;
  onSaveName: () => void;
  onCancelEditingName: () => void;
  onUpdateName: (name: string) => void;
  onSetActive: () => void;
  onDelete: () => void;
  onSaveParameters: (data: UpdateTariffCategorySettingsDto) => void;
  onCreateCategory: (data: CreateTariffCategoryDto) => void;
  onUpdateCategory: (id: number, data: UpdateTariffCategoryDto) => void;
  onDeleteCategory: (id: number) => void;
  onSetBaseCategory: (category: TariffCategory) => void;
  onSetActiveCategory: (category: TariffCategory) => void;
  isSettingActivePending?: boolean;
  isUpdatePending?: boolean;
  allSettings: TariffCategorySettings[];
}

export function SettingRow({
  setting,
  categories,
  isExpanded,
  name,
  editingName,
  onToggleExpand,
  onStartEditingName,
  onSaveName,
  onCancelEditingName,
  onUpdateName,
  onSetActive,
  onDelete,
  onSaveParameters,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onSetBaseCategory,
  onSetActiveCategory,
  isSettingActivePending = false,
  isUpdatePending = false,
  allSettings,
}: SettingRowProps) {
  const [parametersFormData, setParametersFormData] = useState({
    productionCost: setting.productionCost.toString(),
    baseRate: setting.baseRate.toString(),
    currentTariff: setting.currentTariff.toString(),
    currentTubewellTariff: setting.currentTubewellTariff.toString(),
    tubewellRatioStandard: setting.tubewellRatioStandard?.toString() || '',
    tubewellRatioCommercial: setting.tubewellRatioCommercial?.toString() || '',
    aboveBaseIncreasePercent: setting.aboveBaseIncreasePercent?.toString() || '',
    belowBaseDecreasePercent: setting.belowBaseDecreasePercent?.toString() || '',
    commercialIncreasePercent: setting.commercialIncreasePercent?.toString() || '',
    governmentIncreasePercent: setting.governmentIncreasePercent?.toString() || '',
  });
  const [hasParameterChanges, setHasParameterChanges] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TariffCategory | null>(null);

  // Reset form data when setting changes
  useEffect(() => {
    setParametersFormData({
      productionCost: setting.productionCost.toString(),
      baseRate: setting.baseRate.toString(),
      currentTariff: setting.currentTariff.toString(),
      currentTubewellTariff: setting.currentTubewellTariff.toString(),
      tubewellRatioStandard: setting.tubewellRatioStandard?.toString() || '',
      tubewellRatioCommercial: setting.tubewellRatioCommercial?.toString() || '',
      aboveBaseIncreasePercent: setting.aboveBaseIncreasePercent?.toString() || '',
      belowBaseDecreasePercent: setting.belowBaseDecreasePercent?.toString() || '',
      commercialIncreasePercent: setting.commercialIncreasePercent?.toString() || '',
      governmentIncreasePercent: setting.governmentIncreasePercent?.toString() || '',
    });
    setHasParameterChanges(false);
  }, [setting]);

  const handleParameterChange = (field: string, value: string) => {
    setParametersFormData(prev => ({ ...prev, [field]: value }));
    setHasParameterChanges(true);
  };

  const handleSaveParameters = () => {
    const updateData: UpdateTariffCategorySettingsDto = {
      productionCost: parseFloat(parametersFormData.productionCost),
      baseRate: parseFloat(parametersFormData.baseRate),
      currentTariff: parseFloat(parametersFormData.currentTariff),
      currentTubewellTariff: parseFloat(parametersFormData.currentTubewellTariff),
      ...(parametersFormData.tubewellRatioStandard && { 
        tubewellRatioStandard: parseFloat(parametersFormData.tubewellRatioStandard) 
      }),
      ...(parametersFormData.tubewellRatioCommercial && { 
        tubewellRatioCommercial: parseFloat(parametersFormData.tubewellRatioCommercial) 
      }),
      ...(parametersFormData.aboveBaseIncreasePercent && { 
        aboveBaseIncreasePercent: parseFloat(parametersFormData.aboveBaseIncreasePercent) 
      }),
      ...(parametersFormData.belowBaseDecreasePercent && { 
        belowBaseDecreasePercent: parseFloat(parametersFormData.belowBaseDecreasePercent) 
      }),
      ...(parametersFormData.commercialIncreasePercent && { 
        commercialIncreasePercent: parseFloat(parametersFormData.commercialIncreasePercent) 
      }),
      ...(parametersFormData.governmentIncreasePercent && { 
        governmentIncreasePercent: parseFloat(parametersFormData.governmentIncreasePercent) 
      }),
    };
    onSaveParameters(updateData);
    setHasParameterChanges(false);
  };

  const handleCancelParameters = () => {
    setParametersFormData({
      productionCost: setting.productionCost.toString(),
      baseRate: setting.baseRate.toString(),
      currentTariff: setting.currentTariff.toString(),
      currentTubewellTariff: setting.currentTubewellTariff.toString(),
      tubewellRatioStandard: setting.tubewellRatioStandard?.toString() || '',
      tubewellRatioCommercial: setting.tubewellRatioCommercial?.toString() || '',
      aboveBaseIncreasePercent: setting.aboveBaseIncreasePercent?.toString() || '',
      belowBaseDecreasePercent: setting.belowBaseDecreasePercent?.toString() || '',
      commercialIncreasePercent: setting.commercialIncreasePercent?.toString() || '',
      governmentIncreasePercent: setting.governmentIncreasePercent?.toString() || '',
    });
    setHasParameterChanges(false);
  };

  const handleEditCategory = (category: TariffCategory) => {
    setEditingCategory(category);
    setIsEditCategoryModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Name Row */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={onToggleExpand}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
            {editingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={name}
                  onChange={(e) => onUpdateName(e.target.value)}
                  className="h-8 max-w-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onSaveName();
                    } else if (e.key === 'Escape') {
                      onCancelEditingName();
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onSaveName}
                  className="h-8 w-8 p-0"
                >
                  <Save size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onCancelEditingName}
                  className="h-8 w-8 p-0"
                >
                  <X size={14} />
                </Button>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 cursor-pointer group"
                onClick={onStartEditingName}
                onDoubleClick={onStartEditingName}
              >
                <span className="text-sm font-medium text-gray-900">{name}</span>
                <Edit size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
            <StatusBadge status={setting.isActive ? 'active' : 'draft'} />
          </div>
          <div className="flex items-center gap-2">
            {!setting.isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSetActive}
                disabled={isSettingActivePending}
                className="border-green-300 text-green-700 rounded-lg h-8 px-3 bg-white hover:bg-green-50 inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
              >
                <CheckCircle size={14} />
                Set as Active
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="border-red-300 text-red-700 rounded-lg h-8 px-3 bg-white hover:bg-red-50 inline-flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              Delete
            </Button>
          </div>
        </div>

        {/* Expanded Content: Parameters and Categories */}
        {isExpanded && (
          <div className="p-6 space-y-6">
            {/* Parameters Group */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Parameters</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Production Cost (BDT/1000L)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={parametersFormData.productionCost}
                    onChange={(e) => handleParameterChange('productionCost', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Base Rate (BDT/1000L)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={parametersFormData.baseRate}
                    onChange={(e) => handleParameterChange('baseRate', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Current Tariff (BDT/1000L)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={parametersFormData.currentTariff}
                    onChange={(e) => handleParameterChange('currentTariff', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Current Tubewell Tariff (BDT/1000L)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={parametersFormData.currentTubewellTariff}
                    onChange={(e) => handleParameterChange('currentTubewellTariff', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              {hasParameterChanges && (
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelParameters}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveParameters}
                    disabled={isUpdatePending}
                  >
                    {isUpdatePending ? 'Saving...' : 'Save Parameters'}
                  </Button>
                </div>
              )}
            </div>

            {/* Categories Group */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Categories</h3>
                <Button
                  size="sm"
                  onClick={() => setIsCreateCategoryModalOpen(true)}
                  className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-8 px-3 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  Create Category
                </Button>
              </div>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No categories found. Create your first category.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="text-xs font-semibold text-gray-700 py-2">Name</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-700 py-2">Category</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-700 py-2">Base</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-700 py-2">Active</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-700 text-right py-2">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id} className="border-gray-100">
                        <TableCell className="text-xs text-gray-900">{category.name}</TableCell>
                        <TableCell className="text-xs text-gray-600">{category.category}</TableCell>
                        <TableCell className="text-xs">
                          {category.isBaseCategory ? (
                            <span className="text-green-600 font-medium">Yes</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <StatusBadge status={category.isActive ? 'active' : 'draft'} />
                        </TableCell>
                        <TableCell className="text-right align-middle">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit size={12} />
                            </Button>
                            {!category.isBaseCategory && category.category === 'Domestic' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onSetBaseCategory(category)}
                                className="h-7 w-7 p-0 text-green-600"
                                title="Set as Base"
                              >
                                <Star size={12} />
                              </Button>
                            )}
                            {!category.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onSetActiveCategory(category)}
                                className="h-7 w-7 p-0 text-blue-600"
                                title="Set as Active"
                              >
                                <CheckCircle size={12} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteCategory(category.id)}
                              className="h-7 w-7 p-0 text-red-600"
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Category Modal */}
      <TariffCategoryModal
        isOpen={isCreateCategoryModalOpen}
        onClose={() => setIsCreateCategoryModalOpen(false)}
        onSubmit={(data) => {
          const createData = data as CreateTariffCategoryDto;
          createData.settingsId = setting.id;
          onCreateCategory(createData);
          setIsCreateCategoryModalOpen(false);
        }}
        isSubmitting={false}
        settings={allSettings}
        defaultSettingsId={setting.id}
      />

      {/* Edit Category Modal */}
      {editingCategory && (
        <TariffCategoryModal
          isOpen={isEditCategoryModalOpen}
          onClose={() => {
            setIsEditCategoryModalOpen(false);
            setEditingCategory(null);
          }}
          onSubmit={(data) => {
            if (editingCategory) {
              onUpdateCategory(editingCategory.id, data as UpdateTariffCategoryDto);
              setIsEditCategoryModalOpen(false);
              setEditingCategory(null);
            }
          }}
          isSubmitting={false}
          initialData={editingCategory}
          mode="edit"
          settings={allSettings}
          defaultSettingsId={setting.id}
        />
      )}
    </>
  );
}
