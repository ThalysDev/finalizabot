export function Footer() {
  return (
    <footer className="border-t bg-gray-50 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">FinalizaBOT</h3>
            <p className="text-sm text-gray-600">
              Análise de finalizações para apostadores.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm">
              Produto
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  Matches
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  Jogadores
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  Análises
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  Termos
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-8 text-center text-sm text-gray-600">
          <p>
            &copy; {new Date().getFullYear()} FinalizaBOT. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
