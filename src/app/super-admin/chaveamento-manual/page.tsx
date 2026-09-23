import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChaveamentoManualClient from "./ChaveamentoManualClient";

export default async function ChaveamentoManualPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "super_admin") {
    redirect("/login");
  }

  return (
    <div className="page-wrapper">
      <main className="page-content">
        <div className="container">
          <ChaveamentoManualClient />
        </div>
      </main>
    </div>
  );
}
