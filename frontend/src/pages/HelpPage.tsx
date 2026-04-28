/**
 * Help page that displays the user guide.
 */
import React from "react";
import ReactMarkdown from "react-markdown"; //
import remarkGfm from "remark-gfm"; //
import guideContent from "../docs/USER_GUIDE.md?raw";

export default function HelpPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">User Guide</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <article className="prose max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {guideContent}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
