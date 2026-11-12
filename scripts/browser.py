"""Run browser checks against a local HTTP server and capture the README images."""
import os
import sys
from pathlib import Path

from selenium import webdriver
from selenium.webdriver import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select, WebDriverWait

url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000/"
output = Path(sys.argv[2] if len(sys.argv) > 2 else "docs/screenshots")
output.mkdir(parents=True, exist_ok=True)
options = webdriver.ChromeOptions()
for arg in ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--window-size=1440,950", "--force-device-scale-factor=1"]:
    options.add_argument(arg)
if os.environ.get("CHROME_BIN"):
    options.binary_location = os.environ["CHROME_BIN"]
options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
with webdriver.Chrome(options=options) as browser:
    wait = WebDriverWait(browser, 15)
    el = lambda name: browser.find_element(By.ID, name)
    js = browser.execute_script

    def ready():
        wait.until(lambda _: not el("explorer").get_property("inert"))

    def choose(query):
        search = el("search")
        search.clear()
        search.send_keys(query)
        wait.until(lambda _: bool(browser.find_elements(By.CSS_SELECTOR, "#matches .match")))
        search.send_keys(Keys.ENTER)

    def detail_open():
        wait.until(lambda _: el("leave").is_displayed())
        wait.until(lambda _: el("lattice") == browser.switch_to.active_element)
        # Entry ends with canvas focus. Pointer selections may already focus it.
        wait.until(lambda _: el("lattice").get_attribute("aria-busy") == "false")

    def leave():
        el("leave").click()
        wait.until(lambda _: not el("leave").is_displayed())

    def toggle_overlay(option):
        browser.find_element(By.CSS_SELECTOR, f'label:has(#{option})').click()

    def canvas_digest():
        # After camera return the grid resizes. Sample the settled canvas pixels
        # directly so focus outlines and overlapping HTML controls are excluded.
        return browser.execute_async_script("""
            const done = arguments[0];
            requestAnimationFrame(() => requestAnimationFrame(async () => {
                const c = document.getElementById("lattice");
                const pixels = c.getContext("2d").getImageData(0,0,c.width,c.height);
                const hash = await crypto.subtle.digest("SHA-256", pixels.data);
                done(Array.from(new Uint8Array(hash)).join(","));
            }));
        """)

    def check_overlays():
        for option in ["showPaths", "showGridLabels", "showNames"]:
            assert el(option).is_selected()
            before = canvas_digest()
            toggle_overlay(option)
            assert not el(option).is_selected()
            assert before != canvas_digest(), f"{option} should change the drawing"
            toggle_overlay(option)
            assert el(option).is_selected()
            assert before == canvas_digest(), f"{option} should restore the same drawing"

    def click_cell(col, row, height=0):
        # Front elevation of the normal table, including perspective.
        rect = el("lattice").rect
        scale = min((rect["width"]-30)/19.6, (rect["height"]-74)/11.1)
        k = scale*50/(50-max(0,height))
        at = ActionChains(browser).move_to_element_with_offset(
            el("lattice"), round((col-9.5)*k), round((row-5)*k))
        at.click().perform()

    browser.get(url)
    ready()
    assert el("count").text == "118 ELEMENTS"
    check_overlays()
    sidebar_width = el("settings").rect["width"]
    choose("C")
    assert el("inspect").find_element(By.TAG_NAME, "h3").text == "Carbon"
    assert not el("leave").is_displayed()
    browser.save_screenshot(str(output / "lattice.png"))
    el("flat").click()
    Select(el("metric")).select_by_value("boil")
    click_cell(1, 1)
    assert "Hydrogen" in el("inspect").text and not el("leave").is_displayed()
    for option in ["showPaths", "showGridLabels", "showNames"]:
        toggle_overlay(option)
    # Carbon still takes both clicks with no overlays and no boiling point.
    click_cell(14, 2)
    assert "Carbon" in el("inspect").text and "Unavailable" in el("inspect").text
    assert not el("leave").is_displayed()
    click_cell(14, 2)
    detail_open()
    assert el("inspect").rect["width"] > sidebar_width * 1.3
    leave()
    for option in ["showPaths", "showGridLabels", "showNames"]:
        assert not el(option).is_selected()
        toggle_overlay(option)
    Select(el("effect")).select_by_visible_text("Astrophage")
    # A stationary block table redraws as the border tracer moves.
    before = el("lattice").screenshot_as_png
    wait.until(lambda _: before != el("lattice").screenshot_as_png)
    for effect in ["Wireframe", "Neon"]:
        Select(el("effect")).select_by_visible_text(effect)
    el("atoms").click()
    assert el("atoms").get_attribute("aria-pressed") == "true"
    click_cell(2, 2)
    assert "Beryllium" in el("inspect").text and not el("leave").is_displayed()
    click_cell(2, 2)
    detail_open()
    assert "1797" in el("inspect").text
    browser.execute_cdp_cmd("Emulation.setEmulatedMedia", {"features":[{"name":"prefers-reduced-motion","value":"reduce"}]})
    # With orbital motion paused, changing pixels verifies manual rotation.
    el("lattice").send_keys(Keys.ARROW_RIGHT)
    before = el("lattice").screenshot_as_png
    ActionChains(browser).move_to_element(el("lattice")).click_and_hold().move_by_offset(64, 35).release().perform()
    wait.until(lambda _: before != el("lattice").screenshot_as_png)
    browser.save_screenshot(str(output / "beryllium.png"))
    el("lattice").send_keys(Keys.ESCAPE)
    wait.until(lambda _: not el("leave").is_displayed())
    check_overlays()
    Select(el("direction")).select_by_value("down")
    Select(el("metric")).select_by_value("radius")
    assert "112 pm" in el("inspect").text
    Select(el("direction")).select_by_value("median")
    assert "Median" in el("baseline").text
    el("plus").click()
    el("minus").click()
    el("reset").click()
    browser.save_screenshot(str(output / "bohr-table.png"))
    browser.find_element(By.CSS_SELECTOR, '[data-family="noble"]').click()
    assert el("count").text == "7 ELEMENTS"
    el("clear").click()
    choose("119")
    assert el("extended").is_selected() and "Unavailable" in el("inspect").text
    el("enter").click()
    detail_open()
    assert "Predicted electrons per shell" in el("inspect").text
    leave()
    el("guide").click()
    assert el("help").is_displayed()
    el("close-help").click()
    browser.execute_cdp_cmd("Emulation.setDeviceMetricsOverride", {"width":390,"height":844,"deviceScaleFactor":1,"mobile":True})
    browser.get(url)
    ready()
    assert js("return document.documentElement.scrollWidth <= innerWidth")
    el("atoms").click()
    choose("Og")
    assert "Oganesson" in el("inspect").text
    el("enter").click()
    detail_open()
    assert "Predicted electrons per shell" in el("inspect").text
    leave()
    errors = [m for m in browser.get_log("browser") if m["level"] == "SEVERE"]
    assert not errors, errors
print("Desktop and mobile browser checks passed.")
