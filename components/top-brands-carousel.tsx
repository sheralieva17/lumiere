"use client"

import Link from "next/link"

type BrandColumn = {
  key: string
  category: string
  direction: "up" | "down"
  brands: string[]
}

const brandColumns: BrandColumn[] = [
  {
    key: "skincare",
    category: "skincare",
    direction: "up",
    brands: ["The Ordinary", "Ma:nyo", "COSRX", "Round Lab", "Anua"],
  },
  {
    key: "makeup",
    category: "makeup",
    direction: "down",
    brands: ["NARS", "Estee Lauder", "MAC Cosmetics", "Huda Beauty", "NYX"],
  },
  {
    key: "fragrance",
    category: "fragrance",
    direction: "up",
    brands: ["Chanel", "Dior", "Gucci", "Yves Saint Laurent", "Valentino"],
  },
  {
    key: "haircare",
    category: "haircare",
    direction: "down",
    brands: ["Kerastase", "Semi dilino", "Olaplex", "Odele", "Living Proof"],
  },
]

const categoryLabelByKey: Record<string, string> = {
  skincare: "Уход",
  makeup: "Макияж",
  fragrance: "Ароматы",
  haircare: "Волосы",
}

const brandLogoByName: Record<string, string> = {
  "The Ordinary": "/brand-logos/the-ordinary.svg",
  "Ma:nyo": "/brand-logos/ma-nyo.svg",
  COSRX: "/brand-logos/cosrx.svg",
  "Round Lab": "/brand-logos/round-lab.svg",
  Anua: "/brand-logos/anua.svg",
  NARS: "/brand-logos/nars.svg",
  "Estee Lauder": "/brand-logos/estee-lauder.svg",
  "MAC Cosmetics": "/brand-logos/mac-cosmetics.svg",
  "Huda Beauty": "/brand-logos/huda-beauty.svg",
  NYX: "/brand-logos/nyx.svg",
  Chanel: "/brand-logos/chanel.svg",
  Dior: "/brand-logos/dior.svg",
  Gucci: "/brand-logos/gucci.svg",
  "Yves Saint Laurent": "/brand-logos/yves-saint-laurent.svg",
  Valentino: "/brand-logos/valentino.svg",
  Kerastase: "/brand-logos/kerastase.svg",
  "Semi dilino": "/brand-logos/semi-dilino.svg",
  Olaplex: "/brand-logos/olaplex.svg",
  Odele: "/brand-logos/odele.svg",
  "Living Proof": "/brand-logos/living-proof.svg",
}

