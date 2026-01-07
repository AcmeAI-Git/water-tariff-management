import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Edit, Calendar as CalendarIcon } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { api } from '../services/api';
import { useApiQuery, useApiMutation, useAdminId } from '../hooks/useApiQuery';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { cn } from '../utils/utils';
import type { TariffPlan, Zone, ZoneScoringRuleSet, Area, CreateZoneScoringRuleSetDto, CreateScoringParamDto, UpdateZoneScoringRuleSetDto, ScoringParam } from '../types';

export function TariffConfiguration() {
  const [activeTab, setActiveTab] = useState<'residential' | 'commercial' | 'zone-scoring' | 'zone-categories'>('residential');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZoneScoringFormOpen, setIsZoneScoringFormOpen] = useState(false);
  const [editingRuleSet, setEditingRuleSet] = useState<ZoneScoringRuleSet | null>(null);
  const [ruleType, setRuleType] = useState<'tariff-slab' | 'zone-category'>('tariff-slab');
  const adminId = useAdminId();
  
  // Zone Scoring Form States
  const [ruleSetTitle, setRuleSetTitle] = useState('');
  const [ruleSetDescription, setRuleSetDescription] = useState('');
  const [ruleSetStatus, setRuleSetStatus] = useState('draft');
  const [scoringParams, setScoringParams] = useState<Array<CreateScoringParamDto & { newAreaName?: string; createNewArea?: boolean }>>([]);
  
  // Zone Scoring UI States
  const [selectedRuleSetId, setSelectedRuleSetId] = useState<number | null>(null);
  const [editingParamId, setEditingParamId] = useState<number | null>(null);
  const [editingParamValues, setEditingParamValues] = useState<Partial<ScoringParam> | null>(null);
  const [isEditParamModalOpen, setIsEditParamModalOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<ScoringParam | null>(null);
  
  // Simple modal states
  const [isCreateRuleSetModalOpen, setIsCreateRuleSetModalOpen] = useState(false);
  const [newRuleSetName, setNewRuleSetName] = useState('');
  const [isAddParamModalOpen, setIsAddParamModalOpen] = useState(false);
  const [newParam, setNewParam] = useState<CreateScoringParamDto & { newAreaName?: string; createNewArea?: boolean }>({
    areaId: 0,
    landHomeRate: '',
    landHomeRatePercentage: '',
    landRate: '',
    landRatePercentage: '',
    landTaxRate: '',
    landTaxRatePercentage: '',
    buildingTaxRateUpto120sqm: '',
    buildingTaxRateUpto120sqmPercentage: '',
    buildingTaxRateUpto200sqm: '',
    buildingTaxRateUpto200sqmPercentage: '',
    buildingTaxRateAbove200sqm: '',
    buildingTaxRateAbove200sqmPercentage: '',
    highIncomeGroupConnectionPercentage: '',
    geoMean: '',
    newAreaName: '',
    createNewArea: false,
  });
  
  // Refs for scrollbar sync
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  
  // Form states for Tariff Plan (multiple slabs)
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [slabType, setSlabType] = useState('residential');
  const [slabs, setSlabs] = useState<Array<{ minConsumption: string; maxConsumption: string; ratePerUnit: string; slabOrder: number }>>([]);
  const [effectiveFrom, setEffectiveFrom] = useState<Date | undefined>(undefined);
  const [effectiveTo, setEffectiveTo] = useState<Date | undefined>(undefined);
  
  // Form states for Zone Category
  const [selectedZone, setSelectedZone] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Fetch tariff plans
  const { data: tariffPlansData, isLoading: plansLoading } = useApiQuery<TariffPlan[]>(
    ['tariff-plans'],
    () => api.tariffPlans.getAll()
  );
  const tariffPlans: TariffPlan[] = (tariffPlansData ?? []) as TariffPlan[];

  // Fetch zones
  const { data: zonesData, isLoading: zonesLoading } = useApiQuery<Zone[]>(
    ['zones'],
    () => api.zones.getAll()
  );
  const zones: Zone[] = (zonesData ?? []) as Zone[];

  // Fetch zone scoring rule sets
  const { data: zoneScoringData, isLoading: zoneScoringLoading } = useApiQuery<ZoneScoringRuleSet[]>(
    ['zone-scoring'],
    () => api.zoneScoring.getAll()
  );
  const zoneScoringRuleSets: ZoneScoringRuleSet[] = (zoneScoringData ?? []) as ZoneScoringRuleSet[];
  
  // Get active rule set (or first one if none is active)
  const activeRuleSet = useMemo(() => {
    if (zoneScoringRuleSets.length === 0) return null;
    if (selectedRuleSetId) {
      return zoneScoringRuleSets.find(rs => rs.id === selectedRuleSetId) || null;
    }
    const active = zoneScoringRuleSets.find(rs => rs.status === 'active');
    return active || zoneScoringRuleSets[0];
  }, [zoneScoringRuleSets, selectedRuleSetId]);
  
  // Initialize selectedRuleSetId when activeRuleSet changes
  useEffect(() => {
    if (activeRuleSet && !selectedRuleSetId) {
      setSelectedRuleSetId(activeRuleSet.id);
    }
  }, [activeRuleSet, selectedRuleSetId]);

  // Calculation functions
  const calculatePercentages = (params: ScoringParam[]): ScoringParam[] => {
    if (params.length === 0) return params;
    
    // Get max values for each column
    const maxLandHomeRate = Math.max(...params.map(p => parseFloat(p.landHomeRate) || 0));
    const maxLandRate = Math.max(...params.map(p => parseFloat(p.landRate) || 0));
    const maxLandTaxRate = Math.max(...params.map(p => parseFloat(p.landTaxRate) || 0));
    const maxBuildingTax120 = Math.max(...params.map(p => parseFloat(p.buildingTaxRateUpto120sqm) || 0));
    const maxBuildingTax200 = Math.max(...params.map(p => parseFloat(p.buildingTaxRateUpto200sqm) || 0));
    const maxBuildingTaxAbove200 = Math.max(...params.map(p => parseFloat(p.buildingTaxRateAbove200sqm) || 0));
    const maxHighIncome = Math.max(...params.map(p => parseFloat(p.highIncomeGroupConnectionPercentage) || 0));
    
    // Calculate percentages and geomean for each param
    return params.map(param => {
      const landHomeRate = parseFloat(param.landHomeRate) || 0;
      const landRate = parseFloat(param.landRate) || 0;
      const landTaxRate = parseFloat(param.landTaxRate) || 0;
      const buildingTax120 = parseFloat(param.buildingTaxRateUpto120sqm) || 0;
      const buildingTax200 = parseFloat(param.buildingTaxRateUpto200sqm) || 0;
      const buildingTaxAbove200 = parseFloat(param.buildingTaxRateAbove200sqm) || 0;
      const highIncome = parseFloat(param.highIncomeGroupConnectionPercentage) || 0;
      
      const landHomeRatePct = maxLandHomeRate > 0 ? (landHomeRate / maxLandHomeRate) * 100 : 0;
      const landRatePct = maxLandRate > 0 ? (landRate / maxLandRate) * 100 : 0;
      const landTaxRatePct = maxLandTaxRate > 0 ? (landTaxRate / maxLandTaxRate) * 100 : 0;
      const buildingTax120Pct = maxBuildingTax120 > 0 ? (buildingTax120 / maxBuildingTax120) * 100 : 0;
      const buildingTax200Pct = maxBuildingTax200 > 0 ? (buildingTax200 / maxBuildingTax200) * 100 : 0;
      const buildingTaxAbove200Pct = maxBuildingTaxAbove200 > 0 ? (buildingTaxAbove200 / maxBuildingTaxAbove200) * 100 : 0;
      const highIncomePct = maxHighIncome > 0 ? (highIncome / maxHighIncome) * 100 : 0;
      
      // Calculate geometric mean of all percentages (convert to decimal first)
      const percentages = [
        landHomeRatePct / 100,
        landRatePct / 100,
        landTaxRatePct / 100,
        buildingTax120Pct / 100,
        buildingTax200Pct / 100,
        buildingTaxAbove200Pct / 100,
        highIncomePct / 100,
      ].filter(p => p > 0);
      
      const geoMean = percentages.length > 0
        ? Math.pow(percentages.reduce((a, b) => a * b, 1), 1 / percentages.length)
        : 0;
      
      return {
        ...param,
        landHomeRatePercentage: landHomeRatePct.toFixed(2),
        landRatePercentage: landRatePct.toFixed(2),
        landTaxRatePercentage: landTaxRatePct.toFixed(2),
        buildingTaxRateUpto120sqmPercentage: buildingTax120Pct.toFixed(2),
        buildingTaxRateUpto200sqmPercentage: buildingTax200Pct.toFixed(2),
        buildingTaxRateAbove200sqmPercentage: buildingTaxAbove200Pct.toFixed(2),
        highIncomeGroupConnectionPercentage: highIncomePct.toFixed(2),
        geoMean: geoMean.toFixed(6),
      };
    });
  };

  // Calculate percentages for current active rule set (with real-time updates when editing)
  const calculatedParams = useMemo(() => {
    if (!activeRuleSet || !activeRuleSet.scoringParams) return [];
    
    // If editing, use the edited values for calculations
    let paramsToCalculate = activeRuleSet.scoringParams;
    if (editingParamId && editingParamValues) {
      paramsToCalculate = activeRuleSet.scoringParams.map(p => 
        p.id === editingParamId ? { ...p, ...editingParamValues } : p
      );
    }
    
    return calculatePercentages(paramsToCalculate);
  }, [activeRuleSet, editingParamId, editingParamValues]);

  // Sync top and bottom scrollbars
  useEffect(() => {
    const tableScroll = tableScrollRef.current;
    const topScroll = topScrollRef.current;
    
    if (!tableScroll || !topScroll) return;

    // Calculate actual table width dynamically
    const updateScrollbarWidth = () => {
      const table = tableScroll.querySelector('table');
      if (table) {
        const tableWidth = table.scrollWidth;
        const topScrollContent = topScroll.querySelector('div');
        if (topScrollContent) {
          topScrollContent.style.width = `${tableWidth}px`;
        }
      }
    };

    // Initial calculation
    updateScrollbarWidth();

    const handleTableScroll = () => {
      if (topScroll) {
        topScroll.scrollLeft = tableScroll.scrollLeft;
      }
    };

    const handleTopScroll = () => {
      if (tableScroll) {
        tableScroll.scrollLeft = topScroll.scrollLeft;
      }
    };

    tableScroll.addEventListener('scroll', handleTableScroll);
    topScroll.addEventListener('scroll', handleTopScroll);
    
    // Recalculate on resize and when params change
    const handleResize = () => {
      updateScrollbarWidth();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Use MutationObserver to detect table changes
    const observer = new MutationObserver(() => {
      updateScrollbarWidth();
    });
    
    if (tableScroll) {
      observer.observe(tableScroll, { childList: true, subtree: true });
    }
    
    return () => {
      tableScroll.removeEventListener('scroll', handleTableScroll);
      topScroll.removeEventListener('scroll', handleTopScroll);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [calculatedParams]);

  // Fetch areas
  const { data: areasData, isLoading: areasLoading } = useApiQuery<Area[]>(
    ['areas'],
    () => api.area.getAll()
  );
  const areas: Area[] = (areasData ?? []) as Area[];

  // Create tariff plan mutation
  const createTariffPlanMutation = useApiMutation(
    (data: Parameters<typeof api.tariffPlans.create>[0]) => api.tariffPlans.create(data),
    {
      successMessage: 'Tariff plan created successfully',
      errorMessage: 'Failed to create tariff plan',
      invalidateQueries: [['tariff-plans']],
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

  // Zone Scoring mutations
  const createZoneScoringMutation = useApiMutation(
    (data: CreateZoneScoringRuleSetDto) => api.zoneScoring.create(data),
    {
      successMessage: 'Zone scoring rule set created successfully',
      errorMessage: 'Failed to create zone scoring rule set',
      invalidateQueries: [['zone-scoring']],
    }
  );

  const updateZoneScoringMutation = useApiMutation(
    ({ id, data }: { id: number; data: Parameters<typeof api.zoneScoring.update>[1] }) => api.zoneScoring.update(id, data),
    {
      successMessage: 'Zone scoring rule set updated successfully',
      errorMessage: 'Failed to update zone scoring rule set',
      invalidateQueries: [['zone-scoring']],
    }
  );

  const deleteZoneScoringMutation = useApiMutation(
    (id: number) => api.zoneScoring.delete(id),
    {
      successMessage: 'Zone scoring rule set deleted successfully',
      errorMessage: 'Failed to delete zone scoring rule set',
      invalidateQueries: [['zone-scoring']],
    }
  );

  // Area mutations
  const createAreaMutation = useApiMutation(
    (data: Parameters<typeof api.area.create>[0]) => api.area.create(data),
    {
      successMessage: 'Area created successfully',
      errorMessage: 'Failed to create area',
      invalidateQueries: [['areas']],
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

  // Initialize scoring param form
  const initializeScoringParam = (): CreateScoringParamDto & { newAreaName?: string; createNewArea?: boolean } => ({
    areaId: 0,
    landHomeRate: '',
    landHomeRatePercentage: '',
    landRate: '',
    landRatePercentage: '',
    landTaxRate: '',
    landTaxRatePercentage: '',
    buildingTaxRateUpto120sqm: '',
    buildingTaxRateUpto120sqmPercentage: '',
    buildingTaxRateUpto200sqm: '',
    buildingTaxRateUpto200sqmPercentage: '',
    buildingTaxRateAbove200sqm: '',
    buildingTaxRateAbove200sqmPercentage: '',
    highIncomeGroupConnectionPercentage: '',
    geoMean: '',
    newAreaName: '',
    createNewArea: false,
  });

  const addScoringParam = () => {
    setScoringParams([...scoringParams, initializeScoringParam()]);
  };

  const removeScoringParam = (index: number) => {
    setScoringParams(scoringParams.filter((_, i) => i !== index));
  };

  const updateScoringParam = (index: number, field: keyof CreateScoringParamDto | 'newAreaName' | 'createNewArea', value: string | boolean) => {
    const updated = [...scoringParams];
    updated[index] = { ...updated[index], [field]: value };
    setScoringParams(updated);
  };

  // Handle applying rule set
  const handleApplyRuleSet = () => {
    if (selectedRuleSetId) {
      // The activeRuleSet will update automatically via useMemo when selectedRuleSetId changes
      // Force a re-render by ensuring the state is set
      const selectedRuleSet = zoneScoringRuleSets.find(rs => rs.id === selectedRuleSetId);
      if (selectedRuleSet) {
        // State update will trigger useMemo recalculation
        // No additional action needed as useMemo depends on selectedRuleSetId
      }
    }
  };

  // Handle simple create rule set
  const handleCreateRuleSet = async () => {
    if (!newRuleSetName.trim()) {
      alert('Please enter a rule set name');
      return;
    }

    try {
      const newRuleSet = await createZoneScoringMutation.mutateAsync({
        title: newRuleSetName.trim(),
        description: '',
        status: 'draft',
        scoringParams: [],
      });

      setIsCreateRuleSetModalOpen(false);
      setNewRuleSetName('');
      setSelectedRuleSetId(newRuleSet.id);
    } catch (error) {
      console.error('Error creating rule set:', error);
      alert('Failed to create rule set');
    }
  };

  // Handle simple add parameter
  const handleAddParameter = async () => {
    if (!activeRuleSet) {
      alert('Please select a rule set first');
      return;
    }

    if (!newParam.areaId || newParam.areaId === 0) {
      alert('Please select an area');
      return;
    }

    // Validate required fields
    if (!newParam.landHomeRate || !newParam.landRate || !newParam.landTaxRate) {
      alert('Please fill in all required scoring fields');
      return;
    }

    try {
      // Get current rule set with all params
      const currentRuleSet = await api.zoneScoring.getById(activeRuleSet.id);
      
      // Create new param (calculate percentages and geoMean)
      const paramsToCalculate = [{
        ...newParam,
        id: 0, // Temporary ID
        area: areas.find(a => a.id === newParam.areaId) || currentRuleSet.scoringParams?.[0]?.area,
        areaId: newParam.areaId,
      } as ScoringParam];
      
      const calculatedNewParam = calculatePercentages(paramsToCalculate)[0];
      
      // Add new param to existing params
      const updatedParams = [
        ...(currentRuleSet.scoringParams || []).map(p => ({
          areaId: p.areaId,
          landHomeRate: p.landHomeRate,
          landRate: p.landRate,
          landTaxRate: p.landTaxRate,
          buildingTaxRateUpto120sqm: p.buildingTaxRateUpto120sqm,
          buildingTaxRateUpto200sqm: p.buildingTaxRateUpto200sqm,
          buildingTaxRateAbove200sqm: p.buildingTaxRateAbove200sqm,
          highIncomeGroupConnectionPercentage: p.highIncomeGroupConnectionPercentage,
        })),
        {
          areaId: calculatedNewParam.areaId,
          landHomeRate: calculatedNewParam.landHomeRate,
          landRate: calculatedNewParam.landRate,
          landTaxRate: calculatedNewParam.landTaxRate,
          buildingTaxRateUpto120sqm: calculatedNewParam.buildingTaxRateUpto120sqm,
          buildingTaxRateUpto200sqm: calculatedNewParam.buildingTaxRateUpto200sqm,
          buildingTaxRateAbove200sqm: calculatedNewParam.buildingTaxRateAbove200sqm,
          highIncomeGroupConnectionPercentage: calculatedNewParam.highIncomeGroupConnectionPercentage,
        },
      ];

      // Update rule set with new params
      await updateZoneScoringMutation.mutateAsync({
        id: activeRuleSet.id,
        data: {
          scoringParams: updatedParams,
        },
      });

      setIsAddParamModalOpen(false);
      setNewParam(initializeScoringParam());
    } catch (error) {
      console.error('Error adding parameter:', error);
      alert('Failed to add parameter');
    }
  };

  const handleZoneScoringFormOpen = (ruleSet?: ZoneScoringRuleSet) => {
    // If no rule set provided, use active one or create new
    const targetRuleSet = ruleSet || activeRuleSet;
    
    if (targetRuleSet) {
      setEditingRuleSet(targetRuleSet);
      setRuleSetTitle(targetRuleSet.title);
      setRuleSetDescription(targetRuleSet.description || '');
      setRuleSetStatus(targetRuleSet.status);
      if (targetRuleSet.scoringParams && targetRuleSet.scoringParams.length > 0) {
        setScoringParams(targetRuleSet.scoringParams.map(param => ({
          areaId: param.areaId,
          landHomeRate: param.landHomeRate,
          landHomeRatePercentage: param.landHomeRatePercentage,
          landRate: param.landRate,
          landRatePercentage: param.landRatePercentage,
          landTaxRate: param.landTaxRate,
          landTaxRatePercentage: param.landTaxRatePercentage,
          buildingTaxRateUpto120sqm: param.buildingTaxRateUpto120sqm,
          buildingTaxRateUpto120sqmPercentage: param.buildingTaxRateUpto120sqmPercentage,
          buildingTaxRateUpto200sqm: param.buildingTaxRateUpto200sqm,
          buildingTaxRateUpto200sqmPercentage: param.buildingTaxRateUpto200sqmPercentage,
          buildingTaxRateAbove200sqm: param.buildingTaxRateAbove200sqm,
          buildingTaxRateAbove200sqmPercentage: param.buildingTaxRateAbove200sqmPercentage,
          highIncomeGroupConnectionPercentage: param.highIncomeGroupConnectionPercentage,
          geoMean: param.geoMean,
          newAreaName: '',
          createNewArea: false,
        })));
      } else {
        setScoringParams([initializeScoringParam()]);
      }
    } else {
      // Creating new - use defaults
      setEditingRuleSet(null);
      setRuleSetTitle('DWASA Zone Scoring 2026');
      setRuleSetDescription('');
      setRuleSetStatus('active');
      setScoringParams([initializeScoringParam()]);
    }
    setIsZoneScoringFormOpen(true);
  };

  const handleZoneScoringFormClose = () => {
    setIsZoneScoringFormOpen(false);
    setEditingRuleSet(null);
    setRuleSetTitle('');
    setRuleSetDescription('');
    setRuleSetStatus('draft');
    setScoringParams([]);
  };

  const handleZoneScoringSubmit = async () => {
    if (!ruleSetTitle.trim()) {
      alert('Please enter a title for the rule set');
      return;
    }

    if (scoringParams.length === 0) {
      alert('Please add at least one scoring parameter');
      return;
    }

    // Validate all scoring params and create areas if needed
    const processedParams: CreateScoringParamDto[] = [];
    
    for (let i = 0; i < scoringParams.length; i++) {
      const param = scoringParams[i];
      
      // Check if we need to create a new area
      if (param.createNewArea && param.newAreaName?.trim() && param.areaId === 0) {
        try {
          // Create the area first
          const newArea = await createAreaMutation.mutateAsync({
            name: param.newAreaName.trim(),
            geojson: {
              type: 'Polygon',
              coordinates: [[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]], // Default empty polygon - user can update later
            },
          });
          
          processedParams.push({
            areaId: newArea.id,
            landHomeRate: param.landHomeRate,
            landHomeRatePercentage: param.landHomeRatePercentage,
            landRate: param.landRate,
            landRatePercentage: param.landRatePercentage,
            landTaxRate: param.landTaxRate,
            landTaxRatePercentage: param.landTaxRatePercentage,
            buildingTaxRateUpto120sqm: param.buildingTaxRateUpto120sqm,
            buildingTaxRateUpto120sqmPercentage: param.buildingTaxRateUpto120sqmPercentage,
            buildingTaxRateUpto200sqm: param.buildingTaxRateUpto200sqm,
            buildingTaxRateUpto200sqmPercentage: param.buildingTaxRateUpto200sqmPercentage,
            buildingTaxRateAbove200sqm: param.buildingTaxRateAbove200sqm,
            buildingTaxRateAbove200sqmPercentage: param.buildingTaxRateAbove200sqmPercentage,
            highIncomeGroupConnectionPercentage: param.highIncomeGroupConnectionPercentage,
            geoMean: param.geoMean,
          });
        } catch (error) {
          alert(`Failed to create area for parameter ${i + 1}: ${error}`);
          return;
        }
      } else {
        if (!param.areaId || param.areaId === 0) {
          alert(`Scoring parameter ${i + 1}: Please select or create an area`);
          return;
        }
        
        if (!param.landHomeRate || !param.landHomeRatePercentage || !param.geoMean) {
          alert(`Scoring parameter ${i + 1}: Please fill in all required fields`);
          return;
        }
        
        processedParams.push({
          areaId: typeof param.areaId === 'string' ? parseInt(param.areaId) : param.areaId,
          landHomeRate: param.landHomeRate,
          landHomeRatePercentage: param.landHomeRatePercentage,
          landRate: param.landRate,
          landRatePercentage: param.landRatePercentage,
          landTaxRate: param.landTaxRate,
          landTaxRatePercentage: param.landTaxRatePercentage,
          buildingTaxRateUpto120sqm: param.buildingTaxRateUpto120sqm,
          buildingTaxRateUpto120sqmPercentage: param.buildingTaxRateUpto120sqmPercentage,
          buildingTaxRateUpto200sqm: param.buildingTaxRateUpto200sqm,
          buildingTaxRateUpto200sqmPercentage: param.buildingTaxRateUpto200sqmPercentage,
          buildingTaxRateAbove200sqm: param.buildingTaxRateAbove200sqm,
          buildingTaxRateAbove200sqmPercentage: param.buildingTaxRateAbove200sqmPercentage,
          highIncomeGroupConnectionPercentage: param.highIncomeGroupConnectionPercentage,
          geoMean: param.geoMean,
        });
      }
    }

    try {
      const data: CreateZoneScoringRuleSetDto = {
        title: ruleSetTitle,
        description: ruleSetDescription || undefined,
        status: ruleSetStatus,
        scoringParams: processedParams,
      };

      if (editingRuleSet) {
        await updateZoneScoringMutation.mutateAsync({
          id: editingRuleSet.id,
          data,
        });
      } else {
        await createZoneScoringMutation.mutateAsync(data);
      }

      handleZoneScoringFormClose();
    } catch (error) {
      console.error('Error saving zone scoring:', error);
      alert('Failed to save zone scoring rule set. Please check the console for details.');
    }
  };

  if (plansLoading || zonesLoading || zoneScoringLoading || areasLoading) {
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
          <p className="text-sm text-gray-500">Manage tariff rules, slabs, and zone scoring</p>
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
                <Select value={ruleType} onValueChange={(value: 'tariff-slab' | 'zone-category') => setRuleType(value)}>
                  <SelectTrigger className="w-full border-gray-300 rounded-lg h-11">
                    <SelectValue placeholder="Select rule type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tariff-slab">Tariff Plan with Slabs</SelectItem>
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
                  updateZoneMutation.isPending
                }
                className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
              >
                {createTariffPlanMutation.isPending || updateZoneMutation.isPending
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
              onClick={() => setActiveTab('zone-scoring')}
              className={`pb-3 text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === 'zone-scoring'
                  ? 'border-[#4C6EF5] text-[#4C6EF5]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Zone Scoring
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

        {/* Zone Scoring */}
        {activeTab === 'zone-scoring' && (
          <div className="space-y-6">
            {/* Rule Set Dropdown and Apply Button */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Select Rule Set</Label>
                  <Select 
                    value={selectedRuleSetId?.toString() || ''} 
                    onValueChange={(value) => {
                      setSelectedRuleSetId(parseInt(value));
                      // Auto-apply when selection changes
                      handleApplyRuleSet();
                    }}
                  >
                    <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white">
                      <SelectValue placeholder="Select a rule set" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {zoneScoringRuleSets.map((rs) => (
                        <SelectItem key={rs.id} value={rs.id.toString()} className="bg-white hover:bg-gray-50">
                          {rs.title} {rs.status === 'active' && '(Active)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-6 flex gap-2">
                  <Button 
                    onClick={handleApplyRuleSet}
                    className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-11 px-6"
                    disabled={!selectedRuleSetId}
                  >
                    Apply this ruleset
                  </Button>
                  <Button 
                    onClick={() => setIsCreateRuleSetModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-11 px-6 flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Create New Rule Set
                  </Button>
                </div>
              </div>
            </div>

            {zoneScoringLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : !activeRuleSet || !calculatedParams || calculatedParams.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500 mb-4">No zone scoring parameters found</p>
                <Button 
                  onClick={() => handleZoneScoringFormOpen()}
                  className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-11 px-6"
                >
                  Create Zone Scoring
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Zone Scoring Parameters ({calculatedParams.length} total)
                  </h3>
                  <Button 
                    onClick={() => setIsAddParamModalOpen(true)}
                    className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-4 flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Parameter
                  </Button>
                </div>
                {/* Top Scrollbar Wrapper */}
                <div className="relative">
                  <div ref={topScrollRef} className="overflow-x-auto overflow-y-hidden mb-2" style={{ scrollbarWidth: 'thin', height: '17px' }} id="zone-scoring-top-scroll">
                    <div style={{ height: '1px', width: '2000px' }}></div>
                  </div>
                  <div ref={tableScrollRef} className="overflow-x-auto" id="zone-scoring-table-scroll">
                    <Table>
                        <TableHeader>
                          <TableRow className="border-gray-200 bg-gray-50">
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Zone</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">DMA</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Ward</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Area Name</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Thana</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Sub-Registry<br/>Office</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Land+Home Rate<br/>(BDT/sqm)</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">% of Land+Home</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Land Rate<br/>(BDT/sqm)</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">% of Land Rate</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Land Tax Rate<br/>(BDT/sqm)</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">% of Land Tax</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Building Tax<br/>(≤120sqm)</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">% Building Tax<br/>(≤120sqm)</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Building Tax<br/>(≤200sqm)</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">% Building Tax<br/>(≤200sqm)</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Building Tax<br/>(&gt;200sqm)</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">% Building Tax<br/>(&gt;200sqm)</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">High Income<br/>Count</TableHead>
                                <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">% High Income</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">House Rent<br/>Rate</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">% of House Rent</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">GeoMean</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Zone Score</TableHead>
                            <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {calculatedParams.map((param) => {
                            // Calculate zone score: 1 + (% of Zonal Average of Geomeans - average) / average
                            // For now, using simplified calculation
                            const geoMeanValue = parseFloat(param.geoMean) || 0;
                            const avgGeoMean = calculatedParams.length > 0 
                              ? calculatedParams.reduce((sum, p) => sum + (parseFloat(p.geoMean) || 0), 0) / calculatedParams.length 
                              : 0;
                            const zoneScore = avgGeoMean > 0 ? (1 + (geoMeanValue - avgGeoMean) / avgGeoMean).toFixed(6) : '0';
                            
                            return (
                              <TableRow key={param.id} className="border-gray-100">
                                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                  {/* Zone - not in API yet */}
                                  <span className="text-gray-400">N/A</span>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                  {/* DMA - not in API yet */}
                                  <span className="text-gray-400">N/A</span>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                  {/* Ward - not in API yet */}
                                  <span className="text-gray-400">N/A</span>
                                </TableCell>
                                <TableCell className="text-sm font-medium text-gray-900 whitespace-nowrap">
                                  {param.area?.name || `Area ${param.areaId}`}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                  {/* Thana - not in API yet */}
                                  <span className="text-gray-400">N/A</span>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                  {/* Sub-Registry Office - not in API yet */}
                                  <span className="text-gray-400">N/A</span>
                                </TableCell>
                                <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                                  {param.landHomeRate}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                  {param.landHomeRatePercentage}%
                                </TableCell>
                                <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                                  {param.landRate}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                  {param.landRatePercentage}%
                                </TableCell>
                                <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                                  {param.landTaxRate}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                  {param.landTaxRatePercentage}%
                                </TableCell>
                                <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                                  {param.buildingTaxRateUpto120sqm}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                  {param.buildingTaxRateUpto120sqmPercentage}%
                                </TableCell>
                                <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                                  {param.buildingTaxRateUpto200sqm}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                  {param.buildingTaxRateUpto200sqmPercentage}%
                                </TableCell>
                                <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                                  {param.buildingTaxRateAbove200sqm}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                  {param.buildingTaxRateAbove200sqmPercentage}%
                                </TableCell>
                                <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                                  {param.highIncomeGroupConnectionPercentage}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                  {param.highIncomeGroupConnectionPercentage}%
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                  {/* House Rent Rate - not in API yet */}
                                  <span className="text-gray-400">N/A</span>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                  {/* % of House Rent Rate - not in API yet */}
                                  <span className="text-gray-400">N/A</span>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                  {param.geoMean}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                  {zoneScore}
                                </TableCell>
                                <TableCell className="text-center whitespace-nowrap">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setEditingParam(param);
                                      setEditingParamValues({
                                        landHomeRate: param.landHomeRate,
                                        landRate: param.landRate,
                                        landTaxRate: param.landTaxRate,
                                        buildingTaxRateUpto120sqm: param.buildingTaxRateUpto120sqm,
                                        buildingTaxRateUpto200sqm: param.buildingTaxRateUpto200sqm,
                                        buildingTaxRateAbove200sqm: param.buildingTaxRateAbove200sqm,
                                        highIncomeGroupConnectionPercentage: param.highIncomeGroupConnectionPercentage,
                                      });
                                      setIsEditParamModalOpen(true);
                                    }}
                                    className="border-gray-300 text-gray-700 rounded-lg h-8 px-3 bg-white hover:bg-gray-50 inline-flex items-center gap-1.5"
                                  >
                                    <Edit size={14} />
                                    Edit
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                  </div>
                </div>
              </div>
            )}
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
                        {zone.tariffCategory || <span className="text-gray-400 italic">Not set</span>}
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

        {/* Edit Scoring Parameter Modal */}
        <Dialog open={isEditParamModalOpen} onOpenChange={setIsEditParamModalOpen}>
          <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Edit Zone Scoring Parameter
                {editingParam && (
                  <span className="text-base font-normal text-gray-600 ml-2">
                    - {editingParam.area?.name || `Area ${editingParam.areaId}`}
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>

            {editingParam && editingParamValues && (
              <div className="py-4 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Land+Home Rate (BDT/sqm) *</Label>
                    <Input
                      type="number"
                      value={editingParamValues.landHomeRate ?? editingParam.landHomeRate}
                      onChange={(e) => setEditingParamValues({ ...editingParamValues, landHomeRate: e.target.value })}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">% of Land+Home Rate</Label>
                    <Input
                      value={calculatedParams.find(p => p.id === editingParam.id)?.landHomeRatePercentage || '0'}
                      readOnly
                      className="border-gray-300 rounded-lg h-11 bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Land Rate (BDT/sqm) *</Label>
                    <Input
                      type="number"
                      value={editingParamValues.landRate ?? editingParam.landRate}
                      onChange={(e) => setEditingParamValues({ ...editingParamValues, landRate: e.target.value })}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">% of Land Rate</Label>
                    <Input
                      value={calculatedParams.find(p => p.id === editingParam.id)?.landRatePercentage || '0'}
                      readOnly
                      className="border-gray-300 rounded-lg h-11 bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Land Tax Rate (BDT/sqm) *</Label>
                    <Input
                      type="number"
                      value={editingParamValues.landTaxRate ?? editingParam.landTaxRate}
                      onChange={(e) => setEditingParamValues({ ...editingParamValues, landTaxRate: e.target.value })}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">% of Land Tax Rate</Label>
                    <Input
                      value={calculatedParams.find(p => p.id === editingParam.id)?.landTaxRatePercentage || '0'}
                      readOnly
                      className="border-gray-300 rounded-lg h-11 bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Building Tax Rate (≤120sqm) (BDT/sqm) *</Label>
                    <Input
                      type="number"
                      value={editingParamValues.buildingTaxRateUpto120sqm ?? editingParam.buildingTaxRateUpto120sqm}
                      onChange={(e) => setEditingParamValues({ ...editingParamValues, buildingTaxRateUpto120sqm: e.target.value })}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">% Building Tax (≤120sqm)</Label>
                    <Input
                      value={calculatedParams.find(p => p.id === editingParam.id)?.buildingTaxRateUpto120sqmPercentage || '0'}
                      readOnly
                      className="border-gray-300 rounded-lg h-11 bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Building Tax Rate (≤200sqm) (BDT/sqm) *</Label>
                    <Input
                      type="number"
                      value={editingParamValues.buildingTaxRateUpto200sqm ?? editingParam.buildingTaxRateUpto200sqm}
                      onChange={(e) => setEditingParamValues({ ...editingParamValues, buildingTaxRateUpto200sqm: e.target.value })}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">% Building Tax (≤200sqm)</Label>
                    <Input
                      value={calculatedParams.find(p => p.id === editingParam.id)?.buildingTaxRateUpto200sqmPercentage || '0'}
                      readOnly
                      className="border-gray-300 rounded-lg h-11 bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Building Tax Rate (&gt;200sqm) (BDT/sqm) *</Label>
                    <Input
                      type="number"
                      value={editingParamValues.buildingTaxRateAbove200sqm ?? editingParam.buildingTaxRateAbove200sqm}
                      onChange={(e) => setEditingParamValues({ ...editingParamValues, buildingTaxRateAbove200sqm: e.target.value })}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">% Building Tax (&gt;200sqm)</Label>
                    <Input
                      value={calculatedParams.find(p => p.id === editingParam.id)?.buildingTaxRateAbove200sqmPercentage || '0'}
                      readOnly
                      className="border-gray-300 rounded-lg h-11 bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">High Income Group Connection Count *</Label>
                    <Input
                      type="number"
                      value={editingParamValues.highIncomeGroupConnectionPercentage ?? editingParam.highIncomeGroupConnectionPercentage}
                      onChange={(e) => setEditingParamValues({ ...editingParamValues, highIncomeGroupConnectionPercentage: e.target.value })}
                      className="border-gray-300 rounded-lg h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">% High Income</Label>
                    <Input
                      value={calculatedParams.find(p => p.id === editingParam.id)?.highIncomeGroupConnectionPercentage || '0'}
                      readOnly
                      className="border-gray-300 rounded-lg h-11 bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t border-gray-200 pt-4">
                  <Label className="text-sm font-medium text-gray-700">GeoMean</Label>
                  <Input
                    value={calculatedParams.find(p => p.id === editingParam.id)?.geoMean || '0'}
                    readOnly
                    className="border-gray-300 rounded-lg h-11 bg-gray-50"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditParamModalOpen(false);
                  setEditingParam(null);
                  setEditingParamValues(null);
                }}
                className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!editingParamValues || !activeRuleSet || !editingParam) return;
                  
                  // Update the scoring param in the rule set
                  const updatedParams = activeRuleSet.scoringParams.map(p => 
                    p.id === editingParam.id ? { ...p, ...editingParamValues } : p
                  );
                  
                  // Recalculate with updated values
                  const recalculated = calculatePercentages(updatedParams);
                  
                  // Update rule set via API
                  await updateZoneScoringMutation.mutateAsync({
                    id: activeRuleSet.id,
                    data: {
                      scoringParams: recalculated.map(p => ({
                        areaId: p.areaId,
                        landHomeRate: p.landHomeRate,
                        landHomeRatePercentage: p.landHomeRatePercentage,
                        landRate: p.landRate,
                        landRatePercentage: p.landRatePercentage,
                        landTaxRate: p.landTaxRate,
                        landTaxRatePercentage: p.landTaxRatePercentage,
                        buildingTaxRateUpto120sqm: p.buildingTaxRateUpto120sqm,
                        buildingTaxRateUpto120sqmPercentage: p.buildingTaxRateUpto120sqmPercentage,
                        buildingTaxRateUpto200sqm: p.buildingTaxRateUpto200sqm,
                        buildingTaxRateUpto200sqmPercentage: p.buildingTaxRateUpto200sqmPercentage,
                        buildingTaxRateAbove200sqm: p.buildingTaxRateAbove200sqm,
                        buildingTaxRateAbove200sqmPercentage: p.buildingTaxRateAbove200sqmPercentage,
                        highIncomeGroupConnectionPercentage: p.highIncomeGroupConnectionPercentage,
                        geoMean: p.geoMean,
                      })),
                    },
                  });
                  
                  setIsEditParamModalOpen(false);
                  setEditingParam(null);
                  setEditingParamValues(null);
                }}
                className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Zone Scoring Form Modal */}
        <Dialog open={isZoneScoringFormOpen} onOpenChange={setIsZoneScoringFormOpen}>
          <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {editingRuleSet ? 'Edit Zone Scoring Parameters' : 'Add Zone Scoring Parameters'}
              </DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-6">
              {/* Hidden Rule Set Info - auto-filled if editing, or use defaults */}
              {!editingRuleSet && (
                <div className="space-y-4 border-b border-gray-200 pb-4">
                  <h4 className="text-sm font-semibold text-gray-900">Zone Scoring Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Title *</Label>
                      <Input
                        value={ruleSetTitle}
                        onChange={(e) => setRuleSetTitle(e.target.value)}
                        placeholder="e.g., DWASA Zone Scoring 2026"
                        className="border-gray-300 rounded-lg h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Status</Label>
                      <Select value={ruleSetStatus} onValueChange={setRuleSetStatus}>
                        <SelectTrigger className="w-full border-gray-300 rounded-lg h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Scoring Parameters */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">Scoring Parameters</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addScoringParam}
                    className="h-8"
                  >
                    <Plus size={14} className="mr-1" />
                    Add Parameter
                  </Button>
                </div>

                {scoringParams.map((param, paramIndex) => (
                  <div key={paramIndex} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-sm font-medium text-gray-900">Scoring Parameter {paramIndex + 1}</h5>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeScoringParam(paramIndex)}
                        className="h-8 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>

                    {/* Area Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Area *</Label>
                      <div className="flex gap-2">
                        <Select
                          value={param.createNewArea ? 'new' : (param.areaId ? param.areaId.toString() : '')}
                          onValueChange={(value) => {
                            if (value === 'new') {
                              updateScoringParam(paramIndex, 'createNewArea', true);
                              updateScoringParam(paramIndex, 'areaId', '0');
                            } else {
                              updateScoringParam(paramIndex, 'createNewArea', false);
                              updateScoringParam(paramIndex, 'areaId', value);
                            }
                          }}
                        >
                          <SelectTrigger className="flex-1 border-gray-300 rounded-lg h-11">
                            <SelectValue placeholder="Select or create area" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">+ Create New Area</SelectItem>
                            {areas.map((area) => (
                              <SelectItem key={area.id} value={area.id.toString()}>
                                {area.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {param.createNewArea && (
                          <Input
                            value={param.newAreaName || ''}
                            onChange={(e) => updateScoringParam(paramIndex, 'newAreaName', e.target.value)}
                            placeholder="New area name"
                            className="flex-1 border-gray-300 rounded-lg h-11"
                          />
                        )}
                      </div>
                    </div>

                    {/* Land + Home Rate */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Land+Home Rate (BDT/sqm) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={param.landHomeRate}
                          onChange={(e) => updateScoringParam(paramIndex, 'landHomeRate', e.target.value)}
                          placeholder="e.g., 32896.00"
                          className="border-gray-300 rounded-lg h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">% of Land+Home Rate *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={param.landHomeRatePercentage}
                          onChange={(e) => updateScoringParam(paramIndex, 'landHomeRatePercentage', e.target.value)}
                          placeholder="e.g., 1.59"
                          className="border-gray-300 rounded-lg h-10"
                        />
                      </div>
                    </div>

                    {/* Land Rate */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Land Rate (BDT/sqm) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={param.landRate}
                          onChange={(e) => updateScoringParam(paramIndex, 'landRate', e.target.value)}
                          placeholder="e.g., 20000.00"
                          className="border-gray-300 rounded-lg h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">% of Land Rate *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={param.landRatePercentage}
                          onChange={(e) => updateScoringParam(paramIndex, 'landRatePercentage', e.target.value)}
                          placeholder="e.g., 1.50"
                          className="border-gray-300 rounded-lg h-10"
                        />
                      </div>
                    </div>

                    {/* Land Tax Rate */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Land Tax Rate (BDT/sqm) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={param.landTaxRate}
                          onChange={(e) => updateScoringParam(paramIndex, 'landTaxRate', e.target.value)}
                          placeholder="e.g., 5000.00"
                          className="border-gray-300 rounded-lg h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">% of Land Tax Rate *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={param.landTaxRatePercentage}
                          onChange={(e) => updateScoringParam(paramIndex, 'landTaxRatePercentage', e.target.value)}
                          placeholder="e.g., 0.87"
                          className="border-gray-300 rounded-lg h-10"
                        />
                      </div>
                    </div>

                    {/* Building Tax Rate - Upto 120 sqm */}
                    <div className="border-t border-gray-200 pt-4">
                      <h6 className="text-sm font-medium text-gray-900 mb-3">Building Tax Rate (upto 120 sqm)</h6>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Rate (BDT/sqm) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={param.buildingTaxRateUpto120sqm}
                            onChange={(e) => updateScoringParam(paramIndex, 'buildingTaxRateUpto120sqm', e.target.value)}
                            placeholder="e.g., 700.00"
                            className="border-gray-300 rounded-lg h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Percentage *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={param.buildingTaxRateUpto120sqmPercentage}
                            onChange={(e) => updateScoringParam(paramIndex, 'buildingTaxRateUpto120sqmPercentage', e.target.value)}
                            placeholder="e.g., 1.16"
                            className="border-gray-300 rounded-lg h-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Building Tax Rate - Upto 200 sqm */}
                    <div className="border-t border-gray-200 pt-4">
                      <h6 className="text-sm font-medium text-gray-900 mb-3">Building Tax Rate (upto 200 sqm)</h6>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Rate (BDT/sqm) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={param.buildingTaxRateUpto200sqm}
                            onChange={(e) => updateScoringParam(paramIndex, 'buildingTaxRateUpto200sqm', e.target.value)}
                            placeholder="e.g., 850.00"
                            className="border-gray-300 rounded-lg h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Percentage *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={param.buildingTaxRateUpto200sqmPercentage}
                            onChange={(e) => updateScoringParam(paramIndex, 'buildingTaxRateUpto200sqmPercentage', e.target.value)}
                            placeholder="e.g., 0.84"
                            className="border-gray-300 rounded-lg h-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Building Tax Rate - Above 200 sqm */}
                    <div className="border-t border-gray-200 pt-4">
                      <h6 className="text-sm font-medium text-gray-900 mb-3">Building Tax Rate (above 200 sqm)</h6>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Rate (BDT/sqm) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={param.buildingTaxRateAbove200sqm}
                            onChange={(e) => updateScoringParam(paramIndex, 'buildingTaxRateAbove200sqm', e.target.value)}
                            placeholder="e.g., 1300.00"
                            className="border-gray-300 rounded-lg h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Percentage *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={param.buildingTaxRateAbove200sqmPercentage}
                            onChange={(e) => updateScoringParam(paramIndex, 'buildingTaxRateAbove200sqmPercentage', e.target.value)}
                            placeholder="e.g., 0.87"
                            className="border-gray-300 rounded-lg h-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* High Income Group & GeoMean */}
                    <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">High Income Group Connection % *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={param.highIncomeGroupConnectionPercentage}
                          onChange={(e) => updateScoringParam(paramIndex, 'highIncomeGroupConnectionPercentage', e.target.value)}
                          placeholder="e.g., 0.20"
                          className="border-gray-300 rounded-lg h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">GeoMean *</Label>
                        <Input
                          type="number"
                          step="0.000001"
                          value={param.geoMean}
                          onChange={(e) => updateScoringParam(paramIndex, 'geoMean', e.target.value)}
                          placeholder="e.g., 0.010000"
                          className="border-gray-300 rounded-lg h-10"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {scoringParams.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Click "Add Parameter" to add scoring parameters</p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleZoneScoringFormClose}
                className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleZoneScoringSubmit}
                disabled={
                  createZoneScoringMutation.isPending ||
                  updateZoneScoringMutation.isPending ||
                  createAreaMutation.isPending
                }
                className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
              >
                {createZoneScoringMutation.isPending || updateZoneScoringMutation.isPending || createAreaMutation.isPending
                  ? 'Saving...'
                  : editingRuleSet
                  ? 'Update Parameters'
                  : 'Create Zone Scoring'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Rule Set Simple Modal */}
        <Dialog open={isCreateRuleSetModalOpen} onOpenChange={setIsCreateRuleSetModalOpen}>
          <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Create New Rule Set
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Rule Set Name
                  </Label>
                  <Input
                    value={newRuleSetName}
                    onChange={(e) => setNewRuleSetName(e.target.value)}
                    placeholder="e.g., DWASA Zone Scoring 2026"
                    className="border-gray-300 rounded-lg h-11"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateRuleSet();
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setIsCreateRuleSetModalOpen(false);
                  setNewRuleSetName('');
                }}
                variant="outline"
                className="border-gray-300 rounded-lg h-10 px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRuleSet}
                disabled={createZoneScoringMutation.isPending || !newRuleSetName.trim()}
                className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
              >
                {createZoneScoringMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Parameter Simple Modal */}
        <Dialog open={isAddParamModalOpen} onOpenChange={setIsAddParamModalOpen}>
          <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Add Scoring Parameter
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Area <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={newParam.areaId?.toString() || '0'}
                  onValueChange={(value) => setNewParam({ ...newParam, areaId: parseInt(value) })}
                >
                  <SelectTrigger className="bg-white border-gray-300 rounded-lg h-11">
                    <SelectValue placeholder="Select an area" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Land+Home Rate (BDT/sqm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={newParam.landHomeRate}
                    onChange={(e) => setNewParam({ ...newParam, landHomeRate: e.target.value })}
                    placeholder="e.g., 32896.00"
                    className="border-gray-300 rounded-lg h-11"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Land Rate (BDT/sqm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={newParam.landRate}
                    onChange={(e) => setNewParam({ ...newParam, landRate: e.target.value })}
                    placeholder="e.g., 20000.00"
                    className="border-gray-300 rounded-lg h-11"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Land Tax Rate (BDT/sqm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={newParam.landTaxRate}
                    onChange={(e) => setNewParam({ ...newParam, landTaxRate: e.target.value })}
                    placeholder="e.g., 5000.00"
                    className="border-gray-300 rounded-lg h-11"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Building Tax (≤120sqm) (BDT/sqm)
                  </Label>
                  <Input
                    value={newParam.buildingTaxRateUpto120sqm}
                    onChange={(e) => setNewParam({ ...newParam, buildingTaxRateUpto120sqm: e.target.value })}
                    placeholder="e.g., 700.00"
                    className="border-gray-300 rounded-lg h-11"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Building Tax (≤200sqm) (BDT/sqm)
                  </Label>
                  <Input
                    value={newParam.buildingTaxRateUpto200sqm}
                    onChange={(e) => setNewParam({ ...newParam, buildingTaxRateUpto200sqm: e.target.value })}
                    placeholder="e.g., 850.00"
                    className="border-gray-300 rounded-lg h-11"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Building Tax (&gt;200sqm) (BDT/sqm)
                  </Label>
                  <Input
                    value={newParam.buildingTaxRateAbove200sqm}
                    onChange={(e) => setNewParam({ ...newParam, buildingTaxRateAbove200sqm: e.target.value })}
                    placeholder="e.g., 1300.00"
                    className="border-gray-300 rounded-lg h-11"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    High Income Group Connection (%)
                  </Label>
                  <Input
                    value={newParam.highIncomeGroupConnectionPercentage}
                    onChange={(e) => setNewParam({ ...newParam, highIncomeGroupConnectionPercentage: e.target.value })}
                    placeholder="e.g., 0.20"
                    className="border-gray-300 rounded-lg h-11"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setIsAddParamModalOpen(false);
                  setNewParam(initializeScoringParam());
                }}
                variant="outline"
                className="border-gray-300 rounded-lg h-10 px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddParameter}
                disabled={updateZoneScoringMutation.isPending}
                className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
              >
                {updateZoneScoringMutation.isPending ? 'Adding...' : 'Add Parameter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
