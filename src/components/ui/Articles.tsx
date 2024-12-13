"use client";
import React from "react";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";

interface Article {
  title: string;
  url: string;
  publisher: string;
  summary: string;
}

interface StickyScrollComponentProps {
  articles?: Article[];
}

export const StickyScrollComponent: React.FC<StickyScrollComponentProps> = ({
  articles = [
    {
      title: "Bitcoin Surges Past $50,000 as Institutional Interest Grows",
      url: "https://example.com/bitcoin-surge",
      publisher: "CryptoNews Daily",
      summary:
        "Bitcoin has reached a new milestone, surpassing $50,000 for the first time in 2024. Analysts attribute this surge to increased institutional adoption and the recent approval of Bitcoin ETFs. Major financial institutions are showing renewed interest in cryptocurrency investments.",
    },
    {
      title:
        "New Bitcoin Mining Facility Opens in Texas Using Renewable Energy",
      url: "https://example.com/bitcoin-mining-texas",
      publisher: "Green Tech Weekly",
      summary:
        "A state-of-the-art Bitcoin mining facility has opened in Texas, powered entirely by wind and solar energy. This development marks a significant step towards sustainable cryptocurrency mining, addressing environmental concerns associated with Bitcoin mining operations.",
    },
    {
      title: "El Salvador's Bitcoin City Project Shows Significant Progress",
      url: "https://example.com/bitcoin-city-progress",
      publisher: "Global Crypto Report",
      summary:
        "El Salvador's ambitious Bitcoin City project is taking shape with major infrastructure developments underway. The city, powered by volcanic energy, aims to be a hub for cryptocurrency innovation and financial technology.",
    },
    {
      title:
        "Major Retailers Begin Accepting Bitcoin Lightning Network Payments",
      url: "https://example.com/lightning-network-adoption",
      publisher: "Tech Finance Today",
      summary:
        "Several major retail chains have announced plans to integrate Bitcoin Lightning Network payments into their systems, promising faster and cheaper transactions for customers. This move could significantly boost Bitcoin's adoption in everyday commerce.",
    },
    {
      title: "New Regulatory Framework for Cryptocurrency Trading Proposed",
      url: "https://example.com/crypto-regulations",
      publisher: "Financial Policy Review",
      summary:
        "Global financial regulators have proposed a new framework for cryptocurrency trading, aimed at providing clearer guidelines while protecting investors. The proposal includes measures for enhanced transparency and risk management.",
    },
    {
      title: "Bitcoin's Network Hash Rate Reaches All-Time High",
      url: "https://example.com/hash-rate-record",
      publisher: "Blockchain Observer",
      summary:
        "Bitcoin's network security continues to strengthen as the hash rate reaches unprecedented levels. This increase in mining activity suggests growing confidence in the network's long-term prospects.",
    },
    {
      title:
        "Major Bank Launches Bitcoin Custody Services for Institutional Clients",
      url: "https://example.com/bank-bitcoin-custody",
      publisher: "Banking Technology News",
      summary:
        "One of the world's largest banks has announced the launch of Bitcoin custody services for institutional clients, marking another milestone in cryptocurrency's integration with traditional finance.",
    },
  ],
}) => {
  // If no articles, show placeholder
  if (articles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <p>No articles to display</p>
      </div>
    );
  }

  const content = articles.map((article, index) => ({
    title: article.title,
    description: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-100">{article.title}</h3>
        <p className="text-sm text-gray-300">{article.summary}</p>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{article.publisher}</span>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300"
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
