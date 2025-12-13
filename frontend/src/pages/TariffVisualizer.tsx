import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Calculator } from 'lucide-react';
import { useState, useMemo } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { BillCalculationResult } from '../types';

export default function TariffVisualizer() {
  const [consumption, setConsumption] = useState(60);
  const [category, setCategory] = useState('residential');
  const [calculated, setCalculated] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedWardId, setSelectedWardId] = useState<number | null>(null);
  const [calculationResult, setCalculationResult] = useState<BillCalculationResult | null>(null);

  // Fetch active tariff plans
  const { data: tariffPlans = [], isLoading: plansLoading } = useApiQuery(
    ['tariff-plans', 'active'],
    () => api.tariffPlans.getActive()
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

  // Set default ward when wards load
  useMemo(() => {
    if (wards.length > 0 && !selectedWardId) {
      setSelectedWardId(wards[0].id);
    }
  }, [wards, selectedWardId]);

  // Filter tariff plans by category
  const activePlan = useMemo(() => {
    return tariffPlans.find((plan) => 
      plan.name.toLowerCase().includes(category) && 
      (!plan.effectiveTo || new Date(plan.effectiveTo) > new Date())
    );
  }, [tariffPlans, category]);

  // Extract tariff slabs from active plan
  const tariffSlabs = useMemo(() => {
    if (!activePlan?.slabs) return [];
    return activePlan.slabs
      .sort((a, b) => a.slabOrder - b.slabOrder)
      .map((slab) => {
        const range = slab.maxConsumption 
          ? `${slab.minConsumption} - ${slab.maxConsumption} m³`
          : `${slab.minConsumption}+ m³`;
        return {
          range,
          rate: `৳${parseFloat(slab.ratePerUnit.toString()).toFixed(2)}`,
        };
      });
  }, [activePlan]);

  // Get selected city, zone, and ward objects
  // const selectedCity = useMemo(() => {
  //   return cityCorporations.find(c => c.id === selectedCityId);
  // }, [cityCorporations, selectedCityId]);

  // const selectedZone = useMemo(() => {
  //   return zones.find(z => z.id === selectedZoneId);
  // }, [zones, selectedZoneId]);

  const selectedWard = useMemo(() => {
    return wards.find(w => w.id === selectedWardId);
  }, [wards, selectedWardId]);

  // Bill calculation mutation
  const calculateBillMutation = useApiMutation(
    (data: { tariffPlanId: number; consumption: number }) => 
      api.waterBills.calculate(data),
    {
      errorMessage: 'Failed to calculate bill',
    }
  );

  const handleCalculate = async () => {
    if (!activePlan || !selectedWardId) {
      return;
    }

    try {
      const result = await calculateBillMutation.mutateAsync({
        tariffPlanId: activePlan.id,
        consumption,
      });
      setCalculationResult(result);
      setCalculated(true);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Calculate example bill (60 m³) - using same logic but with API data
  const exampleConsumption = 60;
  const exampleCalculation = useMemo(() => {
    if (!activePlan?.slabs || !selectedWard) return null;
    
    // Calculate base charge from slabs
    let baseCharge = 0;
    let remaining = exampleConsumption;
    
    activePlan.slabs
      .sort((a, b) => a.slabOrder - b.slabOrder)
      .forEach((slab) => {
        const slabUnits = slab.maxConsumption 
          ? Math.min(remaining, slab.maxConsumption - slab.minConsumption + 1)
          : remaining;
        if (slabUnits > 0) {
          baseCharge += slabUnits * parseFloat(slab.ratePerUnit.toString());
          remaining -= slabUnits;
        }
      });

    // Apply ward multiplier
    const wardMultiplier = selectedWard.tariffMultiplier || 1;
    const subtotal = baseCharge * wardMultiplier;
    const vat = subtotal * 0.15;
    const total = subtotal + vat;

    return {
      baseCharge,
      wardMultiplier: baseCharge * (wardMultiplier - 1),
      subtotal,
      vat,
      total,
    };
  }, [activePlan, selectedWard]);

  // Extract calculation breakdown from API result
  const calculationBreakdown = useMemo(() => {
    if (!calculationResult) return null;
    
    const baseCharge = calculationResult.breakdown?.reduce((sum, item) => sum + item.amount, 0) || calculationResult.totalAmount;
    const wardMultiplier = selectedWard ? (selectedWard.tariffMultiplier - 1) * baseCharge : 0;
    const subtotal = baseCharge + wardMultiplier;
    const vat = subtotal * 0.15;
    const total = subtotal + vat;

    return {
      breakdown: calculationResult.breakdown || [],
      baseCharge,
      wardMultiplier,
      subtotal,
      vat,
      total,
    };
  }, [calculationResult, selectedWard]);

  if (plansLoading || citiesLoading || zonesLoading || wardsLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">Tariff Visualizer</h1>
          <p className="text-sm text-gray-500">Calculate bills based on location and consumption</p>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Location & Category</h3>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                City Corporation
              </Label>
              <select 
                id="city"
                value={selectedCityId || ''}
                onChange={(e) => {
                  const cityId = parseInt(e.target.value);
                  setSelectedCityId(cityId);
                  setSelectedZoneId(null);
                  setSelectedWardId(null);
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
              >
                <option value="">Select City</option>
                {cityCorporations.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zone" className="text-sm font-medium text-gray-700">
                Select Zone
              </Label>
              <select 
                id="zone"
                value={selectedZoneId || ''}
                onChange={(e) => {
                  const zoneId = parseInt(e.target.value);
                  setSelectedZoneId(zoneId);
                  setSelectedWardId(null);
                }}
                disabled={!selectedCityId}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name || zone.zoneNo}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ward" className="text-sm font-medium text-gray-700">
                Select Ward
              </Label>
              <select 
                id="ward"
                value={selectedWardId || ''}
                onChange={(e) => setSelectedWardId(parseInt(e.target.value))}
                disabled={!selectedZoneId}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Ward</option>
                {wards.map((ward) => (
                  <option key={ward.id} value={ward.id}>
                    {ward.name || ward.wardNo}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                Household Category
              </Label>
              <select 
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Consumption Input & Calculate */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Set Consumption & Calculate</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  Consumption (m³)
                </Label>
                <Input
                  type="number"
                  value={consumption}
                  onChange={(e) => setConsumption(Number(e.target.value))}
                  className="w-24 text-center bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                />
              </div>
              <Slider
                value={[consumption]}
                onValueChange={(values) => setConsumption(values[0])}
                min={0}
                max={200}
                step={1}
                className="w-full py-4"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0 m³</span>
                <span>200 m³</span>
              </div>
            </div>

            <Button 
              onClick={handleCalculate}
              disabled={!activePlan || !selectedWardId || calculateBillMutation.isPending}
              className="bg-primary hover:bg-primary-600 text-white rounded-lg h-11 px-8 flex items-center gap-2 w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calculator size={18} />
              {calculateBillMutation.isPending ? 'Calculating...' : 'Calculate Bill'}
            </Button>
          </div>
        </div>

        {/* Example & Tariff Rates - Two Column Row */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Left Column - Example Bill */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Example Bill Calculation</h3>
            <p className="text-sm text-gray-600 mb-4">Example for 60 m³ consumption with current settings:</p>
            
            {exampleCalculation ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm gap-4">
                  <span className="text-gray-600">Base Charge (Tiered)</span>
                  <span className="font-semibold text-gray-900 whitespace-nowrap">৳{exampleCalculation.baseCharge.toFixed(2)}</span>
                </div>
                {selectedWard && (
                  <div className="flex items-center justify-between text-sm gap-4">
                    <span className="text-gray-600">Ward Multiplier ({selectedWard.tariffMultiplier.toFixed(2)}x)</span>
                    <span className="font-semibold text-gray-900 whitespace-nowrap">৳{exampleCalculation.wardMultiplier.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm gap-4">
                  <span className="text-gray-600">VAT (15%)</span>
                  <span className="font-semibold text-gray-900 whitespace-nowrap">৳{exampleCalculation.vat.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2"></div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-semibold text-primary whitespace-nowrap">৳{exampleCalculation.total.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Please select location and category to see example calculation</p>
            )}
          </div>

          {/* Right Column - Tariff Rates */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 whitespace-nowrap">
              {category === 'residential' ? 'Residential' : 'Commercial'} Tariff Rates
            </h3>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-gray-50">
                  <TableHead className="text-sm font-semibold text-gray-700">Consumption Range</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-right">Rate per m³</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tariffSlabs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-gray-500 py-8">
                      No tariff slabs found for {category} category
                    </TableCell>
                  </TableRow>
                ) : (
                  tariffSlabs.map((slab, index) => (
                    <TableRow key={index} className="border-gray-100">
                      <TableCell className="text-sm text-gray-900 font-medium">{slab.range}</TableCell>
                      <TableCell className="text-sm text-gray-600 text-right">{slab.rate}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <p className="text-xs text-gray-500 mt-4">
              Rates are tiered and calculated cumulatively based on total consumption
            </p>
          </div>
        </div>

        {/* Results */}
        {calculated && calculationBreakdown && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill Calculation Breakdown</h3>
            
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {/* Consumption Slabs Table */}
                <div className="px-6 py-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Consumption Breakdown</p>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200 bg-gray-50">
                        <TableHead className="text-sm font-semibold text-gray-700">Slab</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 text-right">Units</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 text-right">Rate</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculationBreakdown.breakdown.length > 0 ? (
                        <>
                          {calculationBreakdown.breakdown.map((item, index) => (
                            <TableRow key={index} className="border-gray-100">
                              <TableCell className="text-sm text-gray-900">{item.slab}</TableCell>
                              <TableCell className="text-sm text-gray-600 text-right">{item.units}</TableCell>
                              <TableCell className="text-sm text-gray-600 text-right">৳{item.rate.toFixed(2)}/m³</TableCell>
                              <TableCell className="text-sm font-semibold text-gray-900 text-right">৳{item.amount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="border-gray-200 bg-gray-50">
                            <TableCell className="text-sm font-semibold text-gray-900" colSpan={3}>Base Charge</TableCell>
                            <TableCell className="text-sm font-semibold text-gray-900 text-right">৳{calculationBreakdown.baseCharge.toFixed(2)}</TableCell>
                          </TableRow>
                        </>
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                            No breakdown available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Location Multipliers Table */}
                {selectedWard && calculationBreakdown.wardMultiplier > 0 && (
                  <div className="px-6 py-4 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Location Multipliers</p>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200 bg-gray-50">
                          <TableHead className="text-sm font-semibold text-gray-700">Location</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 text-right">Multiplier</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="border-gray-100">
                          <TableCell className="text-sm text-gray-900">{selectedWard.name || selectedWard.wardNo}</TableCell>
                          <TableCell className="text-sm text-gray-600 text-right">{selectedWard.tariffMultiplier.toFixed(2)}x</TableCell>
                          <TableCell className="text-sm font-semibold text-gray-900 text-right">৳{calculationBreakdown.wardMultiplier.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* VAT */}
                <div className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">VAT</p>
                    <p className="text-xs text-gray-500 mt-0.5">15% tax</p>
                  </div>
                  <p className="text-base font-semibold text-gray-900">৳{calculationBreakdown.vat.toFixed(2)}</p>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between px-6 py-5 bg-blue-50">
                  <p className="font-semibold text-gray-900">Total Amount</p>
                  <p className="text-2xl font-semibold text-primary">৳{calculationBreakdown.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


