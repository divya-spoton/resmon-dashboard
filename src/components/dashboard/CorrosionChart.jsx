import React from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ReferenceLine } from 'recharts';
import { tooltipFormatter } from '../../utils/formatters';

export default function CorrosionChart({ chartData, corrosionThreshold, colors, isDark }) {
    return (
        <div className={`${colors.cardBg} backdrop-blur-sm border ${colors.cardBorder} rounded-xl p-6 relative`}>
            <h3 className={`text-lg font-semibold ${colors.text} mb-2 flex items-center gap-2`}>Corrosion Rate Trend</h3>
            {corrosionThreshold && (<p className="text-xs text-amber-400 mb-3">🎯 Threshold: {corrosionThreshold} mpy (red dots = outliers)</p>)}

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis dataKey="timestamp" stroke={colors.chartAxis} style={{ fontSize: '10px' }} tickFormatter={(val) => val ? new Date(val).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' }) : '—'} angle={-45} textAnchor="end" height={70} interval="preserveStartEnd" />
                    <YAxis stroke={colors.chartAxis} label={{ value: 'mpy', angle: -90, position: 'insideLeft', style: { fill: colors.textTertiary } }} />
                    <Tooltip formatter={tooltipFormatter} labelFormatter={(label) => label ? new Date(label).toLocaleString() : '—'} contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', border: `1px solid ${isDark ? '#475569' : '#e5e7eb'}`, borderRadius: 8 }} labelStyle={{ color: isDark ? '#e2e8f0' : '#1f2937' }} />
                    <Legend />
                    {corrosionThreshold && (<ReferenceLine y={parseFloat(corrosionThreshold)} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />)}
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
    );
}
