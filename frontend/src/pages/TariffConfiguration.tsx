import { api } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { TariffCategoriesTab } from '../components/tariffCategory/TariffCategoriesTab';
import type { TariffCategorySettings } from '../types';

export function TariffConfiguration() {
  // Fetch all settings for categories tab
  const { data: allSettings = [], isLoading: settingsLoading } = useApiQuery(
    ['tariff-category-settings'],
    () => api.tariffCategorySettings.getAll()
  );

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <TariffCategoriesTab settings={allSettings as TariffCategorySettings[]} />;
}
