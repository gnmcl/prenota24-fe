---
name: Prenota24
description: Un registro operativo continuo per coordinare la giornata dello studio.
colors:
  cobalt: "#315CF4"
  cobalt-deep: "#2345C8"
  register-green: "#B8F34A"
  technical-paper: "#F5F6F2"
  work-surface: "#FBFCF8"
  charcoal: "#171A1F"
  secondary-text: "#5B625A"
  hairline: "#D5D8D0"
typography:
  headline:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.55rem, 2vw, 2.1rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  status: "2px"
  control: "6px"
  container: "8px"
spacing:
  hairline: "1px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "#FFFFFF"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  register-surface:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.charcoal}"
    rounded: "0px"
---

# Design System: Prenota24

## Overview

**Creative North Star: “Registro di coordinamento”**

Prenota24 tratta il lavoro quotidiano dello studio come un unico registro operativo, non come una collezione di widget. Il sistema è moderno perché riduce rumore, profondità artificiale e cambi di contesto: la densità resta alta, ma ogni separazione ha una funzione.

La scena d’uso è una scrivania illuminata durante l’intera giornata. Il fondo chiaro tecnico, le hairline e la tipografia compatta favoriscono la lettura continuativa su desktop e tablet; su mobile lo stesso registro diventa una sequenza lineare con dettaglio in-place.

**Key Characteristics:** superfici continue, gerarchia tipografica stretta, accento cobalto funzionale, verde registro raro, dati tabulari, geometria quasi squadrata, nessuna decorazione senza compito.

## Colors

La palette è un foglio tecnico freddo segnato da cobalto operativo e verde di registrazione.

- **Cobalto operativo** (`#315CF4`): azione primaria, selezione, ora corrente e focus.
- **Verde registro** (`#B8F34A`): conteggi che richiedono attenzione e piccoli segni di presenza; non è una superficie decorativa.
- **Carta tecnica** (`#F5F6F2`) e **superficie di lavoro** (`#FBFCF8`): fondo e aree operative.
- **Carbone** (`#171A1F`): testo principale e contrasto strutturale.
- **Hairline** (`#D5D8D0`): griglia, divisioni e confini.

**The Functional Accent Rule.** Il cobalto indica azione o stato attivo; il verde registro indica attenzione o presenza. Nessuno dei due colora regioni inattive.

## Typography

Public Sans è l’unica famiglia. È un carattere da lavoro con cifre tabulari abilitate globalmente; non esiste una voce display separata.

- **Headline:** 600, `clamp(1.55rem, 2vw, 2.1rem)`, tracking `-0.035em`; solo titoli di pagina.
- **Title:** 600, 14–16px; intestazioni di registro e pannello.
- **Body:** 400–600, 14px; nomi, azioni e contenuto operativo.
- **Label:** 600, 10px, tracking `0.08em`, uppercase; colonne, termini e misure.
- **Data:** usa `tabular-nums`; orari e durate devono allinearsi verticalmente.

## Layout

La shell usa un rail da 72px sui tablet e 240px su desktop ampio, con utility bar alta 56–64px. La dashboard ha una larghezza massima di 1500px, indice settimanale orizzontale e una griglia principale registro/contesto da `1fr + 300–330px`.

Le superfici a registro si toccano: un contenitore hairline esterno e separatori da 1px sostituiscono gap e card flottanti. A meno di 1024px il pannello contestuale si apre subito sotto la riga selezionata. Su mobile la navigazione primaria è fissa in basso, le azioni principali sono full-width e l’indice settimanale scorre orizzontalmente senza comprimere i giorni.

## Elevation & Depth

Il sistema è piatto. Le superfici si distinguono con variazioni tonali, bordi hairline e stato selezionato; le ombre sono `none`. Dropdown e overlay devono usare confine e posizione, non aloni o vetro.

## Shapes

I badge usano 2px, i controlli 6px e i contenitori legacy al massimo 8px. `RegisterSurface` non ha raggio: la sua forma nasce dalla griglia condivisa. Evitare pill salvo affordance native che richiedano espressamente una capsula.

## Components

### Buttons

I pulsanti hanno altezza 36–40px, bordo da 1px e raggio 6px. Primary è cobalto con testo bianco; secondary usa la superficie di lavoro e bordo neutro; ghost è trasparente. Hover cambia tono, focus usa un anello cobalto da 2px, disabled riduce opacità e blocca il cursore.

### Badges

Badge compatti, quasi squadrati, con bordo dello stesso colore al 20%. Comunicano uno stato reale; non sono etichette decorative.

### Register Surface

`<app-register-surface>` è la primitiva per agenda, attenzione, dettaglio, eventi e calendario quando devono formare un’unica superficie. Non aggiunge padding, bordo, raggio o ombra: questi appartengono alla griglia che coordina i moduli.

### Navigation

Icone SVG outline a 1.6–1.65px, testo 13px, stato attivo cobalto su fondo azzurro tenue. Tablet mostra il rail icon-only; mobile usa cinque destinazioni in basso e un menu per l’inventario completo.

### Appointment Ledger

Le righe sono ordinate per orario e allineano ora, cliente/servizio, staff, stato e durata. La selezione usa fondo cobalto tenue; una hairline cobalto con etichetta tabulare mostra l’ora corrente. Il dettaglio non apre un modal: resta accanto al registro o si espande sotto la riga su mobile.

## Do's and Don'ts

### Do

- **Do** usare griglie hairline continue per informazioni coordinate.
- **Do** mantenere azioni, stato e contenuto visibili senza cambio di contesto.
- **Do** progettare prima la sequenza mobile, poi il rail tablet e la griglia desktop.
- **Do** riusare token e primitive shared prima di estendere il sistema alle altre sezioni.

### Don't

- **Don't** costruire dashboard con mosaici KPI, card flottanti o card annidate.
- **Don't** usare gradienti, glassmorphism, glow, ombre decorative o grafici finti.
- **Don't** riempire l’interfaccia di pill, icone in riquadri o accenti colorati inattivi.
- **Don't** usare emoji o glifi Unicode come sistema di icone; usare SVG coerenti.
