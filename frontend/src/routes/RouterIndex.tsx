import { Route, Routes, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/AdminDashboard";
import UserManagement from "../pages/UserManagement";
import { AgentManagement } from "../pages/AgentManagement";
import { SystemAuditLog } from "../pages/SystemAuditLog";
import { MeterAdminDataEntry } from "../pages/MeterAdminDataEntry";
import { MeterAdminPendingSubmissions } from "../pages/MeterAdminPendingSubmissions";
import { MeterAdminSubmittedReadings } from "../pages/MeterAdminSubmittedReadings";
import TariffVisualizer from "../pages/TariffVisualizer";
import { MeterAdminMetrics } from "../pages/MeterAdminMetrics";
import { CustomerAdminHouseholdManagement } from "../pages/CustomerAdminHouseholdManagement";
import { CustomerAdminMetrics } from "../pages/CustomerAdminMetrics";
import Layout from "../components/common/Layout";
import { TariffAdminMyMetrics } from '../pages/TariffAdminMyMetrics';
import { TariffAdminTariffHistory } from '../pages/TariffAdminTariffHistory';
import { TariffConfiguration } from '../pages/TariffConfiguration';
import { ApprovalQueue } from '../pages/ApprovalQueue';
import { ApprovalHistory } from '../pages/ApprovalHistory';
import { ProtectedRoute } from "../components/common/ProtectedRoute";

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
          path="/admin/users" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
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
        
        {/* Meter Admin routes - only accessible by meter-admin role */}
        <Route 
          path="/meter-admin/entry" 
          element={
            <ProtectedRoute allowedRoles={['meter-admin']}>
              <MeterAdminDataEntry />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/meter-admin/pending" 
          element={
            <ProtectedRoute allowedRoles={['meter-admin']}>
              <MeterAdminPendingSubmissions />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/meter-admin/submitted" 
          element={
            <ProtectedRoute allowedRoles={['meter-admin']}>
              <MeterAdminSubmittedReadings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/meter-admin/visualizer" 
          element={
            <ProtectedRoute allowedRoles={['meter-admin']}>
              <TariffVisualizer />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/meter-admin/metrics" 
          element={
            <ProtectedRoute allowedRoles={['meter-admin']}>
              <MeterAdminMetrics />
            </ProtectedRoute>
          } 
        />
        
        {/* Customer Admin routes - only accessible by customer-admin role */}
        <Route 
          path="/customer-admin/households" 
          element={
            <ProtectedRoute allowedRoles={['customer-admin']}>
              <CustomerAdminHouseholdManagement />
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
        <Route 
          path="/approval-admin/audit" 
          element={
            <ProtectedRoute allowedRoles={['approval-admin']}>
              <SystemAuditLog />
            </ProtectedRoute>
          } 
        />
        
        {/* General Info Admin routes - only accessible by general-info role */}
        <Route 
          path="/general-info/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['general-info']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/general-info/users" 
          element={
            <ProtectedRoute allowedRoles={['general-info']}>
              <UserManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/general-info/audit" 
          element={
            <ProtectedRoute allowedRoles={['general-info']}>
              <SystemAuditLog />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<div>Path not found</div>} />
      </Route>
    </Routes>
  );
};

export default RouterIndex;
