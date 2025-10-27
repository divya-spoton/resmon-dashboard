import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useBluetoothData } from '../hooks/useFirebaseData';
import { collection, addDoc, query, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AlertTriangle, Bell, BellOff, Settings, Save } from 'lucide-react';

/**
 * 
 * Detects "current" alerts by scanning recent telemetry (bluetooth_data) against thresholds (alertConfig). These are not stored anywhere by default — they’re just detected in memory from incoming data and shown as Active Alerts.

Save button: stores a chosen active alert into Firestore collection alerts. That makes it persistent and visible in the Alert History.

Alert History lists alerts already saved in Firestore (persisted). You can Acknowledge a saved alert — that flips acknowledged to true in Firestore.

Configuration (alertConfig) is stored locally (localStorage) in your code — it drives the detection thresholds. If you want team-wide thresholds, you should store config in Firestore instead.

Key differences — Current Alerts vs Alert History

Current Alerts: ephemeral, generated on-the-fly from latest telemetry and alertConfig. They’re your real-time detections (no persistence).

Alert History: persisted records in Firestore (alerts collection). They include metadata (timestamp, acknowledged status) and are used for auditing, tracking, or notifying users later.

 */

const SafeDate = ({ date }) => <>{date ? new Date(date).toLocaleString() : '—'}</>;

