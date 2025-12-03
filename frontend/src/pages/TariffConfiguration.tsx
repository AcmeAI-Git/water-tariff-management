import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useState } from 'react';
import { EditRatesModal } from '../components/modals/EditRatesModal';
import { EditMultipliersModal } from '../components/modals/EditMultipliersModal';

export function TariffConfiguration() {
  const [activeTab, setActiveTab] = useState<'slabs' | 'multipliers'>('slabs');
  const [showEditRates, setShowEditRates] = useState(false);
  const [showEditMultipliers, setShowEditMultipliers] = useState(false);

  const residentialSlabs = [
    { range: '0 - 10', rate: '12.00' },
    { range: '11 - 20', rate: '18.00' },
    { range: '21 - 30', rate: '25.00' },
    { range: '31+', rate: '35.00' },
  ];

  const commercialSlabs = [
    { range: '0 - 15', rate: '25.00' },
    { range: '16 - 30', rate: '40.00' },
    { range: '31 - 50', rate: '55.00' },
    { range: '51+', rate: '70.00' },
  ];

  // Demo wards for each city
  const cityWardMap = {
    Dhaka: [
      { ward: 'Ward 1', multiplier: '1.20' },
      { ward: 'Ward 2', multiplier: '1.15' },
      { ward: 'Ward 3', multiplier: '1.10' },
      { ward: 'Ward 4', multiplier: '1.05' },
      { ward: 'Ward 5', multiplier: '1.00' },
    ],
    Chittagong: [
      { ward: 'Ward 1', multiplier: '1.18' },
      { ward: 'Ward 2', multiplier: '1.12' },
      { ward: 'Ward 3', multiplier: '1.08' },
      { ward: 'Ward 4', multiplier: '1.03' },
      { ward: 'Ward 5', multiplier: '1.00' },
    ],
    Khulna: [
      { ward: 'Ward 1', multiplier: '1.10' },
      { ward: 'Ward 2', multiplier: '1.07' },
      { ward: 'Ward 3', multiplier: '1.04' },
      { ward: 'Ward 4', multiplier: '1.01' },
      { ward: 'Ward 5', multiplier: '1.00' },
    ],
  };
  const [selectedCity, setSelectedCity] = useState<'Dhaka' | 'Chittagong' | 'Khulna'>('Dhaka');
  const wardMultipliers: { ward: string; multiplier: string }[] = cityWardMap[selectedCity];

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
                    {residentialSlabs.map((slab, index) => (
                      <TableRow key={index} className="border-gray-100">
                        <TableCell className="text-sm text-gray-900 font-medium">{slab.range}</TableCell>
                        <TableCell className="text-sm text-gray-600 text-center">৳{slab.rate}</TableCell>
                      </TableRow>
                    ))}
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
                    {commercialSlabs.map((slab, index) => (
                      <TableRow key={index} className="border-gray-100">
                        <TableCell className="text-sm text-gray-900 font-medium">{slab.range}</TableCell>
                        <TableCell className="text-sm text-gray-600 text-center">৳{slab.rate}</TableCell>
                      </TableRow>
                    ))}
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
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value as 'Dhaka' | 'Chittagong' | 'Khulna')}
                >
                  <option>Dhaka</option>
                  <option>Chittagong</option>
                  <option>Khulna</option>
                </select>
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
                  {wardMultipliers.map((ward: { ward: string; multiplier: string }, index: number) => (
                    <TableRow key={index} className="border-gray-100">
                      <TableCell className="text-sm text-gray-900 font-medium">{ward.ward}</TableCell>
                      <TableCell className="text-sm text-gray-600 text-center">{ward.multiplier}x</TableCell>
                    </TableRow>
                  ))}
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
