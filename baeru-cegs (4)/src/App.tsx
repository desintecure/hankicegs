import React, { useState, useEffect } from 'react';
import { ExternalLink, Heart, BookOpen, X } from 'lucide-react';
import { SparklesBackground } from './components/SparklesBackground';
import { FilipinasCalculator } from './components/FilipinasCalculator';
import { JapaoCalculator } from './components/JapaoCalculator';
import { PasscodeBarrier } from './components/PasscodeBarrier';
import { TwitterEmbed } from './components/TwitterEmbed';
import { DADOS_TABELA_COMPLETA } from './data/tabelaPrecos';
import cxFilipinasImg from './assets/images/cx_filipinas.jpg';
import cxCoreiaImg from './assets/images/cx_coreia.jpg';
import cxJapaoImg from './assets/images/cx_japao.jpg';
import homeIconImg from './assets/images/home_icon.png';
import saibaMaisBannerImg from './assets/images/saiba_mais.jpg';
import termosBannerImg from './assets/images/termos_banner.jpg';

interface CartItem {
  id: string;
  nome: string;
  valor: number;
  wonNotation?: number;
  wonValor?: number;
}

type Page = 'home' | 'termos' | 'saiba-mais' | 'caixas' | 'calc-completa' | 'feedbacks' | 'faq-dicionario';

