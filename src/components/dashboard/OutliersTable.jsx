import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { parseNumberSafe, formatCorrosion, formatMetalLoss } from '../../utils/formatters';

export default function OutliersTable({ outlierData = [], colors, corrosionThreshold, metalLossThreshold, resistanceThresholdMin, resistanceThresholdMax, outlierPage, setOutlierPage, OUTLIERS_PER_PAGE }) {
    if (!outlierData || outlierData.length === 0) return null;

    return (
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
                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary}`}>Timestamp</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary}`}>Device</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary}`}>Violations</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary}`}>Corrosion</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary}`}>Metal Loss</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary}`}>Resistance</th>
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
                        <button onClick={() => setOutlierPage(p => p + 1)} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg">Load More Outliers ({outlierData.length - (outlierPage * OUTLIERS_PER_PAGE)} remaining)</button>
                    </div>
                )}
            </div>
        </div>
    );
}
