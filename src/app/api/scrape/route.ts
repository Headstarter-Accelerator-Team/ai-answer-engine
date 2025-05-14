import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import puppeteer from "puppeteer-core";

export async function POST(req: NextRequest) {
  console.log("Endpoint hit /api/scrape");

  try {
    // Parse incoming request
    const data = await req.json();
    const URLs = data.URLs;

    console.log("URLs: ", URLs);

    const urlContent = [];

    for (const currUrl of URLs) {
      console.log("Scraping: ", currUrl);

      // Launch the Puppeteer browser
      const browser = await puppeteer.connect({
        browserWSEndpoint: process.env.BRIGHT_DATA_ENDPOINT_PUPPETEER,
      });

      try {
        console.log("Opening new page.");
        const page = await browser.newPage();

        // Disable JavaScript for basic HTML scraping
        await page.setJavaScriptEnabled(false);

        // Navigate to the URL
        await page.goto(currUrl, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });

        console.log("Visiting ", currUrl);

        // Extract page content
        // const html = await page.content();

        // Extract content
        const structuredContent = await page.evaluate(() => {
          const getText = (selector: string) =>
            Array.from(document.querySelectorAll(selector)).map(el =>
              (el as HTMLElement).innerText.trim()
            );

          return {
            title:
              document.title ||
              document.querySelector("h1")?.innerText ||
              "No title",
            headings: Array.from(document.querySelectorAll("h1, h2, h3")).map(
              heading => ({
                heading: (heading as HTMLElement).innerText.trim(),
                tag: heading.tagName.toLowerCase(),
              })
            ),
            paragraphs: getText("p"),
            // links: Array.from(document.querySelectorAll("a")).map(link => ({
            //     text: link.innerText.trim(),
            //     url: link.href
            // }))
          };
        });

        urlContent.push({
          url: currUrl,
          content: structuredContent,
        });
      } catch (error) {
        console.error(`Failed to scrape ${currUrl}:`, error);
        urlContent.push({
          url: currUrl,
          content: null,
          error: "Failed to scrape this URL",
        });
      } finally {
        // Ensure the browser is closed properly
        await browser.close();
      }
    }

    console.log("URL Content: ", JSON.stringify(urlContent));

    return NextResponse.json({ content: urlContent });
  } catch (error) {
    console.error("Failed to scrape URLs: ", error);
    return NextResponse.json(
      { error: "An error occurred while scraping URLs." },
      { status: 500 }
    );
  }
}