type Country = 'filipinas' | 'coreia' | 'japao';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentCountry, setCurrentCountry] = useState<Country>('filipinas');
  const [countryCompleta, setCountryCompleta] = useState<Country>('filipinas');
  const [isFormUnlocked, setIsFormUnlocked] = useState<boolean>(false);
  const [showDicionarioPh, setShowDicionarioPh] = useState<boolean>(false);
  const [closedBoxModal, setClosedBoxModal] = useState<{ isOpen: boolean; country: 'coreia' | 'japao' } | null>(null);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [formPasscode, setFormPasscode] = useState<string>('');
  const [formPasscodeStatus, setFormPasscodeStatus] = useState<'idle' | 'error' | 'success'>('idle');

  // Handle digit input for form passcode modal
  const handleFormDigit = (digit: string) => {
    if (formPasscodeStatus !== 'idle' || formPasscode.length >= 4) return;
    const nextCode = formPasscode + digit;
    setFormPasscode(nextCode);

    if (nextCode.length === 4) {
      if (nextCode === '0107') {
        setFormPasscodeStatus('success');
        setTimeout(() => {
          setIsFormUnlocked(true);
          setShowFormModal(false);
          setFormPasscode('');
          setFormPasscodeStatus('idle');
          window.open('https://forms.gle/ds3MDDNqqvykZSNL6', '_blank', 'noopener,noreferrer');
        }, 500);
      } else {
        setFormPasscodeStatus('error');
        setTimeout(() => {
          setFormPasscode('');
          setFormPasscodeStatus('idle');
        }, 650);
      }
    }
  };

  // Keyboard support for form passcode
  useEffect(() => {
    if (!showFormModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleFormDigit(e.key);
      } else if (e.key === 'Backspace') {
        if (formPasscodeStatus === 'idle') setFormPasscode((prev) => prev.slice(0, -1));
      } else if (e.key === 'Escape') {
        setShowFormModal(false);
        setFormPasscode('');
        setFormPasscodeStatus('idle');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFormModal, formPasscode, formPasscodeStatus]);

  // Complete calculator state
  const [selectedCompIndex, setSelectedCompIndex] = useState<string>('-1');
  const [manualValor, setManualValor] = useState<string>('');
  const [cartComp, setCartComp] = useState<CartItem[]>([]);
  const [taxaFixaComp, setTaxaFixaComp] = useState<string>('13');
  const [divisaoComp, setDivisaoComp] = useState<string>('1');

  // Helper functions for complete calculator
  const addItemComp = () => {
    const idx = parseInt(selectedCompIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= DADOS_TABELA_COMPLETA.length) return;
    const item = DADOS_TABELA_COMPLETA[idx];
    const wonNot = parseFloat(item.l) || 0;
    const wonVal = Math.round(wonNot * 10000);
    setCartComp((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        nome: `Won ${item.l}`,
        valor: item.v,
        wonNotation: wonNot,
        wonValor: wonVal,
      },
    ]);
    setSelectedCompIndex('-1');
  };

  const addManualComp = () => {
    const val = parseFloat(manualValor.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;
    const match = DADOS_TABELA_COMPLETA.find((t) => Math.abs(t.v - val) < 0.01);
    const wonNot = match ? parseFloat(match.l) : undefined;
    const wonVal = match ? Math.round((parseFloat(match.l) || 0) * 10000) : undefined;
    setCartComp((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        nome: `Manual`,
        valor: val,
        wonNotation: wonNot,
        wonValor: wonVal,
      },
    ]);
    setManualValor('');
  };

  const removeItemComp = (id: string) => {
    setCartComp((prev) => prev.filter((item) => item.id !== id));
  };

  const clearComp = () => {
    setCartComp([]);
    setTaxaFixaComp('13');
    setDivisaoComp('1');
  };

  const totalItemsComp = cartComp.reduce((acc, curr) => acc + curr.valor, 0);
  const totalWonNotation = cartComp.reduce((acc, curr) => acc + (curr.wonNotation || 0), 0);
  const totalWonValor = Math.round(totalWonNotation * 10000);
  const wonNotationFormatted =
    totalWonNotation % 1 === 0
      ? totalWonNotation.toFixed(1)
      : totalWonNotation.toFixed(2).replace(/\.?0+$/, '');
  const parsedTaxaComp = parseFloat(taxaFixaComp.replace(',', '.')) || 0;
  const parsedDivisaoComp = parseFloat(divisaoComp.replace(',', '.')) || 1;
  const pessoas = isNaN(parsedDivisaoComp) || parsedDivisaoComp <= 0 ? 1 : parsedDivisaoComp;
  const taxaPorPessoa = parsedTaxaComp / pessoas;
  const grandTotalComp = totalItemsComp + taxaPorPessoa;

  // Navigation items for the top menu (saiba mais removido, acessível apenas na home)
  const navItems: { id: Page; label: string }[] = [
    { id: 'home', label: 'home' },
    { id: 'termos', label: 'termos' },
    { id: 'caixas', label: 'caixas' },
    { id: 'calc-completa', label: 'calculadora' },
    { id: 'feedbacks', label: 'feedbacks' },
  ];

  return (
    <main className="relative min-h-screen flex items-center justify-center p-2 pb-3 sm:p-4 selection:bg-pink-200 selection:text-pink-900">
      {/* Decorative Sparkle Stars in Background */}
      <SparklesBackground />

      {/* Main Cutesie Card Window */}
      <div
        id="cutesie-window"
        className="relative z-10 w-full max-w-[530px] h-[78vh] sm:h-[68vh] max-h-[580px] bg-white rounded-xl sm:rounded-2xl border-[1.5px] border-pink-300 shadow-[0_12px_35px_-5px_rgba(244,114,182,0.22),0_0_0_1px_rgba(252,231,243,0.8)] overflow-hidden flex flex-col font-['Poppins'] text-[0.74rem] sm:text-[0.8rem]"
      >
        {/* --- TOP BROWSER HEADER (cutesie.com style) --- */}
        <header
          id="browser-header"
          className="bg-[#fff0f5] px-3 py-1.5 sm:px-4 sm:py-2 border-b border-pink-200 flex items-center justify-between shrink-0 select-none"
        >
          {/* Left heart */}
          <div className="flex items-center gap-1.5 text-pink-400">
            <span
              onClick={() => setCurrentPage('home')}
              title="Home"
              className="cursor-pointer text-pink-400 hover:text-[#f172b2] transition-colors text-xs sm:text-sm"
            >
              ♥
            </span>
          </div>

          {/* Centered address bar pill */}
          <div
            className="bg-white/95 backdrop-blur-xs px-3 py-0.5 sm:px-5 sm:py-1 rounded-full border border-pink-200 shadow-[0_2px_6px_rgba(244,114,182,0.14)] text-[#f172b2] font-['Space_Mono',monospace] text-[0.7rem] sm:text-[0.78rem] tracking-wider font-semibold cursor-pointer hover:border-pink-300 transition-all flex items-center gap-1.5"
            onClick={() => setCurrentPage('home')}
            title="Ir para o início"
          >
            <span>www.woongbaer.com</span>
          </div>

          {/* Right window controls in soft pink */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-pink-400 font-mono text-xs sm:text-sm">
            <span
              className="cursor-pointer hover:text-[#f172b2] transition-colors font-bold px-1"
              onClick={() => setCurrentPage('home')}
              title="Minimizar"
            >
              —
            </span>
            <span
              className="cursor-pointer hover:text-[#f172b2] transition-colors font-bold px-1"
              onClick={() => setCurrentPage('home')}
              title="Fechar"
            >
              ✕
            </span>
          </div>
        </header>

        {/* --- MENU SUPERIOR (Links separated by pipes, cutesie aesthetic) --- */}
        <nav
          id="top-nav-bar"
          className="bg-[#fff9fb] px-3 py-1 sm:px-5 sm:py-1.5 border-b border-pink-100 flex items-center justify-between sm:justify-center gap-0.5 sm:gap-2.5 text-[0.58rem] sm:text-[0.74rem] font-['Space_Mono',monospace] shrink-0 overflow-x-auto whitespace-nowrap"
        >
          {navItems.map((item, index) => {
            const isActive = currentPage === item.id || (item.id === 'termos' && currentPage === 'faq-dicionario');
            return (
              <React.Fragment key={item.id}>
                <button
                  id={`nav-link-${item.id}`}
                  onClick={() => setCurrentPage(item.id)}
                  className={`cursor-pointer transition-colors px-1 py-0.5 ${
                    isActive
                      ? 'text-[#f172b2] font-bold underline underline-offset-4 decoration-[#f172b2]'
                      : 'text-pink-400 hover:text-[#f172b2]'
                  }`}
                >
                  {item.label}
                </button>
                {index < navItems.length - 1 && (
                  <span className="text-pink-300 select-none">|</span>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* --- SCROLLABLE CONTENT CONTAINER --- */}
        <div className="flex-1 overflow-y-auto px-2 pt-0.5 pb-1 sm:px-5 sm:pt-2 sm:pb-3 flex flex-col text-[0.72rem] sm:text-[0.8rem] text-[#5c4f61] leading-relaxed">
          {/* ================= PAGE: HOME ================= */}
          {currentPage === 'home' && (
            <div id="page-home" className="flex flex-col flex-1 justify-center sm:my-auto my-0 py-0 animate-fadeIn">
              {/* Top two-column layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 items-center">
                {/* Left column: Avatar, Welcome heading, Social Icons, and Pill buttons */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-1 sm:mb-2">
                    <img
                      src={homeIconImg}
                      alt="Baeru CEGS Profile"
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 sm:w-32 sm:h-32 object-cover rounded-full border-2 sm:border-3 border-pink-300 shadow-[0_4px_12px_rgba(244,114,182,0.25)]"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-white text-[#f172b2] rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[0.65rem] sm:text-xs shadow-xs border border-pink-200">
                      ♥
                    </span>
                  </div>

                  <h1 className="text-[#f172b2] font-black text-xl sm:text-2xl tracking-tight mb-0.5">
                    welcome!
                  </h1>
                  <p className="text-[0.68rem] sm:text-xs text-pink-400 font-medium mb-1.5 sm:mb-2">
                    compras em grupo & importações
                  </p>

                  {/* Social Icons Twitter e Instagram logo abaixo de compras em grupo & importações */}
                  <div className="flex justify-center items-center gap-4 sm:gap-5 text-base sm:text-lg text-pink-400 mb-2 sm:mb-3">
                    <a
                      href="https://x.com/woongbaer"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#f172b2] hover:scale-115 transition-all p-0.5"
                      title="Twitter / X @woongbaer"
                    >
                      <i className="fab fa-twitter"></i>
                    </a>
                    <a
                      href="https://instagram.com/woongbaer"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#f172b2] hover:scale-115 transition-all p-0.5"
                      title="Instagram @woongbaer"
                    >
                      <i className="fab fa-instagram"></i>
                    </a>
                  </div>

                  {/* Cutesie Pill Button */}
                  <div className="w-full max-w-[160px] sm:max-w-[190px] flex flex-col gap-2">
                    <button
                      id="home-btn-saiba-mais"
                      onClick={() => setCurrentPage('saiba-mais')}
                      className="w-full py-1 sm:py-1.5 px-3 sm:px-4 rounded-full bg-[#fff5f8] border-[1.5px] border-pink-200 text-[#f172b2] font-['Space_Mono',monospace] text-[0.7rem] sm:text-xs font-bold shadow-[0_3px_8px_rgba(241,114,178,0.18)] hover:shadow-[0_4px_12px_rgba(241,114,178,0.28)] hover:bg-[#ffeef4] active:translate-y-0.5 transition-all text-center cursor-pointer"
                    >
                      saiba mais
                    </button>
                  </div>
                </div>

                {/* Right column: Bio description with intro outside of scroll box */}
                <div className="flex flex-col justify-center pb-2 sm:pb-0 gap-2 sm:gap-2.5">
                  {/* Centralized intro on white background with only specified words bold and pink */}
                  <div className="text-center font-normal text-[#5c4f61] space-y-0.5 leading-snug text-[0.72rem] sm:text-[0.78rem]">
                    <p>
                      oi, eu sou a <strong className="font-bold text-[#f172b2]">lili @woongbaer</strong> <span className="text-[#f172b2]">&lt;3</span>
                    </p>
                    <p>ela/dela 23 anos ʕ•ᴥ•ʔ</p>
                    <p>
                      <strong className="font-bold text-[#f172b2]">são paulo</strong>, sp ☆
                    </p>
                    <p>
                      ₊˚⊹♡ <strong className="font-bold text-[#f172b2]">casual gom</strong> ⟡
                    </p>
                  </div>

                  {/* Scrollable box for detailed bio */}
                  <div className="text-[0.7rem] sm:text-[0.76rem] text-[#5c4f61] leading-relaxed bg-[#fff5f8] p-3 sm:p-3.5 rounded-2xl border border-pink-100 shadow-xs space-y-2 sm:space-y-2.5 h-[140px] sm:h-[195px] overflow-y-auto pr-2 text-left">
                    <p>
                      abro caixas para completar minha <strong className="font-bold text-[#f172b2]">coleção do ahof</strong> e <strong className="font-bold text-[#f172b2]">outros grupos menores</strong> e de quebra ajudar outras pessoas a <strong className="font-bold text-[#f172b2]">completar sua coleção</strong> também ( ˶ˆᗜˆ˵ ) ♡
                    </p>
                    <p>
                      <strong className="font-bold text-[#f172b2]">gom a um ano e meio</strong>, experiência principalmente com <strong className="font-bold text-[#f172b2]">caixas da coreia e filipinas</strong>, de itens menores como <strong className="font-bold text-[#f172b2]">dolls, chaveiros, photocards, qr code, jewels e álbuns em versão pequena</strong>!
                    </p>
                    <p>
                      caso queira saber mais sobre o funcionamento das caixinhas, basta clicar em <strong className="font-bold text-[#f172b2]">saiba mais</strong>! não esqueça de ler os <strong className="font-bold text-[#f172b2]">termos</strong> e mais informações sobre as caixas nas abas acima. <strong className="font-bold text-[#f172b2]">boas compras!</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= PAGE: TERMOS (TERMOS GERAIS & ENVIOS) ================= */}
          {currentPage === 'termos' && (
            <div id="page-termos" className="flex flex-col animate-fadeIn">
              <img
                src={termosBannerImg}
                alt="Termos Gerais Banner"
                referrerPolicy="no-referrer"
                className="w-full h-auto rounded-xl border border-pink-200 mb-2 sm:mb-2.5"
              />

              {/* Botão de Primeira vez em CEG com tooltip, cor vibrante e ícone de coração */}
              <div className="flex justify-center mb-2.5 sm:mb-3">
                <div className="relative group inline-block">
                  <button
                    type="button"
                    id="btn-perguntas-dicionario"
                    onClick={() => setCurrentPage('faq-dicionario')}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#f172b2] hover:bg-[#e45ea1] text-white font-['Space_Mono',monospace] text-[0.68rem] sm:text-xs font-bold shadow-[0_2px_8px_rgba(241,114,178,0.35)] hover:shadow-[0_4px_12px_rgba(241,114,178,0.45)] active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 text-pink-100 fill-pink-100" />
                    primeira vez em ceg? clique aqui
                  </button>

                  {/* Tooltip */}
                  <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-30 whitespace-nowrap bg-pink-900/90 text-white text-[0.62rem] sm:text-[0.68rem] font-medium px-2.5 py-1 rounded-md shadow-md">
                    dicionário de termo e mais informações
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-pink-900/90" />
                  </div>
                </div>
              </div>
              <div className="text-center mb-2.5 sm:mb-3">
                <h2 className="font-extrabold text-[#f172b2] text-xs sm:text-sm tracking-wider uppercase border-b border-pink-300 pb-0.5 inline-block">
                  termos gerais
                </h2>
              </div>

              <div className="space-y-1.5 sm:space-y-2.5 text-[0.7rem] sm:text-xs text-justify">
                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    realizo compra em grupo (ou seja, uma importação coletiva) e{' '}
                    <strong className="text-[#f172b2]">NÃO</strong> sou uma loja.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    cegs internacionais costumam demorar de{' '}
                    <span className="text-[#f172b2] font-bold">2 a 6 meses</span>, e ceg nacionais em torno de{' '}
                    <span className="text-[#f172b2] font-bold">1 a 3 meses</span>, por isso só entre se tiver paciência para esperar.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    <span className="text-[#f172b2] font-bold">não sou responsável</span> por extravio, roubo, perda ou avarias causadas pelos correios em nenhuma parte do trajeto.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    não me responsabilizo por{' '}
                    <span className="text-[#f172b2] font-bold">
                      avarias não informadas, calote de sellers ou falsa autenticidade dos produtos
                    </span>{' '}
                    (eu sempre verifico o feedback da loja/seller antes de abrir a ceg, mas coisas do tipo ainda tem chance de acontecer). nestes casos,{' '}
                    <span className="text-[#f172b2] font-bold">apenas</span> realizo o reembolso SE eu conseguir o reembolso do fornecedor/seller.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    não entre nas cegs caso seja hiper sensível a avarias. é impossível que eu consiga verificar o estado de todos os itens das cegs antes de chegarem até mim, e por fazerem uma grande viagem, pode ser que haja avarias pequenas. caso isso seja um problema muito grande pra você,{' '}
                    <span className="text-[#f172b2] font-bold">NÃO ENTRE NA CEG</span>.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    não aceito{' '}
                    <span className="text-[#f172b2] font-bold">desistências de compra sem repasse de vaga</span>. só faça a claim caso tenha certeza da compra. só aceitarei repasse de itens quando a caixa fechar e estiver a caminho do brasil, ou seja, em <span className="text-[#f172b2] font-bold">meados de fevereiro</span>. caso queira repassar seu item, é necessário realizar o pagamento antes e depois divulgar o repasse{' '}
                    <span className="text-[#f172b2] font-bold">me avisando antes</span>, para maior organização e controle da ceg.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    problemas como{' '}
                    <span className="text-[#f172b2] font-bold">atrasos, retorno da caixa para a warehouse ou taxas extras</span> podem acontecer e estão totalmente fora do meu controle.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    caso a caixa seja <span className="text-[#f172b2] font-bold">negada</span> na alfândega, um{' '}
                    <span className="text-[#f172b2] font-bold">novo frete</span> será cobrado. este tipo de coisa pode acontecer e infelizmente não está ao meu alcance.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    o envio dos itens da warehouse para a minha casa é feito por{' '}
                    <span className="text-[#f172b2] font-bold">k-packet</span>, aceitando itens pequenos e médios.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    o não pagamento do frete ou taxa no prazo{' '}
                    <span className="text-[#f172b2] font-bold">sem justificativa</span> acarretará em{' '}
                    <span className="text-[#f172b2] font-bold">multa de R$ 1,00 por dia</span>, e após{' '}
                    <span className="text-[#f172b2] font-bold">40 dias</span> acarretará em repasse dos itens com direito a{' '}
                    <span className="text-[#f172b2] font-bold">reembolso parcial</span>.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    aceito <span className="text-[#f172b2] font-bold">pix e cartão de crédito</span> como pagamento. no cartão de crédito é cobrado o valor + taxas da plataforma.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    para <span className="text-[#f172b2] font-bold">entrar na ceg</span> ou recomendar outras pessoas para participar, peça para me chamarem no twitter <a href="https://x.com/woongbaer" target="_blank" rel="noopener noreferrer" className="font-bold text-[#f172b2] hover:underline">@woongbaer</a> ou <a href="https://x.com/s2jiwoongki" target="_blank" rel="noopener noreferrer" className="font-bold text-[#f172b2] hover:underline">@s2jiwoongki</a> (meu twitter pessoal).
                  </div>
                </div>
              </div>

              {/* Importante Section */}
              <div className="mt-4 pt-3 border-t border-pink-200">
                <div className="text-center mb-2.5 sm:mb-3">
                  <h3 className="font-extrabold text-[#f172b2] text-xs sm:text-sm tracking-wider uppercase border-b border-pink-300 pb-0.5 inline-block">
                    IMPORTANTE: VALOR DO ITEM &amp; FRETES POR ETAPAS!
                  </h3>
                </div>

                <div className="space-y-1.5 sm:space-y-2.5 text-[0.7rem] sm:text-xs text-justify">
                  <div className="flex items-start gap-2">
                    <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                    <div>
                      pagamentos de itens em{' '}
                      <span className="text-[#f172b2] font-bold">CEGS INTER SEMPRE</span> são feitos por etapas: <strong className="text-[#f172b2]">1) valor do item/card</strong> &gt;&gt; <strong className="text-[#f172b2]">2) frete internacional + taxas da warehouse</strong> &gt;&gt; <strong className="text-[#f172b2]">3) taxa da receita federal</strong> &gt;&gt; <strong className="text-[#f172b2]">4) frete nacional</strong>.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                    <div>
                      <strong className="text-[#f172b2] font-bold">1) VALOR DO ITEM / CARD:</strong> é o valor cobrado originalmente pela seller no exterior na moeda local (ex: PHP ₱, KRW ₩ ou JPY ¥), convertido para reais e pago imediatamente no momento da claim/confirmação da compra.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                    <div>
                      <strong className="text-[#f172b2] font-bold">2) FRETE INTERNACIONAL &amp; WAREHOUSE:</strong> dividido proporcionalmente entre todos os participantes, <span className="text-[#f172b2] font-bold">SEMPRE por item</span> de acordo com seu peso. Note que, <strong className="text-[#f172b2]">diferente da caixa Coreia, a caixa Filipinas terá DOIS FRETES INTERNACIONAIS</strong> (Filipinas &gt; Coreia do Sul primeiro por questões de segurança na warehouse coreana, e depois Coreia do Sul &gt; Brasil). Mesmo com dois fretes, a média de custos do frete inter + taxas da warehouse para <strong className="text-[#f172b2]">PHOTOCARDS</strong> fica entre <span className="text-[#f172b2] font-bold">R$ 0,50 a no máximo R$ 5,00 por pc</span>.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                    <div>
                      <strong className="text-[#f172b2] font-bold">3) TAXA DA RECEITA FEDERAL:</strong> cobrada caso a caixa seja tributada pela alfândega ao chegar no Brasil, sendo dividida por item com média histórica de R$ 0,50 a R$ 5,50 por pc.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                    <div>
                      em caso de itens maiores como dolls e álbuns, a variação do frete inter + taxas ficou até o momento entre{' '}
                      <span className="text-[#f172b2] font-bold">R$ 5 a R$ 80</span> dependendo do volume e peso.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                    <div>
                      <strong className="text-[#f172b2] font-bold">4) FRETE NACIONAL:</strong> envio dos Correios ou entrega presencial em SP. Para saber mais detalhes e valores, consulte a seção de <strong className="text-[#f172b2]">envios nacionais</strong> logo abaixo!
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= SEÇÃO: ENVIOS NACIONAIS ================= */}
              <div className="mt-4 pt-3 border-t border-pink-200">
                <div className="text-center mb-2.5 sm:mb-3">
                  <h2 className="font-extrabold text-[#f172b2] text-xs sm:text-sm tracking-wider uppercase border-b border-pink-300 pb-0.5 inline-block">
                    envios nacionais
                  </h2>
                </div>

                <div className="space-y-1.5 sm:space-y-2.5 text-[0.7rem] sm:text-xs text-justify">
                  <div className="flex items-start gap-2">
                    <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                    <div>
                      faço envios via <span className="text-[#f172b2] font-bold">superfrete</span>, sendo as modalidades{' '}
                      <span className="text-[#f172b2] font-bold">minienvios, pac ou sedex</span>. O frete é calculado de acordo com o peso do produto e cep do comprador.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                    <div>
                      <span className="text-[#f172b2] font-bold">mini envios</span> é a minha principal forma de envio de photocards e itens pequenos, com fretes variando entre{' '}
                      <span className="text-[#f172b2] font-bold">10 e 20 reais</span>.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                    <div>
                      terei até <span className="text-[#f172b2] font-bold">3 semanas para realizar os envios</span> após compra ou chegada de itens de ceg. Geralmente vou aos correios na{' '}
                      <span className="text-[#f172b2] font-bold">segunda ou terça-feira</span>.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                    <div>
                      photocards serão enviados com{' '}
                      <span className="text-[#f172b2] font-bold">
                        double sleeve + papel paraná + plástico bolha e envelope impermeável de segurança
                      </span>
                      .
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                    <div>
                      álbuns serão enviados dentro de uma{' '}
                      <span className="text-[#f172b2] font-bold">
                        caixa de papelão + plástico bolha + envelope de segurança
                      </span>
                      .
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                    <div>
                      <span className="text-[#f172b2] font-bold">reembolsos</span> por avarias na embalagem apenas com{' '}
                      <span className="text-[#f172b2] font-bold">vídeo de unboxing, feito sem cortes</span>.
                    </div>
                  </div>
                </div>
              </div>

              {/* Entregas Presenciais */}
              <div className="mt-4 pt-3 border-t border-pink-200">
                <div className="text-center mb-2.5 sm:mb-3">
                  <h3 className="font-extrabold text-[#f172b2] text-xs sm:text-sm tracking-wider uppercase border-b border-pink-300 pb-0.5 inline-block">
                    entregas presenciais
                  </h3>
                </div>
                <div className="space-y-1.5 sm:space-y-2.5 text-[0.7rem] sm:text-xs text-justify">
                  <p className="text-justify">
                    para moradores da região metropolitana de SP, consigo entregar seu pacote nas seguintes estações:
                  </p>
                  <div className="flex items-start gap-2">
                    <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                    <div>todas as estações da linha 7 rubi até palmeiras barra-funda</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                    <div>liberdade (linha 1 azul)</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                    <div>tiradentes (linha 1 azul)</div>
                  </div>
                  <p className="text-justify pt-1">
                    é cobrada a <strong className="text-[#f172b2]">taxa de embalagem</strong> +{' '}
                    <strong className="text-[#f172b2]">a taxa de locomoção de R$ 5,50</strong> (1 a 2 vezes por mês).
                  </p>
                </div>
              </div>

              {/* Taxas de Embalagem */}
              <div className="mt-4 pt-3 border-t border-pink-200">
                <div className="text-center mb-2.5 sm:mb-3">
                  <h3 className="font-extrabold text-[#f172b2] text-xs sm:text-sm tracking-wider uppercase border-b border-pink-300 pb-0.5 inline-block">
                    taxas de embalagem
                  </h3>
                </div>
                <div className="space-y-1.5 sm:space-y-2.5 text-[0.7rem] sm:text-xs text-justify">
                  <div className="bg-pink-50 border border-pink-200 p-2 sm:p-2.5 rounded-xl text-center text-[0.7rem] sm:text-xs text-[#f172b2] font-semibold mb-1.5 sm:mb-2 leading-relaxed">
                    as <span className="font-bold">taxas de embalagem</span> são cobradas apenas em envios de cegs nacionais ou internacionais. Em vendas nacionais isoladas não haverá taxa.
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                    <div>
                      <span className="font-bold text-[#f172b2]">PHOTOCARDS:</span> R$ 2,00
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                    <div>
                      <span className="font-bold text-[#f172b2]">ÁLBUNS, DOLLS, KEYRINGS, SLEEVES:</span> R$ 3,00
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= PAGE: FAQ & DICIONÁRIO DE CEGS ================= */}
          {currentPage === 'faq-dicionario' && (
            <div id="page-faq-dicionario" className="flex flex-col animate-fadeIn">
              <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage('termos')}
                  className="text-pink-400 hover:text-pink-600 text-[0.7rem] sm:text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  ← voltar para termos
                </button>
              </div>

              {/* Título da seção: Perguntas Mais Frequentes */}
              <div className="text-center mb-2.5 sm:mb-3">
                <h2 className="font-extrabold text-[#f172b2] text-xs sm:text-sm tracking-wider uppercase border-b border-pink-300 pb-0.5 inline-block">
                  perguntas mais frequentes
                </h2>
              </div>

              <div className="space-y-1.5 sm:space-y-2.5 text-[0.7rem] sm:text-xs text-justify">
                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">o que é uma ceg (compra em grupo)?</strong>
                    <br />
                    uma compra em grupo é uma importação coletiva onde vários colecionadores se reúnem para adquirir itens de fora do Brasil (Coreia, Filipinas, Japão, China, etc.), dividindo o frete internacional e as taxas alfandegárias para baratear o custo final.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">quem é a gom e qual seu papel?</strong>
                    <br />
                    a <span className="font-bold text-[#f172b2]">GOM (Group Order Manager)</span> é a pessoa que gerencia toda a ceg: encontra vendedores confiáveis, realiza os pagamentos em moeda estrangeira, cuida do recebimento na warehouse (armazém exterior), organiza o envio internacional e realiza o envio nacional para cada participante.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">por que as cegs demoram meses?</strong>
                    <br />
                    porque o trajeto é composto por várias etapas que levam tempo: envio do vendedor até o armazém no exterior, acúmulo de itens para fechar a caixa com bom volume, envio internacional para o Brasil, desembaraço na alfândega dos Correios/Receita Federal e, por último, o envio nacional para a sua residência.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">como funcionam os pagamentos por etapas?</strong>
                    <br />
                    os pagamentos <strong className="text-[#f172b2]">NUNCA</strong> são cobrados de uma vez só. Eles seguem as etapas: 1) valor do item; 2) frete internacional + taxas da warehouse; 3) taxa da Receita Federal (caso taxado); 4) frete nacional para o seu endereço.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">como é calculada a divisão de frete e taxas?</strong>
                    <br />
                    o valor do frete internacional e de eventuais taxas alfandegárias é dividido <span className="font-bold text-[#f172b2]">sempre por item</span> e proporcionalmente ao peso do produto (por exemplo, photocards pagam menos que dolls ou álbuns).
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">posso desistir de uma claim depois de confirmar?</strong>
                    <br />
                    não é aceita desistência após a claim ser confirmada com o vendedor. Só aceitarei repasse de itens quando a caixa fechar e estiver a caminho do Brasil, ou seja, em <span className="font-bold text-[#f172b2]">meados de fevereiro</span>. Se você não puder mais ficar com o item, você deve realizar o pagamento e depois repassar para outra pessoa assumir a sua vaga (<span className="font-bold text-[#f172b2]">repasse</span>), sempre me avisando com antecedência.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">o que são pedidos individuais?</strong>
                    <br />
                    são itens que você mesmo encontra em redes sociais (como no Twitter/X BNS) ou lojas e me envia o link no privado para que eu compre e direcione para a caixa aberta daquele país.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">como funciona o unboxing obrigatório?</strong>
                    <br />
                    ao receber sua encomenda dos Correios, grave um vídeo contínuo e sem cortes mostrando todos os lados da embalagem lacrada e a etiqueta de envio com clareza, abrindo o pacote e conferindo cada item. Qualquer contestação por avaria ou extravio exige esse vídeo.
                  </div>
                </div>
              </div>

              {/* Divisor e Dicionário de CEGs */}
              <div className="mt-4 pt-3 border-t border-pink-200">
                <div className="text-center mb-2.5 sm:mb-3">
                  <h2 className="font-extrabold text-[#f172b2] text-xs sm:text-sm tracking-wider uppercase border-b border-pink-300 pb-0.5 inline-block">
                    dicionário de cegs
                  </h2>
                </div>

                {/* Caixa de texto introdutória */}
                <div className="bg-[#fff0f6] border border-pink-200 rounded-xl p-2.5 sm:p-3 mb-3 text-center shadow-xs">
                  <p className="text-[#f172b2] text-[0.68rem] sm:text-xs font-semibold leading-relaxed">
                    criei esse guia para pessoas que entraram em alguma ceg minha mas são novatas nisso e não conhecem todos os termos que utilizo ao longo do processo! lembrando sempre que qualquer dúvida pode ser tirada no meu privado, okay? :) &lt;3
                  </p>
                </div>
              </div>

              {/* Termos Gerais de CEGs */}
              <div className="space-y-1.5 sm:space-y-2.5 text-[0.7rem] sm:text-xs text-justify mb-4">
                <div className="flex items-start gap-1.5">
                  <span className="text-pink-400 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">CEG:</strong> sigla para &quot;compra em grupo&quot;, e é a prática de fazer uma compra de vários itens de países de fora que serão enviados em uma caixa única para o páis de destino, fazendo com que o frete internacional e as possívels taxas alfandegárias sejam divididas entre todos os participantes, barateando os custos! em outras línguas, principalmente o inglês, usa-se o termo &quot;group order&quot; (g.o).
                  </div>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-pink-400 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">GOM:</strong> sigla para group order manager (organizador de compra em grupo), e é o nome dado a pessoa responsável por cuidar de todas as etapas de uma compra em grupo ou seja, eu :D, que vai desde falar com vendedores internacionais a realizar as compras, cuidar do recebimento delas e enviar os itens para a casa dos compradores.
                  </div>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-pink-400 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">JOINERS:</strong> são pessoas que compram ativamente em uma comunidade, as GOMS costumam chamar seus compradores de joiners. significa literalmente &quot;quem entra&quot;
                  </div>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-pink-400 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">SELLER:</strong> significa vendedor/vendedora. é a palavra que usamos pra fornecedores e pessoas que estão vendendo os itens em questão. podemos encontrá-las no Twitter ou em sites como Mercari (o famoso OLX do Japão).
                  </div>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-pink-400 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">WAREHOUSE:</strong> é um armazém onde os produtos são guardados temporariamente antes de serem enviados pro Brasil. algumas sellers só aceitam vender para pessoas com endereço do país em que ela vive e, além disso, ficaria muito caro enviar cada pedido separadamente, sendo assim a warehouse garante que tudo esteja completo e organizado em apenas uma caixa antes de vir pro Brasil. as warehouses cobram taxa para embalar as caixas, tirar fotos dos itens que chegaram e de armazenamento de itens caso ultrapasse o período de graça. a abreviação de warehouse é wh.
                  </div>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-pink-400 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">PROXY:</strong> é uma pessoa intermediária que compra um item quando você não consegue fazer o pagamento diretamente, seja pela seller ou site só aceitar dinheiro vindo de um banco local ou por não poder ser acessado. também usamos uma proxy quando queremos realizar compras em POP UPs ou eventos locais, onde não podemos visitar presencialmente, é como um intermédio. todas as proxys cobram uma taxa para realizar esse serviço.
                  </div>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-pink-400 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">FRETE INTER:</strong> é o frete internacional, e pagando ele você permite que a caixa que está na warehouse seja enviada para o Brasil. o preço do frete internacional varia por peso e volume da caixa, além do tipo de envio. os tipos de envio mais baratos (da coreia para o brasil), são o k-packet (até 2kgs) e EMS.
                  </div>
                </div>
              </div>

              {/* Subtítulo: TERMOS SOBRE ITENS, ANÚNCIOS E VENDAS */}
              <div className="text-center mb-2.5 sm:mb-3">
                <h3 className="font-extrabold text-[#f172b2] text-[0.72rem] sm:text-xs tracking-wider uppercase border-b border-pink-200 pb-0.5 inline-block">
                  termos sobre itens, anúncios e vendas
                </h3>
              </div>

              <div className="space-y-1.5 sm:space-y-2.5 text-[0.7rem] sm:text-xs text-justify">
                <div className="flex items-start gap-1.5">
                  <span className="text-pink-400 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">SET:</strong> é um conjunto de photocards que não será vendido separadamente. nesses casos, é preciso que todos os photocards saiam para que a compra seja realizada.
                  </div>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-pink-400 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">CLAIM:</strong> significa escolher qual item você irá comprar na ceg. quando você reinvindica um photocard pra si e realiza o pagamento, significa que eu vou realizar a compra dele pra você.
                  </div>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-pink-400 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">SOLD OUT:</strong> é quando o item já foi vendido. &quot;risco de sold out&quot; é usado para explicar que um item em questão tem a chance de esgotar, impossibilitando a compra.
                  </div>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-pink-400 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">PROOF:</strong> significa literalmente prova e é usado pra quando provamos que algum item foi enviado ou chegou na warehouse, com uma foto de todos os itens, fazendo com que haja maior confiança durante a ceg.
                  </div>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-pink-400 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">GARANTIDO:</strong> o termo &quot;garantido&quot; significa que o item já foi comprado e está a caminho da warehouse, ou seja, não tem chance de esgotar.
                  </div>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-pink-400 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">FEEDBACK:</strong> é a avaliação que você publica sobre a gom ou pessoa que vendeu um photocard, álbum ou qualquer item de coleção pra você, ele pode ser positivo, neutro (em alguma parte do processo acabou deixando a desejar) ou negativo. é publicado geralmente no Twitter ou Instagram.
                  </div>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-pink-400 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">TIMEWASTING:</strong> é quando alguém, durante o processo de venda e troca, faz a pessoa &quot;perder seu tempo&quot;, seja quando alguém enrola, desiste, ou simplesmente some depois de ter reservado um item, causando prejuízo no processo de compra em grupo.
                  </div>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-pink-400 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">AVARIA:</strong> defeito ou dano físico no item (PC riscado, amassado, desbotado, etc.), pode acontecer no transporte ou já vir da seller assim. na maioria das vezes, essas avarias são avisadas. elas podem ser pequenas ou grandes.
                  </div>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-pink-400 shrink-0">♥</span>
                  <div>
                    <strong className="text-[#f172b2] font-bold">SENSITIVE BUYER:</strong> pessoa que não aceita item com nenhum defeitinho mesmo que muito mínimo. em uma ceg inter, é comum que haja avarias minúsculas por conta do transporte. além disso, sellers não costumam usar papel paraná ou proteção extra. caso alguém seja um sensitive buyer, não é recomendado que participe de cegs inter.
                  </div>
                </div>
              </div>

              {/* Botão de retorno ao final da página */}
              <div className="mt-4 pt-3 border-t border-pink-200 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage('termos');
                    const cutesieWindow = document.getElementById('cutesie-window');
                    if (cutesieWindow) cutesieWindow.scrollTop = 0;
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#f172b2] hover:bg-[#e45ea1] text-white font-['Space_Mono',monospace] text-[0.7rem] sm:text-xs font-bold shadow-[0_2px_5px_rgba(244,114,182,0.25)] hover:shadow-[0_3px_8px_rgba(244,114,182,0.35)] active:translate-y-0.5 transition-all cursor-pointer"
                >
                  ← voltar para termos gerais
                </button>
              </div>
            </div>
          )}

          {/* ================= PAGE: SAIBA MAIS ================= */}
          {currentPage === 'saiba-mais' && (
            <div id="page-saiba-mais" className="flex flex-col animate-fadeIn">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <button
                  onClick={() => setCurrentPage('home')}
                  className="text-pink-400 hover:text-pink-600 text-[0.7rem] sm:text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  ← início
                </button>
                {isFormUnlocked && (
                  <span className="text-emerald-500 font-bold text-[0.65rem] sm:text-xs flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    formulário liberado ✨
                  </span>
                )}
              </div>

              <img
                src={saibaMaisBannerImg}
                alt="Saiba Mais Banner"
                referrerPolicy="no-referrer"
                className="w-full h-auto rounded-xl border border-pink-200 mb-2 sm:mb-3 object-cover"
              />
              <div className="text-center mb-2.5 sm:mb-3">
                <h2 className="font-extrabold text-[#f172b2] text-xs sm:text-sm tracking-wider uppercase border-b border-pink-300 pb-0.5 inline-block">
                  informações
                </h2>
              </div>

              <div className="space-y-1.5 sm:space-y-2.5 text-[0.7rem] sm:text-xs text-justify">
                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    oi, se você acessou esse link é porque tem interesse em participar da <strong className="font-bold text-[#f172b2]">caixinha do ahof</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    explicando um pouco mais: já fiz caixinhas na Coreia, Filipinas e China anteriormente em uma comunidade com 180 pessoas, mas parei com as <strong className="font-bold text-[#f172b2]">cegs</strong> pois o envio para um grupo tão grande de pessoas me sobrecarregava um pouco, por isso decidi reabrir caixas com um <strong className="font-bold text-[#f172b2]">grupo mais seleto de pessoas</strong> e por mais tempo do que antes para que se acumule mais itens e consequentemente <strong className="font-bold text-[#f172b2]">barateie o frete</strong>. o motivo de querer voltar é principalmente para que eu consiga comprar <strong className="font-bold text-[#f172b2]">itens da minha coleção pessoal</strong>, visto que os grupos que coleciono não possuem muita rotatividade de itens no Brasil.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    a caixa atualmente aberta é a <strong className="font-bold text-[#f172b2]">caixa Filipinas</strong>, que terá sua finalização apenas em <strong className="font-bold text-[#f172b2]">janeiro de 2027</strong>, tendo seu envio em <strong className="font-bold text-[#f172b2]">fevereiro de 2027</strong> para o Brasil. entre na <strong className="font-bold text-[#f172b2]">ceg</strong> sabendo que ela vai ser demorada.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    por ser uma <strong className="font-bold text-[#f172b2]">ceg de um grupo mais seleto</strong> de pessoas, ela durará mais tempo, podendo ter seu envio pro Brasil adiado e seu prazo ampliado caso não consiga atingir sua <strong className="font-bold text-[#f172b2]">meta de itens (100 itens)</strong> até final de janeiro de 2027.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    os membros <strong className="font-bold text-[#f172b2]">woongki, jeongwoo, chih en e han</strong> nem sempre estarão disponíveis, pois o <strong className="font-bold text-[#f172b2]">woongki é minha coleção principal</strong> e os outros membros das minhas amigas, e darei prioridade para nossas claims primeiro antes de anunciar. caso não haja nenhum pc do interesse delas, aí sim liberarei para a claim para o geral. <strong className="font-bold text-[#f172b2]">entre na caixinha sabendo disso.</strong>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="mt-4 pt-3 border-t border-pink-200">
                <div className="text-center mb-2.5 sm:mb-3">
                  <h3 className="font-extrabold text-[#f172b2] text-xs sm:text-sm tracking-wider uppercase border-b border-pink-300 pb-0.5 inline-block">
                    regras
                  </h3>
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2.5 text-[0.7rem] sm:text-xs text-justify">
                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    para participar das cegs, é <strong className="font-bold text-[#f172b2]">obrigatório ter mais de 16 anos</strong>, e se comprometer em pagar todos os itens que deu claim no prazo, incluindo os que são de <strong className="font-bold text-[#f172b2]">pagamento imediato</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    eu aceito <strong className="font-bold text-[#f172b2]">cartão de crédito</strong> como pagamento, taxas extras pagas pelo comprador.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    a <strong className="font-bold text-[#f172b2]">caixa Filipinas</strong> terá uma <strong className="font-bold text-[#f172b2]">vaga máxima de 25 pessoas</strong>, podendo ser ampliada posteriormente.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    para <strong className="font-bold text-[#f172b2]">entrar</strong> ou recomendar outras pessoas para entrar na ceg, é pra pedir pra me chamar no twitter <a href="https://x.com/woongbaer" target="_blank" rel="noopener noreferrer" className="font-bold text-[#f172b2] hover:underline">@woongbaer</a> ou <a href="https://x.com/s2jiwoongki" target="_blank" rel="noopener noreferrer" className="font-bold text-[#f172b2] hover:underline">@s2jiwoongki</a> (meu twitter pessoal) primeiro antes de enviar o link.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    só aceitarei <strong className="font-bold text-[#f172b2]">repasse de itens</strong> quando a caixa fechar e estiver a caminho do Brasil, ou seja, em <strong className="font-bold text-[#f172b2]">meados de fevereiro</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    você pode enviar <strong className="font-bold text-[#f172b2]">pedidos individuais</strong> de outros grupos no meu privado, mas leia os <strong className="font-bold text-[#f172b2]">termos e tutoriais</strong> nas abas acima antes.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    o participante que <strong className="font-bold text-[#f172b2]">não realizar nenhuma compra por 2 meses seguidos</strong> será removido do grupo para abrir vaga para outra pessoa, a não ser que já tenha comprado algum item anteriormente.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                  <div>
                    você pode comprar itens em conjunto de outras pessoas ou para outras pessoas, mas você se <strong className="font-bold text-[#f172b2]">compromete a fazer o envio nacional</strong> para ela, visto que apenas enviarei para os participantes da <strong className="font-bold text-[#f172b2]">ceg</strong>.
                  </div>
                </div>
              </div>

              {/* Formulário / Call to action */}
              <div className="mt-4 pt-3 border-t border-pink-200">
                <div className="bg-[#fff0f6] border border-pink-300 p-3 sm:p-3.5 rounded-2xl text-center shadow-xs mb-3">
                  <p className="text-[0.7rem] sm:text-xs font-bold text-[#f172b2] leading-relaxed">
                    se você se interessar em participar, por favor, preencha o forms abaixo e eu entrarei em contato em breve para te adicionar no grupo!
                  </p>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    id="btn-acessar-formulario"
                    onClick={() => {
                      if (isFormUnlocked) {
                        window.open('https://forms.gle/ds3MDDNqqvykZSNL6', '_blank', 'noopener,noreferrer');
                      } else {
                        setShowFormModal(true);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#f172b2] hover:bg-[#e45ea1] text-white font-['Space_Mono',monospace] text-[0.7rem] sm:text-xs font-bold shadow-[0_2px_5px_rgba(244,114,182,0.25)] hover:shadow-[0_3px_8px_rgba(244,114,182,0.35)] active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-pink-100" />
                    {isFormUnlocked ? 'acessar formulário (liberado ✨)' : 'clique aqui para acessar o formulário'}
                  </button>
                </div>

                <div className="text-center mt-3 text-pink-400 font-['Space_Mono',monospace] text-[0.68rem] italic">
                  muito obrigada pelo interesse e confiança (◍•ᴗ•◍)✧*。
                </div>
              </div>
            </div>
          )}

          {/* ================= PAGE: CAIXAS ================= */}
          {currentPage === 'caixas' && (
            <div id="page-caixas" className="flex flex-col animate-fadeIn">
              {/* Menu de Países (Filipinas, Japão, Coreia) */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-[340px] mx-auto mb-4 pb-3 border-b-2 border-dashed border-pink-200">
                {[
                  {
                    id: 'filipinas' as Country,
                    name: 'cx filipinas',
                    img: cxFilipinasImg,
                  },
                  {
                    id: 'japao' as Country,
                    name: 'cx japão',
                    img: cxJapaoImg,
                  },
                  {
                    id: 'coreia' as Country,
                    name: 'cx coreia',
                    img: cxCoreiaImg,
                  },
                ].map((country) => {
                  const isSelected = currentCountry === country.id;
                  const isClosed = country.id === 'coreia';
                  const isSoon = country.id === 'japao';
                  return (
                    <button
                      key={country.id}
                      onClick={() => {
                        setCurrentCountry(country.id);
                        if (isClosed) {
                          setClosedBoxModal({
                            isOpen: true,
                            country: 'coreia',
                          });
                        } else if (isSoon) {
                          setClosedBoxModal({
                            isOpen: true,
                            country: 'japao',
                          });
                        }
                      }}
                      className="flex flex-col items-center group cursor-pointer relative"
                    >
                      <div className="relative">
                        <img
                          src={country.img}
                          alt={country.name}
                          referrerPolicy="no-referrer"
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-3 border-[#f172b2] transition-all ${
                            isSelected
                              ? 'shadow-[0_3px_10px_rgba(244,114,182,0.4)] scale-105'
                              : 'opacity-85 group-hover:opacity-100'
                          }`}
                        />
                        {isClosed && (
                          <span className="absolute -bottom-1 -right-1 bg-[#fbcfe8] text-[#9d174d] border border-pink-300 font-['Space_Mono',monospace] text-[0.55rem] font-bold px-1.5 py-0.2 rounded-full shadow-xs uppercase tracking-tight">
                            fechada
                          </span>
                        )}
                        {isSoon && (
                          <span className="absolute -bottom-1 -right-1 bg-[#fce7f3] text-[#b0487d] border border-pink-200 font-['Space_Mono',monospace] text-[0.55rem] font-bold px-1.5 py-0.2 rounded-full shadow-xs uppercase tracking-tight">
                            em breve
                          </span>
                        )}
                      </div>
                      <span
                        className={`mt-1 font-bold text-[0.72rem] text-center ${
                          isSelected ? 'text-[#f172b2]' : 'text-pink-400 group-hover:text-[#f172b2]'
                        }`}
                      >
                        {country.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Area Filipinas (Prioritária) */}
              {currentCountry === 'filipinas' && (
                <div id="area-filipinas" className="flex flex-col animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-2.5 sm:mb-3 items-stretch">
                    {/* Coluna Esquerda */}
                    <div className="flex flex-col items-center text-center">
                      <img
                        src={cxFilipinasImg}
                        alt="Caixa Filipinas"
                        referrerPolicy="no-referrer"
                        className="w-full aspect-square max-w-[200px] object-cover rounded-xl border-2 border-pink-200 mb-1.5 sm:mb-2 shadow-xs"
                      />
                      <h2 className="font-black text-sm sm:text-base text-[#f172b2] tracking-tight">
                        caixa filipinas
                      </h2>
                      <div className="w-full h-px bg-pink-200 my-1 sm:my-1.5" />
                      <div className="text-[0.65rem] sm:text-[0.7rem] font-bold text-[#f172b2] uppercase">
                        TRAJETO USUAL:{' '}
                        <span className="text-[#6b586e] font-normal">FILIPINAS &gt; COREIA &gt; BRASIL</span>
                      </div>
                      <div className="w-full h-px bg-pink-200 my-0.5 sm:my-1" />
                      <div className="text-[0.65rem] sm:text-[0.7rem] font-bold text-[#f172b2] uppercase">
                        CAIXA ABERTA ATÉ: <span className="text-[#6b586e] font-normal">JANEIRO 2027</span>
                      </div>
                      <div className="w-full h-px bg-pink-200 my-0.5 sm:my-1" />
                      <div className="text-[0.65rem] sm:text-[0.7rem] font-bold text-[#f172b2] uppercase">
                        ENVIO PRA O BRASIL: <span className="text-[#6b586e] font-normal">FEVEREIRO 2027</span>
                      </div>
                      <div className="w-full h-px bg-pink-200 my-0.5 sm:my-1" />
                      <div className="text-[0.65rem] sm:text-[0.7rem] font-bold text-[#f172b2] uppercase">
                        TIPOS DE ITENS:{' '}
                        <span className="text-[#6b586e] font-normal uppercase">
                          PHOTOCARDS, DOLLS, HOLDERS E ITENS PEQUENOS.
                        </span>
                      </div>
                    </div>

                    {/* Coluna Direita com Barra de Navegação/Rolagem Vertical alinhada até a linha de Tipos de Itens */}
                    <div className="flex flex-col h-[360px] sm:h-full sm:max-h-[395px] min-h-0">
                      <div className="flex-1 overflow-y-auto pr-1.5 sm:pr-2 space-y-1.5 sm:space-y-2 text-[0.7rem] sm:text-xs text-justify">
                        <div className="flex items-start gap-1 sm:gap-1.5">
                          <span className="text-pink-400 shrink-0">♥</span>
                          <div>
                            aceito <strong className="font-bold text-[#f172b2]">pedidos individuais</strong> (mais informações abaixo) e também <strong className="font-bold text-[#f172b2]">abro sets</strong> que irão para essa caixa na comunidade.
                          </div>
                        </div>
                        <div className="flex items-start gap-1 sm:gap-1.5">
                          <span className="text-pink-400 shrink-0">♥</span>
                          <div>
                            aceito <strong className="font-bold text-[#f172b2]">pix e cartão de crédito</strong> como pagamento. no cartão de crédito é cobrado o valor + <strong className="font-bold text-[#f172b2]">taxas de processamento</strong> (pagas pelo comprador).
                          </div>
                        </div>
                        <div className="flex items-start gap-1 sm:gap-1.5">
                          <span className="text-pink-400 shrink-0">♥</span>
                          <div>
                            <strong className="font-bold text-[#f172b2]">dê claim apenas em itens que você pode custear</strong> até o prazo do pagamento. em caso de <strong className="font-bold text-[#f172b2]">pagamento imediato</strong>, eu irei cobrar assim que confirmar com a seller a disponibilidade.
                          </div>
                        </div>
                        <div className="flex items-start gap-1 sm:gap-1.5">
                          <span className="text-pink-400 shrink-0">♥</span>
                          <div>
                            diferente da caixa coreia, a caixa da filipina terá <strong className="font-bold text-[#f172b2]">DOIS FRETES INTERNACIONAIS</strong>, pois esta caixa irá até a minha <strong className="font-bold text-[#f172b2]">warehouse coreana primeiro</strong> para depois ser encaminhada para o <strong className="font-bold text-[#f172b2]">Brasil por questões de segurança</strong>. o primeiro frete <strong className="font-bold text-[#f172b2]">filipinas &gt; coreia do sul</strong> é mais barato e o segundo frete <strong className="font-bold text-[#f172b2]">coreia do sul &gt; brasil</strong> é um pouco mais caro, mas em média os fretes ficam entre <strong className="font-bold text-[#f172b2]">R$ 0,50 a no máximo R$ 5,00 por PHOTOCARD</strong>.
                          </div>
                        </div>
                        <div className="flex items-start gap-1 sm:gap-1.5">
                          <span className="text-pink-400 shrink-0">♥</span>
                          <div>
                            a caixa ficará <strong className="font-bold text-[#f172b2]">aberta até janeiro de 2027</strong> e com envio em <strong className="font-bold text-[#f172b2]">fevereiro de 2027</strong>. quando eu anunciar que a caixa está fechada, eu irei solicitar a cotação do frete internacional para a warehouse da coreia, eu divido o valor <strong className="font-bold text-[#f172b2]">por ITEM</strong> e me baseando no <strong className="font-bold text-[#f172b2]">peso deste item</strong>. caso seja um item mais pesado, o valor é um bocado maior. (leia mais sobre isso em{' '}
                            <button
                              type="button"
                              onClick={() => setCurrentPage('termos')}
                              className="inline-flex items-center mx-0.5 px-2 py-0.5 rounded-full bg-[#fff0f5] border border-pink-200 text-[#f172b2] hover:text-[#db5b9c] font-['Space_Mono',monospace] text-[0.65rem] sm:text-[0.7rem] font-bold shadow-[0_2px_5px_rgba(244,114,182,0.18)] hover:shadow-[0_3px_8px_rgba(244,114,182,0.28)] active:translate-y-0.5 transition-all cursor-pointer align-middle"
                            >
                              TERMOS
                            </button>
                            ).
                          </div>
                        </div>
                        <div className="flex items-start gap-1 sm:gap-1.5">
                          <span className="text-pink-400 shrink-0">♥</span>
                          <div>
                            <strong className="font-bold text-[#f172b2]">a maioria das caixas taxam</strong>. o valor vai variar dependendo da quantidade de itens e valor declarado.
                          </div>
                        </div>
                        <div className="flex items-start gap-1 sm:gap-1.5">
                          <span className="text-pink-400 shrink-0">♥</span>
                          <div>
                            dúvidas sobre o processo de compra podem ser sempre tirados no meu privado do <strong className="font-bold text-[#f172b2]">twitter (@woongbaer) ou whatsapp</strong>. &lt;3
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-pink-200">
                    <div className="text-center mb-2.5 sm:mb-3">
                      <h3 className="font-extrabold text-[#f172b2] text-xs sm:text-sm tracking-wider uppercase border-b border-pink-300 pb-0.5 inline-block">
                        caixa filipinas: como pedir?
                      </h3>
                    </div>
                  </div>

                  <div className="text-center text-[0.68rem] sm:text-xs font-bold text-pink-400 mb-1.5 uppercase">
                    pedidos via twitter
                  </div>

                  {/* Botões abaixo de pedidos via twitter */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-2.5">
                    <a
                      href="https://x.com/i/communities/1887860809763799466"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff0f5] border border-pink-300 text-[#f172b2] hover:text-[#db5b9c] font-['Space_Mono',monospace] text-[0.68rem] sm:text-xs font-bold shadow-[0_2px_5px_rgba(244,114,182,0.18)] hover:shadow-[0_3px_8px_rgba(244,114,182,0.28)] active:translate-y-0.5 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-400" />
                      comunidade bns ahof filipinas
                    </a>

                    <button
                      type="button"
                      onClick={() => setShowDicionarioPh(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f172b2] hover:bg-[#e45ea1] text-white font-['Space_Mono',monospace] text-[0.68rem] sm:text-xs font-bold shadow-[0_2px_5px_rgba(244,114,182,0.25)] hover:shadow-[0_3px_8px_rgba(244,114,182,0.35)] active:translate-y-0.5 transition-all cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-100" />
                      dicionário de termos ph
                    </button>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2.5 text-[0.7rem] sm:text-xs text-justify">
                    <div className="flex items-start gap-2">
                      <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                      <div>
                        no <span className="text-[#f172b2] font-bold">TWITTER</span>, pesquise o nome do grupo que você gostaria de comprar + as palavras <span className="text-[#f172b2] font-bold">wts ph</span> (wts = quero vender, ph = filipinas), depois clique para ver os tweets mais recentes.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                      <div>
                        <span className="text-[#f172b2] font-bold">ATENÇÃO:</span> no anúncio precisa estar as palavras <span className="text-[#f172b2] font-bold">on hand</span> (pronta entrega) ou pelo menos que dê pra entender que o item está com a pessoa e pronto pra ser enviado, isso porque na filipinas eles costumam anunciar cegs de itens que estão na coreia ou china, e demoraria muito tempo até ele chegar na warehouse da filipinas.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                      <div>
                        os anúncios estão na moeda php ₱. você pode usar a nossa{' '}
                        <button
                          onClick={() => {
                            setCurrentPage('calc-completa');
                            setCountryCompleta('filipinas');
                          }}
                          className="inline-flex items-center mx-1 px-2.5 py-0.5 rounded-full bg-[#fff0f5] border border-pink-200 text-[#f172b2] hover:text-[#db5b9c] font-['Space_Mono',monospace] text-[0.7rem] sm:text-xs font-bold shadow-[0_2px_5px_rgba(244,114,182,0.18)] hover:shadow-[0_3px_8px_rgba(244,114,182,0.28)] active:translate-y-0.5 transition-all cursor-pointer align-middle"
                        >
                          calculadora ph
                        </button>{' '}
                        para ter uma média do preço.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                      <div>
                        na dúvida, encaminhe o tweet para minha dm para eu analisar se é possível realizar a compra ou não, sem compromisso! lembrando que assim que eu confirmar o pagamento é imediato.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                      <div>
                        <span className="italic font-bold text-[#f172b2]">dicas de segurança:</span> para evitar calotes, não é recomendado comprar com contas muito recentes ou que apenas posta anúncios sem nenhuma atualização de venda (se algum photocard saiu ou não). se eu perceber que pode ser um scammer, avisarei, mas eu <span className="font-bold text-rose-500">NÃO sou responsável</span> por possíveis calotes de sellers.
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-pink-200">
                    <div className="text-center mb-2.5 sm:mb-3">
                      <h3 className="font-extrabold text-[#f172b2] text-xs sm:text-sm tracking-wider uppercase border-b border-pink-300 pb-0.5 inline-block">
                        shopee ph: como comprar?
                      </h3>
                    </div>
                  </div>

                  <div className="text-center text-[0.68rem] sm:text-xs font-bold text-pink-400 mb-2 uppercase">
                    pedidos via shopee ph
                  </div>

                  {/* Botão link Shopee PH centralizado */}
                  <div className="flex justify-center mb-2.5">
                    <a
                      href="https://shopee.ph/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#fff0f5] border border-pink-300 text-[#f172b2] hover:text-[#db5b9c] font-['Space_Mono',monospace] text-[0.68rem] sm:text-xs font-bold shadow-[0_2px_5px_rgba(244,114,182,0.18)] hover:shadow-[0_3px_8px_rgba(244,114,182,0.28)] active:translate-y-0.5 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-400" />
                      shopee filipinas (shopee.ph)
                    </a>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2.5 text-[0.7rem] sm:text-xs text-justify">
                    <div className="flex items-start gap-2">
                      <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                      <div>
                        você precisar criar uma conta nova na shopee. não use a conta shopee do brasil, conecte-se usando um novo e-mail ou conta
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                      <div>
                        ao pesquisar itens, procure por aqueles que estão já na filipinas (clique em doméstico / domestic nos filtros). não é possível fazer compras internacionais para receber na filipinas, por conta do longo tempo de espera e possibilidade de extravio.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                      <div>
                        utilize a{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPage('calc-completa');
                            setCountryCompleta('filipinas');
                          }}
                          className="inline-flex items-center mx-1 px-2.5 py-0.5 rounded-full bg-[#fff0f5] border border-pink-200 text-[#f172b2] hover:text-[#db5b9c] font-['Space_Mono',monospace] text-[0.7rem] sm:text-xs font-bold shadow-[0_2px_5px_rgba(244,114,182,0.18)] hover:shadow-[0_3px_8px_rgba(244,114,182,0.28)] active:translate-y-0.5 transition-all cursor-pointer align-middle"
                        >
                          calculadora ph
                        </button>{' '}
                        para calcular o valor total do seu envio
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                      <div>
                        mande o link do produto do seu interesse no meu privado do whatsapp
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                      <div>
                        <strong className="text-[#f172b2] font-bold">IMPORTANTE:</strong> por favor note que a pesquisa de photocards na shopee ph é mais arriscada pois não é possível verificar a veracidade dos photocards, portanto é mais recomendado utilizar para pesquisa de itens fanmades, holders e outras coisas que não se encontra no brasil. caso eu perceba que possa vir ser uma replica, avisarei, mas não me responsibilzarei por falta autenticidade dos itens.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Area Japão */}
              {currentCountry === 'japao' && (
                <div id="area-japao" className="flex flex-col animate-fadeIn">
                  {/* Banner de Aviso: Em Breve */}
                  <div
                    onClick={() => setClosedBoxModal({ isOpen: true, country: 'japao' })}
                    className="mb-2.5 bg-[#fff0f6] border border-pink-200 text-[#9c3d6f] px-3 py-1.5 rounded-xl text-center text-[0.7rem] sm:text-xs font-bold cursor-pointer hover:bg-[#ffe8f2] transition-all shadow-xs flex items-center justify-center gap-1.5 group select-none"
                  >
                    <span>✨</span>
                    <span>
                      <strong className="text-[#f172b2] font-bold uppercase">EM BREVE:</strong> em breve essa caixa será aberta, aguarde mais informações!
                    </span>
                    <span className="text-[0.65rem] underline text-[#f172b2] font-mono group-hover:text-[#db5b9c]">(aviso)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
                    {/* Coluna Esquerda */}
                    <div className="flex flex-col items-center text-center">
                      <img
                        src={cxJapaoImg}
                        alt="Caixa Japão"
                        referrerPolicy="no-referrer"
                        className="w-full aspect-square max-w-[200px] object-cover rounded-xl border-2 border-pink-200 mb-1.5 sm:mb-2 shadow-xs"
                      />
                      <h2 className="font-black text-sm sm:text-base text-[#f172b2] tracking-tight">
                        caixa japão
                      </h2>
                      <div className="w-full h-px bg-pink-200 my-1 sm:my-1.5" />
                      <div className="text-[0.65rem] sm:text-[0.7rem] font-bold text-[#f172b2] uppercase">
                        TRAJETO USUAL:{' '}
                        <span className="text-[#6b586e] font-normal">JAPÃO &gt; BRASIL</span>
                      </div>
                      <div className="w-full h-px bg-pink-200 my-0.5 sm:my-1" />
                      <div className="text-[0.65rem] sm:text-[0.7rem] font-bold text-[#f172b2] uppercase">
                        CAIXA ABERTA POR: <span className="text-[#6b586e] font-normal">1 A 2 MESES</span>
                      </div>
                      <div className="w-full h-px bg-pink-200 my-0.5 sm:my-1" />
                      <div className="text-[0.65rem] sm:text-[0.7rem] font-bold text-[#f172b2] uppercase">
                        TIPOS DE ITENS:{' '}
                        <span className="text-[#6b586e] font-normal normal-case">
                          Mercari JP, Photocards, Merch Oficial, Colecionáveis, Dolls
                        </span>
                      </div>
                    </div>

                    {/* Coluna Direita */}
                    <div className="space-y-1.5 sm:space-y-2 text-[0.7rem] sm:text-xs text-justify">
                      <div className="flex items-start gap-1 sm:gap-1.5">
                        <span className="text-pink-400 shrink-0">♥</span>
                        <div>
                          dê <span className="text-[#f172b2] font-bold">claim</span> apenas em itens que você pode custear até o prazo do pagamento.
                        </div>
                      </div>
                      <div className="flex items-start gap-1 sm:gap-1.5">
                        <span className="text-pink-400 shrink-0">♥</span>
                        <div>
                          compras realizadas no <span className="text-[#f172b2] font-bold">Mercari Japan</span> e lojas japonesas através de proxy segura e confiável.
                        </div>
                      </div>
                      <div className="flex items-start gap-1 sm:gap-1.5">
                        <span className="text-pink-400 shrink-0">♥</span>
                        <div>
                          taxa de compra fixa de <span className="text-[#f172b2] font-bold">100 ienes</span> por pedido + taxa de pagamento de <span className="text-[#f172b2] font-bold">14 ienes por dólar</span> (Pix).
                        </div>
                      </div>
                      <div className="flex items-start gap-1 sm:gap-1.5">
                        <span className="text-pink-400 shrink-0">♥</span>
                        <div>
                          ao fechar a caixa, solicito cotação do frete inter do Japão e divido o valor por <span className="text-[#f172b2] font-bold">ITEM</span>.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informações adicionais em boxes rosas */}
                  <div className="space-y-1.5 mb-2.5 sm:mb-3">
                    <div className="bg-pink-50 border border-pink-200 text-[#f172b2] p-1.5 sm:p-2 rounded-xl text-[0.68rem] sm:text-[0.72rem] text-center font-semibold">
                      aceito pedidos individuais do mercari jp e abro sets para essa caixa
                    </div>
                    <div className="bg-pink-50 border border-pink-200 text-[#f172b2] p-1.5 sm:p-2 rounded-xl text-[0.68rem] sm:text-[0.72rem] text-center font-semibold">
                      aceito <span className="font-bold">pix e cartão de crédito</span> como pagamento (+ taxas da plataforma)
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-pink-200">
                    <div className="text-center mb-2.5 sm:mb-3">
                      <h3 className="font-extrabold text-[#f172b2] text-xs sm:text-sm tracking-wider uppercase border-b border-pink-300 pb-0.5 inline-block">
                        caixa japão: como pedir?
                      </h3>
                    </div>
                  </div>
                  <div className="text-center text-[0.68rem] sm:text-xs font-bold text-pink-400 mb-1.5 sm:mb-2 uppercase">
                    mercari japan & twitter
                  </div>

                  <div className="space-y-1.5 sm:space-y-2.5 text-[0.7rem] sm:text-xs text-justify">
                    <div className="flex items-start gap-2">
                      <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                      <div>
                        acesse o <span className="text-[#f172b2] font-bold">MERCARI JAPAN (jp.mercari.com)</span> e procure pelo item desejado ou nome do artista/grupo em japonês ou inglês.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                      <div>
                        copie o link do item e use nossa <span className="text-[#f172b2] font-bold">Calculadora Japão</span> na aba "calculadora" para ver o preço exato com todas as taxas convertidas para reais!
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                      <div>
                        envie o link no meu privado do <span className="text-[#f172b2] font-bold">twitter (@woongbaer)</span> para conferência e confirmação de claim.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Area Coreia */}
              {currentCountry === 'coreia' && (
                <div id="area-coreia" className="flex flex-col animate-fadeIn">
                  {/* Banner de Aviso: Caixa Fechada */}
                  <div
                    onClick={() => setClosedBoxModal({ isOpen: true, country: 'coreia' })}
                    className="mb-2.5 bg-[#fff0f6] border border-pink-200 text-[#9c3d6f] px-3 py-1.5 rounded-xl text-center text-[0.7rem] sm:text-xs font-bold cursor-pointer hover:bg-[#ffe8f2] transition-all shadow-xs flex items-center justify-center gap-1.5 group select-none"
                  >
                    <span>🔒</span>
                    <span>
                      <strong className="text-[#f172b2] font-bold uppercase">CAIXA FECHADA:</strong> a caixa coreia 🇰🇷 não está aceitando pedidos. breve mais informações sobre a abertura!
                    </span>
                    <span className="text-[0.65rem] underline text-[#f172b2] font-mono group-hover:text-[#db5b9c]">(aviso)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
                    {/* Coluna Esquerda */}
                    <div className="flex flex-col items-center text-center">
                      <img
                        src={cxCoreiaImg}
                        alt="Caixa Coreia"
                        referrerPolicy="no-referrer"
                        className="w-full aspect-square max-w-[200px] object-cover rounded-xl border-2 border-pink-200 mb-1.5 sm:mb-2 shadow-xs"
                      />
                      <h2 className="font-black text-sm sm:text-base text-[#f172b2] tracking-tight">
                        caixa coreia
                      </h2>
                      <div className="w-full h-px bg-pink-200 my-1 sm:my-1.5" />
                      <div className="text-[0.65rem] sm:text-[0.7rem] font-bold text-[#f172b2] uppercase">
                        TRAJETO USUAL:{' '}
                        <span className="text-[#6b586e] font-normal">COREIA DO SUL &gt; BRASIL</span>
                      </div>
                      <div className="w-full h-px bg-pink-200 my-0.5 sm:my-1" />
                      <div className="text-[0.65rem] sm:text-[0.7rem] font-bold text-[#f172b2] uppercase">
                        CAIXA ABERTA POR: <span className="text-[#6b586e] font-normal">1 MÊS</span>
                      </div>
                      <div className="w-full h-px bg-pink-200 my-0.5 sm:my-1" />
                      <div className="text-[0.65rem] sm:text-[0.7rem] font-bold text-[#f172b2] uppercase">
                        TIPOS DE ITENS:{' '}
                        <span className="text-[#6b586e] font-normal normal-case">
                          Photocards, Postcards, Keyrings, Dolls, Sleeves, Toploaders
                        </span>
                      </div>
                    </div>

                    {/* Coluna Direita */}
                    <div className="space-y-1.5 sm:space-y-2 text-[0.7rem] sm:text-xs text-justify">
                      <div className="flex items-start gap-1 sm:gap-1.5">
                        <span className="text-pink-400 shrink-0">♥</span>
                        <div>
                          dê <span className="text-[#f172b2] font-bold">claim</span> apenas em itens que você pode custear até o prazo do pagamento.
                        </div>
                      </div>
                      <div className="flex items-start gap-1 sm:gap-1.5">
                        <span className="text-pink-400 shrink-0">♥</span>
                        <div>
                          a caixa fica aberta em <span className="text-[#f172b2] font-bold">média por 1 mês</span>. Ao fechar, solicito cotação do frete inter para a warehouse e divido por <span className="text-[#f172b2] font-bold">ITEM</span>.
                        </div>
                      </div>
                      <div className="flex items-start gap-1 sm:gap-1.5">
                        <span className="text-pink-400 shrink-0">♥</span>
                        <div>
                          dúvidas sobre o processo de compra podem ser sempre tirados no meu privado do <span className="text-[#f172b2] font-bold">twitter ou instagram</span>. &lt;3
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informações adicionais em boxes rosas */}
                  <div className="space-y-1.5 mb-2.5 sm:mb-3">
                    <div className="bg-pink-50 border border-pink-200 text-[#f172b2] p-1.5 sm:p-2 rounded-xl text-[0.68rem] sm:text-[0.72rem] text-center font-semibold">
                      aceito pedidos individuais e também abro sets que irão para essa caixa
                    </div>
                    <div className="bg-pink-50 border border-pink-200 text-[#f172b2] p-1.5 sm:p-2 rounded-xl text-[0.68rem] sm:text-[0.72rem] text-center font-semibold">
                      aceito <span className="font-bold">pix e cartão de crédito</span> como pagamento (+ taxas da plataforma)
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-pink-200">
                    <div className="text-center mb-2.5 sm:mb-3">
                      <h3 className="font-extrabold text-[#f172b2] text-xs sm:text-sm tracking-wider uppercase border-b border-pink-300 pb-0.5 inline-block">
                        caixa coreia: como pedir?
                      </h3>
                    </div>
                  </div>
                  <div className="text-center text-[0.68rem] sm:text-xs font-bold text-pink-400 mb-1.5 sm:mb-2 uppercase">
                    twitter
                  </div>

                  <div className="space-y-1.5 sm:space-y-2.5 text-[0.7rem] sm:text-xs text-justify">
                    <div className="flex items-start gap-2">
                      <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                      <div>
                        no TWITTER, pesquise o nome do grupo em coreano + venda (양도). Exemplo:{' '}
                        <span className="text-[#f172b2] font-bold">cix venda = 씨아이엑스 양도</span>.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                      <div>
                        os coreanos usam o formato: 0.05 = 500 won, 0.1 = 1000 won, 1.0 = 10.000 won, 10.0 = 100.000 won!
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-400 text-sm mt-0.5 shrink-0">♥</span>
                      <div>
                        some <span className="text-[#f172b2] font-bold">13 reais</span> (aproximadamente 3500 won) no valor total, equivalente à taxa de proxy e frete para a warehouse.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= PAGE: CALCULADORA COMPLETA ================= */}
          {currentPage === 'calc-completa' && (
            <div id="page-calc-completa" className="flex flex-col animate-fadeIn">
              {/* Menu de Países (Filipinas, Japão, Coreia) */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-[340px] mx-auto mb-4 pb-3 border-b-2 border-dashed border-pink-200">
                {[
                  {
                    id: 'filipinas' as Country,
                    name: 'cx filipinas',
                    img: cxFilipinasImg,
                  },
                  {
                    id: 'japao' as Country,
                    name: 'cx japão',
                    img: cxJapaoImg,
                  },
                  {
                    id: 'coreia' as Country,
                    name: 'cx coreia',
                    img: cxCoreiaImg,
                  },
                ].map((country) => {
                  const isSelected = countryCompleta === country.id;
                  return (
                    <button
                      key={country.id}
                      onClick={() => setCountryCompleta(country.id)}
                      className="flex flex-col items-center group cursor-pointer"
                    >
                      <img
                        src={country.img}
                        alt={country.name}
                        referrerPolicy="no-referrer"
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-3 border-[#f172b2] transition-all ${
                          isSelected
                            ? 'shadow-[0_3px_10px_rgba(244,114,182,0.4)] scale-105'
                            : 'opacity-85 group-hover:opacity-100'
                        }`}
                      />
                      <span
                        className={`mt-1 font-bold text-[0.72rem] text-center ${
                          isSelected ? 'text-[#f172b2]' : 'text-pink-400 group-hover:text-[#f172b2]'
                        }`}
                      >
                        {country.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <h2 className="text-center font-black text-sm sm:text-lg text-[#f172b2] mb-0.5 sm:mb-1">
                {countryCompleta === 'filipinas'
                  ? 'Calculadora Filipinas 🇵🇭'
                  : countryCompleta === 'coreia'
                  ? 'Calculadora Coreia 🇰🇷'
                  : 'Calculadora Japão 🇯🇵'}
              </h2>
              <p className="text-center text-[0.68rem] sm:text-xs text-pink-400 mb-2 sm:mb-3">
                {countryCompleta === 'filipinas'
                  ? 'Calculadora de conversão de Peso Filipino (PHP) para Real.'
                  : countryCompleta === 'coreia'
                  ? 'Calculadora estendida até 20.0 com opção de valor manual e divisão por pessoa.'
                  : 'Calculadora Mercari JP com busca por link, taxas de compra e pagamento.'}
              </p>

              {countryCompleta === 'filipinas' ? (
                <FilipinasCalculator />
              ) : countryCompleta === 'japao' ? (
                <JapaoCalculator />
              ) : (
                <div className="bg-pink-50/70 p-2.5 sm:p-3.5 rounded-2xl border border-pink-200">
                  <label className="block text-[0.68rem] sm:text-[0.75rem] font-bold text-pink-500 mb-1">
                    ✦ Selecione o Item (Até 20.0)
                  </label>
                  <select
                    value={selectedCompIndex}
                    onChange={(e) => setSelectedCompIndex(e.target.value)}
                    className="w-full p-1.5 sm:p-2 rounded-xl border border-pink-300 bg-white text-[0.7rem] sm:text-xs text-[#5c4f61] focus:ring-2 focus:ring-pink-300 outline-none mb-1.5 sm:mb-2"
                  >
                    <option value="-1">-- Escolha aqui --</option>
                    {DADOS_TABELA_COMPLETA.map((item, idx) => (
                      <option key={idx} value={idx}>
                        {item.l} (R$ {item.v.toFixed(2).replace('.', ',')})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={addItemComp}
                    className="w-full py-1.5 sm:py-2 bg-[#f172b2] hover:bg-[#e45ea1] text-white font-bold text-[0.7rem] sm:text-xs rounded-xl shadow-[0_3px_8px_rgba(244,114,182,0.3)] active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    + Adicionar
                  </button>

                  <div className="mt-2 sm:mt-3">
                    <label className="block text-[0.68rem] sm:text-[0.75rem] font-bold text-pink-500 mb-1">
                      ✦ Ou Valor Manual (R$)
                    </label>
                    <div className="flex gap-1.5 sm:gap-2">
                      <input
                        type="text"
                        placeholder="Ex: 45,00"
                        value={manualValor}
                        onChange={(e) => setManualValor(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addManualComp();
                          }
                        }}
                        className="flex-1 p-1.5 sm:p-2 rounded-xl border border-pink-300 bg-white text-[0.7rem] sm:text-xs text-[#5c4f61] focus:ring-2 focus:ring-pink-300 outline-none"
                      />
                      <button
                        onClick={addManualComp}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#f172b2] hover:bg-[#e45ea1] text-white font-bold text-[0.7rem] sm:text-xs rounded-xl shadow-xs cursor-pointer"
                      >
                        OK
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[0.68rem] sm:text-[0.75rem] font-bold text-pink-500 mt-2.5 sm:mt-3 mb-1">
                    <span>✦ Seu Carrinho</span>
                    {totalWonValor > 0 && (
                      <span className="text-[0.62rem] sm:text-[0.68rem] font-mono text-pink-500 font-semibold">
                        Total: {totalWonValor.toLocaleString('pt-BR')} won ({wonNotationFormatted})
                      </span>
                    )}
                  </div>
                  <div className="bg-white rounded-xl p-2 sm:p-2.5 border border-pink-200 max-h-32 sm:max-h-36 overflow-y-auto space-y-1 sm:space-y-1.5">
                    {cartComp.length === 0 ? (
                      <div className="text-center text-pink-300 text-[0.7rem] sm:text-xs py-2 sm:py-3 font-mono">
                        Vazio... ( ◡́.◡̀)
                      </div>
                    ) : (
                      cartComp.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center bg-pink-50/70 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[0.68rem] sm:text-xs"
                        >
                          <span className="font-medium text-[#5c4f61]">{item.nome}</span>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <strong className="text-[#f172b2]">
                              R$ {item.valor.toFixed(2).replace('.', ',')}
                            </strong>
                            <button
                              onClick={() => removeItemComp(item.id)}
                              className="bg-rose-300 hover:bg-rose-400 text-white w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[0.6rem] sm:text-[0.65rem] transition-colors cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                    <div>
                      <label className="block text-[0.68rem] sm:text-[0.72rem] font-bold text-pink-500 mb-1">
                        Taxa Fixa
                      </label>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={taxaFixaComp === 0 ? '' : taxaFixaComp}
                        placeholder="0"
                        onChange={(e) => {
                          const val = e.target.value;
                          setTaxaFixaComp(val === '' ? 0 : parseFloat(val));
                        }}
                        className="w-full p-1.5 sm:p-2 rounded-xl border border-pink-300 bg-white text-[0.7rem] sm:text-xs text-center font-bold text-[#f172b2] focus:ring-2 focus:ring-pink-300 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[0.68rem] sm:text-[0.72rem] font-bold text-pink-500 mb-1">
                        Dividir por:
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={divisaoComp}
                        placeholder="1"
                        onChange={(e) => setDivisaoComp(e.target.value.replace(/[^0-9.,]/g, ''))}
                        className="w-full p-1.5 sm:p-2 rounded-xl border border-pink-300 bg-white text-[0.7rem] sm:text-xs text-center font-bold text-[#f172b2] focus:ring-2 focus:ring-pink-300 outline-none"
                      />
                    </div>
                  </div>

                  <div className="relative mt-2.5 sm:mt-3 p-2.5 sm:p-3.5 bg-[#f172b2] rounded-2xl text-white text-center shadow-[0_4px_12px_rgba(241,114,178,0.35)] overflow-hidden">
                    <div className="absolute inset-1.5 border border-dashed border-white/60 rounded-xl pointer-events-none" />
                    <div className="text-[0.65rem] sm:text-[0.72rem] font-semibold opacity-90">TOTAL FINAL</div>
                    <div className="text-xl sm:text-2xl font-black my-0.5 tracking-tight">
                      R$ {grandTotalComp.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-[0.62rem] sm:text-[0.68rem] opacity-90 font-mono">
                      Itens: R$ {totalItemsComp.toFixed(2).replace('.', ',')} | Taxa por pessoa: R${' '}
                      {taxaPorPessoa.toFixed(2).replace('.', ',')}
                    </div>
                    {totalWonValor > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-dashed border-white/40 text-[0.62rem] sm:text-[0.68rem] text-pink-100 font-medium flex items-center justify-center gap-1">
                        <span>Total dos itens em Won:</span>
                        <span className="font-bold text-white underline decoration-white/40">
                          {totalWonValor.toLocaleString('pt-BR')} won ({wonNotationFormatted})
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={clearComp}
                    className="w-full mt-1.5 sm:mt-2 py-1.5 rounded-xl border border-rose-300 text-rose-500 hover:bg-rose-50 font-bold text-[0.7rem] sm:text-xs transition-colors cursor-pointer"
                  >
                    Limpar Tudo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= PAGE: FEEDBACKS ================= */}
          {currentPage === 'feedbacks' && (
            <div id="page-feedbacks" className="flex flex-col items-center animate-fadeIn">
              <h2 className="text-center font-black text-sm sm:text-xl text-[#f172b2] mb-2 sm:mb-3 tracking-tight">
                feedbacks
              </h2>

              <div className="bg-pink-50 border border-pink-200 text-[#f172b2] p-2 sm:p-2.5 rounded-xl text-center text-[0.7rem] sm:text-xs font-semibold mb-2.5 sm:mb-3 w-full">
                feedbacks no twitter e instagram com o{' '}
                <a
                  href="https://x.com/woongbaer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline hover:text-pink-700"
                >
                  @woongbaer
                </a>
              </div>

              {/* Feedbacks Tweet Embed Container */}
              <div className="w-full bg-white/90 border-2 border-pink-200 p-2 sm:p-4 rounded-2xl shadow-xs">
                <TwitterEmbed tweetUrl="https://twitter.com/woongbaer/status/1884014861535048096" />
              </div>
            </div>
          )}
        </div>

        {/* --- STATUS BAR (Pink Gradient with cute faces) --- */}
        <div
          id="status-bar"
          className="bg-[#f172b2] px-3 py-1 text-white text-[0.68rem] flex justify-between items-center shrink-0 select-none"
        >
          <i className="fas fa-rss opacity-85"></i>
          <div className="flex items-center gap-2 opacity-85">
            <i className="fas fa-plane"></i>
            <i className="fas fa-user"></i>
          </div>
          <div className="font-mono font-medium">( ｡ • ᴗ • ｡ ) ♡</div>
        </div>
      </div>

      {/* --- POPUP MODAL: DICIONÁRIO DE TERMOS PH --- */}
      {showDicionarioPh && (
        <div
          id="modal-dicionario-ph"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-pink-950/40 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowDicionarioPh(false)}
        >
          <div
            className="relative w-full max-w-md bg-white border-2 border-pink-300 rounded-2xl shadow-2xl p-4 sm:p-5 max-h-[85vh] flex flex-col animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-pink-200">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">🇵🇭</span>
                <h3 className="font-['Space_Mono',monospace] font-black text-xs sm:text-sm text-[#f172b2] uppercase tracking-tight">
                  dicionário de termos ph
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDicionarioPh(false)}
                className="p-1 rounded-full text-pink-400 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center text-pink-300 font-bold text-[0.65rem] my-1.5">
              . 🎀 . 📖 . 🎀 .
            </div>

            {/* Modal Content - Itens com coração e termos em negrito */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 text-[0.72rem] sm:text-xs text-justify text-[#4a3b4c]">
              <div className="flex items-start gap-1.5">
                <span className="text-pink-400 shrink-0">♥</span>
                <div>
                  <strong className="text-[#f172b2] font-bold">bns:</strong> buy and sell, venda e compra
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-pink-400 shrink-0">♥</span>
                <div>
                  <strong className="text-[#f172b2] font-bold">wts:</strong> want to sell, quero vender
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-pink-400 shrink-0">♥</span>
                <div>
                  <strong className="text-[#f172b2] font-bold">wtb:</strong> want to buy, quero comprar (são itens que a pessoa está buscando, não vendendo)
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-pink-400 shrink-0">♥</span>
                <div>
                  <strong className="text-[#f172b2] font-bold">ea:</strong> cada um, cada photocard da imagem é esse valor
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-pink-400 shrink-0">♥</span>
                <div>
                  <strong className="text-[#f172b2] font-bold">steal:</strong> se você der claim em mais de um photocard além do que já foi reservado, consegue ficar com a claim pra você
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-pink-400 shrink-0">♥</span>
                <div>
                  <strong className="text-[#f172b2] font-bold">ratio:</strong> ratio significa que pra levar aquele photocard, você precisa levar outros da imagem. se o ratio for 1:2 significa dois photocards além daquele, se o ratio for 1:1, seria um photocard além daquele
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-3.5 pt-2.5 border-t border-pink-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDicionarioPh(false)}
                className="px-4 py-1 rounded-full bg-[#f172b2] hover:bg-[#e45ea1] text-white font-['Space_Mono',monospace] text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- POPUP MODAL: CAIXA FECHADA (COREIA / JAPÃO) --- */}
      {closedBoxModal?.isOpen && (
        <div
          id="modal-caixa-fechada"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-pink-950/40 backdrop-blur-xs animate-fadeIn"
          onClick={() => setClosedBoxModal(null)}
        >
          <div
            className="relative w-full max-w-sm sm:max-w-md bg-white border-2 border-pink-300 rounded-2xl shadow-2xl p-4 sm:p-5 max-h-[85vh] flex flex-col animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-pink-200">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">
                  {closedBoxModal.country === 'coreia' ? '🇰🇷' : '🇯🇵'}
                </span>
                <h3 className="font-['Space_Mono',monospace] font-black text-xs sm:text-sm text-[#f172b2] uppercase tracking-tight">
                  {closedBoxModal.country === 'coreia' ? 'caixa fechada' : 'em breve'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setClosedBoxModal(null)}
                className="p-1 rounded-full text-pink-400 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center text-pink-300 font-bold text-[0.65rem] my-2">
              . 🎀 . {closedBoxModal.country === 'coreia' ? '🇰🇷' : '🇯🇵'} . 🎀 .
            </div>

            {/* Modal Content */}
            <div className="space-y-3 text-center my-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-pink-50 border border-pink-200 text-[#f172b2] shadow-xs">
                <span className="text-2xl">{closedBoxModal.country === 'coreia' ? '📦' : '✨'}</span>
              </div>

              <div className="space-y-1 px-2">
                <h4 className="font-black text-xs sm:text-sm text-[#f172b2] uppercase tracking-wide">
                  {closedBoxModal.country === 'coreia' ? 'caixa coreia 🇰🇷' : 'caixa japão 🇯🇵'}
                </h4>
                <div className="bg-pink-50/60 border border-pink-100 rounded-xl p-3 mt-2">
                  <p className="text-[0.78rem] sm:text-xs text-[#5a485c] leading-relaxed font-medium">
                    {closedBoxModal.country === 'coreia'
                      ? 'a caixa coreia 🇰🇷 não está aceitando pedidos. breve mais informações sobre a abertura!'
                      : 'em breve essa caixa será aberta, aguarde mais informações'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-3.5 pt-2.5 border-t border-pink-100 flex justify-end">
              <button
                type="button"
                onClick={() => setClosedBoxModal(null)}
                className="px-4 py-1 rounded-full bg-[#f172b2] hover:bg-[#e45ea1] text-white font-['Space_Mono',monospace] text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- POPUP MODAL: FORMULÁRIO (CÓDIGO DE ACESSO) --- */}
      {showFormModal && (
        <div
          id="modal-formulario-senha"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-pink-950/40 backdrop-blur-xs animate-fadeIn"
          onClick={() => {
            setShowFormModal(false);
            setFormPasscode('');
            setFormPasscodeStatus('idle');
          }}
        >
          <div
            className="relative w-full max-w-xs sm:max-w-sm bg-white border-2 border-pink-300 rounded-2xl shadow-2xl p-3.5 sm:p-4.5 max-h-[92vh] overflow-y-auto flex flex-col animate-scaleUp select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-pink-200">
              <div className="flex items-center gap-1.5">
                <h3 className="font-['Space_Mono',monospace] font-black text-xs sm:text-sm text-[#f172b2] lowercase tracking-tight flex items-center gap-1">
                  <span>ei, espera aí!</span>
                  <span className="text-xs sm:text-sm">♥</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowFormModal(false);
                  setFormPasscode('');
                  setFormPasscodeStatus('idle');
                }}
                className="p-1 rounded-full text-pink-400 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center text-[#f172b2] font-bold text-xs sm:text-sm my-1">
              ʕ•ᴥ•ʔ
            </div>

            {/* Modal Explanatory Text */}
            <div className="bg-[#fff5f8] border border-pink-200 rounded-xl p-2.5 sm:p-3 space-y-1.5 text-[0.7rem] sm:text-[0.74rem] text-[#5a485c] leading-relaxed text-left">
              <p>
                para acessar o formulário de inscrição na ceg, é preciso inserir o código passado por mim.
              </p>
              <p>
                se você já tem esse código, é só digitar no teclado abaixo. se não, me chama na dm do twitter,{' '}
                <a
                  href="https://x.com/woongbaer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline text-[#f172b2] hover:text-[#db5b9c]"
                >
                  @woongbaer
                </a>
                , ou me marca em algum tweet perguntando mais informações!
              </p>
            </div>

            {/* Passcode Display Box */}
            <div
              className={`bg-[#fff9fb] rounded-xl border border-pink-200 shadow-xs py-1.5 px-3 text-center my-2 min-h-[34px] flex items-center justify-center transition-all ${
                formPasscodeStatus === 'error' ? 'animate-shake border-rose-300 bg-rose-50/60' : ''
              } ${formPasscodeStatus === 'success' ? 'border-emerald-300 bg-emerald-50/60' : ''}`}
            >
              {formPasscodeStatus === 'error' ? (
                <span className="text-rose-400 font-bold text-xs">senha incorreta ♡</span>
              ) : formPasscodeStatus === 'success' ? (
                <span className="text-emerald-500 font-bold text-xs">desbloqueado! ✨</span>
              ) : formPasscode.length === 0 ? (
                <span className="text-pink-300 font-['Space_Mono',monospace] font-bold text-xs tracking-wider">
                  Enter Passcode
                </span>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  {[0, 1, 2, 3].map((idx) => (
                    <span
                      key={idx}
                      className={`inline-block w-2.5 h-2.5 rounded-full transition-all ${
                        idx < formPasscode.length
                          ? 'bg-[#f172b2] scale-110 shadow-xs'
                          : 'border border-pink-200 bg-pink-50/60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: '1', action: () => handleFormDigit('1') },
                { label: '2', action: () => handleFormDigit('2') },
                { label: '3', action: () => handleFormDigit('3') },
                { label: '4', action: () => handleFormDigit('4') },
                { label: '5', action: () => handleFormDigit('5') },
                { label: '6', action: () => handleFormDigit('6') },
                { label: '7', action: () => handleFormDigit('7') },
                { label: '8', action: () => handleFormDigit('8') },
                { label: '9', action: () => handleFormDigit('9') },
                {
                  label: '*',
                  action: () => {
                    if (formPasscodeStatus === 'idle') setFormPasscode('');
                  },
                  title: 'Limpar',
                },
                { label: '0', action: () => handleFormDigit('0') },
                {
                  label: '⌫',
                  action: () => {
                    if (formPasscodeStatus === 'idle') setFormPasscode((prev) => prev.slice(0, -1));
                  },
                  title: 'Apagar',
                },
              ].map((btn, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={btn.action}
                  title={btn.title}
                  className="py-1.5 sm:py-2 rounded-lg bg-white hover:bg-[#fff0f5] border border-pink-200 text-[#f172b2] font-['Space_Mono',monospace] text-xs sm:text-sm font-bold shadow-xs hover:text-[#e45ea1] active:translate-y-0.5 transition-all text-center flex items-center justify-center cursor-pointer"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="mt-2.5 pt-2 border-t border-pink-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowFormModal(false);
                  setFormPasscode('');
                  setFormPasscodeStatus('idle');
                }}
                className="px-3 py-1 rounded-full border border-pink-200 text-pink-500 hover:bg-pink-50 font-['Space_Mono',monospace] text-xs font-bold transition-colors cursor-pointer"
              >
                fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
