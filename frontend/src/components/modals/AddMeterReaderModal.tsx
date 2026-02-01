import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dropdown } from "../ui/Dropdown";
import { X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { getStaticTranslation } from "../../constants/staticTranslations";

interface MeterReader {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirm: string;
  zone: string;
  area: string;
}

interface AddMeterReaderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (reader: MeterReader) => void;
  zoneOptions?: Array<{ value: string; label: string }>; // Zone options from API
  areaOptions?: Array<{ value: string; label: string }>; // Area options from API
}

export function AddMeterReaderModal({ open, onClose, onSave, zoneOptions = [], areaOptions = [] }: AddMeterReaderModalProps) {
  const [form, setForm] = useState<MeterReader>({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
    zone: "",
    area: "",
  });

  const handleChange = (field: keyof MeterReader, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = () => {
    if (form.password !== form.confirm) return;
    onSave(form);
    onClose();
  };

  const { language } = useLanguage();
  const t = (key: string) => getStaticTranslation(language, key);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative notranslate" translate="no">
        <button className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" onClick={onClose}><X size={20} /></button>
        <h2 className="text-lg font-semibold mb-2">{t('modals.addNewUser')}</h2>
        <p className="text-xs text-gray-500 mb-4">{t('modals.registerMeterAdmin')}</p>
        <div className="space-y-3">
          <Input placeholder={t('pages.fullName')} value={form.name} onChange={e => handleChange("name", e.target.value)} />
          <Input placeholder={t('modals.phoneNumber')} value={form.phone} onChange={e => handleChange("phone", e.target.value)} />
          <div className="flex gap-2">
            <Dropdown options={zoneOptions} value={form.zone} onChange={v => handleChange("zone", v)} placeholder={t('modals.selectZone')} className="w-1/2" />
            <Dropdown options={areaOptions} value={form.area} onChange={v => handleChange("area", v)} placeholder={t('modals.selectArea')} className="w-1/2" />
          </div>
          <Input placeholder={t('modals.emailAddress')} value={form.email} onChange={e => handleChange("email", e.target.value)} />
          <Input type="password" placeholder={t('modals.passwordLabel')} value={form.password} onChange={e => handleChange("password", e.target.value)} />
          <Input type="password" placeholder={t('modals.confirmPassword')} value={form.confirm} onChange={e => handleChange("confirm", e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button className="bg-primary text-white" onClick={handleSubmit}>{t('modals.addUser')}</Button>
        </div>
      </div>
    </div>
  );
}
