import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AnimateOnScroll from "./AnimateOnScroll";

export default function ContentPage({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="pt-28 pb-20 bg-bg">
      <div className="max-w-3xl mx-auto px-6">
        <AnimateOnScroll>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-8 text-center">
            {title}
          </h1>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <div className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-primary-dark prose-a:text-primary hover:prose-a:text-accent prose-strong:text-text prose-li:text-text-light prose-p:text-text-light prose-blockquote:border-l-accent prose-blockquote:text-text-light">
            <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}
