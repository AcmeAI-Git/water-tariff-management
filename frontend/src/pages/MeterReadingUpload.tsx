import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Upload } from 'lucide-react';
import { useState } from 'react';

export function MeterReadingUpload() {
  const [activeTab, setActiveTab] = useState<'batch' | 'manual'>('batch');

  return (
    <div className="min-h-screen bg-app">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">Meter Data Entry</h1>
          <p className="text-sm text-gray-500">Upload meter readings in batch or enter manually</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('batch')}
              className={`pb-3 text-[0.9375rem] font-medium border-b-2 transition-colors ${
                activeTab === 'batch'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Batch Upload
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`pb-3 text-[0.9375rem] font-medium border-b-2 transition-colors ${
                activeTab === 'manual'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Manual Entry
            </button>
          </div>
        </div>

        {/* Batch Upload Tab */}
        {activeTab === 'batch' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Upload</h3>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer mb-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
                    <Upload className="text-primary" size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">CSV file only (MAX. 5MB)</p>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-primary hover:bg-primary-600 text-white rounded-lg py-6 mb-3">
                Select File
              </Button>
              <Button variant="outline" className="w-full border-gray-300 text-gray-700 rounded-lg py-6 bg-white">
                Download CSV Template
              </Button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">CSV Format Requirements:</p>
              <ul className="text-sm text-gray-700 space-y-1.5 list-disc list-inside">
                <li>Column 1: Meter Number</li>
                <li>Column 2: Current Reading (m³)</li>
                <li>Column 3: Bill Month (YYYY-MM)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Manual Entry Tab */}
        {activeTab === 'manual' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Entry</h3>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="space-y-5 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="meterNo" className="text-sm font-medium text-gray-700">
                    Meter Number
                  </Label>
                  <Input
                    id="meterNo"
                    placeholder="e.g., MTR-2024-001"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reading" className="text-sm font-medium text-gray-700">
                    Current Reading (m³)
                  </Label>
                  <Input
                    id="reading"
                    type="number"
                    placeholder="e.g., 245.5"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billMonth" className="text-sm font-medium text-gray-700">
                    Bill Month
                  </Label>
                  <Input
                    id="billMonth"
                    type="month"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <Button className="w-full bg-primary hover:bg-primary-600 text-white rounded-lg py-6 mb-3">
                Submit Reading
              </Button>
              <Button variant="outline" className="w-full border-gray-300 text-gray-700 rounded-lg py-6 bg-white">
                Clear Form
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


