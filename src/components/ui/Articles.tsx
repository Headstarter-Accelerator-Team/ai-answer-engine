"use client";
import React from "react";
import { StickyScroll } from "./sticky-scroll-reveal";

interface ArticleData {
  links: string[];
  titles: string[];
  summaries: string[];
  headings: string[];
  authors: string[];
}

interface StickyScrollComponentProps {
  articleData: ArticleData;
}

export const StickyScrollComponent: React.FC<StickyScrollComponentProps> = ({
  articleData,
}) => {
  // Add safety check at the beginning
  if (!articleData || !articleData.links || articleData.links.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <p>No articles to display</p>
      </div>
    );
  }

  // Ensure all arrays exist with safe fallbacks
  const links = articleData.links || [];
  const titles = articleData.titles || [];
  const summaries = articleData.summaries || [];
  const headings = articleData.headings || [];
  const authors = articleData.authors || [];

  const content = links.map((link, index) => ({
    title: titles[index] || `Source ${index + 1}`,
    description: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-100">
          {headings[index] || titles[index] || "No Title"}
        </h3>
        <p className="text-sm text-gray-300">
          {summaries[index] || "No summary available"}
        </p>
        <div className="flex flex-col gap-2 text-sm text-gray-400">
          <span>Author: {authors[index] || "Unknown"}</span>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 break-all"
          >
            Read more →
          </a>
        </div>
      </div>
    ),
  }));

  return (
    <div className="h-full p-4">
      <StickyScroll content={content} />
    </div>
  );
};
