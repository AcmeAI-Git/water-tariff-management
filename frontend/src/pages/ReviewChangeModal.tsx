import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';

interface ReviewChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: unknown;
  onApprove?: () => void;
  onReject?: () => void;
  isLoading?: boolean;
}

export function ReviewChangeModal({
  open,
  onOpenChange,
  onApprove,
  onReject,
  isLoading = false,
}: ReviewChangeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Change Request</DialogTitle>
          <DialogDescription>
            Review the requested changes before approving or rejecting.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {/* TODO: Implement review change modal content */}
          <p className="text-sm text-gray-600">Review functionality to be implemented</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          {onReject && (
            <Button variant="destructive" onClick={onReject} disabled={isLoading}>
              Reject
            </Button>
          )}
          {onApprove && (
            <Button onClick={onApprove} disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Approve'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
