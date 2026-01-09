import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Edit } from 'lucide-react';
import type { ScoringParam } from '../../../types';

interface ScoringParametersTableProps {
  calculatedParams: ScoringParam[];
  onEditParam: (param: ScoringParam) => void;
}

export function ScoringParametersTable({ calculatedParams, onEditParam }: ScoringParametersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-gray-200 bg-gray-50">
          <TableHead className="text-sm font-semibold text-gray-700 whitespace-nowrap">Area Name</TableHead>
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
        {calculatedParams.map((param) => {
          // Calculate zone score: 1 + (% of Zonal Average of Geomeans - average) / average
          const geoMeanValue = parseFloat(param.geoMean) || 0;
          const avgGeoMean = calculatedParams.length > 0 
            ? calculatedParams.reduce((sum, p) => sum + (parseFloat(p.geoMean) || 0), 0) / calculatedParams.length 
            : 0;
          const zoneScore = avgGeoMean > 0 ? (1 + (geoMeanValue - avgGeoMean) / avgGeoMean).toFixed(6) : '0';
          
          return (
            <TableRow key={param.id} className="border-gray-100">
              <TableCell className="text-sm font-medium text-gray-900 whitespace-nowrap">
                {param.area?.name || `Area ${param.areaId}`}
              </TableCell>
              <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                {param.landHomeRate}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {param.landHomeRatePercentage}%
              </TableCell>
              <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                {param.landRate}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {param.landRatePercentage}%
              </TableCell>
              <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                {param.landTaxRate}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {param.landTaxRatePercentage}%
              </TableCell>
              <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                {param.buildingTaxRateUpto120sqm}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {param.buildingTaxRateUpto120sqmPercentage}%
              </TableCell>
              <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                {param.buildingTaxRateUpto200sqm}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {param.buildingTaxRateUpto200sqmPercentage}%
              </TableCell>
              <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                {param.buildingTaxRateAbove200sqm}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {param.buildingTaxRateAbove200sqmPercentage}%
              </TableCell>
              <TableCell className="text-sm text-gray-900 whitespace-nowrap">
                {param.highIncomeGroupConnectionPercentage}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {param.highIncomeGroupConnectionPercentage}%
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {param.geoMean}
              </TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                {zoneScore}
              </TableCell>
              <TableCell className="text-center whitespace-nowrap">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onEditParam(param)}
                  className="border-gray-300 text-gray-700 rounded-lg h-8 px-3 bg-white hover:bg-gray-50 inline-flex items-center gap-1.5"
                >
                  <Edit size={14} />
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
