import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dropdown } from "../ui/Dropdown";
import { X } from "lucide-react";

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

  if (!open || !admin) return null;
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" onClick={onClose}><X size={20} /></button>
        <h2 className="text-lg font-semibold mb-2">Edit Meter Admin</h2>
        <p className="text-xs text-gray-500 mb-4">Update meter admin information</p>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Full Name</Label>
            <Input placeholder="Full Name" value={form.name} onChange={e => handleChange("name", e.target.value)} />
          </div>
          <div>
            <Label className="text-sm">Phone Number</Label>
            <Input placeholder="Phone Number" value={form.phone} onChange={e => handleChange("phone", e.target.value)} />
          </div>
          <div className="flex gap-2">
            <div className="w-1/2">
              <Label className="text-sm">Zone</Label>
              <Dropdown options={zoneOptions} value={form.zone || ""} onChange={v => handleChange("zone", v)} placeholder="Select zone" className="w-full" />
            </div>
            <div className="w-1/2">
              <Label className="text-sm">Area</Label>
              <Dropdown options={areaOptions} value={form.area || ""} onChange={v => handleChange("area", v)} placeholder="Select area" className="w-full" />
            </div>
          </div>
          <div>
            <Label className="text-sm">Email Address</Label>
            <Input placeholder="Email Address" value={form.email} onChange={e => handleChange("email", e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-primary text-white" onClick={handleSubmit}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
