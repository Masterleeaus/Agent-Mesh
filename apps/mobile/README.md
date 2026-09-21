# home_hub

home services app

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

Pass 7 adds the Titan Schedule & Dispatch full-page operational surface with job timeline, worker assignment and rescheduling routed through TitanGateway.


## Pass 8 — Titan Go field workflow
Added job detail, customer call/message actions, governed job status transitions (scheduled → en_route → arrived → in_progress → completed), job notes, checklist persistence commands, and direct evidence capture. Schedule cards open the operational job page. Mutations remain behind TitanGateway and are offline queueable where appropriate.


## Pass 9 — Commercial lifecycle
Added the minimum quote → approval → job completion → invoice → payment flow. The lifecycle is accessible from Job Detail and generative quote/payment cards, while mutations route through TitanGateway.


## Pass 10 — Customer context
Added lightweight customer records, multiple service addresses, call/SMS/email actions, contact history and generative customer cards. Customer detail remains invoked from conversation rather than becoming permanent CRM navigation.
