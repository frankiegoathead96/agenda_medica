// ─── STUDIO SCHEDULE ──────────────────────────────────────────────────────────
// Lunedì/Venerdì: 16:00–19:00
// Martedì/Mercoledì/Giovedì: 08:00–11:00
// 6 patients per hour, every 10 minutes = 18 slots per day

export const SCHEDULE = {
  1: { start: 16, hours: 3, label: "Lunedì" },    // Monday 16-19
  2: { start:  8, hours: 3, label: "Martedì" },   // Tuesday 8-11
  3: { start:  8, hours: 3, label: "Mercoledì" }, // Wednesday 8-11
  4: { start:  8, hours: 3, label: "Giovedì" },   // Thursday 8-11
  5: { start: 16, hours: 3, label: "Venerdì" },   // Friday 16-19
};

export const MONTH_NAMES = [
  "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
  "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
];

export function getSlotsForDow(dow) {
  const cfg = SCHEDULE[dow];
  if (!cfg) return [];
  const slots = [];
  for (let h = 0; h < cfg.hours; h++) {
    for (let m = 0; m < 6; m++) {
      const hr = cfg.start + h;
      const mn = m * 10;
      slots.push(`${String(hr).padStart(2,"0")}:${String(mn).padStart(2,"0")}`);
    }
  }
  return slots;
}

export function getNext14Workdays() {
  const days = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  let checked = 0;
  while (days.length < 14 && checked < 60) {
    const dow = d.getDay();
    if (SCHEDULE[dow]) {
      days.push({
        date: d.toISOString().split("T")[0],
        dow,
        slots: getSlotsForDow(dow),
      });
    }
    d.setDate(d.getDate() + 1);
    checked++;
  }
  return days;
}

export function fmtFull(s) {
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString("it-IT", {
    weekday: "long", day: "numeric", month: "long"
  });
}

export function fmtShort(s) {
  return new Date(s + "T12:00:00").toLocaleDateString("it-IT", {
    day: "numeric", month: "short"
  });
}
