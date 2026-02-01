import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dropdown } from '../components/ui/Dropdown';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { getStaticTranslation } from '../constants/staticTranslations';

export default function CustomerFeedback() {
  const { language } = useLanguage();
  const t = (key: string) => getStaticTranslation(language, key);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const FEEDBACK_CATEGORIES = [
    { value: 'billing', label: t('pages.billingIssue') },
    { value: 'service', label: t('pages.serviceComplaint') },
    { value: 'general', label: t('pages.generalFeedback') },
    { value: 'technical', label: t('pages.technicalIssue') },
  ];

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
      toast.error(t('pages.pleaseSelectCategory'));
      return;
    }
    if (!message.trim()) {
      toast.error(t('pages.pleaseEnterMessage'));
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
    toast.success(t('pages.openingEmail'));
    
    // Reset form after a delay
    setTimeout(() => {
      setCategory('');
      setMessage('');
      setSubmitted(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-app">
      <div className="px-4 md:px-8 py-4 md:py-6">
        {/* Header - centered on mobile to avoid hamburger overlap */}
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1 notranslate" translate="no">{t('pages.feedbackTitle')}</h1>
          <p className="text-sm text-gray-500 notranslate" translate="no">{t('pages.feedbackSubtitle')}</p>
        </div>

        {/* Feedback Form - Admin-style card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 md:p-8 hover:border-gray-300 hover:shadow-md transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <MessageSquare className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 notranslate" translate="no">{t('pages.sendFeedback')}</h2>
            <p className="text-sm text-gray-500">We value your input</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium text-gray-700 notranslate" translate="no">
              {t('pages.selectCategory')}
            </Label>
            <Dropdown
              options={FEEDBACK_CATEGORIES}
              value={category}
              onChange={setCategory}
              placeholder={t('pages.selectCategory')}
              className="bg-gray-50 border-gray-300 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-gray-700 notranslate" translate="no">
              {t('pages.yourMessage')}
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('pages.pleaseEnterMessage')}
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
            <span className="notranslate" translate="no">{t('pages.sendFeedback')}</span>
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}
