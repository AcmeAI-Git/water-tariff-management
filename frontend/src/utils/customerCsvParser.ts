import type { CreateUserDto, CreateUserMeterDto, Area, Zone, CityCorporation } from '../types';

export interface CustomerCSVParseResult {
  success: boolean;
  data: CreateUserDto[];
  errors: string[];
  warnings: string[];
}

export interface CSVRow {
  [key: string]: string;
}

/**
 * Parse CSV file and convert to customer DTOs
 */
export async function parseCustomerCSV(
  file: File,
  areas: Area[],
  _zones: Zone[],
  _cityCorporations: CityCorporation[]
): Promise<CustomerCSVParseResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: CreateUserDto[] = [];

  try {
    // Read file content
    let text = await readFileAsText(file);
    
    // Remove BOM (Byte Order Mark) if present (Excel sometimes adds this)
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }
    
    // Parse CSV
    const rows = parseCSV(text);
    
    if (rows.length === 0) {
      errors.push('CSV file is empty');
      return { success: false, data: [], errors, warnings };
    }

    // Get headers (first row) and filter out empty headers
    const headers = rows[0].filter(h => h && h.trim());
    
    if (headers.length === 0) {
      errors.push('CSV file has no headers');
      return { success: false, data: [], errors, warnings };
    }
    
    const normalizedHeaders = normalizeHeaders(rows[0]); // Pass original row for index mapping
    
    // Debug: Log header mappings in development
    if (import.meta.env.MODE === 'development') {
      console.log('CSV Headers (raw):', rows[0]);
      console.log('CSV Headers (filtered):', headers);
      console.log('Normalized Headers:', normalizedHeaders);
      // Log each header with its index
      rows[0].forEach((h, idx) => {
        if (h && h.trim()) {
          console.log(`Header[${idx}]: "${h}" -> normalized: "${h.toLowerCase().trim()}"`);
        }
      });
    }
    
    // Validate required columns
    const requiredColumns = ['name', 'address', 'inspCode'];
    const missingColumns = requiredColumns.filter(col => normalizedHeaders[col] === undefined);
    
    // Check if areaId OR areaName is present
    const hasAreaId = normalizedHeaders['areaId'] !== undefined;
    const hasAreaName = normalizedHeaders['areaName'] !== undefined;
    if (!hasAreaId && !hasAreaName) {
      missingColumns.push('areaId or areaName');
    }
    
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
      const foundHeaders = rows[0].filter(h => h && h.trim()).map((h) => `"${h}"`).join(', ');
      errors.push(`Found headers: [${foundHeaders}]`);
      const normalizedKeys = Object.keys(normalizedHeaders).map(key => `${key} (index: ${normalizedHeaders[key]})`).join(', ');
      errors.push(`Normalized header mappings: [${normalizedKeys}]`);
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

      // Get required fields - use index from normalizedHeaders
      const nameIndex = normalizedHeaders['name'];
      const addressIndex = normalizedHeaders['address'];
      const inspCodeIndex = normalizedHeaders['inspCode'];
      const areaIdIndex = normalizedHeaders['areaId'];
      const areaNameIndex = normalizedHeaders['areaName'];
      
      // Debug: Log first row to see what we're getting
      if (i === 1 && import.meta.env.MODE === 'development') {
        console.log('Row data:', row);
        console.log('Header indices:', {
          name: nameIndex,
          address: addressIndex,
          inspCode: inspCodeIndex,
          areaId: areaIdIndex,
          areaName: areaNameIndex
        });
        console.log('Row values:', {
          name: row[nameIndex],
          address: row[addressIndex],
          inspCode: row[inspCodeIndex],
          areaId: row[areaIdIndex],
          areaName: row[areaNameIndex]
        });
      }
      
      const name = (nameIndex !== undefined ? row[nameIndex]?.trim() : '') || '';
      const address = (addressIndex !== undefined ? row[addressIndex]?.trim() : '') || '';
      const inspCodeStr = (inspCodeIndex !== undefined ? row[inspCodeIndex]?.trim() : '') || '';
      const areaIdStr = (areaIdIndex !== undefined ? row[areaIdIndex]?.trim() : '') || '';
      const areaName = (areaNameIndex !== undefined ? row[areaNameIndex]?.trim() : '') || '';

      // Validate required fields
      if (!name) rowErrors.push(`Row ${i + 1}: Missing name`);
      if (!address) rowErrors.push(`Row ${i + 1}: Missing address`);
      if (!inspCodeStr) rowErrors.push(`Row ${i + 1}: Missing inspection code`);
      
      // Get areaId - can be from areaId column or areaName
      let areaId: number | null = null;
      if (areaIdStr) {
        areaId = parseInt(areaIdStr, 10);
        if (isNaN(areaId) || areaId === 0) {
          rowErrors.push(`Row ${i + 1}: Invalid areaId "${areaIdStr}"`);
        }
      } else if (areaName) {
        const area = areas.find(a => a.name.toLowerCase() === areaName.toLowerCase());
        if (!area) {
          rowErrors.push(`Row ${i + 1}: Area "${areaName}" not found`);
        } else {
          areaId = area.id;
        }
      } else {
        rowErrors.push(`Row ${i + 1}: Missing areaId or areaName`);
      }

      // Validate inspection code
      const inspCode = parseInt(inspCodeStr, 10);
      if (isNaN(inspCode)) {
        rowErrors.push(`Row ${i + 1}: Inspection code must be a number`);
      }

      // Get optional fields with defaults - use index from normalizedHeaders
      const accountTypeIndex = normalizedHeaders['accountType'];
      const customerCategoryIndex = normalizedHeaders['customerCategory'];
      const waterStatusIndex = normalizedHeaders['waterStatus'];
      const sewerStatusIndex = normalizedHeaders['sewerStatus'];
      const landSizeDecimalIndex = normalizedHeaders['landSizeDecimal'];
      const numberOfStoriesIndex = normalizedHeaders['numberOfStories'];
      const numberOfFlatsIndex = normalizedHeaders['numberOfFlats'];
      
      const accountType = (accountTypeIndex !== undefined ? row[accountTypeIndex]?.trim() : '') || 'General';
      const customerCategory = (customerCategoryIndex !== undefined ? row[customerCategoryIndex]?.trim() : '') || 'Domestic';
      const waterStatus = (waterStatusIndex !== undefined ? row[waterStatusIndex]?.trim() : '') || 'Metered';
      const sewerStatus = (sewerStatusIndex !== undefined ? row[sewerStatusIndex]?.trim() : '') || 'Connected';
      
      // Parse new optional fields
      const landSizeDecimalStr = (landSizeDecimalIndex !== undefined ? row[landSizeDecimalIndex]?.trim() : '') || '';
      const numberOfStoriesStr = (numberOfStoriesIndex !== undefined ? row[numberOfStoriesIndex]?.trim() : '') || '';
      const numberOfFlatsStr = (numberOfFlatsIndex !== undefined ? row[numberOfFlatsIndex]?.trim() : '') || '';
      
      let landSizeDecimal: number | undefined = undefined;
      let numberOfStories: number | undefined = undefined;
      let numberOfFlats: number | undefined = undefined;
      
      if (landSizeDecimalStr) {
        const parsed = parseFloat(landSizeDecimalStr);
        if (!isNaN(parsed) && parsed >= 0) {
          landSizeDecimal = parsed;
        } else {
          warnings.push(`Row ${i + 1}: Invalid landSizeDecimal "${landSizeDecimalStr}", skipping`);
        }
      }
      
      if (numberOfStoriesStr) {
        const parsed = parseInt(numberOfStoriesStr, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          numberOfStories = parsed;
        } else {
          warnings.push(`Row ${i + 1}: Invalid numberOfStories "${numberOfStoriesStr}", skipping`);
        }
      }
      
      if (numberOfFlatsStr) {
        const parsed = parseInt(numberOfFlatsStr, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          numberOfFlats = parsed;
        } else {
          warnings.push(`Row ${i + 1}: Invalid numberOfFlats "${numberOfFlatsStr}", skipping`);
        }
      }

      // Validate enum values
      const validAccountTypes = ['General', 'Tubewell'];
      if (!validAccountTypes.includes(accountType)) {
        rowErrors.push(`Row ${i + 1}: Invalid accountType "${accountType}". Must be one of: ${validAccountTypes.join(', ')}`);
      }

      const validCustomerCategories = ['Domestic', 'Commercial', 'Industrial', 'Government', 'Community'];
      if (!validCustomerCategories.includes(customerCategory)) {
        rowErrors.push(`Row ${i + 1}: Invalid customerCategory "${customerCategory}". Must be one of: ${validCustomerCategories.join(', ')}`);
      }

      const validWaterStatuses = ['Metered', 'Meter Temporarilly Disconnected', 'Non-Metered', 'Connected', 'Not-connected'];
      if (!validWaterStatuses.includes(waterStatus)) {
        rowErrors.push(`Row ${i + 1}: Invalid waterStatus "${waterStatus}". Must be one of: ${validWaterStatuses.join(', ')}`);
      }

      const validSewerStatuses = ['Connected', 'Not Connected', 'Within 100 feet'];
      if (!validSewerStatuses.includes(sewerStatus)) {
        rowErrors.push(`Row ${i + 1}: Invalid sewerStatus "${sewerStatus}". Must be one of: ${validSewerStatuses.join(', ')}`);
      }

      // Get meter data if waterStatus is Metered
      let meter: CreateUserMeterDto | undefined = undefined;
      if (waterStatus === 'Metered') {
        const meterNoIndex = normalizedHeaders['meterNo'];
        const meterStatusIndex = normalizedHeaders['meterStatus'];
        const sizeOfDiaIndex = normalizedHeaders['sizeOfDia'];
        const meterInstallationDateIndex = normalizedHeaders['meterInstallationDate'];
        
        const meterNoStr = (meterNoIndex !== undefined ? row[meterNoIndex]?.trim() : '') || '';
        const meterStatus = (meterStatusIndex !== undefined ? row[meterStatusIndex]?.trim() : '') || 'Functional';
        const sizeOfDia = (sizeOfDiaIndex !== undefined ? row[sizeOfDiaIndex]?.trim() : '') || '';
        const meterInstallationDate = (meterInstallationDateIndex !== undefined ? row[meterInstallationDateIndex]?.trim() : '') || '';

        if (!meterNoStr) {
          rowErrors.push(`Row ${i + 1}: Missing meterNo (required when waterStatus is Metered)`);
        } else {
          const meterNo = parseInt(meterNoStr, 10);
          if (isNaN(meterNo)) {
            rowErrors.push(`Row ${i + 1}: meterNo must be a number`);
          } else {
            const validMeterStatuses = ['Functional', 'Non-Functional', 'Stolen', 'N/A'];
            if (!validMeterStatuses.includes(meterStatus)) {
              rowErrors.push(`Row ${i + 1}: Invalid meterStatus "${meterStatus}". Must be one of: ${validMeterStatuses.join(', ')}`);
            }

            if (!sizeOfDia) {
              rowErrors.push(`Row ${i + 1}: Missing sizeOfDia (required when waterStatus is Metered)`);
            }

            if (rowErrors.length === 0) {
              meter = {
                meterNo,
                meterStatus,
                sizeOfDia,
                meterInstallationDate: meterInstallationDate || undefined,
              };
            }
          }
        }
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        warnings.push(`Row ${i + 1} skipped due to errors`);
        continue;
      }

      if (!areaId) {
        errors.push(`Row ${i + 1}: Invalid or missing areaId`);
        continue;
      }

      // Create customer DTO
      const customer: CreateUserDto = {
        name,
        address,
        inspCode,
        areaId,
        accountType,
        customerCategory,
        waterStatus,
        sewerStatus,
        landSizeDecimal,
        numberOfStories,
        numberOfFlats,
        ...(meter && { meter }),
      };

      data.push(customer);
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
 * Generate CSV template for customers
 */
