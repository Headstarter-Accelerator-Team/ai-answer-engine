import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import * as cheerio from "cheerio";
import axios from "axios";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

const groq = new Groq({
  apiKey: GROQ_API_KEY!,
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

  const limitedItems = data.items?.slice(0, 2) || [];
  return limitedItems.map((item: any) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
  }));
}

async function parseTopResultsWithCheerio(searchResults: SearchResult[]) {
  const parsedResults = await Promise.all(
    searchResults.map(async result => {
      try {
        const response = await axios.get(result.link);
        const $ = cheerio.load(response.data);

        const title = $("title").text().trim();
        const allParagraphs = $("p")
          .map((i, elem) => $(elem).text().trim())
          .get()
          .filter(text => text.length > 0);

        const combinedContent = [title, ...allParagraphs].join(" ");
        const limitedContent = combinedContent
          .split(/\s+/)
          .slice(0, 3000)
          .join(" ");

        return {
          title: title,
          content: limitedContent,
          url: result.link,
        };
      } catch (error) {
        console.error(`Error parsing ${result.link}:`, error);
        return {
          title: result.title,
          content: result.snippet,
          url: result.link,
        };
      }
    })
  );

  return parsedResults;
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get search results
    const searchResults = await getGoogleSearchResults(message);

    // Parse the content
    const parsedContent = await parseTopResultsWithCheerio(searchResults);

    // Format content for LLM
    const formattedContent = parsedContent
      .map(
        (item, index) => `Source ${index + 1} (${item.url}):\n${item.content}`
      )
      .join("\n\n");

    // Prepare prompt for LLM
    const systemPrompt = `You are a helpful and knowledgeable AI assistant.

If a user provides a source/URL analyze it and return relevant information from the provided sources:

ALWAYS FOLLOW THE GUIDELINES IN ** **

**Focus on extracting and synthesizing key information**
**Maintain a balanced perspective from multiple sources**
**When no source is available use your general knowledge or retrieve relevant sources to provide an answer**
**Maintain a professional yet friendly tone*
**Acknowledge that your information comes from the provided sources**
**Mention when information might need verification**
**Include relevant dates or timeframes when available**

Remember: Your goal is to provide helpful, accurate information while being 
transparent about your sources and limitations.

Current sources available:
${formattedContent ? `\n${formattedContent}` : "\nNo external sources available for this query."}`;

    // Get LLM response
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Question: ${message}\n\nSources:\n${formattedContent}`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const response =
      completion.choices[0]?.message?.content ||
      "I couldn't generate a response.";

    return NextResponse.json({
      response,
      articles: parsedContent.map(item => ({
        title: item.title,
        url: item.url,
        summary: item.content.substring(0, 200) + "...",
      })),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
