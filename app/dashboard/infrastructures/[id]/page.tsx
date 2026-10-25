"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import LogoLoader from "@/components/LogoLoader";

export default function InfrastructureRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  useEffect(() => {
    // Redirection automatique vers le mode consultation complète ou vers la liste
    if (id) {
      router.replace(`/dashboard/infrastructures/${id}/edit?view=1`);
    } else {
      router.replace("/dashboard/infrastructures");
    }
  }, [id, router]);

  return (
    <div className="flex items-center justify-center py-24">
      <LogoLoader size="lg" text="Chargement de l'infrastructure..." />
    </div>
  );
}
