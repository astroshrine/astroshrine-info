import { notFound } from "next/navigation";

/**
 * This route only ever renders the 404, so there is no shell to make instant: opt it out of instant-navigation
 * validation, which otherwise reports the notFound() below as an error in development.
 */
export const instant = false;

/** Any path that matches no page: the site's own 404 (../not-found.tsx), in the visitor's language. */
export default function UnknownPage() {
  notFound();
}
