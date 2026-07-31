import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Banknote, Truck } from "lucide-react";
import heroImage from "@/assets/hero.jpg";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductGrid } from "@/components/store/ProductGrid";
import { Button } from "@/components/ui/button";
import { useCategories, useProducts } from "@/features/shared/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dar Souk — Boutique en ligne livrée partout en Tunisie" },
      {
        name: "description",
        content:
          "Artisanat tunisien et objets tech sélectionnés avec soin. Livraison 48 h partout en Tunisie et paiement à la livraison.",
      },
      { property: "og:title", content: "Dar Souk — Boutique en ligne en Tunisie" },
      {
        property: "og:description",
        content: "Sélection premium livrée partout en Tunisie, paiement à la livraison, prix en TND.",
      },
    ],
  }),
  component: HomePage,
});

const PERKS = [
  { icon: Truck, title: "Livraison 48–72 h", text: "Dans les 24 gouvernorats" },
  { icon: Banknote, title: "Paiement à la livraison", text: "Payez en espèces à réception" },
  { icon: BadgeCheck, title: "Produits vérifiés", text: "Contrôle qualité avant expédition" },
];

function HomePage() {
  const { data: categories } = useCategories();
  const { data: products, isLoading, error } = useProducts({ sort: "rating" });
  const featured = products?.filter((p) => p.featured).slice(0, 4);

  return (
    <StoreLayout>
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="relative overflow-hidden rounded-4xl">
          <img
            src={heroImage}
            alt="Sélection d'objets premium sur lin naturel"
            width={1600}
            height={1104}
            className="h-[440px] w-full object-cover sm:h-[520px]"
          />
          <div className="absolute inset-0 bg-[image:var(--gradient-hero)]" />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-xl px-6 sm:px-12">
              <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                Nouvelle collection 2026
              </span>
              <h1 className="mt-4 font-display text-4xl font-semibold text-primary-foreground sm:text-5xl">
                Le beau et l'utile, livrés chez vous
              </h1>
              <p className="mt-4 text-base text-primary-foreground/85 sm:text-lg">
                Artisanat tunisien et objets tech soigneusement sélectionnés. Paiement à la livraison,
                partout en Tunisie.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="secondary">
                  <Link to="/produits">
                    Découvrir le catalogue
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-7xl gap-4 px-4 sm:grid-cols-3 sm:px-6">
        {PERKS.map((perk) => (
          <div key={perk.title} className="surface-card flex items-center gap-3 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <perk.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{perk.title}</p>
              <p className="truncate text-xs text-muted-foreground">{perk.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">Catégories</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories?.map((category) => (
            <Link
              key={category.id}
              to="/produits"
              search={{ categorie: category.slug }}
              className="surface-card group flex flex-col justify-between gap-6 p-6 transition-shadow hover:shadow-lift"
            >
              <div>
                <p className="font-display text-lg font-semibold">{category.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Explorer <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">Coups de cœur</h2>
          <Button asChild variant="ghost">
            <Link to="/produits">
              Tout voir <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-6">
          <ProductGrid products={featured} isLoading={isLoading} error={error} />
        </div>
      </section>

      <section className="mx-auto mt-16 grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-3">
        <div className="surface-card bg-primary p-8 text-primary-foreground lg:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/70">
            Offre du mois
          </p>
          <h3 className="mt-3 font-display text-3xl font-semibold">Livraison offerte dès 400 TND</h3>
          <p className="mt-2 max-w-lg text-primary-foreground/85">
            Sur toutes les commandes réglées à la livraison, dans tous les gouvernorats.
          </p>
          <Button asChild variant="secondary" className="mt-6">
            <Link to="/produits">J'en profite</Link>
          </Button>
        </div>
        <div className="surface-card bg-accent p-8 text-accent-foreground">
          <p className="text-sm font-semibold uppercase tracking-widest opacity-70">Artisanat</p>
          <h3 className="mt-3 font-display text-2xl font-semibold">Pièces uniques faites main</h3>
          <p className="mt-2 text-sm opacity-90">
            Tapis, bois d'olivier et cuir travaillés dans des ateliers familiaux.
          </p>
          <Button asChild variant="outline" className="mt-6 bg-transparent">
            <Link to="/produits" search={{ categorie: "maison" }}>
              Voir la sélection
            </Link>
          </Button>
        </div>
      </section>
    </StoreLayout>
  );
}
