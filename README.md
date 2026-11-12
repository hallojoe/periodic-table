# Matter Atlas

[Open the periodic table](https://hallojoe.github.io/periodic-table/)

Switch between 3D element blocks and animated Bohr models in the same 18-group layout. Click an element to select it. Click it again to pull back from the table and rotate its atom beside its factual record.

![Matter Atlas with element blocks and property-height controls](https://hallojoe.github.io/periodic-table/screenshots/lattice.png)

## Explore

Choose a height property and display it above the zero plane, below it, or relative to its median. The property choices include calculated atomic radius, atomic number, atomic weight, occupied shells, melting and boiling points, and liquid temperature range. Unavailable values remain selectable at the baseline.

Use **Display** to toggle path and grid lines, grid labels, and element names independently. Astrophage traces the box borders with a moving ember.

Drag to orbit, Shift-drag to pan, and use the wheel or the zoom buttons to change scale. Search with **/** or navigate with the arrow keys. In detail view, drag or use the arrow keys to rotate the model. **Escape** restores the prior table view. The optional theoretical row adds elements 119 and 120.

[Illustrated guide, height formulas and references](docs/README.md) · [Element records and attribution](docs/data.md)

## Run locally

The app runs directly from the files in `app/` with no JavaScript dependencies.

```sh
python3 -m http.server 8000 --directory app
```

Open [localhost:8000](http://localhost:8000/). Run the record and height checks with `node scripts/validate.mjs` (Node 22+). The [Pages workflow](.github/workflows/pages.yml) also exercises desktop and mobile Chromium, captures the documentation screenshots, and publishes a verified build after a push to `main`.
