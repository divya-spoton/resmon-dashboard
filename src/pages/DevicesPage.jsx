import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Droplets, Battery, Clock, MousePointerClick  } from 'lucide-react';
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
    <>{date ? new Date(date).toLocaleString() : '—'}</>
);

const SafeNumber = ({ value, fixed = null, suffix = '' }) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return <>—</>;
    const num = Number(value);
    if (fixed !== null) return <>{num.toFixed(fixed)}{suffix}</>;
    return <>{num}{suffix}</>;
};

const DevicesPage = () => {
    const { colors } = useTheme();
    const { bluetoothData: data, bleConfig: configs, deviceList, latestConfigPerDevice, loading, error } = useData();
    const [selectedDevice, setSelectedDevice] = useState(null);

    // one-time hint for new users (persisted in localStorage)
    const [showHint, setShowHint] = useState(() => {
        try {
            return !localStorage.getItem('devices_hint_dismissed');
        } catch (e) {
            return true;
        }
    });

    useEffect(() => {
        // if hint dismissed elsewhere, sync
        const onStorage = (e) => {
            if (e.key === 'devices_hint_dismissed') setShowHint(false);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const dismissHint = () => {
        try { localStorage.setItem('devices_hint_dismissed', '1'); } catch (e) { }
        setShowHint(false);
    };

    const devices = useMemo(() => {
        return deviceList.map(device => {
            // Get latest data for this device (data is already sorted by timestamp desc)
            const latestData = data?.find(d => d.device_id === device.id);
            return {
                ...device,
                latestData,
                config: latestConfigPerDevice?.get(device.id) || null
            };
        });
    }, [deviceList, data, latestConfigPerDevice]);

    const selectedDeviceData = useMemo(() => {
        if (!selectedDevice) return [];
        return (data || []).filter(d => d.device_id === selectedDevice).slice(0, 20);
    }, [selectedDevice, data]);


    return (
        <div>
            <div className="mb-6">
                <h1 className={`text-3xl font-bold ${colors.text} mb-2`}>Devices</h1>
                <p className={colors.textSecondary}>Monitor and manage all pipeline monitoring devices</p>

                {/* One-time hint banner for new users */}
                {showHint && (
                    <div className={`mt-4 p-3 rounded-md border ${colors.cardBorder} ${colors.cardBg} flex items-center justify-between gap-4`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-50 rounded-md">
                                <MousePointerClick  className="w-5 h-5 text-cyan-500" />
                            </div>
                            <div className="text-sm">
                                <div className={`font-medium ${colors.text}`}>Tip: Click any device card to expand and see configuration + recent readings</div>
                                <div className={`${colors.textSecondary} text-xs`}>This hint will be shown only once. You can click a card or press <kbd className="px-1 py-0.5 rounded border text-xs">Enter</kbd> when focused.</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={dismissHint} className="text-sm px-3 py-1 rounded-md border">Got it</button>
                        </div>
                    </div>
                )}
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
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedDevice(device.id === selectedDevice ? null : device.id); }}
                                className={`${colors.cardBg} border ${selectedDevice === device.id ? 'border-cyan-500' : colors.cardBorder} rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg relative`}
                            >
                                {/* Small helper badge shown while the one-time hint is visible */}
                                {showHint && !selectedDevice && (
                                    <div className="absolute top-3 right-3 flex items-center gap-2 bg-cyan-50/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                                        <MousePointerClick  className="w-4 h-4 text-cyan-500" />
                                        <span className="animate-pulse">Click to expand</span>
                                    </div>
                                )}

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
                                        <p className={`text-xs font-semibold ${colors.text} mb-3`}>Configuration</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className={colors.textSecondary}>Tag: </span>
                                                <span className={`${colors.text} font-medium`}>{device.config.tag ?? '—'}</span>
                                            </div>
                                            <div>
                                                <span className={colors.textSecondary}>Type: </span>
                                                <span className={colors.text}>{device.config.type ?? '—'}</span>
                                            </div>
                                            <div>
                                                <span className={colors.textSecondary}>Alloy: </span>
                                                <span className={colors.text}>{device.config.alloy ?? '—'}</span>
                                            </div>
                                            <div>
                                                <span className={colors.textSecondary}>Interval: </span>
                                                <span className={colors.text}>{device.config.interval ?? '—'} min</span>
                                            </div>
                                            <div>
                                                <span className={colors.textSecondary}>Span: </span>
                                                <span className={colors.text}>{device.config.span_mils ?? '—'} mils</span>
                                            </div>
                                            <div>
                                                <span className={colors.textSecondary}>Cycle Time: </span>
                                                <span className={colors.text}>{device.config.cycle_time ?? '—'} sec</span>
                                            </div>
                                            <div>
                                                <span className={colors.textSecondary}>Element 1: </span>
                                                <span className={colors.text}>{device.config.element?.element_1 ?? '—'}</span>
                                            </div>
                                            <div>
                                                <span className={colors.textSecondary}>Element 2: </span>
                                                <span className={colors.text}>{device.config.element?.element_2 ?? '—'}</span>
                                            </div>
                                            <div>
                                                <span className={colors.textSecondary}>Temp Enabled: </span>
                                                <span className={`${device.config.temperature ? 'text-green-400' : 'text-red-400'}`}>
                                                    {device.config.temperature ? 'Yes' : 'No'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className={colors.textSecondary}>Last Updated: </span>
                                                <span className={colors.text}>
                                                    <SafeDate date={device.config.timestamp} />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Expanded Configuration Panel */}
                    {selectedDevice && devices.find(d => d.id === selectedDevice)?.config && (
                        <div className={`${colors.cardBg} border ${colors.cardBorder} rounded-xl p-6 mb-6`}>
                            <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>
                                Device Configuration - {devices.find(d => d.id === selectedDevice)?.config?.tag || selectedDevice}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <h4 className={`text-sm font-semibold ${colors.text} mb-3`}>Basic Info</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className={colors.textSecondary}>Device ID:</span>
                                            <span className={`${colors.text} font-mono`}>{devices.find(d => d.id === selectedDevice)?.config?.device_id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={colors.textSecondary}>Tag:</span>
                                            <span className={colors.text}>{devices.find(d => d.id === selectedDevice)?.config?.tag ?? '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={colors.textSecondary}>Type:</span>
                                            <span className={colors.text}>{devices.find(d => d.id === selectedDevice)?.config?.type ?? '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={colors.textSecondary}>Alloy:</span>
                                            <span className={colors.text}>{devices.find(d => d.id === selectedDevice)?.config?.alloy ?? '—'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className={`text-sm font-semibold ${colors.text} mb-3`}>Monitoring Settings</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className={colors.textSecondary}>Log Interval:</span>
                                            <span className={colors.text}>{devices.find(d => d.id === selectedDevice)?.config?.interval ?? '—'} min</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={colors.textSecondary}>Cycle Time:</span>
                                            <span className={colors.text}>{devices.find(d => d.id === selectedDevice)?.config?.cycle_time ?? '—'} sec</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={colors.textSecondary}>Span:</span>
                                            <span className={colors.text}>{devices.find(d => d.id === selectedDevice)?.config?.span_mils ?? '—'} mils</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={colors.textSecondary}>Temperature:</span>
                                            <span className={`font-medium ${devices.find(d => d.id === selectedDevice)?.config?.temperature ? 'text-green-400' : 'text-red-400'}`}>
                                                {devices.find(d => d.id === selectedDevice)?.config?.temperature ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className={`text-sm font-semibold ${colors.text} mb-3`}>Elements</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className={colors.textSecondary}>Element 1:</span>
                                            <span className={`${colors.text} uppercase`}>
                                                {devices.find(d => d.id === selectedDevice)?.config?.element?.element_1 ?? '—'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={colors.textSecondary}>Element 2:</span>
                                            <span className={`${colors.text} uppercase`}>
                                                {devices.find(d => d.id === selectedDevice)?.config?.element?.element_2 ?? '—'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={colors.textSecondary}>Ident:</span>
                                            <span className={colors.text}>{devices.find(d => d.id === selectedDevice)?.config?.ident ?? '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className={colors.textSecondary}>Last Updated:</span>
                                            <span className={`${colors.textSecondary} text-xs`}>
                                                <SafeDate date={devices.find(d => d.id === selectedDevice)?.config?.timestamp} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
                                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Expo Units</th>
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
