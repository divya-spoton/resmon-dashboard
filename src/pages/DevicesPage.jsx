import React, { useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Droplets, Battery, Clock } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const Loader = () => (
    <div className="w-full py-12 flex justify-center items-center">
        <div className="animate-pulse text-sm">Loading devices…</div>
    </div>
);

const ErrorBox = ({ message }) => (
    <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{message}</div>
);

const SafeDate = ({ date }) => (
    <>{date ? date.toLocaleString() : '—'}</>
);


const SafeNumber = ({ value, fixed = null, suffix = '' }) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return <>—</>;
    const num = Number(value);
    if (fixed !== null) return <>{num.toFixed(fixed)}{suffix}</>;
    return <>{num}{suffix}</>;
};

const DevicesPage = () => {
    const { colors } = useTheme();
    const { bluetoothData: data, bleConfig: configs, loading, error } = useData();
    const [selectedDevice, setSelectedDevice] = useState(null);

    const devices = useMemo(() => {
        const deviceMap = new Map();
        (data || []).forEach(record => {
            if (!record || !record.device_id) return;
            if (!deviceMap.has(record.device_id)) {
                deviceMap.set(record.device_id, {
                    id: record.device_id,
                    name: record.device_name || record.device_id,
                    latestData: record,
                    config: (configs || []).find(c => c.device_id === record.device_id)
                });
            }
        });
        return Array.from(deviceMap.values());
    }, [data, configs]);

    const selectedDeviceData = useMemo(() => {
        if (!selectedDevice) return [];
        return (data || []).filter(d => d.device_id === selectedDevice).slice(0, 20);
    }, [selectedDevice, data]);


    return (
        <div>
            <div className="mb-6">
                <h1 className={`text-3xl font-bold ${colors.text} mb-2`}>Devices</h1>
                <p className={colors.textSecondary}>Monitor and manage all pipeline monitoring devices</p>
            </div>

            {error && <ErrorBox message={error} />}

            {loading && !devices.length ? (
                <Loader />
            ) : (
                <>
                    {/* Device Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {devices.length === 0 && (
                            <div className={`col-span-full p-6 rounded-xl ${colors.cardBg} border ${colors.cardBorder}`}>
                                <p className={`${colors.textSecondary}`}>No devices available</p>
                            </div>
                        )}

                        {devices.map((device) => (
                            <div
                                key={device.id}
                                onClick={() => setSelectedDevice(device.id === selectedDevice ? null : device.id)}
                                className={`${colors.cardBg} border ${selectedDevice === device.id ? 'border-cyan-500' : colors.cardBorder} rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-cyan-500/20 rounded-lg">
                                            <Droplets className="w-6 h-6 text-cyan-400" />
                                        </div>
                                        <div>
                                            <h3 className={`font-semibold ${colors.text}`}>{device.config?.tag || device.name}</h3>
                                            <p className={`text-xs ${colors.textSecondary} font-mono mt-1`}>{device.id}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${device.latestData?.data_probe_status === 1 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {device.latestData?.data_probe_status === 1 ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm ${colors.textSecondary}`}>Corrosion Rate</span>
                                        <span className={`text-sm font-medium ${colors.text}`}>
                                            <SafeNumber value={device.latestData?.data_corrosion_rate} fixed={3} suffix=" mpy" />
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm ${colors.textSecondary}`}>Metal Loss</span>
                                        <span className={`text-sm font-medium ${colors.text}`}>
                                            <SafeNumber value={device.latestData?.data_metal_loss} fixed={3} suffix=" mils" />
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm ${colors.textSecondary}`}>Battery</span>
                                        <div className="flex items-center gap-2">
                                            <Battery className="w-4 h-4 text-green-400" />
                                            <span className={`text-sm font-medium ${colors.text}`}>
                                                <SafeNumber value={device.latestData?.data_battery_percentage} suffix="%" />
                                            </span>
                                        </div>
                                    </div>

                                    <div className={`flex items-center gap-2 pt-2 border-t ${colors.cardBorder}`}>
                                        <Clock className={`w-4 h-4 ${colors.textSecondary}`} />
                                        <span className={`text-xs ${colors.textSecondary}`}>
                                            Last reading: <SafeDate date={device.latestData?.data_timestamp} />
                                        </span>
                                    </div>
                                </div>

                                {device.config && (
                                    <div className={`mt-4 pt-4 border-t ${colors.cardBorder}`}>
                                        <p className={`text-xs ${colors.textSecondary} mb-2`}>Configuration</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className={colors.textSecondary}>Type: </span>
                                                <span className={colors.text}>{device.config.type ?? '—'}</span>
                                            </div>
                                            <div>
                                                <span className={colors.textSecondary}>Alloy: </span>
                                                <span className={colors.text}>{device.config.alloy ?? '—'}</span>
                                            </div>
                                            <div>
                                                <span className={colors.textSecondary}>Tag: </span>
                                                <span className={colors.text}>{device.config.tag ?? '—'}</span>
                                            </div>
                                            <div>
                                                <span className={colors.textSecondary}>Interval: </span>
                                                <span className={colors.text}>{device.config.interval ?? '—'}h</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Selected Device Details */}
                    {selectedDevice && (
                        <div className={`${colors.cardBg} border ${colors.cardBorder} rounded-xl overflow-hidden`}>
                            <div className={`px-6 py-4 border-b ${colors.cardBorder}`}>
                                <h3 className={`text-lg font-semibold ${colors.text}`}>
                                    Recent Readings - {devices.find(d => d.id === selectedDevice)?.name ?? selectedDevice}
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className={colors.tableBg}>
                                        <tr>
                                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Timestamp</th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Corrosion Rate</th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Metal Loss</th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Resistance</th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Battery</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${colors.cardBorder}`}>
                                        {selectedDeviceData.map((record) => (
                                            <tr key={record.id} className={`${colors.hoverBg} ${colors.cardBorder}`}>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${colors.textTertiary}`}><SafeDate date={record.data_timestamp} /></td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${colors.text} font-semibold`}>
                                                    <SafeNumber value={record.data_corrosion_rate} fixed={3} suffix=" mpy" />
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${colors.textTertiary}`}>
                                                    <SafeNumber value={record.data_metal_loss} fixed={3} suffix=" mils" />
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${colors.textTertiary}`}>
                                                    {record.data_probe_resistance !== undefined && record.data_probe_resistance !== null ? Number(record.data_probe_resistance).toFixed(2) + ' Ω' : '—'}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${colors.textTertiary}`}><SafeNumber value={record.data_battery_percentage} suffix="%" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DevicesPage;
