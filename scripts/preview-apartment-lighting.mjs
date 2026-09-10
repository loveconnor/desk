import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  headless: true,
  args: process.platform === "darwin" ? ["--use-angle=metal"] : [],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 950 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:4187/");
  await page.waitForFunction(
    () => {
      const b = document.querySelector(".door-entry button");
      return b && !b.disabled && document.getElementById("boot-screen")?.hidden;
    },
    {},
    { timeout: 60000 },
  );
  await page.getByRole("button", { name: "START", exact: true }).click();
  await page.waitForFunction(() =>
    document.querySelector(".door-entry")?.classList.contains("is-finished"),
  );
  for (const [name, position, target] of [
    ["kitchen", [-7000, 2500, 8700], [-12000, 500, 6500]],
    ["living", [-6200, 2800, 14800], [-500, 700, 10500]],
    ["printer", [-6700, 1700, 2300], [-8500, 450, -1400]],
  ]) {
    await page.evaluate(
      async ({ position, target }) => {
        const url = performance
          .getEntriesByType("resource")
          .find((e) =>
            /\/Application\/Application\.ts(?:\?|$)/.test(e.name),
          ).name;
        const { default: App } = await import(url);
        const app = new App();
        app.camera.update = () => {};
        app.camera.instance.position.set(...position);
        app.camera.instance.lookAt(...target);
        app.camera.instance.fov = 58;
        app.camera.instance.updateProjectionMatrix();
        app.world.room.roomWindow.dateOverride = new Date(
          "2026-09-10T17:00:00Z",
        );
        app.renderer.instance.shadowMap.needsUpdate = true;
      },
      { position, target },
    );
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `output/apartment-${name}-lighting.png` });
  }
  await page.evaluate(async () => {
    const url = performance
      .getEntriesByType("resource")
      .find((e) => /\/Application\/Application\.ts(?:\?|$)/.test(e.name)).name;
    const { default: App } = await import(url);
    const app = new App();
    app.world.room.roomWindow.dateOverride = new Date("2026-09-11T03:00:00Z");
    app.camera.instance.position.set(-6200, 2800, 14800);
    app.camera.instance.lookAt(-500, 700, 10500);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "output/apartment-night-lighting.png" });
  const result = await page.evaluate(async () => {
    const url = performance
      .getEntriesByType("resource")
      .find((e) => /\/Application\/Application\.ts(?:\?|$)/.test(e.name)).name;
    const { default: App } = await import(url);
    const app = new App();
    const switches = [];
    for (const [, entry] of app.world.room.interactions.targets)
      if (/Toggle (kitchen|living room|dining|printer)/.test(entry.label)) {
        entry.action();
        switches.push(entry.label);
      }
    const powers = [];
    app.scene.traverse((o) => {
      if (o.isLight && /Kitchen|Living room|Dining|Printer/.test(o.name))
        powers.push({ name: o.name, power: o.intensity });
    });
    for (const [, entry] of app.world.room.interactions.targets)
      if (/Toggle (kitchen|living room|dining|printer)/.test(entry.label))
        entry.action();
    return { switches, powers };
  });
  console.log({ errors, ...result });
  if (
    errors.length ||
    result.switches.length !== 6 ||
    result.powers.some((l) => l.power !== 0)
  )
    throw Error("Lighting validation failed");
} finally {
  await browser.close();
}
