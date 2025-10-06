import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Battery, AlertCircle, TrendingUp, Droplets, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

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


    const { currentUser, logout } = useAuth();

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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Droplets className="w-8 h-8 text-cyan-400" />
                            <div>
                                <h1 className="text-2xl font-bold text-white">Pipeline Monitoring System</h1>
                                <p className="text-sm text-slate-400">Real-time corrosion tracking & analysis</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <User className="w-4 h-4" />
                                <span>{currentUser?.email}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="mb-6 flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Device</label>
                        <select
                            value={selectedDevice}
                            onChange={(e) => setSelectedDevice(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="all">All Devices</option>
                            {devices.map(device => (
                                <option key={device} value={device}>{device}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Time Range</label>
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                        <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="w-5 h-5 text-cyan-400" />
                                <span className="text-xs font-medium text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded">AVG</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{stats.avgCorrosion}</p>
                            <p className="text-xs text-slate-400 mt-1">Corrosion Rate</p>
                        </div>

                        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-2">
                                <AlertCircle className="w-5 h-5 text-amber-400" />
                                <span className="text-xs font-medium text-amber-400 bg-amber-500/20 px-2 py-1 rounded">AVG</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{stats.avgMetalLoss}</p>
                            <p className="text-xs text-slate-400 mt-1">Metal Loss (mils)</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-2">
                                <Battery className="w-5 h-5 text-green-400" />
                                <span className="text-xs font-medium text-green-400 bg-green-500/20 px-2 py-1 rounded">AVG</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{stats.avgBattery}%</p>
                            <p className="text-xs text-slate-400 mt-1">Battery Level</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-2">
                                <Activity className="w-5 h-5 text-blue-400" />
                                <span className="text-xs font-medium text-blue-400 bg-blue-500/20 px-2 py-1 rounded">ACTIVE</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{stats.activeProbes}</p>
                            <p className="text-xs text-slate-400 mt-1">Active Probes</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-2">
                                <Calendar className="w-5 h-5 text-purple-400" />
                                <span className="text-xs font-medium text-purple-400 bg-purple-500/20 px-2 py-1 rounded">TOTAL</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{stats.totalReadings}</p>
                            <p className="text-xs text-slate-400 mt-1">Data Points</p>
                        </div>
                    </div>
                )}

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Corrosion Rate Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                    labelStyle={{ color: '#e2e8f0' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="corrosion" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} name="Corrosion Rate" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Probe Resistance</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                    labelStyle={{ color: '#e2e8f0' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="resistance" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} name="Resistance (Ω)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-700">
                        <h3 className="text-lg font-semibold text-white">Recent Readings</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Timestamp</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Device</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Corrosion Rate</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Metal Loss</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Battery</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredData.slice(0, 20).map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {row.data_timestamp.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">
                                            {row.device_id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
                                            {row.data_corrosion_rate}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {row.data_metal_loss}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-16 bg-slate-700 rounded-full h-2 mr-2">
                                                    <div
                                                        className="bg-green-500 h-2 rounded-full"
                                                        style={{ width: `${row.data_battery_percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm text-slate-300">{row.data_battery_percentage}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${row.data_probe_status === 1
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                                }`}>
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