import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useState, useRef, useMemo } from 'react';
import { Plus, X, Trash2, Upload, Download } from 'lucide-react';
import { api } from '../services/api';
import { useApiMutation, useApiQuery } from '../hooks/useApiQuery';
import { PageHeader } from '../components/zoneScoring/PageHeader';
import { ScoringParameterFormFields } from '../components/zoneScoring/ScoringParameterFormFields';
import { initializeScoringParam, calculatePercentages, mapScoringParamsToDto } from '../utils/zoneScoringUtils';
import { parseScoringParamsCSV, generateCSVTemplate } from '../utils/csvParser';
import type { CreateZoneScoringRuleSetDto, CreateScoringParamDto, Area, ScoringParam } from '../types';

export function ZoneScoringCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'pending' | 'approved'>('draft');
  const [scoringParams, setScoringParams] = useState<CreateScoringParamDto[]>([]);
  const [isAddParamModalOpen, setIsAddParamModalOpen] = useState(false);
  const [newParam, setNewParam] = useState<CreateScoringParamDto>(initializeScoringParam());
  const [csvUploadError, setCsvUploadError] = useState<string | null>(null);
  const [csvUploadSuccess, setCsvUploadSuccess] = useState<string | null>(null);
  const [isParsingCSV, setIsParsingCSV] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch areas
  const { data: areasData, isLoading: areasLoading } = useApiQuery<Area[]>(
    ['areas'],
    () => api.area.getAll()
  );
  const areas: Area[] = (areasData ?? []) as Area[];

  // Fetch all rulesets to check for active ones
  const { data: allRulesetsData } = useApiQuery(
    ['zone-scoring'],
    () => api.zoneScoring.getAll()
  );
  const allRulesets = (allRulesetsData ?? []) as any[];

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
      successMessage: 'Ruleset updated successfully',
      errorMessage: 'Failed to update ruleset',
      invalidateQueries: [['zone-scoring']],
    }
  );

  // Calculate percentages for all params including the new one being added
  const calculatedParams = useMemo(() => {
    let paramsToCalculate: ScoringParam[] = scoringParams.map(p => ({
      ...p,
      id: 0,
      area: areas.find(a => a.id === p.areaId),
      ruleSetId: 0,
    } as ScoringParam));

    // If adding a new param, include it in the calculation
    if (newParam.areaId && newParam.areaId !== 0) {
      const tempParam: ScoringParam = {
        ...newParam,
        id: 0,
        area: areas.find(a => a.id === newParam.areaId),
        ruleSetId: 0,
      } as ScoringParam;
      paramsToCalculate = [...paramsToCalculate, tempParam];
    }

    return calculatePercentages(paramsToCalculate);
  }, [scoringParams, newParam, areas]);

  const handleAddParameter = () => {
    if (!newParam.areaId || newParam.areaId === 0) {
      alert('Please select an area');
      return;
    }

    if (!newParam.landHomeRate || !newParam.landRate || !newParam.landTaxRate) {
      alert('Please fill in all required scoring fields');
      return;
    }

    // Check if area already exists in params
    if (scoringParams.some(p => p.areaId === newParam.areaId)) {
      alert('This area already has a scoring parameter. Please select a different area.');
      return;
    }

    // Convert existing params and new param to ScoringParam format for calculation
    const tempParam: ScoringParam = {
      ...newParam,
      id: 0,
      area: areas.find(a => a.id === newParam.areaId) || undefined,
      ruleSetId: 0,
    } as ScoringParam;

    const allParams = [
      ...scoringParams.map(p => ({
        ...p,
        id: 0,
        area: areas.find(a => a.id === p.areaId),
        ruleSetId: 0,
      } as ScoringParam)),
      tempParam,
    ];

    // Recalculate all params with the new one included (percentages depend on all params)
    const calculatedParams = calculatePercentages(allParams);

    // Convert back to DTO format and update state
    const recalculatedParams = mapScoringParamsToDto(calculatedParams);
    setScoringParams(recalculatedParams);
    setNewParam(initializeScoringParam());
    setIsAddParamModalOpen(false);
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
        // Reset file input
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

      // Check for duplicate areas with existing params (if any manually added)
      const duplicateAreasWithExisting = result.data.filter(param =>
        scoringParams.some(p => p.areaId === param.areaId)
      );

      if (duplicateAreasWithExisting.length > 0) {
        const duplicateIds = duplicateAreasWithExisting.map(p => p.areaId);
        const duplicateNames = duplicateIds.map(id => {
          const area = areas.find(a => a.id === id);
          return area?.name || `Area ${id}`;
        });
        setCsvUploadError(`Areas already exist: ${duplicateNames.join(', ')}. Please remove them first or use different areas.`);
        setIsParsingCSV(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Merge with existing params (if any) for percentage calculation
      const existingParamsForCalc: ScoringParam[] = scoringParams.map(p => ({
        ...p,
        id: 0,
        area: areas.find(a => a.id === p.areaId),
        ruleSetId: 0,
      } as ScoringParam));

      // Convert CSV params to ScoringParam format for calculation
      const csvParamsForCalculation: ScoringParam[] = result.data.map(param => ({
        ...param,
        id: 0,
        area: areas.find(a => a.id === param.areaId),
        ruleSetId: 0,
      } as ScoringParam));

      // Combine existing and CSV params, then calculate percentages for all
      const allParamsForCalculation = [...existingParamsForCalc, ...csvParamsForCalculation];
      const calculatedParams = calculatePercentages(allParamsForCalculation);

      // Convert back to DTO format
      const calculatedDtos = mapScoringParamsToDto(calculatedParams);

      // Update state with all params (existing + CSV)
      setScoringParams(calculatedDtos);
      setCsvUploadSuccess(`Successfully imported ${calculatedDtos.length} parameter(s)`);
      
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

  const handleRemoveParameter = (index: number) => {
    const updatedParams = scoringParams.filter((_, i) => i !== index);
    
    // Recalculate percentages for remaining params
    if (updatedParams.length > 0) {
      const paramsForCalculation = updatedParams.map(p => ({
        ...p,
        id: 0,
        area: areas.find(a => a.id === p.areaId),
        ruleSetId: 0,
      } as ScoringParam));
      
      const recalculated = calculatePercentages(paramsForCalculation);
      setScoringParams(mapScoringParamsToDto(recalculated));
    } else {
      setScoringParams([]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Please enter a title for the ruleset');
      return;
    }

    if (scoringParams.length === 0) {
      alert('Please add at least one scoring parameter');
      return;
    }

    try {
      // If setting to approved, deactivate all other approved rulesets first
      if (status === 'approved') {
        const otherApprovedRulesets = allRulesets.filter(
          rs => rs.status === 'approved'
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

      await createZoneScoringMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        scoringParams,
      });
      navigate('/tariff-admin/zone-scoring');
    } catch (error) {
      console.error('Error creating ruleset:', error);
      alert('Failed to create ruleset. Please check the console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-8 py-6">
        <PageHeader
          title="Create New Ruleset"
          description="Create a new zone scoring ruleset"
          backUrl="/tariff-admin/zone-scoring"
        />

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-4xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., DWASA Zone Scoring 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-gray-300 rounded-lg h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <textarea
                id="description"
                placeholder="Optional description for this ruleset"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] text-sm"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                Status
              </Label>
              <Select value={status} onValueChange={(value: 'draft' | 'pending' | 'approved') => setStatus(value)}>
                <SelectTrigger className="w-full border-gray-300 rounded-lg h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
              {status === 'approved' && (
                <p className="text-xs text-amber-600 mt-1">
                  Note: Only one ruleset can be approved at a time. Setting this to approved will automatically set any other approved ruleset to draft.
                </p>
              )}
            </div>
          </div>

          {/* Scoring Parameters Section */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Scoring Parameters</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Add at least one scoring parameter for this ruleset
                </p>
              </div>
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
                  id="csv-upload-input"
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
                  type="button"
                  onClick={() => setIsAddParamModalOpen(true)}
                  disabled={areas.length === 0}
                  className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-4 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {scoringParams.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 mb-2">No scoring parameters added yet</p>
                <p className="text-sm text-gray-400">Click "Add Parameter" to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scoringParams.map((param, index) => {
                  const area = areas.find(a => a.id === param.areaId);
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {area?.name || `Area ${param.areaId}`}
                            </span>
                            <span className="text-xs text-gray-500">
                              (Land+Home: {param.landHomeRate}, Land: {param.landRate}, Land Tax: {param.landTaxRate})
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>GeoMean: {param.geoMean}</div>
                            <div>Land+Home %: {param.landHomeRatePercentage}%</div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveParameter(index)}
                          className="border-red-300 text-red-700 rounded-lg h-8 px-3 bg-white hover:bg-red-50 inline-flex items-center gap-1.5"
                        >
                          <Trash2 size={14} />
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => navigate('/tariff-admin/zone-scoring')}
              className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createZoneScoringMutation.isPending || !title.trim() || scoringParams.length === 0}
              className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
            >
              {createZoneScoringMutation.isPending ? 'Creating...' : 'Create Ruleset'}
            </Button>
          </div>
        </div>

        {/* Add Parameter Modal */}
        {isAddParamModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Add Scoring Parameter</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAddParamModalOpen(false);
                      setNewParam(initializeScoringParam());
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X size={20} />
                  </Button>
                </div>
                
                <div className="space-y-4">
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
                        {areasLoading ? (
                          <SelectItem value="0" disabled>Loading areas...</SelectItem>
                        ) : areas.length === 0 ? (
                          <SelectItem value="0" disabled>No areas available</SelectItem>
                        ) : areas.filter(area => !scoringParams.some(p => p.areaId === area.id)).length === 0 ? (
                          <SelectItem value="0" disabled>All areas already added</SelectItem>
                        ) : (
                          areas
                            .filter(area => !scoringParams.some(p => p.areaId === area.id))
                            .map((area) => (
                              <SelectItem key={area.id} value={area.id.toString()}>
                                {area.name}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <ScoringParameterFormFields
                    values={newParam}
                    onChange={(field, value) => setNewParam({ ...newParam, [field]: value })}
                    calculatedParams={calculatedParams}
                    showPercentages={true}
                    showReadOnlyFields={true}
                  />
                </div>

                <div className="flex items-center justify-end gap-4 mt-6 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddParamModalOpen(false);
                      setNewParam(initializeScoringParam());
                    }}
                    className="border-gray-300 text-gray-700 rounded-lg h-10 px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddParameter}
                    className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6"
                  >
                    Add Parameter
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
