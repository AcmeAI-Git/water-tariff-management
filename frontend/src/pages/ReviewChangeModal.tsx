import { X } from 'lucide-react';
import { Button } from '../components/ui/button';

interface ReviewChangeModalProps {
  request: {
    id: string;
    module: string;
    requestedBy: string;
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
                safeObjectEntries(newData).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between py-1.5 border-b border-green-100 last:border-0">
                    <span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="text-sm font-medium text-gray-900 text-right ml-4">{String(value ?? '-')}</span>
                  </div>
                ))
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
                    {oldValue !== undefined ? String(oldValue) : '-'}
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
                    {newValue !== undefined ? String(newValue) : '-'}
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
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Module</p>
                <p className="text-sm font-semibold text-gray-900">{request.module}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Requested By</p>
                <p className="text-sm font-semibold text-gray-900">{request.requestedBy}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Request</p>
                <p className="text-sm font-semibold text-gray-900">{request.request}</p>
              </div>
            </div>
          </div>

          {/* Data Comparison */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Comparison</h3>
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
