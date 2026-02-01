import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { getStaticTranslation } from '../../constants/staticTranslations';

interface Multiplier {
  areaName: string;
  multiplier: string;
  city?: 'Dhaka' | 'Chittagong' | 'Khulna';
}

interface EditMultipliersModalProps {
  title?: string;
  multipliers: Multiplier[];
  onClose: () => void;
  onSave: (multipliers: Multiplier[]) => void;
}

export function EditMultipliersModal({ title, multipliers, onClose, onSave }: EditMultipliersModalProps) {
  const { language } = useLanguage();
  const t = (key: string) => getStaticTranslation(language, key);
  const modalTitle = title ?? t('modals.editMultipliers');
  const [local, setLocal] = useState<Multiplier[]>([...multipliers]);

  const update = (index: number, field: keyof Multiplier, value: string) => {
    const copy = [...local];
    copy[index] = { ...copy[index], [field]: value } as Multiplier;
    setLocal(copy);
  };

  const add = () => setLocal([...local, { areaName: `Area ${local.length + 1}`, multiplier: '' }]);
  const remove = (i: number) => setLocal(local.filter((_, idx) => idx !== i));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto flex flex-col notranslate" translate="no">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{modalTitle}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          {local.map((m, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-8">
                <Label className="text-xs">{t('modals.areaName')}</Label>
                <Input value={m.areaName} placeholder={`${t('modals.area')} ${idx + 1}`} onChange={(e) => update(idx, 'areaName', e.target.value)} />
              </div>
              <div className="col-span-4">
                <Label className="text-xs">{t('modals.multiplier')}</Label>
                <Input value={m.multiplier} onChange={(e) => update(idx, 'multiplier', e.target.value)} />
              </div>
              <div className="col-span-12 flex justify-end">
                <Button variant="outline" className="h-9" onClick={() => remove(idx)}>{t('modals.remove')}</Button>
              </div>
            </div>
          ))}

          <div>
            <Button className="bg-primary hover:bg-primary-600 text-white" onClick={add}>{t('modals.addArea')}</Button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-gray-300 text-gray-700">{t('common.cancel')}</Button>
          <Button onClick={() => onSave(local)} className="bg-primary hover:bg-primary-600 text-white">{t('common.save')}</Button>
        </div>
      </div>
    </div>
  );
}
