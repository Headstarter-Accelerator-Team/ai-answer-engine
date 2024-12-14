// TODO: Implement the chat API with Groq and web scraping with Cheerio and Puppeteer
// Refer to the Next.js Docs on how to read the Request body: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
// Refer to the Groq SDK here on how to use an LLM: https://www.npmjs.com/package/groq-sdk
// Refer to the Cheerio docs here on how to parse HTML: https://cheerio.js.org/docs/basics/loading
// Refer to Puppeteer docs here: https://pptr.dev/guides/what-is-puppeteer

//JSON format {query: "exampple of user query, best biotracking wearables"}

import { NextRequest, NextResponse } from "next/server";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import * as cheerio from "cheerio";
import axios, { all } from "axios";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
// Initialize OpenAI client
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

const openai = new Groq({
  apiKey: GROQ_API_KEY!,
  baseURL: "https://api.groq.com",
});

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    console.log(body);
    const { query, url } = body;
    console.log(query, url);
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }
    let scrapedHTMLPages: SearchResult[] = [];
    if (url.length > 0) {
      console.log("url detect: ", url);
      scrapedHTMLPages = url.map((u: string) => ({
        title: "chat url",
        link: u, // Use the current URL from the array
        snippet: "user's url",
      }));
    } else {
      // Handle the case where no URLs are provided
      scrapedHTMLPages = await getGoogleSearchResults(query);
    }
    // Step 2: Parse the content of the results
    const extractedData = await parseTopResultsWithCheerio(scrapedHTMLPages);

    const allLinks = extractedData.flatMap(result => result.links);
    const allTitles = scrapedHTMLPages.flatMap(result => result.title);
    const allSnippets = scrapedHTMLPages.flatMap(result => result.snippet);
    const allHeadings = extractedData.flatMap(result => result.heading);
    const allAuthors = extractedData.flatMap(result => result.author);
    const completeData = extractedData.flatMap(result => result.content);
    const data = completeData.flatMap(result =>
      result.split(/\s+/).slice(0, 2500).join(" ")
    );
    // LLM interaction
    const systemPrompt = `
      YOu are an academic expert where you base your responses only on the context you have been provided.
      **Task:**
      1. Analyze the extracted data and provide a comprehensive, informative, and concise response to the query.
      2. Cite sources within the response using a format like: (Source 1) or (Source 2).
      3. Avoid plagiarism and ensure the response is original and well-structured.

      **Format:**
      * **Answer:** 
      * **Sources Cited:**
      ${(await data).join("\n\n")}\n\n
    `;
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: query + data,
      }, // Updated to access content
    ];
    //console.log("message", messages);
    const llmResponse = await openai.chat.completions.create({
      model: "llama3-8b-8192",
      messages: messages,
    });

    const llmAnswer = llmResponse.choices[0]?.message?.content || "No response";
    //console.log(llmResponse);

    // Return both the LLM answer and the extracted links
    return NextResponse.json({
      response: llmAnswer,
      links: allLinks, // Include the links in the response
      titles: allTitles,
      summarries: allSnippets,
      headings: allHeadings,
      authors: allAuthors,
    });
  } catch (error: unknown) {
    console.error("Error querying the LLM:", (error as Error).message);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

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

async function parseTopResultsWithCheerio(searchResults: SearchResult[]) {
  //console.log(searchResults);
  const parsedResults = await Promise.all(
    searchResults.map(async result => {
      const response = await axios.get(result.link);
      const $ = cheerio.load(response.data);

      // Extract relevant data from each page
      //console.log("link: ", result.link);
      const title = $("title").text();
      const author =
        $("meta[name='author']").attr("content") ||
        $("span.author").text() ||
        "Unknown Author";
      const topHeading = $("h1").first().text() || "No heading found";
      //const description = $("meta[name='description']").attr("content") || "";
      const allParagraphs = $("p")
        .map((i, elem) => $(elem).text())
        .get();

      // Extract all links from the page

      // Combine paragraphs and limit by word count
      const combinedContent = [title, ...allParagraphs].join(" ");
      const limitedContent = combinedContent
        .split(/\s+/)
        .slice(0, 700)
        .join(" "); // Limit to 100 words
      //console.log("scraped data: ", limitedContent);
      return {
        content: `${title}\n${limitedContent}`,
        links: result.link,
        author: author,
        heading: topHeading,
      };
    })
  );

  return parsedResults;
}
