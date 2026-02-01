import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dropdown } from "../ui/Dropdown";
import { X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { getStaticTranslation } from "../../constants/staticTranslations";

interface Agent {
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface EditAgentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (agent: Agent) => void;
  agent: Agent | null;
}

export function EditAgentModal({ open, onClose, onSave, agent }: EditAgentModalProps) {
  const [form, setForm] = useState<Agent>(agent || {
    name: "",
    email: "",
    phone: "",
    role: "TariffAdmin",
  });

  const handleChange = (field: keyof Agent, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = () => {
    onSave(form);
    onClose();
  };

  const { language } = useLanguage();
  const t = (key: string) => getStaticTranslation(language, key);
  if (!open || !agent) return null;
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative notranslate" translate="no">
        <button className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" onClick={onClose}><X size={20} /></button>
        <h2 className="text-lg font-semibold mb-2">{t('modals.editAgent')}</h2>
        <p className="text-xs text-gray-500 mb-4">{t('modals.updateAdminInfo')}</p>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">{t('pages.fullName')}</Label>
            <Input placeholder={t('pages.fullName')} value={form.name} onChange={e => handleChange("name", e.target.value)} />
          </div>
          <div>
            <Label className="text-sm">{t('modals.emailAddress')}</Label>
            <Input placeholder={t('modals.emailAddress')} value={form.email} onChange={e => handleChange("email", e.target.value)} />
          </div>
          <div>
            <Label className="text-sm">{t('common.role')}</Label>
            <Dropdown 
              options={[
                {value:"Super Admin",label:"Super Admin"},
                {value:"TariffAdmin",label:"Tariff Admin"},
                {value:"CustomerAdmin",label:"Customer Admin"}
              ]} 
              value={form.role} 
              onChange={v => handleChange("role", v)} 
              placeholder={t('modals.selectRole')} 
              className="w-full" 
            />
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
