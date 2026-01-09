import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ScoringParametersTable } from '../components/zoneScoring/ScoringParametersTable';
import { EditParameterModal } from '../components/zoneScoring/EditParameterModal';
import { AddParameterModal } from '../components/zoneScoring/AddParameterModal';
import { ScrollNavigationControls } from '../components/zoneScoring/ScrollNavigationControls';
import { PageHeader } from '../components/zoneScoring/PageHeader';
import { EmptyState } from '../components/zoneScoring/EmptyState';
import { StatusBadge } from '../components/zoneScoring/StatusBadge';
import { calculatePercentages, initializeScoringParam, mapScoringParamsToDto } from '../utils/zoneScoringUtils';
import type { ZoneScoringRuleSet, ScoringParam, Area, CreateScoringParamDto } from '../types';

export function ZoneScoringView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const [editingParam, setEditingParam] = useState<ScoringParam | null>(null);
  const [editingParamValues, setEditingParamValues] = useState<Partial<ScoringParam> | null>(null);
  const [isEditParamModalOpen, setIsEditParamModalOpen] = useState(false);
  const [isAddParamModalOpen, setIsAddParamModalOpen] = useState(false);
  const [newParam, setNewParam] = useState<CreateScoringParamDto>(
    initializeScoringParam()
  );

  // Fetch ruleset by ID
  const { data: rulesetData, isLoading: rulesetLoading } = useApiQuery<ZoneScoringRuleSet>(
    ['zone-scoring', id],
    () => api.zoneScoring.getById(parseInt(id!)),
    { enabled: !!id }
  );

  // Fetch areas
  const { data: areasData, isLoading: areasLoading } = useApiQuery<Area[]>(
    ['areas'],
    () => api.area.getAll()
  );
  const areas: Area[] = (areasData ?? []) as Area[];

  // Mutations
  const updateZoneScoringMutation = useApiMutation(
    ({ id, data }: { id: number; data: Parameters<typeof api.zoneScoring.update>[1] }) => api.zoneScoring.update(id, data),
    {
      successMessage: 'Zone scoring rule set updated successfully',
      errorMessage: 'Failed to update zone scoring rule set',
      invalidateQueries: [['zone-scoring'], ['zone-scoring', id]],
    }
  );

  // Calculate percentages for current rule set (with real-time updates when editing)
  const calculatedParams = useMemo(() => {
    if (!rulesetData || !rulesetData.scoringParams) return [];
    
    // If editing, use the edited values for calculations
    let paramsToCalculate = rulesetData.scoringParams;
    if (editingParam && editingParamValues) {
      paramsToCalculate = rulesetData.scoringParams.map(p => 
        p.id === editingParam.id ? { ...p, ...editingParamValues } : p
      );
    }
    
    return calculatePercentages(paramsToCalculate);
  }, [rulesetData, editingParam, editingParamValues]);

  const handleEditParam = (param: ScoringParam) => {
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
  };

  const handleSaveEdit = async (updatedParams: ScoringParam[]) => {
    if (!rulesetData) return;
    
    await updateZoneScoringMutation.mutateAsync({
      id: rulesetData.id,
      data: {
        scoringParams: mapScoringParamsToDto(updatedParams),
      },
    });
    
    setIsEditParamModalOpen(false);
    setEditingParam(null);
    setEditingParamValues(null);
  };

  const handleAddParameter = async () => {
    if (!rulesetData) {
      alert('Ruleset not found');
      return;
    }

    if (!newParam.areaId || newParam.areaId === 0) {
      alert('Please select an area');
      return;
    }

    if (!newParam.landHomeRate || !newParam.landRate || !newParam.landTaxRate) {
      alert('Please fill in all required scoring fields');
      return;
    }

    try {
      // Get current rule set with all params
      const currentRuleSet = await api.zoneScoring.getById(rulesetData.id);
      
      // Create new param (calculate percentages and geoMean)
      const paramsToCalculate = [{
        ...newParam,
        id: 0, // Temporary ID
        area: areas.find(a => a.id === newParam.areaId) || currentRuleSet.scoringParams?.[0]?.area,
        areaId: newParam.areaId,
      } as ScoringParam];
      
      const calculatedNewParam = calculatePercentages(paramsToCalculate)[0];
      
      // Add new param to existing params - recalculate all percentages
      const allParams = [
        ...(currentRuleSet.scoringParams || []),
        calculatedNewParam,
      ];
      const recalculatedAllParams = calculatePercentages(allParams);
      
      const updatedParams = mapScoringParamsToDto(recalculatedAllParams);

      // Update rule set with new params
      await updateZoneScoringMutation.mutateAsync({
        id: rulesetData.id,
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

  if (rulesetLoading || areasLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!rulesetData) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Ruleset not found</p>
          <Button onClick={() => navigate('/tariff-admin/zone-scoring')}>
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-8 py-6">
        <PageHeader
          title={rulesetData.title}
          description={rulesetData.description || 'No description'}
          backUrl="/tariff-admin/zone-scoring"
        >
          <div className="mt-2">
            <StatusBadge status={rulesetData.status as 'active' | 'draft' | 'inactive'} />
          </div>
        </PageHeader>

        {/* Parameters Table */}
        {calculatedParams.length === 0 ? (
          <EmptyState
            title="No scoring parameters found"
            actionLabel="Add Parameter"
            onAction={() => setIsAddParamModalOpen(true)}
          />
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
            <ScrollNavigationControls tableScrollRef={tableScrollRef} calculatedParams={calculatedParams} />
            <div ref={tableScrollRef} className="overflow-x-auto" id="zone-scoring-table-scroll">
              <ScoringParametersTable 
                calculatedParams={calculatedParams}
                onEditParam={handleEditParam}
              />
            </div>
          </div>
        )}

        {/* Edit Parameter Modal */}
        <EditParameterModal
          isOpen={isEditParamModalOpen}
          onClose={() => {
            setIsEditParamModalOpen(false);
            setEditingParam(null);
            setEditingParamValues(null);
          }}
          editingParam={editingParam}
          editingParamValues={editingParamValues}
          setEditingParamValues={setEditingParamValues}
          activeRuleSet={rulesetData}
          calculatedParams={calculatedParams}
          onSave={handleSaveEdit}
        />

        {/* Add Parameter Modal */}
        <AddParameterModal
          isOpen={isAddParamModalOpen}
          onClose={() => {
            setIsAddParamModalOpen(false);
            setNewParam(initializeScoringParam());
          }}
          newParam={newParam}
          setNewParam={setNewParam}
          areas={areas}
          onAdd={handleAddParameter}
          isPending={updateZoneScoringMutation.isPending}
        />
      </div>
    </div>
  );
}
