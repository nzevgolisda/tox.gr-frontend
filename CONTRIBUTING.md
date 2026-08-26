# Contributing

## Project structure

This is a build-free static frontend. Open `index.html` through a local HTTP server so browser ES modules and API requests work consistently. `app.js` is intentionally a small application coordinator; feature state and event handling live in the feature modules.

- `index.html` is the page composition root and owns the stable DOM IDs used by features.
- `app.js` coordinates startup, authentication state, and feature initialization.
- `js/auth.js` owns login and registration.
- `js/chat.js` owns ΗΡΑ chat, attachments, and saved sessions.
- `js/feed.js` owns posts, media, likes, comments, and the lightbox.
- `js/messaging.js` owns friends, direct messages, groups, GIF message state, and polling.
- `js/threads.js` owns thread search, categories, thread details, replies, likes, and publishing.
- `js/notifications.js` owns notification rendering, unread badges, polling, and notification navigation.
- `js/profiles.js` owns avatars, profiles, reputation, friendship actions, and blocking.
- `js/navigation.js` owns tabs, mobile navigation, settings, and history UI.
- `js/presence.js` owns online heartbeat and presence polling.
- `js/gifs.js` owns the GIPHY picker and GIF previews.
- `js/theme.js` owns theme state; the small inline script in `index.html` prevents theme flashing before CSS loads.
- `js/api.js`, `js/config.js`, `js/dom.js`, and `js/utils.js` contain shared request, configuration, DOM, and pure utility helpers.
- `js/keyboard.js` owns global Escape-key dismissal for overlays, menus, and notifications.
- `style.css` contains the shared visual system and component styles.

When adding a feature, keep API calls, private state, and state transitions close to that feature. Extract shared helpers into `js/` only when they are used by more than one feature. Keep `index.html` as the static composition root unless the project gains a build step for HTML partials.

Feature modules should normally stay between 50 and 100 lines when practical. Keep a complete workflow together when splitting it further would make state ownership or event flow less clear; shared helper modules may be smaller.

## Run locally

From the repository root:

```text
python -m http.server 8080
```

Then open `http://localhost:8080` in a browser.

## Pull request checklist

- Run the diagnostics for `app.js`, `index.html`, and every changed module.
- Load the page through the local HTTP server and check the main tabs.
- Check authentication modal, theme toggle, feed controls, messaging controls, and thread controls.
- Confirm no inline JavaScript event attributes were added to `index.html`.
- Keep API keys, tokens, and unrelated parent-repository changes out of the pull request.
- Mention the local backend CORS limitation when browser API requests cannot be verified locally.
