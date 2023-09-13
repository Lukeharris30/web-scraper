import puppeteer from "puppeteer";
import fs from "fs/promises";

// ... (Your code for generating Ids)

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto("https://ltc.dph.illinois.gov/webapp/LTCApp/");
    await page.setViewport({ width: 1080, height: 1024 });

    let select = await page.waitForSelector('select[name="county"]');
    console.log(`Select: ${select}`);
    // get all the values in the select dropdown
    const values = await page.evaluate(() => {
      const options = Array.from(
        document.querySelectorAll('select[name="county"] option')
      );
      // remove null value
      options.shift();
      return options.map((option) => option.value);
    });
    console.log(`Values: ${values}`);

    await Promise.all([
      select.select("031"),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    // Refresh the page
    // await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
    // // check the page url
    // console.log(`URL: ${page.url()}`);
    // take a screenshot
    await page.screenshot({ path: "screenshot.png" });
    // Wait for a specific element that indicates the dynamic loading is complete
    await page.waitForSelector('input[name="facilityid"', {
      timeout: 2000,
    });

    // get all the values from the inputs
    const ids = await page.evaluate(() => {
      const inputs = Array.from(
        document.querySelectorAll('input[name="facilityid"]')
      );
      return inputs.map((input) => input.value);
    });
    console.log(`Ids: ${ids}`);

    // create urls from the ids
    const urls = ids.map(
      (id) => `https://ltc.dph.illinois.gov/webapp/LTCApp/LTC?facilityid=${id}`
    );
    console.log(`Urls: ${urls}`);

    const csvs = [];
    // visit the all the urls of the array
    for (const url of urls) {
      await page.goto(url);
      // create csv from the table
      const table = await page.$("table");
      const csv = await table.evaluate((table) => {
        const rows = Array.from(table.querySelectorAll("tr"));
        return rows
          .map((row) => {
            const columns = Array.from(row.querySelectorAll("th, td"));
            return columns.map((column) => column.innerText).join(",");
          })
          .join("\n");
      });
      console.log(`CSV: ${csv}`);
      csvs.push(csv);
    }

    // write the csv file
    await fs.writeFile("data.csv", csvs.join("\n"));

    // await page.goto(urls[0]);

    // take a screenshot
    // await page.screenshot({ path: "screenshot.png" });

    // console.log(`CSV: ${csv}`);
    // write the csv file
    // await fs.writeFile("data.csv", csv);
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  } finally {
    await browser.close();
  }
})();
