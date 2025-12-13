import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Edit, Calendar as CalendarIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { api } from '../services/api';
import { useApiQuery, useApiMutation, useAdminId } from '../hooks/useApiQuery';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { cn } from '../utils/utils';
import type { TariffPlan, Ward, Zone } from '../types';

export function TariffAdminTariffConfiguration() {
  const [activeTab, setActiveTab] = useState<'residential' | 'commercial' | 'ward-multipliers' | 'zone-categories'>('residential');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ruleType, setRuleType] = useState<'tariff-slab' | 'ward-multiplier' | 'zone-category'>('tariff-slab');
  const adminId = useAdminId();
  
  // Form states for Tariff Plan (multiple slabs)
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [slabType, setSlabType] = useState('residential');
  const [slabs, setSlabs] = useState<Array<{ minConsumption: string; maxConsumption: string; ratePerUnit: string; slabOrder: number }>>([]);
  const [effectiveFrom, setEffectiveFrom] = useState<Date | undefined>(undefined);
  const [effectiveTo, setEffectiveTo] = useState<Date | undefined>(undefined);
  
  // Form states for Ward Multiplier
  const [selectedWard, setSelectedWard] = useState('');
  const [newMultiplier, setNewMultiplier] = useState('');
  
  // Form states for Zone Category
  const [selectedZone, setSelectedZone] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Fetch tariff plans
  const { data: tariffPlansData, isLoading: plansLoading } = useApiQuery<TariffPlan[]>(
    ['tariff-plans'],
    () => api.tariffPlans.getAll()
  );
  const tariffPlans: TariffPlan[] = (tariffPlansData ?? []) as TariffPlan[];

  // Fetch wards
  const { data: wardsData, isLoading: wardsLoading } = useApiQuery<Ward[]>(
    ['wards'],
    () => api.wards.getAll()
  );
  const wards: Ward[] = (wardsData ?? []) as Ward[];

  // Fetch zones
  const { data: zonesData, isLoading: zonesLoading } = useApiQuery<Zone[]>(
    ['zones'],
    () => api.zones.getAll()
  );
  const zones: Zone[] = (zonesData ?? []) as Zone[];

  // Create tariff plan mutation
  const createTariffPlanMutation = useApiMutation(
    (data: Parameters<typeof api.tariffPlans.create>[0]) => api.tariffPlans.create(data),
    {
      successMessage: 'Tariff plan created successfully',
      errorMessage: 'Failed to create tariff plan',
      invalidateQueries: [['tariff-plans']],
    }
  );

  // Update ward mutation
  const updateWardMutation = useApiMutation(
    ({ id, data }: { id: number; data: Parameters<typeof api.wards.update>[1] }) => api.wards.update(id, data),
    {
      successMessage: 'Ward multiplier updated successfully',
      errorMessage: 'Failed to update ward multiplier',
      invalidateQueries: [['wards']],
    }
  );

  // Update zone mutation
  const updateZoneMutation = useApiMutation(
    ({ id, data }: { id: number; data: Parameters<typeof api.zones.update>[1] }) => api.zones.update(id, data),
    {
      successMessage: 'Zone category updated successfully',
      errorMessage: 'Failed to update zone category',
      invalidateQueries: [['zones']],
    }
  );

  // Filter active tariff plans by type
  const residentialPlans = useMemo(() => {
    return tariffPlans.filter((plan: TariffPlan) => 
      plan.name.toLowerCase().includes('residential') && 
      (!plan.effectiveTo || new Date(plan.effectiveTo) > new Date())
    );
  }, [tariffPlans]);

  const commercialPlans = useMemo(() => {
    return tariffPlans.filter((plan: TariffPlan) => 
      plan.name.toLowerCase().includes('commercial') && 
      (!plan.effectiveTo || new Date(plan.effectiveTo) > new Date())
    );
  }, [tariffPlans]);

  // Extract slabs from plans
  const residentialSlabs = useMemo(() => {
    const allSlabs: Array<{ id: string; minConsumption: number; maxConsumption: number | null; baseRate: number; effectiveFrom: string; planId: number }> = [];
    residentialPlans.forEach((plan: TariffPlan) => {
      if (plan.slabs) {
        plan.slabs.forEach((slab) => {
          allSlabs.push({
            id: `${plan.id}-${slab.id}`,
            minConsumption: slab.minConsumption,
            maxConsumption: slab.maxConsumption,
            baseRate: parseFloat(slab.ratePerUnit.toString()),
            effectiveFrom: plan.effectiveFrom,
            planId: plan.id,
          });
        });
      }
    });
    return allSlabs.sort((a, b) => a.minConsumption - b.minConsumption);
  }, [residentialPlans]);

  const commercialSlabs = useMemo(() => {
    const allSlabs: Array<{ id: string; minConsumption: number; maxConsumption: number | null; baseRate: number; effectiveFrom: string; planId: number }> = [];
    commercialPlans.forEach((plan: TariffPlan) => {
      if (plan.slabs) {
        plan.slabs.forEach((slab) => {
          allSlabs.push({
            id: `${plan.id}-${slab.id}`,
            minConsumption: slab.minConsumption,
            maxConsumption: slab.maxConsumption,
            baseRate: parseFloat(slab.ratePerUnit.toString()),
            effectiveFrom: plan.effectiveFrom,
            planId: plan.id,
          });
        });
      }
    });
    return allSlabs.sort((a, b) => a.minConsumption - b.minConsumption);
  }, [commercialPlans]);

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setRuleType('tariff-slab');
    setSlabType('residential');
    setPlanName('');
    setPlanDescription('');
    setSlabs([]);
    setEffectiveFrom(undefined);
    setEffectiveTo(undefined);
    setSelectedWard('');
    setNewMultiplier('');
    setSelectedZone('');
    setNewCategory('');
  };

  const addSlab = () => {
    setSlabs([...slabs, { minConsumption: '', maxConsumption: '', ratePerUnit: '', slabOrder: slabs.length + 1 }]);
  };

  const removeSlab = (index: number) => {
    setSlabs(slabs.filter((_, i) => i !== index).map((slab, i) => ({ ...slab, slabOrder: i + 1 })));
  };

  const updateSlab = (index: number, field: string, value: string) => {
    const updated = [...slabs];
    updated[index] = { ...updated[index], [field]: value };
    setSlabs(updated);
  };

  const handleSubmit = async () => {
    if (!adminId) {
      alert('Admin ID not found. Please log in again.');
      return;
    }

    if (ruleType === 'tariff-slab') {
      if (!planName || !effectiveFrom || slabs.length === 0) {
        alert('Please fill in plan name, effective date, and add at least one slab');
        return;
      }

      // Validate slabs
      const validatedSlabs = slabs.map((slab, index) => {
        const min = parseInt(slab.minConsumption);
        const max = slab.maxConsumption ? parseInt(slab.maxConsumption) : null;
        const rate = parseFloat(slab.ratePerUnit);

        if (isNaN(min) || isNaN(rate) || rate <= 0) {
          throw new Error(`Invalid slab ${index + 1} data`);
        }

        return {
          minConsumption: min,
          maxConsumption: max,
          ratePerUnit: rate,
          slabOrder: index + 1,
        };
      });

      await createTariffPlanMutation.mutateAsync({
        name: `${slabType === 'residential' ? 'Residential' : 'Commercial'} ${planName}`,
        description: planDescription || undefined,
        createdBy: adminId,
        effectiveFrom: format(effectiveFrom, 'yyyy-MM-dd'),
        effectiveTo: effectiveTo ? format(effectiveTo, 'yyyy-MM-dd') : undefined,
        slabs: validatedSlabs,
      });
    } else if (ruleType === 'ward-multiplier') {
      if (!selectedWard || !newMultiplier) {
        alert('Please select a ward and enter a multiplier');
        return;
      }

      const wardId = parseInt(selectedWard);
      const multiplier = parseFloat(newMultiplier);

      if (isNaN(wardId) || isNaN(multiplier) || multiplier <= 0) {
        alert('Invalid multiplier value');
        return;
      }

      await updateWardMutation.mutateAsync({
        id: wardId,
        data: { tariffMultiplier: multiplier },
      });
    } else if (ruleType === 'zone-category') {
      if (!selectedZone || !newCategory) {
        alert('Please select a zone and enter a category');
        return;
      }

      const zoneId = parseInt(selectedZone);

      if (isNaN(zoneId)) {
        alert('Invalid zone selection');
        return;
      }

      await updateZoneMutation.mutateAsync({
        id: zoneId,
        data: { tariffCategory: newCategory },
      });
    }

    handleModalClose();
  };

  const formatRange = (min: number, max: number | null) => {
    if (max === null) {
      return `${min}+ m³`;
    }
    return `${min}-${max} m³`;
  };

  if (plansLoading || wardsLoading || zonesLoading) {
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
          <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Add New Tariff Rule</DialogTitle>
            </DialogHeader>

            <div className="py-4">
              {/* Rule Type Selector */}
              <div className="space-y-2 mb-6">
                <Label htmlFor="rule-type" className="text-sm font-medium text-gray-700">
                  Select Rule Type
                </Label>
                <Select value={ruleType} onValueChange={(value: 'tariff-slab' | 'ward-multiplier' | 'zone-category') => setRuleType(value)}>
                  <SelectTrigger className="w-full border-gray-300 rounded-lg h-11">
                    <SelectValue placeholder="Select rule type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tariff-slab">Tariff Plan with Slabs</SelectItem>
                    <SelectItem value="ward-multiplier">Ward Multiplier</SelectItem>
                    <SelectItem value="zone-category">Zone Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tariff Plan with Slabs */}
              {ruleType === 'tariff-slab' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plan-name" className="text-sm font-medium text-gray-700">
                        Plan Name *
                      </Label>
                      <Input
                        id="plan-name"
                        placeholder="e.g., Tariff 2025"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        className="border-gray-300 rounded-lg h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slab-type" className="text-sm font-medium text-gray-700">
                        Plan Type *
                      </Label>
                      <Select value={slabType} onValueChange={setSlabType}>
                        <SelectTrigger className="w-full border-gray-300 rounded-lg h-11">
                          <SelectValue placeholder="Select plan type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="residential">Residential</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan-description" className="text-sm font-medium text-gray-700">
                      Description
                    </Label>
                    <Input
                      id="plan-description"
                      placeholder="Optional description"
                      value={planDescription}
                      onChange={(e) => setPlanDescription(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Effective From *
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left border-gray-300 rounded-lg h-11 bg-white hover:bg-gray-50",
                              !effectiveFrom && "text-gray-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {effectiveFrom ? format(effectiveFrom, "PPP") : "Pick a date"}
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

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Effective To (Optional)
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left border-gray-300 rounded-lg h-11 bg-white hover:bg-gray-50",
                              !effectiveTo && "text-gray-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {effectiveTo ? format(effectiveTo, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={effectiveTo}
                            onSelect={setEffectiveTo}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Slabs Management */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">
                        Tariff Slabs *
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSlab}
                        className="h-8"
                      >
                        <Plus size={14} className="mr-1" />
                        Add Slab
                      </Button>
                    </div>
                    {slabs.map((slab, index) => (
                      <div key={index} className="grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg">
                        <Input
                          placeholder="Min (m³)"
                          type="number"
                          value={slab.minConsumption}
                          onChange={(e) => updateSlab(index, 'minConsumption', e.target.value)}
                          className="h-9"
                        />
                        <Input
                          placeholder="Max (m³)"
                          type="number"
                          value={slab.maxConsumption}
                          onChange={(e) => updateSlab(index, 'maxConsumption', e.target.value)}
                          className="h-9"
                        />
                        <Input
                          placeholder="Rate (BDT/m³)"
                          type="number"
                          step="0.01"
                          value={slab.ratePerUnit}
                          onChange={(e) => updateSlab(index, 'ratePerUnit', e.target.value)}
                          className="h-9"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSlab(index)}
                          className="h-9 text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    {slabs.length === 0 && (
                      <p className="text-sm text-gray-500">Click "Add Slab" to add tariff slabs</p>
                    )}
                  </div>
                </div>
              )}

              {/* Ward Multiplier */}
              {ruleType === 'ward-multiplier' && (
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="select-ward" className="text-sm font-medium text-gray-700">
                      Select Ward *
                    </Label>
                    <Select value={selectedWard} onValueChange={setSelectedWard}>
                      <SelectTrigger className="w-full border-gray-300 rounded-lg h-11">
                        <SelectValue placeholder="Select ward" />
                      </SelectTrigger>
                      <SelectContent>
                        {wards.map((ward: Ward) => (
                          <SelectItem key={ward.id} value={ward.id.toString()}>
                            {ward.name || ward.wardNo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-multiplier" className="text-sm font-medium text-gray-700">
                      New Multiplier *
                    </Label>
                    <Input
                      id="new-multiplier"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 1.05"
                      value={newMultiplier}
                      onChange={(e) => setNewMultiplier(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                </div>
              )}

              {/* Zone Category */}
              {ruleType === 'zone-category' && (
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="select-zone" className="text-sm font-medium text-gray-700">
                      Select Zone *
                    </Label>
                    <Select value={selectedZone} onValueChange={setSelectedZone}>
                      <SelectTrigger className="w-full border-gray-300 rounded-lg h-11">
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((zone: Zone) => (
                          <SelectItem key={zone.id} value={zone.id.toString()}>
                            {zone.name || zone.zoneNo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-category" className="text-sm font-medium text-gray-700">
                      New Category *
                    </Label>
                    <Input
                      id="new-category"
                      placeholder="e.g., Urban High"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="border-gray-300 rounded-lg h-11"
                    />
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
                disabled={
                  createTariffPlanMutation.isPending ||
                  updateWardMutation.isPending ||
                  updateZoneMutation.isPending
                }
                className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
              >
                {createTariffPlanMutation.isPending || updateWardMutation.isPending || updateZoneMutation.isPending
                  ? 'Saving...'
                  : 'Add Rule'}
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
                {residentialSlabs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      No residential tariff slabs found
                    </TableCell>
                  </TableRow>
                ) : (
                  residentialSlabs.map((slab) => (
                    <TableRow key={slab.id} className="border-gray-100">
                      <TableCell className="text-sm font-medium text-gray-900">
                        {formatRange(slab.minConsumption, slab.maxConsumption)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">৳{slab.baseRate.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(slab.effectiveFrom).toLocaleDateString('en-US')}
                      </TableCell>
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
                  ))
                )}
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
                {commercialSlabs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      No commercial tariff slabs found
                    </TableCell>
                  </TableRow>
                ) : (
                  commercialSlabs.map((slab) => (
                    <TableRow key={slab.id} className="border-gray-100">
                      <TableCell className="text-sm font-medium text-gray-900">
                        {formatRange(slab.minConsumption, slab.maxConsumption)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">৳{slab.baseRate.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(slab.effectiveFrom).toLocaleDateString('en-US')}
                      </TableCell>
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
                  ))
                )}
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
                {wards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                      No wards found
                    </TableCell>
                  </TableRow>
                ) : (
                  wards.map((ward: Ward) => (
                    <TableRow key={ward.id} className="border-gray-100">
                      <TableCell className="text-sm font-medium text-gray-900">
                        {ward.name || ward.wardNo}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {(() => {
                          const multiplier = typeof ward.tariffMultiplier === 'number' 
                            ? ward.tariffMultiplier 
                            : Number(ward.tariffMultiplier) || 1;
                          return multiplier.toFixed(2);
                        })()}x
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedWard(ward.id.toString());
                            const multiplier = typeof ward.tariffMultiplier === 'number' 
                              ? ward.tariffMultiplier 
                              : Number(ward.tariffMultiplier) || 1;
                            setNewMultiplier(multiplier.toString());
                            setRuleType('ward-multiplier');
                            setIsModalOpen(true);
                          }}
                          className="border-gray-300 text-gray-700 rounded-lg h-8 px-3 bg-white hover:bg-gray-50 inline-flex items-center gap-1.5"
                        >
                          <Edit size={14} />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
                {zones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                      No zones found
                    </TableCell>
                  </TableRow>
                ) : (
                  zones.map((zone: Zone) => (
                    <TableRow key={zone.id} className="border-gray-100">
                      <TableCell className="text-sm font-medium text-gray-900">
                        {zone.name || zone.zoneNo}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {zone.tariffCategory || 'Not set'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedZone(zone.id.toString());
                            setNewCategory(zone.tariffCategory || '');
                            setRuleType('zone-category');
                            setIsModalOpen(true);
                          }}
                          className="border-gray-300 text-gray-700 rounded-lg h-8 px-3 bg-white hover:bg-gray-50 inline-flex items-center gap-1.5"
                        >
                          <Edit size={14} />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
