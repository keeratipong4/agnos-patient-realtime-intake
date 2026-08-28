import { useId, type ReactNode } from "react";

type FormSectionProps = {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
};

export function FormSection({
  children,
  description,
  eyebrow,
  title,
}: FormSectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="py-8 first:pt-0 last:pb-0">
      <div className="mb-6 border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
          {eyebrow}
        </p>
        <h2
          className="mt-2 text-xl font-bold tracking-tight text-slate-950"
          id={headingId}
        >
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
