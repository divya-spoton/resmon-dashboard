import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    LayoutDashboard,
    Droplets,
    AlertTriangle,
    Settings,
    Users,
    Download,
    LogOut,
    Sun,
    Moon,
    Menu,
    X
} from 'lucide-react';

const Layout = () => {
    const { currentUser, userRole, logout, permissions } = useAuth();
    const { isDark, toggleTheme, colors } = useTheme();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'worker'] },
        { path: '/devices', icon: Droplets, label: 'Devices', roles: ['admin', 'manager', 'worker'] },
        // { path: '/alerts', icon: AlertTriangle, label: 'Alerts', roles: ['admin', 'manager', 'worker'] },
        { path: '/device-config', icon: Settings, label: 'Configuration', roles: ['admin', 'manager'] },
        { path: '/export', icon: Download, label: 'Export Data', roles: ['admin', 'manager'], permission: 'canExportData' },
        // { path: '/users', icon: Users, label: 'User Management', roles: ['admin'] }
    ];

    const filteredNavItems = navItems.filter(item => {
        if (!userRole) return false;
        if (!item.roles.includes(userRole)) return false;
        if (item.permission && (!permissions || !permissions[item.permission])) return false;
        return true;
    });


    return (
        <div className={`min-h-screen ${colors.bg}`}>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`lg:hidden fixed top-4 left-4 z-50 ${colors.cardBg} ${colors.text} p-2 rounded-lg border ${colors.cardBorder}`}
                aria-label="Toggle menu"
            >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 ${colors.cardBg} border-r ${colors.cardBorder} transform transition-transform duration-300 ease-in-out z-40
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Logo */}
                <div className={`p-6 border-b ${colors.cardBorder}`}>
                    <div className="flex items-center gap-3">
                        <Droplets className="w-8 h-8 text-cyan-600" />
                        <div>
                            <h1 className={`text-lg font-bold ${colors.text}`}>Pipeline Monitor</h1>
                            <p className={`text-xs ${colors.textSecondary}`}>v1.0</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2">
                    {filteredNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                [
                                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                                    isActive
                                        ? 'bg-cyan-600 text-white shadow-sm'
                                        : `${colors.textTertiary} ${colors.hoverBg}`
                                ].join(' ')
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User Info & Actions */}
                <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${colors.cardBorder}`}>
                    <div className={`${colors.inputBg} rounded-lg p-3 mb-3`}>
                        <p className={`text-sm ${colors.text} font-medium truncate`}>{currentUser?.email}</p>
                        <p className={`text-xs ${colors.textSecondary} capitalize mt-1`}>{userRole}</p>
                    </div>

                    <div className="flex gap-2">
                        {/* <button
                            onClick={toggleTheme}
                            className={`flex-1 flex items-center justify-center gap-2 ${colors.inputBg} border ${colors.cardBorder} ${colors.text} px-3 py-2 rounded-lg hover:opacity-80 transition-opacity`}
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button> */}

                        <button
                            onClick={handleLogout}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:ml-64 min-h-screen">
                <main className="p-6">
                    <Outlet />
                </main>
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}
        </div>
    );
};

export default Layout;