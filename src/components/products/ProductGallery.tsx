import React from 'react';

interface ProductGalleryProps {
  items: { title: string; description: string; image: string; alt: string }[];
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ items }) => (
  <section className="bg-gray-50 py-16" aria-labelledby="gallery-title">
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <h2 id="gallery-title" className="text-3xl font-bold text-gray-950">真实界面</h2>
      <p className="mt-3 text-gray-600">以下画面来自当前版本，并使用演示数据完成脱敏。</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {items.map((item) => (
          <article key={item.title} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <img
              src={item.image}
              alt={item.alt}
              width="1200"
              height="675"
              loading="lazy"
              decoding="async"
              className="aspect-video w-full bg-gray-100 object-cover"
            />
            <div className="p-6">
            <h3 className="mt-4 font-bold text-gray-950">{item.title}</h3>
            <p className="mt-2 leading-6 text-gray-600">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default ProductGallery;
