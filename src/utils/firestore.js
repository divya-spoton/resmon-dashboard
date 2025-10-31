export const toDateSafe = (ts) => {
    if (!ts) return null;
    if (typeof ts.toDate === 'function') return ts.toDate();
    // if it's a number / ISO string
    const maybeDate = new Date(ts);
    return isNaN(maybeDate.getTime()) ? null : maybeDate;
};
