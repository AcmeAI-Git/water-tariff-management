import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useState, useMemo } from 'react';
import { EditRatesModal } from '../components/modals/EditRatesModal';
import { EditMultipliersModal } from '../components/modals/EditMultipliersModal';
import { api } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function TariffConfiguration() {
  const [activeTab, setActiveTab] = useState<'slabs' | 'multipliers'>('slabs');
  const [showEditRates, setShowEditRates] = useState(false);
  const [showEditMultipliers, setShowEditMultipliers] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);

  // Fetch tariff plans
  const { data: tariffPlans = [], isLoading: plansLoading } = useApiQuery(
    ['tariff-plans'],
    () => api.tariffPlans.getAll()
  );

  // Fetch city corporations
  const { data: cityCorporations = [], isLoading: citiesLoading } = useApiQuery(
    ['city-corporations'],
    () => api.cityCorporations.getAll()
  );

  // Fetch zones filtered by selected city
  const { data: zones = [], isLoading: zonesLoading } = useApiQuery(
    selectedCityId ? ['zones', selectedCityId] : ['zones'],
    () => api.zones.getAll(selectedCityId || undefined),
    { enabled: !!selectedCityId }
  );

  // Fetch wards filtered by selected zone
  const { data: wards = [], isLoading: wardsLoading } = useApiQuery(
    selectedZoneId ? ['wards', selectedZoneId] : ['wards'],
    () => api.wards.getAll(selectedZoneId || undefined),
    { enabled: !!selectedZoneId }
  );

  // Set default city when cities load
  useMemo(() => {
    if (cityCorporations.length > 0 && !selectedCityId) {
      setSelectedCityId(cityCorporations[0].id);
    }
  }, [cityCorporations, selectedCityId]);

  // Set default zone when zones load
  useMemo(() => {
    if (zones.length > 0 && !selectedZoneId) {
      setSelectedZoneId(zones[0].id);
    }
  }, [zones, selectedZoneId]);

  // Filter active tariff plans by type
  const residentialPlans = useMemo(() => {
    return tariffPlans.filter((plan) => 
      plan.name.toLowerCase().includes('residential') && 
      (!plan.effectiveTo || new Date(plan.effectiveTo) > new Date())
    );
  }, [tariffPlans]);

  const commercialPlans = useMemo(() => {
    return tariffPlans.filter((plan) => 
      plan.name.toLowerCase().includes('commercial') && 
      (!plan.effectiveTo || new Date(plan.effectiveTo) > new Date())
    );
  }, [tariffPlans]);

  // Extract residential slabs from active plans
  const residentialSlabs = useMemo(() => {
    const allSlabs: Array<{ range: string; rate: string }> = [];
    residentialPlans.forEach((plan) => {
      if (plan.slabs) {
        plan.slabs
          .sort((a, b) => a.slabOrder - b.slabOrder)
          .forEach((slab) => {
            const range = slab.maxConsumption 
              ? `${slab.minConsumption} - ${slab.maxConsumption}`
              : `${slab.minConsumption}+`;
            allSlabs.push({
              range,
              rate: parseFloat(slab.ratePerUnit.toString()).toFixed(2),
            });
          });
      }
    });
    return allSlabs;
  }, [residentialPlans]);

  // Extract commercial slabs from active plans
  const commercialSlabs = useMemo(() => {
    const allSlabs: Array<{ range: string; rate: string }> = [];
    commercialPlans.forEach((plan) => {
      if (plan.slabs) {
        plan.slabs
          .sort((a, b) => a.slabOrder - b.slabOrder)
          .forEach((slab) => {
            const range = slab.maxConsumption 
              ? `${slab.minConsumption} - ${slab.maxConsumption}`
              : `${slab.minConsumption}+`;
            allSlabs.push({
              range,
              rate: parseFloat(slab.ratePerUnit.toString()).toFixed(2),
            });
          });
      }
    });
    return allSlabs;
  }, [commercialPlans]);

  // Prepare ward multipliers from API data
  const wardMultipliers = useMemo(() => {
    return wards.map((ward) => {
      const multiplier = typeof ward.tariffMultiplier === 'number' 
        ? ward.tariffMultiplier 
        : Number(ward.tariffMultiplier) || 1;
      return {
        ward: ward.name || ward.wardNo,
        multiplier: multiplier.toFixed(2),
      };
    });
  }, [wards]);

  // Get selected city name
  // const selectedCity = useMemo(() => {
  //   return cityCorporations.find(c => c.id === selectedCityId)?.name || '';
  // }, [cityCorporations, selectedCityId]);

  if (plansLoading || citiesLoading || zonesLoading || wardsLoading) {
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
          <p className="text-sm text-gray-500">Manage water tariff rates and ward multipliers</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('slabs')}
              className={`pb-3 text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === 'slabs'
                  ? 'border-[#4C6EF5] text-[#4C6EF5]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Tariff Slabs
            </button>
            <button
              onClick={() => setActiveTab('multipliers')}
              className={`pb-3 text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === 'multipliers'
                  ? 'border-[#4C6EF5] text-[#4C6EF5]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Ward Multipliers
            </button>
          </div>
        </div>

        {/* Tariff Slabs Tab */}
        {activeTab === 'slabs' && (
          <div className="space-y-8">
            {/* Residential Slabs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Residential Slabs</h3>
                <Button className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white px-5 py-2 rounded-lg" onClick={() => setShowEditRates(true)}>
                  Edit Rates
                </Button>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="text-sm font-semibold text-gray-700">Range (m³)</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 text-center">Rate (BDT/m³)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {residentialSlabs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-gray-500 py-8">
                          No residential tariff slabs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      residentialSlabs.map((slab, index) => (
                        <TableRow key={index} className="border-gray-100">
                          <TableCell className="text-sm text-gray-900 font-medium">{slab.range}</TableCell>
                          <TableCell className="text-sm text-gray-600 text-center">৳{slab.rate}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Commercial Slabs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Commercial Slabs</h3>
                <Button className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white px-5 py-2 rounded-lg" onClick={() => setShowEditRates(true)}>
                  Edit Rates
                </Button>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="text-sm font-semibold text-gray-700">Range (m³)</TableHead>
                      <TableHead className="text-sm font-semibold text-gray-700 text-center">Rate (BDT/m³)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commercialSlabs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-gray-500 py-8">
                          No commercial tariff slabs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      commercialSlabs.map((slab, index) => (
                        <TableRow key={index} className="border-gray-100">
                          <TableCell className="text-sm text-gray-900 font-medium">{slab.range}</TableCell>
                          <TableCell className="text-sm text-gray-600 text-center">৳{slab.rate}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Ward Multipliers Tab */}
        {activeTab === 'multipliers' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ward Multipliers by City</h3>
              <div className="flex items-center gap-3">
                <select
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={selectedCityId || ''}
                  onChange={e => {
                    const cityId = parseInt(e.target.value);
                    setSelectedCityId(cityId);
                    setSelectedZoneId(null); // Reset zone when city changes
                  }}
                >
                  <option value="">Select City</option>
                  {cityCorporations.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
                {selectedCityId && (
                  <select
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={selectedZoneId || ''}
                    onChange={e => {
                      const zoneId = parseInt(e.target.value);
                      setSelectedZoneId(zoneId);
                    }}
                  >
                    <option value="">Select Zone</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name || zone.zoneNo}
                      </option>
                    ))}
                  </select>
                )}
                <Button className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white px-5 py-2 rounded-lg" onClick={() => setShowEditMultipliers(true)}>
                  Edit Multipliers
                </Button>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 bg-gray-50">
                    <TableHead className="text-sm font-semibold text-gray-700">Ward Name</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Tariff Multiplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wardMultipliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-gray-500 py-8">
                        {selectedZoneId ? 'No wards found for selected zone' : 'Please select a city and zone'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    wardMultipliers.map((ward, index) => (
                      <TableRow key={index} className="border-gray-100">
                        <TableCell className="text-sm text-gray-900 font-medium">{ward.ward}</TableCell>
                        <TableCell className="text-sm text-gray-600 text-center">{ward.multiplier}x</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {showEditRates && (
          <EditRatesModal
            slabs={residentialSlabs}
            onClose={() => setShowEditRates(false)}
            onSave={(newSlabs) => {
              console.log('Save slabs', newSlabs);
              setShowEditRates(false);
            }}
          />
        )}

        {showEditMultipliers && (
          <EditMultipliersModal
            multipliers={wardMultipliers}
            onClose={() => setShowEditMultipliers(false)}
            onSave={(newMult) => {
              console.log('Save multipliers', newMult);
              setShowEditMultipliers(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
