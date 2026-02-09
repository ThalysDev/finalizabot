import type { Metadata } from "next";
import { Activity, Radio, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Ao Vivo - FinalizaBOT",
  description: "Acompanhe partidas em tempo real",
};

export default function LiveInPlayPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-57px)] text-center px-4">
      <div className="relative mb-8">
        <div className="size-24 rounded-full bg-linear-to-br from-fb-primary/20 to-fb-primary/5 flex items-center justify-center border border-fb-primary/20">
          <Activity className="size-12 text-fb-primary" />
        </div>
        <div className="absolute -top-1 -right-1 size-8 rounded-full bg-fb-surface flex items-center justify-center border border-fb-border">
          <Clock className="size-4 text-fb-text-muted" />
        </div>
      </div>

      <h1 className="text-fb-text text-2xl md:text-3xl font-bold mb-3">
        Acompanhamento Ao Vivo
      </h1>

      <div className="flex items-center gap-2 mb-4">
        <Radio className="size-4 text-fb-primary animate-pulse" />
        <span className="text-fb-primary text-sm font-medium">
          Em Desenvolvimento
        </span>
      </div>

      <p className="text-fb-text-muted text-sm max-w-lg mb-8 leading-relaxed">
        O módulo de acompanhamento em tempo real está sendo desenvolvido.
        Em breve você poderá acompanhar mercados de finalizações ao vivo,
        com dados de momentum, chutes em tempo real e alertas instantâneos.
      </p>

      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fb-surface border border-fb-border text-fb-text-muted text-xs font-medium mb-8">
        <Clock className="size-3.5" />
        Previsão de lançamento: em breve
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg w-full">
        <div className="bg-fb-surface rounded-xl p-4 border border-fb-border">
          <Activity className="size-5 text-fb-primary mb-2 mx-auto" />
          <p className="text-xs text-fb-text-secondary font-medium">
            Momentum em Tempo Real
          </p>
        </div>
        <div className="bg-fb-surface rounded-xl p-4 border border-fb-border">
          <Radio className="size-5 text-fb-primary mb-2 mx-auto" />
          <p className="text-xs text-fb-text-secondary font-medium">
            Alertas Instantâneos
          </p>
        </div>
        <div className="bg-fb-surface rounded-xl p-4 border border-fb-border">
          <Clock className="size-5 text-fb-primary mb-2 mx-auto" />
          <p className="text-xs text-fb-text-secondary font-medium">
            Mercados ao Vivo
          </p>
        </div>
      </div>
    </div>
  );
}
