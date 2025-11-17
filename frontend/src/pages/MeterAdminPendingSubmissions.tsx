import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { X } from 'lucide-react';
import { useState } from 'react';

export function MeterAdminPendingSubmissions() {
  const [queuedReadings, setQueuedReadings] = useState([
    { id: 1, householdName: 'Ahmed Residence', meterNo: 'MTR-2024-001', reading: '245.5', month: '2025-01' },
    { id: 2, householdName: 'Rahman Villa', meterNo: 'MTR-2024-002', reading: '189.2', month: '2025-01' },
  ]);

  const removeReading = (id: number) => {
    setQueuedReadings(queuedReadings.filter(reading => reading.id !== id));
  };

  return (
    <div className="min-h-screen bg-app">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">Pending Submissions</h1>
          <p className="text-sm text-gray-500">Review and submit readings for approval</p>
        </div>

        {/* Pending Readings Table */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Readings Pending Submission</h3>
          
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-gray-50">
                  <TableHead className="text-sm font-semibold text-gray-700">Household Name</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Meter No</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Current Reading</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Bill Month</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queuedReadings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No readings in queue. Add readings from the Meter Data Entry page.
                    </TableCell>
                  </TableRow>
                ) : (
                  queuedReadings.map((reading) => (
                    <TableRow key={reading.id} className="border-gray-100">
                      <TableCell className="text-sm text-gray-900 font-medium">{reading.householdName}</TableCell>
                      <TableCell className="text-sm text-gray-600">{reading.meterNo}</TableCell>
                      <TableCell className="text-sm text-gray-600">{reading.reading} m³</TableCell>
                      <TableCell className="text-sm text-gray-600">{reading.month}</TableCell>
                      <TableCell className="text-center">
                        <Button 
                          onClick={() => removeReading(reading.id)}
                          variant="outline" 
                          className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg h-8 px-3 text-sm"
                        >
                          <X size={14} className="mr-1" />
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Final Button */}
        {queuedReadings.length > 0 && (
          <div className="flex justify-center">
            <Button className="bg-primary hover:bg-primary-600 text-white rounded-lg px-12 py-6">
              Send Batch for Approval ({queuedReadings.length} readings)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


