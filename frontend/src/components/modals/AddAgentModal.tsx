import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dropdown } from "../ui/Dropdown";
import { X } from "lucide-react";

interface Agent {
  name: string;
  phone?: string;
  email: string;
  password?: string;
  confirm?: string;
  zone?: string;
  ward?: string;
  role: string;
}

interface AddAgentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (agent: Agent) => void;
  editMode?: boolean;
  agent?: Agent | null;
  roleFixed?: string; // For locking role to specific value (e.g., "Meter Admin")
  onDelete?: () => void; // Optional delete handler for edit mode
  zoneOptions?: Array<{ value: string; label: string }>; // Zone options from API
  wardOptions?: Array<{ value: string; label: string }>; // Ward options from API
  roleOptions?: Array<{ value: string; label: string }>; // Role options from API
  modalTitle?: string; // Custom modal title (defaults to "Add New Agent" or "Edit Agent")
  submitButtonText?: string; // Custom submit button text (defaults to "Add Agent" or "Save Changes")
  showZoneWard?: boolean; // Show zone/ward fields (default false)
  zoneWardAsNumbers?: boolean; // Use number inputs instead of dropdowns (default false)
}

export function AddAgentModal({ open, onClose, onSave, editMode = false, agent = null, roleFixed, onDelete, zoneOptions = [], wardOptions = [], roleOptions = [], modalTitle, submitButtonText, showZoneWard = false, zoneWardAsNumbers = false }: AddAgentModalProps) {
  const [form, setForm] = useState<Agent>({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
    zone: "",
    ward: "",
    role: roleFixed || "Super Admin",
  });

  // Update form when in edit mode and agent changes
  useEffect(() => {
    if (editMode && agent) {
      setForm({
        ...agent,
        password: "",
        confirm: "",
      });
    } else if (!editMode) {
      // Reset form for add mode
      setForm({
        name: "",
        phone: "",
        email: "",
        password: "",
        confirm: "",
        zone: "",
        ward: "",
        role: roleFixed || "Super Admin",
      });
    }
  }, [editMode, agent, roleFixed]);

  const handleChange = (field: keyof Agent, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = () => {
    if (!editMode && form.password !== form.confirm) return;
    onSave(form);
    onClose();
  };

  if (!open) return null;
  
  const defaultModalTitle = editMode ? "Edit Agent" : "Add New Agent";
  const finalModalTitle = modalTitle || defaultModalTitle;
  const modalDescription = editMode ? "Update admin information" : "Register a new admin";
  const defaultSubmitButtonText = editMode ? "Save Changes" : "Add Agent";
  const finalSubmitButtonText = submitButtonText || defaultSubmitButtonText;
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" onClick={onClose}><X size={20} /></button>
        <h2 className="text-lg font-semibold mb-2">{finalModalTitle}</h2>
        <p className="text-xs text-gray-500 mb-4">{modalDescription}</p>
        <div className="space-y-3">
          <Input placeholder="Full Name" value={form.name} onChange={e => handleChange("name", e.target.value)} />
          <Input placeholder="Phone Number" value={form.phone || ""} onChange={e => handleChange("phone", e.target.value)} />
          {showZoneWard && (
            <div className="flex gap-2">
              {zoneWardAsNumbers ? (
                <>
                  <Input 
                    type="number" 
                    placeholder="Zone ID" 
                    value={form.zone || ""} 
                    onChange={e => handleChange("zone", e.target.value)} 
                    className="w-1/2 bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500" 
                  />
                  <Input 
                    type="number" 
                    placeholder="Ward ID" 
                    value={form.ward || ""} 
                    onChange={e => handleChange("ward", e.target.value)} 
                    className="w-1/2 bg-gray-50 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500" 
                  />
                </>
              ) : (
                <>
                  <Dropdown options={zoneOptions} value={form.zone || ""} onChange={v => handleChange("zone", v)} placeholder="Select zone" className="w-1/2" />
                  <Dropdown options={wardOptions} value={form.ward || ""} onChange={v => handleChange("ward", v)} placeholder="Select ward" className="w-1/2" />
                </>
              )}
            </div>
          )}
          <Dropdown 
            options={roleOptions.length > 0 ? roleOptions : [
              {value:"Super Admin",label:"Super Admin"},
              {value:"Tariff Admin",label:"Tariff Admin"},
              {value:"Customer Admin",label:"Customer Admin"},
              {value:"Meter Admin",label:"Meter Admin"}
            ]} 
            value={form.role} 
            onChange={v => handleChange("role", v)} 
            placeholder="Select role" 
            className="w-full"
            disabled={!!roleFixed}
          />
          <Input placeholder="Email Address" value={form.email} onChange={e => handleChange("email", e.target.value)} />
          {!editMode && (
            <>
              <Input type="password" placeholder="Password" value={form.password || ""} onChange={e => handleChange("password", e.target.value)} />
              <Input type="password" placeholder="Confirm Password" value={form.confirm || ""} onChange={e => handleChange("confirm", e.target.value)} />
            </>
          )}
        </div>
        <div className="flex justify-between gap-2 mt-6">
          {editMode && onDelete && (
            <Button 
              variant="outline" 
              onClick={onDelete}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Remove
            </Button>
          )}
          <div className={`flex gap-2 ${editMode && onDelete ? 'ml-auto' : 'w-full justify-end'}`}>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="bg-primary text-white" onClick={handleSubmit}>{finalSubmitButtonText}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
