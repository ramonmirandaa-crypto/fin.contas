const Footer = () => {
  return (
    <footer className="bg-slate-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3 className="text-xl font-semibold text-white">Financeito</h3>
            <p className="mt-4 text-sm leading-relaxed">
              A plataforma completa para organizar suas finanças, gerenciar investimentos e
              receber insights inteligentes sobre o seu dinheiro.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Empresa</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Sobre</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Carreiras</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Imprensa</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Suporte</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Documentação</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Central de Ajuda</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">API</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Status</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Recursos</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Community</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Guides</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Support</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Updates</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p className="text-gray-500">&copy; {new Date().getFullYear()} Financeito. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Termos</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Privacidade</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
