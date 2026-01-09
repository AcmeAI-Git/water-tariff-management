import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Plus, Edit } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
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
  const [isEditRuleSetModalOpen, setIsEditRuleSetModalOpen] = useState(false);
  const [editRuleSetTitle, setEditRuleSetTitle] = useState('');
  const [editRuleSetDescription, setEditRuleSetDescription] = useState('');
  const [editRuleSetStatus, setEditRuleSetStatus] = useState('');
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

  // Fetch all rulesets to check for active ones
  const { data: allRulesetsData } = useApiQuery<ZoneScoringRuleSet[]>(
    ['zone-scoring'],
    () => api.zoneScoring.getAll()
  );
  const allRulesets: ZoneScoringRuleSet[] = (allRulesetsData ?? []) as ZoneScoringRuleSet[];

  // Mutations
  const updateZoneScoringMutation = useApiMutation(
    ({ id, data }: { id: number; data: Parameters<typeof api.zoneScoring.update>[1] }) => api.zoneScoring.update(id, data),
    {
      successMessage: 'Zone scoring rule set updated successfully',
      errorMessage: 'Failed to update zone scoring rule set',
      invalidateQueries: [['zone-scoring'], ['zone-scoring', id]],
    }
  );

  // Calculate percentages for current rule set (with real-time updates when editing or adding)
  const calculatedParams = useMemo(() => {
    if (!rulesetData || !rulesetData.scoringParams) {
      // If no ruleset data but we're adding a param, calculate with just the new param
      if (newParam.areaId && newParam.areaId !== 0) {
        const tempParam: ScoringParam = {
          ...newParam,
          id: 0,
          area: areas.find(a => a.id === newParam.areaId),
          ruleSetId: 0,
        } as ScoringParam;
        return calculatePercentages([tempParam]);
      }
      return [];
    }
    
    let paramsToCalculate = rulesetData.scoringParams;
    
    // If editing, use the edited values for calculations
    if (editingParam && editingParamValues) {
      paramsToCalculate = rulesetData.scoringParams.map(p => 
        p.id === editingParam.id ? { ...p, ...editingParamValues } : p
      );
    }
    // If adding a new param, include it in the calculation
    else if (newParam.areaId && newParam.areaId !== 0) {
      const tempParam: ScoringParam = {
        ...newParam,
        id: 0,
        area: areas.find(a => a.id === newParam.areaId),
        ruleSetId: rulesetData.id,
      } as ScoringParam;
      paramsToCalculate = [...rulesetData.scoringParams, tempParam];
    }
    
    return calculatePercentages(paramsToCalculate);
  }, [rulesetData, editingParam, editingParamValues, newParam, areas]);

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

  const handleEditRuleSet = () => {
    if (!rulesetData) return;
    setEditRuleSetTitle(rulesetData.title);
    setEditRuleSetDescription(rulesetData.description || '');
    setEditRuleSetStatus(rulesetData.status);
    setIsEditRuleSetModalOpen(true);
  };

  const handleSaveRuleSet = async () => {
    if (!rulesetData) return;

    if (!editRuleSetTitle.trim()) {
      alert('Please enter a title');
      return;
    }

    try {
      // If setting to approved, deactivate all other approved rulesets first
      if (editRuleSetStatus === 'approved') {
        const otherApprovedRulesets = allRulesets.filter(
          rs => rs.id !== rulesetData.id && rs.status === 'approved'
        );
        
        // Set all other approved rulesets to draft
        for (const otherRuleset of otherApprovedRulesets) {
          await updateZoneScoringMutation.mutateAsync({
            id: otherRuleset.id,
            data: {
              status: 'draft'
            },
          });
        }
      }

      // Update the current ruleset
      await updateZoneScoringMutation.mutateAsync({
        id: rulesetData.id,
        data: {
          title: editRuleSetTitle.trim(),
          description: editRuleSetDescription.trim() || undefined,
          status: editRuleSetStatus,
        },
      });

      setIsEditRuleSetModalOpen(false);
    } catch (error) {
      console.error('Error updating ruleset:', error);
      alert('Failed to update ruleset');
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
          <div className="mt-2 flex items-center gap-3">
            <StatusBadge status={rulesetData.status as 'draft' | 'pending' | 'approved'} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditRuleSet}
              className="border-gray-300 text-gray-700 rounded-lg h-8 px-3 bg-white hover:bg-gray-50 inline-flex items-center gap-1.5"
            >
              <Edit size={14} />
              Edit Ruleset
            </Button>
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
          calculatedParams={calculatedParams}
        />

        {/* Edit Ruleset Modal */}
        <Dialog open={isEditRuleSetModalOpen} onOpenChange={setIsEditRuleSetModalOpen}>
          <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Edit Ruleset Details
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ruleset-title" className="text-sm font-medium text-gray-700">
                  Title *
                </Label>
                <Input
                  id="ruleset-title"
                  value={editRuleSetTitle}
                  onChange={(e) => setEditRuleSetTitle(e.target.value)}
                  placeholder="e.g., DWASA Zone Scoring 2026"
                  className="border-gray-300 rounded-lg h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ruleset-description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Input
                  id="ruleset-description"
                  value={editRuleSetDescription}
                  onChange={(e) => setEditRuleSetDescription(e.target.value)}
                  placeholder="Optional description"
                  className="border-gray-300 rounded-lg h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ruleset-status" className="text-sm font-medium text-gray-700">
                  Status *
                </Label>
                <Select value={editRuleSetStatus} onValueChange={setEditRuleSetStatus}>
                  <SelectTrigger className="w-full border-gray-300 rounded-lg h-11">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
                {editRuleSetStatus === 'approved' && (
                  <p className="text-xs text-amber-600 mt-1">
                    Note: Setting this to approved will automatically set all other approved rulesets to draft.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditRuleSetModalOpen(false)}
                className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveRuleSet}
                disabled={updateZoneScoringMutation.isPending || !editRuleSetTitle.trim()}
                className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
              >
                {updateZoneScoringMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
