import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Battery, AlertCircle, TrendingUp, Droplets, Calendar } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useBluetoothData } from '../hooks/useFirebaseData';
import mockData from '../utils/mockData'

const Dashboard = ({ data: propData }) => {
    const { data: fetchedData, loading, error } = useBluetoothData();
    const data = propData || fetchedData;
    // const [data] = useState(mockData);

    const [selectedDevice, setSelectedDevice] = useState('all');
    const [timeRange, setTimeRange] = useState('7days');
    const { isDark, toggleTheme, colors } = useTheme();

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

    if (loading) {
        return (
            <div className={`min-h-screen ${colors.bg} flex items-center justify-center`}>
                <div className={`${colors.text}`}>Loading data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen ${colors.bg} flex items-center justify-center`}>
                <div className="text-red-400">Error loading data: {error}</div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className={`min-h-screen ${colors.bg}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className={`${colors.cardBg} rounded-xl p-12 text-center border ${colors.cardBorder}`}>
                        <Droplets className={`w-16 h-16 ${colors.textTertiary} mx-auto mb-4`} />
                        <h3 className={`text-xl font-semibold ${colors.text} mb-2`}>No Data Available</h3>
                        <p className={`${colors.textTertiary}`}>There are no readings from any devices yet.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${colors.bg}`}>
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