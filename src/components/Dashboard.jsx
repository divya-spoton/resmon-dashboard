import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Battery, AlertCircle, TrendingUp, Droplets, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAuth } from '../context/AuthContext';
import { LogOut, Users as UsersIcon, Sun, Moon } from 'lucide-react';
import UserManagement from './UserManagement';
import { useTheme } from '../context/ThemeContext';

// Mock data generator - replace with actual Firebase data
const generateMockData = () => {
    const data = [];
    const devices = ['2C:CF:67:B6:DA:16', '2C:CF:67:D1:B9:FE'];

    for (let i = 0; i < 50; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        data.push({
            id: `doc_${i}`,
            device_id: devices[Math.floor(Math.random() * devices.length)],
            device_name: `Pico ${devices[Math.floor(Math.random() * devices.length)]}`,
            data_battery_percentage: 100 - Math.floor(Math.random() * 20),
            data_check_element_resistance: 80,
            data_corrosion_rate: (Math.random() * 2 + 0.5).toFixed(3),
            data_metal_loss: (Math.random() * 0.015).toFixed(6),
            data_probe_resistance: 160 + Math.random() * 30,
            data_probe_status: Math.random() > 0.3 ? 1 : 0,
            data_reference_resistance: 80,
            data_timestamp: date,
            timestamp_upload: new Date(date.getTime() + 60000)
        });
    }

    return data.sort((a, b) => b.data_timestamp - a.data_timestamp);
};

