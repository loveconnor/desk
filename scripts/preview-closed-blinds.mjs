import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  headless: true,
  args: process.platform === "darwin" ? ["--use-angle=metal"] : [],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1512, height: 945 },
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
  for (const [name, coverage, night, lamp] of [
    ["open", 0, false, true],
    ["closed", 1, false, true],
    ["night", 1, true, true],
    ["lamp-off", 1, true, false],
  ]) {
    const result = await page.evaluate(
      async ({ coverage, night, lamp }) => {
        const url = performance
          .getEntriesByType("resource")
          .find((e) =>
            /\/Application\/Application\.ts(?:\?|$)/.test(e.name),
          ).name;
        const { default: App } = await import(url);
        const app = new App();
        const room = app.world.room;
        room.roomWindow.dateOverride = new Date(
          night ? "2026-09-11T03:00:00Z" : "2026-09-10T17:00:00Z",
        );
        room.roomWindow.coverage = room.roomWindow.target = coverage;
        if (room.lampOn !== lamp)
          for (const [, entry] of room.interactions.targets)
            if (entry.label === "Toggle reading lamp") entry.action();
        app.renderer.instance.shadowMap.needsUpdate = true;
        return { lampOn: room.lampOn, coverage: room.roomWindow.coverage };
      },
      { coverage, night, lamp },
    );
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: `output/blinds-${name}${process.env.PREVIEW_SUFFIX || ""}.png`,
    });
    console.log(name, result);
  }
  console.log({ errors });
  if (errors.length) throw Error(errors.join("\n"));
} finally {
  await browser.close();
}
