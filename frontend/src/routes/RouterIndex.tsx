import { Route, Routes, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import SuperAdmin from "../pages/AdminDashboard";
import UserManagement from "../pages/UserManagement";
import {AgentManagement} from "../pages/AgentManagement";
import {SystemAuditLog} from "../pages/SystemAuditLog";
import Layout from "../components/common/Layout";

const RouterIndex = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/superadmin" element={<SuperAdmin />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/agents" element={<AgentManagement />} />
        <Route path="/admin/audit" element={<SystemAuditLog />} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<div>Path not found</div>} />
      </Route>
    </Routes>
  );
};

export default RouterIndex;
