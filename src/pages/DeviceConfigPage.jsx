import React, { useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { Settings, Search } from 'lucide-react';

const DeviceConfigPage = () => {
    const { colors } = useTheme();
    const { bleConfig: configs, loading } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedConfig, setSelectedConfig] = useState(null);

    const filteredConfigs = useMemo(() => {
        if (!searchTerm) return configs;
        return configs.filter(config =>
            config.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            config.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            config.tag?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [configs, searchTerm]);

    if (loading) {
        return (
            <div className="text-center py-12">
                <p className={colors.textSecondary}>Loading configurations...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className={`text-3xl font-bold ${colors.text} mb-2`}>Device Configuration</h1>
                <p className={colors.textSecondary}>View and manage device settings and parameters</p>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${colors.textSecondary}`} />
                    <input
                        type="text"
                        placeholder="Search by device ID, name, or tag..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    />
                </div>
            </div>

            {/* Configurations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredConfigs.map((config) => (
                    <div
                        key={config.id}
                        className={`${colors.cardBg} border ${colors.cardBorder} rounded-xl p-6 hover:shadow-lg transition-shadow`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-cyan-500/20 rounded-lg">
                                    <Settings className="w-6 h-6 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className={`font-semibold ${colors.text}`}>{config.device_name}</h3>
                                    <p className={`text-xs ${colors.textSecondary} font-mono mt-1`}>{config.device_id}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className={`text-xs ${colors.textSecondary} mb-1`}>Tag</p>
                                <p className={`text-sm font-medium ${colors.text}`}>{config.tag || 'N/A'}</p>
                            </div>
                            <div>
                                <p className={`text-xs ${colors.textSecondary} mb-1`}>Type</p>
                                <p className={`text-sm font-medium ${colors.text}`}>{config.type || 'N/A'}</p>
                            </div>
                            <div>
                                <p className={`text-xs ${colors.textSecondary} mb-1`}>Alloy</p>
                                <p className={`text-sm font-medium ${colors.text}`}>{config.alloy || 'N/A'}</p>
                            </div>
                            <div>
                                <p className={`text-xs ${colors.textSecondary} mb-1`}>Interval</p>
                                <p className={`text-sm font-medium ${colors.text}`}>{config.interval} min</p>
                            </div>
                            <div>
                                <p className={`text-xs ${colors.textSecondary} mb-1`}>Cycle Time</p>
                                <p className={`text-sm font-medium ${colors.text}`}>{config.cycle_time}s</p>
                            </div>
                            <div>
                                <p className={`text-xs ${colors.textSecondary} mb-1`}>Span</p>
                                <p className={`text-sm font-medium ${colors.text}`}>{config.span_mils} mils</p>
                            </div>
                        </div>

                        {config.element && (
                            <div className={`mt-4 pt-4 border-t ${colors.cardBorder}`}>
                                <p className={`text-xs ${colors.textSecondary} mb-2`}>Elements</p>
                                <div className="flex gap-2">
                                    {config.element.element_1 && (
                                        <span className={`px-2 py-1 text-xs ${colors.inputBg} ${colors.text} rounded`}>
                                            {config.element.element_1}
                                        </span>
                                    )}
                                    {config.element.element_2 && (
                                        <span className={`px-2 py-1 text-xs ${colors.inputBg} ${colors.text} rounded`}>
                                            {config.element.element_2}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className={`mt-4 pt-4 border-t ${colors.cardBorder} flex items-center justify-between`}>
                            <div>
                                <p className={`text-xs ${colors.textSecondary}`}>Temperature Monitoring</p>
                                <p className={`text-sm font-medium ${colors.text}`}>
                                    {config.temperature ? 'Enabled' : 'Disabled'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className={`text-xs ${colors.textSecondary}`}>Last Updated</p>
                                <p className={`text-sm font-medium ${colors.text}`}>
                                    {config.timestamp?.toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredConfigs.length === 0 && (
                <div className={`${colors.cardBg} border ${colors.cardBorder} rounded-xl p-12 text-center`}>
                    <Settings className={`w-16 h-16 ${colors.textSecondary} mx-auto mb-4`} />
                    <p className={`text-lg ${colors.text} mb-2`}>No configurations found</p>
                    <p className={colors.textSecondary}>Try adjusting your search criteria</p>
                </div>
            )}

            {/* Detail Modal (optional - for future enhancement) */}
            {selectedConfig && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className={`${colors.cardBg} rounded-xl p-6 max-w-2xl w-full border ${colors.cardBorder} max-h-[90vh] overflow-y-auto`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-bold ${colors.text}`}>Configuration Details</h3>
                            <button
                                onClick={() => setSelectedConfig(null)}
                                className={colors.textSecondary}
                            >
                                ✕
                            </button>
                        </div>
                        <pre className={`${colors.inputBg} p-4 rounded-lg text-sm ${colors.text} overflow-x-auto`}>
                            {JSON.stringify(selectedConfig, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeviceConfigPage;