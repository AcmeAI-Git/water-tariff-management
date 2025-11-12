import { Route, Routes } from "react-router";
import Home from "../pages/Home";
import Layout from "../components/common/Layout";

const RouterIndex = () => {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="*" element={<div>Path not found</div>} />
            </Routes>
        </Layout>
    );
};

export default RouterIndex;
