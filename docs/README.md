# Matter Atlas field guide

[Open Matter Atlas](https://hallojoe.github.io/periodic-table/)

## Two views in one scene

**Blocks** extrudes columns from the zero plane. **Bohr models** places each atom at the height of its column endpoint, with a stem connecting it to the plane. Both representations preserve the conventional table positions, the detached series, the active height method, selection and camera. Box faces retain their chemical-family colours in Astrophage mode. A bright ember travels around the visible box edges. Reduced-motion mode holds the ember still.

![Bohr models in the table with radius heights centered on the median](https://hallojoe.github.io/periodic-table/screenshots/bohr-table.png)

## Scene overlays

The table assembles from the Fibonacci sphere as soon as it opens. Three independent switches in **Display** control the drawing in both views.

| Switch | Visible when enabled |
| --- | --- |
| Path and grid lines | The table grid, dotted backdrop, atom height stems and Bohr orbital paths |
| Grid labels | Group and period numbers, detached-row guides and the theoretical-row label |
| Element names | Chemical symbols at overview scale and full names when zoomed in |

Elements remain selectable with any combination of overlays. The record always identifies the selected element.

## Height calculations

The scale uses all available records, so filtering a family or toggling the theoretical row leaves the height of a given element consistent. Positive and negative directions mirror the geometry across the zero plane. In the signed view the median value is the baseline and both signs use the same scale factor.

| Property | Quantity used for height |
| --- | --- |
| Atomic number | Square root of the atomic number |
| Calculated atomic radius | Calculated radius in picometres |
| Atomic weight | Numerical standard atomic weight. Bracketed isotope mass numbers have no value for this metric. |
| Occupied electron shells | Number of shell populations greater than zero, including predicted populations where identified |
| Melting point or boiling point | Recorded transition temperature in kelvin |
| Liquid temperature range | Boiling point minus melting point in kelvin, when both are available |

For positive heights, the largest transformed value maps to 2.05 group spacings. Negative heights reverse that direction. In median mode, subtract the transformed median and divide by the largest absolute deviation before applying the same height scale. Missing values have a muted marker at zero in both representations. Their factual records remain accessible.

The radius lookup supplements the v1 element records and covers hydrogen through radon. It uses the **calculated** column of the tabulation below. Radius depends on the definition, so a missing value stays unfilled. [Atomic radii tabulation](https://en.wikipedia.org/wiki/Atomic_radii_of_the_elements_(data_page)) · [WebElements calculated radii](https://winter.group.shef.ac.uk/webelements/periodicity/atomic_radius/) · [Wolfram 3D periodic table](https://demonstrations.wolfram.com/PeriodicTableIn3D/) · [Element data and attribution](data.md)

## Selection and detail

Click once to select an element and read its current height property. Click the same element again or use **Inspect element** to see its full record. The camera retreats, leaving the small, dim table in the scene behind the foreground atom. Drag to rotate the model on two axes, or use the arrow keys. **Back to table** or **Escape** returns to the original camera and selection.

![Beryllium's rotatable model with its full record and the distant table](https://hallojoe.github.io/periodic-table/screenshots/beryllium.png)

Search by name, symbol, or atomic number. A search result selects its element, including theoretical entries. Focus the table and use Enter to inspect. Reduced-motion settings skip camera animations and pause orbital motion while retaining manual rotation.

## Browser checks

Start the server in the [project README](../README.md). With Python 3, Chrome and a matching ChromeDriver installed, run:

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install selenium==4.33.0
python scripts/browser.py http://127.0.0.1:8000/ docs/screenshots
```

The suite captures both table views and beryllium in detail. It covers first and second clicks, missing-value selection, independent atom rotation, camera return, theoretical entries and mobile layout.