const Dashboard = () => {
    const [data] = useState(generateMockData());
    const [selectedDevice, setSelectedDevice] = useState('all');
    const [timeRange, setTimeRange] = useState('7days');
    const { currentUser, userRole, logout, permissions } = useAuth();
    const [showUserManagement, setShowUserManagement] = useState(false);
    const { isDark, toggleTheme, colors } = useTheme();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.error('Failed to logout:', err);
        }
    };

    // Get unique devices
    const devices = useMemo(() => {
        const uniqueDevices = [...new Set(data.map(d => d.device_id))];
        return uniqueDevices;
    }, [data]);

    // Filter data based on selections
    const filteredData = useMemo(() => {
        let filtered = data;

        if (selectedDevice !== 'all') {
            filtered = filtered.filter(d => d.device_id === selectedDevice);
        }

        const now = new Date();
        const cutoffDate = new Date();

        switch (timeRange) {
            case '24hours':
                cutoffDate.setHours(now.getHours() - 24);
                break;
            case '7days':
                cutoffDate.setDate(now.getDate() - 7);
                break;
            case '30days':
                cutoffDate.setDate(now.getDate() - 30);
                break;
            default:
                return filtered;
        }

        return filtered.filter(d => d.data_timestamp >= cutoffDate);
    }, [data, selectedDevice, timeRange]);

    // Calculate statistics
    const stats = useMemo(() => {
        if (filteredData.length === 0) return null;

        const avgCorrosion = (filteredData.reduce((sum, d) => sum + parseFloat(d.data_corrosion_rate), 0) / filteredData.length).toFixed(3);
        const avgMetalLoss = (filteredData.reduce((sum, d) => sum + parseFloat(d.data_metal_loss), 0) / filteredData.length).toFixed(6);
        const avgBattery = Math.round(filteredData.reduce((sum, d) => sum + d.data_battery_percentage, 0) / filteredData.length);
        const activeProbes = filteredData.filter(d => d.data_probe_status === 1).length;

        return {
            avgCorrosion,
            avgMetalLoss,
            avgBattery,
            activeProbes,
            totalReadings: filteredData.length
        };
    }, [filteredData]);

    // Prepare chart data
    const chartData = useMemo(() => {
        return filteredData.slice(0, 30).reverse().map(d => ({
            date: d.data_timestamp.toLocaleDateString(),
            corrosion: parseFloat(d.data_corrosion_rate),
            metalLoss: parseFloat(d.data_metal_loss) * 1000, // Convert to smaller unit for visibility
            resistance: d.data_probe_resistance
        }));
    }, [filteredData]);

    return (
        <div className={`min-h-screen ${colors.bg}`}>
            {/* Header */}
            <div className={`${colors.cardBg} backdrop-blur-sm border-b ${colors.cardBorder} sticky top-0 z-10`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Droplets className="w-8 h-8 text-cyan-400" />
                            <div>
                                <h1 className={`text-2xl font-bold ${colors.text}`}>Pipeline Monitoring System</h1>
                                <p className={`text-sm ${colors.textTertiary}`}>Real-time corrosion tracking &amp; analysis</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right mr-4">
                                <p className={`text-sm ${colors.text}`}>{currentUser?.email}</p>
                                <p className={`text-xs ${colors.textTertiary} capitalize`}>{userRole}</p>
                            </div>

                            {userRole === 'admin' && (
                                <button
                                    onClick={() => setShowUserManagement(!showUserManagement)}
                                    className="flex items-center gap-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-2 rounded-lg hover:bg-purple-500/30 transition-colors"
                                >
                                    <UsersIcon className="w-4 h-4" />
                                    Users
                                </button>
                            )}

                            <button
                                onClick={toggleTheme}
                                className={`flex items-center gap-2 ${colors.cardBg} ${colors.text} border ${colors.cardBorder} px-3 py-2 rounded-lg hover:opacity-80 transition-opacity`}
                            >
                                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>

                            <button
                                onClick={logout}
                                className="flex items-center gap-2 bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showUserManagement && userRole === 'admin' && (
                <div className="mb-6">
                    <UserManagement />
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="mb-6 flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Device</label>
                        <select
                            value={selectedDevice}
                            onChange={(e) => setSelectedDevice(e.target.value)}
                            className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                        >
                            <option value="all">All Devices</option>
                            {devices.map(device => (
                                <option key={device} value={device}>{device}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Time Range</label>
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                        >
                            <option value="24hours">Last 24 Hours</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                        {/* Card 1: AVG Corrosion */}
                        <div className={`${colors.cardBg} backdrop-blur-sm border ${colors.cardBorder} rounded-xl p-6`}>
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="w-5 h-5 text-cyan-400" />
                                <span className="text-xs font-medium text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded">AVG</span>
                            </div>
                            <p className={`text-2xl font-bold ${colors.text}`}>{stats.avgCorrosion}</p>
                            <p className={`text-xs ${colors.textTertiary} mt-1`}>Corrosion Rate</p>
                        </div>

                        {/* Card 2: AVG Metal Loss */}
                        <div className={`${colors.cardBg} backdrop-blur-sm border ${colors.cardBorder} rounded-xl p-6`}>
                            <div className="flex items-center justify-between mb-2">
                                <AlertCircle className="w-5 h-5 text-amber-400" />
                                <span className="text-xs font-medium text-amber-400 bg-amber-500/20 px-2 py-1 rounded">AVG</span>
                            </div>
                            <p className={`text-2xl font-bold ${colors.text}`}>{stats.avgMetalLoss}</p>
                            <p className={`text-xs ${colors.textTertiary} mt-1`}>Metal Loss (mils)</p>
                        </div>

                        {/* Card 3: Battery Level */}
                        <div className={`${colors.cardBg} backdrop-blur-sm border ${colors.cardBorder} rounded-xl p-6`}>
                            <div className="flex items-center justify-between mb-2">
                                <Battery className="w-5 h-5 text-green-400" />
                                <span className="text-xs font-medium text-green-400 bg-green-500/20 px-2 py-1 rounded">AVG</span>
                            </div>
                            <p className={`text-2xl font-bold ${colors.text}`}>{stats.avgBattery}%</p>
                            <p className={`text-xs ${colors.textTertiary} mt-1`}>Battery Level</p>
                        </div>

                        {/* Card 4: Active Probes */}
                        <div className={`${colors.cardBg} backdrop-blur-sm border ${colors.cardBorder} rounded-xl p-6`}>
                            <div className="flex items-center justify-between mb-2">
                                <Activity className="w-5 h-5 text-blue-400" />
                                <span className="text-xs font-medium text-blue-400 bg-blue-500/20 px-2 py-1 rounded">ACTIVE</span>
                            </div>
                            <p className={`text-2xl font-bold ${colors.text}`}>{stats.activeProbes}</p>
                            <p className={`text-xs ${colors.textTertiary} mt-1`}>Active Probes</p>
                        </div>

                        {/* Card 5: Total Data Points */}
                        <div className={`${colors.cardBg} backdrop-blur-sm border ${colors.cardBorder} rounded-xl p-6`}>
                            <div className="flex items-center justify-between mb-2">
                                <Calendar className="w-5 h-5 text-purple-400" />
                                <span className="text-xs font-medium text-purple-400 bg-purple-500/20 px-2 py-1 rounded">TOTAL</span>
                            </div>
                            <p className={`text-2xl font-bold ${colors.text}`}>{stats.totalReadings}</p>
                            <p className={`text-xs ${colors.textTertiary} mt-1`}>Data Points</p>
                        </div>
                    </div>
                )}

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className={`${colors.cardBg} backdrop-blur-sm border ${colors.cardBorder} rounded-xl p-6`}>
                        <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>Corrosion Rate Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                                <XAxis dataKey="date" stroke={colors.chartAxis} style={{ fontSize: '12px' }} />
                                <YAxis stroke={colors.chartAxis} style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                        border: `1px solid ${isDark ? '#475569' : '#e5e7eb'}`,
                                        borderRadius: '8px'
                                    }}
                                    labelStyle={{ color: isDark ? '#e2e8f0' : '#1f2937' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="corrosion" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} name="Corrosion Rate" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className={`${colors.cardBg} backdrop-blur-sm border ${colors.cardBorder} rounded-xl p-6`}>
                        <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>Probe Resistance</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                                <XAxis dataKey="date" stroke={colors.chartAxis} style={{ fontSize: '12px' }} />
                                <YAxis stroke={colors.chartAxis} style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                        border: `1px solid ${isDark ? '#475569' : '#e5e7eb'}`,
                                        borderRadius: '8px'
                                    }}
                                    labelStyle={{ color: isDark ? '#e2e8f0' : '#1f2937' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="resistance" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} name="Resistance (Ω)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Data Table */}
                <div className={`${colors.cardBg} backdrop-blur-sm border ${colors.cardBorder} rounded-xl overflow-hidden`}>
                    <div className={`px-6 py-4 border-b ${colors.cardBorder}`}>
                        <h3 className={`text-lg font-semibold ${colors.text}`}>Recent Readings</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={`${colors.tableBg}`}>
                                <tr>
                                    <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase tracking-wider`}>Timestamp</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase tracking-wider`}>Device</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase tracking-wider`}>Corrosion Rate</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase tracking-wider`}>Metal Loss</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase tracking-wider`}>Battery</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase tracking-wider`}>Status</th>
                                </tr>
                            </thead>

                            <tbody className={`divide-y ${colors.divide}`}>
                                {filteredData.slice(0, 20).map((row) => (
                                    <tr key={row.id} className={`${colors.hoverBg} transition-colors`}>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${colors.textTertiary}`}>
                                            {row.data_timestamp.toLocaleString()}
                                        </td>

                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${colors.textTertiary}`}>
                                            {row.device_id}
                                        </td>

                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${colors.text} font-semibold`}>
                                            {row.data_corrosion_rate}
                                        </td>

                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${colors.textTertiary}`}>
                                            {row.data_metal_loss}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`w-16 ${colors.batteryTrack} rounded-full h-2 mr-2`}>
                                                    <div
                                                        className={`${colors.batteryFill} h-2 rounded-full`}
                                                        style={{ width: `${row.data_battery_percentage}%` }}
                                                    />
                                                </div>

                                                <span className={`text-sm ${colors.textTertiary}`}>
                                                    {row.data_battery_percentage}%
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${row.data_probe_status === 1 ? colors.statusActive : colors.statusInactive}`}
                                            >
                                                {row.data_probe_status === 1 ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );

};

export default Dashboard;