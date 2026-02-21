import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getNewsBySlug } from "@/lib/queries/news";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt || `${article.title} - Dierenasiel Ninove nieuws`,
  };
}

export default async function NieuwsDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  if (!article) notFound();

  return (
    <div className="pt-28 pb-20 bg-bg">
      <div className="max-w-3xl mx-auto px-6">
        <Link
          href="/nieuws"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent transition-colors mb-8"
        >
          ← Terug naar nieuws
        </Link>

        <article>
          <div className="text-sm font-semibold text-accent mb-3">
            {formatDate(article.publishedAt)}
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-8 leading-tight">
            {article.title}
          </h1>

          <div className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-primary-dark prose-a:text-primary hover:prose-a:text-accent prose-strong:text-text prose-blockquote:border-l-accent prose-blockquote:text-text-light">
            <Markdown remarkPlugins={[remarkGfm]}>{article.content}</Markdown>
          </div>
        </article>
      </div>
    </div>
  );
}
