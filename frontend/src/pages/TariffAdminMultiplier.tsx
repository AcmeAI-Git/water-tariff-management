import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useState } from 'react';
import { EditMultipliersModal } from '../components/modals/EditMultipliersModal';

export default function TariffAdminMultiplier() {
  const [showEdit, setShowEdit] = useState(false);
  const [multipliers, setMultipliers] = useState([
    { ward: 'Ward 1 - Gulshan', multiplier: '1.2' },
    { ward: 'Ward 2 - Banani', multiplier: '1.15' },
    { ward: 'Ward 3 - Dhanmondi', multiplier: '1.1' },
    { ward: 'Ward 4 - Mirpur', multiplier: '1.0' },
    { ward: 'Ward 5 - Uttara', multiplier: '1.05' },
  ]);

  return (
    <div className="min-h-screen bg-app">
      <div className="px-8 py-6">
        <div className="mb-8">
          <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-1">Tariff Multiplier</h1>
          <p className="text-sm text-gray-500">Manage ward-based tariff multipliers</p>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Tariff Multipliers</h3>
          <Button className="bg-primary hover:bg-primary-600 text-white px-5 py-2 rounded-lg" onClick={() => setShowEdit(true)}>
            Edit Multipliers
          </Button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 bg-gray-50">
                <TableHead className="text-sm font-semibold text-gray-700">Ward Name</TableHead>
                <TableHead className="text-sm font-semibold text-gray-700 text-center">Tariff Multiplier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {multipliers.map((ward, index) => (
                <TableRow key={index} className="border-gray-100">
                  <TableCell className="text-sm text-gray-900 font-medium">{ward.ward}</TableCell>
                  <TableCell className="text-sm text-gray-600 text-center">{ward.multiplier}x</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {showEdit && (
          <EditMultipliersModal
            multipliers={multipliers}
            onClose={() => setShowEdit(false)}
            onSave={(newMult) => {
              setMultipliers(newMult);
              setShowEdit(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
