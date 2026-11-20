import { Suspense } from "react";
import StoreNav, { StoreNavFallback } from "./StoreNav";

/** The store's own bar (Shop, Cart, Orders) above every store page. */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<StoreNavFallback />}>
        <StoreNav />
      </Suspense>
      {children}
    </>
  );
}
