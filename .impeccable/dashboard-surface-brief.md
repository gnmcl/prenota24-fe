# Dashboard generale

- Scope: route `/dashboard`; mode **Operate**.
- Audience: titolare dello studio o segretaria che coordina appuntamenti durante la giornata, soprattutto da desktop e tablet; gestione rapida fuori sede da mobile.
- Primary job: capire cosa richiede attenzione, leggere la giornata in ordine temporale e aprire una prenotazione senza perdere il contesto.
- Content: indice settimanale, registro verticale degli appuntamenti, richieste da confermare, calendario, eventi e dettaglio della prenotazione selezionata.
- Direction: **Registro di coordinamento**, composizione approvata B+C. B definisce l'ossatura a registro verticale; C definisce la selezione e il dettaglio contestuale.
- Memorable moment: la selezione di una riga collega visivamente agenda e dettaglio; su mobile il dettaglio si espande subito sotto la riga.
- Responsive: rail persistente e pannello contestuale su desktop; rail ridotto e pannello sostitutivo su tablet; navigazione inferiore e sequenza lineare su mobile.
- Constraints: preservare dati, ruoli, route e stati API; nessun raster finale, card flottanti, ombre, gradienti, glassmorphism, KPI mosaic, pill decorative o grafici finti.
- Approved comps: `.impeccable/mocks/dashboard-vertical-ledger.png`; `.impeccable/mocks/dashboard-context-desk.png`.
- Media inventory: navigazione, settimana, registro, linea dell'ora, coda richieste, dettaglio, calendario ed eventi sono HTML/CSS; icone SVG coerenti con il sistema; nessuna immagine raster nel prodotto.
- Unresolved: nessuna decisione bloccante; le azioni di stato restano nei flussi esistenti se non supportate in sicurezza dalla dashboard.
