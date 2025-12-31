// app/[locale]/(main)/[...slug]/page.tsx
// Route catch-all pour capturer toutes les routes non définies
import { notFound } from "next/navigation";

export default function CatchAll() {
  // Appeler notFound() pour afficher la page not-found.tsx personnalisée
  notFound();
}
