import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Edit, Trash2, Send, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { api } from '../services/api';
import { useApiQuery, useApiMutation, useAdminId } from '../hooks/useApiQuery';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/zoneScoring/StatusBadge';
import { DeleteConfirmationDialog } from '../components/zoneScoring/DeleteConfirmationDialog';
import { PageHeader } from '../components/zoneScoring/PageHeader';
import { EmptyState } from '../components/zoneScoring/EmptyState';
import type { ZoneScoringRuleSet } from '../types';

export function ZoneScoringList() {
  const navigate = useNavigate();
  const adminId = useAdminId();
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

  const sendForApprovalMutation = useApiMutation(
    async (rulesetId: number) => {
      if (!adminId) throw new Error('Admin ID not found');
      // Create approval request
      await api.approvalRequests.create({
        moduleName: 'ZoneScoring',
        recordId: rulesetId,
        requestedBy: adminId,
      });
      // Update ruleset status to pending
      await api.zoneScoring.updateStatus(rulesetId, 'pending');
    },
    {
      successMessage: 'Ruleset sent for approval successfully',
      errorMessage: 'Failed to send ruleset for approval',
      invalidateQueries: [['zone-scoring'], ['approval-requests']],
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

        {/* Create Button */}
        <div className="mb-6 flex items-start gap-4">
          <div className="flex-1"></div>
          <div>
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
                      <div className="grid grid-cols-[auto_160px_auto] items-center gap-2 mx-auto w-fit">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/tariff-admin/zone-scoring/${ruleset.id}`)}
                          className="border-gray-300 text-gray-700 rounded-lg h-8 w-8 p-0 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                          title="View/Edit"
                        >
                          <Edit size={14} />
                        </Button>
                        <div className="flex justify-center min-w-[160px]">
                          {ruleset.status === 'draft' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSendForApproval(ruleset)}
                              disabled={sendForApprovalMutation.isPending}
                              className="border-blue-300 text-blue-700 rounded-lg h-8 px-3 bg-white hover:bg-blue-50 inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                            >
                              <Send size={14} />
                              Send for Approval
                            </Button>
                          )}
                          {ruleset.status === 'pending' && (
                            <span className="text-xs text-gray-500 px-3 py-2 whitespace-nowrap">
                              Awaiting Approval
                            </span>
                          )}
                          {ruleset.status === 'approved' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSetActive(ruleset)}
                              disabled={setActiveMutation.isPending}
                              className="border-green-300 text-green-700 rounded-lg h-8 px-3 bg-white hover:bg-green-50 inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                            >
                              <CheckCircle size={14} />
                              Set as Active
                            </Button>
                          )}
                        </div>
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
