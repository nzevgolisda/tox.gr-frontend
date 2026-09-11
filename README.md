# tox.gr / tox.cy Frontend

## English

### What this repository contains

This repository is the browser frontend for the tox.gr / tox.cy social platform. It provides the HTML shell, the modular JavaScript application, and the styling used by the product UI.

The frontend is meant to run with the backend API that serves the application and stores the data. In this setup, the browser app is loaded from the root page and calls the API via `API_BASE` in [js/config.js](js/config.js).

### Frontend structure

- [index.html](index.html): page shell and module entry
- [app.js](app.js): top-level coordinator that binds the feature modules together
- [js/](js/): all functional modules
- [html/partials/](html/partials/): UI partials loaded into the page
- [styles/](styles/): shared tokens and design variables
- [style.css](style.css): global visual styles

### Module order and app flow

The app is intentionally organized in a predictable sequence:

1. Read DOM references and configuration
2. Define state and small helpers
3. Register event listeners
4. Define async action functions
5. Initialize on startup

This ordering is used in [app.js](app.js). The app dispatches `app-ready` after the partials are injected and then calls each feature initializer.

### Import and performance rules

This project uses browser ES modules, so imports should stay lean and intentional.

- Keep each module focused on one responsibility.
- Import only what is used.
- Do not keep dead imports just because they are convenient.
- Prefer a small set of well-defined helpers rather than repeated request logic.
- Keep initial startup code light; do not eagerly load unrelated feature logic when it is not needed.
- Favor central request helpers in [js/api.js](js/api.js) instead of duplicating API URLs and header setup in individual modules.

This is especially important for the first load, since the browser must parse the entire imported graph before the user can interact with the page.

### Request conventions

The shared request helper pattern is:

```js
const response = await fetch(apiUrl('/api/health'), {
  method: 'GET',
  headers: authHeaders()
});

const data = await response.json();
if (!response.ok) throw new Error(data.error || 'Request failed');
```

The project follows these rules:

- Use `fetch()` for HTTP requests.
- Use `apiUrl(path)` or the central request helper to avoid repeating the backend origin.
- Only attach auth headers when the endpoint requires authentication.
- For JSON requests, set `Content-Type: application/json` and use `JSON.stringify(...)`.
- For file uploads, use `FormData` and let the browser set the multipart boundary.
- Keep network logic inside the async action that triggered the UI flow.

### Main feature modules

- [js/auth.js](js/auth.js): login and auth modal behavior
- [js/chat.js](js/chat.js): chat sessions, history, and Gemini chat flow
- [js/feed.js](js/feed.js): posts, likes, comments, and public feed actions
- [js/messaging.js](js/messaging.js): friends, DMs, groups, and message polling
- [js/threads.js](js/threads.js): forum threads, replies, and moderation actions
- [js/notifications.js](js/notifications.js): notification badge and polling
- [js/profiles.js](js/profiles.js): profile views and avatars
- [js/presence.js](js/presence.js): online status polling
- [js/navigation.js](js/navigation.js): tab switching and mobile menu behavior
- [js/theme.js](js/theme.js): light/dark theme state
- [js/gifs.js](js/gifs.js): gif picker behavior
- [js/utils.js](js/utils.js): shared helpers such as escaping, time formatting, and debounce
- [js/dom.js](js/dom.js): minimal DOM selector helper
- [js/config.js](js/config.js): API base and shared constants
- [js/api.js](js/api.js): shared request headers and fetch wrapper

### Configuration and backend integration

The application expects the backend URL to be set in [js/config.js](js/config.js).

Current behavior is:

- `API_BASE` points to the deployed backend origin
- local same-origin development may use an empty base or a local backend URL depending on the environment
- the frontend does not duplicate the API host everywhere; requests should use the central helper

### Local development notes

This repo is not a standalone app server by itself. It is intended to be served by the matching backend project, which should expose the REST API and static assets.

For local work:

1. Start the backend project.
2. Confirm the frontend can reach the backend on the configured origin.
3. Check the main auth and chat flows in both logged-in and guest modes.
4. Verify any feature affected by the change in the browser before committing.

---

## Ελληνικά

### Τι περιέχει αυτό το repository

Αυτό το repository είναι το frontend του συστήματος tox.gr / tox.cy. Παρέχει το HTML shell, το modular JavaScript app και το styling του UI.

Το frontend τρέχει μαζί με το backend API που εξυπηρετεί την εφαρμογή και αποθηκεύει τα δεδομένα. Σε αυτή τη διαμόρφωση, το browser app φορτώνεται από το root page και καλεί το API μέσω του `API_BASE` στο [js/config.js](js/config.js).

### Δομή frontend

