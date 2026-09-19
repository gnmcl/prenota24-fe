---
target: layout Agenda dal screenshot fornito
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-05T16-58-09Z
slug: src-app-features-agenda-agenda-component-ts
---
Method: dual-agent (A: /root/agenda_design_review · B: /root/agenda_detector_evidence)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibilità dello stato | 2/4 | Data e modalità sono chiare, ma alle 18:52 la vista parte ancora dalle 07:00 e l’indicatore dell’ora non si aggiorna. |
| 2 | Corrispondenza col mondo reale | 3/4 | La griglia giorno/professionista è naturale; `ago · 0` e i segnali di carico sono meno immediati. |
| 3 | Controllo e libertà | 3/4 | Navigazione data completa, ma manca un salto operativo a “ora” o al prossimo appuntamento. |
| 4 | Coerenza e standard | 3/4 | Il sistema visivo è coerente; i due CTA Prenotazione competono e usano nomi diversi. |
| 5 | Prevenzione errori | 3/4 | Verifica e conferma dello slot sono valide; lo snapping a 15 minuti è invisibile prima del click. |
| 6 | Riconoscimento, non memoria | 3/4 | Contesto e legende sono visibili, ma significato del carico e comportamento degli slot richiedono micro-legende. |
| 7 | Flessibilità ed efficienza | 2/4 | Buono per mouse, debole per tastiera e per chi deve tornare rapidamente al momento corrente. |
| 8 | Estetica e minimalismo | 3/4 | Il registro è distintivo; banda vuota, hatching dominante e chrome verticale riducono l’efficienza. |
| 9 | Riconoscimento e recupero errori | 2/4 | Il retry è chiaro, ma feedback e verifica sono lontani dallo slot selezionato. |
| 10 | Aiuto e documentazione | 1/4 | Le istruzioni sono minime e non spiegano snapping, soglie e interazione da tastiera. |
| **Totale** | | **25/40** | **Accettabile — base forte, miglioramenti significativi necessari** |

## Design Specificity Verdict

**Valutazione visiva:** specificità alta, circa 8/10. Registro continuo, hairline tecniche, asse orario tabulare, colonne per professionista e indisponibilità tratteggiate appartengono chiaramente a Prenota24. Non sembra una dashboard generica.

**Scan deterministico:** 0 finding su `agenda.component.ts` e `agenda.component.html`. La scansione pulita non intercetta però quattro problemi reali: contrasto basato su token/opacità, target dinamici troppo piccoli, click Angular su `div` non interattivo e indicatore temporale non reattivo.

**Evidenza visiva:** usato lo screenshot desktop fornito. Nessun overlay browser è stato iniettato; mobile, hover, focus e comportamento sticky durante lo scroll non sono dimostrabili dalla singola immagine.

## Impressione generale

Il linguaggio visivo è centrato e più maturo della versione precedente. La maggiore opportunità è trasformare la schermata da “griglia completa della giornata” a “strumento che mi porta subito a ciò che conta adesso”. Nella cattura la parte utile comincia molto in basso e la giornata visibile è lontana dall’ora corrente.

## Cosa funziona

- L’identità “Registro di coordinamento” è leggibile: piatta, densa, ordinata e specifica per uno studio.
- L’orientamento è forte: data, settimana, modalità e colonne staff costruiscono un modello spaziale coerente.
- Gli stati di caricamento, errore, disponibilità, verifica e conferma mostrano buona attenzione operativa.

## Problemi prioritari

### [P1] Troppo spazio prima della griglia utile

**Perché conta:** nella prima viewport quasi 700px sono occupati da header, settimana, due legende, intestazioni e una banda vuota. Il calendario sembra parzialmente scarico e rimane poco spazio per lavorare.

**Fix:** rimuovere la banda causata dall’intestazione `sticky top-16` dentro il contenitore `overflow-x-auto`; separare sticky verticale e scorrimento orizzontale oppure usare `top-0` nel corretto scrollport. Accorpare legenda servizi e legenda disponibilità in una sola utility row e ridurre la duplicazione della data nel pannello.

**Suggested command:** `/impeccable layout agenda`

### [P1] La vista non porta al momento operativo

