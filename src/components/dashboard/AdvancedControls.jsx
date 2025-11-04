import React from 'react';

export default function AdvancedControls({
    colors, controlsOpen, setControlsOpen, resetControls,
    maxPoints, setMaxPoints,
    corrosionThreshold, setCorrosionThreshold,
    metalLossThreshold, setMetalLossThreshold,
    resistanceThresholdMin, setResistanceThresholdMin,
    resistanceThresholdMax, setResistanceThresholdMax,
    outlierCount
}) {
    return (
        <div id="advanced-controls" className={`${controlsOpen ? 'block' : 'hidden'} mb-6`}>
            <div className={`p-4 rounded-xl border ${colors.cardBorder} ${colors.cardBg}`}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-md font-semibold ${colors.text}`}>Threshold Settings & Chart Controls</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={resetControls} className="px-3 py-1 rounded-md border text-sm">Reset</button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[180px]">
                        <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Max Chart Points</label>
                        <input type="number" value={maxPoints} onChange={(e) => setMaxPoints(parseInt(e.target.value) || 100)} min="10" max="1000" className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500`} />
                    </div>

                    <div className="flex-1 min-w-[180px]">
                        <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Corrosion Threshold (mpy)</label>
                        <input type="number" step="0.001" value={corrosionThreshold} onChange={(e) => setCorrosionThreshold(e.target.value)} placeholder="e.g., 5.000" className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500`} />
                    </div>

                    <div className="flex-1 min-w-[180px]">
                        <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Metal Loss Threshold (mils)</label>
                        <input type="number" step="0.000001" value={metalLossThreshold} onChange={(e) => setMetalLossThreshold(e.target.value)} placeholder="e.g., 0.001000" className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500`} />
                    </div>

                    <div className="flex-1 min-w-[180px]">
                        <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Min Expo Units</label>
                        <input type="number" step="0.01" value={resistanceThresholdMin} onChange={(e) => setResistanceThresholdMin(e.target.value)} placeholder="e.g., 10.00" className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500`} />
                    </div>

                    <div className="flex-1 min-w-[180px]">
                        <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Max Expo Units</label>
                        <input type="number" step="0.01" value={resistanceThresholdMax} onChange={(e) => setResistanceThresholdMax(e.target.value)} placeholder="e.g., 1000.00" className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500`} />
                    </div>
                </div>

                {(corrosionThreshold || metalLossThreshold || resistanceThresholdMin || resistanceThresholdMax) && (
                    <div className={`mt-3 px-4 py-2 ${colors.cardBg} border border-amber-500/30 rounded-lg`}>
                        <p className="text-sm text-amber-400">⚠️ Chart shows sampled data ({maxPoints} max points). All {outlierData.length} outliers are listed in the Critical Outliers table below.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
