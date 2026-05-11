# Agenda Medica

Portale di prenotazione per studio medico. React + Firebase Firestore.

## Setup locale

```bash
npm install
npm run dev
```

## Deploy su Vercel

1. Push su GitHub
2. Vai su vercel.com → New Project → importa il repo
3. Aggiungi la variabile d'ambiente:
   - `VITE_ADMIN_PASSWORD` = la tua password segreteria
4. Deploy automatico

## Variabili d'ambiente

Copia `.env.example` in `.env` e modifica:
```
VITE_ADMIN_PASSWORD=la_tua_password
```

## Struttura Firestore

- `pazienti` — pazienti abilitati alla prenotazione
- `sessioni` — giorni disponibili (generate automaticamente)
- `prenotazioni` — prenotazioni effettuate

## Primo utilizzo

1. Accedi al pannello Segreteria
2. Vai su Pazienti → carica il file Excel con i 1500 pazienti
3. Le sessioni vengono create automaticamente per i prossimi 14 giorni lavorativi
4. Invia il link ai pazienti

## Orario studio

- Lunedì / Venerdì: 16:00 – 19:00
- Martedì / Mercoledì / Giovedì: 08:00 – 11:00
- 6 pazienti per ora, ogni 10 minuti
