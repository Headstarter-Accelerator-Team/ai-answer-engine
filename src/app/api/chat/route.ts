// TODO: Implement the chat API with Groq and web scraping with Cheerio and Puppeteer
// Refer to the Next.js Docs on how to read the Request body: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
// Refer to the Groq SDK here on how to use an LLM: https://www.npmjs.com/package/groq-sdk
// Refer to the Cheerio docs here on how to parse HTML: https://cheerio.js.org/docs/basics/loading
// Refer to Puppeteer docs here: https://pptr.dev/guides/what-is-puppeteer
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  
  try {
    // Initalize Groq client
    const client = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    
    // Retrieve user query from request body
    const data = await req.json();
    const query = data.query || "";
    console.log("Data: ", query);

    const response = await client.chat.completions.create({
      messages: [
        {
          role: "user",
          content: query,
        },
      ],
      model: "llama3-8b-8192",
    });

    console.log("Response done.")

    const result = response.choices[0]?.message?.content || "";

    console.log("Result: ", result);

    return NextResponse.json({response: result});

  } catch (error) {
    console.error("Failed to get response from groq. Error: ", error);
    return NextResponse.error();
  }
}