export function generateCustomerCSVTemplate(areas: Area[]): string {
  const headers = [
    'Name',
    'Address',
    'Inspection Code',
    'Area Name',
    'Area ID',
    'Account Type',
    'Customer Category',
    'Water Status',
    'Sewer Status',
    'Land Size (sq ft)',
    'Number of Stories',
    'Number of Flats',
    'Meter Number',
    'Meter Status',
    'Size of Diameter',
    'Meter Installation Date'
  ];
  
  // Use first area as example if available
  const exampleArea = areas[0];
  const exampleRow = [
    'John Doe',
    '"123 Main Street, Dhaka"', // Quote address to handle commas
    '1001',
    exampleArea ? exampleArea.name : 'Banani Block C',
    exampleArea ? exampleArea.id.toString() : '7',
    'General',
    'Domestic',
    'Metered',
    'Connected',
    '1200.50',
    '3',
    '6',
    '123456',
    'Functional',
    '20mm',
    '2026-01-10'
  ];
  
  return [headers.join(','), exampleRow.join(',')].join('\n');
}

/**
 * Export customers to CSV
 */
export function exportCustomersToCSV(
  customers: any[], 
  areas: Area[], 
  _zones: Zone[], 
  _cityCorporations: CityCorporation[],
  meters?: any[]
): string {
  const headers = [
    'Name',
    'Address',
    'Inspection Code',
    'Area Name',
    'Area ID',
    'Account Type',
    'Customer Category',
    'Water Status',
    'Sewer Status',
    'Land Size (sq ft)',
    'Number of Stories',
    'Number of Flats',
    'Status',
    'Meter Number',
    'Meter Status',
    'Size of Diameter',
    'Meter Installation Date'
  ];

  const rows = customers.map(customer => {
    const area = areas.find(a => a.id === customer.areaId);

    // Try to find meter data from nested meter object, customer fields, or separate meters array
    let meterNo = customer.meterNo;
    let meterStatus = customer.meterStatus;
    let sizeOfDia = customer.sizeOfDia;
    let meterInstallationDate = customer.meterInstallationDate;

    // If meter data is missing and we have a meters array, try to find it
    if ((!meterNo || !meterStatus || !sizeOfDia) && meters && meters.length > 0) {
      const customerAccount = customer.id?.toString();
      const matchedMeter = meters.find((m: any) => 
        m.account === customerAccount || 
        m.account === customer.id ||
        (customer as any).account === m.account
      );
      
      if (matchedMeter) {
        meterNo = meterNo || matchedMeter.meterNo;
        meterStatus = meterStatus || matchedMeter.meterStatus;
        sizeOfDia = sizeOfDia || matchedMeter.sizeOfDia;
        meterInstallationDate = meterInstallationDate || matchedMeter.meterInstallationDate;
      }
    }

    // Format meter number - handle both string and number
    const meterNoStr = meterNo 
      ? (typeof meterNo === 'number' ? meterNo.toString() : String(meterNo))
      : '';

    return [
      customer.name || customer.fullName || '',
      customer.address || '',
      customer.inspCode?.toString() || '',
      area?.name || '',
      customer.areaId?.toString() || '',
      customer.accountType || '',
      customer.customerCategory || '',
      customer.waterStatus || '',
      customer.sewerStatus || '',
      (customer as any).landSizeDecimal?.toString() || (customer as any).land_size_decimal?.toString() || '',
      (customer as any).numberOfStories?.toString() || (customer as any).number_of_stories?.toString() || '',
      (customer as any).numberOfFlats?.toString() || (customer as any).number_of_flats?.toString() || '',
      customer.status || (customer as any).activeStatus || '',
      meterNoStr,
      meterStatus || '',
      sizeOfDia || '',
      meterInstallationDate || ''
    ].map(field => {
      // Escape commas and quotes in CSV
      const str = String(field || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
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
    reader.onerror = () => {
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
        let field = current.trim();
        // Remove surrounding quotes if present
        if ((field.startsWith('"') && field.endsWith('"')) ||
            (field.startsWith("'") && field.endsWith("'"))) {
          field = field.slice(1, -1).trim();
        }
        row.push(field);
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add last field
    let lastField = current.trim();
    // Remove surrounding quotes if present
    if ((lastField.startsWith('"') && lastField.endsWith('"')) ||
        (lastField.startsWith("'") && lastField.endsWith("'"))) {
      lastField = lastField.slice(1, -1).trim();
    }
    row.push(lastField);
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
    name: ['name', 'customer name', 'full name', 'fullname'],
    address: ['address'],
    inspCode: ['inspcode', 'inspection code', 'inspection_code', 'insp_code', 'code'],
    areaId: ['areaid', 'area_id', 'area id'],
    areaName: ['areaname', 'area_name', 'area name', 'area name (optional - for reference)'],
    accountType: ['accounttype', 'account_type', 'account type'],
    customerCategory: ['customercategory', 'customer_category', 'customer category', 'category'],
    waterStatus: ['waterstatus', 'water_status', 'water status'],
    sewerStatus: ['sewerstatus', 'sewer_status', 'sewer status'],
    meterNo: ['meterno', 'meter_no', 'meter number', 'meter_number'],
    meterStatus: ['meterstatus', 'meter_status', 'meter status'],
    sizeOfDia: ['sizeofdia', 'size_of_dia', 'size of diameter', 'diameter', 'size'],
    meterInstallationDate: ['meterinstallationdate', 'meter_installation_date', 'meter installation date', 'installation date', 'install_date'],
    landSizeDecimal: ['landsizedecimal', 'land_size_decimal', 'land size', 'land size (sq ft)', 'land_size', 'landsize'],
    numberOfStories: ['numberofstories', 'number_of_stories', 'number of stories', 'stories', 'stories count'],
    numberOfFlats: ['numberofflats', 'number_of_flats', 'number of flats', 'flats', 'flats count'],
  };

  headers.forEach((header, index) => {
    // Skip empty headers
    if (!header || !header.trim()) {
      return;
    }
    
    // Remove quotes if present (Excel sometimes adds quotes)
    let cleanHeader = header.trim();
    if ((cleanHeader.startsWith('"') && cleanHeader.endsWith('"')) ||
        (cleanHeader.startsWith("'") && cleanHeader.endsWith("'"))) {
      cleanHeader = cleanHeader.slice(1, -1).trim();
    }
    
    // Skip if still empty after cleaning
    if (!cleanHeader) {
      return;
    }
    
    const normalizedHeader = cleanHeader.toLowerCase().trim();
    let matched = false;
    
    // Check each possible mapping - prioritize exact matches
    // First, check for areaId specifically (contains "id")
    if (normalizedHeader.includes('id') && (normalizedHeader.includes('area') || normalizedHeader.includes('area_id') || normalizedHeader === 'area id')) {
      if (headerMap['areaId'].some(v => normalizedHeader.includes(v.replace(/\s+/g, '')) || normalizedHeader === v)) {
        normalized['areaId'] = index;
        matched = true;
      }
    }
    
    // Then check other mappings
    if (!matched) {
      for (const [key, variations] of Object.entries(headerMap)) {
        // Skip areaId if we already matched it above, or skip areaName if we matched areaId
        if ((key === 'areaId' && matched) || (key === 'areaName' && normalized['areaId'] !== undefined)) {
          continue;
        }
        
        if (variations.includes(normalizedHeader)) {
          normalized[key] = index;
          matched = true;
          break;
        }
      }
    }
    
    // If no match found, use direct lowercase match as fallback
    if (!matched) {
      normalized[normalizedHeader] = index;
    }
  });

  return normalized;
}

/**
 * Check if a row is empty
 */
function isRowEmpty(row: string[]): boolean {
  return row.every(cell => !cell || cell.trim() === '');
}
