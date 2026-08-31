import Image from "next/image"
import Link from "next/link"

const productLinks = [
  { label: "Overview", href: "#product" },
  { label: "Intelligence", href: "#intelligence" },
  { label: "How it works", href: "#how-it-works" },
]

const companyLinks = [
  { label: "About", href: "#" },
  { label: "Contact", href: "#" },
]

const accountLinks = [
  { label: "Log in", href: "/login" },
  { label: "Get started", href: "/signup" },
]

export default function Footer() {
  return (
    <footer className="bg-[#17153B] text-[#F1F0F8]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="border-t border-[#F1F0F8]/10 py-12 sm:py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
            {/* Brand */}
            <div>
              <Link
                href="/"
                className="inline-flex items-center"
                aria-label="Nexora home"
              >
                <Image
                  src="/nexora.logo.png"
                  alt="Nexora"
                  width={34}
                  height={34}
                  className="h-8 w-8 object-contain"
                />
              </Link>

              <p className="mt-5 max-w-xs text-sm leading-6 text-[#C8ACD6]/55">
                Business intelligence that helps you understand what&apos;s
                happening, why it matters, and what to do next.
              </p>

              <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#C8ACD6]/35">
                Understand. Decide. Grow.
              </p>
            </div>

            {/* Product */}
            <FooterColumn
              title="Product"
              links={productLinks}
            />

            {/* Company */}
            <FooterColumn
              title="Company"
              links={companyLinks}
            />

            {/* Account */}
            <FooterColumn
              title="Account"
              links={accountLinks}
            />
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-4 border-t border-[#F1F0F8]/10 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] text-[#C8ACD6]/35">
            © {new Date().getFullYear()} Nexora. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <Link
              href="#"
              className="text-[10px] text-[#C8ACD6]/35 transition hover:text-[#C8ACD6]/65"
            >
              Privacy
            </Link>

            <Link
              href="#"
              className="text-[10px] text-[#C8ACD6]/35 transition hover:text-[#C8ACD6]/65"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#C8ACD6]/40">
        {title}
      </p>

      <div className="mt-5 space-y-3">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="block w-fit text-sm text-[#C8ACD6]/60 transition hover:text-[#F1F0F8]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}