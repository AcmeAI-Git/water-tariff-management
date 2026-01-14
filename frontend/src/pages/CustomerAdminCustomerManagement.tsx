import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dropdown } from '../components/ui/Dropdown';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Plus, Edit, CalendarIcon, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
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
  const [statusFilter, setStatusFilter] = useState('active'); // Show active customers
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<DisplayCustomer | null>(null);
  const adminId = useAdminId();
  
  const [formData, setFormData] = useState({
    fullName: '',
    meterNo: '',
    phone: '',
    email: '',
    address: '',
    category: 'residential',
    meterInstallDate: undefined as Date | undefined,
    cityCorporationId: '',
    zoneId: '',
    areaId: '',
  });

  const [editFormData, setEditFormData] = useState({
    fullName: '',
    meterNo: '',
    phone: '',
    email: '',
    address: '',
    category: 'residential',
    meterInstallDate: undefined as Date | undefined,
    cityCorporationId: '',
    zoneId: '',
    areaId: '',
  });

  // Fetch users (households) - default to 'active' to show only approved households
  const { data: users = [], isLoading: usersLoading } = useApiQuery(
    statusFilter === 'all' ? ['users'] : ['users', statusFilter],
    () => {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      return api.users.getAll(status);
    }
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

  // Filter customers by search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const term = searchQuery.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.meterNo.toLowerCase().includes(term) ||
        customer.fullName.toLowerCase().includes(term) ||
        customer.phone.toLowerCase().includes(term)
    );
  }, [customers, searchQuery]);

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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field: string, value: string | Date | undefined) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.fullName?.trim()) {
      toast.error('Please enter the full name');
      return;
    }
    if (!formData.meterNo?.trim()) {
      toast.error('Please enter the meter number');
      return;
    }
    if (!formData.phone?.trim()) {
      toast.error('Please enter the phone number');
      return;
    }
    if (!formData.email?.trim()) {
      toast.error('Please enter the email address');
      return;
    }
    if (!formData.address?.trim()) {
      toast.error('Please enter the address');
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
    if (!formData.meterInstallDate) {
      toast.error('Please select the meter installation date');
      return;
    }
    
    if (!adminId) {
      toast.error('Admin ID not found. Please log in again.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      // Create customer - API only needs areaId (zone and city corp are inferred from area)
      await createMutation.mutateAsync({
        fullName: formData.fullName.trim(),
        meterNo: formData.meterNo.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        hourseType: formData.category === 'residential' ? 'Residential' : 'Commercial',
        installDate: format(formData.meterInstallDate, 'yyyy-MM-dd'),
        areaId: parseInt(formData.areaId),
      });

      // Show success toast notification
      toast.success('Customer created successfully');
      
      // Reset form
      setFormData({
        fullName: '',
        meterNo: '',
        phone: '',
        email: '',
        address: '',
        category: 'residential',
        meterInstallDate: undefined,
        cityCorporationId: '',
        zoneId: '',
        areaId: '',
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      // Error handling - mutations don't have errorMessage set, so we handle all errors here
      console.error('Failed to create customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
      
      // Provide more specific error messages
      if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        toast.error('This email address is already registered. Please use a different email.');
      } else if (errorMessage.includes('meter') || errorMessage.includes('Meter')) {
        toast.error('This meter number is already registered. Please use a different meter number.');
      } else if (errorMessage.includes('phone') || errorMessage.includes('Phone')) {
        toast.error('This phone number is already registered. Please use a different phone number.');
      } else {
        toast.error(`Failed to create customer: ${errorMessage}`);
      }
    }
  };

  const handleEditClick = (customer: DisplayCustomer) => {
    setSelectedCustomer(customer);
    // Find the user to get full details
    const user = users.find(u => u.id === customer.id);
    // Find the zone to get city corporation ID
    const zone = zones.find(z => z.id === customer.zoneId);
    setEditFormData({
      fullName: customer.fullName,
      meterNo: customer.meterNo,
      phone: customer.phone,
      email: customer.email || user?.email || '',
      address: customer.address,
      category: user?.hourseType?.toLowerCase().includes('commercial') ? 'commercial' : 'residential',
      meterInstallDate: user?.installDate ? new Date(user.installDate) : undefined,
      cityCorporationId: zone?.cityCorporationId?.toString() || '',
      zoneId: customer.zoneId?.toString() || '',
      areaId: customer.areaId?.toString() || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedCustomer || !editFormData.cityCorporationId || !editFormData.zoneId || !editFormData.areaId || !editFormData.meterInstallDate) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editFormData.email || !editFormData.email.trim() || !emailRegex.test(editFormData.email.trim())) {
      alert('Please enter a valid email address');
      return;
    }

    await updateMutation.mutateAsync({
      id: selectedCustomer.id,
      data: {
        fullName: editFormData.fullName,
        meterNo: editFormData.meterNo,
        phone: editFormData.phone,
        email: editFormData.email.trim(),
        address: editFormData.address,
        hourseType: editFormData.category === 'residential' ? 'Residential' : 'Commercial',
        installDate: format(editFormData.meterInstallDate, 'yyyy-MM-dd'),
        areaId: parseInt(editFormData.areaId),
      },
    });
    
    setIsEditDialogOpen(false);
    setSelectedCustomer(null);
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
          <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">Customer Management</h1>
          <p className="text-sm text-gray-500">Customer Management Portal</p>
        </div>

        {/* Add Button and Filters */}
        <div className="mb-6 flex items-center justify-between gap-4">
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
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Enter full name"
                      className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meterNo" className="text-sm font-medium text-gray-700">
                      Meter Number *
                    </Label>
                    <Input
                      id="meterNo"
                      value={formData.meterNo}
                      onChange={(e) => handleInputChange('meterNo', e.target.value)}
                      placeholder="MTR-2024-XXXX"
                      className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+880-XXXX-XXXXXX"
                      className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="email@example.com"
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
                    <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                      Customer Category *
                    </Label>
                    <Dropdown
                      options={[
                        { value: 'residential', label: 'Residential' },
                        { value: 'commercial', label: 'Commercial' }
                      ]}
                      value={formData.category}
                      onChange={(value) => handleInputChange('category', value)}
                      placeholder="Select category"
                      className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meterInstallDate" className="text-sm font-medium text-gray-700">
                      Meter Install Date *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left bg-gray-50 border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-primary/20 focus:border-blue-500",
                            !formData.meterInstallDate && "text-gray-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.meterInstallDate ? format(formData.meterInstallDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.meterInstallDate}
                          onSelect={(date) => {
                            if (date) {
                              handleInputChange('meterInstallDate', date);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                  disabled={!formData.fullName || !formData.meterNo || !formData.phone || !formData.email || !formData.address || !formData.meterInstallDate || !formData.cityCorporationId || !formData.zoneId || !formData.areaId || createMutation.isPending}
                  className="bg-primary hover:bg-primary-600 text-white rounded-lg h-10 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? 'Adding...' : 'Add Customer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-3 flex-1 justify-end max-w-2xl">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search by Meter No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
              />
            </div>

            {/* Status Filter Dropdown */}
            <div className="w-48">
              <Dropdown
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'pending', label: 'Pending' }
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Filter by Status"
                className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
              />
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
                  <Label htmlFor="edit-fullName" className="text-sm font-medium text-gray-700">
                    Full Name *
                  </Label>
                  <Input
                    id="edit-fullName"
                    value={editFormData.fullName}
                    onChange={(e) => handleEditInputChange('fullName', e.target.value)}
                    placeholder="Enter full name"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-meterNo" className="text-sm font-medium text-gray-700">
                    Meter Number *
                  </Label>
                  <Input
                    id="edit-meterNo"
                    value={editFormData.meterNo}
                    onChange={(e) => handleEditInputChange('meterNo', e.target.value)}
                    placeholder="MTR-2024-XXXX"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="text-sm font-medium text-gray-700">
                    Phone Number *
                  </Label>
                  <Input
                    id="edit-phone"
                    value={editFormData.phone}
                    onChange={(e) => handleEditInputChange('phone', e.target.value)}
                    placeholder="+880-XXXX-XXXXXX"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700">
                    Email Address *
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => handleEditInputChange('email', e.target.value)}
                    placeholder="email@example.com"
                    required
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
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
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category" className="text-sm font-medium text-gray-700">
                    Household Category *
                  </Label>
                  <Dropdown
                    options={[
                      { value: 'residential', label: 'Residential' },
                      { value: 'commercial', label: 'Commercial' }
                    ]}
                    value={editFormData.category}
                    onChange={(value) => handleEditInputChange('category', value)}
                    placeholder="Select category"
                    className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-meterInstallDate" className="text-sm font-medium text-gray-700">
                    Meter Install Date *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left bg-gray-50 border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-primary/20 focus:border-blue-500",
                          !editFormData.meterInstallDate && "text-gray-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editFormData.meterInstallDate ? format(editFormData.meterInstallDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white" align="start">
                      <Calendar
                        mode="single"
                        selected={editFormData.meterInstallDate}
                        onSelect={(date) => handleEditInputChange('meterInstallDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                disabled={!editFormData.fullName || !editFormData.meterNo || !editFormData.phone || !editFormData.email || !editFormData.address || !editFormData.meterInstallDate || !editFormData.cityCorporationId || !editFormData.zoneId || !editFormData.areaId || updateMutation.isPending}
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
                <TableHead className="text-sm font-semibold text-gray-700">Full Name</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Meter No</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Phone</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Address</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700 text-left">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow key="empty-state">
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No customers found matching your search criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer, index) => {
                  // Ensure unique key - use id, or combination of index and other fields
                  const uniqueKey = customer.id 
                    ? `customer-${customer.id}` 
                    : `customer-${index}-${customer.meterNo || customer.fullName || 'unknown'}-${index}`;
                  return (
                    <TableRow key={uniqueKey} className="border-gray-100">
                      <TableCell className="text-sm font-medium text-gray-900">{customer.fullName}</TableCell>
                      <TableCell className="text-sm text-gray-600">{customer.meterNo}</TableCell>
                      <TableCell className="text-sm text-gray-600">{customer.phone}</TableCell>
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
