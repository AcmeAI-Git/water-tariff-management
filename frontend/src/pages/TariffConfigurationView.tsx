import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Edit, CheckCircle } from 'lucide-react';
import { PageHeader } from '../components/zoneScoring/PageHeader';
import { StatusBadge } from '../components/zoneScoring/StatusBadge';
import { TariffCategorySettingsModal } from '../components/modals/TariffCategorySettingsModal';
import { TariffCategoriesTab } from '../components/tariffCategory/TariffCategoriesTab';
import type { 
  TariffCategorySettings, 
  UpdateTariffCategorySettingsDto 
} from '../types';

export function TariffConfigurationView() {
  const { id } = useParams<{ id: string }>();
  // const navigate = useNavigate(); // Unused for now
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch settings by ID
  const { data: settingsData, isLoading: settingsLoading } = useApiQuery<TariffCategorySettings>(
    ['tariff-category-settings', id || ''],
    () => api.tariffCategorySettings.getById(parseInt(id || '0', 10)),
    { enabled: !!id }
  );

  // Set settings as active mutation
  const setSettingsActiveMutation = useApiMutation(
    (settingsId: number) => api.tariffCategorySettings.activate(settingsId),
    {
      successMessage: 'Settings activated successfully',
      errorMessage: 'Failed to activate settings',
      invalidateQueries: [['tariff-category-settings'], ['tariff-category-settings', id || '']],
    }
  );

  // Update mutation
  const updateMutation = useApiMutation(
    ({ id, data }: { id: number; data: UpdateTariffCategorySettingsDto }) =>
      api.tariffCategorySettings.update(id, data),
    {
      onSuccess: () => {
        setIsEditModalOpen(false);
      },
      invalidateQueries: [['tariff-category-settings'], ['tariff-category-settings', id || '']],
    }
  );

  const handleUpdate = (data: UpdateTariffCategorySettingsDto) => {
    if (!settingsData) return;
    updateMutation.mutate({ id: settingsData.id, data });
  };

  const handleSetActive = async () => {
    if (!settingsData) return;
    await setSettingsActiveMutation.mutateAsync(settingsData.id);
  };

  // Format percentage for display
  const formatPercentage = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    if (value > 1) return `${value.toFixed(2)}%`;
    return `${(value * 100).toFixed(2)}%`;
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!settingsData) {
    return (
      <div className="min-h-screen bg-[#f8f9fb]">
        <div className="px-4 md:px-8 py-4 md:py-6">
          <PageHeader
            title="Settings Ruleset Not Found"
            description="The requested settings ruleset could not be found"
            showBackButton={true}
            backUrl="/tariff-admin/config"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] overflow-x-hidden w-full">
      <div className="px-4 md:px-8 py-4 md:py-6 w-full max-w-full">
        <PageHeader
          title={settingsData.title ? `Settings: ${settingsData.title}` : `Settings Ruleset #${settingsData.id}`}
          description={settingsData.description || 'Configure settings parameters and manage categories'}
          showBackButton={true}
          backUrl="/tariff-admin/config"
        />

        {/* Settings Parameters Section */}
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Settings Parameters</h3>
                <div className="flex items-center gap-2">
                  {!settingsData.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSetActive}
                      disabled={setSettingsActiveMutation.isPending}
                      className="border-green-300 text-green-700 rounded-lg h-8 px-3 bg-white hover:bg-green-50 inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                      title="Set as Active"
                    >
                      <CheckCircle size={14} />
                      Set as Active
                    </Button>
                  )}
                  {settingsData.isActive && (
                    <StatusBadge status="active" />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    className="border-gray-300 text-gray-700 rounded-lg h-8 px-3 bg-white hover:bg-gray-50 inline-flex items-center gap-1.5"
                    title="Edit Settings"
                  >
                    <Edit size={14} />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto -mx-4 md:mx-0 w-full">
              <div className="inline-block min-w-full align-middle px-4 md:px-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap min-w-[180px]">Parameter</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap min-w-[120px]">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  <TableRow className="border-gray-100">
                    <TableCell className="text-sm font-medium text-gray-900 text-center">Production Cost</TableCell>
                    <TableCell className="text-sm text-gray-600 text-center">{settingsData.productionCost.toFixed(2)} BDT</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-100">
                    <TableCell className="text-sm font-medium text-gray-900 text-center">Base Rate</TableCell>
                    <TableCell className="text-sm text-gray-600 text-center">{settingsData.baseRate.toFixed(2)} BDT</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-100">
                    <TableCell className="text-sm font-medium text-gray-900 text-center">Current Tariff</TableCell>
                    <TableCell className="text-sm text-gray-600 text-center">{settingsData.currentTariff.toFixed(2)} BDT</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-100">
                    <TableCell className="text-sm font-medium text-gray-900 text-center">Current Tubewell Tariff</TableCell>
                    <TableCell className="text-sm text-gray-600 text-center">{settingsData.currentTubewellTariff.toFixed(2)} BDT</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-100">
                    <TableCell className="text-sm font-medium text-gray-900 text-center">Tubewell Ratio Standard</TableCell>
                    <TableCell className="text-sm text-gray-600 text-center">{formatPercentage(settingsData.tubewellRatioStandard)}</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-100">
                    <TableCell className="text-sm font-medium text-gray-900 text-center">Tubewell Ratio Commercial</TableCell>
                    <TableCell className="text-sm text-gray-600 text-center">{formatPercentage(settingsData.tubewellRatioCommercial)}</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-100">
                    <TableCell className="text-sm font-medium text-gray-900 text-center">Above Base Increase</TableCell>
                    <TableCell className="text-sm text-gray-600 text-center">{formatPercentage(settingsData.aboveBaseIncreasePercent)}</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-100">
                    <TableCell className="text-sm font-medium text-gray-900 text-center">Below Base Decrease</TableCell>
                    <TableCell className="text-sm text-gray-600 text-center">{formatPercentage(settingsData.belowBaseDecreasePercent)}</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-100">
                    <TableCell className="text-sm font-medium text-gray-900 text-center">Commercial Increase</TableCell>
                    <TableCell className="text-sm text-gray-600 text-center">{formatPercentage(settingsData.commercialIncreasePercent)}</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-100">
                    <TableCell className="text-sm font-medium text-gray-900 text-center">Government Increase</TableCell>
                    <TableCell className="text-sm text-gray-600 text-center">{formatPercentage(settingsData.governmentIncreasePercent)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div>
          <TariffCategoriesTab settingsId={parseInt(id || '0', 10)} />
        </div>

        {/* Edit Modal */}
        {settingsData && (
          <TariffCategorySettingsModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSubmit={handleUpdate}
            isSubmitting={updateMutation.isPending}
            initialData={settingsData}
            mode="edit"
          />
        )}
      </div>
    </div>
  );
}
