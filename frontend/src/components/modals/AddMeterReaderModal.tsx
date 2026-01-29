import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dropdown } from "../ui/Dropdown";
import { X } from "lucide-react";

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

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" onClick={onClose}><X size={20} /></button>
        <h2 className="text-lg font-semibold mb-2">Add New User</h2>
        <p className="text-xs text-gray-500 mb-4">Register a new MeterAdmin</p>
        <div className="space-y-3">
          <Input placeholder="Full Name" value={form.name} onChange={e => handleChange("name", e.target.value)} />
          <Input placeholder="Phone Number" value={form.phone} onChange={e => handleChange("phone", e.target.value)} />
          <div className="flex gap-2">
            <Dropdown options={zoneOptions} value={form.zone} onChange={v => handleChange("zone", v)} placeholder="Select zone" className="w-1/2" />
            <Dropdown options={areaOptions} value={form.area} onChange={v => handleChange("area", v)} placeholder="Select area" className="w-1/2" />
          </div>
          <Input placeholder="Email Address" value={form.email} onChange={e => handleChange("email", e.target.value)} />
          <Input type="password" placeholder="Password" value={form.password} onChange={e => handleChange("password", e.target.value)} />
          <Input type="password" placeholder="Confirm Password" value={form.confirm} onChange={e => handleChange("confirm", e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-primary text-white" onClick={handleSubmit}>Add User</Button>
        </div>
      </div>
    </div>
  );
}
