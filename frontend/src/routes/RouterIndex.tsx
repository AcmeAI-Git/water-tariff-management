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
import { CustomerAdminHouseholdManagement } from "../pages/CustomerAdminHouseholdManagement";
import { CustomerAdminMetrics } from "../pages/CustomerAdminMetrics";
import Layout from "../components/common/Layout";
import { TariffAdminMyMetrics } from '../pages/TariffAdminMyMetrics';
import { TariffAdminTariffHistory } from '../pages/TariffAdminTariffHistory';
import { TariffConfiguration } from '../pages/TariffConfiguration';

const RouterIndex = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/agents" element={<AgentManagement />} />
        <Route path="/admin/audit" element={<SystemAuditLog />} />
        <Route path="/meter-admin/entry" element={<MeterAdminDataEntry />} />
        <Route path="/meter-admin/pending" element={<MeterAdminPendingSubmissions />} />
        <Route path="/meter-admin/submitted" element={<MeterAdminSubmittedReadings />} />
        <Route path="/meter-admin/visualizer" element={<TariffVisualizer />} />
        <Route path="/meter-admin/metrics" element={<MeterAdminMetrics />} />
        <Route path="/customer-admin/households" element={<CustomerAdminHouseholdManagement />} />
        <Route path="/customer-admin/visualizer" element={<TariffVisualizer />} />
        <Route path="/customer-admin/metrics" element={<CustomerAdminMetrics />} />
        {/* Tariff Admin routes */}
        <Route path="/tariff-admin/config" element={<TariffConfiguration />} />
        <Route path="/tariff-admin/history" element={<TariffAdminTariffHistory />} />
        <Route path="/tariff-admin/visualizer" element={<TariffVisualizer />} />
        <Route path="/tariff-admin/metrics" element={<TariffAdminMyMetrics />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<div>Path not found</div>} />
      </Route>
    </Routes>
  );
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route
                    path="/admin/meter-readers"
                    element={<MeterReaderManagement />}
                />
                <Route path="/admin/agents" element={<AgentManagement />} />
                <Route path="/admin/audit" element={<SystemAuditLog />} />
                <Route
                    path="/meter-admin/entry"
                    element={<MeterAdminDataEntry />}
                />
                <Route
                    path="/meter-admin/pending"
                    element={<MeterAdminPendingSubmissions />}
                />
                <Route
                    path="/meter-admin/submitted"
                    element={<MeterAdminSubmittedReadings />}
                />
                <Route
                    path="/meter-admin/visualizer"
                    element={<TariffVisualizer />}
                />
                <Route
                    path="/meter-admin/metrics"
                    element={<MeterAdminMetrics />}
                />
                <Route
                    path="/customer-admin/households"
                    element={<CustomerAdminHouseholdManagement />}
                />
                <Route
                    path="/customer-admin/visualizer"
                    element={<TariffVisualizer />}
                />
                <Route
                    path="/customer-admin/metrics"
                    element={<CustomerAdminMetrics />}
                />
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<div>Path not found</div>} />
            </Route>
        </Routes>
    );
};

export default RouterIndex;
