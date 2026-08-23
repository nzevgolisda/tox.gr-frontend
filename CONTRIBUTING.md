# Contributing

## Project structure

This is a build-free static frontend. Open `index.html` through a local HTTP server so browser ES modules and API requests work consistently.

- `index.html` is the page composition root and owns the stable DOM IDs used by features.
- `app.js` is the application entry point and currently owns feature workflows and event wiring.
- `js/config.js` contains API and feature constants.
- `js/dom.js` contains DOM lookup helpers.
- `js/utils.js` contains pure formatting, debounce, ID, and profile-picture helpers.
- `style.css` contains the shared visual system and component styles.

When adding a feature, keep API calls and state transitions close to that feature. Extract shared, side-effect-free helpers into `js/` only when they are used by more than one feature.

## Run locally

From the repository root:

```text
python -m http.server 8080
```

Then open `http://localhost:8080` in a browser.
