# Home pubblica · Surface brief

## Mode

Persuade. Presentare a chi gestisce uno studio il collegamento fra prenotazione pubblica, agenda e portale professionista, per accompagnarlo alla creazione dello studio o all’accesso.

## Composition

Composizione `home-register-20260925`, approvata dall’utente con «procedi» dopo la proposta della struttura:

- Header con marchio Prenota24, collegamento «Come funziona» da 640px e accesso.
- Titolo allineato a sinistra, spiegazione concisa e «Crea il tuo studio»; registro dimostrativo a tutta larghezza subito sotto.
- Tre righe raccontano la prenotazione dal punto di vista di cliente, studio e professionista.
- Elenco essenziale di clienti, servizi, disponibilità ed eventi; invito finale e footer con privacy.

## Visual contract

Estensione del [sistema esistente](../../DESIGN.md), senza nuova identità né immagini. Public Sans, carta tecnica, superfici piatte e hairline restano il riferimento. Cobalto per azione e selezione; verde registro nel marchio e nel conteggio da confermare. Titolo pubblico `clamp(2rem, 4vw, 3.25rem)`, dati dimostrativi 11–13px, titolo dettaglio 22px. Il contenitore raggiunge 1200px.

## Interaction contract

- Tre appuntamenti locali sono dichiarati «Esempio con dati dimostrativi»; non rappresentano dati dello studio o prove commerciali.
- La richiesta delle 10:00 è selezionata inizialmente. Ogni riga è un pulsante accessibile con stato premuto e seleziona il relativo dettaglio; non modifica appuntamenti.
- Da 1024px il dettaglio occupa una colonna laterale da 310px. Sotto questa soglia appare subito dopo la riga selezionata; su mobile professionista e stato restano leggibili sotto il cliente.
- Il dettaglio annuncia gli aggiornamenti con una regione live cortese. Il link «Vai al contenuto» è visibile al focus.
- «Crea il tuo studio» porta a `/registrati`, «Accedi» a `/accedi`, «Come funziona» a `#come-funziona`, il marchio a `/` e «Privacy» a `/privacy`. Le CTA di navigazione usano `ActionLink`, con altezza minima 44px.

## Scope

La home usa `PageShell` con `publicLayout`: nessuna navigazione operativa o offset del gestionale, anche in presenza di una sessione autenticata. L’anteprima riusa `RegisterSurface`, `Button` e `Badge`; dati e selezione restano locali. Non introduce chiamate API, creazione di prenotazioni, prezzi commerciali o testimonial. I flussi autenticati e la prenotazione pubblica dello studio restano destinazioni separate.

Fonti: [home](../../src/app/features/home/home.component.ts), [anteprima](../../src/app/features/home/home-agenda-preview.component.ts), [ActionLink](../../src/app/shared/components/action-link/action-link.component.ts), [PageShell](../../src/app/shared/components/page-shell/page-shell.component.ts).
