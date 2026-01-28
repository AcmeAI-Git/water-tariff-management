import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Dropdown } from '../components/ui/Dropdown';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus, Edit, Search, X, Upload, Download, Trash2 } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation, useAdminId } from '../hooks/useApiQuery';
import { mapUserToCustomer, type DisplayCustomer } from '../utils/dataMappers';
import type { Meter, CreateUserDto } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { toast } from 'sonner';
import { CustomerMeterModal } from '../components/modals/CustomerMeterModal';
import { parseCustomerCSV, generateCustomerCSVTemplate, exportCustomersToCSV } from '../utils/customerCsvParser';

export function CustomerAdminCustomerManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // Show all customers by default
  const [accountTypeFilter, setAccountTypeFilter] = useState('all');
  const [customerCategoryFilter, setCustomerCategoryFilter] = useState('all');
  const [waterStatusFilter, setWaterStatusFilter] = useState('all');
  const [sewerStatusFilter, setSewerStatusFilter] = useState('all');
  const [wasaFilter, setWasaFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<DisplayCustomer | null>(null);
  const [csvUploadError, setCsvUploadError] = useState<string | null>(null);
  const [csvUploadSuccess, setCsvUploadSuccess] = useState<string | null>(null);
  const [isParsingCSV, setIsParsingCSV] = useState(false);
  const [csvConfirmModalOpen, setCsvConfirmModalOpen] = useState(false);
  const [pendingCSVData, setPendingCSVData] = useState<{
    csvCustomersToAdd: CreateUserDto[];
    csvCustomersToUpdate: { customer: DisplayCustomer; data: CreateUserDto }[];
    existingCustomers: DisplayCustomer[];
  } | null>(null);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<DisplayCustomer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const adminId = useAdminId();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    inspCode: '',
    accountType: 'General',
    customerCategory: 'Domestic',
    waterStatus: 'Metered',
    sewerStatus: 'Connected',
    wasaId: '',
    zoneId: '',
    areaId: '',
    meterNo: '',
    meterStatus: 'Functional',
    sizeOfDia: '',
    meterInstallationDate: '',
    landSizeDecimal: '',
    numberOfStories: '',
    numberOfFlats: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    inspCode: '',
    accountType: 'General',
    customerCategory: 'Domestic',
    waterStatus: 'Metered',
    sewerStatus: 'Connected',
    wasaId: '',
    zoneId: '',
    areaId: '',
    meterNo: '',
    meterStatus: 'Functional',
    sizeOfDia: '',
    meterInstallationDate: '',
    landSizeDecimal: '',
    numberOfStories: '',
    numberOfFlats: '',
  });

  // Fetch all users - we'll filter by status in the frontend
  // Add retry logic to handle transient backend errors (e.g., area_id column issues)
  const { data: users = [], isLoading: usersLoading, error: usersError } = useApiQuery(
    ['users'],
    () => api.users.getAll(),
    {
      retry: (failureCount, error) => {
        // Retry up to 2 times for database column errors (backend might have transient issues)
        if (failureCount < 2 && error instanceof Error && error.message.includes('area_id')) {
          return true;
        }
        return false;
      },
      retryDelay: 1000, // Wait 1 second between retries
    }
  );

  // Fetch city corporations
  const { data: wasas = [], isLoading: cityCorpsLoading } = useApiQuery(
    ['city-corporations'],
    () => api.wasas.getAll()
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

  // Fetch meters to get meter data for editing
  const { data: meters = [] } = useApiQuery(
    ['meters'],
    () => api.meters.getAll()
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
    if (wasaFilter !== 'all') {
      filtered = filtered.filter((customer) => {
        const customerZoneId = customer.zoneId || (customer as any).zoneId;
        if (!customerZoneId) return false;
        const zone = zones.find(z => z.id === customerZoneId);
        return zone?.wasaId?.toString() === wasaFilter;
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
          (customer.meterNo && String(customer.meterNo).toLowerCase().includes(term)) ||
          (customer.phone && customer.phone.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [customers, searchQuery, statusFilter, accountTypeFilter, customerCategoryFilter, waterStatusFilter, sewerStatusFilter, wasaFilter, zoneFilter, areaFilter, zones]);

  // Get unique values for filter dropdowns
  const uniqueAccountTypes = useMemo(() => {
    const types = new Set(customers.map(c => c.accountType).filter((type): type is string => Boolean(type)));
    return Array.from(types).sort();
  }, [customers]);

  const uniqueCustomerCategories = useMemo(() => {
    const categories = new Set(customers.map(c => c.customerCategory).filter((cat): cat is string => Boolean(cat)));
    return Array.from(categories).sort();
  }, [customers]);

  const uniqueWaterStatuses = useMemo(() => {
    const statuses = new Set(customers.map(c => c.waterStatus).filter((status): status is string => Boolean(status)));
    return Array.from(statuses).sort();
  }, [customers]);

  const uniqueSewerStatuses = useMemo(() => {
    const statuses = new Set(customers.map(c => c.sewerStatus).filter((status): status is string => Boolean(status)));
    return Array.from(statuses).sort();
  }, [customers]);

  // Filter zones by selected city corporation
  const filteredZonesForFilter = useMemo(() => {
    if (wasaFilter === 'all') return zones;
    return zones.filter((zone) => zone.wasaId === parseInt(wasaFilter));
  }, [zones, wasaFilter]);

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

  // Create user mutation (now includes nested meter data)
  const createMutation = useApiMutation(
    (data: Parameters<typeof api.users.create>[0]) => api.users.create(data),
    {
      // Remove successMessage and errorMessage - we'll handle toasts manually for custom messages
      invalidateQueries: [['users'], ['users', 'pending'], ['users', 'active'], ['meters']],
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

  // Delete user mutation
  const deleteMutation = useApiMutation(
    (id: number) => api.users.delete(id),
    {
      successMessage: 'Customer deleted successfully',
      errorMessage: 'Failed to delete customer',
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
    if (!formData.wasaId) {
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
    
    // Validate meter fields if waterStatus is Metered
    if (formData.waterStatus === 'Metered') {
      if (!formData.meterNo) {
        toast.error('Please enter meter number');
        return;
      }
      if (!formData.sizeOfDia) {
        toast.error('Please enter size of diameter');
        return;
      }
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
      // Prepare meter data if waterStatus is "Metered"
      let meterData = undefined;
      if (formData.waterStatus === 'Metered' && formData.meterNo && formData.sizeOfDia) {
        const meterNoNum = parseInt(formData.meterNo);
        if (isNaN(meterNoNum)) {
          toast.error('Meter number must be a valid number');
          return;
        }

        meterData = {
          meterNo: meterNoNum,
          meterStatus: formData.meterStatus,
          sizeOfDia: formData.sizeOfDia.trim(),
          meterInstallationDate: formData.meterInstallationDate || undefined,
        };
      }

      // Create customer/user with nested meter data (if applicable)
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        address: formData.address.trim(),
        inspCode: inspCodeNum,
        accountType: formData.accountType,
        customerCategories: [{ customerCategory: formData.customerCategory, ratio: 100 }], // Array of objects with category and ratio
        waterStatus: formData.waterStatus,
        sewerStatus: formData.sewerStatus,
        areaId: parseInt(formData.areaId),
        landSizeDecimal: formData.landSizeDecimal ? parseFloat(formData.landSizeDecimal) : undefined,
        numberOfStories: formData.numberOfStories ? parseInt(formData.numberOfStories) : undefined,
        numberOfFlats: formData.numberOfFlats ? parseInt(formData.numberOfFlats) : undefined,
        ...(meterData && { meter: meterData }),
      } as any); // Type assertion - backend API accepts these fields but types are outdated

      // Show success toast notification
      toast.success(meterData ? 'Customer and meter registered successfully' : 'Customer registered successfully');
      
      // Reset form
      setFormData({
        name: '',
        address: '',
        inspCode: '',
        accountType: 'General',
        customerCategory: 'Domestic',
        waterStatus: 'Metered',
        sewerStatus: 'Connected',
        wasaId: '',
        zoneId: '',
        areaId: '',
        meterNo: '',
        meterStatus: 'Functional',
        sizeOfDia: '',
        meterInstallationDate: '',
        landSizeDecimal: '',
        numberOfStories: '',
        numberOfFlats: '',
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
    const user = users.find(u => u.id === customer.id || (u as any).account === customer.id);
    const userData = user as any;
    const userAccount = (user as any)?.account || customer.id;
    
    // Get areaId from customer (primary source) or user data
    const areaId = customer.areaId || userData?.areaId || userData?.wardId;
    
    // Find the area to get zone information
    const area = allAreas.find(a => a.id === areaId);
    // Get zone from area (nested or by zoneId)
    const zone = area?.zone || zones.find(z => z.id === (area?.zoneId || customer.zoneId));
    
    // Find existing meter for this customer
    const customerMeter = meters.find((m: Meter) => m.account === userAccount);
    
    // Map customer data to edit form (handle both new and old structure)
    setEditFormData({
      name: customer.name || customer.fullName || '',
      address: customer.address || '',
      inspCode: customer.inspCode?.toString() || userData?.inspCode?.toString() || '',
      accountType: customer.accountType || userData?.accountType || 'General',
      // Handle both array (customerCategories) and single value (customerCategory) from backend
      customerCategory: customer.customerCategory || 
        (Array.isArray(userData?.customerCategories) && userData.customerCategories.length > 0
          ? (typeof userData.customerCategories[0] === 'object' && userData.customerCategories[0]?.customerCategory
              ? userData.customerCategories[0].customerCategory
              : typeof userData.customerCategories[0] === 'string'
              ? userData.customerCategories[0]
              : userData?.customerCategory)
          : userData?.customerCategory) || 
        'Domestic',
      waterStatus: customer.waterStatus || userData?.waterStatus || 'Metered',
      sewerStatus: customer.sewerStatus || userData?.sewerStatus || 'Connected',
      wasaId: zone?.wasaId?.toString() || '',
      zoneId: zone?.id?.toString() || customer.zoneId?.toString() || '',
      areaId: areaId?.toString() || '',
      meterNo: customerMeter?.meterNo?.toString() || '',
      meterStatus: customerMeter?.meterStatus || 'Functional',
      sizeOfDia: customerMeter?.sizeOfDia || '',
      meterInstallationDate: customerMeter?.meterInstallationDate ? new Date(customerMeter.meterInstallationDate).toISOString().split('T')[0] : '',
      landSizeDecimal: userData?.landSizeDecimal?.toString() || userData?.land_size_decimal?.toString() || '',
      numberOfStories: userData?.numberOfStories?.toString() || userData?.number_of_stories?.toString() || '',
      numberOfFlats: userData?.numberOfFlats?.toString() || userData?.number_of_flats?.toString() || '',
    });
    
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedCustomer || !editFormData.wasaId || !editFormData.zoneId || !editFormData.areaId) return;

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
      // Prepare meter data if waterStatus is "Metered"
      let meterData = undefined;
      if (editFormData.waterStatus === 'Metered' && editFormData.meterNo && editFormData.sizeOfDia) {
        const meterNoNum = parseInt(editFormData.meterNo);
        if (isNaN(meterNoNum)) {
          toast.error('Meter number must be a valid number');
          return;
        }

        meterData = {
          meterNo: meterNoNum,
          meterStatus: editFormData.meterStatus,
          sizeOfDia: editFormData.sizeOfDia.trim(),
          meterInstallationDate: editFormData.meterInstallationDate || undefined,
        };
      }

      // Update customer/user with nested meter data (if applicable)
      await updateMutation.mutateAsync({
        id: selectedCustomer.id,
        data: {
          name: editFormData.name.trim(),
          address: editFormData.address.trim(),
          inspCode: inspCodeNum,
          accountType: editFormData.accountType,
          customerCategories: [{ customerCategory: editFormData.customerCategory, ratio: 100 }], // Array of objects with category and ratio
          waterStatus: editFormData.waterStatus,
          sewerStatus: editFormData.sewerStatus,
          areaId: parseInt(editFormData.areaId),
          landSizeDecimal: editFormData.landSizeDecimal ? parseFloat(editFormData.landSizeDecimal) : undefined,
          numberOfStories: editFormData.numberOfStories ? parseInt(editFormData.numberOfStories) : undefined,
          numberOfFlats: editFormData.numberOfFlats ? parseInt(editFormData.numberOfFlats) : undefined,
          ...(meterData && { meter: meterData }),
        } as any, // Type assertion - backend API accepts these fields but types are outdated
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

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset messages
    setCsvUploadError(null);
    setCsvUploadSuccess(null);
    setIsParsingCSV(true);

    try {
      // Parse CSV
      const result = await parseCustomerCSV(file, allAreas, zones, wasas);

      if (!result.success || result.data.length === 0) {
        const errorMsg = result.errors.length > 0
          ? result.errors.join('\n')
          : 'Failed to parse CSV file';
        setCsvUploadError(errorMsg);
        setIsParsingCSV(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Check for duplicate inspection codes in CSV
      const duplicateInspCodes = result.data.filter((customer, index, self) =>
        self.findIndex(c => c.inspCode === customer.inspCode) !== index
      );

      if (duplicateInspCodes.length > 0) {
        const duplicateCodes = [...new Set(duplicateInspCodes.map(c => c.inspCode))];
        setCsvUploadError(`Duplicate inspection codes found in CSV: ${duplicateCodes.join(', ')}`);
        setIsParsingCSV(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Separate CSV customers into those that update existing vs those that are new
      // Match by inspection code (unique identifier)
      const csvCustomersToAdd: CreateUserDto[] = [];
      const csvCustomersToUpdate: { customer: DisplayCustomer; data: CreateUserDto }[] = [];

      result.data.forEach(csvCustomer => {
        const existingCustomer = customers.find(c => c.inspCode?.toString() === csvCustomer.inspCode.toString());
        if (existingCustomer) {
          csvCustomersToUpdate.push({ customer: existingCustomer, data: csvCustomer });
        } else {
          csvCustomersToAdd.push(csvCustomer);
        }
      });

      // Show confirmation modal if there are updates
      if (csvCustomersToUpdate.length > 0) {
        setPendingCSVData({
          csvCustomersToAdd,
          csvCustomersToUpdate,
          existingCustomers: customers,
        });
        setCsvConfirmModalOpen(true);
        setIsParsingCSV(false);
      } else {
        // Only new customers - process directly
        await processCSVUpload(csvCustomersToAdd, []);
      }
    } catch (error) {
      setCsvUploadError(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsParsingCSV(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const processCSVUpload = async (
    csvCustomersToAdd: CreateUserDto[],
    csvCustomersToUpdate: { customer: DisplayCustomer; data: CreateUserDto }[]
  ) => {
    setIsParsingCSV(true);
    setCsvConfirmModalOpen(false);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      // Process updates first
      for (const { customer, data } of csvCustomersToUpdate) {
        try {
          await updateMutation.mutateAsync({
            id: customer.id,
            data: data as any,
          });
          successCount++;
        } catch (error) {
          errorCount++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to update ${customer.name || 'customer'} (Insp Code: ${customer.inspCode}): ${errorMsg}`);
        }
      }

      // Process new customers
      for (const customerData of csvCustomersToAdd) {
        try {
          await createMutation.mutateAsync(customerData as any);
          successCount++;
        } catch (error) {
          errorCount++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to create ${customerData.name} (Insp Code: ${customerData.inspCode}): ${errorMsg}`);
        }
      }

      // Show results
      if (errorCount === 0) {
        setCsvUploadSuccess(`Successfully imported ${successCount} customer(s)${csvCustomersToUpdate.length > 0 ? ` (${csvCustomersToUpdate.length} updated, ${csvCustomersToAdd.length} added)` : ''}.`);
        // Close the modal on successful import
        setIsDialogOpen(false);
      } else {
        setCsvUploadError(`Imported ${successCount} customer(s) successfully, but ${errorCount} failed:\n${errors.join('\n')}`);
      }

      // Reset pending data
      setPendingCSVData(null);
    } catch (error) {
      setCsvUploadError(`Failed to process CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPendingCSVData(null);
    } finally {
      setIsParsingCSV(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCSVConfirm = async () => {
    if (!pendingCSVData) return;
    
    await processCSVUpload(
      pendingCSVData.csvCustomersToAdd,
      pendingCSVData.csvCustomersToUpdate
    );
  };

  const handleCSVCancel = () => {
    setCsvConfirmModalOpen(false);
    setPendingCSVData(null);
    setIsParsingCSV(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateCustomerCSVTemplate(allAreas);
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'customer_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csvContent = exportCustomersToCSV(customers, allAreas, zones, wasas, meters);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Customers exported to CSV successfully');
  };

  const handleDeleteClick = (customer: DisplayCustomer) => {
    setCustomerToDelete(customer);
    setDeleteConfirmModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    try {
      await deleteMutation.mutateAsync(customerToDelete.id);
      setDeleteConfirmModalOpen(false);
      setCustomerToDelete(null);
    } catch (error) {
      // Error is handled by mutation's errorMessage
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmModalOpen(false);
    setCustomerToDelete(null);
  };


  // Show error state if users query fails with area_id error
  if (usersError && usersError instanceof Error && usersError.message.includes('area_id')) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl border border-red-200 max-w-md">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Database Error</h2>
          <p className="text-gray-600 mb-4">
            The backend is trying to access a column that doesn't exist. This is a backend issue that needs to be fixed.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Error: {usersError.message}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary-600 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (usersLoading || zonesLoading || areasLoading || cityCorpsLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="px-4 md:px-8 py-4 md:py-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-[1.75rem] font-semibold text-gray-900">Customer Management</h1>
        </div>

        {/* Add Button */}
        <div className="mb-6 flex items-center gap-3">
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-primary hover:bg-primary-600 text-white rounded-lg h-11 px-6 flex items-center gap-2"
          >
            <Plus size={18} />
            Add New Customer
          </Button>
          
          <CustomerMeterModal
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            formData={formData}
            onFormDataChange={handleInputChange}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
            isSubmitting={createMutation.isPending}
            wasas={wasas}
            zones={zones}
            areas={allAreas}
            mode="add"
            onDownloadTemplate={handleDownloadTemplate}
            onCSVUpload={handleCSVUpload}
            csvFileInputRef={fileInputRef}
            isParsingCSV={isParsingCSV}
            showBulkImport={true}
          />
        </div>

        {/* CSV Upload Messages */}
        {csvUploadError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">CSV Upload Error</p>
                <p className="text-sm text-red-700 mt-1 whitespace-pre-wrap">{csvUploadError}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCsvUploadError(null)}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        )}

        {csvUploadSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">CSV Upload Success</p>
                <p className="text-sm text-green-700 mt-1">{csvUploadSuccess}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCsvUploadSuccess(null)}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Search Bar and Filters */}
        <div className="mb-6 flex flex-col gap-4">
          {/* Search Bar and Clear Filters Row */}
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search by name, inspection code, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500 w-full"
              />
            </div>

            {/* Clear Filters Button */}
            {(statusFilter !== 'all' || accountTypeFilter !== 'all' || customerCategoryFilter !== 'all' || 
              waterStatusFilter !== 'all' || sewerStatusFilter !== 'all' || wasaFilter !== 'all' || 
              zoneFilter !== 'all' || areaFilter !== 'all' || searchQuery.trim() !== '') && (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('all');
                  setAccountTypeFilter('all');
                  setCustomerCategoryFilter('all');
                  setWaterStatusFilter('all');
                  setSewerStatusFilter('all');
                  setWasaFilter('all');
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
                      ...uniqueAccountTypes.filter((type): type is string => Boolean(type)).map(type => ({ value: type, label: type }))
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
                      ...uniqueCustomerCategories.filter((cat): cat is string => Boolean(cat)).map(cat => ({ value: cat, label: cat }))
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
                      ...uniqueWaterStatuses.filter((status): status is string => Boolean(status)).map(status => ({ value: status, label: status }))
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
                      ...uniqueSewerStatuses.filter((status): status is string => Boolean(status)).map(status => ({ value: status, label: status }))
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
                      { value: 'all', label: 'All WASAs' },
                      ...wasas.map(cc => ({ value: cc.id.toString(), label: `${cc.name} (${cc.code})` }))
                    ]}
                    value={wasaFilter}
                    onChange={(value) => {
                      setWasaFilter(value);
                      setZoneFilter('all'); // Reset zone when wasa changes
                      setAreaFilter('all'); // Reset area when wasa changes
                    }}
                    placeholder="WASA"
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
                    placeholder={wasaFilter === 'all' ? 'Select WASA First' : 'Zone'}
                    disabled={wasaFilter === 'all'}
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
        <CustomerMeterModal
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          formData={editFormData}
          onFormDataChange={handleEditInputChange}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditDialogOpen(false)}
          isSubmitting={updateMutation.isPending}
          wasas={wasas}
          zones={zones}
          areas={allAreas}
          mode="edit"
        />

        {/* CSV Confirmation Modal */}
        <Dialog open={csvConfirmModalOpen} onOpenChange={setCsvConfirmModalOpen}>
          <DialogContent className="sm:max-w-[500px] bg-white">
            <DialogHeader>
              <DialogTitle>Confirm CSV Import</DialogTitle>
              <DialogDescription>
                This will update existing customers and add new ones. Are you sure you want to continue?
              </DialogDescription>
            </DialogHeader>
            {pendingCSVData && (
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">
                    <strong>{pendingCSVData.csvCustomersToUpdate.length}</strong> customer(s) will be updated:
                  </p>
                  {pendingCSVData.csvCustomersToUpdate.length > 0 && (
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
                      <div className="divide-y divide-gray-200">
                        {pendingCSVData.csvCustomersToUpdate.map((item, index) => (
                          <div key={index} className="p-3 hover:bg-gray-100 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {item.customer.name || item.customer.fullName || 'Unknown'}
                                </p>
                                <div className="mt-1 space-y-1">
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">Inspection Code:</span> {item.customer.inspCode || '-'}
                                  </p>
                                  <p className="text-xs text-gray-600 truncate">
                                    <span className="font-medium">Address:</span> {item.customer.address || '-'}
                                  </p>
                                  {item.customer.accountType && (
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">Account Type:</span> {item.customer.accountType}
                                    </p>
                                  )}
                                  {item.customer.customerCategory && (
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">Category:</span> {item.customer.customerCategory}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">
                    <strong>{pendingCSVData.csvCustomersToAdd.length}</strong> new customer(s) will be added:
                  </p>
                  {pendingCSVData.csvCustomersToAdd.length > 0 && (
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
                      <div className="divide-y divide-gray-200">
                        {pendingCSVData.csvCustomersToAdd.map((customer, index) => (
                          <div key={index} className="p-3 hover:bg-gray-100 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {customer.name || 'Unknown'}
                                </p>
                                <div className="mt-1 space-y-1">
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">Inspection Code:</span> {customer.inspCode || '-'}
                                  </p>
                                  <p className="text-xs text-gray-600 truncate">
                                    <span className="font-medium">Address:</span> {customer.address || '-'}
                                  </p>
                                  {customer.accountType && (
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">Account Type:</span> {customer.accountType}
                                    </p>
                                  )}
                                  {customer.customerCategories && customer.customerCategories.length > 0 && (
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">Category:</span> {typeof customer.customerCategories[0] === 'object' ? customer.customerCategories[0].customerCategory : customer.customerCategories[0]}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                  New
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCSVCancel}
                className="border-gray-300 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCSVConfirm}
                disabled={isParsingCSV}
                className="bg-primary hover:bg-primary-600 text-white"
              >
                {isParsingCSV ? 'Processing...' : 'Confirm Import'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteConfirmModalOpen} onOpenChange={setDeleteConfirmModalOpen}>
          <DialogContent className="sm:max-w-[500px] bg-white">
            <DialogHeader>
              <DialogTitle>Delete Customer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this customer? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {customerToDelete && (
              <div className="py-4 space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>Name:</strong> {customerToDelete.name || customerToDelete.fullName}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Inspection Code:</strong> {customerToDelete.inspCode || '-'}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Address:</strong> {customerToDelete.address || '-'}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleDeleteCancel}
                className="border-gray-300 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Customer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="col-span-4">
                <h3 className="text-lg font-semibold text-gray-900">Registered Customers</h3>
              </div>
              <div className="col-span-1 flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExportCSV}
                  disabled={customers.length === 0}
                  className="border-gray-300 text-gray-700 rounded-lg h-10 px-4 flex items-center gap-2 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={16} />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-gray-50">
                  <TableHead className="text-sm font-semibold text-gray-700">Name</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Inspection Code</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Water Status</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Sewer Status</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center">Actions</TableHead>
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
                      : `customer-${index}-${customer.inspCode || customer.name || 'unknown'}-${index}`;
                    
                    return (
                      <TableRow key={uniqueKey} className="border-gray-100">
                        <TableCell className="text-sm font-medium text-gray-900">{customer.name || customer.fullName || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{customer.inspCode || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{customer.waterStatus || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{customer.sewerStatus || '-'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              customer.status?.toLowerCase() === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : customer.status?.toLowerCase() === 'inactive'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {customer.status ? customer.status.charAt(0).toUpperCase() + customer.status.slice(1) : '-'}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditClick(customer)}
                                className="border-gray-300 text-gray-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-gray-50 flex items-center justify-center"
                                title="Edit customer"
                              >
                                <Edit size={14} />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteClick(customer)}
                                className="border-red-300 text-red-600 rounded-lg h-8 w-8 p-0 bg-white hover:bg-red-50 flex items-center justify-center"
                                title="Delete customer"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
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
    </div>
  );
}
