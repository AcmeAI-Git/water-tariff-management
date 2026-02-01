import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dropdown } from "../ui/Dropdown";
import { X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { getStaticTranslation } from "../../constants/staticTranslations";

interface MeterAdmin {
  name: string;
  email: string;
  phone: string;
  role: string;
  zone?: string;
  area?: string;
}

interface EditMeterAdminModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (admin: MeterAdmin) => void;
  admin: MeterAdmin | null;
  zoneOptions?: Array<{ value: string; label: string }>; // Zone options from API
  areaOptions?: Array<{ value: string; label: string }>; // Area options from API
}

export function EditMeterAdminModal({ open, onClose, onSave, admin, zoneOptions = [], areaOptions = [] }: EditMeterAdminModalProps) {
  const [form, setForm] = useState<MeterAdmin>({
    name: "",
    email: "",
    phone: "",
    role: "Meter Admin",
    zone: "",
    area: "",
  });

  // Update form when admin prop changes
  useEffect(() => {
    if (admin) {
      setForm(admin);
    }
  }, [admin]);

  const handleChange = (field: keyof MeterAdmin, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = () => {
    onSave(form);
    onClose();
  };

  const { language } = useLanguage();
  const t = (key: string) => getStaticTranslation(language, key);
  if (!open || !admin) return null;
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative notranslate" translate="no">
        <button className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" onClick={onClose}><X size={20} /></button>
        <h2 className="text-lg font-semibold mb-2">{t('modals.editMeterAdmin')}</h2>
        <p className="text-xs text-gray-500 mb-4">{t('modals.updateMeterAdminInfo')}</p>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">{t('pages.fullName')}</Label>
            <Input placeholder={t('pages.fullName')} value={form.name} onChange={e => handleChange("name", e.target.value)} />
          </div>
          <div>
            <Label className="text-sm">{t('modals.phoneNumber')}</Label>
            <Input placeholder={t('modals.phoneNumber')} value={form.phone} onChange={e => handleChange("phone", e.target.value)} />
          </div>
          <div className="flex gap-2">
            <div className="w-1/2">
              <Label className="text-sm">{t('pages.zone')}</Label>
              <Dropdown options={zoneOptions} value={form.zone || ""} onChange={v => handleChange("zone", v)} placeholder={t('modals.selectZone')} className="w-full" />
            </div>
            <div className="w-1/2">
              <Label className="text-sm">{t('modals.area')}</Label>
              <Dropdown options={areaOptions} value={form.area || ""} onChange={v => handleChange("area", v)} placeholder={t('modals.selectArea')} className="w-full" />
            </div>
          </div>
          <div>
            <Label className="text-sm">{t('modals.emailAddress')}</Label>
            <Input placeholder={t('modals.emailAddress')} value={form.email} onChange={e => handleChange("email", e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button className="bg-primary text-white" onClick={handleSubmit}>{t('modals.saveChanges')}</Button>
        </div>
      </div>
    </div>
  );
}
