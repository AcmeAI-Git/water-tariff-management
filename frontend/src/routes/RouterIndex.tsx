import { Route, Routes, Navigate } from "react-router";
import Login from "../pages/Login";
import Layout from "../components/common/Layout";

const RouterIndex = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
                <Layout>
                    <Routes>
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="*" element={<div>Path not found</div>} />
                    </Routes>
                </Layout>
            } />
        </Routes>
    );
};

export default RouterIndex;
