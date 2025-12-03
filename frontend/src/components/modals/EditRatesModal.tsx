import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useState } from 'react';

interface Slab {
  range: string;
  rate: string;
}

interface EditRatesModalProps {
  title?: string;
  slabs: Slab[];
  onClose: () => void;
  onSave: (slabs: Slab[]) => void;
}

export function EditRatesModal({ title = 'Edit Rates', slabs, onClose, onSave }: EditRatesModalProps) {
  const [localSlabs, setLocalSlabs] = useState<Slab[]>([...slabs]);

  const updateRate = (index: number, value: string) => {
    const copy = [...localSlabs];
    copy[index] = { ...copy[index], rate: value };
    setLocalSlabs(copy);
  };

  const addSlab = () => {
    setLocalSlabs([...localSlabs, { range: '', rate: '' }]);
  };

  const removeSlab = (index: number) => {
    setLocalSlabs(localSlabs.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          {localSlabs.map((s, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-6">
                <Label className="text-xs">Range (m³)</Label>
                <Input value={s.range} onChange={(e) => { const copy = [...localSlabs]; copy[idx].range = e.target.value; setLocalSlabs(copy); }} />
              </div>
              <div className="col-span-4">
                <Label className="text-xs">Rate (BDT/m³)</Label>
                <Input value={s.rate} onChange={(e) => updateRate(idx, e.target.value)} />
              </div>
              <div className="col-span-2 flex items-end">
                <Button variant="outline" className="h-9 w-full" onClick={() => removeSlab(idx)}>Remove</Button>
              </div>
            </div>
          ))}

          <div>
            <Button className="bg-primary hover:bg-primary-600 text-white" onClick={addSlab}>+ Add Slab</Button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-gray-300 text-gray-700">Cancel</Button>
          <Button onClick={() => onSave(localSlabs)} className="bg-primary hover:bg-primary-600 text-white">Save</Button>
        </div>
      </div>
    </div>
  );
}
