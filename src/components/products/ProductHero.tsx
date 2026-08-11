import React from 'react';
import { ArrowRight, Download } from 'lucide-react';
import type { ProductDefinition } from '../../products/catalog';
import { trackProductEvent, type ProductEventName } from '../../analytics/productEvents';

interface ProductHeroProps {
  product: ProductDefinition;
  primaryAction: { label: string; href: string; analyticsEvent?: ProductEventName };
  secondaryAction?: { label: string; href: string; analyticsEvent?: ProductEventName };
}

const ProductHero: React.FC<ProductHeroProps> = ({ product, primaryAction, secondaryAction }) => (
  <header className="border-b border-gray-200 bg-gradient-to-b from-blue-50 to-white">
    <div className="container mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <p className="mb-4 text-sm font-semibold tracking-wide text-blue-700">
        乐可开源出品 · v{product.version}
      </p>
      <h1 className="mb-5 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
        {product.name}
      </h1>
      <p className="mb-4 text-2xl font-semibold text-gray-800">{product.tagline}</p>
      <p className="max-w-3xl text-lg leading-8 text-gray-600">{product.summary}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={primaryAction.href}
          onClick={() => primaryAction.analyticsEvent && trackProductEvent(primaryAction.analyticsEvent)}
          className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          {primaryAction.label}
          <ArrowRight className="ml-2" size={18} aria-hidden="true" />
        </a>
        {secondaryAction && (
          <a
            href={secondaryAction.href}
            onClick={() => secondaryAction.analyticsEvent && trackProductEvent(secondaryAction.analyticsEvent)}
            className="inline-flex min-h-11 items-center rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 transition-colors hover:border-blue-400 hover:text-blue-700"
          >
            <Download className="mr-2" size={18} aria-hidden="true" />
            {secondaryAction.label}
          </a>
        )}
      </div>
    </div>
  </header>
);

export default ProductHero;
