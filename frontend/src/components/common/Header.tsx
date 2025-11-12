import React from "react";

const Header: React.FC = () => {
    return (
        <header className="w-full bg-gradient-to-r from-blue-900 to-indigo-800 text-white py-6 shadow-lg border-b border-blue-800">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <h1>Header</h1>
            </div>
        </header>
    );
};

export default Header;
