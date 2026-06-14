import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingClient } from "@/components/quiz/OnboardingClient";
import type { Answers } from "@/lib/questions";

// Account-first: must be authenticated. If the profile is already complete,
// go to /perfil; otherwise resume from the saved draft (or start fresh).
export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signup");

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (profile) redirect("/perfil");

  const { data: draft } = await supabase
    .from("onboarding_drafts")
    .select("answers, step")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <OnboardingClient
      initialAnswers={(draft?.answers as Answers) ?? {}}
      initialStep={typeof draft?.step === "number" ? draft.step : 0}
    />
  );
}