const AlertsPage = () => {
    const { colors } = useTheme();
    const { data = [], loading: dataLoading, error: dataError } = useBluetoothData();
    const [alertConfig, setAlertConfig] = useState({
        corrosionRateThreshold: 10.0,
        metalLossThreshold: 0.38820213079452515,
        batteryLowThreshold: 80,
        probeInactiveAlert: true
    });

    const [alerts, setAlerts] = useState([]);
    const [alertsLoading, setAlertsLoading] = useState(false);
    const [savingAlertIds, setSavingAlertIds] = useState([]); // store temporary ids/indexes being saved
    const [acknowledgingIds, setAcknowledgingIds] = useState([]);
    const [showConfig, setShowConfig] = useState(false);

    // load alert history from Firestore
    const loadAlerts = async () => {
        try {
            setAlertsLoading(true);
            const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            const alertsData = querySnapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                timestamp: d.data().timestamp ? d.data().timestamp.toDate ? d.data().timestamp.toDate() : new Date(d.data().timestamp) : null
            }));
            setAlerts(alertsData);
        } catch (err) {
            console.error('Error loading alerts:', err);
        } finally {
            setAlertsLoading(false);
        }
    };

    useEffect(() => {
        loadAlerts();
        const saved = localStorage.getItem('alertConfig');
        if (saved) {
            try { setAlertConfig(JSON.parse(saved)); } catch (e) { /* ignore */ }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // compute current alerts from latest telemetry
    const currentAlerts = useMemo(() => {
        const detected = [];
        // assume `data` is ordered desc by timestamp from the hook. If not, you can sort it here.
        (data || []).slice(0, 100).forEach(record => {
            if (!record) return;

            const corrosion = record.data_corrosion_rate !== undefined ? Number(record.data_corrosion_rate) : NaN;
            const metalLoss = record.data_metal_loss !== undefined ? Number(record.data_metal_loss) : NaN;
            const battery = record.data_battery_percentage !== undefined ? Number(record.data_battery_percentage) : NaN;
            const probeStatus = record.data_probe_status !== undefined ? Number(record.data_probe_status) : null;

            // High corrosion rate
            if (!Number.isNaN(corrosion) && corrosion > Number(alertConfig.corrosionRateThreshold)) {
                detected.push({
                    id: `${record.device_id}_corrosion_${record.data_timestamp?.getTime?.() ?? new Date().getTime()}`,
                    type: 'critical',
                    device: record.device_name || record.device_id,
                    deviceId: record.device_id,
                    message: `High corrosion rate detected: ${corrosion}`,
                    value: corrosion,
                    threshold: alertConfig.corrosionRateThreshold,
                    timestamp: record.data_timestamp || record.timestamp || new Date()
                });
            }

            // High metal loss
            if (!Number.isNaN(metalLoss) && metalLoss > Number(alertConfig.metalLossThreshold)) {
                detected.push({
                    id: `${record.device_id}_metalloss_${record.data_timestamp?.getTime?.() ?? new Date().getTime()}`,
                    type: 'warning',
                    device: record.device_name || record.device_id,
                    deviceId: record.device_id,
                    message: `Excessive metal loss: ${metalLoss}`,
                    value: metalLoss,
                    threshold: alertConfig.metalLossThreshold,
                    timestamp: record.data_timestamp || record.timestamp || new Date()
                });
            }

            // Low battery
            if (!Number.isNaN(battery) && battery < Number(alertConfig.batteryLowThreshold)) {
                detected.push({
                    id: `${record.device_id}_battery_${record.data_timestamp?.getTime?.() ?? new Date().getTime()}`,
                    type: 'info',
                    device: record.device_name || record.device_id,
                    deviceId: record.device_id,
                    message: `Low battery: ${battery}%`,
                    value: battery,
                    threshold: alertConfig.batteryLowThreshold,
                    timestamp: record.data_timestamp || record.timestamp || new Date()
                });
            }

            // Inactive probe
            if (alertConfig.probeInactiveAlert && probeStatus === 0) {
                detected.push({
                    id: `${record.device_id}_probe_inactive_${record.data_timestamp?.getTime?.() ?? new Date().getTime()}`,
                    type: 'warning',
                    device: record.device_name || record.device_id,
                    deviceId: record.device_id,
                    message: `Probe inactive`,
                    value: 'Inactive',
                    timestamp: record.data_timestamp || record.timestamp || new Date()
                });
            }
        });

        return detected;
    }, [data, alertConfig]);

    // prevent duplicate saves: check recent history
    const alreadySavedRecently = (alert) => {
        // consider an alert duplicate if same deviceId + same message and within 5 minutes
        const windowMs = 5 * 60 * 1000;
        return alerts.some(a => a.deviceId === alert.deviceId
            && a.message === alert.message
            && a.timestamp
            && Math.abs(new Date(a.timestamp).getTime() - new Date(alert.timestamp).getTime()) < windowMs);
    };

    const saveAlert = async (alert) => {
        // simple guard
        if (alreadySavedRecently(alert)) {
            // optionally: show a toast instead of alert
            console.info('Alert already saved recently, skipping duplicate save.');
            return;
        }

        try {
            setSavingAlertIds(prev => [...prev, alert.id]);
            await addDoc(collection(db, 'alerts'), {
                type: alert.type,
                device: alert.device,
                deviceId: alert.deviceId,
                message: alert.message,
                value: alert.value ?? null,
                threshold: alert.threshold ?? null,
                timestamp: alert.timestamp ? (alert.timestamp instanceof Date ? alert.timestamp : new Date(alert.timestamp)) : new Date(),
                acknowledged: false
            });
            await loadAlerts();
        } catch (err) {
            console.error('Error saving alert:', err);
        } finally {
            setSavingAlertIds(prev => prev.filter(id => id !== alert.id));
        }
    };

    const acknowledgeAlert = async (alertId) => {
        try {
            setAcknowledgingIds(prev => [...prev, alertId]);
            await updateDoc(doc(db, 'alerts', alertId), {
                acknowledged: true,
                acknowledgedAt: new Date()
            });
            await loadAlerts();
        } catch (err) {
            console.error('Error acknowledging alert:', err);
        } finally {
            setAcknowledgingIds(prev => prev.filter(id => id !== alertId));
        }
    };

    const saveConfiguration = () => {
        localStorage.setItem('alertConfig', JSON.stringify(alertConfig));
        setShowConfig(false);
        // use a better UI in prod (toast) instead of browser alert
        alert('Alert configuration saved locally');
    };

    const getAlertColor = (type) => {
        switch (type) {
            case 'critical': return 'border-red-500/30 bg-red-500/10';
            case 'warning': return 'border-amber-500/30 bg-amber-500/10';
            case 'info': return 'border-blue-500/30 bg-blue-500/10';
            default: return colors.cardBorder;
        }
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'critical': return 'text-red-400';
            case 'warning': return 'text-amber-400';
            case 'info': return 'text-blue-400';
            default: return colors.text;
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className={`text-3xl font-bold ${colors.text} mb-2`}>Alerts</h1>
                    <p className={colors.textSecondary}>Monitor abnormal readings and system notifications</p>
                </div>
                <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="flex items-center gap-2 bg-cyan-400/20 text-cyan-600 font-bold border border-cyan-500/30 px-4 py-2 rounded-lg hover:bg-cyan-500/30 transition-colors"
                >
                    <Settings className="w-6 h-6" />
                    Configure
                </button>
            </div>

            {dataError && <div className="mb-4 text-sm text-red-500">Error loading telemetry: {String(dataError)}</div>}

            {/* Configuration */}
            {showConfig && (
                <div className={`${colors.cardBg} border ${colors.cardBorder} rounded-xl p-6 mb-6`}>
                    <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>Alert Configuration (saved locally)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Corrosion Rate Threshold</label>
                            <input
                                type="number"
                                step="0.1"
                                value={alertConfig.corrosionRateThreshold}
                                onChange={(e) => setAlertConfig(prev => ({ ...prev, corrosionRateThreshold: Number(e.target.value) }))}
                                className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2`}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Metal Loss Threshold (mils)</label>
                            <input
                                type="number"
                                step="0.001"
                                value={alertConfig.metalLossThreshold}
                                onChange={(e) => setAlertConfig(prev => ({ ...prev, metalLossThreshold: Number(e.target.value) }))}
                                className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2`}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Low Battery Threshold (%)</label>
                            <input
                                type="number"
                                value={alertConfig.batteryLowThreshold}
                                onChange={(e) => setAlertConfig(prev => ({ ...prev, batteryLowThreshold: Number(e.target.value) }))}
                                className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2`}
                            />
                        </div>
                        <div>
                            <label className={`flex items-center text-sm ${colors.textTertiary} mt-8`}>
                                <input
                                    type="checkbox"
                                    checked={alertConfig.probeInactiveAlert}
                                    onChange={(e) => setAlertConfig(prev => ({ ...prev, probeInactiveAlert: !!e.target.checked }))}
                                    className="mr-2"
                                />
                                Alert on Inactive Probes
                            </label>
                        </div>
                    </div>
                    <button onClick={saveConfiguration} className="mt-4 flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg transition-colors">
                        <Save className="w-4 h-4" />
                        Save Configuration
                    </button>
                </div>
            )}

            {/* Current Active Alerts */}
            <div className="mb-6">


                {dataLoading && !currentAlerts.length ?
                    <>
                        <div className="w-full py-12 flex justify-center items-center">
                            <div className="animate-pulse text-sm">Loading devices…</div>
                        </div>
                    </> : (
                        <>
                            <h2 className={`text-xl font-semibold ${colors.text} mb-4`}>Active Alerts ({currentAlerts.length})</h2>
                            <div className="space-y-3">
                                {currentAlerts.length === 0 ? (
                                    <div className={`${colors.cardBg} border ${colors.cardBorder} rounded-xl p-8 text-center`}>
                                        <BellOff className={`w-12 h-12 ${colors.textSecondary} mx-auto mb-3`} />
                                        <p className={`${colors.textSecondary}`}>No active alerts</p>
                                    </div>
                                ) : (
                                    currentAlerts.map((alert, index) => {
                                        const isSaving = savingAlertIds.includes(alert.id);
                                        const savedRecently = alreadySavedRecently(alert);
                                        return (
                                            <div key={index} className={`${colors.cardBg} border ${getAlertColor(alert.type)} rounded-xl p-4`}>
                                                <div className="flex items-start gap-4">
                                                    <AlertTriangle className={`w-5 h-5 ${getAlertIcon(alert.type)} mt-0.5`} />
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <p className={`font-semibold ${colors.text}`}>{alert.message}</p>
                                                                <p className={`text-sm ${colors.textSecondary} mt-1`}>Device: {alert.device} ({alert.deviceId})</p>
                                                                <p className={`text-xs ${colors.textSecondary} mt-1`}><SafeDate date={alert.timestamp} /></p>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <button
                                                                    onClick={() => saveAlert(alert)}
                                                                    disabled={isSaving || savedRecently}
                                                                    className={`text-sm font-medium ${isSaving ? 'opacity-60 cursor-not-allowed' : 'text-cyan-400 hover:text-cyan-300'}`}
                                                                >
                                                                    {isSaving ? 'Saving…' : (savedRecently ? 'Saved' : 'Save')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )
                }
            </div>




            {/* Alert History */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-xl font-semibold ${colors.text}`}>Alert History</h2>
                    {alertsLoading && <div className="text-sm text-muted">Loading history…</div>}
                </div>

                <div className={`${colors.cardBg} border ${colors.cardBorder} rounded-xl overflow-hidden`}>
                    <table className="w-full">
                        <thead className={colors.tableBg}>
                            <tr>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Timestamp</th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Type</th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Device</th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Message</th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Status</th>
                                <th className={`px-6 py-3 text-right text-xs font-medium ${colors.textTertiary} uppercase`}>Action</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${colors.cardBorder}`}>
                            {alerts.map((a, index) => {
                                const isAcking = acknowledgingIds.includes(a.id);
                                return (
                                    <tr key={index} className={colors.hoverBg}>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${colors.textTertiary}`}><SafeDate date={a.timestamp} /></td>
                                        <td className={`px-6 py-4 whitespace-nowrap`}>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAlertColor(a.type)}`}>{a.type}</span>
                                        </td>
                                        <td className={`px-6 py-4 text-sm ${colors.textTertiary}`}>{a.device}</td>
                                        <td className={`px-6 py-4 text-sm ${colors.text}`}>{a.message}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap`}>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${a.acknowledged ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                {a.acknowledged ? 'Acknowledged' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-right`}>
                                            {!a.acknowledged && (
                                                <button
                                                    onClick={() => acknowledgeAlert(a.id)}
                                                    disabled={isAcking}
                                                    className={`text-sm font-medium ${isAcking ? 'opacity-60 cursor-not-allowed' : 'text-cyan-400 hover:text-cyan-300'}`}
                                                >
                                                    {isAcking ? 'Acknowledging…' : 'Acknowledge'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {alerts.length === 0 && !alertsLoading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-neutral-500">No alerts in history</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AlertsPage;