- [index.html](index.html): shell σελίδας και entry point
- [app.js](app.js): συντονιστής κορυφαίου επιπέδου
- [js/](js/): όλα τα feature modules
- [html/partials/](html/partials/): UI partials που φορτώνονται στη σελίδα
- [styles/](styles/): shared tokens και μεταβλητές σχεδίου
- [style.css](style.css): global styling

### Σειρά modules και ροή εφαρμογής

Η εφαρμογή ακολουθεί μια προβλέψιμη σειρά:

1. Αναφορές DOM και configuration
2. Κατάσταση και μικρές helper συναρτήσεις
3. Εγγραφή event listeners
4. Ορισμός async action συναρτήσεων
5. Αρχικοποίηση στο startup

Αυτή η σειρά ακολουθείται στο [app.js](app.js). Η εφαρμογή εκτελεί το `app-ready` μετά την εισαγωγή των partials και στη συνέχεια ξεκινά κάθε feature initializer.

### Κανόνες imports και performance

Το project χρησιμοποιεί ES modules για browser, άρα τα imports πρέπει να είναι ελάχιστα και σκόπιμα.

- Κάθε module να έχει μία ξεκάθαρη ευθύνη.
- Να εισάγονται μόνο όσα χρησιμοποιούνται.
- Να μην μένουν νεκρά imports μόνο για ευκολία.
- Να προτιμώνται μικρές και καθαρές helper συναρτήσεις αντί για επαναλαμβανόμενη λογική requests.
- Να διατηρείται ελαφρύ το startup, χωρίς να φορτώνονται αχρείαστα feature modules.
- Να προτιμάται το κεντρικό request helper του [js/api.js](js/api.js) αντί για επαναλαμβανόμενες API URLs και headers σε κάθε module.

Αυτό είναι ιδιαίτερα σημαντικό στο first load, γιατί ο browser πρέπει να αναλύσει ολόκληρο το imported graph πριν ο χρήστης αλληλεπιδράσει με τη σελίδα.

### Σύνταξη requests

Το κοινό pattern για requests είναι:

```js
const response = await fetch(apiUrl('/api/health'), {
  method: 'GET',
  headers: authHeaders()
});

const data = await response.json();
if (!response.ok) throw new Error(data.error || 'Request failed');
```

Το project ακολουθεί αυτά τα πρότυπα:

- `fetch()` για HTTP requests.
- `apiUrl(path)` ή το central request helper για να μην επαναλαμβάνονται τα API URLs.
- `Authorization` only στα protected endpoints.
- Για JSON requests, `Content-Type: application/json` και `JSON.stringify(...)`.
- Για file uploads, `FormData` και αφήνουμε τον browser να ορίσει το multipart boundary.
- Η network λογική να μένει μέσα στην async action που ξεκίνησε το UI flow.

### Κύρια feature modules

- [js/auth.js](js/auth.js): login και auth modal
- [js/chat.js](js/chat.js): sessions, history και chat flow με Gemini
- [js/feed.js](js/feed.js): posts, likes, comments και feed actions
- [js/messaging.js](js/messaging.js): φίλοι, DMs, ομάδες και polling μηνυμάτων
- [js/threads.js](js/threads.js): forum threads, απαντήσεις και moderation
- [js/notifications.js](js/notifications.js): badge και polling ειδοποιήσεων
- [js/profiles.js](js/profiles.js): profile views και avatars
- [js/presence.js](js/presence.js): online status polling
- [js/navigation.js](js/navigation.js): tab switching και mobile menu
- [js/theme.js](js/theme.js): light/dark theme
- [js/gifs.js](js/gifs.js): gif picker
- [js/utils.js](js/utils.js): shared helpers όπως escaping, time formatting και debounce
- [js/dom.js](js/dom.js): μικρό helper για DOM selection
- [js/config.js](js/config.js): API base και shared constants
- [js/api.js](js/api.js): shared headers και request wrapper

### Ρύθμιση και backend integration

Η εφαρμογή αναμένει το backend URL να είναι ορισμένο στο [js/config.js](js/config.js).

Σημερινή συμπεριφορά:

- το `API_BASE` δείχνει στο deployed backend origin
- local same-origin development μπορεί να χρησιμοποιεί κενό base ή local backend URL ανάλογα με το περιβάλλον
- το frontend δεν επαναλαμβάνει το API host σε κάθε request

### Σημειώσεις ανάπτυξης

Αυτό το repo δεν είναι standalone app server. Προορίζεται να τρέχει μαζί με το matching backend project, το οποίο θα παρέχει το REST API και τα static assets.

Για τοπική δουλειά:

1. Ξεκίνα το backend project.
2. Επιβεβαίωσε ότι το frontend μπορεί να φτάσει στο backend στο σωστό origin.
3. Έλεγξε τα βασικά auth και chat flows σε logged-in και guest mode.
4. Δοκίμασε το feature που άλλαξες στον browser πριν το commit.
