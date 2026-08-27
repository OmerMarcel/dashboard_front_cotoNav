"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LogoLoader from "@/components/LogoLoader";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        const target =
          user.role === "agent_communal"
            ? "/dashboard/infrastructures"
            : "/dashboard";
        router.push(target);
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  return <LogoLoader fullScreen={true} size="lg" text="Chargement de l'application..." />;
}
