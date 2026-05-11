// ─── STUDIO SCHEDULE ──────────────────────────────────────────────────────────
// Lunedì/Venerdì: 16:00–19:00
// Martedì/Mercoledì/Giovedì: 08:00–11:00
// 6 patients per hour, every 10 minutes = 18 slots per day

export function getNext14Workdays() {
  const days = [];
  const now = new Date();
  // Use local date string to avoid timezone issues
  const todayStr = now.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
  const d = new Date(todayStr + "T12:00:00");
  d.setDate(d.getDate() + 1);
  let checked = 0;
  while (days.length < 14 && checked < 60) {
    const dow = d.getDay();
    if (SCHEDULE[dow]) {
      days.push({
        date: d.toLocaleDateString("en-CA"),
        dow,
        slots: getSlotsForDow(dow),
      });
    }
    d.setDate(d.getDate() + 1);
    checked++;
  }
  return days;
}
