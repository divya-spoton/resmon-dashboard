// src/components/dashboard/ReadingsTable.jsx
import React from 'react';
import { formatCorrosion, formatMetalLoss, parseNumberSafe } from '../../utils/formatters';

export default function ReadingsTable({ tableData = [], filteredLength = 0, tablePage, setTablePage, readingsPerPage = 20, colors }) {
    return (
        <div className={`${colors.cardBg} backdrop-blur-sm border ${colors.cardBorder} rounded-xl overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${colors.cardBorder}`}>
                <h3 className={`text-lg font-semibold ${colors.text}`}>Recent Readings</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className={`${colors.tableBg}`}>
                        <tr>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary}`}>Timestamp</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary}`}>Device</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary}`}>Corrosion Rate (mpy)</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary}`}>Metal Loss (mils)</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary}`}>Battery</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary}`}>Status</th>
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

            {filteredLength > tablePage * readingsPerPage && (
                <div className={`px-6 py-4 border-t ${colors.cardBorder} bg-transparent text-center`}>
                    <button onClick={() => setTablePage(p => p + 1)} className="px-4 py-2 rounded-lg transition-colors">Load more ({filteredLength - tablePage * readingsPerPage} remaining)</button>
                </div>
            )}

            {tablePage > 1 && (
                <div className="px-6 py-3 text-right">
                    <button onClick={() => setTablePage(1)} className="px-3 py-1 rounded-md border">Show less</button>
                </div>
            )}
        </div>
    );
}
