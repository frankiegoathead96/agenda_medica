// ─── STUDIO SCHEDULE ──────────────────────────────────────────────────────────
// Lunedì/Venerdì: 16:00–19:00
// Martedì/Mercoledì/Giovedì: 08:00–11:00
// 6 patients per hour, every 10 minutes = 18 slots per day

export const SCHEDULE = {
  1: { start: 16, hours: 3, label: "Lunedì" },
  2: { start:  8, hours: 3, label: "Martedì" },
  3: { start:  8, hours: 3, label: "Mercoledì" },
  4: { start:  8, hours: 3, label: "Giovedì" },
  5: { start: 16, hours: 3, label: "Venerdì" },
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
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA");
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

export function fmtFull(s) {
  return new Date(s + "T12:00:00").toLocaleDateString("it-IT", {
    weekday: "long", day: "numeric", month: "long"
  });
}

export function fmtShort(s) {
  return new Date(s + "T12:00:00").toLocaleDateString("it-IT", {
    day: "numeric", month: "short"
  });
}
