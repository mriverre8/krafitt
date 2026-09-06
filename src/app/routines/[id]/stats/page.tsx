import { getT } from "@/i18n/server";
import { requireAccess } from "@/lib/access";
import { currentUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function StatsPage({ params }: PageProps<"/routines/[id]/stats">) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect("/");

  const { routine } = await requireAccess(id, user.id);
  const t = await getT();

  return (
    <div className="rounded-2xl border border-dashed border-line p-8 text-center">
      <h1 className="display text-3xl">{t("stats.title", { name: routine.name })}</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm text-muted">{t("stats.soon")}</p>
      <Link
        href={`/routines/${id}`}
        className="mt-5 inline-block text-xs font-bold uppercase tracking-widest text-blaze hover:underline"
      >
        {t("stats.back")}
      </Link>
    </div>
  );
}
