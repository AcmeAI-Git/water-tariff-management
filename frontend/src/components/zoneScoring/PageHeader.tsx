import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string;
  backUrl?: string;
  backLabel?: string;
  showBackButton?: boolean;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  backUrl,
  backLabel = 'Back to List',
  showBackButton = true,
  children,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      {showBackButton && backUrl && (
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => navigate(backUrl)}
            className="border-gray-300 text-gray-700 rounded-lg h-10 px-4"
          >
            <ArrowLeft size={16} className="mr-2" />
            {backLabel}
          </Button>
        </div>
      )}
      <h1 className="text-[28px] font-semibold text-gray-900 mb-1">{title}</h1>
      {description && <p className="text-sm text-gray-500">{description}</p>}
      {children}
    </div>
  );
}
