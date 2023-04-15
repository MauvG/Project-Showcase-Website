export function getUTCDateFromLocal(date) {
    const originalDate = new Date(date);
    const utcDate = new Date(0);
    utcDate.setUTCDate(originalDate.getDate());
    utcDate.setUTCMonth(originalDate.getMonth());
    utcDate.setUTCFullYear(originalDate.getFullYear());
    return utcDate;
}