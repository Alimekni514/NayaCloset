import { jsx as _jsx } from "react/jsx-runtime";
import { ProductCard } from "./ProductCard";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/states";
export function ProductGrid({ products, isLoading, error, emptyTitle = "Aucun produit trouvé", emptyDescription = "Essayez d'ajuster votre recherche ou vos filtres.", }) {
    if (isLoading)
        return _jsx(LoadingSkeleton, { variant: "grid", count: 8 });
    if (error)
        return _jsx(ErrorState, { message: error?.message });
    if (!products?.length)
        return _jsx(EmptyState, { title: emptyTitle, description: emptyDescription });
    return (_jsx("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: products.map((product) => (_jsx(ProductCard, { product: product }, product.id))) }));
}
