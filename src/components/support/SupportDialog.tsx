import React, { useEffect, useRef, useState } from 'react';
import Support from '../../pages/Support';

export default function SupportDialog({ productId }: { productId: 'leke-picker' | 'guigelei' }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const triggerElement = trigger.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key !== 'Tab' || !dialog.current) return;
      const focusable = [...dialog.current.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href]')].filter((item) => !item.hasAttribute('disabled'));
      if (!focusable.length) return;
      const first = focusable[0], last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', keydown); triggerElement?.focus(); };
  }, [open]);
  return <>
    <button ref={trigger} type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center font-semibold text-blue-700 hover:text-blue-900">使用遇到问题？提交反馈</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-0 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="support-dialog-title" tabIndex={-1} className="relative h-full w-full overflow-y-auto bg-gray-50 outline-none sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl">
        <button type="button" aria-label="关闭反馈窗口" onClick={() => setOpen(false)} className="absolute right-4 top-4 z-10 min-h-11 rounded-lg px-4 font-bold text-gray-700 hover:bg-gray-100">关闭</button>
        <Support embedded lockedProductId={productId} headingId="support-dialog-title" />
      </div>
    </div>}
  </>;
}
