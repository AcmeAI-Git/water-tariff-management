import { useState } from 'react';
import { api } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { TariffCategoriesTab } from '../components/tariffCategory/TariffCategoriesTab';
import { TariffCategorySettingsView } from '../components/tariffCategory/TariffCategorySettingsView';
import type { TariffCategorySettings } from '../types';

export function TariffConfiguration() {
  const [activeTab, setActiveTab] = useState<'categories' | 'settings'>('categories');

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

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-gray-900 mb-1">Tariff Configuration</h1>
          <p className="text-sm text-gray-500">Manage tariff categories and settings</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('categories')}
              className={`pb-3 text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === 'categories'
                  ? 'border-[#4C6EF5] text-[#4C6EF5]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Tariff Categories
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-3 text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-[#4C6EF5] text-[#4C6EF5]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Tariff Category Settings
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'categories' && (
          <TariffCategoriesTab settings={allSettings as TariffCategorySettings[]} />
        )}

        {activeTab === 'settings' && (
          <TariffCategorySettingsView />
        )}
      </div>
    </div>
  );
}
