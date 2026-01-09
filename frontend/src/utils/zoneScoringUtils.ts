import type { ScoringParam, CreateScoringParamDto } from '../types';

/**
 * Calculate percentages and geometric mean for scoring parameters
 * Matches Excel formula: percentage = value / SUM(all_values) * 100
 */
export function calculatePercentages(params: ScoringParam[]): ScoringParam[] {
  if (params.length === 0) return params;
  
  // Get sum of all values for each column (matching Excel: SUM(G2:G95))
  const sumLandHomeRate = params.reduce((sum, p) => sum + (parseFloat(p.landHomeRate) || 0), 0);
  const sumLandRate = params.reduce((sum, p) => sum + (parseFloat(p.landRate) || 0), 0);
  const sumLandTaxRate = params.reduce((sum, p) => sum + (parseFloat(p.landTaxRate) || 0), 0);
  const sumBuildingTax120 = params.reduce((sum, p) => sum + (parseFloat(p.buildingTaxRateUpto120sqm) || 0), 0);
  const sumBuildingTax200 = params.reduce((sum, p) => sum + (parseFloat(p.buildingTaxRateUpto200sqm) || 0), 0);
  const sumBuildingTaxAbove200 = params.reduce((sum, p) => sum + (parseFloat(p.buildingTaxRateAbove200sqm) || 0), 0);
  const sumHighIncome = params.reduce((sum, p) => sum + (parseFloat(p.highIncomeGroupConnectionPercentage) || 0), 0);
  
  // Calculate percentages and geomean for each param
  return params.map(param => {
    const landHomeRate = parseFloat(param.landHomeRate) || 0;
    const landRate = parseFloat(param.landRate) || 0;
    const landTaxRate = parseFloat(param.landTaxRate) || 0;
    const buildingTax120 = parseFloat(param.buildingTaxRateUpto120sqm) || 0;
    const buildingTax200 = parseFloat(param.buildingTaxRateUpto200sqm) || 0;
    const buildingTaxAbove200 = parseFloat(param.buildingTaxRateAbove200sqm) || 0;
    const highIncome = parseFloat(param.highIncomeGroupConnectionPercentage) || 0;
    
    // Calculate percentage as: value / SUM(all_values) * 100 (matching Excel formula)
    const landHomeRatePct = sumLandHomeRate > 0 ? (landHomeRate / sumLandHomeRate) * 100 : 0;
    const landRatePct = sumLandRate > 0 ? (landRate / sumLandRate) * 100 : 0;
    const landTaxRatePct = sumLandTaxRate > 0 ? (landTaxRate / sumLandTaxRate) * 100 : 0;
    const buildingTax120Pct = sumBuildingTax120 > 0 ? (buildingTax120 / sumBuildingTax120) * 100 : 0;
    const buildingTax200Pct = sumBuildingTax200 > 0 ? (buildingTax200 / sumBuildingTax200) * 100 : 0;
    const buildingTaxAbove200Pct = sumBuildingTaxAbove200 > 0 ? (buildingTaxAbove200 / sumBuildingTaxAbove200) * 100 : 0;
    const highIncomePct = sumHighIncome > 0 ? (highIncome / sumHighIncome) * 100 : 0;
    
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
}

/**
 * Initialize a new scoring parameter with default values
 */
export function initializeScoringParam(): CreateScoringParamDto {
  return {
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
  };
}

/**
 * Map ScoringParam to CreateScoringParamDto
 */
export function mapScoringParamToDto(param: ScoringParam): CreateScoringParamDto {
  return {
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
  };
}

/**
 * Map array of ScoringParam to array of CreateScoringParamDto
 */
export function mapScoringParamsToDto(params: ScoringParam[]): CreateScoringParamDto[] {
  return params.map(mapScoringParamToDto);
}
