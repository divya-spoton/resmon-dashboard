import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Download, FileText, Calendar, Filter } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

const FIELD_LABELS = {
    probeResistance: 'Expo Units'
};

const ExportPage = () => {
    const { colors } = useTheme();
    const { permissions } = useAuth();
    const { bluetoothData: data, deviceList, loading, error } = useData();
    const [exportConfig, setExportConfig] = useState({
        format: 'csv',
        dateFrom: '',
        dateTo: '',
        deviceId: '',
        includeFields: {
            // timestamp: true, always included
            device: true,
            corrosionRate: true,
            metalLoss: true,
            probeResistance: true,
            battery: true,
            probeStatus: true,
            checkElementResistance: true,
            referenceResistance: true
        }
    });

    const devices = useMemo(() => {
        return (deviceList || []).map(d => d.id);
    }, [deviceList]);

    useEffect(() => {
        if (devices && devices.length > 0 && !exportConfig.deviceId) {
            setExportConfig(prev => ({
                ...prev,
                deviceId: devices[0]
            })
            );
        }
    }, [devices, exportConfig.deviceId]);

    const safeDateFromRow = (val) => {
        if (!val) return null;
        const d = val instanceof Date ? val : new Date(val);
        return isNaN(d.getTime()) ? null : d;
    };

    const filteredData = useMemo(() => {
        // If no date range is selected, return empty array
        if (!exportConfig.dateFrom || !exportConfig.dateTo || !exportConfig.deviceId) {
            return [];
        }

        let filtered = data || [];

        if (exportConfig.deviceId !== 'all') {
            filtered = filtered.filter(d => d.device_id === exportConfig.deviceId);
        }

        if (exportConfig.dateFrom) {
            const fromDate = new Date(exportConfig.dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(d => {
                const rowDate = safeDateFromRow(d.data_timestamp);
                return rowDate ? rowDate >= fromDate : false;
            });
        }

        if (exportConfig.dateTo) {
            const toDate = new Date(exportConfig.dateTo);
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(d => {
                const rowDate = safeDateFromRow(d.data_timestamp);
                return rowDate ? rowDate <= toDate : false;
            });
        }

        return filtered;
    }, [data, exportConfig.deviceId, exportConfig.dateFrom, exportConfig.dateTo]);

    const generateCSV = () => {
        const fields = exportConfig.includeFields;
        const headers = ['Timestamp']; // Always include timestamp
        const fieldMap = ['data_timestamp']; // Always include timestamp

        // if (fields.timestamp) {
        //     headers.push('Timestamp');
        //     fieldMap.push('data_timestamp');
        // }
        if (fields.device) {
            headers.push('Device ID', 'Device Name');
            fieldMap.push('device_id', 'device_name');
        }
        if (fields.corrosionRate) {
            headers.push('Corrosion Rate (mpy)');
            fieldMap.push('data_corrosion_rate');
        }
        if (fields.metalLoss) {
            headers.push('Metal Loss (mils)');
            fieldMap.push('data_metal_loss');
        }
        if (fields.probeResistance) {
            headers.push('Expo Units');
            fieldMap.push('data_probe_resistance');
        }
        if (fields.battery) {
            headers.push('Battery %');
            fieldMap.push('data_battery_percentage');
        }
        if (fields.probeStatus) {
            headers.push('Probe Status');
            fieldMap.push('data_probe_status');
        }
        if (fields.checkElementResistance) {
            headers.push('Check Element Resistance');
            fieldMap.push('data_check_element_resistance');
        }
        if (fields.referenceResistance) {
            headers.push('Reference Resistance');
            fieldMap.push('data_reference_resistance');
        }

        let csv = headers.join(',') + '\n';

        filteredData.forEach(row => {
            const values = fieldMap.map(field => {
                let value = row[field];

                if (field === 'data_timestamp' && value) {
                    const d = safeDateFromRow(value);
                    value = d ? d.toLocaleString() : String(value);
                }

                if (field === 'data_probe_status') {
                    value = Number(value) === 1 ? 'Active' : 'Inactive';
                }

                // Escape quotes
                if (value === null || value === undefined) value = '';
                const escaped = String(value).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csv += values.join(',') + '\n';
        });

        return csv;
    };

    const generateJSON = () => {
        const fields = exportConfig.includeFields;
        const exportData = filteredData.map(row => {
            const obj = { timestamp: safeDateFromRow(row.data_timestamp)?.toISOString() || null };
            if (fields.device) {
                obj.device_id = row.device_id;
                obj.device_name = row.device_name;
            }
            if (fields.corrosionRate) obj.corrosion_rate = row.data_corrosion_rate;
            if (fields.metalLoss) obj.metal_loss = row.data_metal_loss;
            if (fields.probeResistance) obj.expo_units = row.data_probe_resistance;
            if (fields.battery) obj.battery_percentage = row.data_battery_percentage;
            if (fields.probeStatus) obj.probe_status = Number(row.data_probe_status) === 1 ? 'Active' : 'Inactive';
            if (fields.checkElementResistance) obj.check_element_resistance = row.data_check_element_resistance;
            if (fields.referenceResistance) obj.reference_resistance = row.data_reference_resistance;
            return obj;
        });

        return JSON.stringify(exportData, null, 2);
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        const fields = exportConfig.includeFields;

        // Title
        doc.setFontSize(16);
        doc.text('Pipeline Monitoring Data Export', 14, 15);

        // Metadata
        doc.setFontSize(10);
        doc.text(`Export Date: ${new Date().toLocaleString()}`, 14, 25);
        doc.text(`Device: ${exportConfig.deviceId === 'all' ? 'All Devices' : exportConfig.deviceId}`, 14, 30);
        doc.text(`Date Range: ${exportConfig.dateFrom || 'All'} to ${exportConfig.dateTo || 'All'}`, 14, 35);
        doc.text(`Total Records: ${filteredData.length}`, 14, 40);

        // Prepare table headers and data
        const headers = [['Timestamp']]; // Timestamp is always included
        const columnMap = ['data_timestamp'];

        if (fields.device) {
            headers[0].push('Device ID', 'Device Name');
            columnMap.push('device_id', 'device_name');
        }
        if (fields.corrosionRate) {
            headers[0].push('Corrosion Rate (mpy)');
            columnMap.push('data_corrosion_rate');
        }
        if (fields.metalLoss) {
            headers[0].push('Metal Loss (mils)');
            columnMap.push('data_metal_loss');
        }
        if (fields.probeResistance) {
            headers[0].push('Expo Units');
            columnMap.push('data_probe_resistance');
        }
        if (fields.battery) {
            headers[0].push('Battery %');
            columnMap.push('data_battery_percentage');
        }
        if (fields.probeStatus) {
            headers[0].push('Status');
            columnMap.push('data_probe_status');
        }
        if (fields.checkElementResistance) {
            headers[0].push('Check Element Res.');
            columnMap.push('data_check_element_resistance');
        }
        if (fields.referenceResistance) {
            headers[0].push('Reference Res.');
            columnMap.push('data_reference_resistance');
        }

        // Prepare table rows
        const rows = filteredData.map(row => {
            return columnMap.map(field => {
                let value = row[field];
                if (field === 'data_timestamp' && value) {
                    const d = safeDateFromRow(value);
                    return d ? d.toLocaleString() : String(value);
                }
                if (field === 'data_probe_status') {
                    return Number(value) === 1 ? 'Active' : 'Inactive';
                }
                if (typeof value === 'number') {
                    return Number(value).toFixed(3);
                }
                return value || '—';
            });
        });

        // Add table to PDF
        autoTable(doc, {
            head: headers,
            body: rows,
            startY: 45,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [6, 182, 212], textColor: 255 },
            alternateRowStyles: { fillColor: [240, 240, 240] },
            margin: { top: 45 }
        });

        return doc;
    };

    const handleExport = () => {
        if (!permissions?.canExportData) {
            alert('You do not have permission to export data');
            return;
        }

        if (!exportConfig.dateFrom || !exportConfig.dateTo) {
            alert('Please select both From and To dates to export data');
            return;
        }

        if (filteredData.length === 0) {
            alert('No data available for the selected date range');
            return;
        }

        const filename = `pipeline_data_${new Date().toISOString().split('T')[0]}`;

        if (exportConfig.format === 'pdf') {
            const doc = generatePDF();
            doc.save(`${filename}.pdf`);
        } else {
            let content, mimeType, extension;

            if (exportConfig.format === 'csv') {
                content = generateCSV();
                mimeType = 'text/csv';
                extension = 'csv';
            } else {
                content = generateJSON();
                mimeType = 'application/json';
                extension = 'json';
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    if (!permissions?.canExportData) {
        return (
            <div className="text-center py-12">
                <Download className={`w-16 h-16 ${colors.textSecondary} mx-auto mb-4`} />
                <h2 className={`text-xl font-semibold ${colors.text} mb-2`}>Access Denied</h2>
                <p className={colors.textSecondary}>You do not have permission to export data</p>
            </div>
        );
    }

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

    return (
        <div>
            <div className="mb-6">
                <h1 className={`text-3xl font-bold ${colors.text} mb-2`}>Export Data</h1>
                <p className={colors.textSecondary}>Download pipeline monitoring data in various formats</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <div className="lg:col-span-2">
                    <div className={`${colors.cardBg} border ${colors.cardBorder} rounded-xl p-6`}>
                        <h3 className={`text-lg font-semibold ${colors.text} mb-4 flex items-center gap-2`}>
                            <Filter className="w-5 h-5" />
                            Export Configuration
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>
                                    Export Format
                                </label>
                                <select
                                    value={exportConfig.format}
                                    onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value })}
                                    className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 relative z-10`}
                                >
                                    <option value="csv">CSV (Excel Compatible)</option>
                                    <option value="json">JSON</option>
                                    <option value="pdf">PDF</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>
                                    Device
                                </label>
                                <select
                                    value={exportConfig.deviceId}
                                    onChange={(e) => setExportConfig({ ...exportConfig, deviceId: e.target.value })}
                                    className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 relative z-10`}
                                >
                                    {devices.map(device => (
                                        <option key={device} value={device}>{device}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>
                                        From Date
                                    </label>
                                    <input
                                        type="date"
                                        value={exportConfig.dateFrom}
                                        onChange={(e) => setExportConfig({ ...exportConfig, dateFrom: e.target.value })}
                                        className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>
                                        To Date
                                    </label>
                                    <input
                                        type="date"
                                        value={exportConfig.dateTo}
                                        onChange={(e) => setExportConfig({ ...exportConfig, dateTo: e.target.value })}
                                        className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium ${colors.textTertiary} mb-3`}>
                                    Include Fields
                                </label>
                                <div className={`text-xs ${colors.textSecondary} mb-2 italic`}>
                                    * Timestamp is always included in exports
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(exportConfig.includeFields).map(([key, value]) => (
                                        <label key={key} className={`flex items-center text-sm ${colors.textTertiary}`}>
                                            <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={(e) => setExportConfig({
                                                    ...exportConfig,
                                                    includeFields: { ...exportConfig.includeFields, [key]: e.target.checked }
                                                })}
                                                className="mr-2"
                                            />
                                            {FIELD_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div>
                    <div className={`${colors.cardBg} border ${colors.cardBorder} rounded-xl p-6 sticky top-6`}>
                        <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>Export Preview</h3>

                        <div className="space-y-4">
                            <div className={`${colors.inputBg} rounded-lg p-4`}>
                                <p className={`text-sm ${colors.textSecondary} mb-1`}>Records to Export</p>
                                <p className={`text-2xl font-bold ${colors.text}`}>
                                    {(!exportConfig.dateFrom || !exportConfig.dateTo) ? '----' : filteredData.length}
                                </p>
                            </div>

                            <div className={`${colors.inputBg} rounded-lg p-4`}>
                                <p className={`text-sm ${colors.textSecondary} mb-1`}>Format</p>
                                <p className={`text-lg font-semibold ${colors.text} uppercase`}>{exportConfig.format}</p>
                            </div>

                            <div className={`${colors.inputBg} rounded-lg p-4`}>
                                <p className={`text-sm ${colors.textSecondary} mb-1`}>Date Range</p>
                                <p className={`text-sm ${colors.text}`}>
                                    {(!exportConfig.dateFrom || !exportConfig.dateTo)
                                        ? '----'
                                        : `${exportConfig.dateFrom} to ${exportConfig.dateTo}`
                                    }
                                </p>
                            </div>

                            <div className={`${colors.inputBg} rounded-lg p-4`}>
                                <p className={`text-sm ${colors.textSecondary} mb-1`}>Selected Fields</p>
                                <p className={`text-sm ${colors.text}`}>
                                    {Object.values(exportConfig.includeFields).filter(Boolean).length + 1} fields
                                    <span className="text-xs opacity-60"> (incl. timestamp)</span>
                                </p>
                            </div>

                            <button
                                onClick={handleExport}
                                disabled={!exportConfig.dateFrom || !exportConfig.dateTo || !exportConfig.deviceId || filteredData.length === 0}
                                className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download className="w-5 h-5" />
                                Export Data
                            </button>

                            <p className={`text-xs ${colors.textSecondary} text-center`}>
                                File will be downloaded to your device
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Exports Info */}
            <div className={`${colors.cardBg} border ${colors.cardBorder} rounded-xl p-6 mt-6`}>
                <h3 className={`text-lg font-semibold ${colors.text} mb-3 flex items-center gap-2`}>
                    <FileText className="w-5 h-5" />
                    Export Tips
                </h3>
                <ul className={`space-y-2 text-sm ${colors.textSecondary}`}>
                    <li>• CSV files can be opened directly in Excel or Google Sheets</li>
                    <li>• JSON format is useful for programmatic data processing</li>
                    <li>• Use date filters to export specific time periods</li>
                    <li>• Select only required fields to reduce file size</li>
                    <li>• Large exports may take a few moments to generate</li>
                </ul>
            </div>
        </div>
    );
};

export default ExportPage;