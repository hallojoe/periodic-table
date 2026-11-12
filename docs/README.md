# Matter Atlas field guide

[Open Matter Atlas](https://hallojoe.github.io/periodic-table/)

## Two views in one scene

**Blocks** extrudes columns from the zero plane. **Bohr models** places each atom at the height of its column endpoint, with a stem connecting it to the plane. Both representations preserve the conventional table positions, the detached series, the active height method, selection and camera. The legend, search results and record use the active chemical-family palette.

![Bohr models in the table with radius heights centered on the median](https://hallojoe.github.io/periodic-table/screenshots/bohr-table.png)

## Color and rendering

Choose **Neon**, **Aurora**, **Ocean** or **Ember**. Fill, wireframe and the two animated effects work independently in every theme. Turn off both geometry switches to isolate the labels and effects. Picking keeps working on transparent elements.

| Switch | Blocks | Bohr models |
| --- | --- | --- |
| Fill | Solid family-coloured faces | Filled electrons and nucleus |
| Wireframe | Box edges, including rear edges when fill is off | Particle outlines |
| Astrophage borders | Dark cells circulate along the box edges, brighten and divide | Cells follow the outer visible shell |
| Blinking dots | Independently pulsing lights at visible corners | A pulsing nucleus in the table and glowing electrons in detail |

The Astrophage animation interprets the fictional microbe’s feeding and division cycle. Its rose-coloured wake stands in for the infrared Petrova line. [A Field Guide to Astrophage](https://www.thescienceof.org/p/a-field-guide-to-astrophage)

Drag horizontally or vertically through any number of full turns. Rear, side and underside faces can be picked and carry the element inscription. Reduced motion freezes the border and dot phases. The dots use soft additive light and staggered phases inspired by [Hilbert Space](https://github.com/hallojoe/hilbert-space).

![Aurora wireframe blocks with Astrophage borders and blinking dots](https://hallojoe.github.io/periodic-table/screenshots/appearance.png)

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

Click once to select an element and read its current height property. Click the same element again or use **Inspect element** to see its full record. In 420 ms the elements follow their opening Fibonacci trajectories in reverse, shrinking and fading away. The selected atom moves into focus. Drag to rotate the model on two axes, or use the arrow keys. **Back to table** or **Escape** returns to the prior camera, selection and appearance as the table reassembles.

![Beryllium in detail after the table has dissolved](https://hallojoe.github.io/periodic-table/screenshots/beryllium.png)

Search by name, symbol, or atomic number. A search result selects its element, including theoretical entries. Focus the table and use Enter to inspect. Reduced-motion settings skip the dissolve and assembly animations and pause orbital motion while retaining manual rotation.

## Browser checks

Start the server in the [project README](../README.md). With Python 3, Chrome and a matching ChromeDriver installed, run:

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install selenium==4.33.0
python scripts/browser.py http://127.0.0.1:8000/ docs/screenshots
```

The suite captures both table views and beryllium in detail. It covers first and second clicks, missing-value selection, independent atom rotation, camera return, theoretical entries and mobile layout.
