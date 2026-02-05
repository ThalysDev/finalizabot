import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DemoCard() {
  return (
    <section className="py-12 sm:py-16 px-4">
      <div className="container mx-auto max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
          Veja como funciona
        </h2>

        <Card className="border-2 border-blue-100 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Alonso Martinez
                </h3>
                <p className="text-sm text-gray-600">Atacante • Costa Rica</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700">Favorito</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* U5/U10 Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">U5 (Últimas 5)</p>
                <p className="text-2xl font-bold text-green-600">4/5</p>
                <p className="text-xs text-gray-500 mt-1">80% - Muito alto</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">U10 (Últimas 10)</p>
                <p className="text-2xl font-bold text-blue-600">7/10</p>
                <p className="text-xs text-gray-500 mt-1">70% - Consistente</p>
              </div>
            </div>

            {/* Consistency */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">
                Coeficiente de Variação (CV)
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">0.24</span>
                <span className="text-xs text-gray-600">Variação moderada</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Jogador com padrão previsível
              </p>
            </div>

            {/* Recent matches */}
            <div>
              <p className="text-xs text-gray-600 mb-3">Últimos 5 jogos</p>
              <div className="flex gap-1">
                {[1, 1, 0, 1, 1].map((shot, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-semibold ${
                      shot
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {shot}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
