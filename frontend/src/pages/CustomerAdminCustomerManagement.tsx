import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dropdown } from '../components/ui/Dropdown';
import { Plus, Edit, Search, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '../utils/utils';
import { api } from '../services/api';
import { useApiQuery, useApiMutation, useAdminId } from '../hooks/useApiQuery';
import { mapUserToCustomer, type DisplayCustomer } from '../utils/dataMappers';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { HierarchicalLocationSelector } from '../components/common/HierarchicalLocationSelector';
import { toast } from 'sonner';
// import type { Zone, Ward } from '../types';

export function CustomerAdminCustomerManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // Show all customers by default
  const [accountTypeFilter, setAccountTypeFilter] = useState('all');
  const [customerCategoryFilter, setCustomerCategoryFilter] = useState('all');
  const [waterStatusFilter, setWaterStatusFilter] = useState('all');
  const [sewerStatusFilter, setSewerStatusFilter] = useState('all');
  const [cityCorporationFilter, setCityCorporationFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<DisplayCustomer | null>(null);
  const adminId = useAdminId();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    inspCode: '',
    accountType: 'General',
    customerCategory: 'Domestic',
    waterStatus: 'Metered',
    sewerStatus: 'Connected',
    cityCorporationId: '',
    zoneId: '',
    areaId: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    inspCode: '',
    accountType: 'General',
    customerCategory: 'Domestic',
    waterStatus: 'Metered',
    sewerStatus: 'Connected',
    cityCorporationId: '',
    zoneId: '',
    areaId: '',
  });

  // Fetch all users - we'll filter by status in the frontend
  const { data: users = [], isLoading: usersLoading } = useApiQuery(
    ['users'],
    () => api.users.getAll()
  );

  // Fetch city corporations
  const { data: cityCorporations = [], isLoading: cityCorpsLoading } = useApiQuery(
    ['city-corporations'],
    () => api.cityCorporations.getAll()
  );

  // Fetch zones
  const { data: zones = [], isLoading: zonesLoading } = useApiQuery(
    ['zones'],
    () => api.zones.getAll()
  );

  // Fetch areas - will filter by zoneId when zone is selected
  const { data: allAreas = [], isLoading: areasLoading } = useApiQuery(
    ['areas'],
    () => api.area.getAll()
  );

  // Map users to customers
  const customers = useMemo(() => {
    return users.map(mapUserToCustomer);
  }, [users]);

  // Filter customers by search query and all filters
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((customer) => {
        const customerStatus = customer.status?.toLowerCase() || 'active';
        return customerStatus === statusFilter.toLowerCase();
      });
    }

    // Account Type filter
    if (accountTypeFilter !== 'all') {
      filtered = filtered.filter((customer) => customer.accountType === accountTypeFilter);
    }

    // Customer Category filter
    if (customerCategoryFilter !== 'all') {
      filtered = filtered.filter((customer) => customer.customerCategory === customerCategoryFilter);
    }

    // Water Status filter
    if (waterStatusFilter !== 'all') {
      filtered = filtered.filter((customer) => customer.waterStatus === waterStatusFilter);
    }

    // Sewer Status filter
    if (sewerStatusFilter !== 'all') {
      filtered = filtered.filter((customer) => customer.sewerStatus === sewerStatusFilter);
    }

    // City Corporation filter - derive from zone
    if (cityCorporationFilter !== 'all') {
      filtered = filtered.filter((customer) => {
        const customerZoneId = customer.zoneId || (customer as any).zoneId;
        if (!customerZoneId) return false;
        const zone = zones.find(z => z.id === customerZoneId);
        return zone?.cityCorporationId?.toString() === cityCorporationFilter;
      });
    }

    // Zone filter
    if (zoneFilter !== 'all') {
      filtered = filtered.filter((customer) => {
        const customerZoneId = customer.zoneId || (customer as any).zoneId;
        return customerZoneId?.toString() === zoneFilter;
      });
    }

    // Area filter
    if (areaFilter !== 'all') {
      filtered = filtered.filter((customer) => {
        const customerAreaId = customer.areaId || (customer as any).areaId || (customer as any).wardId;
        return customerAreaId?.toString() === areaFilter;
      });
    }

    // Search query filter
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(term) ||
          (customer.inspCode && customer.inspCode.toString().includes(term)) ||
          (customer.accountType && customer.accountType.toLowerCase().includes(term)) ||
          (customer.customerCategory && customer.customerCategory.toLowerCase().includes(term)) ||
          (customer.address && customer.address.toLowerCase().includes(term)) ||
          // Backward compatibility
          (customer.fullName && customer.fullName.toLowerCase().includes(term)) ||
          (customer.meterNo && customer.meterNo.toLowerCase().includes(term)) ||
          (customer.phone && customer.phone.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [customers, searchQuery, statusFilter, accountTypeFilter, customerCategoryFilter, waterStatusFilter, sewerStatusFilter, cityCorporationFilter, zoneFilter, areaFilter, zones]);

  // Get unique values for filter dropdowns
  const uniqueAccountTypes = useMemo(() => {
    const types = new Set(customers.map(c => c.accountType).filter(Boolean));
    return Array.from(types).sort();
  }, [customers]);

  const uniqueCustomerCategories = useMemo(() => {
    const categories = new Set(customers.map(c => c.customerCategory).filter(Boolean));
    return Array.from(categories).sort();
  }, [customers]);

  const uniqueWaterStatuses = useMemo(() => {
    const statuses = new Set(customers.map(c => c.waterStatus).filter(Boolean));
    return Array.from(statuses).sort();
  }, [customers]);

  const uniqueSewerStatuses = useMemo(() => {
    const statuses = new Set(customers.map(c => c.sewerStatus).filter(Boolean));
    return Array.from(statuses).sort();
  }, [customers]);

  // Filter zones by selected city corporation
  const filteredZonesForFilter = useMemo(() => {
    if (cityCorporationFilter === 'all') return zones;
    return zones.filter((zone) => zone.cityCorporationId === parseInt(cityCorporationFilter));
  }, [zones, cityCorporationFilter]);

  // Filter areas by selected zone
  const filteredAreasForFilter = useMemo(() => {
    if (zoneFilter === 'all') return allAreas;
    const zoneIdNum = parseInt(zoneFilter);
    if (isNaN(zoneIdNum)) return [];
    return allAreas.filter((area) => {
      const directZoneId = area.zoneId !== undefined ? Number(area.zoneId) : null;
      const nestedZoneId = area.zone?.id !== undefined ? Number(area.zone.id) : null;
      return directZoneId === zoneIdNum || nestedZoneId === zoneIdNum;
    });
  }, [allAreas, zoneFilter]);

  // Create user mutation
  const createMutation = useApiMutation(
    (data: Parameters<typeof api.users.create>[0]) => api.users.create(data),
    {
      // Remove successMessage and errorMessage - we'll handle toasts manually for custom messages
      invalidateQueries: [['users'], ['users', 'pending'], ['users', 'active']],
    }
  );

  // Update user mutation
  const updateMutation = useApiMutation(
    ({ id, data }: { id: number; data: Parameters<typeof api.users.update>[1] }) =>
      api.users.update(id, data),
    {
      successMessage: 'Customer updated successfully',
      errorMessage: 'Failed to update customer',
      invalidateQueries: [['users'], ['users', 'pending'], ['users', 'active']],
    }
  );


  const handleInputChange = (field: string, value: string | Date | undefined) => {
    // Validate inspCode - only allow numbers
    if (field === 'inspCode' && typeof value === 'string') {
      const numericRegex = /^\d*$/;
      if (!numericRegex.test(value)) {
        return; // Don't update if invalid character
      }
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field: string, value: string | Date | undefined) => {
    // Validate inspCode - only allow numbers
    if (field === 'inspCode' && typeof value === 'string') {
      const numericRegex = /^\d*$/;
      if (!numericRegex.test(value)) {
        return; // Don't update if invalid character
      }
    }
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name?.trim()) {
      toast.error('Please enter the customer name');
      return;
    }
    if (!formData.address?.trim()) {
      toast.error('Please enter the address');
      return;
    }
    if (!formData.inspCode?.trim()) {
      toast.error('Please enter the inspection code');
      return;
    }
    if (!formData.accountType) {
      toast.error('Please select an account type');
      return;
    }
    if (!formData.customerCategory) {
      toast.error('Please select a customer category');
      return;
    }
    if (!formData.waterStatus) {
      toast.error('Please select a water status');
      return;
    }
    if (!formData.sewerStatus) {
      toast.error('Please select a sewer status');
      return;
    }
    if (!formData.cityCorporationId) {
      toast.error('Please select a city corporation');
      return;
    }
    if (!formData.zoneId) {
      toast.error('Please select a zone');
      return;
    }
    if (!formData.areaId) {
      toast.error('Please select an area');
      return;
    }
    
    if (!adminId) {
      toast.error('Admin ID not found. Please log in again.');
      return;
    }

    // Validate inspCode is a valid number
    const inspCodeNum = parseInt(formData.inspCode);
    if (isNaN(inspCodeNum)) {
      toast.error('Please enter a valid inspection code (numbers only)');
      return;
    }

    try {
      // Create customer with new API structure
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        address: formData.address.trim(),
        inspCode: inspCodeNum,
        accountType: formData.accountType,
        customerCategory: formData.customerCategory,
        waterStatus: formData.waterStatus,
        sewerStatus: formData.sewerStatus,
        areaId: parseInt(formData.areaId),
      });

      // Show success toast notification
      toast.success('Customer created successfully');
      
      // Reset form
      setFormData({
        name: '',
        address: '',
        inspCode: '',
        accountType: 'General',
        customerCategory: 'Domestic',
        waterStatus: 'Metered',
        sewerStatus: 'Connected',
        cityCorporationId: '',
        zoneId: '',
        areaId: '',
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      // Error handling - mutations don't have errorMessage set, so we handle all errors here
      console.error('Failed to create customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
      const lowerErrorMessage = errorMessage.toLowerCase();
      
      // Provide more specific error messages - check for duplicate/existing errors specifically
      if ((lowerErrorMessage.includes('email') && (lowerErrorMessage.includes('already') || lowerErrorMessage.includes('exists') || lowerErrorMessage.includes('duplicate') || lowerErrorMessage.includes('registered') || lowerErrorMessage.includes('unique')))) {
        toast.error('This email address is already registered. Please use a different email.');
      } else if ((lowerErrorMessage.includes('meter') && (lowerErrorMessage.includes('already') || lowerErrorMessage.includes('exists') || lowerErrorMessage.includes('duplicate') || lowerErrorMessage.includes('registered') || lowerErrorMessage.includes('unique')))) {
        toast.error('This meter number is already registered. Please use a different meter number.');
      } else if ((lowerErrorMessage.includes('phone') && (lowerErrorMessage.includes('already') || lowerErrorMessage.includes('exists') || lowerErrorMessage.includes('duplicate') || lowerErrorMessage.includes('registered') || lowerErrorMessage.includes('unique')))) {
        toast.error('This phone number is already registered. Please use a different phone number.');
      } else {
        // Show the actual error message from the API
        toast.error(`Failed to create customer: ${errorMessage}`);
      }
    }
  };

  const handleEditClick = (customer: DisplayCustomer) => {
    setSelectedCustomer(customer);
    // Find the user to get full details
    const user = users.find(u => u.id === customer.id);
    const userData = user as any;
    
    // Get areaId from customer (primary source) or user data
    const areaId = customer.areaId || userData?.areaId || userData?.wardId;
    
    // Find the area to get zone information
    const area = allAreas.find(a => a.id === areaId);
    // Get zone from area (nested or by zoneId)
    const zone = area?.zone || zones.find(z => z.id === (area?.zoneId || customer.zoneId));
    
    // Map customer data to edit form (handle both new and old structure)
    setEditFormData({
      name: customer.name || customer.fullName || '',
      address: customer.address || '',
      inspCode: customer.inspCode?.toString() || userData?.inspCode?.toString() || '',
      accountType: customer.accountType || userData?.accountType || 'General',
      customerCategory: customer.customerCategory || userData?.customerCategory || 'Domestic',
      waterStatus: customer.waterStatus || userData?.waterStatus || 'Metered',
      sewerStatus: customer.sewerStatus || userData?.sewerStatus || 'Connected',
      cityCorporationId: zone?.cityCorporationId?.toString() || '',
      zoneId: zone?.id?.toString() || customer.zoneId?.toString() || '',
      areaId: areaId?.toString() || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedCustomer || !editFormData.cityCorporationId || !editFormData.zoneId || !editFormData.areaId) return;

    // Validate required fields
    if (!editFormData.name?.trim()) {
      toast.error('Please enter the customer name');
      return;
    }
    if (!editFormData.address?.trim()) {
      toast.error('Please enter the address');
      return;
    }
    if (!editFormData.inspCode?.trim()) {
      toast.error('Please enter the inspection code');
      return;
    }
    if (!editFormData.accountType) {
      toast.error('Please select an account type');
      return;
    }
    if (!editFormData.customerCategory) {
      toast.error('Please select a customer category');
      return;
    }
    if (!editFormData.waterStatus) {
      toast.error('Please select a water status');
      return;
    }
    if (!editFormData.sewerStatus) {
      toast.error('Please select a sewer status');
      return;
    }

    // Validate inspCode is a valid number
    const inspCodeNum = parseInt(editFormData.inspCode);
    if (isNaN(inspCodeNum)) {
      toast.error('Please enter a valid inspection code (numbers only)');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: selectedCustomer.id,
        data: {
          name: editFormData.name.trim(),
          address: editFormData.address.trim(),
          inspCode: inspCodeNum,
          accountType: editFormData.accountType,
          customerCategory: editFormData.customerCategory,
          waterStatus: editFormData.waterStatus,
          sewerStatus: editFormData.sewerStatus,
          areaId: parseInt(editFormData.areaId),
        },
      });
      
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      // Error handling for edit
      console.error('Failed to update customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update customer';
      const lowerErrorMessage = errorMessage.toLowerCase();
      
      // Provide more specific error messages - check for duplicate/existing errors specifically
      if ((lowerErrorMessage.includes('email') && (lowerErrorMessage.includes('already') || lowerErrorMessage.includes('exists') || lowerErrorMessage.includes('duplicate') || lowerErrorMessage.includes('registered') || lowerErrorMessage.includes('unique')))) {
        toast.error('This email address is already registered. Please use a different email.');
      } else if ((lowerErrorMessage.includes('meter') && (lowerErrorMessage.includes('already') || lowerErrorMessage.includes('exists') || lowerErrorMessage.includes('duplicate') || lowerErrorMessage.includes('registered') || lowerErrorMessage.includes('unique')))) {
        toast.error('This meter number is already registered. Please use a different meter number.');
      } else if ((lowerErrorMessage.includes('phone') && (lowerErrorMessage.includes('already') || lowerErrorMessage.includes('exists') || lowerErrorMessage.includes('duplicate') || lowerErrorMessage.includes('registered') || lowerErrorMessage.includes('unique')))) {
        toast.error('This phone number is already registered. Please use a different phone number.');
      } else {
        // Show the actual error message from the API
        toast.error(`Failed to update customer: ${errorMessage}`);
      }
    }
  };


  if (usersLoading || zonesLoading || areasLoading || cityCorpsLoading) {
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
          <h1 className="text-[1.75rem] font-semibold text-gray-900">Customer Management</h1>
        </div>

        {/* Add Button */}
        <div className="mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-600 text-white rounded-lg h-11 px-6 flex items-center gap-2">
                <Plus size={18} />
                Add New Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900">Add New Customer</DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  Register a new customer. All fields marked with * are required.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Customer Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter customer name"
                      maxLength={255}
                      className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inspCode" className="text-sm font-medium text-gray-700">
                      Inspection Code *
                    </Label>
                    <Input
                      id="inspCode"
                      type="number"
                      value={formData.inspCode}
                      onChange={(e) => handleInputChange('inspCode', e.target.value)}
                      placeholder="Enter inspection code"
                      className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                    Address *
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter complete address"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 min-h-[80px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountType" className="text-sm font-medium text-gray-700">
                      Account Type *
                    </Label>
                    <Dropdown
                      options={[
                        { value: 'General', label: 'General' },
                        { value: 'Tubewell', label: 'Tubewell' }
                      ]}
                      value={formData.accountType}
                      onChange={(value) => handleInputChange('accountType', value)}
                      placeholder="Select account type"
                      className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerCategory" className="text-sm font-medium text-gray-700">
                      Customer Category *
                    </Label>
                    <Dropdown
                      options={[
                        { value: 'Domestic', label: 'Domestic' },
                        { value: 'Commercial', label: 'Commercial' },
                        { value: 'Industrial', label: 'Industrial' },
                        { value: 'Government', label: 'Government' },
                        { value: 'Community', label: 'Community' }
                      ]}
                      value={formData.customerCategory}
                      onChange={(value) => handleInputChange('customerCategory', value)}
                      placeholder="Select category"
                      className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="waterStatus" className="text-sm font-medium text-gray-700">
                      Water Status *
                    </Label>
                    <Dropdown
                      options={[
                        { value: 'Metered', label: 'Metered' },
                        { value: 'Meter Temporarilly Disconnected', label: 'Meter Temporarily Disconnected' },
                        { value: 'Non-Metered', label: 'Non-Metered' },
                        { value: 'Connected', label: 'Connected' },
                        { value: 'Not-connected', label: 'Not Connected' }
                      ]}
                      value={formData.waterStatus}
                      onChange={(value) => handleInputChange('waterStatus', value)}
                      placeholder="Select water status"
                      className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sewerStatus" className="text-sm font-medium text-gray-700">
                      Sewer Status *
                    </Label>
                    <Dropdown
                      options={[
                        { value: 'Connected', label: 'Connected' },
                        { value: 'Not Connected', label: 'Not Connected' },
                        { value: 'Within 100 feet', label: 'Within 100 feet' }
                      ]}
                      value={formData.sewerStatus}
                      onChange={(value) => handleInputChange('sewerStatus', value)}
                      placeholder="Select sewer status"
                      className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <HierarchicalLocationSelector
                  cityCorporations={cityCorporations}
                  zones={zones}
                  areas={allAreas}
                  cityCorporationId={formData.cityCorporationId}
                  zoneId={formData.zoneId}
                  areaId={formData.areaId}
                  onCityCorporationChange={(value) => handleInputChange('cityCorporationId', value)}
                  onZoneChange={(value) => handleInputChange('zoneId', value)}
                  onAreaChange={(value) => handleInputChange('areaId', value)}
                  required
                  className="bg-gray-50"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-gray-300 text-gray-700 rounded-lg h-10 px-5 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.address || !formData.inspCode || !formData.accountType || !formData.customerCategory || !formData.waterStatus || !formData.sewerStatus || !formData.cityCorporationId || !formData.zoneId || !formData.areaId || createMutation.isPending}
                  className="bg-primary hover:bg-primary-600 text-white rounded-lg h-10 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? 'Adding...' : 'Add Customer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar and Filters */}
        <div className="mb-6 flex flex-col gap-4">
          {/* Search Bar and Clear Filters Row */}
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search by name, inspection code, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
              />
            </div>

            {/* Clear Filters Button */}
            {(statusFilter !== 'active' || accountTypeFilter !== 'all' || customerCategoryFilter !== 'all' || 
              waterStatusFilter !== 'all' || sewerStatusFilter !== 'all' || cityCorporationFilter !== 'all' || 
              zoneFilter !== 'all' || areaFilter !== 'all' || searchQuery.trim() !== '') && (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('active');
                  setAccountTypeFilter('all');
                  setCustomerCategoryFilter('all');
                  setWaterStatusFilter('all');
                  setSewerStatusFilter('all');
                  setCityCorporationFilter('all');
                  setZoneFilter('all');
                  setAreaFilter('all');
                  setSearchQuery('');
                }}
                className="h-11 px-4 border-gray-300 hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap"
              >
                <X size={16} />
                Clear Filters
              </Button>
            )}
          </div>

            {/* Filter Dropdowns - Organized in rows */}
            <div className="flex flex-col gap-3">
              {/* Row 1: Status, Account Type, Category, Water, Sewer */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* Status Filter */}
                <div className="w-full" style={{ minWidth: '160px' }}>
                  <Dropdown
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                      { value: 'pending', label: 'Pending' }
                    ]}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="Status"
                    className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 w-full"
                  />
                </div>

                {/* Account Type Filter */}
                <div className="w-full" style={{ minWidth: '160px' }}>
                  <Dropdown
                    options={[
                      { value: 'all', label: 'All Account Types' },
                      ...uniqueAccountTypes.map(type => ({ value: type, label: type }))
                    ]}
                    value={accountTypeFilter}
                    onChange={setAccountTypeFilter}
                    placeholder="Account Type"
                    className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 w-full"
                  />
                </div>

                {/* Customer Category Filter */}
                <div className="w-full" style={{ minWidth: '160px' }}>
                  <Dropdown
                    options={[
                      { value: 'all', label: 'All Categories' },
                      ...uniqueCustomerCategories.map(cat => ({ value: cat, label: cat }))
                    ]}
                    value={customerCategoryFilter}
                    onChange={setCustomerCategoryFilter}
                    placeholder="Category"
                    className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 w-full"
                  />
                </div>

                {/* Water Status Filter */}
                <div className="w-full" style={{ minWidth: '160px' }}>
                  <Dropdown
                    options={[
                      { value: 'all', label: 'All Water Status' },
                      ...uniqueWaterStatuses.map(status => ({ value: status, label: status }))
                    ]}
                    value={waterStatusFilter}
                    onChange={setWaterStatusFilter}
                    placeholder="Water Status"
                    className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 w-full"
                  />
                </div>

                {/* Sewer Status Filter */}
                <div className="w-full" style={{ minWidth: '160px' }}>
                  <Dropdown
                    options={[
                      { value: 'all', label: 'All Sewer Status' },
                      ...uniqueSewerStatuses.map(status => ({ value: status, label: status }))
                    ]}
                    value={sewerStatusFilter}
                    onChange={setSewerStatusFilter}
                    placeholder="Sewer Status"
                    className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 w-full"
                  />
                </div>
              </div>

              {/* Row 2: Location Filters (City Corp, Zone, Area) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* City Corporation Filter */}
                <div className="w-full min-w-0">
                  <Dropdown
                    options={[
                      { value: 'all', label: 'All City Corporations' },
                      ...cityCorporations.map(cc => ({ value: cc.id.toString(), label: `${cc.name} (${cc.code})` }))
                    ]}
                    value={cityCorporationFilter}
                    onChange={(value) => {
                      setCityCorporationFilter(value);
                      setZoneFilter('all'); // Reset zone when city corp changes
                      setAreaFilter('all'); // Reset area when city corp changes
                    }}
                    placeholder="City Corporation"
                    className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 w-full"
                  />
                </div>

                {/* Zone Filter */}
                <div className="w-full min-w-0">
                  <Dropdown
                    options={[
                      { value: 'all', label: 'All Zones' },
                      ...filteredZonesForFilter.map(zone => ({ value: zone.id.toString(), label: `${zone.name} - ${zone.cityName}` }))
                    ]}
                    value={zoneFilter}
                    onChange={(value) => {
                      setZoneFilter(value);
                      setAreaFilter('all'); // Reset area when zone changes
                    }}
                    placeholder={cityCorporationFilter === 'all' ? 'Select City Corp First' : 'Zone'}
                    disabled={cityCorporationFilter === 'all'}
                    className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 w-full"
                  />
                </div>

                {/* Area Filter */}
                <div className="w-full min-w-0">
                  <Dropdown
                    options={[
                      { value: 'all', label: 'All Areas' },
                      ...filteredAreasForFilter.map(area => ({ value: area.id.toString(), label: area.name || area.id.toString() }))
                    ]}
                    value={areaFilter}
                    onChange={setAreaFilter}
                    placeholder={zoneFilter === 'all' ? 'Select Zone First' : 'Area'}
                    disabled={zoneFilter === 'all'}
                    className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 w-full"
                  />
                </div>
              </div>
            </div>
          </div>

        {/* Edit Customer Modal */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Edit Customer</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Update customer information. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700">
                    Customer Name *
                  </Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => handleEditInputChange('name', e.target.value)}
                    placeholder="Enter customer name"
                    maxLength={255}
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-inspCode" className="text-sm font-medium text-gray-700">
                    Inspection Code *
                  </Label>
                  <Input
                    id="edit-inspCode"
                    type="number"
                    value={editFormData.inspCode}
                    onChange={(e) => handleEditInputChange('inspCode', e.target.value)}
                    placeholder="Enter inspection code"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address" className="text-sm font-medium text-gray-700">
                  Address *
                </Label>
                <Textarea
                  id="edit-address"
                  value={editFormData.address}
                  onChange={(e) => handleEditInputChange('address', e.target.value)}
                  placeholder="Enter complete address"
                  className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500 min-h-[80px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-accountType" className="text-sm font-medium text-gray-700">
                    Account Type *
                  </Label>
                  <Dropdown
                    options={[
                      { value: 'General', label: 'General' },
                      { value: 'Tubewell', label: 'Tubewell' }
                    ]}
                    value={editFormData.accountType}
                    onChange={(value) => handleEditInputChange('accountType', value)}
                    placeholder="Select account type"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-customerCategory" className="text-sm font-medium text-gray-700">
                    Customer Category *
                  </Label>
                  <Dropdown
                    options={[
                      { value: 'Domestic', label: 'Domestic' },
                      { value: 'Commercial', label: 'Commercial' },
                      { value: 'Industrial', label: 'Industrial' },
                      { value: 'Government', label: 'Government' },
                      { value: 'Community', label: 'Community' }
                    ]}
                    value={editFormData.customerCategory}
                    onChange={(value) => handleEditInputChange('customerCategory', value)}
                    placeholder="Select category"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-waterStatus" className="text-sm font-medium text-gray-700">
                    Water Status *
                  </Label>
                  <Dropdown
                    options={[
                      { value: 'Metered', label: 'Metered' },
                      { value: 'Meter Temporarilly Disconnected', label: 'Meter Temporarily Disconnected' },
                      { value: 'Non-Metered', label: 'Non-Metered' },
                      { value: 'Connected', label: 'Connected' },
                      { value: 'Not-connected', label: 'Not Connected' }
                    ]}
                    value={editFormData.waterStatus}
                    onChange={(value) => handleEditInputChange('waterStatus', value)}
                    placeholder="Select water status"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-sewerStatus" className="text-sm font-medium text-gray-700">
                    Sewer Status *
                  </Label>
                  <Dropdown
                    options={[
                      { value: 'Connected', label: 'Connected' },
                      { value: 'Not Connected', label: 'Not Connected' },
                      { value: 'Within 100 feet', label: 'Within 100 feet' }
                    ]}
                    value={editFormData.sewerStatus}
                    onChange={(value) => handleEditInputChange('sewerStatus', value)}
                    placeholder="Select sewer status"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <HierarchicalLocationSelector
                cityCorporations={cityCorporations}
                zones={zones}
                areas={allAreas}
                cityCorporationId={editFormData.cityCorporationId}
                zoneId={editFormData.zoneId}
                areaId={editFormData.areaId}
                onCityCorporationChange={(value) => handleEditInputChange('cityCorporationId', value)}
                onZoneChange={(value) => handleEditInputChange('zoneId', value)}
                onAreaChange={(value) => handleEditInputChange('areaId', value)}
                required
                className="bg-gray-50"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-gray-300 text-gray-700 rounded-lg h-10 px-5 bg-white hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleEditSubmit}
                disabled={!editFormData.name || !editFormData.address || !editFormData.inspCode || !editFormData.accountType || !editFormData.customerCategory || !editFormData.waterStatus || !editFormData.sewerStatus || !editFormData.cityCorporationId || !editFormData.zoneId || !editFormData.areaId || updateMutation.isPending}
                className="bg-primary hover:bg-primary-600 text-white rounded-lg h-10 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Registered Customers</h3>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 bg-gray-50">
                <TableHead className="text-sm font-semibold text-gray-700">Name</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Inspection Code</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Category</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Water Status</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Sewer Status</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Address</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700 text-left">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow key="empty-state">
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No customers found matching your search criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer, index) => {
                  // Ensure unique key - use id, or combination of index and other fields
                  const uniqueKey = customer.id 
                    ? `customer-${customer.id}` 
                    : `customer-${index}-${customer.inspCode || customer.name || 'unknown'}-${index}`;
                  return (
                    <TableRow key={uniqueKey} className="border-gray-100">
                      <TableCell className="text-sm font-medium text-gray-900">{customer.name || customer.fullName || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{customer.inspCode || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{customer.customerCategory || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{customer.waterStatus || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{customer.sewerStatus || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{customer.address}</TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditClick(customer)}
                          className="border-gray-300 text-gray-700 rounded-lg h-8 px-3 bg-white hover:bg-gray-50 flex items-center gap-1.5"
                        >
                          <Edit size={14} />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
