# Matter Atlas field guide

[Launch the atlas](https://hallojoe.github.io/periodic-table/)

![The element lattice, chemical families and Bohr-model inspector](https://hallojoe.github.io/periodic-table/screenshots/lattice.png)

## Reading the table

The wire bounding box dissolves as elements assemble from a randomly oriented Fibonacci sphere. Once the entrance completes, each symbol is fixed to its box face. Group numbers run across the top and period numbers down the left. The detached rows fill the marked positions in periods 6 and 7. Reduced-motion preferences skip the entrance and camera flight and hold the electron model still.

The default Neon palette distinguishes chemical families. Astrophage uses a warm atomic-number gradient, while Wireframe emphasizes the edges of each box. The legend can isolate any family in all three modes. **Show theoretical** adds two predicted period-eight entries below the confirmed table.

## Inside beryllium

![Inside the beryllium box, with its electron shells and factual record](https://hallojoe.github.io/periodic-table/screenshots/beryllium.png)

Select Be or search for “beryllium” and press Enter. The camera approaches the selected face and reveals the room. The neutral atom's four electrons occupy two shells, with two electrons in each. The record includes atomic mass, temperature data, discoverer and discovery year, plus a link to the element reference. The nucleus and shell geometry are schematic. [Data sources and conventions](data.md)

## Browser checks

Start the local server as described in the [project README](../README.md). With Python 3, Chrome and a matching ChromeDriver available, run the same checks used by Pages.

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install selenium==4.33.0
python scripts/browser.py http://127.0.0.1:8000/ docs/screenshots
```

The browser checks cover table picking, keyboard entry, element search, switching effects, family filtering, returning from a room and mobile layout. They also capture the lattice and beryllium room from the running application.
