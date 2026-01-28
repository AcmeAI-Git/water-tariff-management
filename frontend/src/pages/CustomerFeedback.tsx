import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dropdown } from '../components/ui/Dropdown';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

const FEEDBACK_CATEGORIES = [
  { value: 'billing', label: 'Billing Issue' },
  { value: 'service', label: 'Service Complaint' },
  { value: 'general', label: 'General Feedback' },
  { value: 'technical', label: 'Technical Issue' },
];

export default function CustomerFeedback() {
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Get logged-in customer
  const customerUserStr = localStorage.getItem('customerUser');
  const customerUser = customerUserStr ? JSON.parse(customerUserStr) : null;
  const meterNumber = customerUser?.meterNo || '';
  const inspectionCode = customerUser?.inspCode?.toString() || '';
  const waterStatus = customerUser?.waterStatus || customerUser?.status || '';
  const isMetered = waterStatus === 'Metered' || (meterNumber && meterNumber !== 'N/A' && meterNumber.trim() !== '');
  
  // Determine identifier for email
  const identifier = isMetered && meterNumber && meterNumber !== 'N/A' && meterNumber.trim() !== ''
    ? `Meter Number: ${meterNumber}` 
    : inspectionCode 
    ? `Inspection Code: ${inspectionCode}` 
    : '';

  const handleSubmit = () => {
    if (!category) {
      toast.error('Please select a category');
      return;
    }
    if (!message.trim()) {
      toast.error('Please enter your feedback message');
      return;
    }

    // Format email subject and body
    const categoryLabel = FEEDBACK_CATEGORIES.find((c) => c.value === category)?.label || category;
    const identifierLabel = isMetered && meterNumber && meterNumber !== 'N/A' && meterNumber.trim() !== ''
      ? `Meter ${meterNumber}` 
      : inspectionCode 
      ? `Inspection Code ${inspectionCode}` 
      : 'Customer Feedback';
    const subject = encodeURIComponent(`${categoryLabel} - ${identifierLabel}`);
    const body = encodeURIComponent(
      identifier ? `${identifier}\n\n${message.trim()}` : message.trim()
    );

    // Open mailto link
    const mailtoLink = `mailto:feedback@watertariff.demo?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;

    setSubmitted(true);
    toast.success('Opening email client...');
    
    // Reset form after a delay
    setTimeout(() => {
      setCategory('');
      setMessage('');
      setSubmitted(false);
    }, 2000);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">Feedback</h1>
        <p className="text-sm text-gray-500">Share your feedback or report an issue</p>
      </div>

      {/* Feedback Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <MessageSquare className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Submit Feedback</h2>
            <p className="text-sm text-gray-500">We value your input</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium text-gray-700">
              Category *
            </Label>
            <Dropdown
              options={FEEDBACK_CATEGORIES}
              value={category}
              onChange={setCategory}
              placeholder="Select a category"
              className="bg-gray-50 border-gray-300 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-gray-700">
              Message *
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe your feedback or issue in detail..."
              className="bg-gray-50 border-gray-300 rounded-lg min-h-[200px]"
              rows={8}
            />
              <p className="text-xs text-gray-500">
                {identifier 
                  ? `Your ${isMetered && meterNumber ? 'meter number' : 'inspection code'} (${isMetered && meterNumber ? meterNumber : inspectionCode}) will be automatically included in the email`
                  : 'Your account information will be included in the email'}
              </p>
          </div>

          {submitted && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              Thank you for your feedback! Your email client should open shortly.
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!category || !message.trim() || submitted}
            className="w-full bg-primary hover:bg-primary-600 text-white h-11"
          >
            <Send size={18} className="mr-2" />
            Send Feedback
          </Button>
        </div>
      </div>
    </div>
  );
}
