import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export function EmptyState() {
  return (
    <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
      <CardContent className="py-12 text-center">
        <div className="text-4xl mb-3">👤</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhum favorito ainda
        </h3>
        <p className="text-gray-600 mb-6">
          Explore matches e salve seus jogadores favoritos para acompanhar análises em tempo real.
        </p>
        <Link href="/">
          <button className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
            Explorar Matches
          </button>
        </Link>
      </CardContent>
    </Card>
  );
}
