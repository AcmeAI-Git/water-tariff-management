import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Edit, Trash2, Send, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation, useAdminId } from '../hooks/useApiQuery';
import { useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/zoneScoring/StatusBadge';
import { DeleteConfirmationDialog } from '../components/zoneScoring/DeleteConfirmationDialog';
import { PageHeader } from '../components/zoneScoring/PageHeader';
import { EmptyState } from '../components/zoneScoring/EmptyState';
import type { ZoneScoringRuleSet } from '../types';

export function ZoneScoringList() {
  const navigate = useNavigate();
  const adminId = useAdminId();
  const queryClient = useQueryClient();
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
      onSuccess: async () => {
        // Wait for the query to refetch after invalidation
        const { data: updatedRulesets } = await queryClient.refetchQueries({ queryKey: ['zone-scoring'] });
        const rulesets = (updatedRulesets ?? []) as ZoneScoringRuleSet[];
        
        // Check if there's only one approved ruleset remaining
        const approvedRulesets = rulesets.filter(
          (r) => r.status === 'approved'
        );
        const activeRulesets = rulesets.filter(
          (r) => r.status === 'active' || r.status === 'published'
        );
        
        // If there's exactly one approved ruleset and no active ruleset, automatically set it to active
        if (approvedRulesets.length === 1 && activeRulesets.length === 0) {
          try {
            await setActiveMutation.mutateAsync(approvedRulesets[0].id);
          } catch (error) {
            console.error('Failed to automatically set ruleset to active:', error);
            // Don't show error toast as the deletion was successful
          }
        }
      },
    }
  );

  const sendForApprovalMutation = useApiMutation(
    async (rulesetId: number) => {
      // Update ruleset status to pending (no approval-requests API call needed)
      await api.zoneScoring.updateStatus(rulesetId, 'pending');
    },
    {
      successMessage: 'Ruleset sent for approval successfully',
      errorMessage: 'Failed to send ruleset for approval',
      invalidateQueries: [['zone-scoring']],
    }
  );

  const setActiveMutation = useApiMutation(
    async (rulesetId: number) => {
      // Use the publish endpoint to make the ruleset active
      await api.zoneScoring.publish(rulesetId);
    },
    {
      successMessage: 'Ruleset published and set as active successfully',
      errorMessage: 'Failed to publish ruleset',
      invalidateQueries: [['zone-scoring']],
    }
  );

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

  const handleSendForApproval = async (ruleset: ZoneScoringRuleSet) => {
    if (!adminId) {
      alert('Admin ID not found. Please log in again.');
      return;
    }
    await sendForApprovalMutation.mutateAsync(ruleset.id);
  };

  const handleSetActive = async (ruleset: ZoneScoringRuleSet) => {
    // Check if another ruleset is active and deactivate it first
    // This logic will be implemented when backend endpoints are ready
    await setActiveMutation.mutateAsync(ruleset.id);
  };

  // Check if there's only one approved ruleset and automatically set it to active
  useEffect(() => {
    if (!isLoading && zoneScoringRuleSets.length > 0 && !setActiveMutation.isPending) {
      const approvedRulesets = zoneScoringRuleSets.filter(
        (r) => r.status === 'approved'
      );
      const activeRulesets = zoneScoringRuleSets.filter(
        (r) => r.status === 'active' || r.status === 'published'
      );
      
      // If there's exactly one approved ruleset and no active ruleset, automatically set it to active
      if (approvedRulesets.length === 1 && activeRulesets.length === 0) {
        setActiveMutation.mutate(approvedRulesets[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneScoringRuleSets.map(r => `${r.id}-${r.status}`).join(','), isLoading, setActiveMutation.isPending]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] overflow-x-hidden w-full">
      <div className="px-4 md:px-8 py-4 md:py-6 w-full max-w-full">
        <PageHeader
          title="Zone Scoring Rulesets"
          description="Manage zone scoring rulesets and their parameters"
          showBackButton={false}
        />

        {/* Create Button */}
        <div className="mb-6">
          <Button 
            onClick={() => navigate('/tariff-admin/zone-scoring/create')}
            className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-11 px-6 flex items-center gap-2"
          >
            <Plus size={18} />
            Create New Ruleset
          </Button>
        </div>

        {/* Rulesets Table */}
        {zoneScoringRuleSets.length === 0 ? (
          <EmptyState
            title="No zone scoring rulesets found"
            actionLabel="Create Your First Ruleset"
            onAction={() => navigate('/tariff-admin/zone-scoring/create')}
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 bg-gray-50">
                    <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Title</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Description</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Parameters</TableHead>
                    <TableHead className="text-sm font-semibold text-gray-700 text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zoneScoringRuleSets.map((ruleset) => {
                    return (
                      <TableRow key={ruleset.id} className="border-gray-100">
                        <TableCell className="text-sm font-medium text-gray-900 whitespace-nowrap">
                          {ruleset.title}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          <div className="max-w-md truncate" title={ruleset.description || undefined}>
                            {ruleset.description || <span className="text-gray-400 italic">No description</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 text-center whitespace-nowrap">
                          {ruleset.scoringParams?.length || 0}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap align-middle">
                          <div className="flex items-center gap-2">
                            {/* Status indicator or action button - takes available space */}
                            <div className="flex-1 flex justify-end">
                              {(ruleset.status === 'active' || ruleset.status === 'published') && (
                                <span className="text-xs text-gray-700 bg-gray-100 rounded-md px-2.5 py-1 whitespace-nowrap inline-flex items-center h-8 font-medium">
                                  Active
                                </span>
                              )}
                              {ruleset.status === 'pending' && (
                                <span className="text-xs text-amber-700 bg-amber-100 rounded-md px-2.5 py-1 whitespace-nowrap inline-flex items-center h-8 font-medium">
                                  Awaiting Approval
                                </span>
                              )}
                              {(ruleset.status === 'draft' || ruleset.status === 'rejected') && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleSendForApproval(ruleset)}
                                  disabled={sendForApprovalMutation.isPending}
                                  className="border-blue-300 text-blue-700 rounded-lg h-8 px-3 bg-white hover:bg-blue-50 inline-flex items-center justify-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                                >
                                  <Send size={14} />
                                  Send for Approval
                                </Button>
                              )}
                              {ruleset.status === 'approved' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleSetActive(ruleset)}
                                  disabled={setActiveMutation.isPending}
                                  className="border-green-300 text-green-700 rounded-lg h-8 px-3 bg-white hover:bg-green-50 inline-flex items-center justify-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                                >
                                  <CheckCircle size={14} />
                                  Set as Active
                                </Button>
                              )}
                            </div>
                            
                            {/* Edit button - fixed position */}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/tariff-admin/zone-scoring/${ruleset.id}`)}
                              className="border-gray-300 text-gray-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                              title="View/Edit"
                            >
                              <Edit size={14} />
                            </Button>
                            
                            {/* Delete button - fixed position */}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDelete(ruleset)}
                              className="border-red-300 text-red-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-red-50 inline-flex items-center justify-center"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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
