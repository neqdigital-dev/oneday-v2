import { redirect } from "next/navigation";

export default function PainelAdminRedirect() {
  redirect("/super-admin/dashboard");
}
