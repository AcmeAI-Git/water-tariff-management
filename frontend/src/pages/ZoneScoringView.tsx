import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Plus, Edit, Upload, Download, X, Trash2 } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation, useAdminId } from '../hooks/useApiQuery';
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
import { calculatePercentages, initializeScoringParam, mapScoringParamsToDto } from '../utils/zoneScoringUtils';
import { parseScoringParamsCSV, generateCSVTemplate } from '../utils/csvParser';
import type { ZoneScoringRuleSet, ScoringParam, Area, CreateScoringParamDto, Zone, CityCorporation } from '../types';

export function ZoneScoringView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const adminId = useAdminId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingParam, setEditingParam] = useState<ScoringParam | null>(null);
  const [editingParamValues, setEditingParamValues] = useState<Partial<ScoringParam> | null>(null);
  const [isEditParamModalOpen, setIsEditParamModalOpen] = useState(false);
  const [isAddParamModalOpen, setIsAddParamModalOpen] = useState(false);
  const [isEditRuleSetModalOpen, setIsEditRuleSetModalOpen] = useState(false);
  const [editRuleSetTitle, setEditRuleSetTitle] = useState('');
  const [editRuleSetDescription, setEditRuleSetDescription] = useState('');
  const [newParam, setNewParam] = useState<CreateScoringParamDto>(
    initializeScoringParam()
  );
  const [csvUploadError, setCsvUploadError] = useState<string | null>(null);
  const [csvUploadSuccess, setCsvUploadSuccess] = useState<string | null>(null);
  const [isParsingCSV, setIsParsingCSV] = useState(false);

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
      invalidateQueries: [['zone-scoring'], ['zone-scoring', id], ['approval-requests'], ['approval-requests', 'pending']],
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
    
    // Check for and handle pending approval requests
    try {
      const approvalRequests = await api.approvalRequests.getAll({ moduleName: 'ZoneScoring' });
      const pendingRequest = approvalRequests.find(
        req => req.recordId === rulesetData.id && 
        req.moduleName === 'ZoneScoring' &&
        (req.approvalStatus?.statusName === 'Pending' || req.approvalStatus?.name === 'Pending')
      );

      // If pending approval request exists, reject it to avoid orphaned state
      if (pendingRequest && adminId) {
        try {
          await api.approvalRequests.review(pendingRequest.id, {
            reviewedBy: adminId,
            status: 'Rejected',
            comments: 'Automatically rejected due to parameter modification - ruleset set to draft'
          });
        } catch (error) {
          console.warn('Failed to reject pending approval request:', error);
          // Continue with update even if approval request rejection fails
        }
      }
    } catch (error) {
      console.warn('Failed to check for pending approval requests:', error);
      // Continue with update even if approval request check fails
    }
    
    await updateZoneScoringMutation.mutateAsync({
      id: rulesetData.id,
      data: {
        scoringParams: mapScoringParamsToDto(updatedParams),
        status: 'draft', // Automatically set to draft when parameters are modified
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

      // Check for and handle pending approval requests
      try {
        const approvalRequests = await api.approvalRequests.getAll({ moduleName: 'ZoneScoring' });
        const pendingRequest = approvalRequests.find(
          req => req.recordId === rulesetData.id && 
          req.moduleName === 'ZoneScoring' &&
          (req.approvalStatus?.statusName === 'Pending' || req.approvalStatus?.name === 'Pending')
        );

        // If pending approval request exists, reject it to avoid orphaned state
        if (pendingRequest && adminId) {
          try {
            await api.approvalRequests.review(pendingRequest.id, {
              reviewedBy: adminId,
              status: 'Rejected',
              comments: 'Automatically rejected due to parameter addition - ruleset set to draft'
            });
          } catch (error) {
            console.warn('Failed to reject pending approval request:', error);
            // Continue with update even if approval request rejection fails
          }
        }
      } catch (error) {
        console.warn('Failed to check for pending approval requests:', error);
        // Continue with update even if approval request check fails
      }

      // Update rule set with new params
      await updateZoneScoringMutation.mutateAsync({
        id: rulesetData.id,
        data: {
          scoringParams: updatedParams,
          status: 'draft', // Automatically set to draft when parameters are added
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
    setIsEditRuleSetModalOpen(true);
  };

  const handleSaveRuleSet = async () => {
    if (!rulesetData) return;

    if (!editRuleSetTitle.trim()) {
      alert('Please enter a title');
      return;
    }

    try {
      // Update the current ruleset (status cannot be changed here - only through approval workflow)
      await updateZoneScoringMutation.mutateAsync({
        id: rulesetData.id,
        data: {
          title: editRuleSetTitle.trim(),
          description: editRuleSetDescription.trim() || undefined,
        },
      });

      setIsEditRuleSetModalOpen(false);
    } catch (error) {
      console.error('Error updating ruleset:', error);
      alert('Failed to update ruleset');
    }
  };

  const handleRemoveParameter = async (paramId: number) => {
    if (!rulesetData) return;

    // Confirm deletion
    if (!confirm('Are you sure you want to remove this parameter? This will set the ruleset status to draft and require re-approval.')) {
      return;
    }

    try {
      // Get current rule set with all params
      const currentRuleSet = await api.zoneScoring.getById(rulesetData.id);
      
      // Remove the parameter
      const remainingParams = (currentRuleSet.scoringParams || []).filter(p => p.id !== paramId);
      
      if (remainingParams.length === 0) {
        alert('Cannot remove the last parameter. A ruleset must have at least one parameter.');
        return;
      }

      // Recalculate percentages for remaining params
      const recalculatedParams = calculatePercentages(remainingParams);
      const updatedParams = mapScoringParamsToDto(recalculatedParams);

      // Check for and handle pending approval requests
      try {
        const approvalRequests = await api.approvalRequests.getAll({ moduleName: 'ZoneScoring' });
        const pendingRequest = approvalRequests.find(
          req => req.recordId === rulesetData.id && 
          req.moduleName === 'ZoneScoring' &&
          (req.approvalStatus?.statusName === 'Pending' || req.approvalStatus?.name === 'Pending')
        );

        // If pending approval request exists, reject it to avoid orphaned state
        if (pendingRequest && adminId) {
          try {
            await api.approvalRequests.review(pendingRequest.id, {
              reviewedBy: adminId,
              status: 'Rejected',
              comments: 'Automatically rejected due to parameter removal - ruleset set to draft'
            });
          } catch (error) {
            console.warn('Failed to reject pending approval request:', error);
            // Continue with update even if approval request rejection fails
          }
        }
      } catch (error) {
        console.warn('Failed to check for pending approval requests:', error);
        // Continue with update even if approval request check fails
      }

      // Update rule set with remaining params
      await updateZoneScoringMutation.mutateAsync({
        id: rulesetData.id,
        data: {
          scoringParams: updatedParams,
          status: 'draft', // Automatically set to draft when parameters are removed
        },
      });
    } catch (error) {
      console.error('Error removing parameter:', error);
      alert('Failed to remove parameter');
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !rulesetData) return;

    // Reset messages
    setCsvUploadError(null);
    setCsvUploadSuccess(null);
    setIsParsingCSV(true);

    try {
      // Parse CSV
      const result = await parseScoringParamsCSV(file, areas);

      if (!result.success || result.data.length === 0) {
        const errorMsg = result.errors.length > 0
          ? result.errors.join('; ')
          : 'Failed to parse CSV file';
        setCsvUploadError(errorMsg);
        setIsParsingCSV(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Check for duplicate areas in CSV
      const duplicateAreasInCSV = result.data.filter((param, index, self) =>
        self.findIndex(p => p.areaId === param.areaId) !== index
      );

      if (duplicateAreasInCSV.length > 0) {
        const duplicateIds = [...new Set(duplicateAreasInCSV.map(p => p.areaId))];
        const duplicateNames = duplicateIds.map(id => {
          const area = areas.find(a => a.id === id);
          return area?.name || `Area ${id}`;
        });
        setCsvUploadError(`Duplicate areas found in CSV: ${duplicateNames.join(', ')}`);
        setIsParsingCSV(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Get current ruleset data to merge with
      const currentRuleSet = await api.zoneScoring.getById(rulesetData.id);
      const existingParams = currentRuleSet.scoringParams || [];

      // Separate CSV params into those that update existing vs those that are new
      const existingParamIds = new Set(existingParams.map(p => p.areaId));
      const csvParamsToAdd: CreateScoringParamDto[] = [];
      const csvParamsToUpdate: CreateScoringParamDto[] = [];

      result.data.forEach(csvParam => {
        if (existingParamIds.has(csvParam.areaId)) {
          csvParamsToUpdate.push(csvParam);
        } else {
          csvParamsToAdd.push(csvParam);
        }
      });

      // Merge: update existing + add new
      const updatedParams = existingParams.map(existing => {
        const csvUpdate = csvParamsToUpdate.find(c => c.areaId === existing.areaId);
        if (csvUpdate) {
          // Update existing parameter with CSV values
          return {
            ...existing,
            landHomeRate: csvUpdate.landHomeRate,
            landRate: csvUpdate.landRate,
            landTaxRate: csvUpdate.landTaxRate,
            buildingTaxRateUpto120sqm: csvUpdate.buildingTaxRateUpto120sqm,
            buildingTaxRateUpto200sqm: csvUpdate.buildingTaxRateUpto200sqm,
            buildingTaxRateAbove200sqm: csvUpdate.buildingTaxRateAbove200sqm,
            highIncomeGroupConnectionPercentage: csvUpdate.highIncomeGroupConnectionPercentage,
          };
        }
        return existing;
      });

      // Add new parameters from CSV
      const allParams: ScoringParam[] = [
        ...updatedParams,
        ...csvParamsToAdd.map(csv => ({
          ...csv,
          id: 0, // New params don't have ID yet
          area: areas.find(a => a.id === csv.areaId),
          areaId: csv.areaId,
          ruleSetId: rulesetData.id,
          landHomeRatePercentage: '',
          landRatePercentage: '',
          landTaxRatePercentage: '',
          buildingTaxRateUpto120sqmPercentage: '',
          buildingTaxRateUpto200sqmPercentage: '',
          buildingTaxRateAbove200sqmPercentage: '',
          geoMean: '',
        } as ScoringParam))
      ];

      // Recalculate percentages for all parameters
      const recalculated = calculatePercentages(allParams);

      // Check for and handle pending approval requests
      try {
        const approvalRequests = await api.approvalRequests.getAll({ moduleName: 'ZoneScoring' });
        const pendingRequest = approvalRequests.find(
          req => req.recordId === rulesetData.id && 
          req.moduleName === 'ZoneScoring' &&
          (req.approvalStatus?.statusName === 'Pending' || req.approvalStatus?.name === 'Pending')
        );

        // If pending approval request exists, reject it to avoid orphaned state
        if (pendingRequest && adminId) {
          try {
            await api.approvalRequests.review(pendingRequest.id, {
              reviewedBy: adminId,
              status: 'Rejected',
              comments: 'Automatically rejected due to CSV upload - ruleset modified and set to draft'
            });
          } catch (error) {
            console.warn('Failed to reject pending approval request:', error);
            // Continue with update even if approval request rejection fails
          }
        }
      } catch (error) {
        console.warn('Failed to check for pending approval requests:', error);
        // Continue with update even if approval request check fails
      }

      // Update ruleset with merged params and set status to draft
      await updateZoneScoringMutation.mutateAsync({
        id: rulesetData.id,
        data: {
          scoringParams: mapScoringParamsToDto(recalculated),
          status: 'draft', // Automatically set to draft
        },
      });

      const updatedCount = csvParamsToUpdate.length;
      const addedCount = csvParamsToAdd.length;
      let successMsg = `Successfully imported ${result.data.length} parameter(s)`;
      if (updatedCount > 0 && addedCount > 0) {
        successMsg += ` (${updatedCount} updated, ${addedCount} added)`;
      } else if (updatedCount > 0) {
        successMsg += ` (${updatedCount} updated)`;
      } else if (addedCount > 0) {
        successMsg += ` (${addedCount} added)`;
      }
      successMsg += '. Ruleset status changed to Draft - please send for approval again.';
      
      setCsvUploadSuccess(successMsg);
      
      // Show warnings if any
      if (result.warnings.length > 0) {
        console.warn('CSV import warnings:', result.warnings);
      }
    } catch (error) {
      setCsvUploadError(`Failed to process CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsParsingCSV(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zone_scoring_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            <StatusBadge status={rulesetData.status as 'draft' | 'pending' | 'approved' | 'active' | 'published'} />
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
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Zone Scoring Parameters ({calculatedParams.length} total)
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadTemplate}
                    className="border-gray-300 text-gray-700 rounded-lg h-10 px-4 flex items-center gap-2 bg-white hover:bg-gray-50"
                  >
                    <Download size={16} />
                    Download Template
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                    id="csv-upload-input-edit"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={areas.length === 0 || isParsingCSV}
                    className="border-gray-300 text-gray-700 rounded-lg h-10 px-4 flex items-center gap-2 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload size={16} />
                    {isParsingCSV ? 'Parsing...' : 'Upload CSV'}
                  </Button>
                  <Button 
                    onClick={() => setIsAddParamModalOpen(true)}
                    className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-4 flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Parameter
                  </Button>
                </div>
              </div>

              {/* CSV Upload Messages */}
              {csvUploadError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">CSV Upload Error</p>
                      <p className="text-sm text-red-700 mt-1">{csvUploadError}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCsvUploadError(null)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              )}

              {csvUploadSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">CSV Upload Success</p>
                      <p className="text-sm text-green-700 mt-1">{csvUploadSuccess}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCsvUploadSuccess(null)}
                      className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <ScrollNavigationControls tableScrollRef={tableScrollRef} calculatedParams={calculatedParams} />
            <div ref={tableScrollRef} className="overflow-x-auto" id="zone-scoring-table-scroll">
              <ScoringParametersTable 
                calculatedParams={calculatedParams}
                onEditParam={handleEditParam}
                onRemoveParam={handleRemoveParameter}
                zones={zones}
                cityCorporations={cityCorporations}
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
              {rulesetData && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Status
                  </Label>
                  <div className="pt-2">
                    <StatusBadge status={rulesetData.status as 'draft' | 'pending' | 'approved' | 'active' | 'published'} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Status can only be changed through the approval workflow. Use "Send for Approval" from the rulesets list.
                  </p>
                </div>
              )}
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
