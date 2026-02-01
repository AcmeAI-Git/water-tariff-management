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
import type { User, Consumption, CreateConsumptionDto } from '../types';

export function MeterAdminDataEntry() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentReading, setCurrentReading] = useState('');
  const [billMonth, setBillMonth] = useState('');
  const [verifiedUser, setVerifiedUser] = useState<User | null>(null);
  const [existingApprovedConsumption, setExistingApprovedConsumption] = useState<Consumption | null>(null);
  const [previousReadingForModal, setPreviousReadingForModal] = useState<number>(0);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const adminId = useAdminId();

  // Fetch all users for search (customers)
  const { data: users = [], isLoading: usersLoading } = useApiQuery(
    ['users'],
    () => api.users.getAll()
  );

  // Fetch all meters to match with users for meter number search
  const { data: meters = [] } = useApiQuery(
    ['meters'],
    () => api.meters.getAll()
  );

  // Fetch areas and zones for location information
  const { data: areas = [] } = useApiQuery(
    ['areas'],
    () => api.area.getAll()
  );

  const { data: zones = [] } = useApiQuery(
    ['zones'],
    () => api.zones.getAll()
  );

  // Fetch all consumptions to check for duplicates and get previous reading
  const { data: allConsumptions = [] } = useApiQuery<Consumption[]>(
    ['consumption'],
    () => api.consumption.getAll()
  );

  // Get user's consumptions sorted by date
  const previousConsumptions = verifiedUser?.account || verifiedUser?.id
    ? allConsumptions
        .filter(c => {
          const userAccount = verifiedUser?.account;
          const userId = verifiedUser?.id;
          // Match by userAccount (UUID) or userId (number) - handle both for compatibility
          return (userAccount && ((c as any).userAccount === userAccount || (c as any).account === userAccount)) ||
                 (userId && (c.userId === userId || (c as any).userId === userId));
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
    const searchTerm = searchQuery.toLowerCase().trim();
    if (!searchTerm) {
      toast.error('Please enter a meter number or customer name');
      return;
    }

    // First, try to find by meter number in the meters table
    let foundUser = null;
    const foundMeter = meters.find((meter: any) => {
      const meterNo = String(meter.meterNo || '').toLowerCase();
      return meterNo === searchTerm;
    });

    if (foundMeter) {
      // Found meter, now find the user by account UUID
      const userAccount = foundMeter.account || foundMeter.userAccount;
      foundUser = users.find((user) => {
        const userAccountStr = String(user.account || user.id || '');
        return userAccountStr === String(userAccount);
      });
    }

    // If not found by meter, try by name
    if (!foundUser) {
      foundUser = users.find(
        (user) =>
          (user.fullName && user.fullName.toLowerCase().includes(searchTerm)) ||
          (user.name && user.name.toLowerCase().includes(searchTerm)) ||
          // Also check direct meterNo on user (backward compatibility)
          (user.meterNo && String(user.meterNo).toLowerCase() === searchTerm)
      );
    }

    if (foundUser) {
      // Get meter info for this user
      const userAccount = foundUser.account || foundUser.id;
      const userMeter = meters.find((m: any) => {
        const meterAccount = m.account || m.userAccount;
        return String(meterAccount) === String(userAccount);
      });

      // Merge meter data into user object for display
      // Note: User type doesn't have meterStatus, so we use 'as any' for display purposes
      const userWithMeter = {
        ...foundUser,
        meterNo: userMeter?.meterNo ? String(userMeter.meterNo) : (foundUser.meterNo || ''),
        meterStatus: userMeter?.meterStatus || '',
        sizeOfDia: userMeter?.sizeOfDia || '',
        meterInstallationDate: userMeter?.meterInstallationDate || '',
      } as User & { meterStatus?: string; sizeOfDia?: string; meterInstallationDate?: string };

      setVerifiedUser(userWithMeter);
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
      toast.error('Please enter a valid current reading (must be a positive number)');
      return;
    }

    // Validate current reading is reasonable (not too large - e.g., max 999999)
    if (currentReadingNum > 999999) {
      toast.error('Current reading seems too large. Please verify the value.');
      return;
    }

    // Format bill month to YYYY-MM-DD (first day of month)
    // Ensure it's a valid date format (ISO string)
    const billMonthDate = `${billMonth}-01`;
    
    // Validate date format
    const dateObj = new Date(billMonthDate);
    if (isNaN(dateObj.getTime())) {
      toast.error('Invalid bill month format. Please select a valid month.');
      return;
    }

    // Validate bill month is not too far in the future (max 3 months ahead)
    const today = new Date();
    const maxFutureDate = new Date(today);
    maxFutureDate.setMonth(maxFutureDate.getMonth() + 3);
    if (dateObj > maxFutureDate) {
      toast.error('Bill month cannot be more than 3 months in the future.');
      return;
    }

    // Check if consumption already exists for this user and month
    const userAccount = verifiedUser.account; // UUID string
    const userId = verifiedUser.id; // numeric ID
    const existingConsumption = allConsumptions.find((c) => {
      // Match by userAccount (UUID) or userId (number) - handle both for compatibility
      const matchesUser = (userAccount && ((c as any).userAccount === userAccount || (c as any).account === userAccount)) ||
                          (userId && (c.userId === userId || (c as any).userId === userId));
      if (!matchesUser) return false;
      // Compare bill months (handle both Date objects and strings)
      const cBillMonth = typeof c.billMonth === 'string' 
        ? c.billMonth 
        : new Date(c.billMonth).toISOString().split('T')[0];
      return cBillMonth === billMonthDate;
    });

    // Get previous reading from the month BEFORE the bill month (exclude the existing consumption for same month)
    const billMonthDateObj = new Date(billMonthDate);
    const previousReadingConsumption = previousConsumptions.find((c) => {
      // Exclude the existing consumption for the same month
      if (existingConsumption && c.id === existingConsumption.id) {
        return false;
      }
      // Find consumption from a month before the bill month
      const cBillMonth = typeof c.billMonth === 'string' 
        ? new Date(c.billMonth) 
        : new Date(c.billMonth);
      return cBillMonth < billMonthDateObj;
    });
    
    const previousReadingRaw = previousReadingConsumption?.currentReading ?? 0;
    const previousReading = typeof previousReadingRaw === 'number' ? previousReadingRaw : Number(previousReadingRaw) || 0;

    if (existingConsumption) {
      // Check approval status
      const approvalStatus = existingConsumption.approvalStatus;
      let statusName = 'Unknown';

      if (typeof approvalStatus === 'string') {
        statusName = approvalStatus;
      } else if (approvalStatus && typeof approvalStatus === 'object') {
        statusName = approvalStatus.statusName || approvalStatus.name || 'Unknown';
      }

      const isApproved = statusName.toLowerCase() === 'approved';
      const isPending = statusName.toLowerCase() === 'pending';
      const isRejected = statusName.toLowerCase() === 'rejected';

      // Validate current reading is not less than previous reading
      if (previousReading > 0 && currentReadingNum < previousReading) {
        toast.error(`Current reading (${currentReadingNum}) cannot be less than previous reading (${previousReading.toFixed(2)}). Please check your values.`);
        return;
      }

      // Warn if current reading is significantly different from existing reading
      const existingCurrentReading = typeof existingConsumption.currentReading === 'number'
        ? existingConsumption.currentReading
        : Number(existingConsumption.currentReading || 0);
      
      if (isApproved) {
        // For approved readings, show info and allow submission
        // The approval admin will see both readings and can decide on overwrite
        const difference = Math.abs(currentReadingNum - existingCurrentReading);
        const percentDiff = existingCurrentReading > 0 ? (difference / existingCurrentReading) * 100 : 0;
        
        if (percentDiff > 10) {
          toast.info(`Note: An approved reading (${existingCurrentReading.toFixed(2)} m³) already exists for ${billMonth}. Your new reading will be submitted for approval review.`);
        } else {
          toast.info(`Note: An approved reading already exists for ${billMonth}. Your new reading will be submitted for approval review.`);
        }
        
        // Proceed with creation - backend will handle duplicate check
        // If backend allows, it creates new pending reading
        // If backend rejects, error will be shown
      } else if (isPending || isRejected) {
        // For pending or rejected, show modal to update existing
        if (currentReadingNum < existingCurrentReading * 0.9) {
          // Current reading is more than 10% less than existing - likely an error
          toast.warning(`Warning: New reading (${currentReadingNum}) is significantly less than existing reading (${existingCurrentReading.toFixed(2)}). Please verify this is correct.`);
        }
        
        setExistingApprovedConsumption(existingConsumption);
        setPreviousReadingForModal(previousReading); // Store previous reading for modal
        setShowReplaceModal(true);
        return; // Show modal to confirm replacement
      } else {
        // Unknown status - show modal anyway
        setExistingApprovedConsumption(existingConsumption);
        setPreviousReadingForModal(previousReading);
        setShowReplaceModal(true);
        return;
      }
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
        // Create new consumption
        const userAccount = verifiedUser!.account;
        if (!userAccount || typeof userAccount !== 'string') {
          toast.error('User account UUID not found. Please verify the customer.');
          console.error('User account missing:', verifiedUser);
          return;
        }

        const payload: CreateConsumptionDto = {
          userAccount: String(userAccount), // UUID string as per API spec
          createdBy: Number(adminId!),
          billMonth: billMonthDate, // Format: YYYY-MM-DD
          currentReading: Number(currentReadingNum),
        };
        
        // Only include previousReading if it's greater than 0
        if (previousReading > 0) {
          payload.previousReading = Number(previousReading);
        }
        
        // Validate payload before sending
        if (!payload.userAccount || !payload.createdBy || !payload.billMonth || payload.currentReading === undefined || isNaN(payload.currentReading)) {
          toast.error('Invalid form data. Please check all fields and try again.');
          console.error('Invalid payload:', payload, {
            userAccount,
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
      setPreviousReadingForModal(0);
      setShowReplaceModal(false);
    } catch (error) {
      // Handle specific error cases
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Consumption creation/update error:', error);
      
      if (errorMessage.includes('already exists') || errorMessage.includes('Consumption record already exists')) {
        toast.error(`A reading for ${billMonth} already exists for this customer. Please use a different month or update the existing reading.`);
      } else if (errorMessage.includes('Cannot update approved') || errorMessage.includes('approved consumption')) {
        toast.error('This reading has been approved and cannot be modified. Please contact an administrator if changes are needed.');
        setShowReplaceModal(false);
        setExistingApprovedConsumption(null);
        setPreviousReadingForModal(0);
      } else if (errorMessage.includes('Validation failed')) {
        toast.error('Validation failed. Please check that all required fields are filled correctly.');
      } else if (errorMessage.includes('not be empty') || errorMessage.includes('required')) {
        toast.error('Please fill in all required fields correctly.');
      } else {
        // Generic error - mutation hook will show error message
        // Don't reset form on error so user can correct and retry
      }
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
      <div className="px-4 md:px-8 py-4 md:py-6">
        {/* Header - centered on mobile to avoid hamburger overlap */}
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h1 className="text-xl md:text-[1.75rem] font-semibold text-gray-900 mb-1">Meter Data Entry</h1>
        </div>

        {/* Entry Section */}
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 mb-6 md:mb-8">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Customer Verification & Entry</h3>
          
          {/* Search */}
          <div className="mb-6 md:mb-8">
            <p className="text-xs md:text-sm font-semibold text-gray-700 mb-3">Search Customer</p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <div className="flex-1 min-w-0">
                <Input
                  id="search"
                  placeholder="Enter Meter No. or Name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full min-w-0 bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 h-11"
                />
              </div>
              <Button 
                onClick={handleSearch}
                className="bg-primary hover:bg-primary-600 text-white rounded-lg h-11 px-4 sm:px-6 flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
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
            
            {verifiedUser ? (() => {
              // Get location information
              const userArea = areas.find(a => a.id === (verifiedUser as any).areaId || verifiedUser.zoneId);
              const userZone = zones.find(z => z.id === verifiedUser.zoneId || (userArea?.zoneId));
              
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Basic Information */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                    <Input
                      value={verifiedUser.fullName || verifiedUser.name || ''}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Inspection Code</Label>
                    <Input
                      value={(verifiedUser as any).inspCode || '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Phone</Label>
                    <Input
                      value={verifiedUser.phone || '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <Input
                      value={verifiedUser.email || '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm font-medium text-gray-700">Address</Label>
                    <Input
                      value={verifiedUser.address || '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  {/* Account Information */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Account Type</Label>
                    <Input
                      value={(verifiedUser as any).accountType || '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Customer Category</Label>
                    <Input
                      value={(verifiedUser as any).customerCategory || '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Water Status</Label>
                    <Input
                      value={(verifiedUser as any).waterStatus || '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Sewer Status</Label>
                    <Input
                      value={(verifiedUser as any).sewerStatus || '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  {/* Location Information */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Zone</Label>
                    <Input
                      value={userZone?.name || '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Area</Label>
                    <Input
                      value={userArea?.name || '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  {/* Property Information */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">House Type</Label>
                    <Input
                      value={verifiedUser.hourseType || (verifiedUser as any).houseType || '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Land Size (sq ft)</Label>
                    <Input
                      value={(verifiedUser as any).landSizeDecimal !== undefined && (verifiedUser as any).landSizeDecimal !== null 
                        ? Number((verifiedUser as any).landSizeDecimal).toLocaleString() 
                        : '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Number of Stories</Label>
                    <Input
                      value={(verifiedUser as any).numberOfStories !== undefined && (verifiedUser as any).numberOfStories !== null 
                        ? String((verifiedUser as any).numberOfStories) 
                        : '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Number of Flats</Label>
                    <Input
                      value={(verifiedUser as any).numberOfFlats !== undefined && (verifiedUser as any).numberOfFlats !== null 
                        ? String((verifiedUser as any).numberOfFlats) 
                        : '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  {/* Meter Information */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Meter Number</Label>
                    <Input
                      value={verifiedUser.meterNo ? String(verifiedUser.meterNo) : '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Meter Status</Label>
                    <Input
                      value={(verifiedUser as any).meterStatus || '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Meter Size/Diameter</Label>
                    <Input
                      value={(verifiedUser as any).sizeOfDia || '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Meter Installation Date</Label>
                    <Input
                      value={(verifiedUser as any).meterInstallationDate 
                        ? new Date((verifiedUser as any).meterInstallationDate).toLocaleDateString('en-US')
                        : '-'}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  {/* Previous Reading */}
                  {previousReading > 0 && (
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-sm font-medium text-gray-700">Previous Reading (m³)</Label>
                      <Input
                        value={previousReading.toFixed(2)}
                        disabled
                        className="bg-blue-50 border-blue-200 text-blue-700 rounded-lg cursor-not-allowed font-medium"
                      />
                    </div>
                  )}
                </div>
              );
            })() : (
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
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
                  className={`w-full min-w-0 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 ${
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
                  className={`w-full min-w-0 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 ${
                    verifiedUser 
                      ? 'bg-gray-50 border-gray-300' 
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>

              <div className="sm:col-span-2 md:col-span-1">
                <Button 
                  onClick={handleSubmit}
                  disabled={!verifiedUser || !currentReading || !billMonth || createConsumptionMutation.isPending || updateConsumptionMutation.isPending}
                  className={`w-full rounded-lg h-11 flex items-center justify-center gap-2 ${
                    verifiedUser && currentReading && billMonth && !createConsumptionMutation.isPending && !updateConsumptionMutation.isPending
                      ? 'bg-primary hover:bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus size={18} />
                  <span className="truncate">{createConsumptionMutation.isPending || updateConsumptionMutation.isPending ? 'Submitting...' : 'Submit Reading'}</span>
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

      {/* Replace Existing Reading Modal */}
      {showReplaceModal && existingApprovedConsumption && (() => {
        // Determine status and modal content
        const approvalStatus = existingApprovedConsumption.approvalStatus;
        let statusName = 'Unknown';
        
        if (typeof approvalStatus === 'string') {
          statusName = approvalStatus;
        } else if (approvalStatus && typeof approvalStatus === 'object') {
          statusName = approvalStatus.statusName || approvalStatus.name || 'Unknown';
        }

        const isPending = statusName.toLowerCase() === 'pending';
        const isRejected = statusName.toLowerCase() === 'rejected';
        const modalTitle = isPending 
          ? 'Reading Already Exists (Pending)' 
          : isRejected 
          ? 'Reading Previously Rejected'
          : 'Reading Already Exists';
        const modalDescription = isPending
          ? `A reading for ${billMonth} already exists and is pending approval. You can update it with new values.`
          : isRejected
          ? `A reading for ${billMonth} was previously rejected for this customer. You can update it with new values.`
          : `A reading for ${billMonth} already exists for this customer. You can update it with new values.`;

        return (
          <Dialog open={showReplaceModal} onOpenChange={(open) => {
            setShowReplaceModal(open);
            if (!open) {
              setExistingApprovedConsumption(null);
              setPreviousReadingForModal(0);
            }
          }}>
            <DialogContent className="max-w-2xl bg-white max-h-[90vh] flex flex-col overflow-hidden p-4 sm:p-6 w-[calc(100%-2rem)]" aria-describedby={undefined}>
              <DialogHeader className="shrink-0">
                <DialogTitle className="text-lg sm:text-xl">{modalTitle}</DialogTitle>
                <DialogDescription className="text-sm">
                  {modalDescription}
                </DialogDescription>
              </DialogHeader>
            <div className="overflow-y-auto overflow-x-hidden min-h-0 flex-1 space-y-4 py-4 pr-2">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Existing Reading:</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">Current Reading:</span>
                    <span className="font-medium text-gray-900">
                      {typeof existingApprovedConsumption.currentReading === 'number' 
                        ? existingApprovedConsumption.currentReading.toFixed(2)
                        : Number(existingApprovedConsumption.currentReading || 0).toFixed(2)} m³
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">Previous Reading:</span>
                    <span className="font-medium text-gray-900">
                      {existingApprovedConsumption.previousReading 
                        ? (typeof existingApprovedConsumption.previousReading === 'number'
                            ? existingApprovedConsumption.previousReading.toFixed(2)
                            : Number(existingApprovedConsumption.previousReading).toFixed(2))
                        : 'N/A'} m³
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">Consumption:</span>
                    <span className="font-medium text-gray-900">
                      {existingApprovedConsumption.consumption 
                        ? (typeof existingApprovedConsumption.consumption === 'number'
                            ? existingApprovedConsumption.consumption.toFixed(2)
                            : Number(existingApprovedConsumption.consumption).toFixed(2))
                        : 'N/A'} m³
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">Bill Month:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(existingApprovedConsumption.billMonth).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      isPending ? 'text-yellow-700' : 
                      isRejected ? 'text-red-700' : 
                      'text-green-700'
                    }`}>
                      {statusName}
                    </span>
                  </div>
                  {existingApprovedConsumption.approvedBy && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-gray-600">Approved By:</span>
                      <span className="font-medium text-gray-900">Admin #{existingApprovedConsumption.approvedBy}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">New Reading:</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">Current Reading:</span>
                    <span className="font-medium text-blue-900">{currentReading} m³</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">Previous Reading:</span>
                    <span className="font-medium text-blue-900">
                      {previousReadingForModal > 0 ? previousReadingForModal.toFixed(2) : 'N/A'} m³
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">Calculated Consumption:</span>
                    <span className="font-medium text-blue-900">
                      {previousReadingForModal > 0 && currentReading 
                        ? (parseFloat(currentReading) - previousReadingForModal).toFixed(2) 
                        : 'N/A'} m³
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">Bill Month:</span>
                    <span className="font-medium text-blue-900">{billMonth}</span>
                  </div>
                </div>
              </div>
              <div className={`rounded-lg p-3 ${
                isPending 
                  ? 'bg-blue-50 border border-blue-200' 
                  : isRejected
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <p className={`text-sm ${
                  isPending 
                    ? 'text-blue-800' 
                    : isRejected
                    ? 'text-amber-800'
                    : 'text-gray-800'
                }`}>
                  <strong>Note:</strong> {isPending 
                    ? 'Updating this pending reading will modify the existing record with the new values.'
                    : isRejected
                    ? 'Updating this rejected reading will modify the existing record with the new values and it will return to pending status.'
                    : 'Updating this reading will modify the existing record with the new values.'}
                </p>
              </div>
            </div>
            <DialogFooter className="shrink-0 gap-2 pt-2 flex-col-reverse sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReplaceModal(false);
                  setExistingApprovedConsumption(null);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (existingApprovedConsumption) {
                    // Validate current reading is not less than previous reading
                    const newCurrentReading = parseFloat(currentReading);
                    if (previousReadingForModal > 0 && newCurrentReading < previousReadingForModal) {
                      toast.error(`Current reading (${newCurrentReading}) cannot be less than previous reading (${previousReadingForModal.toFixed(2)}). Please check your values.`);
                      return;
                    }
                    
                    createOrUpdateConsumption(
                      `${billMonth}-01`,
                      newCurrentReading,
                      previousReadingForModal,
                      existingApprovedConsumption
                    );
                  }
                }}
                disabled={updateConsumptionMutation.isPending || !existingApprovedConsumption}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                {updateConsumptionMutation.isPending ? 'Updating...' : 'Update Reading'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        );
      })()}
    </div>
  );
}