export function TopBrandsCarousel() {
  return (
    <section className="relative overflow-hidden py-16 lg:py-24 border-t border-border/60">
      <div className="pointer-events-none absolute inset-0">
        <div className="brand-glow brand-glow-1" />
        <div className="brand-glow brand-glow-2" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-accent mb-2">Подбор брендов</p>
          <h2 className="font-serif text-3xl lg:text-4xl tracking-tight text-foreground">Топ-5 брендов</h2>
        </div>

        <div className="brand-shell rounded-2xl border border-border p-4 lg:p-6">
          <div className="brand-category-row">
            {brandColumns.map((column) => (
              <p key={column.key} className="brand-category-label">
                {categoryLabelByKey[column.key] ?? column.key}
              </p>
            ))}
          </div>
          <div className="brand-columns-grid">
            {brandColumns.map((column) => {
              const loop = Array.from({ length: 4 }).flatMap(() => column.brands)
              return (
                <div key={column.key} className="brand-column">
                  <p className="brand-column-title-mobile">
                    {categoryLabelByKey[column.key] ?? column.key}
                  </p>
                  <div
                    className={`brand-track ${
                      column.direction === "up" ? "brand-track-up" : "brand-track-down"
                    }`}
                  >
                    {loop.map((brand, index) => (
                      <Link
                        key={`${column.key}-${brand}-${index}`}
                        href={`/shop?category=${column.category}&brand=${encodeURIComponent(brand)}`}
                        className="brand-logo"
                      >
                        <img
                          src={brandLogoByName[brand] ?? ""}
                          alt={brand}
                          className={`brand-logo-image ${
                            brand === "The Ordinary" ? "brand-logo-image-ordinary" : ""
                          }`}
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .brand-shell {
          background:
            radial-gradient(circle at 12% 20%, rgba(229, 196, 164, 0.18), transparent 42%),
            radial-gradient(circle at 88% 82%, rgba(160, 178, 208, 0.18), transparent 40%),
            linear-gradient(135deg, hsl(var(--card) / 0.92), hsl(var(--background) / 0.88));
          backdrop-filter: blur(4px);
          box-shadow: 0 24px 56px -36px rgba(10, 10, 10, 0.35);
        }

        .brand-glow {
          position: absolute;
          width: 460px;
          height: 460px;
          border-radius: 9999px;
          filter: blur(72px);
          opacity: 0.38;
          animation: glowDrift 12s ease-in-out infinite alternate;
        }

        .brand-glow-1 {
          top: -190px;
          left: -120px;
          background: #f3d8be;
        }

        .brand-glow-2 {
          bottom: -220px;
          right: -120px;
          background: #d7dff0;
          animation-delay: 2s;
        }

        .brand-columns-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 12px;
        }

        .brand-category-row {
          display: none;
        }

        .brand-category-label {
          text-align: center;
          font-size: 0.9rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: hsl(var(--foreground));
          font-weight: 600;
        }

        .brand-column {
          --brand-item-height: 62px;
          --brand-item-width: 180px;
          --brand-gap: 10px;
          position: relative;
          height: 132px;
          overflow: hidden;
          border-radius: 14px;
          border: 1px solid hsl(var(--border));
          background: linear-gradient(
            160deg,
            hsl(var(--background) / 0.95),
            hsl(var(--background) / 0.78)
          );
          padding: 8px;
          -webkit-mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(0, 0, 0, 0.45) 10%,
            rgba(0, 0, 0, 1) 22%,
            rgba(0, 0, 0, 1) 78%,
            rgba(0, 0, 0, 0.45) 90%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(0, 0, 0, 0.45) 10%,
            rgba(0, 0, 0, 1) 22%,
            rgba(0, 0, 0, 1) 78%,
            rgba(0, 0, 0, 0.45) 90%,
            transparent 100%
          );
        }

        .brand-column-title-mobile {
          position: absolute;
          top: 10px;
          left: 12px;
          right: 12px;
          z-index: 4;
          text-align: center;
          font-size: 0.86rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: hsl(var(--foreground));
          font-weight: 600;
        }

        .brand-column::before,
        .brand-column::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          height: 36px;
          z-index: 2;
          pointer-events: none;
        }

        .brand-column::before {
          top: 0;
          background: linear-gradient(to bottom, hsl(var(--background)), transparent);
        }

        .brand-column::after {
          bottom: 0;
          background: linear-gradient(to top, hsl(var(--background)), transparent);
        }

        .brand-column:nth-child(2n) {
          background: linear-gradient(
            160deg,
            hsl(var(--secondary) / 0.45),
            hsl(var(--background) / 0.8)
          );
        }

        .brand-track {
          display: flex;
          flex-direction: row;
          gap: var(--brand-gap);
          width: max-content;
          will-change: transform;
          margin-top: 34px;
        }

        .brand-track-up {
          animation: horizontalLeft 14s linear infinite;
        }

        .brand-track-down {
          animation: horizontalRight 14s linear infinite;
        }

        .brand-logo {
          width: var(--brand-item-width);
          height: var(--brand-item-height);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid hsl(var(--border));
          border-radius: 10px;
          padding: 0.6rem 0.75rem;
          color: hsl(var(--foreground));
          text-align: center;
          background: linear-gradient(
            150deg,
            hsl(var(--card) / 0.98),
            hsl(var(--secondary) / 0.45)
          );
          box-shadow: 0 10px 24px -18px rgba(15, 15, 15, 0.5);
          transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .brand-logo-image {
          width: 90%;
          height: 70%;
          object-fit: contain;
          display: block;
        }

        .brand-logo-image-ordinary {
          width: 95%;
          height: 78%;
        }

        .brand-logo:hover {
          background: hsl(var(--secondary));
          border-color: hsl(var(--foreground) / 0.28);
          box-shadow: 0 16px 28px -20px rgba(15, 15, 15, 0.65);
        }

        @keyframes horizontalLeft {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(
              calc(-1 * (5 * var(--brand-item-width) + 4 * var(--brand-gap)))
            );
          }
        }

        @keyframes horizontalRight {
          from {
            transform: translateX(
              calc(-1 * (5 * var(--brand-item-width) + 4 * var(--brand-gap)))
            );
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes verticalUp {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(
              calc(-1 * (5 * var(--brand-item-height) + 4 * var(--brand-gap)))
            );
          }
        }

        @keyframes verticalDown {
          from {
            transform: translateY(
              calc(-1 * (5 * var(--brand-item-height) + 4 * var(--brand-gap)))
            );
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes glowDrift {
          from {
            transform: translate3d(0, 0, 0) scale(1);
          }
          to {
            transform: translate3d(16px, -10px, 0) scale(1.05);
          }
        }

        @media (min-width: 1024px) {
          .brand-columns-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
          }

          .brand-category-row {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 10px;
          }

          .brand-category-label {
            font-size: 0.98rem;
          }

          .brand-column {
            --brand-item-height: 66px;
            --brand-item-width: 100%;
            height: 320px;
          }

          .brand-column-title-mobile {
            display: none;
          }

          .brand-track {
            flex-direction: column;
            width: 100%;
            margin-top: 8px;
          }

          .brand-track-up {
            animation: verticalUp 14s linear infinite;
          }

          .brand-track-down {
            animation: verticalDown 14s linear infinite;
          }

          .brand-logo {
            width: 100%;
          }
        }

      `}</style>
    </section>
  )
}
