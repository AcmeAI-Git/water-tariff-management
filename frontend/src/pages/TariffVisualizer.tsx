import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Calculator } from 'lucide-react';
import { useState } from 'react';

export default function TariffVisualizer() {
  const [consumption, setConsumption] = useState(60);
  const [category, setCategory] = useState('residential');
  const [calculated, setCalculated] = useState(false);

  const handleCalculate = () => {
    setCalculated(true);
  };

  // Tariff rates based on category
  const rates = category === 'residential' 
    ? { slab1: 12, slab2: 18, slab3: 25, slab4: 35 }
    : { slab1: 20, slab2: 28, slab3: 38, slab4: 50 };

  const tariffSlabs = category === 'residential'
    ? [
        { range: '0 - 10 m³', rate: '৳12.00' },
        { range: '11 - 20 m³', rate: '৳18.00' },
        { range: '21 - 30 m³', rate: '৳25.00' },
        { range: '31+ m³', rate: '৳35.00' },
      ]
    : [
        { range: '0 - 10 m³', rate: '৳20.00' },
        { range: '11 - 20 m³', rate: '৳28.00' },
        { range: '21 - 30 m³', rate: '৳38.00' },
        { range: '31+ m³', rate: '৳50.00' },
      ];

  // Mock calculation
  const consumptionNum = consumption;
  const slab1 = Math.min(consumptionNum, 10) * rates.slab1;
  const slab2 = Math.min(Math.max(consumptionNum - 10, 0), 10) * rates.slab2;
  const slab3 = Math.min(Math.max(consumptionNum - 20, 0), 10) * rates.slab3;
  const slab4 = Math.max(consumptionNum - 30, 0) * rates.slab4;
  const baseCharge = slab1 + slab2 + slab3 + slab4;
  
  // Multipliers
  const cityMultiplier = baseCharge * 0.05; // 5% city multiplier
  const zoneMultiplier = baseCharge * 0.03; // 3% zone multiplier
  const wardMultiplier = baseCharge * 0.02; // 2% ward multiplier
  
  const subtotal = baseCharge + cityMultiplier + zoneMultiplier + wardMultiplier;
  const vat = subtotal * 0.15;
  const total = subtotal + vat;

  // Example calculation (60 m³)
  const exampleConsumption = 60;
  const exampleSlab1 = Math.min(exampleConsumption, 10) * rates.slab1;
  const exampleSlab2 = Math.min(Math.max(exampleConsumption - 10, 0), 10) * rates.slab2;
  const exampleSlab3 = Math.min(Math.max(exampleConsumption - 20, 0), 10) * rates.slab3;
  const exampleSlab4 = Math.max(exampleConsumption - 30, 0) * rates.slab4;
  const exampleBaseCharge = exampleSlab1 + exampleSlab2 + exampleSlab3 + exampleSlab4;
  const exampleCityMultiplier = exampleBaseCharge * 0.05;
  const exampleZoneMultiplier = exampleBaseCharge * 0.03;
  const exampleWardMultiplier = exampleBaseCharge * 0.02;
  const exampleSubtotal = exampleBaseCharge + exampleCityMultiplier + exampleZoneMultiplier + exampleWardMultiplier;
  const exampleVat = exampleSubtotal * 0.15;
  const exampleTotal = exampleSubtotal + exampleVat;

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
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
              >
                <option>Dhaka</option>
                <option>Chittagong</option>
                <option>Khulna</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zone" className="text-sm font-medium text-gray-700">
                Select Zone
              </Label>
              <select 
                id="zone"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
              >
                <option>1</option>
                <option>2</option>
                <option>3</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ward" className="text-sm font-medium text-gray-700">
                Select Ward
              </Label>
              <select 
                id="ward"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
              >
                <option>3</option>
                <option>1</option>
                <option>2</option>
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
              className="bg-primary hover:bg-primary-600 text-white rounded-lg h-11 px-8 flex items-center gap-2 w-full justify-center"
            >
              <Calculator size={18} />
              Calculate Bill
            </Button>
          </div>
        </div>

        {/* Example & Tariff Rates - Two Column Row */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Left Column - Example Bill */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Example Bill Calculation</h3>
            <p className="text-sm text-gray-600 mb-4">Example for 60 m³ consumption with current settings:</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm gap-4">
                <span className="text-gray-600">Base Charge (Tiered)</span>
                <span className="font-semibold text-gray-900 whitespace-nowrap">৳{exampleBaseCharge.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-4">
                <span className="text-gray-600">City Multiplier (1.05x)</span>
                <span className="font-semibold text-gray-900 whitespace-nowrap">৳{exampleCityMultiplier.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-4">
                <span className="text-gray-600">Zone Multiplier (1.03x)</span>
                <span className="font-semibold text-gray-900 whitespace-nowrap">৳{exampleZoneMultiplier.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-4">
                <span className="text-gray-600">Ward Multiplier (1.02x)</span>
                <span className="font-semibold text-gray-900 whitespace-nowrap">৳{exampleWardMultiplier.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-4">
                <span className="text-gray-600">VAT (15%)</span>
                <span className="font-semibold text-gray-900 whitespace-nowrap">৳{exampleVat.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2"></div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-semibold text-primary whitespace-nowrap">৳{exampleTotal.toFixed(2)}</span>
              </div>
            </div>
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
                {tariffSlabs.map((slab, index) => (
                  <TableRow key={index} className="border-gray-100">
                    <TableCell className="text-sm text-gray-900 font-medium">{slab.range}</TableCell>
                    <TableCell className="text-sm text-gray-600 text-right">{slab.rate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-gray-500 mt-4">
              Rates are tiered and calculated cumulatively based on total consumption
            </p>
          </div>
        </div>

        {/* Results */}
        {calculated && (
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
                        <TableHead className="text-sm font-semibold text-gray-700 text-right">Rate</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slab1 > 0 && (
                        <TableRow className="border-gray-100">
                          <TableCell className="text-sm text-gray-900">0-10 m³</TableCell>
                          <TableCell className="text-sm text-gray-600 text-right">৳{rates.slab1.toFixed(2)}/m³</TableCell>
                          <TableCell className="text-sm font-semibold text-gray-900 text-right">৳{slab1.toFixed(2)}</TableCell>
                        </TableRow>
                      )}
                      {slab2 > 0 && (
                        <TableRow className="border-gray-100">
                          <TableCell className="text-sm text-gray-900">11-20 m³</TableCell>
                          <TableCell className="text-sm text-gray-600 text-right">৳{rates.slab2.toFixed(2)}/m³</TableCell>
                          <TableCell className="text-sm font-semibold text-gray-900 text-right">৳{slab2.toFixed(2)}</TableCell>
                        </TableRow>
                      )}
                      {slab3 > 0 && (
                        <TableRow className="border-gray-100">
                          <TableCell className="text-sm text-gray-900">21-30 m³</TableCell>
                          <TableCell className="text-sm text-gray-600 text-right">৳{rates.slab3.toFixed(2)}/m³</TableCell>
                          <TableCell className="text-sm font-semibold text-gray-900 text-right">৳{slab3.toFixed(2)}</TableCell>
                        </TableRow>
                      )}
                      {slab4 > 0 && (
                        <TableRow className="border-gray-100">
                          <TableCell className="text-sm text-gray-900">31+ m³</TableCell>
                          <TableCell className="text-sm text-gray-600 text-right">৳{rates.slab4.toFixed(2)}/m³</TableCell>
                          <TableCell className="text-sm font-semibold text-gray-900 text-right">৳{slab4.toFixed(2)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="border-gray-200 bg-gray-50">
                        <TableCell className="text-sm font-semibold text-gray-900" colSpan={2}>Base Charge</TableCell>
                        <TableCell className="text-sm font-semibold text-gray-900 text-right">৳{baseCharge.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Location Multipliers Table */}
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
                        <TableCell className="text-sm text-gray-900">Dhaka City Corporation</TableCell>
                        <TableCell className="text-sm text-gray-600 text-right">1.05x</TableCell>
                        <TableCell className="text-sm font-semibold text-gray-900 text-right">৳{cityMultiplier.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow className="border-gray-100">
                        <TableCell className="text-sm text-gray-900">Zone 1</TableCell>
                        <TableCell className="text-sm text-gray-600 text-right">1.03x</TableCell>
                        <TableCell className="text-sm font-semibold text-gray-900 text-right">৳{zoneMultiplier.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow className="border-gray-100">
                        <TableCell className="text-sm text-gray-900">Ward 3</TableCell>
                        <TableCell className="text-sm text-gray-600 text-right">1.02x</TableCell>
                        <TableCell className="text-sm font-semibold text-gray-900 text-right">৳{wardMultiplier.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* VAT */}
                <div className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">VAT</p>
                    <p className="text-xs text-gray-500 mt-0.5">15% tax</p>
                  </div>
                  <p className="text-base font-semibold text-gray-900">৳{vat.toFixed(2)}</p>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between px-6 py-5 bg-blue-50">
                  <p className="font-semibold text-gray-900">Total Amount</p>
                  <p className="text-2xl font-semibold text-primary">৳{total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


