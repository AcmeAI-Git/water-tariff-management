import type { ScoringParam, CreateScoringParamDto } from '../types';

/**
 * Calculate percentages and geometric mean for scoring parameters
 */
export function calculatePercentages(params: ScoringParam[]): ScoringParam[] {
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
