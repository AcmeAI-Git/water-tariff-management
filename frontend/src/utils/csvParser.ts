import type { CreateScoringParamDto, Area } from '../types';

export interface CSVParseResult {
  success: boolean;
  data: CreateScoringParamDto[];
  errors: string[];
  warnings: string[];
}

export interface CSVRow {
  [key: string]: string;
}

/**
 * Parse CSV file and convert to scoring parameters
 */
export async function parseScoringParamsCSV(
  file: File,
  areas: Area[]
): Promise<CSVParseResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: CreateScoringParamDto[] = [];

  try {
    // Read file content
    const text = await readFileAsText(file);
    
    // Parse CSV
    const rows = parseCSV(text);
    
    if (rows.length === 0) {
      errors.push('CSV file is empty');
      return { success: false, data: [], errors, warnings };
    }

    // Get headers (first row)
    const headers = rows[0];
    const normalizedHeaders = normalizeHeaders(headers);
    
    // Check if areaName is provided instead of areaId
    const hasAreaName = !!normalizedHeaders['areaName'];
    const hasAreaId = !!normalizedHeaders['areaId'];
    
    // Validate required columns
    const requiredColumns = [
      'landHomeRate',
      'landRate',
      'landTaxRate',
      'buildingTaxRateUpto120sqm',
      'buildingTaxRateUpto200sqm',
      'buildingTaxRateAbove200sqm',
      'highIncomeGroupConnectionPercentage'
    ];

    const missingColumns = requiredColumns.filter(col => !normalizedHeaders[col]);
    
    if (!hasAreaId && !hasAreaName) {
      missingColumns.push('areaId or areaName');
    }

    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
      return { success: false, data: [], errors, warnings };
    }

    // Process data rows (skip header row)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowErrors: string[] = [];
      
      // Skip empty rows
      if (isRowEmpty(row)) {
        continue;
      }

      // Get areaId
      let areaId: number | null = null;
      
      if (hasAreaId) {
        const areaIdValue = row[normalizedHeaders['areaId']];
        areaId = parseInt(areaIdValue?.trim() || '0', 10);
        if (isNaN(areaId) || areaId === 0) {
          rowErrors.push(`Row ${i + 1}: Invalid areaId "${areaIdValue}"`);
        }
      } else if (hasAreaName) {
        const areaName = row[normalizedHeaders['areaName']]?.trim();
        if (!areaName) {
          rowErrors.push(`Row ${i + 1}: Missing areaName`);
        } else {
          const area = areas.find(a => a.name.toLowerCase() === areaName.toLowerCase());
          if (!area) {
            rowErrors.push(`Row ${i + 1}: Area "${areaName}" not found`);
          } else {
            areaId = area.id;
          }
        }
      }

      // Get required fields
      const landHomeRate = row[normalizedHeaders['landHomeRate']]?.trim() || '';
      const landRate = row[normalizedHeaders['landRate']]?.trim() || '';
      const landTaxRate = row[normalizedHeaders['landTaxRate']]?.trim() || '';
      const buildingTaxRateUpto120sqm = row[normalizedHeaders['buildingTaxRateUpto120sqm']]?.trim() || '';
      const buildingTaxRateUpto200sqm = row[normalizedHeaders['buildingTaxRateUpto200sqm']]?.trim() || '';
      const buildingTaxRateAbove200sqm = row[normalizedHeaders['buildingTaxRateAbove200sqm']]?.trim() || '';
      const highIncomeGroupConnectionPercentage = row[normalizedHeaders['highIncomeGroupConnectionPercentage']]?.trim() || '';

      // Validate required fields
      if (!landHomeRate) rowErrors.push(`Row ${i + 1}: Missing landHomeRate`);
      if (!landRate) rowErrors.push(`Row ${i + 1}: Missing landRate`);
      if (!landTaxRate) rowErrors.push(`Row ${i + 1}: Missing landTaxRate`);
      if (!buildingTaxRateUpto120sqm) rowErrors.push(`Row ${i + 1}: Missing buildingTaxRateUpto120sqm`);
      if (!buildingTaxRateUpto200sqm) rowErrors.push(`Row ${i + 1}: Missing buildingTaxRateUpto200sqm`);
      if (!buildingTaxRateAbove200sqm) rowErrors.push(`Row ${i + 1}: Missing buildingTaxRateAbove200sqm`);
      if (!highIncomeGroupConnectionPercentage) rowErrors.push(`Row ${i + 1}: Missing highIncomeGroupConnectionPercentage`);

      // Validate numeric fields
      if (landHomeRate && isNaN(parseFloat(landHomeRate))) {
        rowErrors.push(`Row ${i + 1}: landHomeRate must be a number`);
      }
      if (landRate && isNaN(parseFloat(landRate))) {
        rowErrors.push(`Row ${i + 1}: landRate must be a number`);
      }
      if (landTaxRate && isNaN(parseFloat(landTaxRate))) {
        rowErrors.push(`Row ${i + 1}: landTaxRate must be a number`);
      }

      // Ensure areaId is valid
      if (!areaId) {
        rowErrors.push(`Row ${i + 1}: Invalid or missing areaId`);
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        warnings.push(`Row ${i + 1} skipped due to errors`);
        continue;
      }

      // Create scoring parameter DTO
      const param: CreateScoringParamDto = {
        areaId: areaId!,
        landHomeRate,
        landHomeRatePercentage: '', // Will be calculated
        landRate,
        landRatePercentage: '', // Will be calculated
        landTaxRate,
        landTaxRatePercentage: '', // Will be calculated
        buildingTaxRateUpto120sqm,
        buildingTaxRateUpto120sqmPercentage: '', // Will be calculated
        buildingTaxRateUpto200sqm,
        buildingTaxRateUpto200sqmPercentage: '', // Will be calculated
        buildingTaxRateAbove200sqm,
        buildingTaxRateAbove200sqmPercentage: '', // Will be calculated
        highIncomeGroupConnectionPercentage,
        geoMean: '', // Will be calculated
      };

      data.push(param);
    }

    if (data.length === 0 && errors.length === 0) {
      errors.push('No valid data rows found in CSV');
      return { success: false, data: [], errors, warnings };
    }

    return {
      success: errors.length === 0,
      data,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, data: [], errors, warnings };
  }
}

