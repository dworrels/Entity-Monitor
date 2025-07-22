export function formatToEST(dateString) {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        // Format: Thu, 26 Jun 1:40 PM
        return date.toLocaleString("en-US", {
            timeZone: "America/New_York",
            weekday: "short",
            day: "2-digit",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    } catch {
        return dateString;
    }
}


