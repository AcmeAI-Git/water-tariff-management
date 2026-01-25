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
import type { TariffPlan } from '../types';

export function TariffConfiguration() {
  const [activeTab, setActiveTab] = useState<'residential' | 'commercial'>('residential');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ruleType, setRuleType] = useState<'tariff-slab'>('tariff-slab');
  const adminId = useAdminId();
  
  // Form states for Tariff Plan (multiple slabs)
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [slabType, setSlabType] = useState('residential');
  const [slabs, setSlabs] = useState<Array<{ minConsumption: string; maxConsumption: string; ratePerUnit: string; slabOrder: number }>>([]);
  const [effectiveFrom, setEffectiveFrom] = useState<Date | undefined>(undefined);
  const [effectiveTo, setEffectiveTo] = useState<Date | undefined>(undefined);
  

  // Fetch tariff plans
  const { data: tariffPlansData, isLoading: plansLoading } = useApiQuery<TariffPlan[]>(
    ['tariff-plans'],
    () => api.tariffPlans.getAll()
  );
  const tariffPlans: TariffPlan[] = (tariffPlansData ?? []) as TariffPlan[];


  // Create tariff plan mutation
  const createTariffPlanMutation = useApiMutation(
    (data: Parameters<typeof api.tariffPlans.create>[0]) => api.tariffPlans.create(data),
    {
      successMessage: 'Tariff plan created successfully',
      errorMessage: 'Failed to create tariff plan',
      invalidateQueries: [['tariff-plans']],
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
    }

    handleModalClose();
  };

  const formatRange = (min: number, max: number | null) => {
    if (max === null) {
      return `${min}+ m³`;
    }
    return `${min}-${max} m³`;
  };

  if (plansLoading) {
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
          <p className="text-sm text-gray-500">Manage tariff rules and slabs</p>
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
              {/* Tariff Plan with Slabs */}
              {
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
                        <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg" align="start">
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
                        <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg" align="start">
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
              }
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
                disabled={createTariffPlanMutation.isPending}
                className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
              >
                {createTariffPlanMutation.isPending ? 'Saving...' : 'Add Rule'}
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


        {/* Zone Scoring functionality moved to separate pages */}
                  </div>
                  </div>
  );
}
