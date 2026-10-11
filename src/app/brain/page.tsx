import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

import BusinessBrain from "@/components/brain/BusinessBrain";

export const metadata: Metadata = {
  title: "Business Brain",
  description:
    "Understand the signals, risks, opportunities, and business context Nexora identifies from connected business data.",
  alternates: { canonical: "/brain" },
  robots: { index: false, follow: false },
};

export default async function BusinessBrainPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership, error: membershipError } = await supabase
    .from("business_users")
    .select("business_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) throw new Error(membershipError.message);
  if (!membership) redirect("/onboarding");

  const businessId = membership.business_id;

  const { getBrainData } = await import("@/lib/brain-data");
  const data = await getBrainData(businessId);

  return <BusinessBrain data={data} />;
}
