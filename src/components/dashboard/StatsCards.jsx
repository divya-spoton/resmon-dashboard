import React from 'react';
import { TrendingUp, AlertCircle, Battery, Calendar, Activity } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

// Small presentational stat card used inside the main grid
const StatCard = ({ Icon, label, value, unit, hint, accentClass, colors }) => {
    return (
        <div className={`${colors.cardBg} border ${colors.cardBorder} rounded-2xl p-4 flex items-center gap-4 shadow-sm`}>
            <div className={`flex-shrink-0 p-3 rounded-xl ${accentClass} flex items-center justify-center`} aria-hidden>
                <Icon className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1">
                <div className="flex items-baseline justify-between">
                    <div>
                        <div className={`text-xs font-medium uppercase tracking-wide ${colors.textTertiary}`}>{label}</div>
                        <div className={`mt-1 text-2xl font-extrabold ${colors.text}`}>
                            {value}
                            {unit && <span className={`ml-2 text-sm font-medium ${colors.textTertiary}`}>{unit}</span>}
                        </div>
                    </div>

                    {/* {hint && (
                        <div className={`text-xs ${colors.textTertiary} text-right`}>{hint}</div>
                    )} */}
                </div>

                {/* small clarifier line to explain the metric in plain language */}
                <div className={`mt-2 text-xs ${colors.textTertiary}`}>{`This is the most recent ${label.toLowerCase()} reading.`}</div>
            </div>
        </div>
    );
};

// Main exported component
// Props:
// - stats: object with keys { latestCorrosion, latestMetalLoss, latestBattery, latestTimestamp, activeProbes, totalReadings }
// - deviceName: optional string to show which device these stats are for
// - showHeader: optional boolean (default true)
const StatsCards = ({ stats = null, deviceName = '', showHeader = true }) => {
    const { colors } = useTheme();

    if (!stats) return null;

    // friendly timestamp
    const timestampLabel = stats.latestTimestamp
        ? (stats.latestTimestamp instanceof Date ? stats.latestTimestamp.toLocaleString() : new Date(stats.latestTimestamp).toLocaleString())
        : '—';

    return (
        <section aria-labelledby="latest-readings" className="mb-6">
            {showHeader && (
                <div className="flex items-center justify-between mb-4">
                    <h3 id="latest-readings" className={`text-lg font-semibold ${colors.text}`}>Latest Readings</h3>

                    <div className={`text-sm ${colors.textTertiary} flex items-center gap-3`}>
                        {deviceName && <div className={`px-2 py-1 rounded-md text-xs font-medium ${colors.cardBg} border ${colors.cardBorder}`}>{deviceName}</div>}
                        <div className="text-xs">Updated: <span className="font-medium">{timestampLabel}</span></div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                <StatCard
                    Icon={TrendingUp}
                    label="Corrosion Rate"
                    value={`${parseFloat(stats.latestCorrosion || 0).toFixed(3)}`}
                    unit="mpy"
                    hint={`${stats.totalReadings ?? 0} readings`}
                    accentClass="bg-cyan-500"
                    colors={colors}
                />

                <StatCard
                    Icon={AlertCircle}
                    label="Metal Loss"
                    value={`${parseFloat(stats.latestMetalLoss || 0).toFixed(6)}`}
                    unit="mils"
                    hint={`${stats.activeProbes ?? 0} active probes`}
                    accentClass="bg-amber-500"
                    colors={colors}
                />

                <StatCard
                    Icon={Battery}
                    label="Battery"
                    value={`${Math.round(stats.latestBattery ?? 0)}`}
                    unit="%"
                    hint={`Avg battery across probes`}
                    accentClass="bg-green-500"
                    colors={colors}
                />

                <div className={`${colors.cardBg} border ${colors.cardBorder} rounded-2xl p-4 flex items-center gap-4 shadow-sm`}>
                    <div className={`flex-shrink-0 p-3 rounded-xl bg-blue-500 flex items-center justify-center`} aria-hidden>
                        <Calendar className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1">
                        <div className="flex items-baseline justify-between">
                            <div>
                                <div className={`text-xs font-medium uppercase tracking-wide ${colors.textTertiary}`}>Latest Timestamp</div>
                                <div className={`mt-1 text-sm font-semibold ${colors.text}`}>{timestampLabel}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default StatsCards;
