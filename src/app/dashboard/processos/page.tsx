import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProcessosClient } from "./processos-client";

export default async function ProcessosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="flex-1 overflow-y-auto bg-muted/30">
      <div className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div>
          <h1 className="text-xl font-bold">Acompanhamento Processual</h1>
          <p className="text-sm text-muted-foreground">Monitore as movimentações (e-SAJ, e-Proc) via IA</p>
        </div>
      </div>
      <div className="p-6">
        <ProcessosClient />
      </div>
    </div>
  );
}
