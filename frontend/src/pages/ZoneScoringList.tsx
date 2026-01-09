import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/zoneScoring/StatusBadge';
import { DeleteConfirmationDialog } from '../components/zoneScoring/DeleteConfirmationDialog';
import { PageHeader } from '../components/zoneScoring/PageHeader';
import { EmptyState } from '../components/zoneScoring/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import type { ZoneScoringRuleSet } from '../types';

export function ZoneScoringList() {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rulesetToDelete, setRulesetToDelete] = useState<ZoneScoringRuleSet | null>(null);

  const { data: zoneScoringData, isLoading } = useApiQuery<ZoneScoringRuleSet[]>(
    ['zone-scoring'],
    () => api.zoneScoring.getAll()
  );
  const zoneScoringRuleSets: ZoneScoringRuleSet[] = (zoneScoringData ?? []) as ZoneScoringRuleSet[];

  const deleteZoneScoringMutation = useApiMutation(
    (id: number) => api.zoneScoring.delete(id),
    {
      successMessage: 'Zone scoring rule set deleted successfully',
      errorMessage: 'Failed to delete zone scoring rule set',
      invalidateQueries: [['zone-scoring']],
    }
  );

  const updateZoneScoringMutation = useApiMutation(
    ({ id, data }: { id: number; data: Parameters<typeof api.zoneScoring.update>[1] }) => api.zoneScoring.update(id, data),
    {
      successMessage: 'Ruleset updated successfully',
      errorMessage: 'Failed to update ruleset',
      invalidateQueries: [['zone-scoring']],
    }
  );

  // Get approved ruleset (this is the active one)
  const approvedRuleset = useMemo(() => {
    return zoneScoringRuleSets.find(rs => rs.status === 'approved') || null;
  }, [zoneScoringRuleSets]);

  const handleSetApprovedRuleset = async (rulesetId: string) => {
    const selectedId = parseInt(rulesetId);
    if (isNaN(selectedId)) return;

    // Don't do anything if selecting the same approved ruleset
    if (approvedRuleset?.id === selectedId) return;

    try {
      // Set all other approved rulesets to draft
      const otherApprovedRulesets = zoneScoringRuleSets.filter(
        rs => rs.id !== selectedId && rs.status === 'approved'
      );
      
      // Use mutations for all updates to ensure proper error handling
      for (const otherRuleset of otherApprovedRulesets) {
        await updateZoneScoringMutation.mutateAsync({
          id: otherRuleset.id,
          data: {
            status: 'draft'
          },
        });
      }

      // Set the selected ruleset to approved
      await updateZoneScoringMutation.mutateAsync({
        id: selectedId,
        data: {
          status: 'approved'
        },
      });
    } catch (error) {
      console.error('Error setting approved ruleset:', error);
      alert('Failed to update approved ruleset. Please try again.');
    }
  };

  const handleDelete = (ruleset: ZoneScoringRuleSet) => {
    setRulesetToDelete(ruleset);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (rulesetToDelete) {
      await deleteZoneScoringMutation.mutateAsync(rulesetToDelete.id);
      setRulesetToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-8 py-6">
        <PageHeader
          title="Zone Scoring Rulesets"
          description="Manage zone scoring rulesets and their parameters"
          showBackButton={false}
        />

        {/* Active Ruleset Selector and Create Button */}
        <div className="mb-6 flex items-start gap-4">
          <div className="flex-1 max-w-md">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Approved Ruleset
            </Label>
            <Select 
              value={approvedRuleset?.id.toString() || ''} 
              onValueChange={handleSetApprovedRuleset}
              disabled={updateZoneScoringMutation.isPending}
            >
              <SelectTrigger className="w-full border-gray-300 rounded-lg h-11 bg-white">
                <SelectValue placeholder="Select approved ruleset" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                {zoneScoringRuleSets.map((rs) => (
                  <SelectItem 
                    key={rs.id} 
                    value={rs.id.toString()} 
                    className="bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    {rs.title} {rs.status === 'approved' && '(Approved)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Only one ruleset can be approved at a time. Selecting a new approved ruleset will set the current one to draft.
            </p>
          </div>
          <div className="pt-7">
            <Button 
              onClick={() => navigate('/tariff-admin/zone-scoring/create')}
              className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-11 px-6 flex items-center gap-2"
            >
              <Plus size={18} />
              Create New Ruleset
            </Button>
          </div>
        </div>

        {/* Rulesets Table */}
        {zoneScoringRuleSets.length === 0 ? (
          <EmptyState
            title="No zone scoring rulesets found"
            actionLabel="Create Your First Ruleset"
            onAction={() => navigate('/tariff-admin/zone-scoring/create')}
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Rulesets</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-gray-50">
                  <TableHead className="text-sm font-semibold text-gray-700">Title</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Description</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Parameters</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zoneScoringRuleSets.map((ruleset) => (
                  <TableRow key={ruleset.id} className="border-gray-100">
                    <TableCell className="text-sm font-medium text-gray-900">
                      {ruleset.title}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ruleset.status as 'draft' | 'pending' | 'approved'} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {ruleset.description || <span className="text-gray-400 italic">No description</span>}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {ruleset.scoringParams?.length || 0} parameters
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/tariff-admin/zone-scoring/${ruleset.id}`)}
                          className="border-gray-300 text-gray-700 rounded-lg h-8 px-3 bg-white hover:bg-gray-50 inline-flex items-center gap-1.5"
                        >
                          <Edit size={14} />
                          View/Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(ruleset)}
                          className="border-red-300 text-red-700 rounded-lg h-8 px-3 bg-white hover:bg-red-50 inline-flex items-center gap-1.5"
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setRulesetToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Ruleset"
          description="Are you sure you want to delete the ruleset"
          itemName={rulesetToDelete?.title}
          isPending={deleteZoneScoringMutation.isPending}
        />
      </div>
    </div>
  );
}
