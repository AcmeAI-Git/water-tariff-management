import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useState } from 'react';

interface Multiplier {
  ward: string;
  multiplier: string;
  city?: 'Dhaka' | 'Chittagong' | 'Khulna';
}

interface EditMultipliersModalProps {
  title?: string;
  multipliers: Multiplier[];
  onClose: () => void;
  onSave: (multipliers: Multiplier[]) => void;
}

export function EditMultipliersModal({ title = 'Edit Multipliers', multipliers, onClose, onSave }: EditMultipliersModalProps) {
  const [selectedCity, setSelectedCity] = useState<'Dhaka' | 'Chittagong' | 'Khulna'>('Dhaka');
  const demoWards: Record<'Dhaka' | 'Chittagong' | 'Khulna', Multiplier[]> = {
    Dhaka: [
      { ward: 'Ward 1', multiplier: '1.20', city: 'Dhaka' },
      { ward: 'Ward 2', multiplier: '1.15', city: 'Dhaka' },
      { ward: 'Ward 3', multiplier: '1.10', city: 'Dhaka' },
      { ward: 'Ward 4', multiplier: '1.05', city: 'Dhaka' },
      { ward: 'Ward 5', multiplier: '1.00', city: 'Dhaka' },
    ],
    Chittagong: [
      { ward: 'Ward 1', multiplier: '1.18', city: 'Chittagong' },
      { ward: 'Ward 2', multiplier: '1.12', city: 'Chittagong' },
      { ward: 'Ward 3', multiplier: '1.08', city: 'Chittagong' },
      { ward: 'Ward 4', multiplier: '1.03', city: 'Chittagong' },
      { ward: 'Ward 5', multiplier: '1.00', city: 'Chittagong' },
    ],
    Khulna: [
      { ward: 'Ward 1', multiplier: '1.10', city: 'Khulna' },
      { ward: 'Ward 2', multiplier: '1.07', city: 'Khulna' },
      { ward: 'Ward 3', multiplier: '1.04', city: 'Khulna' },
      { ward: 'Ward 4', multiplier: '1.01', city: 'Khulna' },
      { ward: 'Ward 5', multiplier: '1.00', city: 'Khulna' },
    ],
  };
  const [local, setLocal] = useState<Multiplier[]>([...multipliers]);

  const update = (index: number, field: keyof Multiplier, value: string) => {
    const copy = [...local];
    copy[index] = { ...copy[index], [field]: value } as Multiplier;
    setLocal(copy);
  };

  const add = () => setLocal([...local, { ward: `Ward ${local.length + 1}`, multiplier: '', city: selectedCity }]);
  const remove = (i: number) => setLocal(local.filter((_, idx) => idx !== i));
  const loadDemo = () => setLocal(demoWards[selectedCity]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-4 mb-2">
            <select
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value as 'Dhaka' | 'Chittagong' | 'Khulna')}
            >
              <option>Dhaka</option>
              <option>Chittagong</option>
              <option>Khulna</option>
            </select>
            <Button variant="outline" onClick={loadDemo}>Load Demo Wards</Button>
          </div>

          {local.map((m, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-8">
                <Label className="text-xs">Ward Name</Label>
                <Input value={m.ward} placeholder={`Ward ${idx + 1}`} onChange={(e) => update(idx, 'ward', e.target.value)} />
              </div>
              <div className="col-span-4">
                <Label className="text-xs">Multiplier</Label>
                <Input value={m.multiplier} onChange={(e) => update(idx, 'multiplier', e.target.value)} />
              </div>
              <div className="col-span-12 flex justify-end">
                <Button variant="outline" className="h-9" onClick={() => remove(idx)}>Remove</Button>
              </div>
            </div>
          ))}

          <div>
            <Button className="bg-primary hover:bg-primary-600 text-white" onClick={add}>+ Add Ward</Button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-gray-300 text-gray-700">Cancel</Button>
          <Button onClick={() => onSave(local)} className="bg-primary hover:bg-primary-600 text-white">Save</Button>
        </div>
      </div>
    </div>
  );
}
