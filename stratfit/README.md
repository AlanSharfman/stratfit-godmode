## STRATFIT — Simulate (Static Prototype)

This folder is a standalone HTML/CSS/JS prototype for the SIMULATE UI.

### Folder structure

- `public/index.html`: the page
- `src/css/simulate.css`: styles
- `src/js/simulate.js`: loads JSON + renders the page
- `src/data/run-snapshot.json`: dummy simulation payload

### Run locally

You must use a local web server (fetch won’t work with `file://`).

From the `stratfit/` folder:

```bash
python -m http.server 8080
```

Then open:

- `http://localhost:8080/public/`


