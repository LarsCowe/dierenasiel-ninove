export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getNewsArticles } from "@/lib/queries/news";
import { formatDate } from "@/lib/utils";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export const metadata: Metadata = {
  title: "Nieuws",
  description:
    "Blijf op de hoogte van het laatste nieuws van Dierenasiel Ninove. Evenementen, adopties en meer.",
};

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
                  <div className="aspect-video relative overflow-hidden bg-gray-100">
                    {article.imageUrl ? (
                      <Image
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-[#d8f3dc] to-[#b7e4c7]">
                        📰
                      </div>
                    )}
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
