# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Il pubblico primario dell'area gestionale è il titolare dello studio o una persona di segreteria. La dashboard viene consultata soprattutto da desktop e tablet durante la giornata lavorativa; il flusso mobile resta essenziale per gestire rapidamente una prenotazione anche fuori dallo studio. I professionisti del team usano un portale separato e limitato al proprio ambito operativo.

## Product Purpose

Prenota24 è un gestionale multi-tenant per studi che lavorano su appuntamento. Riunisce agenda, appuntamenti, clienti, professionisti, servizi ed eventi, con prenotazione pubblica e un portale dedicato ai professionisti. Il successo consiste nel capire subito lo stato della giornata e completare le operazioni ricorrenti con poco attrito e senza perdere il contesto.

## Positioning

Prenota24 collega nello stesso workspace operativo la gestione interna dello studio, la prenotazione pubblica e il lavoro del singolo professionista, mantenendo ruoli e dati separati per studio.

## Operating Context

L'uso principale avviene durante giornate di lavoro frammentate: tra telefonate, clienti presenti, cambi di orario e richieste da confermare. Le attività ricorrenti sono consultare l'agenda, creare o modificare una prenotazione, confermare richieste, trovare un cliente e coordinare il team. Fuori dallo studio le stesse azioni devono restare semplici su mobile.

## Capabilities and Constraints

- Due ruoli autenticati: `ADMIN` e `PROFESSIONAL`, con percorsi e API distinti.
- Tutti i dati appartengono a uno studio e devono restare isolati per tenant.
- Gli appuntamenti seguono una macchina a stati vincolante; la UI non deve suggerire transizioni non consentite.
- L'interfaccia è in italiano e gestisce date e orari nel fuso dello studio.
- Il frontend è Angular standalone, TypeScript strict, Signals/RxJS e Tailwind CSS.
- La dashboard amministratore è la prima superficie del redesign; le decisioni riuscite dovranno diventare un sistema riutilizzabile nelle altre sezioni.

## Brand Commitments

Il nome Prenota24 resta invariato. L'identità visiva attuale può essere sostituita integralmente. La nuova esperienza deve essere moderna, snella e piacevole nell'uso quotidiano, evitando pattern visivi e UX riconoscibili come generici o generati da AI.

## Evidence on Hand

Il repository contiene flussi e contenuti reali per dashboard, agenda, appuntamenti, clienti, professionisti, servizi, eventi, impostazioni, prenotazione pubblica e portale professionista. Non sono presenti in questo progetto prove commerciali, testimonial o asset di brand vincolanti da inventare o preservare.

## Product Principles

- Far emergere prima ciò che richiede attenzione, poi il resto del contesto.
- Ridurre il costo delle operazioni frequenti senza nascondere stato e conseguenze.
- Progettare per sessioni interrotte e riprese rapidamente.
- Mantenere desktop, tablet e mobile pienamente operativi secondo il loro contesto d'uso.
- Trasformare le decisioni della dashboard in regole e componenti riutilizzabili nell'intero prodotto.

## Accessibility & Inclusion

Navigazione da tastiera, focus visibile, semantica assistiva, contrasto leggibile e target touch adeguati sono requisiti trasversali. La versione mobile non deve perdere azioni o informazioni disponibili su desktop.
