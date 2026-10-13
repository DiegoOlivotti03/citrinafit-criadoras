import { criarClienteAdmin } from "@/lib/supabase/server";
import Formulario from "./formulario";

export default async function Convite({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const { data: convite } = await criarClienteAdmin()
    .from("convites")
    .select("codigo")
    .eq("codigo", codigo)
    .is("usado_em", null)
    .gt("expira_em", new Date().toISOString())
    .maybeSingle();

  return (
    <div className="centro">
      <div className="cartao">
        {convite ? (
          <>
            <h1>Bem-vinda à Citrina</h1>
            <p className="suave">Crie sua conta para acompanhar suas vendas e o ranking das criadoras.</p>
            <Formulario codigo={codigo} />
          </>
        ) : (
          <>
            <h1>Convite inválido</h1>
            <p>Este convite já foi usado ou expirou. Peça um novo para a equipe da Citrina.</p>
          </>
        )}
      </div>
    </div>
  );
}
