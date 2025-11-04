import React from 'react';

export default function Filters({
    devices = [],
    selectedDevice,
    setSelectedDevice,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    colors,
    setControlsOpen,
    controlsOpen
}) {
    return (
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
                    {devices.map(device => <option key={device} value={device}>{device}</option>)}
                </select>
            </div>

            <div className="flex-1 min-w-[200px]">
                <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>From Date</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500`} />
            </div>

            <div className="flex-1 min-w-[200px]">
                <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>To Date</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500`} />
            </div>

            <div className="flex items-center gap-2">
                <button onClick={() => setControlsOpen(c => !c)} className={`px-3 py-2 rounded-md border ${colors.cardBorder} ${colors.cardBg}`} aria-expanded={controlsOpen} aria-controls="advanced-controls">
                    {controlsOpen ? 'Hide Controls' : 'Show Controls'}
                </button>
            </div>
        </div>
    );
}
