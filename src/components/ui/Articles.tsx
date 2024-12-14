"use client";
import React from "react";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";

// interface Article {
//   title: string;
//   url: string;
//   publisher: string;
//   summary: string;
// }

interface StickyScrollComponentProps {
  articleLinks: string[];
}

export const StickyScrollComponent: React.FC<StickyScrollComponentProps> = ({
  articleLinks = [],
}) => {
  // If no articles, show placeholder
  // if (articles.length === 0) {
  //   return (
  //     <div className="h-full flex items-center justify-center text-gray-400">
  //       <p>No articles to display</p>
  //     </div>
  //   );
  // }

  const content = articleLinks.map((link, index) => ({
    title: `placeholder ${index + 1}`,
    description: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-100"></h3>
        <p className="text-sm text-gray-300">placeholder</p>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>placeholder</span>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300"
          >
            {/* Read more → */} {link}
          </a>
        </div>
      </div>
    ),
  }));

  // If no articles, show placeholder
  if (articleLinks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <p>No links to display</p>
      </div>
    );
  }
  return (
    <div className="h-full p-4">
      <StickyScroll content={content} />
    </div>
  );
};
