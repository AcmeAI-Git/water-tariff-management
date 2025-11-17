import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';

export function MeterAdminDataEntry() {
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedHousehold, setVerifiedHousehold] = useState<any>(null);

  // Mock household data
  const mockHouseholds = {
    'MTR-2024-003': {
      meterNo: 'MTR-2024-003',
      fullName: 'Sarah Khan',
      address: 'House 45, Road 12A, Dhanmondi',
      phone: '+880 1711-234567',
      email: 'sarah.khan@email.com',
      ward: '3',
      houseType: 'Residential - Apartment',
      householdCategory: 'Standard',
      zone: '1',
    },
    'MTR-2024-004': {
      meterNo: 'MTR-2024-004',
      fullName: 'Karim Enterprises',
      address: 'Plot 23, Satmasjid Road, Dhanmondi',
      phone: '+880 1812-987654',
      email: 'contact@karimenterprises.com',
      ward: '3',
      houseType: 'Commercial - Office',
      householdCategory: 'Commercial',
      zone: '2',
    },
  };

  const handleSearch = () => {
    if (searchQuery in mockHouseholds) {
      setVerifiedHousehold(mockHouseholds[searchQuery as keyof typeof mockHouseholds]);
    } else {
      setVerifiedHousehold(null);
      alert('Household not found. Try: MTR-2024-003 or MTR-2024-004');
    }
  };

  return (
    <div className="min-h-screen bg-app">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-gray-900 mb-1">Meter Data Entry</h1>
          <p className="text-sm text-gray-500">Your Assigned Ward: Ward 3 - Dhanmondi</p>
        </div>

        {/* Entry Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Household Verification & Entry</h3>
          
          {/* Search */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-gray-700 mb-3">Search Household</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  id="search"
                  placeholder="Enter Meter No. or Name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-11"
                />
              </div>
              <Button 
                onClick={handleSearch}
                className="bg-primary hover:bg-primary-600 text-white rounded-lg h-11 px-6 flex items-center gap-2"
              >
                <Search size={18} />
                Search
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Try: MTR-2024-003 or MTR-2024-004</p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 mb-8"></div>

          {/* Verify (Read-Only) */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-gray-700 mb-3">Household Details (Read-Only)</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                <Input
                  value={verifiedHousehold?.fullName || ''}
                  disabled
                  className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Phone</Label>
                <Input
                  value={verifiedHousehold?.phone || ''}
                  disabled
                  className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  value={verifiedHousehold?.email || ''}
                  disabled
                  className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Address</Label>
                <Input
                  value={verifiedHousehold?.address || ''}
                  disabled
                  className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Ward</Label>
                <Input
                  value={verifiedHousehold?.ward || ''}
                  disabled
                  className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">House Type</Label>
                <Input
                  value={verifiedHousehold?.houseType || ''}
                  disabled
                  className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Zone</Label>
                <Input
                  value={verifiedHousehold?.zone || ''}
                  disabled
                  className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Household Category</Label>
                <Input
                  value={verifiedHousehold?.householdCategory || ''}
                  disabled
                  className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                />
              </div>
            </div>

            {!verifiedHousehold && (
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500 text-center">
                  Search for a household to view details
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 mb-8"></div>

          {/* Enter Data (Editable) */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">New Reading Details (Editable)</p>
            
            <div className="grid grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="reading" className="text-sm font-medium text-gray-700">
                  Current Reading (m³)
                </Label>
                <Input
                  id="reading"
                  type="number"
                  placeholder="e.g., 245.5"
                  disabled={!verifiedHousehold}
                  className={`rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                    verifiedHousehold 
                      ? 'bg-gray-50 border-gray-300' 
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billMonth" className="text-sm font-medium text-gray-700">
                  Bill Month
                </Label>
                <Input
                  id="billMonth"
                  type="month"
                  disabled={!verifiedHousehold}
                  className={`rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                    verifiedHousehold 
                      ? 'bg-gray-50 border-gray-300' 
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>

              <div>
                <Button 
                  disabled={!verifiedHousehold}
                  className={`w-full rounded-lg h-[42px] flex items-center justify-center gap-2 ${
                    verifiedHousehold
                      ? 'bg-primary hover:bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus size={18} />
                  Confirm
                </Button>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}

