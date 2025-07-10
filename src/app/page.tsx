import React from "react";
import Navbar from "../../components/navigation/Navbar";
import ArticleFeed from "../../components/feed/ArticleFeed";

export default function HomePage() {
  return (
    <main className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="container mx-auto py-6">
        <ArticleFeed />
      </div>
    </main>
  );
}
