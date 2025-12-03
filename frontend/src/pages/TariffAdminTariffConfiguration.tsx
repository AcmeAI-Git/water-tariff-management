import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Edit, Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';

export function TariffAdminTariffConfiguration() {
  const [activeTab, setActiveTab] = useState<'residential' | 'commercial' | 'ward-multipliers' | 'zone-categories'>('residential');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ruleType, setRuleType] = useState<'tariff-slab' | 'ward-multiplier' | 'zone-category'>('tariff-slab');
  
  // Form states for Tariff Slab
  const [slabType, setSlabType] = useState('residential');
  const [minConsumption, setMinConsumption] = useState('');
  const [maxConsumption, setMaxConsumption] = useState('');
  const [baseRate, setBaseRate] = useState('');
  const [vatPercentage, setVatPercentage] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState<Date | undefined>(undefined);
  
  // Form states for Ward Multiplier
  const [selectedWard, setSelectedWard] = useState('');
  const [newMultiplier, setNewMultiplier] = useState('');
  
  // Form states for Zone Category
  const [selectedZone, setSelectedZone] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Reset form fields
    setRuleType('tariff-slab');
    setSlabType('residential');
    setMinConsumption('');
    setMaxConsumption('');
    setBaseRate('');
    setVatPercentage('');
    setEffectiveFrom(undefined);
    setSelectedWard('');
    setNewMultiplier('');
    setSelectedZone('');
    setNewCategory('');
  };

  const handleSubmit = () => {
    // Handle form submission based on rule type
    console.log('Submitting:', { ruleType, slabType, minConsumption, maxConsumption, baseRate, vatPercentage, effectiveFrom });
    handleModalClose();
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return null;
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const residentialSlabs = [
    {
      id: 1,
      minConsumption: 0,
      maxConsumption: 10,
      baseRate: 8.5,
      effectiveFrom: '2024-01-01'
    },
    {
      id: 2,
      minConsumption: 11,
      maxConsumption: 20,
      baseRate: 12.0,
      effectiveFrom: '2024-01-01'
    },
    {
      id: 3,
      minConsumption: 21,
      maxConsumption: 50,
      baseRate: 18.5,
      effectiveFrom: '2024-01-01'
    },
    {
      id: 4,
      minConsumption: 51,
      maxConsumption: null,
      baseRate: 25.0,
      effectiveFrom: '2024-01-01'
    },
  ];

  const commercialSlabs = [
    {
      id: 1,
      minConsumption: 0,
      maxConsumption: 10,
      baseRate: 15.0,
      effectiveFrom: '2024-01-01'
    },
    {
      id: 2,
      minConsumption: 11,
      maxConsumption: 30,
      baseRate: 22.5,
      effectiveFrom: '2024-01-01'
    },
    {
      id: 3,
      minConsumption: 31,
      maxConsumption: null,
      baseRate: 35.0,
      effectiveFrom: '2024-01-01'
    },
  ];

  const wardMultipliers = [
    { id: 1, wardName: 'Ward 1', multiplier: 1.0 },
    { id: 2, wardName: 'Ward 2', multiplier: 1.05 },
    { id: 3, wardName: 'Ward 3', multiplier: 0.95 },
    { id: 4, wardName: 'Ward 4', multiplier: 1.10 },
    { id: 5, wardName: 'Ward 5', multiplier: 1.02 },
  ];

  const zoneCategories = [
    { id: 1, zoneName: 'Zone A', category: 'Urban High' },
    { id: 2, zoneName: 'Zone B', category: 'Urban Standard' },
    { id: 3, zoneName: 'Zone C', category: 'Suburban' },
    { id: 4, zoneName: 'Zone D', category: 'Rural' },
  ];

  const formatRange = (min: number, max: number | null) => {
    if (max === null) {
      return `${min}+ m³`;
    }
    return `${min}-${max} m³`;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-gray-900 mb-1">Tariff Configuration</h1>
          <p className="text-sm text-gray-500">Manage tariff rules, slabs, and multipliers</p>
        </div>

        {/* Add Button */}
        <div className="mb-6">
          <Button 
            onClick={handleModalOpen}
            className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-11 px-6 flex items-center gap-2"
          >
            <Plus size={18} />
            Add New Tariff Rule
          </Button>
        </div>

        {/* Add New Tariff Rule Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Add New Tariff Rule</DialogTitle>
            </DialogHeader>

            <div className="py-4">
              {/* Rule Type Selector - Full Width */}
              <div className="space-y-2 mb-6">
                <Label htmlFor="rule-type" className="text-sm font-medium text-gray-700">
                  Select Rule Type
                </Label>
                <Select value={ruleType} onValueChange={(value: any) => setRuleType(value)}>
                  <SelectTrigger className="w-full border-gray-300 rounded-lg h-11">
                    <SelectValue placeholder="Select rule type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tariff-slab">Tariff Slab</SelectItem>
                    <SelectItem value="ward-multiplier">Ward Multiplier</SelectItem>
                    <SelectItem value="zone-category">Zone Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Form Fields Based on Rule Type */}
              
              {/* Tariff Slab Fields - Two Column Grid */}
              {ruleType === 'tariff-slab' && (
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="slab-type" className="text-sm font-medium text-gray-700">
                      Slab Type
                    </Label>
                    <Select value={slabType} onValueChange={setSlabType}>
                      <SelectTrigger className="w-full border-gray-300 rounded-lg h-11">
                        <SelectValue placeholder="Select slab type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vat" className="text-sm font-medium text-gray-700">
                      VAT (%)
                    </Label>
                    <Input
                      id="vat"
                      type="number"
                      step="0.01"
                      placeholder="Enter VAT percentage"
                      value={vatPercentage}
                      onChange={(e) => setVatPercentage(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min-consumption" className="text-sm font-medium text-gray-700">
                      Min Consumption (m³)
                    </Label>
                    <Input
                      id="min-consumption"
                      type="number"
                      placeholder="Enter minimum consumption"
                      value={minConsumption}
                      onChange={(e) => setMinConsumption(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-consumption" className="text-sm font-medium text-gray-700">
                      Max Consumption (m³)
                    </Label>
                    <Input
                      id="max-consumption"
                      type="number"
                      placeholder="Enter maximum consumption"
                      value={maxConsumption}
                      onChange={(e) => setMaxConsumption(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="base-rate" className="text-sm font-medium text-gray-700">
                      Base Rate (BDT/m³)
                    </Label>
                    <Input
                      id="base-rate"
                      type="number"
                      step="0.01"
                      placeholder="Enter base rate"
                      value={baseRate}
                      onChange={(e) => setBaseRate(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Effective From
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left border-gray-300 rounded-lg h-11 bg-white hover:bg-gray-50"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {effectiveFrom ? formatDate(effectiveFrom) : <span className="text-gray-500">Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={effectiveFrom}
                          onSelect={setEffectiveFrom}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Ward Multiplier Fields - Two Column Grid */}
              {ruleType === 'ward-multiplier' && (
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="select-ward" className="text-sm font-medium text-gray-700">
                      Select Ward
                    </Label>
                    <Select value={selectedWard} onValueChange={setSelectedWard}>
                      <SelectTrigger className="w-full border-gray-300 rounded-lg h-11">
                        <SelectValue placeholder="Select ward" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ward-1">Ward 1</SelectItem>
                        <SelectItem value="ward-2">Ward 2</SelectItem>
                        <SelectItem value="ward-3">Ward 3</SelectItem>
                        <SelectItem value="ward-4">Ward 4</SelectItem>
                        <SelectItem value="ward-5">Ward 5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-multiplier" className="text-sm font-medium text-gray-700">
                      New Multiplier
                    </Label>
                    <Input
                      id="new-multiplier"
                      type="number"
                      step="0.01"
                      placeholder="Enter multiplier (e.g., 1.05)"
                      value={newMultiplier}
                      onChange={(e) => setNewMultiplier(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Effective From
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left border-gray-300 rounded-lg h-11 bg-white hover:bg-gray-50"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {effectiveFrom ? formatDate(effectiveFrom) : <span className="text-gray-500">Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={effectiveFrom}
                          onSelect={setEffectiveFrom}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Zone Category Fields - Two Column Grid */}
              {ruleType === 'zone-category' && (
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="select-zone" className="text-sm font-medium text-gray-700">
                      Select Zone
                    </Label>
                    <Select value={selectedZone} onValueChange={setSelectedZone}>
                      <SelectTrigger className="w-full border-gray-300 rounded-lg h-11">
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zone-a">Zone A</SelectItem>
                        <SelectItem value="zone-b">Zone B</SelectItem>
                        <SelectItem value="zone-c">Zone C</SelectItem>
                        <SelectItem value="zone-d">Zone D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-category" className="text-sm font-medium text-gray-700">
                      New Category
                    </Label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger className="w-full border-gray-300 rounded-lg h-11">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Effective From
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left border-gray-300 rounded-lg h-11 bg-white hover:bg-gray-50"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {effectiveFrom ? formatDate(effectiveFrom) : <span className="text-gray-500">Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={effectiveFrom}
                          onSelect={setEffectiveFrom}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleModalClose}
                className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6"
              >
                Add Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('residential')}
              className={`pb-3 text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === 'residential'
                  ? 'border-[#4C6EF5] text-[#4C6EF5]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Residential Slabs
            </button>
            <button
              onClick={() => setActiveTab('commercial')}
              className={`pb-3 text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === 'commercial'
                  ? 'border-[#4C6EF5] text-[#4C6EF5]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Commercial Slabs
            </button>
            <button
              onClick={() => setActiveTab('ward-multipliers')}
              className={`pb-3 text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === 'ward-multipliers'
                  ? 'border-[#4C6EF5] text-[#4C6EF5]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Ward Multipliers
            </button>
            <button
              onClick={() => setActiveTab('zone-categories')}
              className={`pb-3 text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === 'zone-categories'
                  ? 'border-[#4C6EF5] text-[#4C6EF5]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Zone Categories
            </button>
          </div>
        </div>

          {/* Residential Slabs */}
          {activeTab === 'residential' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Current Residential Tariff Slabs</h3>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 bg-gray-50">
                    <TableHead className="text-sm font-semibold text-gray-700">Range (m³)</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700">Base Rate (BDT/m³)</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700">Effective From</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {residentialSlabs.map((slab) => (
                    <TableRow key={slab.id} className="border-gray-100">
                      <TableCell className="text-sm font-medium text-gray-900">
                        {formatRange(slab.minConsumption, slab.maxConsumption)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">৳{slab.baseRate.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-gray-600">{slab.effectiveFrom}</TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-gray-300 text-gray-700 rounded-lg h-8 px-3 bg-white hover:bg-gray-50 inline-flex items-center gap-1.5"
                        >
                          <Edit size={14} />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Commercial Slabs */}
          {activeTab === 'commercial' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Current Commercial Tariff Slabs</h3>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 bg-gray-50">
                    <TableHead className="text-sm font-semibold text-gray-700">Range (m³)</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700">Base Rate (BDT/m³)</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700">Effective From</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commercialSlabs.map((slab) => (
                    <TableRow key={slab.id} className="border-gray-100">
                      <TableCell className="text-sm font-medium text-gray-900">
                        {formatRange(slab.minConsumption, slab.maxConsumption)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">৳{slab.baseRate.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-gray-600">{slab.effectiveFrom}</TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-gray-300 text-gray-700 rounded-lg h-8 px-3 bg-white hover:bg-gray-50 inline-flex items-center gap-1.5"
                        >
                          <Edit size={14} />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Ward Multipliers */}
          {activeTab === 'ward-multipliers' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Current Ward Multipliers</h3>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 bg-gray-50">
                    <TableHead className="text-sm font-semibold text-gray-700">Ward Name</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700">Multiplier</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wardMultipliers.map((ward) => (
                    <TableRow key={ward.id} className="border-gray-100">
                      <TableCell className="text-sm font-medium text-gray-900">{ward.wardName}</TableCell>
                      <TableCell className="text-sm text-gray-600">{ward.multiplier.toFixed(2)}x</TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-gray-300 text-gray-700 rounded-lg h-8 px-3 bg-white hover:bg-gray-50 inline-flex items-center gap-1.5"
                        >
                          <Edit size={14} />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Zone Categories */}
          {activeTab === 'zone-categories' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Current Zone Categories</h3>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 bg-gray-50">
                    <TableHead className="text-sm font-semibold text-gray-700">Zone Name</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700">Category</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zoneCategories.map((zone) => (
                    <TableRow key={zone.id} className="border-gray-100">
                      <TableCell className="text-sm font-medium text-gray-900">{zone.zoneName}</TableCell>
                      <TableCell className="text-sm text-gray-600">{zone.category}</TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-gray-300 text-gray-700 rounded-lg h-8 px-3 bg-white hover:bg-gray-50 inline-flex items-center gap-1.5"
                        >
                          <Edit size={14} />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
      </div>
    </div>
  );
}
