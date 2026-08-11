import React from 'react';

export interface ProductFaqItem {
  question: string;
  answer: string;
}

interface ProductFaqProps {
  items: ProductFaqItem[];
}

const ProductFaq: React.FC<ProductFaqProps> = ({ items }) => (
  <section className="border-t border-gray-200 bg-gray-50 py-16" aria-labelledby="faq-title">
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <h2 id="faq-title" className="text-3xl font-bold text-gray-950">常见问题</h2>
      <div className="mt-8 space-y-4">
        {items.map((item) => (
          <details key={item.question} className="rounded-xl border border-gray-200 bg-white p-5">
            <summary className="cursor-pointer font-semibold text-gray-950">{item.question}</summary>
            <p className="mt-3 leading-7 text-gray-600">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

export default ProductFaq;