/**
 * Read file as text
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = (e) => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
}

/**
 * Parse CSV text into rows
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  
  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add last field
    row.push(current.trim());
    rows.push(row);
  }
  
  return rows;
}

/**
 * Normalize headers to lowercase and create mapping
 */
function normalizeHeaders(headers: string[]): { [key: string]: number } {
  const normalized: { [key: string]: number } = {};
  
  const headerMap: { [key: string]: string[] } = {
    areaId: ['areaid', 'area_id', 'area id'],
    areaName: ['areaname', 'area_name', 'area name', 'area'],
    landHomeRate: ['landhomerate', 'land_home_rate', 'land home rate', 'land+home rate', 'land+home rate (bdt/sqm)', 'land+home rate (bdt per sqm)'],
    landRate: ['landrate', 'land_rate', 'land rate', 'land rate (bdt/sqm)', 'land rate (bdt per sqm)'],
    landTaxRate: ['landtaxrate', 'land_tax_rate', 'land tax rate', 'land tax rate (bdt/sqm)', 'land tax rate (bdt per sqm)'],
    buildingTaxRateUpto120sqm: ['buildingtaxrateupto120sqm', 'building_tax_rate_upto_120sqm', 'building tax rate upto 120sqm', 'building tax (≤120sqm)', 'building tax rate ≤120sqm (bdt/sqm)', 'building tax rate ≤120sqm (bdt per sqm)'],
    buildingTaxRateUpto200sqm: ['buildingtaxrateupto200sqm', 'building_tax_rate_upto_200sqm', 'building tax rate upto 200sqm', 'building tax (≤200sqm)', 'building tax rate ≤200sqm (bdt/sqm)', 'building tax rate ≤200sqm (bdt per sqm)'],
    buildingTaxRateAbove200sqm: ['buildingtaxrateabove200sqm', 'building_tax_rate_above_200sqm', 'building tax rate above 200sqm', 'building tax (>200sqm)', 'building tax rate >200sqm (bdt/sqm)', 'building tax rate >200sqm (bdt per sqm)'],
    highIncomeGroupConnectionPercentage: ['highincomegroupconnectionpercentage', 'high_income_group_connection_percentage', 'high income group connection percentage', 'high income', 'high income group connection count'],
  };

  headers.forEach((header, index) => {
    const normalizedHeader = header.toLowerCase().trim();
    
    // Check each possible mapping
    for (const [key, variations] of Object.entries(headerMap)) {
      if (variations.includes(normalizedHeader)) {
        normalized[key] = index;
        return;
      }
    }
    
    // If no match found, use direct lowercase match
    normalized[normalizedHeader] = index;
  });

  return normalized;
}

/**
 * Check if a row is empty
 */
function isRowEmpty(row: string[]): boolean {
  return row.every(cell => !cell || cell.trim() === '');
}

/**
 * Generate CSV template content
 */
export function generateCSVTemplate(): string {
  const headers = [
    'Area Name',
    'Land+Home Rate (BDT/sqm)',
    'Land Rate (BDT/sqm)',
    'Land Tax Rate (BDT/sqm)',
    'Building Tax Rate ≤120sqm (BDT/sqm)',
    'Building Tax Rate ≤200sqm (BDT/sqm)',
    'Building Tax Rate >200sqm (BDT/sqm)',
    'High Income Group Connection Count'
  ];
  
  const exampleRow = [
    'Banani Block C',
    '32896.00',
    '20000.00',
    '5000.00',
    '700.00',
    '850.00',
    '1300.00',
    '0.36'
  ];
  
  return [headers.join(','), exampleRow.join(',')].join('\n');
}
