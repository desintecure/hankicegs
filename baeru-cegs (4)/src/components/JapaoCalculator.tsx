import React, { useState } from 'react';
import { Link as LinkIcon, Plus, ExternalLink, RefreshCw, Sparkles, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import homeIconImg from '../assets/images/home_icon.png';

interface CartItemJapao {
  id: string;
  nome: string;
  valorJpy: number;
  valorUsd: number;
  taxaCompra: number;
  taxaPagamento: number;
  totalJpy: number;
  rawTotalBrl: number;
  totalBrl: number;
  url?: string;
  image?: string;
}

interface CalcResult {
  title: string;
  image: string;
  url?: string;
  valorItemJpy: number;
  valorItemUsd: number;
  taxaCompra: number;
  taxaPagamento: number;
  subtotalJpy: number;
  totalJpy: number;
  rawTotalBrl: number;
  totalBrl: number;
}

// Arredondamento para o próximo número inteiro (sempre pra cima) + 1 real
// Exemplos do usuário: 13,34 = 15; 19,75 = 21
export const roundUpPlusOne = (rawVal: number): number => {
  if (rawVal <= 0) return 0;
  return Math.ceil(rawVal) + 1;
};

export const JapaoCalculator: React.FC = () => {
  const [mercariUrl, setMercariUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);

  // Manual input state
  const [manualMode, setManualMode] = useState<'jpy' | 'usd'>('jpy');
  const [manualVal, setManualVal] = useState<string>('');
  const [showManual, setShowManual] = useState<boolean>(false);

  // Exchange rates:
  // TreasureBox Japan uses approx 1 USD = 140~154 JPY and 1 JPY = 0.0333 BRL (593 JPY = R$ 19.75)
  const [taxaUsdJpy, setTaxaUsdJpy] = useState<number>(140);
  const [taxaJpyBrl, setTaxaJpyBrl] = useState<number>(0.0333);
  const [showTaxasConfig, setShowTaxasConfig] = useState<boolean>(false);

  // Cart state (sem taxa fixa e sem divisão por item)
  const [cart, setCart] = useState<CartItemJapao[]>([]);

  // Calculation formula logic:
  // A = valor do item
  // B = 100 ienes por pedido
  // C = valor do item em dólar X 14 ienes = valor de pagamento
  // A + B + C = valor do item total
  // Arredondamento: Math.ceil(totalBrl) + 1
  const computeBreakdown = (
    itemJpy: number,
    itemUsd: number,
    title: string = 'Item Mercari JP',
    image: string = '',
    url?: string
  ): CalcResult => {
    const B = 100; // 100 ienes por pedido
    const C = Math.round(itemUsd * 14); // C = valor em dólar X 14 ienes
    const subtotal = itemJpy + B;
    const totalJpy = subtotal + C;
    const rawTotalBrl = totalJpy * taxaJpyBrl;
    const totalBrl = roundUpPlusOne(rawTotalBrl);

    return {
      title,
      image,
      url,
      valorItemJpy: itemJpy,
      valorItemUsd: itemUsd,
      taxaCompra: B,
      taxaPagamento: C,
      subtotalJpy: subtotal,
      totalJpy: totalJpy,
      rawTotalBrl,
      totalBrl,
    };
  };

  const handleFetchMercari = async () => {
    const trimmed = mercariUrl.trim();
    if (!trimmed) {
      setErrorMsg('Por favor, cole um link do Mercari.');
      return;
    }

    // Check if it's a valid Mercari link
    if (!trimmed.includes('mercari.com')) {
      setErrorMsg('O link deve ser do Mercari Japão (ex: https://jp.mercari.com/item/...)');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setCalcResult(null);

    try {
      const response = await fetch(`/api/mercari?url=${encodeURIComponent(trimmed)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível carregar os dados do link.');
      }

      if (!data.price || isNaN(data.price)) {
        throw new Error('Não foi possível identificar o preço deste item no Mercari.');
      }

      const itemJpy = Number(data.price);
      const itemUsd = itemJpy / (taxaUsdJpy || 140);
      const result = computeBreakdown(
        itemJpy,
        itemUsd,
        data.title || 'Item Mercari JP',
        data.image || '',
        trimmed
      );

      setCalcResult(result);
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Erro ao consultar o Mercari. Você também pode digitar o valor manualmente abaixo.'
      );
      setShowManual(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCalculate = () => {
    const parsed = parseFloat(manualVal.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      setErrorMsg('Insira um valor numérico válido.');
      return;
    }

    setErrorMsg(null);

    let itemJpy = 0;
    let itemUsd = 0;

    if (manualMode === 'jpy') {
      itemJpy = Math.round(parsed);
      itemUsd = itemJpy / (taxaUsdJpy || 140);
    } else {
      itemUsd = parsed;
      itemJpy = Math.round(itemUsd * (taxaUsdJpy || 140));
    }

    const result = computeBreakdown(
      itemJpy,
      itemUsd,
      `Item Manual (${manualMode === 'jpy' ? `¥ ${itemJpy}` : `$ ${itemUsd.toFixed(2)}`})`,
      ''
    );

    setCalcResult(result);
  };

  const addToCart = () => {
    if (!calcResult) return;

    setCart((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        nome: calcResult.title,
        valorJpy: calcResult.valorItemJpy,
        valorUsd: calcResult.valorItemUsd,
        taxaCompra: calcResult.taxaCompra,
        taxaPagamento: calcResult.taxaPagamento,
        totalJpy: calcResult.totalJpy,
        rawTotalBrl: calcResult.rawTotalBrl,
        totalBrl: calcResult.totalBrl,
        url: calcResult.url,
        image: calcResult.image,
      },
    ]);

    // Clear active result
    setCalcResult(null);
    setMercariUrl('');
    setManualVal('');
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    setCart([]);
    setCalcResult(null);
    setMercariUrl('');
    setManualVal('');
    setErrorMsg(null);
  };

  // Cart summary calculations (sem taxa e sem divisão por item)
  const totalItensBrl = cart.reduce((acc, curr) => acc + curr.totalBrl, 0);
  const totalItensJpy = cart.reduce((acc, curr) => acc + curr.totalJpy, 0);

  return (
    <div className="w-full box-border font-['Poppins'] space-y-3">
      {/* ================= CARD 1: COLE O LINK DO PRODUTO (Estilo Screenshot 2) ================= */}
      <div className="bg-pink-50/70 p-3 sm:p-4 rounded-2xl border border-pink-200 shadow-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-pink-500 font-bold text-sm">Cole o link do produto</span>
        </div>
        <p className="text-[0.68rem] sm:text-xs text-[#6b586e] mb-2.5 leading-relaxed">
          Copie o link de qualquer item do <strong className="text-[#f172b2]">Mercari JP</strong> e veja o preço final já com a cotação e taxas!
        </p>

        {/* Input do link */}
        <div className="relative mb-2">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-pink-400">
            <LinkIcon className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            placeholder="https://jp.mercari.com/item/m..."
            value={mercariUrl}
            onChange={(e) => {
              setMercariUrl(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleFetchMercari();
              }
            }}
            className="w-full pl-8 pr-2.5 py-1.5 sm:py-2 rounded-xl border border-pink-300 bg-white text-[0.7rem] sm:text-xs text-[#5c4f61] focus:ring-2 focus:ring-pink-300 outline-none transition-all placeholder:text-pink-300"
          />
        </div>

        {/* Botão Calcular com Gatinho (conforme Screenshot 2) */}
        <button
          onClick={handleFetchMercari}
          disabled={isLoading}
          className="w-full py-2 sm:py-2.5 bg-[#f172b2] hover:bg-[#e45ea1] text-white font-bold text-[0.74rem] sm:text-xs rounded-xl shadow-[0_3px_10px_rgba(241,114,178,0.3)] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          <span>Calcular</span>
          <span className="text-sm">🐱</span>
        </button>

        {/* Exemplo de link clicável */}
        <div className="mt-2 text-[0.62rem] sm:text-[0.68rem] text-pink-400 flex flex-wrap items-center gap-1">
          <span>Exemplo:</span>
          <button
            type="button"
            onClick={() => setMercariUrl('https://jp.mercari.com/item/m80191492535')}
            className="font-mono text-pink-500 hover:underline hover:text-pink-600 truncate max-w-[280px] sm:max-w-[340px] text-left cursor-pointer"
          >
            https://jp.mercari.com/item/m80191492535
          </button>
        </div>

        {/* Toggle Entrada Manual */}
        <div className="mt-2.5 pt-2 border-t border-pink-200/80 flex items-center justify-between text-[0.65rem] sm:text-[0.7rem]">
          <button
            onClick={() => setShowManual(!showManual)}
            className="text-pink-500 hover:text-pink-600 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>{showManual ? '▾ Ocultar valor manual' : '▸ Ou digitar valor manualmente (¥ / $)'}</span>
          </button>
          <button
            onClick={() => setShowTaxasConfig(!showTaxasConfig)}
            className="text-pink-400 hover:text-pink-600 font-mono flex items-center gap-0.5 cursor-pointer"
            title="Ajustar cotações"
          >
            <span>cotação</span>
            {showTaxasConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Formulário de Valor Manual (Expansível) */}
        {showManual && (
          <div className="mt-2 p-2 sm:p-2.5 bg-white rounded-xl border border-pink-200 animate-fadeIn">
            <label className="block text-[0.65rem] sm:text-[0.7rem] font-bold text-pink-500 mb-1">
              ✦ Digite o valor do item:
            </label>
            <div className="flex gap-1.5 mb-1.5">
              <button
                type="button"
                onClick={() => setManualMode('jpy')}
                className={`flex-1 py-1 text-[0.65rem] sm:text-xs rounded-lg font-bold transition-all cursor-pointer ${
                  manualMode === 'jpy'
                    ? 'bg-[#f172b2] text-white shadow-xs'
                    : 'bg-pink-50 text-[#f172b2] hover:bg-pink-100'
                }`}
              >
                ¥ Ienes (JPY)
              </button>
              <button
                type="button"
                onClick={() => setManualMode('usd')}
                className={`flex-1 py-1 text-[0.65rem] sm:text-xs rounded-lg font-bold transition-all cursor-pointer ${
                  manualMode === 'usd'
                    ? 'bg-[#f172b2] text-white shadow-xs'
                    : 'bg-pink-50 text-[#f172b2] hover:bg-pink-100'
                }`}
              >
                $ Dólares (USD)
              </button>
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder={manualMode === 'jpy' ? 'Ex: 444' : 'Ex: 2.00'}
                value={manualVal}
                onChange={(e) => setManualVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleManualCalculate();
                  }
                }}
                className="flex-1 p-1.5 rounded-lg border border-pink-300 text-[0.7rem] sm:text-xs text-[#5c4f61] focus:ring-2 focus:ring-pink-300 outline-none"
              />
              <button
                onClick={handleManualCalculate}
                className="px-3 py-1.5 bg-[#f172b2] hover:bg-[#e45ea1] text-white font-bold text-[0.7rem] sm:text-xs rounded-lg shadow-xs cursor-pointer"
              >
                Calcular
              </button>
            </div>
          </div>
        )}

        {/* Configurações de Cotação (Expansível) */}
        {showTaxasConfig && (
          <div className="mt-2 p-2 sm:p-2.5 bg-pink-100/50 rounded-xl border border-pink-200 text-[0.65rem] sm:text-[0.7rem] animate-fadeIn">
            <div className="font-bold text-[#f172b2] mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-pink-400" />
              <span>Ajustes de Cotação (TreasureBox / Pix):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-pink-500 block mb-0.5">USD &gt; JPY (1 USD = X JPY):</label>
                <input
                  type="number"
                  value={taxaUsdJpy}
                  onChange={(e) => setTaxaUsdJpy(parseFloat(e.target.value) || 140)}
                  className="w-full p-1 rounded-lg border border-pink-300 bg-white font-mono text-center font-bold text-[#f172b2]"
                />
              </div>
              <div>
                <label className="text-pink-500 block mb-0.5">JPY &gt; BRL (1 JPY = R$ X):</label>
                <input
                  type="number"
                  step="0.0001"
                  value={taxaJpyBrl}
                  onChange={(e) => setTaxaJpyBrl(parseFloat(e.target.value) || 0.0333)}
                  className="w-full p-1 rounded-lg border border-pink-300 bg-white font-mono text-center font-bold text-[#f172b2]"
                />
              </div>
            </div>
            <div className="text-[0.58rem] sm:text-[0.62rem] text-pink-400 mt-1">
              Padrão: 593 ienes ≈ R$ 19,75 (taxa 0,0333 utilizada pelo Pix da TreasureBox).
            </div>
          </div>
        )}

        {/* Mensagem de Erro */}
        {errorMsg && (
          <div className="mt-2 p-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-[0.68rem] text-center">
            {errorMsg}
          </div>
        )}
      </div>

      {/* ================= ESTADO: CARREGANDO (Estilo Screenshot 2 com Mascote e Dots) ================= */}
      {isLoading && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-pink-200 shadow-xs flex flex-col items-center text-center animate-pulse">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2 relative">
            <img
              src={homeIconImg}
              alt="Mascote buscando"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-full border-2 border-pink-300 shadow-xs"
            />
          </div>
          <div className="font-bold text-[#f172b2] text-xs sm:text-sm">
            Buscando o produto no Mercari...
          </div>
          {/* Animated dots */}
          <div className="flex gap-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {/* ================= CARD 2: RESULTADO DO CÁLCULO (Estilo Screenshot 1) ================= */}
      {calcResult && (
        <div className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-pink-300 shadow-[0_4px_16px_rgba(244,114,182,0.18)] animate-fadeIn">
          {/* Header do Produto se houver imagem ou título */}
          <div className="flex items-start gap-2.5 pb-2.5 mb-2.5 border-b border-pink-100">
            {calcResult.image ? (
              <img
                src={calcResult.image}
                alt={calcResult.title}
                referrerPolicy="no-referrer"
                className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border border-pink-200 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-pink-50 rounded-xl border border-pink-200 flex items-center justify-center text-xl shrink-0">
                🇯🇵
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-[0.6rem] font-bold text-pink-400 uppercase tracking-wider">
                <span>Mercari Japan</span>
                {calcResult.url && (
                  <a
                    href={calcResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-500 hover:text-pink-700 inline-flex items-center"
                    title="Abrir no Mercari"
                  >
                    <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                  </a>
                )}
              </div>
              <h3 className="font-bold text-xs sm:text-[0.82rem] text-[#5c4f61] line-clamp-2 leading-snug mt-0.5">
                {calcResult.title}
              </h3>
              <div className="text-[0.65rem] text-pink-500 font-mono mt-0.5">
                ¥ {calcResult.valorItemJpy.toLocaleString()} (~US$ {calcResult.valorItemUsd.toFixed(2)})
              </div>
            </div>
          </div>

          {/* Tabela de Detalhamento das Taxas (idêntica ao Screenshot 1) */}
          <div className="space-y-1.5 text-[0.7rem] sm:text-xs">
            <div className="flex justify-between items-center text-[#6b586e]">
              <span>Valor unitário (A):</span>
              <span className="font-bold font-mono">¥ {calcResult.valorItemJpy.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-[#6b586e]">
              <span className="flex items-center gap-1">
                <span>Taxa de compra (B):</span>
                <span className="text-[0.6rem] text-pink-400" title="100 ienes fixos por pedido">
                  (¥100/pedido)
                </span>
              </span>
              <span className="font-bold font-mono">¥ {calcResult.taxaCompra}</span>
            </div>
            <div className="flex justify-between items-center text-[#6b586e]">
              <span>Sub Total:</span>
              <span className="font-bold font-mono">¥ {calcResult.subtotalJpy.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-[#6b586e]">
              <span className="flex items-center gap-1">
                <span>Taxa de pagamento (C):</span>
                <span className="text-[0.6rem] text-pink-400" title="Valor em dólar x 14 ienes">
                  (US$ {calcResult.valorItemUsd.toFixed(2)} × 14 ienes)
                </span>
              </span>
              <span className="font-bold font-mono">¥ {calcResult.taxaPagamento}</span>
            </div>

            {/* Linha Divisória */}
            <div className="border-t border-dashed border-pink-200 my-1" />

            <div className="flex justify-between items-center text-[#5c4f61] font-bold">
              <span>Total em Ienes (A + B + C):</span>
              <span className="font-mono text-[#f172b2]">¥ {calcResult.totalJpy.toLocaleString()}</span>
            </div>

            {/* Destaque BRL Pix com Arredondamento */}
            <div className="bg-[#fff0f6] p-2 sm:p-2.5 rounded-xl border border-pink-200 flex justify-between items-center mt-2">
              <div>
                <div className="font-black text-xs sm:text-sm text-[#f172b2]">
                  BRL (Pix Brasil):
                </div>
                <div className="text-[0.58rem] sm:text-[0.62rem] text-pink-400">
                  Arredondado (+ R$ 1,00) • Base: R$ {calcResult.rawTotalBrl.toFixed(2).replace('.', ',')}
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-sm sm:text-base text-[#f172b2] font-mono">
                  R$ {calcResult.totalBrl.toFixed(2).replace('.', ',')}
                </div>
              </div>
            </div>
          </div>

          {/* Fórmula explicativa fofa */}
          <div className="mt-2 text-[0.62rem] text-center text-pink-400 font-mono">
            {calcResult.valorItemJpy}¥ + 100¥ + {calcResult.taxaPagamento}¥ = {calcResult.totalJpy}¥
          </div>

          {/* Botão Adicionar ao Carrinho */}
          <button
            onClick={addToCart}
            className="w-full mt-2.5 py-1.5 sm:py-2 bg-[#f172b2] hover:bg-[#e45ea1] text-white font-bold text-[0.7rem] sm:text-xs rounded-xl shadow-xs active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar ao Carrinho</span>
          </button>
        </div>
      )}

      {/* ================= CARD 3: CARRINHO DE ITENS DO JAPÃO ================= */}
      <div className="bg-pink-50/70 p-2.5 sm:p-3.5 rounded-2xl border border-pink-200">
        <div className="flex items-center justify-between text-[0.7rem] sm:text-[0.75rem] font-bold text-[#f172b2] mb-1.5">
          <span>✦ Seu Carrinho Japão ({cart.length} {cart.length === 1 ? 'item' : 'itens'})</span>
          {cart.length > 0 && (
            <button
              onClick={clearAll}
              className="text-[0.65rem] text-pink-400 hover:text-pink-600 font-normal flex items-center gap-0.5 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>limpar</span>
            </button>
          )}
        </div>

        {/* Lista de itens no carrinho */}
        <div className="bg-white rounded-xl p-2 border border-pink-200 max-h-36 sm:max-h-44 overflow-y-auto space-y-1.5">
          {cart.length === 0 ? (
            <div className="text-center text-pink-300 text-[0.7rem] sm:text-xs py-3 font-mono">
              Nenhum item adicionado... ( ◡́.◡̀)
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center gap-2 bg-pink-50/70 p-1.5 sm:p-2 rounded-lg text-[0.68rem] sm:text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.nome}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 object-cover rounded-md border border-pink-200 shrink-0"
                    />
                  ) : (
                    <span className="text-xs shrink-0">🇯🇵</span>
                  )}
                  <div className="truncate">
                    <div className="font-semibold text-[#5c4f61] truncate">{item.nome}</div>
                    <div className="text-[0.6rem] text-pink-400 font-mono">
                      ¥ {item.totalJpy.toLocaleString()} (A:{item.valorJpy} + B:{item.taxaCompra} + C:{item.taxaPagamento})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <strong className="text-[#f172b2] font-mono">
                    R$ {item.totalBrl.toFixed(2).replace('.', ',')}
                  </strong>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="bg-pink-300 hover:bg-pink-400 text-white w-4 h-4 rounded-full flex items-center justify-center text-[0.55rem] transition-colors cursor-pointer"
                    title="Remover"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* TOTAL FINAL DO CARRINHO (Sem taxa e sem divisão por item) */}
        <div className="relative mt-2.5 sm:mt-3 p-2.5 sm:p-3 bg-[#f172b2] rounded-2xl text-white text-center shadow-[0_4px_12px_rgba(241,114,178,0.3)] overflow-hidden">
          <div className="absolute inset-1.5 border border-dashed border-white/60 rounded-xl pointer-events-none" />
          <div className="text-[0.65rem] sm:text-[0.7rem] font-semibold opacity-90 tracking-wider">
            TOTAL GERAL JAPÃO
          </div>
          <div className="text-xl sm:text-2xl font-black my-0.5 tracking-tight font-mono">
            R$ {totalItensBrl.toFixed(2).replace('.', ',')}
          </div>
          <div className="text-[0.6rem] sm:text-[0.65rem] opacity-90 font-mono">
            {cart.length} {cart.length === 1 ? 'item' : 'itens'} no carrinho • ¥ {totalItensJpy.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ================= BOX INFORMATIVO DA FÓRMULA ================= */}
      <div className="bg-white/80 p-2.5 rounded-xl border border-pink-200 text-[0.65rem] sm:text-[0.68rem] text-[#6b586e] space-y-1">
        <div className="font-bold text-pink-500 flex items-center gap-1">
          <span>♥ Entenda o cálculo do Mercari:</span>
        </div>
        <div>
          • <strong className="text-[#f172b2]">A = valor do item</strong> (em ienes / convertido de dólar)
        </div>
        <div>
          • <strong className="text-[#f172b2]">B = 100 ienes por pedido</strong> (taxa fixa de compra)
        </div>
        <div>
          • <strong className="text-[#f172b2]">C = valor em dólar × 14 ienes</strong> (taxa de pagamento Pix)
        </div>
        <div>
          • <strong className="text-[#f172b2]">Arredondamento</strong>: valor arredondado para cima ao próximo inteiro + R$ 1,00 (ex: 13,34 = R$ 15,00; 19,75 = R$ 21,00)
        </div>
        <div className="text-pink-500 font-mono text-[0.62rem] pt-0.5">
          Valor total = A + B + C (convertido para Reais com arredondamento)
        </div>
      </div>
    </div>
  );
};
