import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, addDoc, serverTimestamp, writeBatch
} from "firebase/firestore";
import { db } from "./firebase";
import { getSlotsForDow, getNext14Workdays } from "./schedule";

// ─── PATIENTS ─────────────────────────────────────────────────────────────────

export async function verifyPatient({ codiceFiscale, nome, cognome, dataNascita }) {
  if (codiceFiscale) {
    const q = query(
      collection(db, "pazienti"),
      where("codiceFiscale", "==", codiceFiscale.toUpperCase().trim()),
      where("abilitato", "==", true)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  } else {
    const q = query(
      collection(db, "pazienti"),
      where("cognome", "==", cognome.trim()),
      where("nome", "==", nome.trim()),
      where("dataNascita", "==", dataNascita),
      where("abilitato", "==", true)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  }
}

export async function getAllPatients() {
  const snap = await getDocs(query(collection(db, "pazienti"), orderBy("cognome")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function togglePatient(id, abilitato) {
  await updateDoc(doc(db, "pazienti", id), { abilitato });
}

export async function importPatients(patients) {
  const batch = writeBatch(db);
  for (const p of patients) {
    const ref = doc(collection(db, "pazienti"));
    batch.set(ref, { ...p, abilitato: true, createdAt: serverTimestamp() });
  }
  await batch.commit();
}

// ─── SESSIONS ─────────────────────────────────────────────────────────────────

export async function getSessions() {
  const today = new Date().toISOString().split("T")[0];
  const q = query(
    collection(db, "sessioni"),
    where("data", ">=", today),
    orderBy("data")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllSessions() {
  const snap = await getDocs(query(collection(db, "sessioni"), orderBy("data")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Generate sessions for the next 14 workdays if they don't exist yet
export async function ensureSessions() {
  const workdays = getNext14Workdays();
  const batch = writeBatch(db);
  let created = 0;

  for (const wd of workdays) {
    const ref = doc(db, "sessioni", wd.date); // use date as ID
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      batch.set(ref, {
        data: wd.date,
        dow: wd.dow,
        allSlots: wd.slots,
        bookedSlots: [],
        attiva: true,
        note: "",
        createdAt: serverTimestamp(),
      });
      created++;
    }
  }

  if (created > 0) await batch.commit();
}

export async function toggleSession(id, attiva) {
  await updateDoc(doc(db, "sessioni", id), { attiva });
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

export async function getMyBooking(pazienteId) {
  const q = query(
    collection(db, "prenotazioni"),
    where("pazienteId", "==", pazienteId),
    where("stato", "==", "confermata")
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function getAllBookings() {
  const q = query(
    collection(db, "prenotazioni"),
    where("stato", "==", "confermata"),
    orderBy("data"),
    orderBy("ora")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createBooking(paziente, sessioneId, sessioneData, ora) {
  // Check patient doesn't already have a booking
  const existing = await getMyBooking(paziente.id);
  if (existing) throw new Error("Hai già una prenotazione attiva.");

  // Check slot is still free (race condition protection)
  const sessRef = doc(db, "sessioni", sessioneId);
  const sessSnap = await getDoc(sessRef);
  if (!sessSnap.exists()) throw new Error("Sessione non trovata.");
  const sessData = sessSnap.data();
  if (sessData.bookedSlots.includes(ora)) throw new Error("Questo orario è già stato prenotato.");

  // Create booking
  const bookingRef = await addDoc(collection(db, "prenotazioni"), {
    pazienteId: paziente.id,
    codiceFiscale: paziente.codiceFiscale,
    nome: paziente.nome,
    cognome: paziente.cognome,
    email: paziente.email || "",
    sessioneId,
    data: sessioneData,
    ora,
    stato: "confermata",
    createdAt: serverTimestamp(),
  });

  // Mark slot as booked
  await updateDoc(sessRef, {
    bookedSlots: [...sessData.bookedSlots, ora],
  });

  return bookingRef.id;
}

export async function cancelBooking(bookingId, pazienteId) {
  const bookRef = doc(db, "prenotazioni", bookingId);
  const bookSnap = await getDoc(bookRef);
  if (!bookSnap.exists()) throw new Error("Prenotazione non trovata.");
  const b = bookSnap.data();

  // Verify ownership
  if (b.pazienteId !== pazienteId) throw new Error("Non autorizzato.");

  // Update booking status
  await updateDoc(bookRef, { stato: "cancellata", cancelledAt: serverTimestamp() });

  // Free the slot
  const sessRef = doc(db, "sessioni", b.sessioneId);
  const sessSnap = await getDoc(sessRef);
  if (sessSnap.exists()) {
    const slots = sessSnap.data().bookedSlots.filter(o => o !== b.ora);
    await updateDoc(sessRef, { bookedSlots: slots });
  }
}

export async function adminCancelBooking(bookingId) {
  const bookRef = doc(db, "prenotazioni", bookingId);
  const bookSnap = await getDoc(bookRef);
  if (!bookSnap.exists()) return;
  const b = bookSnap.data();

  await updateDoc(bookRef, { stato: "cancellata", cancelledAt: serverTimestamp() });

  const sessRef = doc(db, "sessioni", b.sessioneId);
  const sessSnap = await getDoc(sessRef);
  if (sessSnap.exists()) {
    const slots = sessSnap.data().bookedSlots.filter(o => o !== b.ora);
    await updateDoc(sessRef, { bookedSlots: slots });
  }
}
