import assert from "node:assert/strict";
import test from "node:test";

import { chromium } from "playwright";

import { parseTourDetailPage } from "./detail-parser";
import { normalizeScrapedPackage } from "./normalizer";

const durgviharHariharHtml = `
<!DOCTYPE html>
<html lang="en">
  <body>
    <main>
      <h1>Harihar Fort</h1>
      <section>
        <h2>Detailed Itinerary</h2>
        <div>Meals: Breakfast &amp; Lunch(veg &amp; Nonveg)</div>
        <div>➤ Depart from Kasara at 11:30 PM</div>
        <div>➤ If boarding from Dadar, take the 8:58 PM train to Kasara</div>
        <div>➤ 01:00 PM - Lunch at base camp</div>
        <div>➤ 02:00 PM - Start return journey to Kasara</div>
        <div>➤ 05:00 PM - Reach Kasara station</div>
        <div>➤ Train journey back from Kasara</div>
      </section>
      <section>
        <h2>Other Information</h2>
        <div>Participants &amp; Trek Leaders will travel together in the same train.</div>
        <div>Catch 8:58 PM Kasara Local from Dadar to reach Kasara.</div>
      </section>
      <section>
        <h2>What’s Included</h2>
        <ul>
          <li>Travel arrangements - pickup and drop from the designated meeting point</li>
          <li>Breakfast</li>
          <li>Lunch (Veg &amp; nonveg)</li>
        </ul>
      </section>
      <section>
        <h2>What’s Excluded</h2>
        <ul>
          <li>Dinner during travel</li>
          <li>Any additional meals or beverages not listed in inclusions</li>
        </ul>
      </section>
      <section>
        <h2>Mode of Transport</h2>
        <div>Train</div>
      </section>
      <section>
        <h2>Quick Information</h2>
        <div>Meeting Point Kasara railway station</div>
      </section>
    </main>
  </body>
</html>`;

const trekhieversHariharHtml = `
<!DOCTYPE html>
<html lang="en">
  <body>
    <main>
      <h1>Harihar Cloud Formation Trek | Mumbai</h1>
      <section>
        <h2>Inclusion :</h2>
        <ul>
          <li>Travel from Kasara to Kasara by Private Jeeps</li>
          <li>Breakfast &amp; Tea</li>
          <li>Lunch ( Veg Thali )</li>
          <li>Trek Guide Charges.</li>
          <li>Entry Charges.</li>
        </ul>
      </section>
      <section>
        <h2>Exclusion :</h2>
        <ul>
          <li>Travel till pickup points</li>
          <li>All kinds of Extra Meals / soft drinks ordered</li>
          <li>Any kind of personal expenses</li>
        </ul>
      </section>
      <section>
        <h2>Itinerary</h2>
        <div>MUMBAI- (From Kasara)</div>
        <div>08:44 PM: CSMT</div>
        <div>08:58 PM: Dadar</div>
        <div>11:04 PM: Kasara</div>
        <div>04:00 AM: Get freshen up and Have Breakfast</div>
        <div>12:00 PM: Reach Base Village and Have Lunch</div>
      </section>
      <section>
        <h2>Things to carry:</h2>
        <div>ID proof</div>
      </section>
    </main>
  </body>
</html>`;

test("detail parser captures Durgvihar meal and Kasara train signals", async () => {
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    await page.setContent(durgviharHariharHtml, { waitUntil: "domcontentloaded" });

    const rawPackage = await parseTourDetailPage({
      page,
      pageUrl: "https://durgvihar.in/trip/harihar-fort",
      source: {
        label: "Durgvihar trip listings",
        sourceUrl: "https://durgvihar.in/",
        parserKey: "durgvihar:v1",
        crawlStrategy: "LISTING_PAGE",
      },
      platform: "durgvihar",
      titleSelectors: ["h1"],
    });
    const normalizedPackage = normalizeScrapedPackage(rawPackage);

    assert.match(rawPackage.mealText ?? "", /Breakfast/i);
    assert.match(rawPackage.transportText ?? "", /Kasara/i);
    assert.equal(normalizedPackage.transportType, "TRAIN");
    assert.equal(normalizedPackage.mealPlan, "INCLUDED");
    assert.deepEqual(normalizedPackage.pickupLocations, []);
    assert.equal(
      (normalizedPackage.normalizedSnapshot.pipeline as { derived?: { mealsSummary?: string } })
        .derived?.mealsSummary,
      "Breakfast, Lunch",
    );
    assert.equal(
      (normalizedPackage.normalizedSnapshot.pipeline as { derived?: { transportSummary?: string } })
        .derived?.transportSummary,
      "Train",
    );
    assert.deepEqual(
      (normalizedPackage.normalizedSnapshot.pipeline as { validationIssues?: unknown[] })
        .validationIssues,
      [],
    );
  } finally {
    await browser.close();
  }
});

test("detail parser keeps Trekhievers inclusion meals out of exclusions", async () => {
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    await page.setContent(trekhieversHariharHtml, { waitUntil: "domcontentloaded" });

    const rawPackage = await parseTourDetailPage({
      page,
      pageUrl: "https://www.trekhievers.com/tours/harihar-fort-trek-99675",
      source: {
        label: "Mumbai treks",
        sourceUrl: "https://www.trekhievers.com/collections/treks-in-mumbai",
        parserKey: "trekhievers:v2",
        crawlStrategy: "LISTING_PAGE",
      },
      platform: "vacation-labs",
      titleSelectors: ["h1"],
    });
    const normalizedPackage = normalizeScrapedPackage(rawPackage);

    assert.match(rawPackage.inclusionsText ?? "", /Breakfast/i);
    assert.doesNotMatch(rawPackage.inclusionsText ?? "", /Extra Meals/i);
    assert.match(rawPackage.mealText ?? "", /Breakfast/i);
    assert.doesNotMatch(rawPackage.mealText ?? "", /Extra Meals/i);
    assert.equal(normalizedPackage.mealPlan, "INCLUDED");
    assert.doesNotMatch(
      (normalizedPackage.normalizedSnapshot.pipeline as { derived?: { mealsSummary?: string } })
        .derived?.mealsSummary ?? "",
      /Dinner/i,
    );
  } finally {
    await browser.close();
  }
});