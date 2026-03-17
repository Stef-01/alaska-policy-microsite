import { expect, test, type Page } from "@playwright/test";

async function assertNoInvalidNumbers(page: Page) {
  const bodyText = await page.evaluate(() => document.body.innerText);
  expect(bodyText).not.toContain("NaN");
  expect(bodyText).not.toContain("Infinity");
  expect(bodyText).not.toContain("undefined");
}

async function assertNoHorizontalOverflow(page: Page, tolerance = 2) {
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewport + tolerance);
}

async function assertNoInternalOverflow(page: Page, selector: string, tolerance = 4) {
  const overflow = await page.evaluate(
    ({ target, slack }) => {
      const root = document.querySelector(target);
      if (!root) {
        return [{ missing: target }];
      }

      const rootRect = root.getBoundingClientRect();
      const items: Array<{
        tag: string;
        text: string;
        left: number;
        right: number;
        rootLeft: number;
        rootRight: number;
      }> = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
      let node: Node | null;

      while ((node = walker.nextNode())) {
        const element = node as HTMLElement;
        const rect = element.getBoundingClientRect();
        if (
          rect.width > 0 &&
          rect.height > 0 &&
          (rect.left < rootRect.left - slack || rect.right > rootRect.right + slack)
        ) {
          items.push({
            tag: element.tagName,
            text: (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 120),
            left: rect.left,
            right: rect.right,
            rootLeft: rootRect.left,
            rootRight: rootRect.right,
          });
        }
      }

      return items;
    },
    { target: selector, slack: tolerance }
  );

  expect(overflow).toEqual([]);
}

test("calculator landing view is readable and baseline-first on desktop", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop layout assertions are not relevant to the mobile project.");

  await page.goto("/calculator");

  await expect(
    page.getByRole("heading", {
      name: /see the care gap, the vision risk, and the modeled shift\./i,
    })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /jump to outcomes/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /fine-tune assumptions/i })).toBeVisible();
  await expect(page.getByTestId("compare-slider")).toHaveValue("100");

  const sidebar = await page.getByTestId("calculator-sidebar").boundingBox();
  const results = await page.getByTestId("calculator-results").boundingBox();

  expect(sidebar).not.toBeNull();
  expect(results).not.toBeNull();

  if (sidebar && results) {
    expect(sidebar.x + sidebar.width).toBeLessThanOrEqual(results.x + 2);
  }

  await expect(page.getByText(/screened annually/i).first()).toBeVisible();
  await expect(page.getByText(/still missed/i).first()).toBeVisible();

  await assertNoInvalidNumbers(page);
  await assertNoHorizontalOverflow(page);
});

test("desktop sidebar keeps inputs reachable through internal scrolling", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop-only sidebar behavior.");

  await page.setViewportSize({ width: 900, height: 760 });
  await page.goto("/calculator");

  const sidebar = await page.getByTestId("calculator-sidebar").boundingBox();
  const results = await page.getByTestId("calculator-results").boundingBox();

  expect(sidebar).not.toBeNull();
  expect(results).not.toBeNull();

  if (sidebar && results) {
    expect(sidebar.x + sidebar.width).toBeLessThanOrEqual(results.x + 2);
  }

  const scrollMetrics = await page.getByTestId("calculator-sidebar-scroll").evaluate((element) => {
    const panel = element as HTMLElement;
    panel.scrollTop = panel.scrollHeight;

    return {
      scrollHeight: panel.scrollHeight,
      clientHeight: panel.clientHeight,
      scrollTop: panel.scrollTop,
    };
  });

  expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight);
  expect(scrollMetrics.scrollTop).toBeGreaterThan(0);

  await expect(page.getByText(/current baseline for anchorage/i)).toBeVisible();
  await assertNoHorizontalOverflow(page);
});

test("scenario controls survive extreme calculator inputs without invalid output", async ({ page }) => {
  await page.goto("/calculator");

  await page.getByTestId("region-select").selectOption("northern");
  await page.getByTestId("device-select").selectOption("oct_only_advanced");
  await page.getByTestId("staffing-select").selectOption("existing_staff");
  await page.getByTestId("referral-select").selectOption("local_ophthalmology");
  await page.getByTestId("infrastructure-select").selectOption("accelerated");
  await page.getByTestId("adoption-select").selectOption("high");
  await page.getByTestId("program-cost-input").fill("1000000");
  await page
    .getByTestId("clinic-installs-input")
    .evaluate((element) => {
      const input = element as HTMLInputElement;
      input.value = input.max;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

  await expect(page.getByText(/current baseline for northern/i)).toBeVisible();
  await expect(page.getByText(/confidence/i).first()).toBeVisible();

  await expect(page.getByText(/indicative diabetes-rate reduction/i).first()).toBeVisible();
  await expect(page.getByText(/newly seen each year/i).first()).toBeVisible();
  await expect(page.getByText(/blindness cases avoided/i).first()).toBeVisible();

  await assertNoInvalidNumbers(page);
});

test("health and economic tabs both render after interaction", async ({ page }) => {
  await page.goto("/calculator");

  await expect(page.getByTestId("health-panel")).toBeVisible();
  await assertNoInternalOverflow(page, "[data-testid='health-panel']");
  await page.getByRole("button", { name: /economic cost/i }).click();
  await expect(page.getByTestId("economic-panel")).toBeVisible();
  await expect(page.getByText(/qaly/i).first()).toBeVisible();
  await expect(page.getByText(/daly/i).first()).toBeVisible();
  await assertNoInternalOverflow(page, "[data-testid='economic-panel']");

  const slider = page.getByTestId("compare-slider");
  await slider.focus();
  for (let step = 0; step < 20; step += 1) {
    await page.keyboard.press("ArrowLeft");
  }
  await expect(slider).toHaveValue("80");
  await expect(page.getByText(/after investment/i).first()).toBeVisible();

  await assertNoInvalidNumbers(page);
});

test("assumptions workspace is open and does not require login", async ({ page }) => {
  await page.goto("/assumptions");

  await expect(
    page.getByRole("heading", {
      name: /fine-tune the calculator assumptions, preview the effect, and publish the active pack\./i,
    })
  ).toBeVisible();
  await expect(page.getByText(/versions/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /refresh preview/i })).toBeVisible();
  await expect(page.locator("input[type='password']")).toHaveCount(0);

  await assertNoInvalidNumbers(page);
  await assertNoHorizontalOverflow(page, 6);
});

test("mobile calculator layout stays readable without horizontal overflow", async ({ page, isMobile }) => {
  test.skip(!isMobile, "This assertion is only relevant to the mobile project.");

  await page.goto("/calculator");

  await expect(page.getByRole("heading", { name: /build a regional deployment/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /jump to outcomes/i })).toBeVisible();
  await expect(page.getByTestId("compare-view")).toBeVisible();

  await assertNoInvalidNumbers(page);
  await assertNoHorizontalOverflow(page, 6);
});
