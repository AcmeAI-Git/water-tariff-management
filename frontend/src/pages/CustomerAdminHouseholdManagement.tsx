import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Plus, Edit, CalendarIcon, Search } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '../utils/utils';

export function CustomerAdminHouseholdManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [households, setHouseholds] = useState([
    {
      id: 1,
      fullName: 'Ahmed Hassan',
      meterNo: 'MTR-2024-1001',
      phone: '+880-1712-345678',
      address: '45 Dhanmondi Road, Ward 3, Dhaka',
      status: 'Approved'
    },
    {
      id: 2,
      fullName: 'Fatima Rahman',
      meterNo: 'MTR-2024-1002',
      phone: '+880-1823-456789',
      address: '12 Mirpur Street, Ward 3, Dhaka',
      status: 'Pending'
    },
    {
      id: 3,
      fullName: 'Mohammad Ali',
      meterNo: 'MTR-2024-1003',
      phone: '+880-1934-567890',
      address: '78 Gulshan Avenue, Ward 3, Dhaka',
      status: 'Approved'
    },
    {
      id: 4,
      fullName: 'Nadia Chowdhury',
      meterNo: 'MTR-2024-1004',
      phone: '+880-1645-678901',
      address: '23 Banani Road, Ward 3, Dhaka',
      status: 'Approved'
    },
    {
      id: 5,
      fullName: 'Karim Sheikh',
      meterNo: 'MTR-2024-1005',
      phone: '+880-1756-789012',
      address: '56 Uttara Sector 7, Ward 3, Dhaka',
      status: 'Pending'
    },
    {
      id: 6,
      fullName: 'Ayesha Begum',
      meterNo: 'MTR-2024-1006',
      phone: '+880-1867-890123',
      address: '34 Mohammadpur Lane, Ward 3, Dhaka',
      status: 'Approved'
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    meterNo: '',
    phone: '',
    email: '',
    address: '',
    category: 'residential',
    meterInstallDate: undefined as Date | undefined,
    zone: '',
    ward: '',
  });

  const [editFormData, setEditFormData] = useState({
    fullName: '',
    meterNo: '',
    phone: '',
    email: '',
    address: '',
    category: 'residential',
    meterInstallDate: undefined as Date | undefined,
    zone: '',
    ward: '',
  });

  const handleInputChange = (field: string, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field: string, value: string | Date | undefined) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const newHousehold = {
      id: households.length + 1,
      fullName: formData.fullName,
      meterNo: formData.meterNo,
      phone: formData.phone,
      address: formData.address,
      status: 'Pending'
    };

    setHouseholds(prev => [...prev, newHousehold]);
    
    // Reset form
    setFormData({
      fullName: '',
      meterNo: '',
      phone: '',
      email: '',
      address: '',
      category: 'residential',
      meterInstallDate: undefined,
      zone: '',
      ward: '',
    });
    
    setIsDialogOpen(false);
  };

  const handleEditClick = (household: any) => {
    setSelectedHousehold(household);
    setEditFormData({
      fullName: household.fullName,
      meterNo: household.meterNo,
      phone: household.phone,
      email: 'ahmed.hassan@example.com',
      address: household.address,
      category: 'residential',
      meterInstallDate: new Date('2024-01-15'),
      zone: 'Zone A',
      ward: 'Ward 3',
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    // In a real app, this would update the household in the database
    const updatedHouseholds = households.map(h => 
      h.id === selectedHousehold?.id 
        ? { ...h, fullName: editFormData.fullName, meterNo: editFormData.meterNo, phone: editFormData.phone, address: editFormData.address }
        : h
    );
    
    setHouseholds(updatedHouseholds);
    setIsEditDialogOpen(false);
    setSelectedHousehold(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Filter households based on search query and status
  const filteredHouseholds = households.filter((household) => {
    const matchesSearch = household.meterNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || household.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-app">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">Household Management</h1>
          <p className="text-sm text-gray-500">Your Assigned Ward: Ward 3, Dhaka South</p>
        </div>

        {/* Add Button and Filters */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-600 text-white rounded-lg h-11 px-6 flex items-center gap-2">
                <Plus size={18} />
                Add New Household
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900">Add New Household</DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  Register a new household in your assigned ward. All fields marked with * are required.
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="email@example.com"
                      className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
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
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                      Household Category *
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meterInstallDate" className="text-sm font-medium text-gray-700">
                      Meter Install Date *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
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
                          onSelect={(date) => handleInputChange('meterInstallDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zone" className="text-sm font-medium text-gray-700">
                      Zone *
                    </Label>
                    <Select
                      value={formData.zone}
                      onValueChange={(value) => handleInputChange('zone', value)}
                    >
                      <SelectTrigger className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500">
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Zone A">Zone A</SelectItem>
                        <SelectItem value="Zone B">Zone B</SelectItem>
                        <SelectItem value="Zone C">Zone C</SelectItem>
                        <SelectItem value="Zone D">Zone D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ward" className="text-sm font-medium text-gray-700">
                      Ward *
                    </Label>
                    <Select
                      value={formData.ward}
                      onValueChange={(value) => handleInputChange('ward', value)}
                    >
                      <SelectTrigger className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500">
                        <SelectValue placeholder="Select ward" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ward 1">Ward 1</SelectItem>
                        <SelectItem value="Ward 2">Ward 2</SelectItem>
                        <SelectItem value="Ward 3">Ward 3</SelectItem>
                        <SelectItem value="Ward 4">Ward 4</SelectItem>
                        <SelectItem value="Ward 5">Ward 5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                  disabled={!formData.fullName || !formData.meterNo || !formData.phone || !formData.address || !formData.meterInstallDate || !formData.zone || !formData.ward}
                  className="bg-primary hover:bg-primary-600 text-white rounded-lg h-10 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Household
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500" style={{ height: '44px' }}>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Edit Household Modal */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Edit Household</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Update household information. All fields marked with * are required.
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
                    Email Address
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => handleEditInputChange('email', e.target.value)}
                    placeholder="email@example.com"
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
                  <Select
                    value={editFormData.category}
                    onValueChange={(value) => handleEditInputChange('category', value)}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-zone" className="text-sm font-medium text-gray-700">
                    Zone *
                  </Label>
                  <Select
                    value={editFormData.zone}
                    onValueChange={(value) => handleEditInputChange('zone', value)}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500">
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Zone A">Zone A</SelectItem>
                      <SelectItem value="Zone B">Zone B</SelectItem>
                      <SelectItem value="Zone C">Zone C</SelectItem>
                      <SelectItem value="Zone D">Zone D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-ward" className="text-sm font-medium text-gray-700">
                    Ward *
                  </Label>
                  <Select
                    value={editFormData.ward}
                    onValueChange={(value) => handleEditInputChange('ward', value)}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500">
                      <SelectValue placeholder="Select ward" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ward 1">Ward 1</SelectItem>
                      <SelectItem value="Ward 2">Ward 2</SelectItem>
                      <SelectItem value="Ward 3">Ward 3</SelectItem>
                      <SelectItem value="Ward 4">Ward 4</SelectItem>
                      <SelectItem value="Ward 5">Ward 5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
                disabled={!editFormData.fullName || !editFormData.meterNo || !editFormData.phone || !editFormData.address || !editFormData.meterInstallDate || !editFormData.zone || !editFormData.ward}
                className="bg-primary hover:bg-primary-600 text-white rounded-lg h-10 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Registered Households</h3>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 bg-gray-50">
                <TableHead className="text-sm font-semibold text-gray-700">Full Name</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Meter No</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Phone</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Address</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Status</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHouseholds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No households found matching your search criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredHouseholds.map((household) => (
                  <TableRow key={household.id} className="border-gray-100">
                  <TableCell className="text-sm font-medium text-gray-900">{household.fullName}</TableCell>
                  <TableCell className="text-sm text-gray-600">{household.meterNo}</TableCell>
                  <TableCell className="text-sm text-gray-600">{household.phone}</TableCell>
                  <TableCell className="text-sm text-gray-600">{household.address}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(household.status)}`}>
                      {household.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditClick(household)}
                      className="border-gray-300 text-gray-700 rounded-lg h-8 px-3 bg-white hover:bg-gray-50 flex items-center gap-1.5"
                    >
                      <Edit size={14} />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}


