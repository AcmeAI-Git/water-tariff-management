import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';

export function TariffAdminTariffHistory() {
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const handleReturnClick = (record: any) => {
    setSelectedRecord(record);
    setReturnDialogOpen(true);
  };

  const handleConfirmReturn = () => {
    // Handle the return action here
    console.log('Returning rule:', selectedRecord);
    setReturnDialogOpen(false);
    setSelectedRecord(null);
  };
  const historyRecords = [
    {
      id: 1,
      ruleType: 'Slab',
      details: '0-10 m³',
      newValue: '৳8.50/m³',
      effectiveFrom: '2024-01-01',
      effectiveTo: null,
      status: 'Active'
    },
    {
      id: 2,
      ruleType: 'Slab',
      details: '11-20 m³',
      newValue: '৳12.00/m³',
      effectiveFrom: '2024-01-01',
      effectiveTo: null,
      status: 'Active'
    },
    {
      id: 3,
      ruleType: 'Slab',
      details: '21-50 m³',
      newValue: '৳18.50/m³',
      effectiveFrom: '2024-01-01',
      effectiveTo: null,
      status: 'Active'
    },
    {
      id: 4,
      ruleType: 'Ward Multiplier',
      details: 'Ward 1',
      newValue: '1.00x',
      effectiveFrom: '2024-01-01',
      effectiveTo: null,
      status: 'Active'
    },
    {
      id: 5,
      ruleType: 'Ward Multiplier',
      details: 'Ward 2',
      newValue: '1.05x',
      effectiveFrom: '2024-01-01',
      effectiveTo: null,
      status: 'Active'
    },
    {
      id: 6,
      ruleType: 'Slab',
      details: '0-10 m³',
      newValue: '৳8.00/m³',
      effectiveFrom: '2023-01-01',
      effectiveTo: '2023-12-31',
      status: 'Expired'
    },
    {
      id: 7,
      ruleType: 'Ward Multiplier',
      details: 'Ward 3',
      newValue: '0.95x',
      effectiveFrom: '2024-01-01',
      effectiveTo: null,
      status: 'Active'
    },
    {
      id: 8,
      ruleType: 'Zone Category',
      details: 'Zone A',
      newValue: 'Urban High',
      effectiveFrom: '2024-01-01',
      effectiveTo: null,
      status: 'Active'
    },
    {
      id: 9,
      ruleType: 'Slab',
      details: '11-20 m³',
      newValue: '৳11.50/m³',
      effectiveFrom: '2023-01-01',
      effectiveTo: '2023-12-31',
      status: 'Expired'
    },
    {
      id: 10,
      ruleType: 'Zone Category',
      details: 'Zone B',
      newValue: 'Urban Standard',
      effectiveFrom: '2024-01-01',
      effectiveTo: null,
      status: 'Active'
    },
    {
      id: 11,
      ruleType: 'Ward Multiplier',
      details: 'Ward 4',
      newValue: '1.10x',
      effectiveFrom: '2024-01-01',
      effectiveTo: null,
      status: 'Active'
    },
    {
      id: 12,
      ruleType: 'Slab',
      details: '51+ m³',
      newValue: '৳25.00/m³',
      effectiveFrom: '2024-01-01',
      effectiveTo: null,
      status: 'Active'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700';
      case 'Expired':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-gray-900 mb-1">Tariff History</h1>
          <p className="text-sm text-gray-500">A log of all past and present tariff rules and multipliers</p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">All Tariff Changes</h3>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 bg-gray-50">
                <TableHead className="text-sm font-semibold text-gray-700">Rule Type</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Details</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">New Value</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Effective From</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Effective To</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700">Status</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyRecords.map((record) => (
                <TableRow key={record.id} className="border-gray-100">
                  <TableCell className="text-sm font-medium text-gray-900">{record.ruleType}</TableCell>
                  <TableCell className="text-sm text-gray-600">{record.details}</TableCell>
                  <TableCell className="text-sm text-gray-600">{record.newValue}</TableCell>
                  <TableCell className="text-sm text-gray-600">{record.effectiveFrom}</TableCell>
                  <TableCell className="text-sm text-gray-600">{record.effectiveTo || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button 
                      onClick={() => handleReturnClick(record)}
                      variant="outline" 
                      size="sm"
                      className="border-red-300 text-red-600 rounded-lg h-8 px-3 bg-white hover:bg-red-50 inline-flex items-center gap-1.5"
                    >
                      <RotateCcw size={14} />
                      Return
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Return Confirmation Dialog */}
      <AlertDialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-gray-900">
              Confirm Return to Active
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600">
              Are you sure you want to return this tariff rule to active status?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedRecord && (
            <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Rule Details:</div>
              <div className="text-sm text-gray-900 font-medium">
                {selectedRecord.ruleType}: {selectedRecord.details}
              </div>
              <div className="text-sm text-gray-600">
                Value: {selectedRecord.newValue}
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 rounded-lg h-10 px-4 hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReturn}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg h-10 px-4"
            >
              Confirm Return
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
