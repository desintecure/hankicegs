import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface CartItem {
  id: string;
  nome: string;
  valor: number;
  valorPhp: number;
}

export const FilipinasCalculator: React.FC = () => {
  const [inputPhp, setInputPhp] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [taxaFixa, setTaxaFixa] = useState<string>('8');
  const [divisao, setDivisao] = useState<string>('1');

  const addItemPhp = () => {
    const valPhp = parseFloat(inputPhp.replace(',', '.'));
    if (isNaN(valPhp) || valPhp <= 0) return;

    // Fórmula: (Valor_PHP * 0.09) + 1.00 (lucro de R$ 1,00 embutido no item)
    const valorConvertido = (valPhp * 0.09) + 1.0;

    setCart((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        nome: `Item (${valPhp} PHP)`,
        valor: valorConvertido,
        valorPhp: valPhp,
      },
    ]);
    setInputPhp('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItemPhp();
    }
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    setCart([]);
    setTaxaFixa('8');
    setDivisao('1');
    setInputPhp('');
  };

  const totalItens = cart.reduce((acc, curr) => acc + curr.valor, 0);
  const totalPhp = cart.reduce((acc, curr) => acc + (curr.valorPhp || 0), 0);
  const parsedTaxa = parseFloat(taxaFixa.replace(',', '.')) || 0;
  const parsedDivisao = parseInt(divisao, 10);
  const pessoas = isNaN(parsedDivisao) || parsedDivisao < 1 ? 1 : parsedDivisao;
  const taxaPorPessoa = parsedTaxa / pessoas;
  const totalFinal = totalItens + taxaPorPessoa;

  return (
    <div className="w-full box-border bg-pink-50/70 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-pink-200 font-['Poppins'] overflow-hidden">
      <div className="text-center font-black text-[#f172b2] text-xs sm:text-sm mb-2 sm:mb-3">
        ✦ calculadora filipinas (php &gt; brl)
      </div>

      {/* Input de Valor em PHP */}
      <div>
        <label className="block text-[0.7rem] sm:text-[0.75rem] font-bold text-[#f172b2] mb-1">
          ✦ Valor em Pesos Filipinos (PHP)
        </label>
        <div className="flex items-center gap-1.5 sm:gap-2 w-full">
          <input
            type="text"
            placeholder="Ex: 250"
            value={inputPhp}
            onChange={(e) => setInputPhp(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-0 p-1.5 sm:p-2 rounded-xl border border-pink-300 bg-white text-[0.72rem] sm:text-xs text-[#5c4f61] focus:ring-2 focus:ring-pink-300 outline-none"
          />
          <button
            onClick={addItemPhp}
            className="shrink-0 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-[#f172b2] hover:bg-[#e45ea1] text-white font-bold text-[0.7rem] sm:text-xs rounded-xl shadow-[0_3px_8px_rgba(241,114,178,0.3)] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {/* Lista do Carrinho */}
      <div className="flex justify-between items-center text-[0.7rem] sm:text-[0.75rem] font-bold text-[#f172b2] mt-2 sm:mt-3 mb-1">
        <span>✦ Seu Carrinho</span>
        {totalPhp > 0 && (
          <span className="text-[0.62rem] sm:text-[0.68rem] font-mono text-pink-500 font-semibold">
            Total: {totalPhp.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} PHP
          </span>
        )}
      </div>
      <div className="bg-white rounded-xl p-2 sm:p-2.5 border border-pink-200 max-h-28 sm:max-h-36 overflow-y-auto space-y-1">
        {cart.length === 0 ? (
          <div className="text-center text-pink-300 text-[0.7rem] sm:text-xs py-2 sm:py-3 font-mono">
            Vazio... ( ◡́.◡̀)
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center gap-1.5 bg-pink-50/70 px-2 py-1 rounded-lg text-[0.7rem] sm:text-xs"
            >
              <span className="font-medium text-[#5c4f61] truncate min-w-0">{item.nome}</span>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <strong className="text-[#f172b2] font-bold">
                  R$ {item.valor.toFixed(2).replace('.', ',')}
                </strong>
                <button
                  onClick={() => removeItem(item.id)}
                  className="bg-pink-300 hover:bg-pink-400 text-white w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[0.6rem] sm:text-[0.65rem] transition-colors cursor-pointer shrink-0"
                  title="Remover item"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Taxa Fixa e Divisão */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-2 sm:mt-3">
        <div>
          <label className="block text-[0.68rem] sm:text-[0.72rem] font-bold text-[#f172b2] mb-0.5 sm:mb-1">
            Taxa Fixa (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="8"
            value={taxaFixa}
            onChange={(e) => setTaxaFixa(e.target.value.replace(/[^0-9.,]/g, ''))}
            className="w-full p-1.5 sm:p-2 rounded-xl border border-pink-300 bg-white text-[0.72rem] sm:text-xs text-center font-bold text-[#f172b2] focus:ring-2 focus:ring-pink-300 outline-none"
          />
        </div>
        <div>
          <label className="block text-[0.68rem] sm:text-[0.72rem] font-bold text-[#f172b2] mb-0.5 sm:mb-1">
            Dividir por:
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="1"
            value={divisao}
            onChange={(e) => setDivisao(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full p-1.5 sm:p-2 rounded-xl border border-pink-300 bg-white text-[0.72rem] sm:text-xs text-center font-bold text-[#f172b2] focus:ring-2 focus:ring-pink-300 outline-none"
          />
        </div>
      </div>

      {/* Resultado do Total Final */}
      <div className="relative mt-2.5 sm:mt-3 p-2.5 sm:p-3.5 bg-[#f172b2] rounded-xl sm:rounded-2xl text-white text-center shadow-[0_4px_12px_rgba(241,114,178,0.3)] overflow-hidden">
        <div className="absolute inset-1 sm:inset-1.5 border border-dashed border-white/60 rounded-lg sm:rounded-xl pointer-events-none" />
        <div className="text-[0.68rem] sm:text-[0.72rem] font-semibold opacity-90">TOTAL FINAL</div>
        <div className="text-xl sm:text-2xl font-black my-0.5 tracking-tight">
          R$ {totalFinal.toFixed(2).replace('.', ',')}
        </div>
        <div className="text-[0.62rem] sm:text-[0.68rem] opacity-90 font-mono">
          Itens: R$ {totalItens.toFixed(2).replace('.', ',')} | Taxa por pessoa: R${' '}
          {taxaPorPessoa.toFixed(2).replace('.', ',')}
        </div>
        {totalPhp > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-dashed border-white/40 text-[0.62rem] sm:text-[0.68rem] text-pink-100 font-medium flex items-center justify-center gap-1">
            <span>Total dos itens em PHP:</span>
            <span className="font-bold text-white underline decoration-white/40">
              {totalPhp.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} PHP
            </span>
          </div>
        )}
      </div>

      {/* Botão Limpar Tudo */}
      <button
        onClick={clearAll}
        className="w-full mt-2 py-1 sm:py-1.5 rounded-xl border border-rose-300 text-rose-500 hover:bg-rose-50 font-bold text-[0.72rem] sm:text-xs transition-colors cursor-pointer"
      >
        Limpar Tudo
      </button>
    </div>
  );
};
