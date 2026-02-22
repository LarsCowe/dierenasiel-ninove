export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { getNewsArticles } from "@/lib/queries/news";
import { formatDate } from "@/lib/utils";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export const metadata: Metadata = {
  title: "Nieuws",
  description:
    "Blijf op de hoogte van het laatste nieuws van Dierenasiel Ninove. Evenementen, adopties en meer.",
};

const cardColors = [
  "bg-gradient-to-br from-[#d8f3dc] to-[#b7e4c7]",
  "bg-gradient-to-br from-[#fde2e4] to-[#fad2e1]",
  "bg-gradient-to-br from-[#d4e09b] to-[#f6f4d2]",
  "bg-gradient-to-br from-[#a8dadc] to-[#bee1e6]",
];

export default async function NieuwsPage() {
  const articles = await getNewsArticles();

  return (
    <div className="pt-28 pb-20 bg-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Nieuws
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Laatste nieuwtjes
          </h1>
          <p className="text-text-light max-w-xl mx-auto leading-relaxed">
            Blijf op de hoogte van alles wat er in en rond het asiel gebeurt.
          </p>
        </AnimateOnScroll>

        {articles.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📰</div>
            <p className="text-text-light">
              Er zijn momenteel geen nieuwsberichten. Kijk later nog eens!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {articles.map((article, idx) => (
              <AnimateOnScroll key={article.id}>
                <Link
                  href={`/nieuws/${article.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:-translate-y-1.5 hover:shadow-lg transition-all block"
                >
                  <div
                    className={`aspect-video flex items-center justify-center text-4xl ${
                      cardColors[idx % cardColors.length]
                    }`}
                  >
                    📰
                  </div>
                  <div className="p-6">
                    <div className="text-xs font-semibold text-accent mb-2.5">
                      {formatDate(article.publishedAt)}
                    </div>
                    <h2 className="font-heading text-lg font-bold text-primary-dark mb-2.5 leading-snug">
                      {article.title}
                    </h2>
                    <p className="text-sm text-text-light leading-relaxed mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary group-hover:text-accent group-hover:gap-2.5 transition-all">
                      Lees meer →
                    </span>
                  </div>
                </Link>
              </AnimateOnScroll>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
