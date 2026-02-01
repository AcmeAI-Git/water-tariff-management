import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getStaticTranslation } from '../constants/staticTranslations';
import { api } from '../services/api';
import { useApiQuery, useAdminId } from '../hooks/useApiQuery';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Input } from '../components/ui/input';
import { Dropdown } from '../components/ui/Dropdown';
import { Button } from '../components/ui/button';
import { Search, X } from 'lucide-react';
import type { ZoneScoringRuleSet, Consumption, User, Meter } from '../types';

interface ApprovalHistoryItem {
  id: string;
  module: string;
  title: string;
  decision: string;
  reviewedAt: number; // timestamp for sorting
  reviewedAtFormatted: string;
  recordId: number;
}

export function ApprovalHistory() {
  const { language } = useLanguage();
  const t = (key: string) => getStaticTranslation(language, key);
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [decisionFilter, setDecisionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const adminId = useAdminId();

  // Fetch ZoneScoring rulesets
  const { data: zoneScoringData = [], isLoading: zoneScoringLoading } = useApiQuery<ZoneScoringRuleSet[]>(
    ['zone-scoring'],
    () => api.zoneScoring.getAll()
  );

  // Fetch all consumptions (approved/rejected)
  const { data: allConsumptions = [], isLoading: consumptionsLoading } = useApiQuery<Consumption[]>(
    ['consumption', 'all'],
    () => api.consumption.getAll()
  );

  // Fetch all users/customers
  const { data: allUsers = [], isLoading: usersLoading } = useApiQuery<User[]>(
    ['users'],
    () => api.users.getAll()
  );

  // Fetch all admins (currently unused but kept for potential future use)
  // const { data: admins = [] } = useApiQuery<Admin[]>(
  //   ['admins'],
  //   () => api.admins.getAll()
  // );

  // Fetch all meters
  const { data: allMeters = [] } = useApiQuery<Meter[]>(
    ['meters'],
    () => api.meters.getAll()
  );

  // Filter consumptions that were approved/rejected by current admin
  const reviewedConsumptions = useMemo(() => {
    if (!adminId) return [];
    return allConsumptions.filter((c: Consumption) => {
      // Must have approvedBy matching current admin
      if (!c.approvedBy || c.approvedBy !== adminId) return false;
      
      // Must be approved or rejected (not pending)
      const approvalStatus = c.approvalStatus;
      if (!approvalStatus) return false;
      
      let statusName = '';
      if (typeof approvalStatus === 'string') {
        statusName = approvalStatus;
      } else if (typeof approvalStatus === 'object') {
        statusName = approvalStatus.statusName || approvalStatus.name || '';
      }
      
      return statusName.toLowerCase() === 'approved' || statusName.toLowerCase() === 'rejected';
    });
  }, [allConsumptions, adminId]);


  // Filter to show only reviewed rulesets (approved, rejected, published, active)
  // Note: 'published' and 'active' are considered approved states
  const reviewedRulesets = useMemo(() => {
    return (zoneScoringData as ZoneScoringRuleSet[]).filter((ruleset) => {
      const status = ruleset.status?.toLowerCase();
      return status === 'approved' || status === 'rejected' || status === 'published' || status === 'active';
    });
  }, [zoneScoringData]);

  // Map all reviewed items to display format
  const displayRequests = useMemo(() => {
    const items: ApprovalHistoryItem[] = [];

    // Add reviewed consumptions
    reviewedConsumptions.forEach((consumption: Consumption) => {
      const approvalStatus = consumption.approvalStatus;
      let statusName = '';
      if (typeof approvalStatus === 'string') {
        statusName = approvalStatus;
      } else if (typeof approvalStatus === 'object') {
        statusName = approvalStatus.statusName || approvalStatus.name || '';
      }
      
      const decision = statusName.toLowerCase() === 'approved' ? 'Approved' : 'Rejected';
      
      // Find customer for this consumption
      const customer = (allUsers as User[]).find((u: User) => {
        if (consumption.userId) {
          return u.id === consumption.userId;
        }
        if (consumption.userAccount) {
          return u.account === consumption.userAccount || String(u.account) === String(consumption.userAccount);
        }
        return false;
      });

      // Find meter number
      let meterNo = 'N/A';
      if (customer) {
        const userAccount = customer.account || consumption.userAccount;
        const userMeter = (allMeters as Meter[]).find((m: Meter) => {
          const meterAccount = (m as any).account || m.userAccount || (m as any).user_account;
          return meterAccount && userAccount && String(meterAccount) === String(userAccount);
        });
        if (userMeter?.meterNo) {
          meterNo = typeof userMeter.meterNo === 'number' ? userMeter.meterNo.toString() : String(userMeter.meterNo);
        }
      }

      const customerName = customer 
        ? (customer.fullName || (customer as any).name || 'Unknown')
        : 'Unknown Customer';
      
      const displayTitle = `Consumption: ${customerName} (Meter: ${meterNo}) - ${consumption.billMonth}`;
      
      // Use createdAt as review date (Consumption doesn't have updatedAt)
      const reviewedAt = consumption.createdAt 
        ? new Date(consumption.createdAt).getTime()
        : 0;
      
      const reviewedAtFormatted = consumption.createdAt
        ? new Date(consumption.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : 'N/A';

      items.push({
        id: `CONSUMPTION-${consumption.id}`,
        module: 'Consumption',
        title: displayTitle,
        decision,
        reviewedAt,
        reviewedAtFormatted,
        recordId: consumption.id,
      });
    });

    // Add reviewed zone scoring rulesets
    reviewedRulesets.forEach((ruleset: ZoneScoringRuleSet) => {
      const status = ruleset.status?.toLowerCase();
      // Map status to decision: published/active/approved = Approved, rejected = Rejected
      const decision = (status === 'approved' || status === 'published' || status === 'active') 
        ? 'Approved' 
        : status === 'rejected' 
        ? 'Rejected' 
        : 'Unknown';
      
      // Use updatedAt as the review date (when status was changed)
      const reviewedAt = ruleset.updatedAt ? new Date(ruleset.updatedAt).getTime() : 0;
      const reviewedAtFormatted = ruleset.updatedAt
        ? new Date(ruleset.updatedAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : 'N/A';

      // Ensure title is present and valid
      const displayTitle = ruleset.title || `Ruleset #${ruleset.id}`;

      items.push({
        id: `ZONE-SCORING-${ruleset.id}-${status}`,
        module: 'ZoneScoring',
        title: displayTitle,
        decision,
        reviewedAt,
        reviewedAtFormatted,
        recordId: ruleset.id,
      });
    });

    // Sort by review date descending (newest first)
    return items.sort((a, b) => b.reviewedAt - a.reviewedAt);
  }, [reviewedConsumptions, reviewedRulesets, allUsers, allMeters]);

  // Get unique modules for filter
  const uniqueModules = useMemo(() => {
    const modules = new Set(displayRequests.map(r => r.module));
    return Array.from(modules).sort();
  }, [displayRequests]);

  // Check if any filters are active
  const hasActiveFilters = moduleFilter !== 'all' || decisionFilter !== 'all' || searchQuery.trim() !== '';

  // Clear all filters
  const clearFilters = () => {
    setModuleFilter('all');
    setDecisionFilter('all');
    setSearchQuery('');
  };

  // Apply filters
  const filteredRequests = useMemo(() => {
    return displayRequests.filter((item) => {
      // Module filter
      if (moduleFilter !== 'all' && item.module !== moduleFilter) {
        return false;
      }

      // Decision filter
      if (decisionFilter !== 'all' && item.decision !== decisionFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          item.module?.toLowerCase().includes(query) ||
          item.title?.toLowerCase().includes(query) ||
          item.reviewedAtFormatted?.toLowerCase().includes(query);
        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
  }, [displayRequests, moduleFilter, decisionFilter, searchQuery]);

  // Calculate stats based on filtered results
  const totalReviewed = filteredRequests.length;
  const approved = filteredRequests.filter(item => item.decision === 'Approved').length;
  const rejected = filteredRequests.filter(item => item.decision === 'Rejected').length;

  if (zoneScoringLoading || consumptionsLoading || usersLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="px-4 md:px-8 py-4 md:py-6">
        {/* Header with inline stats - centered on mobile to avoid hamburger overlap */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 items-center text-center md:text-left">
            <div>
              <h1 className="text-[28px] font-semibold text-gray-900 mb-1 notranslate" translate="no">{t('pages.myApprovalHistoryTitle')}</h1>
              <p className="text-sm text-gray-500">A log of all items you have approved or rejected</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold text-gray-900">{totalReviewed}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Approved:</span>
                <span className="font-semibold text-green-600">{approved}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Rejected:</span>
                <span className="font-semibold text-red-600">{rejected}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search by title, review date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
            />
          </div>

          {/* Module Filter */}
          <div className="w-48">
            <Dropdown
              options={[
                { value: 'all', label: 'All Modules' },
                ...uniqueModules.map(module => ({ value: module, label: module }))
              ]}
              value={moduleFilter}
              onChange={setModuleFilter}
              placeholder="Filter by Module"
              className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
            />
          </div>

          {/* Decision Filter */}
          <div className="w-48">
            <Dropdown
              options={[
                { value: 'all', label: 'All Decisions' },
                { value: 'Approved', label: 'Approved' },
                { value: 'Rejected', label: 'Rejected' }
              ]}
              value={decisionFilter}
              onChange={setDecisionFilter}
              placeholder="Filter by Decision"
              className="bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="h-11 px-4 border-gray-300 hover:bg-gray-50"
            >
              <X size={16} className="mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Module</TableHead>
                <TableHead className="font-semibold text-gray-700">Title</TableHead>
                <TableHead className="font-semibold text-gray-700">My Decision</TableHead>
                <TableHead className="font-semibold text-gray-700">Reviewed At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No approval history found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((item) => (
                  <TableRow key={item.id} className="border-gray-100">
                    <TableCell className="font-medium text-gray-900">{item.module}</TableCell>
                    <TableCell className="text-gray-600">{item.title}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={
                          item.decision === 'Approved'
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50'
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50'
                        }
                      >
                        {item.decision}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">{item.reviewedAtFormatted}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
