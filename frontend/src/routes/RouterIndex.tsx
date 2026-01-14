import { Route, Routes, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/AdminDashboard";
import MeterReaderManagement from "../pages/MeterReaderManagement";
import { AgentManagement } from "../pages/AgentManagement";
import { SystemAuditLog } from "../pages/SystemAuditLog";
import { MeterAdminDataEntry } from "../pages/MeterAdminDataEntry";
import { MeterAdminPendingSubmissions } from "../pages/MeterAdminPendingSubmissions";
import { MeterAdminSubmittedReadings } from "../pages/MeterAdminSubmittedReadings";
import TariffVisualizer from "../pages/TariffVisualizer";
import { MeterAdminMetrics } from "../pages/MeterAdminMetrics";
import { CustomerAdminCustomerManagement } from "../pages/CustomerAdminCustomerManagement";
import { CustomerAdminSubmissionHistory } from "../pages/CustomerAdminSubmissionHistory";
import { CustomerAdminMetrics } from "../pages/CustomerAdminMetrics";
import Layout from "../components/common/Layout";
import { TariffAdminMyMetrics } from '../pages/TariffAdminMyMetrics';
import { TariffAdminTariffHistory } from '../pages/TariffAdminTariffHistory';
import { TariffConfiguration } from '../pages/TariffConfiguration';
import { ZoneScoringList } from '../pages/ZoneScoringList';
import { ZoneScoringCreate } from '../pages/ZoneScoringCreate';
import { ZoneScoringView } from '../pages/ZoneScoringView';
import { LocationManagement } from '../pages/LocationManagement';
import { ApprovalQueue } from '../pages/ApprovalQueue';
import { ApprovalHistory } from '../pages/ApprovalHistory';
import { ProtectedRoute } from "../components/common/ProtectedRoute";
import CustomerDashboard from "../pages/CustomerDashboard";
import CustomerBillingHistory from "../pages/CustomerBillingHistory";
import CustomerFeedback from "../pages/CustomerFeedback";
import CustomerUsageAnalytics from "../pages/CustomerUsageAnalytics";
import { CustomerAdminBillingManagement } from "../pages/CustomerAdminBillingManagement";
import CustomerPortalLayout from "../components/common/CustomerPortalLayout";
import { CustomerProtectedRoute } from "../components/common/CustomerProtectedRoute";

const RouterIndex = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        {/* Super Admin routes - only accessible by admin role */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/agents" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AgentManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/audit" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SystemAuditLog />
            </ProtectedRoute>
          } 
        />
        
        {/* Meter Reader routes - only accessible by meter-admin role */}
        <Route 
          path="/meter-reader/entry" 
          element={
            <ProtectedRoute allowedRoles={['meter-admin']}>
              <MeterAdminDataEntry />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/meter-reader/pending" 
          element={
            <ProtectedRoute allowedRoles={['meter-admin']}>
              <MeterAdminPendingSubmissions />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/meter-reader/submitted" 
          element={
            <ProtectedRoute allowedRoles={['meter-admin']}>
              <MeterAdminSubmittedReadings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/meter-reader/visualizer" 
          element={
            <ProtectedRoute allowedRoles={['meter-admin']}>
              <TariffVisualizer />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/meter-reader/metrics" 
          element={
            <ProtectedRoute allowedRoles={['meter-admin']}>
              <MeterAdminMetrics />
            </ProtectedRoute>
          } 
        />
        
        {/* Customer Admin routes - only accessible by customer-admin role */}
        <Route 
          path="/customer-admin/customers" 
          element={
            <ProtectedRoute allowedRoles={['customer-admin']}>
              <CustomerAdminCustomerManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/customer-admin/pending" 
          element={
            <ProtectedRoute allowedRoles={['customer-admin']}>
              <CustomerAdminSubmissionHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/customer-admin/visualizer" 
          element={
            <ProtectedRoute allowedRoles={['customer-admin']}>
              <TariffVisualizer />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/customer-admin/metrics" 
          element={
            <ProtectedRoute allowedRoles={['customer-admin']}>
              <CustomerAdminMetrics />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/customer-admin/billing" 
          element={
            <ProtectedRoute allowedRoles={['customer-admin']}>
              <CustomerAdminBillingManagement />
            </ProtectedRoute>
          } 
        />
        
        {/* Tariff Admin routes - only accessible by tariff-admin role */}
        <Route 
          path="/tariff-admin/config" 
          element={
            <ProtectedRoute allowedRoles={['tariff-admin']}>
              <TariffConfiguration />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tariff-admin/history" 
          element={
            <ProtectedRoute allowedRoles={['tariff-admin']}>
              <TariffAdminTariffHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tariff-admin/visualizer" 
          element={
            <ProtectedRoute allowedRoles={['tariff-admin']}>
              <TariffVisualizer />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tariff-admin/metrics" 
          element={
            <ProtectedRoute allowedRoles={['tariff-admin']}>
              <TariffAdminMyMetrics />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tariff-admin/zone-scoring" 
          element={
            <ProtectedRoute allowedRoles={['tariff-admin']}>
              <ZoneScoringList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tariff-admin/zone-scoring/create" 
          element={
            <ProtectedRoute allowedRoles={['tariff-admin']}>
              <ZoneScoringCreate />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tariff-admin/zone-scoring/:id" 
          element={
            <ProtectedRoute allowedRoles={['tariff-admin']}>
              <ZoneScoringView />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tariff-admin/location-management" 
          element={
            <ProtectedRoute allowedRoles={['tariff-admin']}>
              <LocationManagement />
            </ProtectedRoute>
          } 
        />
        {/* Redirect old route to new route */}
        <Route 
          path="/tariff-admin/areas" 
          element={<Navigate to="/tariff-admin/location-management" replace />}
        />
        
        {/* Approval Admin routes - only accessible by approval-admin role */}
        <Route 
          path="/approval-admin/queue" 
          element={
            <ProtectedRoute allowedRoles={['approval-admin']}>
              <ApprovalQueue />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/approval-admin/history" 
          element={
            <ProtectedRoute allowedRoles={['approval-admin']}>
              <ApprovalHistory />
            </ProtectedRoute>
          } 
        />
        
        {/* General Admin routes - only accessible by general-info role */}
        <Route 
          path="/general-admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['general-info']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/general-admin/meter-readers" 
          element={
            <ProtectedRoute allowedRoles={['general-info']}>
              <MeterReaderManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/general-admin/audit" 
          element={
            <ProtectedRoute allowedRoles={['general-info']}>
              <SystemAuditLog />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<div>Path not found</div>} />
      </Route>

      {/* Customer Portal routes */}
      <Route element={<CustomerPortalLayout />}>
        <Route 
          path="/customer/dashboard" 
          element={
            <CustomerProtectedRoute>
              <CustomerDashboard />
            </CustomerProtectedRoute>
          } 
        />
        <Route 
          path="/customer/billing" 
          element={
            <CustomerProtectedRoute>
              <CustomerBillingHistory />
            </CustomerProtectedRoute>
          } 
        />
        <Route 
          path="/customer/visualizer" 
          element={
            <CustomerProtectedRoute>
              <TariffVisualizer />
            </CustomerProtectedRoute>
          } 
        />
        <Route 
          path="/customer/analytics" 
          element={
            <CustomerProtectedRoute>
              <CustomerUsageAnalytics />
            </CustomerProtectedRoute>
          } 
        />
        <Route 
          path="/customer/feedback" 
          element={
            <CustomerProtectedRoute>
              <CustomerFeedback />
            </CustomerProtectedRoute>
          } 
        />
      </Route>
    </Routes>
  );
};

export default RouterIndex;
