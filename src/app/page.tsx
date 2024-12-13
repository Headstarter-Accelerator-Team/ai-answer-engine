
"use client";
import { LampContainer } from "@/components/ui/lamp";
import { useState } from "react";
import { motion } from "framer-motion";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";

type Message = {
  role: "user" | "ai";
  content: string;
};


function extractUrls(input: string): string[] {
    // Regular expression to match URLs
    // const urlRegex = /https?:\/\/(?:www\.)?[a-zA-Z0-9._-]+\.[a-zA-Z]{2,}(?:\/[a-zA-Z0-9._-]*)*/g;
    const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;

    // Use the match method to find all URLs in the string
    const matches = input.match(urlRegex);

    // Return the matches or an empty array if no URLs were found
    return matches || [];
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! How can I help you today?" },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const extract_URL_Content = async (urls: string[]) => {
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ URLs: urls}),
      })
      if (!response.ok) {
        console.error("Error");
        return [];
      }

      const result = await response.json();
      console.log("Result: ", result);

      console.log("Structured Data: ", result.content);
      return result.content;
    } catch (error) {
      console.error("Error: ", error);
      return [];
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;


    const urls = extractUrls(message);

    console.log(urls);

    const url_data = (urls.length > 0) ? await extract_URL_Content(urls) : [];

    console.log("URL Data: ", url_data);

    // Add user message to the conversation
    const userMessage = { role: "user" as const, content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {

      const combinedContent = {
        userMessage: message,
        urlContent: url_data,
      }
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: combinedContent }),
      });

      // TODO: Handle the response from the chat API to display the AI response in the UI

      if (!response.ok){
        throw new Error(`Response status: ${response.status}`);
      }

      const result = await response.json();

      console.log(result);

      const llm_message = typeof result.response === "string" 
      ? result.response 
      : JSON.stringify(result.response);

      const llm_response = { role: "ai" as const, content: llm_message};

      setMessages(prev => [...prev, llm_response]);
      setMessage("");

    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [
        ...prev,
        { role: "ai", content: "Something went wrong. Please try again." },
      ]);

    } finally {
      setIsLoading(false);
    }
  };


  // TODO: Modify the color schemes, fonts, and UI as needed for a good user experience
  // Refer to the Tailwind CSS docs here: https://tailwindcss.com/docs/customizing-colors, and here: https://tailwindcss.com/docs/hover-focus-and-other-states
  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="w-full bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-semibold text-white">Chat</h1>
        </div>
      </div>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto pb-32 pt-4">
        <div className="max-w-3xl mx-auto px-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-4 mb-4 ${
                msg.role === "ai"
                  ? "justify-start"
                  : "justify-end flex-row-reverse"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                  msg.role === "ai"
                    ? "bg-gray-800 border border-gray-700 text-gray-100"
                    : "bg-cyan-600 text-white ml-auto"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 mb-4">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-8c.79 0 1.5-.71 1.5-1.5S8.79 9 8 9s-1.5.71-1.5 1.5S7.21 11 8 11zm8 0c.79 0 1.5-.71 1.5-1.5S16.79 9 16 9s-1.5.71-1.5 1.5.71 1.5 1.5 1.5zm-4 4c2.21 0 4-1.79 4-4h-8c0 2.21 1.79 4 4 4z" />
                </svg>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-gray-800 border border-gray-700 text-gray-100">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 w-full bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-center">
            {/* <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyPress={e => e.key === "Enter" && handleSend()}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-400"
            /> */}
            <PlaceholdersAndVanishInput 
              placeholders={['Type your message...']}
              onChange={e => setMessage(e.target.value)}
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                handleSend();
              }}
            />
            {/* <button
              onClick={handleSend}
              disabled={isLoading}
              className="bg-cyan-600 text-white px-5 py-3 rounded-xl hover:bg-cyan-700 transition-all disabled:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send"}
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
}
