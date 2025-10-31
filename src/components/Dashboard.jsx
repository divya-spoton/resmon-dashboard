import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Droplets, AlertTriangle, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import StatsCards from './StatsCards';

// Small helpers
const parseNumberSafe = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};
const formatCorrosion = (v) => parseNumberSafe(v).toFixed(3);
const formatMetalLoss = (v) => parseNumberSafe(v).toFixed(6);

const Dashboard = ({ data: propData }) => {
    const { bluetoothData: fetchedData, deviceList, loading, error } = useData();
    const data = propData || fetchedData;

    const [selectedDevice, setSelectedDevice] = useState('');
    const { isDark, colors } = useTheme();
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const hasDateRange = !!(dateFrom && dateTo);
    const [maxPoints, setMaxPoints] = useState(100);
    const [corrosionThreshold, setCorrosionThreshold] = useState('');
    const [metalLossThreshold, setMetalLossThreshold] = useState('');
    const [resistanceThresholdMin, setResistanceThresholdMin] = useState('');
    const [resistanceThresholdMax, setResistanceThresholdMax] = useState('');
    const [outlierPage, setOutlierPage] = useState(1);
    const OUTLIERS_PER_PAGE = 50;
    // Add next to OUTLIERS_PER_PAGE and other states
    const READINGS_PER_PAGE = 20;
    const [tablePage, setTablePage] = useState(1);


    // UX: collapsible advanced controls
    const [controlsOpen, setControlsOpen] = useState(true);

    // One-time hint for the dashboard (persisted in localStorage)
    // const HINT_KEY = 'dashboard_hint_dismissed_v1';
    // const [showHint, setShowHint] = useState(() => {
    //     try { return !localStorage.getItem(HINT_KEY); } catch (e) { return true; }
    // });

    // useEffect(() => {
    //     const onStorage = (e) => {
    //         if (e.key === HINT_KEY) setShowHint(false);
    //     };
    //     window.addEventListener('storage', onStorage);
    //     return () => window.removeEventListener('storage', onStorage);
    // }, []);

    // const dismissHint = () => {
    //     try { localStorage.setItem(HINT_KEY, '1'); } catch (e) { }
    //     setShowHint(false);
    // };

    // Presets for quick threshold setup
    // const presets = [
    //     { id: 'lenient', label: 'Lenient', values: { corrosion: '10.000', metalLoss: '0.010000', rmin: '', rmax: '' } },
    //     { id: 'default', label: 'Default', values: { corrosion: '5.000', metalLoss: '0.001000', rmin: '10.00', rmax: '2000.00' } },
    //     { id: 'strict', label: 'Strict', values: { corrosion: '1.000', metalLoss: '0.000100', rmin: '50.00', rmax: '1000.00' } },
    // ];

    // const applyPreset = (p) => {
    //     setCorrosionThreshold(p.values.corrosion);
    //     setMetalLossThreshold(p.values.metalLoss);
    //     setResistanceThresholdMin(p.values.rmin);
    //     setResistanceThresholdMax(p.values.rmax);
    // };

    const resetControls = () => {
        setCorrosionThreshold('');
        setMetalLossThreshold('');
        setResistanceThresholdMin('');
        setResistanceThresholdMax('');
        setMaxPoints(100);
    };

    // Get unique devices
    const devices = useMemo(() => {
        return deviceList.map(d => d.id);
    }, [deviceList]);

    useEffect(() => {
        if (devices && devices.length > 0 && !selectedDevice) {
            setSelectedDevice(devices[0]);
        }
    }, [devices, selectedDevice]);

    useEffect(() => {
        setTablePage(1);
    }, [selectedDevice, dateFrom, dateTo]);

    // Filter data based on selections
    const filteredData = useMemo(() => {
        let filtered = data || [];

        if (selectedDevice) {
            filtered = filtered.filter(d => d.device_id === selectedDevice);
        } else {
            return [];
        }

        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(d => new Date(d.data_timestamp) >= fromDate);
        }

        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(d => new Date(d.data_timestamp) <= toDate);
        }

        return filtered;
    }, [data, selectedDevice, dateFrom, dateTo]);

    // Table data: newest first, show up to 20 latest readings
    const tableData = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return [];

        const sortedDesc = [...filteredData].sort((a, b) => new Date(b.data_timestamp) - new Date(a.data_timestamp));
        const maxRows = tablePage * READINGS_PER_PAGE;
        return sortedDesc.slice(0, maxRows);
    }, [filteredData, tablePage]);


    const chartData = useMemo(() => {
        if (!hasDateRange) return [];

        if (!filteredData || filteredData.length === 0) return [];

        const sortedAsc = [...filteredData].sort((a, b) => new Date(a.data_timestamp) - new Date(b.data_timestamp));

        const corrosionThresh = corrosionThreshold ? parseFloat(corrosionThreshold) : null;
        const metalLossThresh = metalLossThreshold ? parseFloat(metalLossThreshold) : null;
        const resistanceMin = resistanceThresholdMin ? parseFloat(resistanceThresholdMin) : null;
        const resistanceMax = resistanceThresholdMax ? parseFloat(resistanceThresholdMax) : null;

        const outlierIndices = new Set();
        sortedAsc.forEach((d, idx) => {
            const corrosion = parseNumberSafe(d.data_corrosion_rate);
            const metalLoss = parseNumberSafe(d.data_metal_loss);
            const resistance = parseNumberSafe(d.data_probe_resistance);

            const isOutlier =
                (corrosionThresh !== null && corrosion > corrosionThresh) ||
                (metalLossThresh !== null && metalLoss > metalLossThresh) ||
                (resistanceMin !== null && resistance < resistanceMin) ||
                (resistanceMax !== null && resistance > resistanceMax);

            if (isOutlier) outlierIndices.add(idx);
        });

        const maxPts = Math.max(10, Math.min(1000, Number(maxPoints) || 100));

        let sampled = [];
        if (sortedAsc.length <= maxPts) {
            sampled = sortedAsc.map((d, idx) => ({ data: d, index: idx, isOutlier: outlierIndices.has(idx) }));
        } else {
            const step = Math.max(1, Math.floor(sortedAsc.length / maxPts));
            sampled = sortedAsc
                .filter((_, idx) => idx % step === 0 || idx === sortedAsc.length - 1)
                .map((d) => ({ data: d, index: sortedAsc.indexOf(d), isOutlier: outlierIndices.has(sortedAsc.indexOf(d)) }));
        }

        return sampled.map(({ data: d, index, isOutlier }) => {
            const ts = d.data_timestamp ? (d.data_timestamp instanceof Date ? d.data_timestamp : new Date(d.data_timestamp)) : null;
            const corrosion = parseNumberSafe(d.data_corrosion_rate);
            const metalLoss = parseNumberSafe(d.data_metal_loss);
            const resistance = parseNumberSafe(d.data_probe_resistance);

            return {
                id: d.id ?? index,
                timestamp: ts ? ts.toISOString() : null,
                dateLabel: ts ? ts.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
                fullTimestamp: ts ? ts.toLocaleString() : '—',
                corrosion,
                metalLoss,
                resistance,
                device_id: d.device_id,
                isOutlier,
                isCorrosionOutlier: corrosionThresh !== null && corrosion > corrosionThresh,
                isMetalLossOutlier: metalLossThresh !== null && metalLoss > metalLossThresh,
                isResistanceOutlier: (resistanceMin !== null && resistance < resistanceMin) || (resistanceMax !== null && resistance > resistanceMax),
            };
        });
    }, [filteredData, maxPoints, corrosionThreshold, metalLossThreshold, resistanceThresholdMin, resistanceThresholdMax, hasDateRange]);

    const outlierData = useMemo(() => {
        if (!hasDateRange) return [];

        if (!filteredData || filteredData.length === 0) return [];

        const corrosionThresh = corrosionThreshold ? parseFloat(corrosionThreshold) : null;
        const metalLossThresh = metalLossThreshold ? parseFloat(metalLossThreshold) : null;
        const resistanceMin = resistanceThresholdMin ? parseFloat(resistanceThresholdMin) : null;
        const resistanceMax = resistanceThresholdMax ? parseFloat(resistanceThresholdMax) : null;

        return filteredData
            .map(d => {
                const corrosion = parseNumberSafe(d.data_corrosion_rate);
                const metalLoss = parseNumberSafe(d.data_metal_loss);
                const resistance = parseNumberSafe(d.data_probe_resistance);

                const violations = [];
                if (corrosionThresh !== null && corrosion > corrosionThresh) violations.push(`Corrosion: ${corrosion.toFixed(3)} > ${corrosionThresh}`);
                if (metalLossThresh !== null && metalLoss > metalLossThresh) violations.push(`Metal Loss: ${metalLoss.toFixed(6)} > ${metalLossThresh}`);
                if (resistanceMin !== null && resistance < resistanceMin) violations.push(`Resistance: ${resistance.toFixed(2)} < ${resistanceMin}`);
                if (resistanceMax !== null && resistance > resistanceMax) violations.push(`Resistance: ${resistance.toFixed(2)} > ${resistanceMax}`);

                return violations.length > 0 ? { ...d, violations } : null;
            })
            .filter(Boolean)
            .sort((a, b) => new Date(b.data_timestamp) - new Date(a.data_timestamp));
    }, [filteredData, corrosionThreshold, metalLossThreshold, resistanceThresholdMin, resistanceThresholdMax, hasDateRange]);

    const stats = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return null;

        const latestReading = filteredData[0];

        return {
            latestCorrosion: parseNumberSafe(latestReading.data_corrosion_rate).toFixed(3),
            latestMetalLoss: parseNumberSafe(latestReading.data_metal_loss).toFixed(6),
            latestBattery: parseNumberSafe(latestReading.data_battery_percentage),
            latestTimestamp: latestReading.data_timestamp,
            activeProbes: filteredData.filter(d => d.data_probe_status === 1).length,
            totalReadings: filteredData.length,
            outlierCount: outlierData.length
        };
    }, [filteredData, outlierData]);

    // Tooltip formatter for units & fixed decimals
    const tooltipFormatter = (value, name) => {
        if (name === 'Corrosion Rate' || name === 'corrosion') {
            return [`${parseNumberSafe(value).toFixed(3)} mpy`, name];
        }
        if (name === 'Metal Loss' || name === 'metalLoss') {
            return [`${parseNumberSafe(value).toFixed(6)} mils`, name];
        }
        if (name === 'Resistance' || name === 'resistance') {
            return [value, name];
        }
        return [value, name];
    };

    if (loading) {
        return (
            <div className={`min-h-screen ${colors.bg} flex items-center justify-center`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                    <div className={`${colors.text}`}>Loading dashboard data...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen ${colors.bg} flex items-center justify-center`}>
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <div className="text-red-400 mb-2">Error loading data</div>
                    <div className="text-sm text-gray-500">{error}</div>
                </div>
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
                {/* Top heading + hint */}
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className={`text-3xl font-bold ${colors.text} mb-1`}>Dashboard</h1>
                        <p className={`${colors.textSecondary}`}>Overview of corrosion, metal loss and probe resistance across devices</p>
                    </div>

                    {/* One-time hint banner */}
                    {/* {showHint && (
                        <div className={`ml-auto p-3 rounded-md border ${colors.cardBorder} ${colors.cardBg} flex items-center gap-3 max-w-xl`}>
                            <div className="p-2 bg-cyan-50 rounded-md">
                                <MousePointerClick className="w-5 h-5 text-cyan-500" />
                            </div>
                            <div className="text-sm">
                                <div className={`font-medium ${colors.text}`}>Tip: Use the filters to focus on a device + set thresholds to highlight critical outliers.</div>
                                <div className={`${colors.textSecondary} text-xs`}>Try a preset or click "Got it" — this tip is shown once per browser.</div>
                            </div>
                            <button onClick={dismissHint} aria-label="Dismiss hint" className="ml-4 p-2 rounded-md border">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )} */}
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Device</label>
                        <select
                            value={selectedDevice}
                            onChange={(e) => setSelectedDevice(e.target.value)}
                            aria-label="Select device"
                            className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                        >
                            {devices.length === 0 && <option value="">No devices available</option>}
                            {devices.map(device => (
                                <option key={device} value={device}>{device}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>From Date</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500`} />
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>To Date</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500`} />
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setControlsOpen(c => !c)} className={`px-3 py-2 rounded-md border ${colors.cardBorder} ${colors.cardBg}`} aria-expanded={controlsOpen} aria-controls="advanced-controls">
                            {controlsOpen ? 'Hide Controls' : 'Show Controls'}
                        </button>
                    </div>
                </div>

                {/* Advanced Controls (collapsible) */}
                <div id="advanced-controls" className={`${controlsOpen ? 'block' : 'hidden'} mb-6`}>
                    <div className={`p-4 rounded-xl border ${colors.cardBorder} ${colors.cardBg}`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className={`text-md font-semibold ${colors.text}`}>Threshold Settings & Chart Controls</h3>
                            <div className="flex items-center gap-2">
                                {/* Presets */}
                                {/* {presets.map(p => (
                                    <button key={p.id} onClick={() => applyPreset(p)} className="px-3 py-1 rounded-md border text-sm">
                                        {p.label}
                                    </button>
                                ))} */}

                                <button onClick={resetControls} className="px-3 py-1 rounded-md border text-sm">Reset</button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[180px]">
                                <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Max Chart Points</label>
                                <input type="number" value={maxPoints} onChange={(e) => setMaxPoints(parseInt(e.target.value) || 100)} min="10" max="1000" className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500`} />
                            </div>

                            <div className="flex-1 min-w-[180px]">
                                <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Corrosion Threshold (mpy)</label>
                                <input type="number" step="0.001" value={corrosionThreshold} onChange={(e) => setCorrosionThreshold(e.target.value)} placeholder="e.g., 5.000" className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500`} />
                            </div>

                            <div className="flex-1 min-w-[180px]">
                                <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Metal Loss Threshold (mils)</label>
                                <input type="number" step="0.000001" value={metalLossThreshold} onChange={(e) => setMetalLossThreshold(e.target.value)} placeholder="e.g., 0.001000" className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500`} />
                            </div>

                            <div className="flex-1 min-w-[180px]">
                                <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Min Expo Units</label>
                                <input type="number" step="0.01" value={resistanceThresholdMin} onChange={(e) => setResistanceThresholdMin(e.target.value)} placeholder="e.g., 10.00" className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500`} />
                            </div>

                            <div className="flex-1 min-w-[180px]">
                                <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Max Expo Units</label>
                                <input type="number" step="0.01" value={resistanceThresholdMax} onChange={(e) => setResistanceThresholdMax(e.target.value)} placeholder="e.g., 1000.00" className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500`} />
                            </div>
                        </div>

                        {(corrosionThreshold || metalLossThreshold || resistanceThresholdMin || resistanceThresholdMax) && (
                            <div className={`mt-3 px-4 py-2 ${colors.cardBg} border border-amber-500/30 rounded-lg`}>
                                <p className="text-sm text-amber-400">⚠️ Chart shows sampled data ({maxPoints} max points). All {outlierData.length} outliers are listed in the Critical Outliers table below.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (<StatsCards stats={stats} />)}

                {/* Charts */}
                {!hasDateRange ? (
                    <div className={`mb-8 p-6 rounded-xl border ${colors.cardBorder} ${colors.cardBg} text-center`}>
                        <p className={`${colors.textTertiary}`}>Select a date range to view charts.</p>
                    </div>
                ) : (
                    <div className="mb-8">
                        {chartData.length === 0 ? (
                            <div className={`h-full p-12 flex items-center justify-center ${colors.cardBg} rounded-xl border ${colors.cardBorder}`}>
                                <p className={`${colors.textTertiary}`}>No data available for the selected filters.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                                <div className={`${colors.cardBg} backdrop-blur-sm border ${colors.cardBorder} rounded-xl p-6 relative`}>
                                    <h3 className={`text-lg font-semibold ${colors.text} mb-2 flex items-center gap-2`}>Corrosion Rate Trend
                                        {outlierData.length > 0 && (<span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">{outlierData.length} outliers</span>)}
                                    </h3>

                                    {corrosionThreshold && (<p className="text-xs text-amber-400 mb-3">🎯 Threshold: {corrosionThreshold} mpy (red dots = outliers)</p>)}

                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                                            <XAxis dataKey="timestamp" stroke={colors.chartAxis} style={{ fontSize: '10px' }} tickFormatter={(val) => (val ? new Date(val).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' }) : '—')} angle={-45} textAnchor="end" height={70} interval="preserveStartEnd" />
                                            <YAxis stroke={colors.chartAxis} style={{ fontSize: '12px' }} label={{ value: 'mpy', angle: -90, position: 'insideLeft', style: { fill: colors.textTertiary } }} />
                                            <Tooltip formatter={tooltipFormatter} labelFormatter={(label) => (label ? new Date(label).toLocaleString() : '—')} contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#475569' : '#e5e7eb'}`, borderRadius: '8px' }} labelStyle={{ color: isDark ? '#e2e8f0' : '#1f2937' }} />
                                            <Legend />
                                            {corrosionThreshold && (<Line type="monotone" dataKey={() => parseFloat(corrosionThreshold)} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Threshold" />)}
                                            <Line type="monotone" dataKey="corrosion" stroke="#06b6d4" strokeWidth={2} dot={(props) => {
                                                const { cx, cy, payload, index } = props;
                                                const key = payload?.id ?? payload?.index ?? index;
                                                if (payload.isCorrosionOutlier) {
                                                    return (
                                                        <g key={`dot-cor-${key}`}>
                                                            <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#dc2626" strokeWidth={2} />
                                                            <circle cx={cx} cy={cy} r={3} fill="#fca5a5" />
                                                        </g>
                                                    );
                                                }
                                                return <circle key={`dot-cor-${key}`} cx={cx} cy={cy} r={3} fill="#06b6d4" />;
                                            }} name="Corrosion Rate" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className={`${colors.cardBg} backdrop-blur-sm border ${colors.cardBorder} rounded-xl p-6`}>
                                    <h3 className={`text-lg font-semibold ${colors.text} mb-2`}>Probe Units Trend</h3>
                                    {(resistanceThresholdMin || resistanceThresholdMax) && (<p className="text-xs text-amber-400 mb-3">🎯 Range: {resistanceThresholdMin || '—'} - {resistanceThresholdMax || '—'} Ω (red dots = outliers)</p>)}

                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                                            <XAxis dataKey="timestamp" stroke={colors.chartAxis} style={{ fontSize: '10px' }} tickFormatter={(val) => (val ? new Date(val).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' }) : '—')} angle={-45} textAnchor="end" height={70} interval="preserveStartEnd" />
                                            <YAxis stroke={colors.chartAxis} style={{ fontSize: '12px' }} label={{ value: 'Ω', angle: -90, position: 'insideLeft', style: { fill: colors.textTertiary } }} />
                                            <Tooltip formatter={tooltipFormatter} labelFormatter={(label) => (label ? new Date(label).toLocaleString() : '—')} contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#475569' : '#e5e7eb'}`, borderRadius: '8px' }} labelStyle={{ color: isDark ? '#e2e8f0' : '#1f2937' }} />
                                            <Legend />
                                            {resistanceThresholdMin && (<Line type="monotone" dataKey={() => parseFloat(resistanceThresholdMin)} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Min Threshold" />)}
                                            {resistanceThresholdMax && (<Line type="monotone" dataKey={() => parseFloat(resistanceThresholdMax)} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Max Threshold" />)}
                                            <Line type="monotone" dataKey="resistance" stroke="#f59e0b" strokeWidth={2} dot={(props) => {
                                                const { cx, cy, payload, index } = props;
                                                const key = payload?.id ?? payload?.index ?? index;
                                                if (payload.isResistanceOutlier) {
                                                    return (
                                                        <g key={`dot-res-${key}`}>
                                                            <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#dc2626" strokeWidth={2} />
                                                            <circle cx={cx} cy={cy} r={3} fill="#fca5a5" />
                                                        </g>
                                                    );
                                                }
                                                return <circle key={`dot-res-${key}`} cx={cx} cy={cy} r={3} fill="#f59e0b" />;
                                            }} name="Expo Units" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Outliers Table - Only show if thresholds are set and outliers exist */}
                                {outlierData.length > 0 && (
                                    <div className={`${colors.cardBg} backdrop-blur-sm border border-red-500/50 rounded-xl overflow-hidden mb-8`}>
                                        <div className={`px-6 py-4 border-b border-red-500/50 bg-red-500/10`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <AlertTriangle className="w-5 h-5 text-red-400" />
                                                    <h3 className={`text-lg font-semibold ${colors.text}`}>Critical Outliers ({outlierData.length})</h3>
                                                </div>
                                                <span className="text-xs text-red-400 animate-pulse">⚠️ Requires Attention</span>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                            <table className="w-full">
                                                <thead className={`${colors.tableBg} sticky top-0`}>
                                                    <tr>
                                                        <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase tracking-wider`}>Timestamp</th>
                                                        <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase tracking-wider`}>Device</th>
                                                        <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase tracking-wider`}>Violations</th>
                                                        <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase tracking-wider`}>Corrosion</th>
                                                        <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase tracking-wider`}>Metal Loss</th>
                                                        <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase tracking-wider`}>Resistance</th>
                                                    </tr>
                                                </thead>

                                                <tbody className={`divide-y ${colors.divide}`}>
                                                    {outlierData.slice(0, outlierPage * OUTLIERS_PER_PAGE).map((row) => (
                                                        <tr key={row.id} className={`${colors.hoverBg} transition-colors bg-red-500/5`}>
                                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${colors.textTertiary}`}>{row.data_timestamp ? (row.data_timestamp instanceof Date ? row.data_timestamp.toLocaleString() : new Date(row.data_timestamp).toLocaleString()) : '—'}</td>
                                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${colors.textTertiary}`}>{row.device_id}</td>

                                                            <td className="px-6 py-4 text-sm"><div className="flex flex-col gap-1">{row.violations.map((v, i) => (<span key={i} className="text-xs text-red-400 font-medium">• {v}</span>))}</div></td>

                                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${corrosionThreshold && parseNumberSafe(row.data_corrosion_rate) > parseFloat(corrosionThreshold) ? 'text-red-400' : colors.text}`}>{formatCorrosion(row.data_corrosion_rate)} mpy</td>

                                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${metalLossThreshold && parseNumberSafe(row.data_metal_loss) > parseFloat(metalLossThreshold) ? 'text-red-400 font-semibold' : colors.textTertiary}`}>{formatMetalLoss(row.data_metal_loss)} mils</td>

                                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${(resistanceThresholdMin && parseNumberSafe(row.data_probe_resistance) < parseFloat(resistanceThresholdMin)) || (resistanceThresholdMax && parseNumberSafe(row.data_probe_resistance) > parseFloat(resistanceThresholdMax)) ? 'text-red-400 font-semibold' : colors.textTertiary}`}>{parseNumberSafe(row.data_probe_resistance).toFixed(2)} Ω</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            {outlierData.length > outlierPage * OUTLIERS_PER_PAGE && (
                                                <div className="px-6 py-4 border-t border-red-500/50 bg-red-500/5 text-center">
                                                    <button onClick={() => setOutlierPage(p => p + 1)} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors">Load More Outliers ({outlierData.length - (outlierPage * OUTLIERS_PER_PAGE)} remaining)</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

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
                                    <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase tracking-wider`}>Corrosion Rate (mpy)</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase tracking-wider`}>Metal Loss (mils)</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase tracking-wider`}>Battery</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase tracking-wider`}>Status</th>
                                </tr>
                            </thead>

                            <tbody className={`divide-y ${colors.divide}`}>
                                {tableData.map((row) => (
                                    <tr key={row.id} className={`${colors.hoverBg} transition-colors`}>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${colors.textTertiary}`}>{row.data_timestamp ? (row.data_timestamp instanceof Date ? row.data_timestamp.toLocaleString() : new Date(row.data_timestamp).toLocaleString()) : '—'}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${colors.textTertiary}`}>{row.device_id}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${colors.text} font-semibold`}>{formatCorrosion(row.data_corrosion_rate)} mpy</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${colors.textTertiary}`}>{formatMetalLoss(row.data_metal_loss)} mils</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className={`w-16 ${colors.batteryTrack} rounded-full h-2 mr-2`}><div className={`${colors.batteryFill} h-2 rounded-full`} style={{ width: `${parseNumberSafe(row.data_battery_percentage)}%` }} /></div><span className={`text-sm ${colors.textTertiary}`}>{parseNumberSafe(row.data_battery_percentage)}%</span></div></td>
                                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs font-medium rounded-full ${row.data_probe_status === 1 ? colors.statusActive : colors.statusInactive}`}>{row.data_probe_status === 1 ? 'Active' : 'Inactive'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Load more / Show less controls */}
                    {filteredData && filteredData.length > tablePage * READINGS_PER_PAGE && (
                        <div className={`px-6 py-4 border-t ${colors.cardBorder} bg-transparent text-center`}>
                            <button
                                onClick={() => setTablePage(p => p + 1)}
                                className="px-4 py-2 rounded-lg transition-colors"
                            >
                                Load more ({filteredData.length - tablePage * READINGS_PER_PAGE} remaining)
                            </button>
                        </div>
                    )}

                    {tablePage > 1 && (
                        <div className="px-6 py-3 text-right">
                            <button
                                onClick={() => setTablePage(1)}
                                className="px-3 py-1 rounded-md border"
                            >
                                Show less
                            </button>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
};

export default Dashboard;
