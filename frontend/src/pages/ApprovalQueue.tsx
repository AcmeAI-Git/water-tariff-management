import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { ReviewChangeModal } from './ReviewChangeModal';

interface ApprovalRequest {
  id: string;
  module: string;
  requestedBy: string;
  requestDate: string;
  status: string;
  oldData: any;
  newData: any;
}

export function ApprovalQueue() {
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);

  // Mock data for approval requests
  const approvalRequests: ApprovalRequest[] = [
    {
      id: 'REQ-001',
      module: 'Household Registration',
      requestedBy: 'Rahim Ahmed',
      requestDate: '2025-11-08 14:30',
      status: 'Pending',
      oldData: null,
      newData: {
        householdId: 'HH-2891',
        ownerName: 'Fatima Begum',
        meterNumber: 'MTR-10456',
        category: 'Residential',
        address: '23/A, Block C, Dhanmondi, Dhaka',
        phone: '+880-1712-345678',
      },
    },
    {
      id: 'REQ-002',
      module: 'Tariff Configuration',
      requestedBy: 'Karim Hassan',
      requestDate: '2025-11-08 11:20',
      status: 'Pending',
      oldData: {
        slabRange: '0-10 m³',
        rate: '৳12.00',
        category: 'Residential',
      },
      newData: {
        slabRange: '0-10 m³',
        rate: '৳15.00',
        category: 'Residential',
      },
    },
    {
      id: 'REQ-003',
      module: 'Meter Reading',
      requestedBy: 'Nasrin Khan',
      requestDate: '2025-11-07 16:45',
      status: 'Pending',
      oldData: {
        meterNumber: 'MTR-10456',
        previousReading: '245',
        currentReading: '315',
        consumption: '70 m³',
      },
      newData: {
        meterNumber: 'MTR-10456',
        previousReading: '245',
        currentReading: '320',
        consumption: '75 m³',
      },
    },
    {
      id: 'REQ-004',
      module: 'Household Registration',
      requestedBy: 'Salma Akter',
      requestDate: '2025-11-07 10:15',
      status: 'Pending',
      oldData: {
        householdId: 'HH-1523',
        ownerName: 'Abdul Malik',
        category: 'Residential',
        status: 'Active',
      },
      newData: {
        householdId: 'HH-1523',
        ownerName: 'Abdul Malik',
        category: 'Commercial',
        status: 'Active',
      },
    },
    {
      id: 'REQ-005',
      module: 'Tariff Configuration',
      requestedBy: 'Karim Hassan',
      requestDate: '2025-11-06 15:30',
      status: 'Pending',
      oldData: {
        slabRange: '11-20 m³',
        rate: '৳18.00',
        category: 'Residential',
      },
      newData: {
        slabRange: '11-20 m³',
        rate: '৳20.00',
        category: 'Residential',
      },
    },
    {
      id: 'REQ-006',
      module: 'Meter Reading',
      requestedBy: 'Nasrin Khan',
      requestDate: '2025-11-06 09:20',
      status: 'Pending',
      oldData: {
        meterNumber: 'MTR-11234',
        previousReading: '180',
        currentReading: '235',
        consumption: '55 m³',
      },
      newData: {
        meterNumber: 'MTR-11234',
        previousReading: '180',
        currentReading: '240',
        consumption: '60 m³',
      },
    },
  ];

  const handleReview = (request: ApprovalRequest) => {
    setSelectedRequest(request);
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
  };

  const handleApprove = (requestId: string, comments: string) => {
    console.log('Approved:', requestId, comments);
    setSelectedRequest(null);
    // In real app, would update the backend
  };

  const handleReject = (requestId: string, comments: string) => {
    console.log('Rejected:', requestId, comments);
    setSelectedRequest(null);
    // In real app, would update the backend
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-8 py-6">
        {/* Header with inline stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-semibold text-gray-900 mb-1">Approval Queue</h1>
              <p className="text-sm text-gray-500">All pending changes from other admins</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold text-gray-900">6</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Pending:</span>
                <span className="font-semibold text-yellow-600">{approvalRequests.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Module</TableHead>
                <TableHead className="font-semibold text-gray-700">Requested By</TableHead>
                <TableHead className="font-semibold text-gray-700">Request Date</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvalRequests.map((request) => (
                <TableRow key={request.id} className="border-gray-100">
                  <TableCell className="font-medium text-gray-900">{request.module}</TableCell>
                  <TableCell className="text-gray-600">{request.requestedBy}</TableCell>
                  <TableCell className="text-gray-600">{request.requestDate}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50"
                    >
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      onClick={() => handleReview(request)}
                      className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-9 px-4 flex items-center gap-2 ml-auto"
                    >
                      <Eye size={16} />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <ReviewChangeModal
          request={selectedRequest}
          onClose={handleCloseModal}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
