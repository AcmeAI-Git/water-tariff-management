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
  wasa?: string;
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
  wasaOptions?: Array<{ value: string; label: string }>; // City Corporation options from API
  zoneOptions?: Array<{ value: string; label: string }>; // Zone options from API
  wardOptions?: Array<{ value: string; label: string }>; // Ward options from API
  roleOptions?: Array<{ value: string; label: string }>; // Role options from API
  modalTitle?: string; // Custom modal title (defaults to "Add New Agent" or "Edit Agent")
  submitButtonText?: string; // Custom submit button text (defaults to "Add Agent" or "Save Changes")
  showWasa?: boolean; // Show city corporation field (default false)
  showZoneWard?: boolean; // Show zone/ward fields (default false)
  zoneWardAsNumbers?: boolean; // Use number inputs instead of dropdowns (default false)
}

export function AddAgentModal({ open, onClose, onSave, editMode = false, agent = null, roleFixed, onDelete, wasaOptions = [], zoneOptions = [], wardOptions = [], roleOptions = [], modalTitle, submitButtonText, showWasa = false, showZoneWard = false, zoneWardAsNumbers = false }: AddAgentModalProps) {
  const [form, setForm] = useState<Agent>({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
    wasa: "",
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
        wasa: "",
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
    // Validate required fields (trim whitespace and check for empty)
    const trimmedName = form.name?.trim();
    const trimmedEmail = form.email?.trim();
    const trimmedPhone = form.phone?.trim();
    
    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      return; // Don't submit if required fields are missing
    }
    if (!editMode) {
      if (form.password !== form.confirm) return;
      if (!form.password || form.password.length < 6) return;
    }
    // Send trimmed values
    onSave({
      ...form,
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
    });
    onClose();
  };

  // Check if form is valid for submit button
  const isFormValid = () => {
    const trimmedName = form.name?.trim();
    const trimmedEmail = form.email?.trim();
    const trimmedPhone = form.phone?.trim();
    
    if (!trimmedName || !trimmedEmail || !trimmedPhone) return false;
    if (!editMode) {
      if (!form.password || form.password.length < 6 || form.password !== form.confirm) return false;
    }
    return true;
  };

  if (!open) return null;
  
  const defaultModalTitle = editMode ? "Edit Agent" : "Add New Agent";
  const finalModalTitle = modalTitle || defaultModalTitle;
  const modalDescription = editMode ? "Update admin information" : "Register a new admin";
  const defaultSubmitButtonText = editMode ? "Save Changes" : "Add Agent";
  const finalSubmitButtonText = submitButtonText || defaultSubmitButtonText;
  
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{finalModalTitle}</h2>
            </div>
            <button 
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors" 
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 py-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Role Selection - At the Top */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 block">
                Role <span className="text-red-500">*</span>
              </label>
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
            </div>

            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="pb-2 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Personal Information</h3>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    placeholder="Enter full name" 
                    value={form.name} 
                    onChange={e => handleChange("name", e.target.value)} 
                    required 
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    type="email" 
                    placeholder="Enter email address" 
                    value={form.email} 
                    onChange={e => handleChange("email", e.target.value)} 
                    required 
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    placeholder="Enter phone number" 
                    value={form.phone || ""} 
                    onChange={e => handleChange("phone", e.target.value)} 
                    required 
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Location Information Section */}
            {(showWasa || showZoneWard) && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800">Location Information</h3>
                </div>
                <div className="space-y-3">
                  {showWasa && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        City Corporation
                      </label>
                      <Dropdown 
                        options={wasaOptions} 
                        value={form.wasa || ""} 
                        onChange={v => handleChange("wasa", v)} 
                        placeholder="Select City Corporation" 
                        className="w-full" 
                      />
                    </div>
                  )}
                  {showZoneWard && (
                    <div className="grid grid-cols-2 gap-3">
                      {zoneWardAsNumbers ? (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Zone ID</label>
                            <Input 
                              type="number" 
                              placeholder="Zone ID" 
                              value={form.zone || ""} 
                              onChange={e => handleChange("zone", e.target.value)} 
                              className="w-full" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Ward ID</label>
                            <Input 
                              type="number" 
                              placeholder="Ward ID" 
                              value={form.ward || ""} 
                              onChange={e => handleChange("ward", e.target.value)} 
                              className="w-full" 
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Zone</label>
                            <Dropdown 
                              options={zoneOptions} 
                              value={form.zone || ""} 
                              onChange={v => handleChange("zone", v)} 
                              placeholder="Select zone" 
                              className="w-full" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Ward</label>
                            <Dropdown 
                              options={wardOptions} 
                              value={form.ward || ""} 
                              onChange={v => handleChange("ward", v)} 
                              placeholder="Select ward" 
                              className="w-full" 
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security Section - Only in Add Mode */}
            {!editMode && (
              <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Password <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 font-normal ml-1">(min 6 characters)</span>
                    </label>
                    <Input 
                      type="password" 
                      placeholder="Enter password" 
                      value={form.password || ""} 
                      onChange={e => handleChange("password", e.target.value)} 
                      required 
                      minLength={6} 
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      type="password" 
                      placeholder="Confirm password" 
                      value={form.confirm || ""} 
                      onChange={e => handleChange("confirm", e.target.value)} 
                      required 
                      className="w-full"
                    />
                  </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <div className="flex justify-between gap-3">
            {editMode && onDelete && (
              <Button 
                variant="outline" 
                onClick={onDelete}
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              >
                Remove
              </Button>
            )}
            <div className={`flex gap-3 ${editMode && onDelete ? 'ml-auto' : 'w-full justify-end'}`}>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="min-w-[100px]"
              >
                Cancel
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] shadow-sm" 
                onClick={handleSubmit}
                disabled={!isFormValid()}
              >
                {finalSubmitButtonText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
