import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Edit, Trash2 } from 'lucide-react';
import type { ScoringParam, Zone, CityCorporation } from '../../../types';

interface ScoringParametersTableProps {
  calculatedParams: ScoringParam[];
  onEditParam: (param: ScoringParam) => void;
  onRemoveParam?: (paramId: number) => void;
  zones?: Zone[];
  cityCorporations?: CityCorporation[];
}

export function ScoringParametersTable({ calculatedParams, onEditParam, onRemoveParam, zones = [], cityCorporations = [] }: ScoringParametersTableProps) {
  // Helper function to format percentage display
  const formatPercentage = (percentage: string): string => {
    // If there's only one parameter, percentages are meaningless (would be 100%)
    if (calculatedParams.length <= 1) return '-';
    return `${percentage}%`;
  };

  // Helper function to format geoMean display
  const formatGeoMean = (geoMean: string): string => {
    // If there's only one parameter, geoMean is meaningless
    if (calculatedParams.length <= 1) return '-';
    return geoMean;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-gray-200 bg-gray-50">
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Area Name</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Zone</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">City Corporation</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Land+Home Rate<br/>(BDT/sqm)</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">% of Land+Home</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Land Rate<br/>(BDT/sqm)</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">% of Land Rate</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Land Tax Rate<br/>(BDT/sqm)</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">% of Land Tax</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Building Tax<br/>(≤120sqm)</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">% Building Tax<br/>(≤120sqm)</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Building Tax<br/>(≤200sqm)</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">% Building Tax<br/>(≤200sqm)</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Building Tax<br/>(&gt;200sqm)</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">% Building Tax<br/>(&gt;200sqm)</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">High Income<br/>Count</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">% High Income</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">GeoMean</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Zone Score</TableHead>
          <TableHead className="text-sm font-semibold text-gray-700 text-center whitespace-nowrap">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {calculatedParams.map((param, index) => {
          // Calculate zone score: 1 + (% of Zonal Average of Geomeans - average) / average
          const geoMeanValue = parseFloat(param.geoMean) || 0;
          const avgGeoMean = calculatedParams.length > 1 
            ? calculatedParams.reduce((sum, p) => sum + (parseFloat(p.geoMean) || 0), 0) / calculatedParams.length 
            : 0;
          const zoneScore = calculatedParams.length > 1 && avgGeoMean > 0 
            ? (1 + (geoMeanValue - avgGeoMean) / avgGeoMean).toFixed(6) 
            : '-';
          
          // Get zone and city corporation info
          const zone = param.area?.zoneId ? zones.find(z => z.id === param.area.zoneId) : null;
          const cityCorp = zone?.cityCorporationId ? cityCorporations.find(cc => cc.id === zone.cityCorporationId) : null;
          
          // Alternate row background colors for better readability
          const rowBgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
          
          return (
            <TableRow key={param.id} className={`border-gray-100 ${rowBgClass} hover:bg-gray-100`}>
              <TableCell className="text-sm font-medium text-gray-900 whitespace-nowrap">
                {param.area?.name || `Area ${param.areaId}`}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {zone?.name || '-'}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {cityCorp?.name || '-'}
              </TableCell>
              <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                {param.landHomeRate}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {formatPercentage(param.landHomeRatePercentage)}
              </TableCell>
              <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                {param.landRate}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {formatPercentage(param.landRatePercentage)}
              </TableCell>
              <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                {param.landTaxRate}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {formatPercentage(param.landTaxRatePercentage)}
              </TableCell>
              <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                {param.buildingTaxRateUpto120sqm}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {formatPercentage(param.buildingTaxRateUpto120sqmPercentage)}
              </TableCell>
              <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                {param.buildingTaxRateUpto200sqm}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {formatPercentage(param.buildingTaxRateUpto200sqmPercentage)}
              </TableCell>
              <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                {param.buildingTaxRateAbove200sqm}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {formatPercentage(param.buildingTaxRateAbove200sqmPercentage)}
              </TableCell>
              <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                {param.highIncomeGroupConnectionPercentage}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {formatPercentage(param.highIncomeGroupConnectionPercentage)}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {formatGeoMean(param.geoMean)}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {zoneScore}
              </TableCell>
              <TableCell className="text-center whitespace-nowrap">
                <div className="flex items-center justify-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEditParam(param)}
                    className="border-gray-300 text-gray-700 rounded-lg h-8 px-3 bg-white hover:bg-gray-50 inline-flex items-center gap-1.5"
                  >
                    <Edit size={14} />
                    Edit
                  </Button>
                  {onRemoveParam && calculatedParams.length > 1 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onRemoveParam(param.id)}
                      className="border-red-300 text-red-700 rounded-lg h-8 px-3 bg-white hover:bg-red-50 inline-flex items-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