**Perché conta:** lo screenshot è delle 18:52 ma mostra 07:00–11:30; la linea dell’ora corrente è fuori viewport. Inoltre `currentTimeLabel` e posizione sono calcolati una volta e poi restano congelati.

**Fix:** al primo ingresso su oggi, scorrere al prossimo appuntamento oppure a `ora − 30 min`; non forzare nuovamente lo scroll dopo un movimento manuale. Aggiungere un comando “Ora” e aggiornare linea/etichetta con un segnale temporizzato ogni minuto.

**Suggested command:** `/impeccable harden agenda`

### [P1] Creazione slot non accessibile e target appuntamenti troppo piccoli

**Perché conta:** l’overlay cliccabile è un `div` non raggiungibile da tastiera. Un appuntamento di 15 minuti produce un link alto 15px, sotto il minimo WCAG di 24px e molto sotto un target touch confortevole.

**Fix:** introdurre slot focusabili con roving tabindex, preview visibile dell’orario su hover/focus e feedback ancorato allo slot. Per appuntamenti brevi mantenere la geometria temporale, ma offrire una hit-area minima o un target alternativo accessibile senza sovrapporre gli eventi.

**Suggested command:** `/impeccable audit agenda`

### [P2] Gerarchia delle azioni duplicata

**Perché conta:** `Prenotazione`, `Nuova prenotazione` e il toggle Calendario usano contemporaneamente il cobalto. Tre elementi sembrano primari.

**Fix:** mantenere un solo CTA desktop. Il comando pagina può restare su mobile oppure diventare contestuale alla data/professionista selezionati. Rendere il toggle vista un controllo secondario neutro.

**Suggested command:** `/impeccable distill agenda`

### [P2] Microtesto e hatching riducono la leggibilità

**Perché conta:** `--text-tertiary` misura circa 3.8:1 sulla superficie chiara; le mezze ore con `opacity-60` scendono circa a 1.95:1. Il tratteggio esteso domina visivamente gli slot disponibili.

**Fix:** portare le informazioni operative a 12px, aumentare il contrasto del token tertiary o usare secondary, eliminare opacità sui testi selezionati e rendere il tratteggio più leggero e meno fitto.

**Suggested command:** `/impeccable typeset agenda`

## Carico cognitivo ed esperienza

Carico moderato: 3/8 failure, soprattutto focus singolo, minimal choices e progressive disclosure. La settimana a sette giorni è convenzionale; il peso superfluo arriva dai CTA duplicati, dalle legende permanenti e dalla tela completa 07:00–21:00.

Il primo impatto è calmo e affidabile. La valle emotiva è la combinazione di spazio vuoto e grandi aree “non prenotabili”, che fa apparire l’agenda bloccata prima che utile. La conferma dello slot recupera fiducia, ma il testo sulla “verifica definitiva” indebolisce il valore della verifica appena eseguita.

## Persona red flags

- **Alex, power user:** niente salto a ora/prossimo appuntamento, nessuna scorciatoia e flusso principale non navigabile da tastiera.
- **Sam, keyboard/low vision:** overlay slot non focusabile, microtesti sotto contrasto AA, appuntamenti brevi con target fino a 15px e probabile difficoltà a zoom 200%.
- **Casey, mobile distratto:** settimana e staff richiedono doppio scroll orizzontale, i target da 32–36px sono piccoli e il CTA principale resta lontano dalla thumb zone.

## Osservazioni minori

- `ago · 0` è compatto ma meno chiaro di `0 app.`.
- La legenda carico permanente aggiunge altezza nonostante i conteggi siano già visibili.
- La colonna oraria dovrebbe restare sticky anche durante lo scroll orizzontale.
- Sovrapposizioni tra appuntamenti dello stesso professionista non sembrano gestite side-by-side.
- La sticky header dentro `overflow-x-auto` è un rischio concreto da verificare durante lo scroll.

## Domande da considerare

- Oggi deve aprirsi sull’ora corrente, sul prossimo appuntamento o sulla prima richiesta irrisolta?
- La domanda primaria della pagina è “chi viene adesso?” oppure “dove posso inserire una prenotazione?”
- Il carico settimana merita davvero una legenda permanente se il conteggio è già visibile?
