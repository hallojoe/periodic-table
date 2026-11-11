# Matter Atlas

[Open the 3D periodic table](https://hallojoe.github.io/periodic-table/)

Explore 118 elements in their conventional groups and periods, then travel inside a box to see its electron shells, physical properties and discovery history. The optional theoretical row adds elements 119 and 120.

![Matter Atlas showing the full 3D periodic table and carbon's element inspector](https://hallojoe.github.io/periodic-table/screenshots/lattice.png)

## Explore

Drag to orbit, Shift-drag to pan, and use the wheel or the zoom controls to move closer. Hover over a box to inspect it. Select it to enter its room. Press Escape or **Back to lattice** to return. On a keyboard, focus the lattice, move with the arrow keys, and press Enter. Press **/** to find an element by name, symbol or atomic number.

Choose **Neon**, **Astrophage** or **Wireframe** in the scene header. Use the chemical-family chips to highlight related elements. **Flat view** aligns the camera with the table. Box depth increases with the square root of atomic number.

## Run locally

The application uses browser ES modules and Canvas 2D to project its 3D geometry. No JavaScript packages or build step are required.

```sh
python3 -m http.server 8000 --directory app
```

Open [localhost:8000](http://localhost:8000/). Run the data checks with `node scripts/validate.mjs` (Node 22+).

## GitHub Pages

The [Pages workflow](.github/workflows/pages.yml) validates the element records and runs desktop and mobile Chromium interaction tests. A successful push to `main` publishes the verified contents of `app/`, including screenshots from the browser run. Select **GitHub Actions** as the Pages publishing source.

[Field guide and browser testing](docs/README.md) · [Data sources, attribution and scientific conventions](docs/data.md)
