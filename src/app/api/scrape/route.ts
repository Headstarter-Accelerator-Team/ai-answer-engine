import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";

export async function POST(req: Response) {
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
                const html = await page.content();

                urlContent.push({
                    url: currUrl,
                    content: html,
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

        console.log("URL Content: ", urlContent);

        return NextResponse.json({ content: urlContent });
    } catch (error) {
        console.error("Failed to scrape URLs: ", error);
        return NextResponse.json(
            { error: "An error occurred while scraping URLs." },
            { status: 500 }
        );
    }
}
