import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AdminLogin } from "@/components/menu/admin/AdminLogin";
import { AdminPanel } from "@/components/menu/admin/AdminPanel";
import { UploadProgress } from "@/components/menu/admin/UploadProgress";
import { MenuReader } from "@/components/menu/MenuReader";
import { supabaseMenuRepository } from "@/lib/menu/supabaseRepository";
import { MenuStoreProvider, useMenuStore } from "@/lib/menu/store";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Crust — Dessert & Coffee Menu" },
      {
        name: "description",
        content: "Browse the Crust dessert & coffee menu as a real page-turning book — coffee, non-coffee drinks and more.",
      },
      { property: "og:title", content: "Crust — Dessert & Coffee Menu" },
      {
        property: "og:description",
        content: "Flip through the Crust menu like a real book: coffee, non-coffee drinks and add-ons.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <MenuStoreProvider repository={supabaseMenuRepository}>
      <MenuExperience />
    </MenuStoreProvider>
  );
}

function MenuExperience() {
  const { loaded, saved, draft } = useMenuStore();
  const [adminOpen, setAdminOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [livePreview, setLivePreview] = useState(true);
  const shown = adminOpen && livePreview ? draft : saved;

  useEffect(() => {
    if (!loaded) return;
    const { menuTitle, restaurantName } = saved.general;
    document.title = [restaurantName, menuTitle].filter(Boolean).join(" — ") || "Menu";
  }, [loaded, saved.general]);

  const handleOpenAdmin = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) setAdminOpen(true);
    else setLoginOpen(true);
  };

  const handleAdminChange = async (open: boolean) => {
    setAdminOpen(open);
    if (!open) await supabase.auth.signOut();
  };

  return (
    <>
      <MenuReader state={shown} ready={loaded} adminOpen={adminOpen} onOpenAdmin={handleOpenAdmin} />
      <AdminLogin
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setLoginOpen(false);
          setAdminOpen(true);
        }}
      />
      <AdminPanel
        open={adminOpen}
        onOpenChange={handleAdminChange}
        livePreview={livePreview}
        onLivePreviewChange={setLivePreview}
      />
      <UploadProgress />
    </>
  );
}
