import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Plus, Edit, Upload, Download, X } from 'lucide-react';
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
import type { ZoneScoringRuleSet, ScoringParam, Area, CreateScoringParamDto, Zone, CityCorporation, ZoneScore } from '../types';

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
  const [csvConfirmModalOpen, setCsvConfirmModalOpen] = useState(false);
  const [pendingCSVData, setPendingCSVData] = useState<{
    csvParamsToUpdate: CreateScoringParamDto[];
    csvParamsToAdd: CreateScoringParamDto[];
    existingParams: ScoringParam[];
  } | null>(null);

  // Fetch ruleset by ID
  const { data: rulesetData, isLoading: rulesetLoading } = useApiQuery<ZoneScoringRuleSet>(
    ['zone-scoring', id || ''],
    () => api.zoneScoring.getById(parseInt(id || '0', 10)),
    { enabled: !!id }
  );

  // Fetch areas
  const { data: areasData, isLoading: areasLoading } = useApiQuery<Area[]>(
    ['areas'],
    () => api.area.getAll()
  );
  const areas: Area[] = (areasData ?? []) as Area[];

  // Fetch zones
  const { data: zonesData } = useApiQuery<Zone[]>(
    ['zones'],
    () => api.zones.getAll()
  );
  const zones: Zone[] = (zonesData ?? []) as Zone[];

  // Fetch city corporations
  const { data: cityCorporationsData } = useApiQuery<CityCorporation[]>(
    ['city-corporations'],
    () => api.cityCorporations.getAll()
  );
  const cityCorporations: CityCorporation[] = (cityCorporationsData ?? []) as CityCorporation[];

  // Fetch zone scores from API
  const { data: zoneScoresData } = useApiQuery<ZoneScore[]>(
    ['zone-scoring-scores'],
    () => api.zoneScoring.getScores()
  );
  const zoneScores: ZoneScore[] = (zoneScoresData ?? []) as ZoneScore[];

  // Fetch all rulesets to check for active ones (for future use)
  // const { data: allRulesetsData } = useApiQuery<ZoneScoringRuleSet[]>(
  //   ['zone-scoring'],
  //   () => api.zoneScoring.getAll()
  // );

  // Mutations
  const updateZoneScoringMutation = useApiMutation(
    ({ id, data }: { id: number; data: Parameters<typeof api.zoneScoring.update>[1] }) => api.zoneScoring.update(id, data),
    {
      successMessage: 'Zone scoring rule set updated successfully',
      errorMessage: 'Failed to update zone scoring rule set',
      invalidateQueries: [['zone-scoring'], ['zone-scoring', id || ''], ['approval-requests'], ['approval-requests', 'pending']],
    }
  );

  // Calculate percentages for current rule set (with real-time updates when editing or adding)
  const calculatedParams = useMemo(() => {
    if (!rulesetData || !rulesetData.scoringParams) {
      // If no ruleset data but we're adding a param, calculate with just the new param
      if (newParam.areaId && newParam.areaId !== 0) {
        const areaFromList = areas.find(a => a.id === newParam.areaId);
        const tempParam: ScoringParam = {
          ...newParam,
          id: 0,
          area: areaFromList, // Use area from areas array which has nested zone object
          ruleSetId: 0,
        } as ScoringParam;
        return calculatePercentages([tempParam]);
      }
      return [];
    }
    
    // Enrich scoringParams with areas that have nested zone objects
    let paramsToCalculate = rulesetData.scoringParams.map(param => {
      // Find the area from the areas array (which has nested zone object)
      const areaFromList = areas.find(a => a.id === param.areaId);
      return {
        ...param,
        area: areaFromList || param.area, // Use area from areas array if available, otherwise keep original
      };
    });
    
    // If editing, use the edited values for calculations
    if (editingParam && editingParamValues) {
      paramsToCalculate = paramsToCalculate.map(p => {
        if (p.id === editingParam.id) {
          // Ensure area has nested zone when editing
          const areaFromList = areas.find(a => a.id === p.areaId);
          return { 
            ...p, 
            ...editingParamValues,
            area: areaFromList || p.area,
          };
        }
        return p;
      });
    }
    // If adding a new param, include it in the calculation
    else if (newParam.areaId && newParam.areaId !== 0) {
      const areaFromList = areas.find(a => a.id === newParam.areaId);
      const tempParam: ScoringParam = {
        ...newParam,
        id: 0,
        area: areaFromList, // Use area from areas array which has nested zone object
        ruleSetId: rulesetData.id,
      } as ScoringParam;
      paramsToCalculate = [...paramsToCalculate, tempParam];
    }
    
    return calculatePercentages(paramsToCalculate);
  }, [rulesetData, editingParam, editingParamValues, newParam, areas]);

  const handleEditParam = (param: ScoringParam) => {
    setEditingParam(param);
    setEditingParamValues({
      areaId: param.areaId,
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
      // Use current rulesetData instead of refetching to ensure we have all params
      const existingParams = rulesetData.scoringParams || [];
      
      // Check if area already exists in params
      const areaExists = existingParams.some(p => p.areaId === newParam.areaId);
      if (areaExists) {
        alert('This area already has a parameter in this ruleset');
        return;
      }
      
      // Create new param (calculate percentages and geoMean)
      const newParamWithArea: ScoringParam = {
        ...newParam,
        id: 0, // Temporary ID
        area: areas.find(a => a.id === newParam.areaId) || existingParams[0]?.area,
        areaId: newParam.areaId,
        ruleSetId: rulesetData.id,
      } as ScoringParam;
      
      // Add new param to existing params - recalculate all percentages
      const allParams = [
        ...existingParams,
        newParamWithArea,
      ];
      
      console.log('Adding parameter. Existing params count:', existingParams.length);
      console.log('Total params after adding:', allParams.length);
      
      const recalculatedAllParams = calculatePercentages(allParams);
      
      console.log('Recalculated params count:', recalculatedAllParams.length);
      
      const updatedParams = mapScoringParamsToDto(recalculatedAllParams);
      
      console.log('Updated params DTO count:', updatedParams.length);

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
          // Check if there are actual changes (not just float/int formatting differences)
          const existing = existingParams.find(p => p.areaId === csvParam.areaId);
          if (existing) {
            const hasActualChange = 
              parseFloat(existing.landHomeRate) !== parseFloat(csvParam.landHomeRate) ||
              parseFloat(existing.landRate) !== parseFloat(csvParam.landRate) ||
              parseFloat(existing.landTaxRate) !== parseFloat(csvParam.landTaxRate) ||
              parseFloat(existing.buildingTaxRateUpto120sqm) !== parseFloat(csvParam.buildingTaxRateUpto120sqm) ||
              parseFloat(existing.buildingTaxRateUpto200sqm) !== parseFloat(csvParam.buildingTaxRateUpto200sqm) ||
              parseFloat(existing.buildingTaxRateAbove200sqm) !== parseFloat(csvParam.buildingTaxRateAbove200sqm) ||
              parseFloat(existing.highIncomeGroupConnectionPercentage) !== parseFloat(csvParam.highIncomeGroupConnectionPercentage);
            
            if (hasActualChange) {
              csvParamsToUpdate.push(csvParam);
            }
            // If no actual changes, don't add to update list (treat as no-op)
          } else {
            csvParamsToUpdate.push(csvParam);
          }
        } else {
          csvParamsToAdd.push(csvParam);
        }
      });

      // If there are parameters to update, show confirmation modal
      if (csvParamsToUpdate.length > 0) {
        setPendingCSVData({
          csvParamsToUpdate,
          csvParamsToAdd,
          existingParams,
        });
        setCsvConfirmModalOpen(true);
        setIsParsingCSV(false);
        // Don't reset file input yet - wait for confirmation
        return;
      }

      // If no updates, proceed directly with adding new parameters
      await processCSVUpload(csvParamsToAdd, existingParams, result.data.length, []);
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

  const processCSVUpload = async (
    csvParamsToAdd: CreateScoringParamDto[],
    existingParams: ScoringParam[],
    totalCount: number,
    csvParamsToUpdate?: CreateScoringParamDto[]
  ) => {
    if (!rulesetData) return;

    try {
      const paramsToUpdate = csvParamsToUpdate || pendingCSVData?.csvParamsToUpdate || [];
      
      // Merge: update existing + add new
      const updatedParams = existingParams.map(existing => {
        const csvUpdate = paramsToUpdate.find(c => c.areaId === existing.areaId);
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

      // Update ruleset with merged params and set status to draft
      await updateZoneScoringMutation.mutateAsync({
        id: rulesetData.id,
        data: {
          scoringParams: mapScoringParamsToDto(recalculated),
          status: 'draft', // Automatically set to draft
        },
      });

      const updatedCount = paramsToUpdate.length;
      const addedCount = csvParamsToAdd.length;
      let successMsg = `Successfully imported ${totalCount} parameter(s)`;
      if (updatedCount > 0 && addedCount > 0) {
        successMsg += ` (${updatedCount} updated, ${addedCount} added)`;
      } else if (updatedCount > 0) {
        successMsg += ` (${updatedCount} updated)`;
      } else if (addedCount > 0) {
        successMsg += ` (${addedCount} added)`;
      }
      successMsg += '. Ruleset status changed to Draft - please send for approval again.';
      
      setCsvUploadSuccess(successMsg);
      
      // Reset pending data
      setPendingCSVData(null);
    } catch (error) {
      setCsvUploadError(`Failed to process CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPendingCSVData(null);
    } finally {
      setIsParsingCSV(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCSVConfirm = async () => {
    if (!pendingCSVData || !rulesetData) return;
    
    setIsParsingCSV(true);
    setCsvConfirmModalOpen(false);
    
    await processCSVUpload(
      pendingCSVData.csvParamsToAdd,
      pendingCSVData.existingParams,
      pendingCSVData.csvParamsToUpdate.length + pendingCSVData.csvParamsToAdd.length,
      pendingCSVData.csvParamsToUpdate
    );
  };

  const handleCSVCancel = () => {
    setCsvConfirmModalOpen(false);
    setPendingCSVData(null);
    setIsParsingCSV(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
                zoneScores={zoneScores}
                ruleSetId={rulesetData?.id}
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
          zones={zones}
          cityCorporations={cityCorporations}
          onAdd={handleAddParameter}
          isPending={updateZoneScoringMutation.isPending}
          calculatedParams={calculatedParams}
          ruleSetId={rulesetData?.id}
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

        {/* CSV Update Confirmation Modal */}
        <Dialog open={csvConfirmModalOpen} onOpenChange={setCsvConfirmModalOpen}>
          <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Confirm CSV Upload
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-4">
                This CSV will modify <span className="font-semibold text-gray-900">{pendingCSVData?.csvParamsToUpdate.length || 0} existing parameter(s)</span>.
                {pendingCSVData && pendingCSVData.csvParamsToUpdate.length > 0 && (
                  <span className="block mt-2 text-xs text-gray-500">
                    The following areas will be updated:
                  </span>
                )}
              </p>
              {pendingCSVData && pendingCSVData.csvParamsToUpdate.length > 0 && (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50 mb-4">
                  <div className="space-y-2">
                    {pendingCSVData.csvParamsToUpdate.map((param, idx) => {
                      const area = areas.find(a => a.id === param.areaId);
                      const existing = pendingCSVData.existingParams.find(p => p.areaId === param.areaId);
                      
                      // Helper function to check if values are actually different (ignoring float/int formatting)
                      const isDifferent = (oldVal: string, newVal: string): boolean => {
                        const oldNum = parseFloat(oldVal);
                        const newNum = parseFloat(newVal);
                        return !isNaN(oldNum) && !isNaN(newNum) && oldNum !== newNum;
                      };
                      
                      // Get all fields that have changed
                      const changedFields: Array<{ label: string; oldVal: string; newVal: string }> = [];
                      
                      if (existing) {
                        if (isDifferent(existing.landHomeRate, param.landHomeRate)) {
                          changedFields.push({ label: 'Land+Home Rate', oldVal: existing.landHomeRate, newVal: param.landHomeRate });
                        }
                        if (isDifferent(existing.landRate, param.landRate)) {
                          changedFields.push({ label: 'Land Rate', oldVal: existing.landRate, newVal: param.landRate });
                        }
                        if (isDifferent(existing.landTaxRate, param.landTaxRate)) {
                          changedFields.push({ label: 'Land Tax Rate', oldVal: existing.landTaxRate, newVal: param.landTaxRate });
                        }
                        if (isDifferent(existing.buildingTaxRateUpto120sqm, param.buildingTaxRateUpto120sqm)) {
                          changedFields.push({ label: 'Building Tax (≤120sqm)', oldVal: existing.buildingTaxRateUpto120sqm, newVal: param.buildingTaxRateUpto120sqm });
                        }
                        if (isDifferent(existing.buildingTaxRateUpto200sqm, param.buildingTaxRateUpto200sqm)) {
                          changedFields.push({ label: 'Building Tax (≤200sqm)', oldVal: existing.buildingTaxRateUpto200sqm, newVal: param.buildingTaxRateUpto200sqm });
                        }
                        if (isDifferent(existing.buildingTaxRateAbove200sqm, param.buildingTaxRateAbove200sqm)) {
                          changedFields.push({ label: 'Building Tax (>200sqm)', oldVal: existing.buildingTaxRateAbove200sqm, newVal: param.buildingTaxRateAbove200sqm });
                        }
                        if (isDifferent(existing.highIncomeGroupConnectionPercentage, param.highIncomeGroupConnectionPercentage)) {
                          changedFields.push({ label: 'High Income %', oldVal: existing.highIncomeGroupConnectionPercentage, newVal: param.highIncomeGroupConnectionPercentage });
                        }
                      }
                      
                      return (
                        <div key={idx} className="text-xs bg-white p-2 rounded border border-gray-200">
                          <div className="font-medium text-gray-900">
                            {area?.name || `Area ${param.areaId}`}
                          </div>
                          {changedFields.length > 0 ? (
                            <div className="text-gray-600 mt-1 space-y-0.5">
                              {changedFields.map((field, fieldIdx) => (
                                <div key={fieldIdx}>
                                  {field.label}: {field.oldVal} → {field.newVal}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-500 mt-1 italic">
                              No actual changes detected (values are the same)
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {pendingCSVData && pendingCSVData.csvParamsToAdd.length > 0 && (
                <p className="text-sm text-gray-600">
                  Additionally, <span className="font-semibold text-gray-900">{pendingCSVData.csvParamsToAdd.length} new parameter(s)</span> will be added.
                </p>
              )}
              <p className="text-sm text-red-600 mt-4 font-medium">
                The ruleset status will be changed to Draft and you'll need to send it for approval again.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCSVCancel}
                className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCSVConfirm}
                disabled={isParsingCSV}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-10 px-6 disabled:opacity-50"
              >
                {isParsingCSV ? 'Processing...' : 'Confirm & Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
