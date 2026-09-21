# Offline Strategy

## Overview

Technician Portal v2 is designed with an offline-first approach. Field technicians frequently work in areas with limited or no connectivity. The application must function fully offline and synchronize data when connectivity is restored.

## Architecture

```
+------------------+       +------------------+       +------------------+
|   User Action    | ----> |  Offline Queue    | ----> |   API Service     |
|   (UI)           |       |  (localStorage/   |       |   (when online)  |
|                  |       |   IndexedDB)      |       |                  |
+------------------+       +------------------+       +------------------+
         |                        |
         |                        v
         |               +------------------+
         +------>--------|  Network Status   |
                         |  Monitor          |
                         +------------------+
```

## Network Status

- Tracked in `AppContext` as `networkStatus: 'online' | 'offline'`
- Monitored via `navigator.onLine` and `online`/`offline` events
- Displayed in Topbar as indicator badge
- Pages check network status before submitting data

## Offline Capabilities

### Currently Implemented
- **Network indicator** in Topbar (Online/Offline/Syncing)
- **GPS status** tracking in AppContext
- **Upload pending** flags displayed on photo/video upload pages
- **Offline sync warning** dialogs on data submission pages
- **Optimistic UI updates** - local state updated before server confirmation

### Ready for Implementation (Framework in Place)
- **Offline Queue** - The `AppContext` has `isSyncing` and `pendingSyncCount` fields ready
- **Background Sync** - When `networkStatus` changes from 'offline' to 'online', trigger sync
- **Cache Management** - Cache previously loaded jobs for offline viewing
- **Photo/Video Queue** - Queue evidence uploads for background sync

## Data That Must Work Offline

| Data | Strategy | Priority |
|---|---|---|
| Today's Jobs | Cache on app load | High |
| Job Details | Cache on view | High |
| Assigned Jobs | Cache on app load | High |
| Checklist State | Local mutations + sync | High |
| Service Notes | Local mutations + sync | High |
| Evidence Photos | Queue for upload | Medium |
| Evidence Videos | Queue for upload (large) | Medium |
| Signatures | Queue for upload | High |
| Messages | Live when online, queue when offline | Medium |
| Profile/Settings | Cache locally | Low |

## Offline UX Patterns

| State | UI Treatment |
|---|---|
| Online | Normal operation, green indicator |
| Offline | Yellow/red indicator, "Offline Mode" banner on data pages |
| Syncing | Spinning indicator, "Syncing..." text |
| Sync Failed | Error notification with retry action |
| GPS Disabled | Warning on navigation and evidence pages |
| Validation Error | Error state on form fields |
