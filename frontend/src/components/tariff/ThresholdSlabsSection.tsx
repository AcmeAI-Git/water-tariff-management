import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useApiQuery, useApiMutation } from '../../hooks/useApiQuery';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { DeleteConfirmationDialog } from '../zoneScoring/DeleteConfirmationDialog';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import type {
  TariffThresholdSlab,
  CreateTariffThresholdSlabDto,
  UpdateTariffThresholdSlabDto,
} from '../../types';

interface ThresholdSlabsSectionProps {
  disabled?: boolean;
}

// Very high number to represent "unlimited" instead of null (per backend requirement)
const UNLIMITED_UPPER_LIMIT = 99999999;

export function ThresholdSlabsSection({ disabled = false }: ThresholdSlabsSectionProps) {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState<TariffThresholdSlab | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slabToDelete, setSlabToDelete] = useState<TariffThresholdSlab | null>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [formData, setFormData] = useState({
    lowerLimit: '',
    upperLimit: '',
    rate: '',
    sortOrder: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: allSlabs = [], isLoading: slabsLoading } = useApiQuery<TariffThresholdSlab[]>(
    ['tariff-threshold-slabs', filterActive === undefined ? 'all' : filterActive ? 'active' : 'inactive'],
    () => api.tariffThresholdSlabs.getAll(filterActive),
    { enabled: !disabled }
  );

  // Sort by lowerLimit to ensure logical order regardless of sortOrder assignment
  // This handles cases where slabs are added out of sequence
  const filteredSlabs = useMemo(
    () => [...allSlabs].sort((a, b) => a.lowerLimit - b.lowerLimit),
    [allSlabs]
  );

  const createMutation = useApiMutation(
    (data: CreateTariffThresholdSlabDto) => api.tariffThresholdSlabs.create(data),
    {
      successMessage: 'Threshold slab created successfully',
      errorMessage: 'Failed to create threshold slab',
      invalidateQueries: [['tariff-threshold-slabs']],
      onSuccess: () => {
        setIsCreateModalOpen(false);
        resetForm();
      },
    }
  );

  const updateMutation = useApiMutation(
    ({ id, data }: { id: number; data: UpdateTariffThresholdSlabDto }) =>
      api.tariffThresholdSlabs.update(id, data),
    {
      successMessage: 'Threshold slab updated successfully',
      errorMessage: 'Failed to update threshold slab',
      invalidateQueries: [['tariff-threshold-slabs']],
      onSuccess: () => {
        setIsEditModalOpen(false);
        setEditingSlab(null);
        resetForm();
      },
    }
  );

  const deleteMutation = useApiMutation(
    (id: number) => api.tariffThresholdSlabs.delete(id),
    {
      successMessage: 'Threshold slab deleted successfully',
      errorMessage: 'Failed to delete threshold slab',
      invalidateQueries: [['tariff-threshold-slabs']],
      onSuccess: () => {
        setSlabToDelete(null);
        setDeleteDialogOpen(false);
      },
    }
  );

  const resetForm = () => {
    setFormData({
      lowerLimit: '',
      upperLimit: '',
      rate: '',
      sortOrder: '',
      isActive: true,
    });
    setFormErrors({});
  };

  // Calculate appropriate sortOrder based on lowerLimit position when not provided
  // This ensures slabs are ordered correctly even if added out of sequence
  // Returns sequential order (1, 2, 3...) based on logical position
  const getAutoSortOrder = useMemo(() => {
    return (newLowerLimit: number): number => {
      if (allSlabs.length === 0) return 1;
      
      // Sort existing slabs by lowerLimit to find insertion point
      const sortedByLowerLimit = [...allSlabs].sort((a, b) => a.lowerLimit - b.lowerLimit);
      
      // Find where the new slab should be inserted based on lowerLimit
      let insertIndex = sortedByLowerLimit.findIndex(slab => slab.lowerLimit > newLowerLimit);
      if (insertIndex === -1) {
        // New slab should be last (highest lowerLimit)
        insertIndex = sortedByLowerLimit.length;
      }
      
      // Return sequential order based on position (1-indexed)
      // If inserting at position 0, it becomes order 1
      // If inserting at position 1, it becomes order 2, etc.
      return insertIndex + 1;
    };
  }, [allSlabs]);

  // Helper function to shift sort orders when inserting/updating a slab
  const shiftSortOrders = async (targetSortOrder: number, excludeSlabId?: number): Promise<void> => {
    // Find all slabs that need to be shifted (sortOrder >= targetSortOrder, excluding the slab being edited)
    const slabsToShift = allSlabs.filter(
      slab => slab.sortOrder >= targetSortOrder && slab.id !== excludeSlabId
    );

    // Sort by current sortOrder to update them in order (prevents conflicts)
    const sortedToShift = [...slabsToShift].sort((a, b) => a.sortOrder - b.sortOrder);

    // Update each slab sequentially to increment its sortOrder by 1
    for (const slab of sortedToShift) {
      await api.tariffThresholdSlabs.update(slab.id, {
        sortOrder: slab.sortOrder + 1,
      });
    }
  };

  // Helper function to check if two ranges overlap
  const rangesOverlap = (
    lower1: number,
    upper1: number | null,
    lower2: number,
    upper2: number | null
  ): boolean => {
    // Convert null/unlimited to a very large number for comparison
    const upper1Value = upper1 === null || upper1 >= UNLIMITED_UPPER_LIMIT ? Infinity : upper1;
    const upper2Value = upper2 === null || upper2 >= UNLIMITED_UPPER_LIMIT ? Infinity : upper2;

    // Two ranges [a, b) and [c, d) overlap if max(a, c) < min(b, d)
    // But since ranges are inclusive on lower and exclusive on upper (or unlimited), we check:
    // Range 1: [lower1, upper1Value)
    // Range 2: [lower2, upper2Value)
    // They overlap if: lower1 < upper2Value && lower2 < upper1Value
    return lower1 < upper2Value && lower2 < upper1Value;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const lowerLimit = parseFloat(formData.lowerLimit);
    const upperLimit = formData.upperLimit ? parseFloat(formData.upperLimit) : UNLIMITED_UPPER_LIMIT;
    const rate = parseFloat(formData.rate);
    const sortOrder = formData.sortOrder 
      ? parseInt(formData.sortOrder, 10) 
      : getAutoSortOrder(lowerLimit);

    if (isNaN(lowerLimit) || lowerLimit < 0) errors.lowerLimit = 'Lower limit must be ≥ 0';
    if (formData.upperLimit && (isNaN(parseFloat(formData.upperLimit)) || parseFloat(formData.upperLimit) < 0))
      errors.upperLimit = 'Upper limit must be ≥ 0';
    if (upperLimit !== UNLIMITED_UPPER_LIMIT && lowerLimit >= upperLimit)
      errors.upperLimit = 'Upper limit must be greater than lower limit';
    if (isNaN(rate) || rate <= 0) errors.rate = 'Rate must be > 0';
    if (formData.sortOrder && (isNaN(parseInt(formData.sortOrder, 10)) || parseInt(formData.sortOrder, 10) < 0))
      errors.sortOrder = 'Sort order must be ≥ 0';

    // Check for duplicate sort orders - only check against ACTIVE slabs
    const existingSlabsForOrderCheck = editingSlab 
      ? allSlabs.filter(slab => slab.id !== editingSlab.id && slab.isActive)
      : allSlabs.filter(slab => slab.isActive);
    
    const duplicateOrderSlab = existingSlabsForOrderCheck.find(
      slab => slab.sortOrder === sortOrder
    );

    if (duplicateOrderSlab) {
      const slabRange = duplicateOrderSlab.upperLimit === null || duplicateOrderSlab.upperLimit >= UNLIMITED_UPPER_LIMIT
        ? `${duplicateOrderSlab.lowerLimit.toLocaleString()}+`
        : `${duplicateOrderSlab.lowerLimit.toLocaleString()}-${duplicateOrderSlab.upperLimit.toLocaleString()}`;
      errors.sortOrder = `Order ${sortOrder} is already used by active slab (${slabRange})`;
    }

    // Check for overlapping ranges - only check against ACTIVE slabs
    const newUpperLimit = upperLimit === UNLIMITED_UPPER_LIMIT ? null : upperLimit;
    const existingSlabsToCheck = editingSlab 
      ? allSlabs.filter(slab => slab.id !== editingSlab.id && slab.isActive)
      : allSlabs.filter(slab => slab.isActive);

    const overlappingSlab = existingSlabsToCheck.find(slab => {
      const slabUpperLimit = slab.upperLimit === null || slab.upperLimit >= UNLIMITED_UPPER_LIMIT 
        ? null 
        : slab.upperLimit;
      return rangesOverlap(lowerLimit, newUpperLimit, slab.lowerLimit, slabUpperLimit);
    });

    if (overlappingSlab) {
      const slabRange = overlappingSlab.upperLimit === null || overlappingSlab.upperLimit >= UNLIMITED_UPPER_LIMIT
        ? `${overlappingSlab.lowerLimit.toLocaleString()}+`
        : `${overlappingSlab.lowerLimit.toLocaleString()}-${overlappingSlab.upperLimit.toLocaleString()}`;
      errors.lowerLimit = `Range overlaps with existing active slab (${slabRange})`;
      errors.upperLimit = `Range overlaps with existing active slab (${slabRange})`;
    }

    // If trying to activate a slab, check if it would overlap with other active slabs
    if (formData.isActive && editingSlab && !editingSlab.isActive) {
      // This is activating an inactive slab - check overlaps
      const activeSlabsToCheck = allSlabs.filter(slab => slab.id !== editingSlab.id && slab.isActive);
      const wouldOverlap = activeSlabsToCheck.find(slab => {
        const slabUpperLimit = slab.upperLimit === null || slab.upperLimit >= UNLIMITED_UPPER_LIMIT 
          ? null 
          : slab.upperLimit;
        return rangesOverlap(lowerLimit, newUpperLimit, slab.lowerLimit, slabUpperLimit);
      });

      if (wouldOverlap) {
        const slabRange = wouldOverlap.upperLimit === null || wouldOverlap.upperLimit >= UNLIMITED_UPPER_LIMIT
          ? `${wouldOverlap.lowerLimit.toLocaleString()}+`
          : `${wouldOverlap.lowerLimit.toLocaleString()}-${wouldOverlap.upperLimit.toLocaleString()}`;
        errors.isActive = `Cannot activate: Range overlaps with existing active slab (${slabRange})`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    
    const lowerLimit = parseFloat(formData.lowerLimit);
    const upperLimit = formData.upperLimit ? parseFloat(formData.upperLimit) : UNLIMITED_UPPER_LIMIT;
    const rate = parseFloat(formData.rate);
    const sortOrder = formData.sortOrder 
      ? parseInt(formData.sortOrder, 10) 
      : getAutoSortOrder(lowerLimit);

    try {
      // Shift existing slabs if needed (increment sortOrder for slabs >= target)
      await shiftSortOrders(sortOrder);
      
      // Create the new slab
      await createMutation.mutateAsync({
        lowerLimit,
        // Send very high number instead of null for unlimited
        upperLimit: upperLimit === UNLIMITED_UPPER_LIMIT ? UNLIMITED_UPPER_LIMIT : upperLimit,
        rate,
        sortOrder,
        isActive: formData.isActive,
      });
    } catch (error) {
      // Error handling is done by the mutation
    }
  };

  const handleEdit = (slab: TariffThresholdSlab) => {
    setEditingSlab(slab);
    setFormData({
      lowerLimit: slab.lowerLimit.toString(),
      upperLimit: slab.upperLimit?.toString() || '',
      rate: slab.rate.toString(),
      sortOrder: slab.sortOrder.toString(),
      isActive: slab.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!validateForm() || !editingSlab) return;
    
    const lowerLimit = parseFloat(formData.lowerLimit);
    const upperLimit = formData.upperLimit ? parseFloat(formData.upperLimit) : UNLIMITED_UPPER_LIMIT;
    const rate = parseFloat(formData.rate);
    const newSortOrder = parseInt(formData.sortOrder, 10);
    const oldSortOrder = editingSlab.sortOrder;

    try {
      // If sortOrder changed, we need to handle shifting
      if (newSortOrder !== oldSortOrder) {
        // If moving to a lower sortOrder (e.g., from 3 to 1), shift slabs in between up
        if (newSortOrder < oldSortOrder) {
          const slabsToShift = allSlabs.filter(
            slab => slab.sortOrder >= newSortOrder && 
                    slab.sortOrder < oldSortOrder && 
                    slab.id !== editingSlab.id
          );
          const sortedToShift = [...slabsToShift].sort((a, b) => b.sortOrder - a.sortOrder); // Sort descending
          for (const slab of sortedToShift) {
            await api.tariffThresholdSlabs.update(slab.id, {
              sortOrder: slab.sortOrder + 1,
            });
          }
        } else {
          // If moving to a higher sortOrder (e.g., from 1 to 3), shift slabs in between down
          const slabsToShift = allSlabs.filter(
            slab => slab.sortOrder > oldSortOrder && 
                    slab.sortOrder <= newSortOrder && 
                    slab.id !== editingSlab.id
          );
          const sortedToShift = [...slabsToShift].sort((a, b) => a.sortOrder - b.sortOrder); // Sort ascending
          for (const slab of sortedToShift) {
            await api.tariffThresholdSlabs.update(slab.id, {
              sortOrder: slab.sortOrder - 1,
            });
          }
        }
      }
      
      // Update the slab
      await updateMutation.mutateAsync({
        id: editingSlab.id,
        data: {
          lowerLimit,
          // Send very high number instead of null for unlimited
          upperLimit: upperLimit === UNLIMITED_UPPER_LIMIT ? UNLIMITED_UPPER_LIMIT : upperLimit,
          rate,
          sortOrder: newSortOrder,
          isActive: formData.isActive,
        },
      });
    } catch (error) {
      // Error handling is done by the mutation
    }
  };

  const confirmDelete = async () => {
    if (slabToDelete) await deleteMutation.mutateAsync(slabToDelete.id);
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      // Delete all slabs sequentially
      for (const slab of allSlabs) {
        await api.tariffThresholdSlabs.delete(slab.id);
      }
      setDeleteAllDialogOpen(false);
      // Invalidate and refetch queries to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['tariff-threshold-slabs'] });
      await queryClient.refetchQueries({ queryKey: ['tariff-threshold-slabs'] });
    } catch (error) {
      console.error('Failed to delete all slabs:', error);
    } finally {
      setIsDeletingAll(false);
    }
  };

  if (disabled) {
    return (
      <div className="text-sm text-gray-600">
        Select <span className="font-medium text-gray-900">Threshold</span> above to manage slabs.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={filterActive === undefined ? 'default' : 'outline'}
            onClick={() => setFilterActive(undefined)}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filterActive === true ? 'default' : 'outline'}
            onClick={() => setFilterActive(true)}
            size="sm"
          >
            Active
          </Button>
          <Button
            variant={filterActive === false ? 'default' : 'outline'}
            onClick={() => setFilterActive(false)}
            size="sm"
          >
            Inactive
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setDeleteAllDialogOpen(true)}
            disabled={allSlabs.length === 0 || isDeletingAll || deleteMutation.isPending}
            variant="destructive"
            className="rounded-lg h-10 px-5 flex items-center gap-2"
          >
            <Trash2 size={18} />
            Delete All
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            disabled={createMutation.isPending}
            className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-5 flex items-center gap-2"
          >
            <Plus size={18} />
            Create New Slab
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Lower Limit (L)</TableHead>
              <TableHead>Upper Limit (L)</TableHead>
              <TableHead>Rate (per 1000L)</TableHead>
              <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slabsLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredSlabs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10">
                  <div className="flex flex-col items-center justify-center gap-2 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                    <div className="text-sm font-medium">No threshold slabs found</div>
                    <div className="text-xs text-amber-700/80">
                      Create slabs to enable threshold-based billing.
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSlabs.map((slab) => (
                <TableRow key={slab.id}>
                  <TableCell className="font-medium">
                    {slab.sortOrder}
                  </TableCell>
                  <TableCell className="font-medium">
                    {slab.lowerLimit.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {slab.upperLimit && slab.upperLimit < UNLIMITED_UPPER_LIMIT
                      ? slab.upperLimit.toLocaleString()
                      : '∞'}
                  </TableCell>
                  <TableCell>৳{slab.rate.toLocaleString()}</TableCell>
                  <TableCell className="text-center align-middle">
                    <div className="flex items-center justify-center gap-2">
                      {slab.isActive && (
                        <span className="text-xs text-gray-700 bg-gray-100 rounded-md px-2.5 py-1 whitespace-nowrap inline-flex items-center justify-center h-8 font-medium w-[135px]">
                          Active
                        </span>
                      )}
                      {!slab.isActive && (
                        <span className="text-xs text-gray-500 bg-gray-50 rounded-md px-2.5 py-1 whitespace-nowrap inline-flex items-center justify-center h-8 font-medium w-[135px] border border-gray-200">
                          Inactive
                        </span>
                      )}
                      {/* Edit button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(slab)}
                        className="border-gray-300 text-gray-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </Button>
                      {/* Delete button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSlabToDelete(slab);
                          setDeleteDialogOpen(true);
                        }}
                        className="border-red-300 text-red-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-red-50 inline-flex items-center justify-center"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Threshold Slab</DialogTitle>
            <DialogDescription>
              Define a consumption range and rate for threshold-based billing
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Active Status - Moved to top */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked === true })
                }
              />
              <div className="flex-1">
                <Label htmlFor="isActive" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Active
                </Label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enable this slab for billing calculations
                </p>
                {formErrors.isActive && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.isActive}</p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lowerLimit">Lower Limit (Liters) *</Label>
              <Input
                id="lowerLimit"
                type="number"
                value={formData.lowerLimit}
                onChange={(e) => setFormData({ ...formData, lowerLimit: e.target.value })}
                placeholder="0"
                min={0}
                step={1}
              />
              {formErrors.lowerLimit && (
                <p className="text-sm text-red-600">{formErrors.lowerLimit}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="upperLimit">Upper Limit (Liters)</Label>
              <Input
                id="upperLimit"
                type="number"
                value={formData.upperLimit}
                onChange={(e) => setFormData({ ...formData, upperLimit: e.target.value })}
                placeholder="Leave empty for unlimited"
                min={0}
                step={1}
              />
              {formErrors.upperLimit && (
                <p className="text-sm text-red-600">{formErrors.upperLimit}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rate">Rate (per 1000L) *</Label>
              <Input
                id="rate"
                type="number"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="25.00"
                min={0}
                step={0.01}
              />
              {formErrors.rate && (
                <p className="text-sm text-red-600">{formErrors.rate}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sortOrder">Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                placeholder="Auto-assigned if empty"
                min={0}
                step={1}
              />
              {formErrors.sortOrder && (
                <p className="text-sm text-red-600">{formErrors.sortOrder}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-[#4C6EF5] hover:bg-[#3B5EE5]"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Threshold Slab</DialogTitle>
            <DialogDescription>
              Update the consumption range and rate for this threshold slab
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Active Status - Moved to top */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Checkbox
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked === true })
                }
              />
              <div className="flex-1">
                <Label htmlFor="edit-isActive" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Active
                </Label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enable this slab for billing calculations
                </p>
                {formErrors.isActive && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.isActive}</p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-lowerLimit">Lower Limit (Liters) *</Label>
              <Input
                id="edit-lowerLimit"
                type="number"
                value={formData.lowerLimit}
                onChange={(e) => setFormData({ ...formData, lowerLimit: e.target.value })}
                placeholder="0"
                min={0}
                step={1}
              />
              {formErrors.lowerLimit && (
                <p className="text-sm text-red-600">{formErrors.lowerLimit}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-upperLimit">Upper Limit (Liters)</Label>
              <Input
                id="edit-upperLimit"
                type="number"
                value={formData.upperLimit}
                onChange={(e) => setFormData({ ...formData, upperLimit: e.target.value })}
                placeholder="Leave empty for unlimited"
                min={0}
                step={1}
              />
              {formErrors.upperLimit && (
                <p className="text-sm text-red-600">{formErrors.upperLimit}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-rate">Rate (per 1000L) *</Label>
              <Input
                id="edit-rate"
                type="number"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="25.00"
                min={0}
                step={0.01}
              />
              {formErrors.rate && (
                <p className="text-sm text-red-600">{formErrors.rate}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sortOrder">Order *</Label>
              <Input
                id="edit-sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                placeholder="1"
                min={0}
                step={1}
              />
              {formErrors.sortOrder && (
                <p className="text-sm text-red-600">{formErrors.sortOrder}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="bg-[#4C6EF5] hover:bg-[#3B5EE5]"
            >
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSlabToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Threshold Slab"
        description="Are you sure you want to delete"
        itemName={
          slabToDelete
            ? `slab (${slabToDelete.lowerLimit}L - ${slabToDelete.upperLimit && slabToDelete.upperLimit < UNLIMITED_UPPER_LIMIT ? `${slabToDelete.upperLimit}L` : '∞'})`
            : undefined
        }
        isPending={deleteMutation.isPending}
      />

      <DeleteConfirmationDialog
        isOpen={deleteAllDialogOpen}
        onClose={() => setDeleteAllDialogOpen(false)}
        onConfirm={handleDeleteAll}
        title="Delete All Threshold Slabs"
        description="Are you sure you want to delete all"
        itemName={`${allSlabs.length} threshold slab${allSlabs.length !== 1 ? 's' : ''}`}
        isPending={isDeletingAll}
        confirmLabel="Delete All"
      />
    </div>
  );
}
