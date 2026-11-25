import Link from "next/link";

/**
 * The frame of the Relume browsing pages: the /dev/relume inventory and the
 * /block-library index. `eyebrow` and `crumbs` are left out where they do
 * not apply (the Block library in production has neither).
 */
export function PageShell({
  title,
  eyebrow,
  crumbs,
  children,
}: {
  title: string;
  eyebrow?: string;
  crumbs?: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-8 text-zinc-900">
      {eyebrow ? (
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
          {eyebrow}
        </p>
      ) : null}
      {crumbs?.length ? (
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zinc-600">
          {crumbs.map((crumb) => (
            <span key={crumb.href}>
              <Link href={crumb.href} className="underline underline-offset-2 hover:text-zinc-900">
                {crumb.label}
              </Link>
              <span className="px-1.5">/</span>
            </span>
          ))}
        </nav>
      ) : null}
      <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
      {children}
    </main>
  );
}
