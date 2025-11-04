// src/components/dashboard/useDashboardData.js
import { useMemo } from 'react';
import { parseNumberSafe } from '../utils/formatters';

const toDate = (v) => (v instanceof Date ? v : (v ? new Date(v) : null));

export default function useDashboardData({
    data,
    selectedDevice,
    dateFrom,
    dateTo,
    maxPoints = 100,
    corrosionThreshold,
    metalLossThreshold,
    resistanceThresholdMin,
    resistanceThresholdMax,
    tablePage = 1,
    readingsPerPage = 20,
    outliersPerPage = 50,
}) {
    const hasDateRange = !!(dateFrom && dateTo);

    const deviceFiltered = useMemo(() => {
        if (!data || !Array.isArray(data) || !selectedDevice) return [];
        return data.filter(d => d.device_id === selectedDevice).map(d => ({
            ...d,
            __ts: toDate(d.data_timestamp),
        }));
    }, [data, selectedDevice]);

    const filteredWithDates = useMemo(() => {
        if (!deviceFiltered || deviceFiltered.length === 0) return { filtered: [], sortedAsc: [], sortedDesc: [] };

        let arr = deviceFiltered;
        if (dateFrom) {
            const fromDate = new Date(dateFrom); fromDate.setHours(0, 0, 0, 0);
            arr = arr.filter(d => d.__ts && d.__ts >= fromDate);
        }
        if (dateTo) {
            const toDate = new Date(dateTo); toDate.setHours(23, 59, 59, 999);
            arr = arr.filter(d => d.__ts && d.__ts <= toDate);
        }

        const sortedAsc = [...arr].sort((a, b) => (a.__ts ? a.__ts.getTime() : 0) - (b.__ts ? b.__ts.getTime() : 0));
        const sortedDesc = [...sortedAsc].slice().reverse();
        return { filtered: arr, sortedAsc, sortedDesc };
    }, [deviceFiltered, dateFrom, dateTo]);

    const tableData = useMemo(() => {
        const sortedDesc = filteredWithDates.sortedDesc;
        if (!sortedDesc || sortedDesc.length === 0) return [];
        const maxRows = tablePage * readingsPerPage;
        return sortedDesc.slice(0, maxRows);
    }, [filteredWithDates.sortedDesc, tablePage, readingsPerPage]);

    const { chartData, outlierData, stats } = useMemo(() => {
        const filtered = filteredWithDates.filtered;
        const sortedAsc = filteredWithDates.sortedAsc;
        if (!hasDateRange || !filtered || filtered.length === 0) {
            return { chartData: [], outlierData: [], stats: null };
        }

        const cThresh = corrosionThreshold ? parseFloat(corrosionThreshold) : null;
        const mThresh = metalLossThreshold ? parseFloat(metalLossThreshold) : null;
        const rMin = resistanceThresholdMin ? parseFloat(resistanceThresholdMin) : null;
        const rMax = resistanceThresholdMax ? parseFloat(resistanceThresholdMax) : null;

        // detect outlier indices
        const outlierIndices = new Set();
        sortedAsc.forEach((d, idx) => {
            const corrosion = parseNumberSafe(d.data_corrosion_rate);
            const metalLoss = parseNumberSafe(d.data_metal_loss);
            const resistance = parseNumberSafe(d.data_probe_resistance);
            const isOutlier =
                (cThresh !== null && corrosion > cThresh) ||
                (mThresh !== null && metalLoss > mThresh) ||
                (rMin !== null && resistance < rMin) ||
                (rMax !== null && resistance > rMax);
            if (isOutlier) outlierIndices.add(idx);
        });

        const maxPts = Math.max(10, Math.min(1000, Number(maxPoints) || 100));
        let sampled = [];
        if (sortedAsc.length <= maxPts) {
            sampled = sortedAsc.map((d, idx) => ({ d, idx, isOutlier: outlierIndices.has(idx) }));
        } else {
            const step = Math.max(1, Math.floor(sortedAsc.length / maxPts));
            sampled = sortedAsc
                .filter((_, i) => i % step === 0 || i === sortedAsc.length - 1)
                .map(d => {
                    const idx = sortedAsc.indexOf(d);
                    return { d, idx, isOutlier: outlierIndices.has(idx) };
                });
        }

        const chartData = sampled.map(({ d, idx, isOutlier }) => {
            const ts = d.__ts;
            const corrosion = parseNumberSafe(d.data_corrosion_rate);
            const metalLoss = parseNumberSafe(d.data_metal_loss);
            const resistance = parseNumberSafe(d.data_probe_resistance);
            return {
                id: d.id ?? idx,
                timestamp: ts ? ts.toISOString() : null,
                dateLabel: ts ? ts.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
                fullTimestamp: ts ? ts.toLocaleString() : '—',
                corrosion,
                metalLoss,
                resistance,
                device_id: d.device_id,
                isOutlier,
                isCorrosionOutlier: cThresh !== null && corrosion > cThresh,
                isMetalLossOutlier: mThresh !== null && metalLoss > mThresh,
                isResistanceOutlier: (rMin !== null && resistance < rMin) || (rMax !== null && resistance > rMax),
            };
        });

        const outlierData = filtered
            .map(d => {
                const corrosion = parseNumberSafe(d.data_corrosion_rate);
                const metalLoss = parseNumberSafe(d.data_metal_loss);
                const resistance = parseNumberSafe(d.data_probe_resistance);
                const violations = [];
                if (cThresh !== null && corrosion > cThresh) violations.push(`Corrosion: ${corrosion.toFixed(3)} > ${cThresh}`);
                if (mThresh !== null && metalLoss > mThresh) violations.push(`Metal Loss: ${metalLoss.toFixed(6)} > ${mThresh}`);
                if (rMin !== null && resistance < rMin) violations.push(`Resistance: ${resistance.toFixed(2)} < ${rMin}`);
                if (rMax !== null && resistance > rMax) violations.push(`Resistance: ${resistance.toFixed(2)} > ${rMax}`);
                return violations.length > 0 ? { ...d, violations } : null;
            })
            .filter(Boolean)
            .sort((a, b) => new Date(b.data_timestamp) - new Date(a.data_timestamp));

        const sortedDesc = filteredWithDates.sortedDesc;
        const latestReading = sortedDesc && sortedDesc.length ? sortedDesc[0] : null;
        const stats = latestReading ? {
            latestCorrosion: parseNumberSafe(latestReading.data_corrosion_rate).toFixed(3),
            latestMetalLoss: parseNumberSafe(latestReading.data_metal_loss).toFixed(6),
            latestBattery: parseNumberSafe(latestReading.data_battery_percentage),
            latestTimestamp: latestReading.__ts || latestReading.data_timestamp,
            activeProbes: filtered.filter(d => d.data_probe_status === 1).length,
            totalReadings: filtered.length,
            outlierCount: outlierData.length
        } : null;

        return { chartData, outlierData, stats };
    }, [
        filteredWithDates.filtered,
        filteredWithDates.sortedAsc,
        filteredWithDates.sortedDesc,
        hasDateRange,
        maxPoints,
        corrosionThreshold,
        metalLossThreshold,
        resistanceThresholdMin,
        resistanceThresholdMax
    ]);

    return {
        devices: [], // caller can derive devices from deviceList; kept here for symmetry
        filtered: filteredWithDates.filtered,
        sortedAsc: filteredWithDates.sortedAsc,
        sortedDesc: filteredWithDates.sortedDesc,
        tableData,
        chartData,
        outlierData,
        stats,
    };
}
