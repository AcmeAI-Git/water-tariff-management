import { X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

interface ReviewChangeModalProps {
  request: {
    id: string;
    module: string;
    requestedBy?: string; // Optional, not displayed
    request: string;
    oldData: any;
    newData: any;
  };
  onClose: () => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  isLoading?: boolean;
}

export function ReviewChangeModal({ request, onClose, onApprove, onReject, isLoading = false }: ReviewChangeModalProps) {
  const handleApprove = () => {
    onApprove(request.id);
  };

  const handleReject = () => {
    onReject(request.id);
  };

  const renderDataComparison = () => {
    // Safety check: ensure newData exists and is a valid object
    // Note: typeof null === 'object' in JavaScript, so we need explicit null check
    const isValidObject = (obj: unknown): obj is Record<string, unknown> => {
      return obj !== null && obj !== undefined && typeof obj === 'object' && !Array.isArray(obj);
    };

    // Safe wrapper for Object.entries that handles null/undefined
    const safeObjectEntries = (obj: unknown): [string, unknown][] => {
      if (!isValidObject(obj)) {
        return [];
      }
      try {
        return Object.entries(obj);
      } catch (error) {
        console.error('Error in Object.entries:', error, obj);
        return [];
      }
    };

    // Safe wrapper for Object.keys that handles null/undefined
    const safeObjectKeys = (obj: unknown): string[] => {
      if (!isValidObject(obj)) {
        return [];
      }
      try {
        return Object.keys(obj);
      } catch (error) {
        console.error('Error in Object.keys:', error, obj);
        return [];
      }
    };

    // Format value for display
    const formatValue = (key: string, value: unknown): string => {
      if (value === null || value === undefined) {
        return '-';
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        if (key === 'scoringParams' && value.length > 0) {
          // Special handling for scoringParams - show summary
          return `${value.length} parameter(s)`;
        }
        return `${value.length} item(s)`;
      }
      
      // Handle objects
      if (typeof value === 'object') {
        return '[Object]';
      }
      
      // Handle dates
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        try {
          const date = new Date(value);
          return date.toLocaleString();
        } catch {
          return String(value);
        }
      }
      
      return String(value);
    };

    // Early return if newData is invalid
    if (!isValidObject(request.newData)) {
      return (
        <div className="space-y-4">
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-sm text-yellow-700">No data available to display</p>
          </div>
        </div>
      );
    }

    const newData = request.newData;
    const isZoneScoring = request.module === 'ZoneScoring';
    const isCustomer = request.module === 'Customer';

    // For Customer, show customer information in a formatted way
    if (isCustomer) {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Customer Information</h4>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              {safeObjectEntries(newData).map(([key, value]) => {
                const formattedValue = formatValue(key, value);
                return (
                  <div key={key} className="py-2 border-b border-gray-200 last:border-0">
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="text-sm font-medium text-gray-900 text-right ml-4">
                        {formattedValue}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // For ZoneScoring, always show just the new data (no comparison)
    if (isZoneScoring) {
      const scoringParams = Array.isArray(newData.scoringParams) ? newData.scoringParams : [];
      
      return (
        <div className="space-y-4">
          {/* Basic Info */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Ruleset Information</h4>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              {safeObjectEntries(newData).filter(([key]) => key !== 'scoringParams').map(([key, value]) => {
                const formattedValue = formatValue(key, value);
                return (
                  <div key={key} className="py-2 border-b border-gray-200 last:border-0">
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="text-sm font-medium text-gray-900 text-right ml-4">
                        {formattedValue}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scoring Parameters Table */}
          {scoringParams.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Scoring Parameters ({scoringParams.length})
              </h4>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-50">
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-gray-700">Area</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-700">Land+Home Rate</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-700">Land Rate</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-700">Land Tax Rate</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-700">Building Tax (≤120sqm)</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-700">Building Tax (≤200sqm)</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-700">Building Tax (&gt;200sqm)</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-700">High Income %</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-700">GeoMean</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scoringParams.map((param: any, idx: number) => (
                        <TableRow key={idx} className="border-gray-100">
                          <TableCell className="text-xs font-medium text-gray-900">
                            {param.area?.name || param.areaName || `Area ${param.areaId}`}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">{param.landHomeRate}</TableCell>
                          <TableCell className="text-xs text-gray-600">{param.landRate}</TableCell>
                          <TableCell className="text-xs text-gray-600">{param.landTaxRate}</TableCell>
                          <TableCell className="text-xs text-gray-600">{param.buildingTaxRateUpto120sqm}</TableCell>
                          <TableCell className="text-xs text-gray-600">{param.buildingTaxRateUpto200sqm}</TableCell>
                          <TableCell className="text-xs text-gray-600">{param.buildingTaxRateAbove200sqm}</TableCell>
                          <TableCell className="text-xs text-gray-600">{param.highIncomeGroupConnectionPercentage}</TableCell>
                          <TableCell className="text-xs text-gray-600">{param.geoMean}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // For other modules, show comparison view
    if (!request.oldData) {
      // New record
      return (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Old Data</h4>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-500 italic">None - New Record</p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">New Data</h4>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              {safeObjectEntries(newData).length === 0 ? (
                <p className="text-sm text-gray-500 italic">No data fields available</p>
              ) : (
                safeObjectEntries(newData).map(([key, value]) => {
                  const formattedValue = formatValue(key, value);
                  const isArray = Array.isArray(value);
                  const isScoringParams = key === 'scoringParams' && isArray && value.length > 0;
                  
                  return (
                    <div key={key} className="py-2 border-b border-green-100 last:border-0">
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="text-sm font-medium text-gray-900 text-right ml-4">
                          {formattedValue}
                        </span>
                      </div>
                      {isScoringParams && (
                        <div className="mt-2 pl-4 text-xs text-gray-500">
                          <details className="cursor-pointer">
                            <summary className="text-gray-600 hover:text-gray-800">View parameters ({value.length})</summary>
                            <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                              {(value as any[]).slice(0, 10).map((param: any, idx: number) => (
                                <div key={idx} className="text-xs bg-white p-2 rounded border border-gray-200">
                                  <div className="font-medium">{param.areaName || `Area ${param.areaId}`}</div>
                                  <div className="text-gray-600 mt-1">
                                    Land+Home: {param.landHomeRate}, Land: {param.landRate}, Tax: {param.landTaxRate}
                                  </div>
                                </div>
                              ))}
                              {value.length > 10 && (
                                <details className="mt-2 cursor-pointer">
                                  <summary className="text-gray-600 hover:text-gray-800 font-medium">
                                    ... and {value.length - 10} more (click to expand)
                                  </summary>
                                  <div className="mt-2 space-y-1">
                                    {(value as any[]).slice(10).map((param: any, idx: number) => (
                                      <div key={idx + 10} className="text-xs bg-white p-2 rounded border border-gray-200">
                                        <div className="font-medium">{param.areaName || `Area ${param.areaId}`}</div>
                                        <div className="text-gray-600 mt-1">
                                          Land+Home: {param.landHomeRate}, Land: {param.landRate}, Tax: {param.landTaxRate}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      );
    }

    // Modified record - side by side comparison
    const oldDataKeys = safeObjectKeys(request.oldData);
    const newDataKeys = safeObjectKeys(newData);
    const allKeys = new Set([...oldDataKeys, ...newDataKeys]);

    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Old Data</h4>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
            {Array.from(allKeys).map((key) => {
              const oldValue = isValidObject(request.oldData) ? request.oldData[key] : undefined;
              const newValue = newData[key];
              const isChanged = oldValue !== newValue;
              
              return (
                <div 
                  key={key} 
                  className={`flex items-start justify-between py-1.5 border-b border-gray-200 last:border-0 ${
                    isChanged ? 'bg-red-50 -mx-2 px-2 rounded' : ''
                  }`}
                >
                  <span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className={`text-sm font-medium text-right ml-4 ${
                    isChanged ? 'text-red-700 line-through' : 'text-gray-900'
                  }`}>
                    {oldValue !== undefined ? formatValue(key, oldValue) : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">New Data</h4>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 space-y-2">
            {Array.from(allKeys).map((key) => {
              const oldValue = isValidObject(request.oldData) ? request.oldData[key] : undefined;
              const newValue = newData[key];
              const isChanged = oldValue !== newValue;
              
              return (
                <div 
                  key={key} 
                  className={`flex items-start justify-between py-1.5 border-b border-green-100 last:border-0 ${
                    isChanged ? 'bg-green-100 -mx-2 px-2 rounded' : ''
                  }`}
                >
                  <span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className={`text-sm font-medium text-right ml-4 ${
                    isChanged ? 'text-green-700 font-semibold' : 'text-gray-900'
                  }`}>
                    {newValue !== undefined ? formatValue(key, newValue) : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Review Pending Change</h2>
            <p className="text-sm text-gray-500 mt-0.5">Request ID: {request.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Request Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div>
              <p className="text-xs text-gray-600 mb-1">Module</p>
              <p className="text-sm font-semibold text-gray-900">{request.module}</p>
            </div>
          </div>

          {/* Record Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Details</h3>
            {isLoading ? (
              <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4C6EF5] mb-2"></div>
                  <p className="text-sm text-gray-600">Loading record data...</p>
                </div>
              </div>
            ) : (
              renderDataComparison()
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
          >
            Reject
          </Button>
          <Button
            onClick={handleApprove}
            className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white"
          >
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
}
