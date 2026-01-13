interface StatusBadgeProps {
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'published';
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  // Normalize 'published' to 'active' for display
  const normalizedStatus = status === 'published' ? 'active' : status;
  
  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    active: 'bg-purple-100 text-purple-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[normalizedStatus]} ${className}`}>
      {normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)}
    </span>
  );
}
