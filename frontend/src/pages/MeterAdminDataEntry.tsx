import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation, useAdminId } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { toast } from 'sonner';
import type { User, Consumption } from '../types';

export function MeterAdminDataEntry() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentReading, setCurrentReading] = useState('');
  const [billMonth, setBillMonth] = useState('');
  const [verifiedUser, setVerifiedUser] = useState<User | null>(null);
  const adminId = useAdminId();

  // Fetch all users for search
  const { data: users = [], isLoading: usersLoading } = useApiQuery(
    ['users'],
    () => api.users.getAll()
  );

  // Fetch user's previous consumption to get last reading
  const { data: previousConsumptions = [] } = useApiQuery<Consumption[]>(
    ['consumption', verifiedUser?.id],
    () => {
      if (!verifiedUser?.id) return Promise.resolve([]);
      return api.consumption.getAll().then(consumptions => 
        consumptions.filter(c => c.userId === verifiedUser.id).sort((a, b) => 
          new Date(b.billMonth).getTime() - new Date(a.billMonth).getTime()
        )
      );
    },
    { enabled: !!verifiedUser?.id }
  );

  // Create consumption mutation
  const createConsumptionMutation = useApiMutation(
    (data: Parameters<typeof api.consumption.create>[0]) => api.consumption.create(data),
    {
      successMessage: 'Meter reading submitted successfully',
      errorMessage: 'Failed to submit meter reading',
      invalidateQueries: [['consumption']],
    }
  );

  const handleSearch = () => {
    const foundUser = users.find(
      (user) =>
        user.meterNo.toLowerCase() === searchQuery.toLowerCase() ||
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (foundUser) {
      setVerifiedUser(foundUser);
      // Get the most recent consumption for previous reading
      const latestConsumption = previousConsumptions[0];
      if (latestConsumption) {
        // Pre-fill previous reading if available
        // The form will show this as reference
      }
    } else {
      setVerifiedUser(null);
      toast.error('Household not found. Please check the meter number or name.');
    }
  };

  const handleSubmit = async () => {
    if (!verifiedUser || !adminId) {
      toast.error('Please verify household and ensure you are logged in');
      return;
    }

    if (!currentReading || !billMonth) {
      toast.error('Please enter current reading and bill month');
      return;
    }

    const currentReadingNum = parseFloat(currentReading);
    if (isNaN(currentReadingNum) || currentReadingNum < 0) {
      toast.error('Please enter a valid current reading');
      return;
    }

    // Get previous reading from latest consumption or use 0
    const latestConsumption = previousConsumptions[0];
    const previousReading = latestConsumption?.currentReading || 0;

    // Format bill month to YYYY-MM-DD (first day of month)
    const billMonthDate = `${billMonth}-01`;

    await createConsumptionMutation.mutateAsync({
      userId: verifiedUser.id,
      createdBy: adminId,
      billMonth: billMonthDate,
      currentReading: currentReadingNum,
      previousReading: previousReading > 0 ? previousReading : undefined,
    });

    // Reset form
    setCurrentReading('');
    setBillMonth('');
    setVerifiedUser(null);
    setSearchQuery('');
    toast.success('Meter reading submitted for approval');
  };

  const previousReading = previousConsumptions[0]?.currentReading || 0;

  if (usersLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">Meter Data Entry</h1>
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
                  className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 h-11"
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
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 mb-8"></div>

          {/* Verify (Read-Only) */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-gray-700 mb-3">Household Details (Read-Only)</p>
            
            {verifiedUser ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                  <Input
                    value={verifiedUser.fullName}
                    disabled
                    className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Phone</Label>
                  <Input
                    value={verifiedUser.phone}
                    disabled
                    className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    value={verifiedUser.email || ''}
                    disabled
                    className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Address</Label>
                  <Input
                    value={verifiedUser.address}
                    disabled
                    className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Meter Number</Label>
                  <Input
                    value={verifiedUser.meterNo}
                    disabled
                    className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">House Type</Label>
                  <Input
                    value={verifiedUser.hourseType}
                    disabled
                    className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                  />
                </div>

                {previousReading > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Previous Reading (m³)</Label>
                    <Input
                      value={previousReading.toFixed(2)}
                      disabled
                      className="bg-blue-50 border-blue-200 text-blue-700 rounded-lg cursor-not-allowed font-medium"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
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
                  Current Reading (m³) *
                </Label>
                <Input
                  id="reading"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 245.5"
                  value={currentReading}
                  onChange={(e) => setCurrentReading(e.target.value)}
                  disabled={!verifiedUser || createConsumptionMutation.isPending}
                  className={`rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 ${
                    verifiedUser 
                      ? 'bg-gray-50 border-gray-300' 
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billMonth" className="text-sm font-medium text-gray-700">
                  Bill Month *
                </Label>
                <Input
                  id="billMonth"
                  type="month"
                  value={billMonth}
                  onChange={(e) => setBillMonth(e.target.value)}
                  disabled={!verifiedUser || createConsumptionMutation.isPending}
                  className={`rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 ${
                    verifiedUser 
                      ? 'bg-gray-50 border-gray-300' 
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>

              <div>
                <Button 
                  onClick={handleSubmit}
                  disabled={!verifiedUser || !currentReading || !billMonth || createConsumptionMutation.isPending}
                  className={`w-full rounded-lg h-[42px] flex items-center justify-center gap-2 ${
                    verifiedUser && currentReading && billMonth && !createConsumptionMutation.isPending
                      ? 'bg-primary hover:bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus size={18} />
                  {createConsumptionMutation.isPending ? 'Submitting...' : 'Submit Reading'}
                </Button>
              </div>
            </div>

            {previousReading > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Previous reading: {previousReading.toFixed(2)} m³
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
