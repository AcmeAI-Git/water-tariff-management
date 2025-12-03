import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dropdown } from "../ui/Dropdown";
import { X } from "lucide-react";

interface Agent {
  name: string;
  email: string;
  phone?: string;
  role: string;
  zone?: string;
  ward?: string;
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
    zone: "",
    ward: "",
  });

  const handleChange = (field: keyof Agent, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = () => {
    onSave(form);
    onClose();
  };

  if (!open || !agent) return null;
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" onClick={onClose}><X size={20} /></button>
        <h2 className="text-lg font-semibold mb-2">Edit Agent</h2>
        <p className="text-xs text-gray-500 mb-4">Update admin information</p>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Full Name</Label>
            <Input placeholder="Full Name" value={form.name} onChange={e => handleChange("name", e.target.value)} />
          </div>
          <div>
            <Label className="text-sm">Email Address</Label>
            <Input placeholder="Email Address" value={form.email} onChange={e => handleChange("email", e.target.value)} />
          </div>
          <div>
            <Label className="text-sm">Role</Label>
            <Dropdown 
              options={[
                {value:"Super Admin",label:"Super Admin"},
                {value:"TariffAdmin",label:"Tariff Admin"},
                {value:"CustomerAdmin",label:"Customer Admin"}
              ]} 
              value={form.role} 
              onChange={v => handleChange("role", v)} 
              placeholder="Select role" 
              className="w-full" 
            />
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
