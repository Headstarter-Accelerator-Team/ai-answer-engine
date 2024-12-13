// TODO: Implement the chat API with Groq and web scraping with Cheerio and Puppeteer
// Refer to the Next.js Docs on how to read the Request body: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
// Refer to the Groq SDK here on how to use an LLM: https://www.npmjs.com/package/groq-sdk
// Refer to the Cheerio docs here on how to parse HTML: https://cheerio.js.org/docs/basics/loading
// Refer to Puppeteer docs here: https://pptr.dev/guides/what-is-puppeteer

//JSON format {query: "exampple of user query, best biotracking wearables"}

import { NextRequest, NextResponse } from "next/server";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import axios from "axios";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
// Initialize OpenAI client

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

const openai = new Groq({
  apiKey: GROQ_API_KEY!,
  baseURL: "https://api.groq.com",
});

async function getGoogleSearchResults(query: string): Promise<SearchResult[]> {
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Google API error: ${data.error?.message || "Unknown error"}`
    );
  }
  const limitedItems = data.items.slice(0, 2);
  console.log("12423", limitedItems);
  return limitedItems.map((item: SearchResult) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
  }));
}

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    console.log("", body);
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Step 1: Scrape the top 10 Google results
    const scrapedHTMLPages = await getGoogleSearchResults(message);

    // Step 2: Parse the content of the results
    const extractedData = parseTopResultsWithCheerio(scrapedHTMLPages);

    // LLM interaction
    const systemPrompt = `
      You are an expert in web content analysis. Use the following data to answer the query:
      **Task:**
      1. Analyze the extracted data and provide a comprehensive, informative, and concise response to the query.
      2. Cite sources within the response using a format like: (Source 1) or (Source 2).
      3. Avoid plagiarism and ensure the response is original and well-structured.

      **Format:**
      * **Answer:** 
      * **Sources Cited:**
      ${(await extractedData).join("\n\n")}\n\n
    `;

    const llmResponse = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const llmAnswer = llmResponse.choices[0]?.message?.content || "No response";
    // console.log(query, scrapedHTMLPages, llmAnswer);
    return NextResponse.json({
      llmAnswer,
    });
  } catch (error: unknown) {
    console.error("Error querying the LLM:", (error as Error).message);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

async function scrapeTopGoogleResults(query: string): Promise<string[]> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Step 1: Navigate to Google with the search query
  const searchURL = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  await page.goto(searchURL, { waitUntil: "networkidle2" });

  // Step 2: Extract the top 2 result links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a"))
      .filter(a => a.href.includes("http"))
      .map(a => a.href)
      .slice(0, 2); // Limit to top 2 links
  });

  // Step 3: Visit each link and extract its HTML
  const results: string[] = [];
  for (const link of links) {
    try {
      const newPage = await browser.newPage();
      await newPage.goto(link, { waitUntil: "networkidle2" });
      const html = await newPage.content();
      results.push(html);
      await newPage.close();
    } catch (error) {
      console.error(`Error scraping ${link}:`, error);
    }
  }

  await browser.close();
  return results;
}

async function parseTopResultsWithCheerio(searchResults: SearchResult[]) {
  console.log(searchResults);
  const parsedResults = await Promise.all(
    searchResults.map(async result => {
      const response = await axios.get(result.link);
      const $ = cheerio.load(response.data);

      // Extract relevant data from each page
      //console.log("link: ", result.link);
      const title = $("title").text();
      //const description = $("meta[name='description']").attr("content") || "";
      const allParagraphs = $("p")
        .map((i, elem) => $(elem).text())
        .get();
      //console.log("scraped data: ", title);
      return `${title}\n${allParagraphs}`;
    })
  );

  return parsedResults;
}
