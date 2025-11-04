// src/utils/formatters.js
export const parseNumberSafe = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};
export const formatCorrosion = (v) => parseNumberSafe(v).toFixed(3);
export const formatMetalLoss = (v) => parseNumberSafe(v).toFixed(6);

export const tooltipFormatter = (value, name) => {
    if (name === 'Corrosion Rate' || name === 'corrosion') {
        return [`${parseNumberSafe(value).toFixed(3)} mpy`, name];
    }
    if (name === 'Metal Loss' || name === 'metalLoss') {
        return [`${parseNumberSafe(value).toFixed(6)} mils`, name];
    }
    if (name === 'Resistance' || name === 'resistance') {
        return [parseNumberSafe(value).toFixed(2), name];
    }
    return [value, name];
};
