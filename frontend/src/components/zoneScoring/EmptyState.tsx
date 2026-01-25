import { Button } from '../ui/button';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  showAction?: boolean;
  children?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel = 'Create New',
  onAction,
  showAction = true,
  children,
}: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <p className="text-gray-500 mb-4">{title}</p>
      {description && <p className="text-sm text-gray-400 mb-4">{description}</p>}
      {showAction && onAction && (
        <Button
          onClick={onAction}
          className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-11 px-6 flex items-center gap-2 mx-auto"
        >
          <Plus size={18} />
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
