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

    def open_search(query):
        search = el("search")
        search.clear()
        search.send_keys(query)
        wait.until(lambda _: bool(browser.find_elements(By.CSS_SELECTOR, "#matches .match")))
        search.send_keys(Keys.ENTER)
        wait.until(lambda _: el("room").is_displayed())

    def leave():
        el("leave").click()
        ready()

    browser.get(url)
    ready()
    assert el("count").text == "118 ELEMENTS"
    assert el("inspect").find_element(By.TAG_NAME, "h3").text == "Carbon"
    browser.save_screenshot(str(output / "lattice.png"))
    # Open the focused box through the keyboard, then exercise pointer picking.
    el("lattice").send_keys(Keys.ENTER)
    wait.until(lambda _: el("room").is_displayed())
    assert "Carbon" in el("room-content").text
    leave()
    el("flat").click()
    rect = el("lattice").rect
    width, height = rect["width"], rect["height"]
    scale = min((width - 30) / 18.6, (height - 40) / 10.25)
    # Flat projection of H's centre, relative to the canvas centre.
    k = scale * 50 / (50 - .304)
    ActionChains(browser).move_to_element_with_offset(el("lattice"), round(-8.5 * k), round(-4 * k)).click().perform()
    wait.until(lambda _: el("room").is_displayed())
    assert "Hydrogen" in el("room-content").text
    leave()
    for effect in ["Wireframe", "Astrophage", "Neon"]:
        Select(el("effect")).select_by_visible_text(effect)
        assert el("effect").get_attribute("value") == effect
    el("plus").click()
    el("minus").click()
    el("reset").click()
    assert el("view-label").text == "PERSPECTIVE VIEW"
    browser.find_element(By.CSS_SELECTOR, '[data-family="noble"]').click()
    assert el("count").text == "7 ELEMENTS"
    el("clear").click()
    open_search("Be")
    assert "Beryllium" in el("room-content").text
    assert "1797" in el("room-content").text
    browser.save_screenshot(str(output / "beryllium.png"))
    leave()
    open_search("119")
    assert "Ununennium" in el("room-content").text
    assert "PREDICTED" in el("room-content").text
    leave()
    assert el("extended").is_selected()
    el("guide").click()
    assert el("help").is_displayed()
    el("close-help").click()
    browser.set_window_size(390, 844)
    browser.get(url)
    ready()
    assert js("return document.documentElement.scrollWidth <= innerWidth")
    open_search("Og")
    assert "Oganesson" in el("room-content").text
    assert "PREDICTED" in el("room-content").text
    leave()
    errors = [m for m in browser.get_log("browser") if m["level"] == "SEVERE"]
    assert not errors, errors
print("Desktop and mobile browser checks passed.")
