import Link from "next/link";

const links = [
  { href: "/", label: "Map" },
  { href: "/add", label: "Add my location" },
  { href: "/edit", label: "Edit my pin" },
  { href: "/privacy", label: "Privacy" }
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-paper/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-normal text-ink">
          Physics World Map
        </Link>
        <div className="flex flex-wrap gap-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 font-medium text-stone-700 hover:bg-white hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
