import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation, useAdminId } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import type { User, Consumption } from '../types';

export function MeterAdminDataEntry() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentReading, setCurrentReading] = useState('');
  const [billMonth, setBillMonth] = useState('');
  const [verifiedUser, setVerifiedUser] = useState<User | null>(null);
  const [existingApprovedConsumption, setExistingApprovedConsumption] = useState<Consumption | null>(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const adminId = useAdminId();

  // Hardcoded location for all meter readers
  const HARDCODED_WARD = 'Ward 1';

  // Fetch all users for search (customers)
  const { data: users = [], isLoading: usersLoading } = useApiQuery(
    ['users'],
    () => api.users.getAll()
  );

  // Fetch all consumptions to check for duplicates and get previous reading
  const { data: allConsumptions = [] } = useApiQuery<Consumption[]>(
    ['consumption'],
    () => api.consumption.getAll()
  );

  // Get user's consumptions sorted by date
  const previousConsumptions = verifiedUser?.id || verifiedUser?.account
    ? allConsumptions
        .filter(c => {
          const userAccount = verifiedUser?.account || verifiedUser?.id;
          return c.userId === verifiedUser?.id || 
                 (c as any).account === userAccount ||
                 c.userId === userAccount;
        })
        .sort((a, b) => new Date(b.billMonth).getTime() - new Date(a.billMonth).getTime())
    : [];

  // Create consumption mutation
  const createConsumptionMutation = useApiMutation(
    (data: Parameters<typeof api.consumption.create>[0]) => api.consumption.create(data),
    {
      successMessage: 'Meter reading saved successfully',
      errorMessage: 'Failed to submit meter reading',
      invalidateQueries: [['consumption']],
    }
  );

  // Update consumption mutation
  const updateConsumptionMutation = useApiMutation(
    (data: { id: number; currentReading: number; previousReading?: number }) => 
      api.consumption.update(data.id, {
        currentReading: data.currentReading,
        previousReading: data.previousReading,
      }),
    {
      successMessage: 'Reading updated successfully',
      errorMessage: 'Failed to update reading',
      invalidateQueries: [['consumption']],
    }
  );

  const handleSearch = () => {
    const foundUser = users.find(
      (user) =>
        (user.meterNo && user.meterNo.toLowerCase() === searchQuery.toLowerCase()) ||
        (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
      toast.error('Customer not found. Please check the meter number or name.');
    }
  };

  const handleSubmit = async () => {
    if (!verifiedUser || !adminId) {
      toast.error('Please verify customer and ensure you are logged in');
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
    // Ensure it's a valid date format (ISO string)
    const billMonthDate = `${billMonth}-01`;
    
    // Validate date format
    const dateObj = new Date(billMonthDate);
    if (isNaN(dateObj.getTime())) {
      toast.error('Invalid bill month format. Please select a valid month.');
      return;
    }

    // Check if consumption already exists for this user and month
    const userAccount = verifiedUser.account || verifiedUser.id;
    const existingConsumption = allConsumptions.find((c) => {
      const matchesUser = c.userId === verifiedUser.id || 
                         (c as any).account === userAccount ||
                         c.userId === userAccount;
      if (!matchesUser) return false;
      // Compare bill months (handle both Date objects and strings)
      const cBillMonth = typeof c.billMonth === 'string' 
        ? c.billMonth 
        : new Date(c.billMonth).toISOString().split('T')[0];
      return cBillMonth === billMonthDate;
    });

    if (existingConsumption) {
      // If consumption exists, update it instead of creating duplicate
      setExistingApprovedConsumption(existingConsumption);
      setShowReplaceModal(true);
      return; // Show modal to confirm replacement
    }

    // Proceed with creation
    await createOrUpdateConsumption(billMonthDate, currentReadingNum, previousReading, null);
  };

  const createOrUpdateConsumption = async (
    billMonthDate: string,
    currentReadingNum: number,
    previousReading: number,
    existingConsumption: Consumption | null
  ) => {
    try {
      if (existingConsumption) {
        // Update existing consumption (rejected or pending only - backend blocks approved)
        // Backend blocks creating duplicates, so we update rejected/pending entries instead
        await updateConsumptionMutation.mutateAsync({
          id: existingConsumption.id,
          currentReading: currentReadingNum,
          previousReading: previousReading > 0 ? previousReading : undefined,
        });
      } else {
        // Create new consumption - use numeric id as account (workaround for backend validation)
        // Backend validation expects account as number, but users have UUID strings
        // Using numeric id as workaround since we can't change backend
        const numericAccount = Number(verifiedUser!.id);
        const payload: {
          account: number; // Numeric ID (workaround for backend validation mismatch)
          createdBy: number;
          billMonth: string;
          currentReading: number;
          previousReading?: number;
        } = {
          account: numericAccount, // Use numeric ID as workaround
          createdBy: Number(adminId!),
          billMonth: billMonthDate, // Format: YYYY-MM-DD
          currentReading: Number(currentReadingNum),
        };
        
        // Only include previousReading if it's greater than 0
        if (previousReading > 0) {
          payload.previousReading = Number(previousReading);
        }
        
        // Validate payload before sending
        if (!payload.account || !payload.createdBy || !payload.billMonth || payload.currentReading === undefined || isNaN(payload.currentReading)) {
          toast.error('Invalid form data. Please check all fields and try again.');
          console.error('Invalid payload:', payload, {
            account: numericAccount,
            adminId,
            billMonthDate,
            currentReadingNum,
            previousReading
          });
          return;
        }
        
        console.log('Sending consumption payload:', payload);
        await createConsumptionMutation.mutateAsync(payload);
      }

      // Reset form
      setCurrentReading('');
      setBillMonth('');
      setVerifiedUser(null);
      setSearchQuery('');
      setExistingApprovedConsumption(null);
      setShowReplaceModal(false);
    } catch (error) {
      // Handle duplicate consumption error specifically
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Consumption creation error:', error);
      
      if (errorMessage.includes('already exists') || errorMessage.includes('Consumption record already exists')) {
        toast.error(`A reading for ${billMonth} already exists for this customer. Please use a different month or update the existing reading.`);
      } else if (errorMessage.includes('Validation failed')) {
        toast.error('Validation failed. Please check that all required fields are filled correctly.');
      }
      // Other errors are handled by the mutation hook's errorMessage
      // Don't reset form on error so user can correct and retry
    }
  };

  // Ensure previousReading is a number
  const previousReadingRaw = previousConsumptions[0]?.currentReading;
  const previousReading = typeof previousReadingRaw === 'number' 
    ? previousReadingRaw 
    : Number(previousReadingRaw) || 0;

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
          <p className="text-sm text-gray-500">Your Assigned Ward: {HARDCODED_WARD}</p>
        </div>

        {/* Entry Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Verification & Entry</h3>
          
          {/* Search */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-gray-700 mb-3">Search Customer</p>
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
            <p className="text-sm font-semibold text-gray-700 mb-3">Customer Details (Read-Only)</p>
            
            {verifiedUser ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                  <Input
                    value={verifiedUser.fullName || verifiedUser.name || ''}
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
                  Search for a customer to view details
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 mb-8"></div>

          {/* Enter Data */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">New Reading Details</p>
            
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
                  disabled={!verifiedUser || createConsumptionMutation.isPending || updateConsumptionMutation.isPending}
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
                  disabled={!verifiedUser || createConsumptionMutation.isPending || updateConsumptionMutation.isPending}
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
                  disabled={!verifiedUser || !currentReading || !billMonth || createConsumptionMutation.isPending || updateConsumptionMutation.isPending}
                  className={`w-full rounded-lg h-[42px] flex items-center justify-center gap-2 ${
                    verifiedUser && currentReading && billMonth && !createConsumptionMutation.isPending && !updateConsumptionMutation.isPending
                      ? 'bg-primary hover:bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus size={18} />
                  {createConsumptionMutation.isPending || updateConsumptionMutation.isPending ? 'Submitting...' : 'Submit Reading'}
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

      {/* Replace Rejected Reading Modal */}
      {showReplaceModal && existingApprovedConsumption && (
        <Dialog open={showReplaceModal} onOpenChange={(open) => {
          setShowReplaceModal(open);
          if (!open) {
            setExistingApprovedConsumption(null);
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reading Previously Rejected</DialogTitle>
              <DialogDescription>
                A reading for {billMonth} was previously rejected for this customer. You can update it with new values.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Existing Approved Reading:</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Reading:</span>
                    <span className="font-medium text-gray-900">
                      {typeof existingApprovedConsumption.currentReading === 'number' 
                        ? existingApprovedConsumption.currentReading.toFixed(2)
                        : Number(existingApprovedConsumption.currentReading || 0).toFixed(2)} m³
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Previous Reading:</span>
                    <span className="font-medium text-gray-900">
                      {existingApprovedConsumption.previousReading 
                        ? (typeof existingApprovedConsumption.previousReading === 'number'
                            ? existingApprovedConsumption.previousReading.toFixed(2)
                            : Number(existingApprovedConsumption.previousReading).toFixed(2))
                        : 'N/A'} m³
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Consumption:</span>
                    <span className="font-medium text-gray-900">
                      {existingApprovedConsumption.consumption 
                        ? (typeof existingApprovedConsumption.consumption === 'number'
                            ? existingApprovedConsumption.consumption.toFixed(2)
                            : Number(existingApprovedConsumption.consumption).toFixed(2))
                        : 'N/A'} m³
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bill Month:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(existingApprovedConsumption.billMonth).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  {existingApprovedConsumption.approvedBy && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Approved By:</span>
                      <span className="font-medium text-gray-900">Admin #{existingApprovedConsumption.approvedBy}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">New Reading:</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Reading:</span>
                    <span className="font-medium text-blue-900">{currentReading} m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Previous Reading:</span>
                    <span className="font-medium text-blue-900">
                      {previousReading > 0 ? previousReading.toFixed(2) : 'N/A'} m³
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bill Month:</span>
                    <span className="font-medium text-blue-900">{billMonth}</span>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Updating this reading will modify the existing record with the new values.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReplaceModal(false);
                  setExistingApprovedConsumption(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (existingApprovedConsumption) {
                    createOrUpdateConsumption(
                      `${billMonth}-01`,
                      parseFloat(currentReading),
                      previousReading,
                      existingApprovedConsumption
                    );
                  }
                }}
                disabled={updateConsumptionMutation.isPending || !existingApprovedConsumption}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updateConsumptionMutation.isPending ? 'Updating...' : 'Update Reading'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
