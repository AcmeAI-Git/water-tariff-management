import React from "react";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Header />
            <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
