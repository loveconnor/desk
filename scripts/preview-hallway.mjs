import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  headless: true,
  args: process.platform === "darwin" ? ["--use-angle=metal"] : [],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1512, height: 900 },
  });
  const errors = [];
  const missing = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400 && r.url().includes("/models/hallway/"))
      missing.push(r.url());
  });
  await page.goto("http://localhost:4187/");
  await page
    .getByRole("button", { name: "START", exact: true })
    .waitFor({ state: "visible", timeout: 60000 });
  await page.waitForFunction(() => {
    const button = document.querySelector(".door-entry button");
    return (
      button &&
      !button.disabled &&
      document.getElementById("boot-screen")?.hidden
    );
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "output/hallway-realistic.png" });
  await page.evaluate(async () => {
    const { default: Application } = await import(
      performance
        .getEntriesByType("resource")
        .find((entry) =>
          /\/Application\/Application\.ts(?:\?|$)/.test(entry.name),
        ).name
    );
    const app = new Application();
    app.scene.traverse((o) => {
      if (o.isLight && o.name.startsWith("Hallway sconce")) {
        o.userData.onIntensity = o.intensity;
        o.intensity = 0;
      }
    });
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "output/hallway-lamps-off.png" });
  await page.evaluate(async () => {
    const { default: Application } = await import(
      performance
        .getEntriesByType("resource")
        .find((entry) =>
          /\/Application\/Application\.ts(?:\?|$)/.test(entry.name),
        ).name
    );
    const app = new Application();
    app.scene.traverse((o) => {
      if (o.isLight && o.name.startsWith("Hallway sconce"))
        o.intensity = o.userData.onIntensity;
    });
    app.renderer.instance.shadowMap.needsUpdate = true;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(750);
  await page.screenshot({ path: "output/hallway-mobile.png" });
  const canvases = await page.locator("#webgl canvas").count();
  console.log({ errors, missing, canvases });
  if (canvases !== 1)
    throw new Error("Preview must use the running application singleton");
  if (errors.length || missing.length) process.exitCode = 1;
} finally {
  await browser.close();
}
