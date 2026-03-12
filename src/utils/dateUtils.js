export const getWeekId = (offset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + (offset * 7));
    d.setHours(0, 0, 0, 0);
    // Adjust to Thursday to get correct ISO week
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

export const getMonthId = (offset = 0) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${month}`;
};

export const formatWeekLabel = (offset) => {
    if (offset === 0) return "Semana Actual";
    return offset > 0 ? `+${offset} Semanas` : `${offset} Semanas`;
};
