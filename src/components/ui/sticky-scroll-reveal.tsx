"use client";
import React, { useRef } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock, ExternalLink } from "lucide-react";

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="mb-8 p-6 rounded-xl bg-gray-800/50">
    <div className="animate-pulse space-y-4">
      {/* Title skeleton */}
      <div className="h-8 bg-gray-700 rounded w-3/4" />

      {/* Meta info skeleton */}
      <div className="flex space-x-4">
        <div className="h-4 bg-gray-700 rounded w-20" />
        <div className="h-4 bg-gray-700 rounded w-24" />
        <div className="h-4 bg-gray-700 rounded w-16" />
      </div>

      {/* Description skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-700 rounded w-3/4" />
      </div>

      {/* Link skeleton */}
      <div className="pt-2">
        <div className="h-4 bg-gray-700 rounded w-32" />
      </div>
    </div>
  </div>
);

export const StickyScroll = ({
  content,
  contentClassName,
  isLoading = false, // Add loading prop
}: {
  content: {
    title: string;
    description: string;
    publisher?: string;
    date?: string;
    readTime?: string;
    url?: string;
    content?: React.ReactNode | any;
  }[];
  contentClassName?: string;
  isLoading?: boolean;
}) => {
  const [activeCard, setActiveCard] = React.useState(0);
  const ref = useRef<any>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    container: ref,
    offset: ["start start", "end start"],
  });
  const cardLength = content.length;

  useMotionValueEvent(scrollYProgress, "change", latest => {
    const cardsBreakpoints = content.map((_, index) => index / cardLength);
    const closestBreakpointIndex = cardsBreakpoints.reduce(
      (acc, breakpoint, index) => {
        const distance = Math.abs(latest - breakpoint);
        if (distance < Math.abs(latest - cardsBreakpoints[acc])) {
          return index;
        }
        return acc;
      },
      0
    );
    setActiveCard(closestBreakpointIndex);
  });

  return (
    <div className="h-full w-full flex items-center justify-center bg-gray-900">
      <motion.div
        className="h-full w-full flex justify-center relative space-x-10 rounded-md p-10 overflow-y-auto scrollbar-hide"
        ref={ref}
        style={{
          scrollbarWidth: "none",
        }}
      >
        <div className="w-full max-w-4xl mx-auto">
          {isLoading ? (
            // Show loading skeletons
            <>
              <LoadingSkeleton />
              <LoadingSkeleton />
              <LoadingSkeleton />
            </>
          ) : content.length > 0 ? (
            // Show actual content
            content.map((item, index) => (
              <motion.div
                key={item.title + index}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: activeCard === index ? 1 : 0.5,
                  y: 0,
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "mb-8 p-6 rounded-xl transition-all duration-300",
                  activeCard === index
                    ? "bg-gray-800 shadow-lg scale-100"
                    : "bg-gray-800/50 scale-95"
                )}
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">
                      {item.title}
                    </h2>

                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      {item.publisher && (
                        <span className="flex items-center">
                          <span className="font-medium text-cyan-400">
                            {item.publisher}
                          </span>
                        </span>
                      )}
                      {item.date && (
                        <span className="flex items-center">
                          <CalendarDays className="w-4 h-4 mr-1" />
                          {item.date}
                        </span>
                      )}
                      {item.readTime && (
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {item.readTime}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-300 leading-relaxed">
                    {item.description}
                  </p>

                  {item.url && (
                    <div className="pt-4">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Read full article
                        <ExternalLink className="w-4 h-4 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            // Show empty state
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">No articles found</p>
            </div>
          )}
          <div className="h-20" />
        </div>
      </motion.div>
    </div>
  );
};
