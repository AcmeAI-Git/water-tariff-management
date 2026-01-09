import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useState } from 'react';
import { api } from '../services/api';
import { useApiMutation } from '../hooks/useApiQuery';
import { PageHeader } from '../components/zoneScoring/PageHeader';
import type { CreateZoneScoringRuleSetDto } from '../types';

export function ZoneScoringCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'draft' | 'inactive'>('draft');

  const createZoneScoringMutation = useApiMutation(
    (data: CreateZoneScoringRuleSetDto) => api.zoneScoring.create(data),
    {
      successMessage: 'Zone scoring rule set created successfully',
      errorMessage: 'Failed to create zone scoring rule set',
      invalidateQueries: [['zone-scoring']],
    }
  );

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Please enter a title for the ruleset');
      return;
    }

    try {
      await createZoneScoringMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        scoringParams: [],
      });
      navigate('/tariff-admin/zone-scoring');
    } catch (error) {
      console.error('Error creating ruleset:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-8 py-6">
        <PageHeader
          title="Create New Ruleset"
          description="Create a new zone scoring ruleset"
          backUrl="/tariff-admin/zone-scoring"
        />

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., DWASA Zone Scoring 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-gray-300 rounded-lg h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <textarea
                id="description"
                placeholder="Optional description for this ruleset"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] text-sm"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                Status
              </Label>
              <Select value={status} onValueChange={(value: 'active' | 'draft' | 'inactive') => setStatus(value)}>
                <SelectTrigger className="w-full border-gray-300 rounded-lg h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => navigate('/tariff-admin/zone-scoring')}
              className="border-gray-300 text-gray-700 rounded-lg h-10 px-6 bg-white hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createZoneScoringMutation.isPending || !title.trim()}
              className="bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-10 px-6 disabled:opacity-50"
            >
              {createZoneScoringMutation.isPending ? 'Creating...' : 'Create Ruleset'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
