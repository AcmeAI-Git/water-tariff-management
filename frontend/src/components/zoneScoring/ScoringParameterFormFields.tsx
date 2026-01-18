import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { ScoringParam, CreateScoringParamDto } from '../../types';

interface ScoringParameterFormFieldsProps {
  values: Partial<ScoringParam> | CreateScoringParamDto;
  onChange: (field: string, value: string) => void;
  calculatedParams?: ScoringParam[];
  editingParamId?: number;
  showPercentages?: boolean;
  showReadOnlyFields?: boolean;
}

export function ScoringParameterFormFields({
  values,
  onChange,
  calculatedParams = [],
  editingParamId,
  showPercentages = true,
  showReadOnlyFields = false,
}: ScoringParameterFormFieldsProps) {
  const getPercentageValue = (field: string): string => {
    if (!showPercentages || !calculatedParams.length) return '-';
    
    // If there's only one parameter, percentages are meaningless (would be 100%)
    if (calculatedParams.length <= 1) return '-';
    
    let param: ScoringParam | undefined;
    
    // If editing, find the param by ID
    if (editingParamId) {
      param = calculatedParams.find(p => p.id === editingParamId);
    } else {
      // For new params (add modal), find by matching areaId
      const areaId = (values as any).areaId;
      if (areaId) {
        param = calculatedParams.find(p => p.areaId === areaId);
      }
    }
    
    if (!param) return '-';
    
    const percentageMap: Record<string, keyof ScoringParam> = {
      landHomeRate: 'landHomeRatePercentage',
      landRate: 'landRatePercentage',
      landTaxRate: 'landTaxRatePercentage',
      buildingTaxRateUpto120sqm: 'buildingTaxRateUpto120sqmPercentage',
      buildingTaxRateUpto200sqm: 'buildingTaxRateUpto200sqmPercentage',
      buildingTaxRateAbove200sqm: 'buildingTaxRateAbove200sqmPercentage',
      highIncomeGroupConnectionPercentage: 'highIncomeGroupConnectionPercentage',
    };
    
    const percentageField = percentageMap[field];
    return percentageField ? (param[percentageField] as string) || '-' : '-';
  };

  const getGeoMeanValue = (): string => {
    if (!calculatedParams.length) return '-';
    
    // If there's only one parameter, geoMean is meaningless
    if (calculatedParams.length <= 1) return '-';
    
    // For new params (add modal), check if all required fields are filled
    if (!editingParamId) {
      const hasAllRequiredFields = 
        values.landHomeRate && 
        values.landRate && 
        values.landTaxRate && 
        values.buildingTaxRateUpto120sqm && 
        values.buildingTaxRateUpto200sqm && 
        values.buildingTaxRateAbove200sqm && 
        values.highIncomeGroupConnectionPercentage;
      
      // Don't show GeoMean until all required fields are filled
      if (!hasAllRequiredFields) return '-';
    }
    
    let param: ScoringParam | undefined;
    
    // If editing, find the param by ID
    if (editingParamId) {
      param = calculatedParams.find(p => p.id === editingParamId);
    } else {
      // For new params (add modal), find by matching areaId
      const areaId = (values as any).areaId;
      if (areaId) {
        param = calculatedParams.find(p => p.areaId === areaId);
      }
    }
    
    return param?.geoMean || '-';
  };

  const getZoneScoreValue = (): string => {
    // Zone score is calculated by the backend API using zone-grouped calculations
    // Score = averageGeomean / zoneGeomean (where zoneGeomean is average of geoMeans for areas in that zone)
    // This field is read-only and will be populated when the ruleset is published
    return '-';
  };

  const gridCols = showPercentages ? 'grid-cols-2' : 'grid-cols-1';
  
  return (
    <div className="space-y-6">
      {/* Land + Home Rate */}
      <div className={`grid ${gridCols} gap-4 items-end`}>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Land+Home Rate (BDT/sqm) <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={values.landHomeRate || ''}
            onChange={(e) => onChange('landHomeRate', e.target.value)}
            placeholder="e.g., 32896.00"
            className="border-gray-300 rounded-lg h-11"
          />
        </div>
        {showPercentages && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">% of Land+Home Rate</Label>
            <Input
              value={getPercentageValue('landHomeRate')}
              readOnly
              className="border-gray-300 rounded-lg h-11 bg-gray-50"
            />
          </div>
        )}
      </div>

      {/* Land Rate */}
      <div className={`grid ${gridCols} gap-4 items-end`}>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Land Rate (BDT/sqm) <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={values.landRate || ''}
            onChange={(e) => onChange('landRate', e.target.value)}
            placeholder="e.g., 20000.00"
            className="border-gray-300 rounded-lg h-11"
          />
        </div>
        {showPercentages && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">% of Land Rate</Label>
            <Input
              value={getPercentageValue('landRate')}
              readOnly
              className="border-gray-300 rounded-lg h-11 bg-gray-50"
            />
          </div>
        )}
      </div>

      {/* Land Tax Rate */}
      <div className={`grid ${gridCols} gap-4 items-end`}>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Land Tax Rate (BDT/sqm) <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={values.landTaxRate || ''}
            onChange={(e) => onChange('landTaxRate', e.target.value)}
            placeholder="e.g., 5000.00"
            className="border-gray-300 rounded-lg h-11"
          />
        </div>
        {showPercentages && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">% of Land Tax Rate</Label>
            <Input
              value={getPercentageValue('landTaxRate')}
              readOnly
              className="border-gray-300 rounded-lg h-11 bg-gray-50"
            />
          </div>
        )}
      </div>

      {/* Building Tax Rate (≤120sqm) */}
      <div className={`grid ${gridCols} gap-4 items-end`}>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Building Tax Rate (≤120sqm) (BDT/sqm) <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={values.buildingTaxRateUpto120sqm || ''}
            onChange={(e) => onChange('buildingTaxRateUpto120sqm', e.target.value)}
            placeholder="e.g., 700.00"
            className="border-gray-300 rounded-lg h-11"
          />
        </div>
        {showPercentages && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">% Building Tax (≤120sqm)</Label>
            <Input
              value={getPercentageValue('buildingTaxRateUpto120sqm')}
              readOnly
              className="border-gray-300 rounded-lg h-11 bg-gray-50"
            />
          </div>
        )}
      </div>

      {/* Building Tax Rate (≤200sqm) */}
      <div className={`grid ${gridCols} gap-4 items-end`}>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Building Tax Rate (≤200sqm) (BDT/sqm) <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={values.buildingTaxRateUpto200sqm || ''}
            onChange={(e) => onChange('buildingTaxRateUpto200sqm', e.target.value)}
            placeholder="e.g., 850.00"
            className="border-gray-300 rounded-lg h-11"
          />
        </div>
        {showPercentages && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">% Building Tax (≤200sqm)</Label>
            <Input
              value={getPercentageValue('buildingTaxRateUpto200sqm')}
              readOnly
              className="border-gray-300 rounded-lg h-11 bg-gray-50"
            />
          </div>
        )}
      </div>

      {/* Building Tax Rate (>200sqm) */}
      <div className={`grid ${gridCols} gap-4 items-end`}>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Building Tax Rate (&gt;200sqm) (BDT/sqm) <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={values.buildingTaxRateAbove200sqm || ''}
            onChange={(e) => onChange('buildingTaxRateAbove200sqm', e.target.value)}
            placeholder="e.g., 1300.00"
            className="border-gray-300 rounded-lg h-11"
          />
        </div>
        {showPercentages && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">% Building Tax (&gt;200sqm)</Label>
            <Input
              value={getPercentageValue('buildingTaxRateAbove200sqm')}
              readOnly
              className="border-gray-300 rounded-lg h-11 bg-gray-50"
            />
          </div>
        )}
      </div>

      {/* High Income Group Connection */}
      <div className={`grid ${gridCols} gap-4 items-end`}>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            High Income Group Connection Count <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={values.highIncomeGroupConnectionPercentage || ''}
            onChange={(e) => onChange('highIncomeGroupConnectionPercentage', e.target.value)}
            placeholder="e.g., 0.20"
            className="border-gray-300 rounded-lg h-11"
          />
        </div>
        {showPercentages && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">% High Income</Label>
            <Input
              value={getPercentageValue('highIncomeGroupConnectionPercentage')}
              readOnly
              className="border-gray-300 rounded-lg h-11 bg-gray-50"
            />
          </div>
        )}
      </div>

      {/* GeoMean (read-only) */}
      {showReadOnlyFields && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">GeoMean</Label>
            <Input
              value={getGeoMeanValue()}
              readOnly
              className="border-gray-300 rounded-lg h-11 bg-gray-50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Zone Score</Label>
            <Input
              value={getZoneScoreValue()}
              readOnly
              className="border-gray-300 rounded-lg h-11 bg-gray-50"
            />
          </div>
        </div>
      )}
    </div>
  );
}
