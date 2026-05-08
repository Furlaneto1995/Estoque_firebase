/* ================= TOAST ================= */

function mostrarToast(texto = 'Concluído', tipo = 'sucesso'){
  let div = document.createElement('div');
  div.className = 'toast toast-' + tipo;
  div.textContent = texto;
  document.body.appendChild(div);
  setTimeout(function(){
    div.classList.add('toast-saindo');
    setTimeout(function(){ if(div.parentNode) div.remove(); }, 300);
  }, 2700);
}

/* ================= AUXILIARES FORMATAÇÃO ================= */

function formatarPeso(valor) {
  return Math.round(valor).toLocaleString('pt-BR');
}

function nomeBonitoTipo(tipo){
  if(tipo === "brf") return "BRF";
  if(tipo === "tampas") return "Tampa";
  if(tipo === "laminacao") return "1ª Lam.";
  return tipo;
}

function nomeCompletoTipo(tipo){
  if(tipo === "brf") return "BRF";
  if(tipo === "tampas") return "Tampas";
  if(tipo === "laminacao") return "1ª Laminação";
  return tipo;
}

function normalizarTexto(texto){
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function descobrirTipoPorItem(item) {
  let tipoEncontrado = "";
  Object.keys(banco).forEach(tipo => {
    if (banco[tipo] && banco[tipo][item]) tipoEncontrado = tipo;
  });
  return tipoEncontrado;
}

/* ================= AUXILIARES EXCLUSÃO ================= */

function obterTipoDoIdentificador(identificador) {
  let item = identificador.split(" - V")[0];
  let tipoEncontrado = "";
  Object.keys(banco).forEach(tipo => {
    if (banco[tipo] && banco[tipo][item]) tipoEncontrado = tipo;
  });
  return tipoEncontrado;
}

function registrarExclusaoHistorico(itemChave, qtd, entradaOriginal = null) {
  historico.push({
    id: crypto.randomUUID(),
    data: new Date().toLocaleString(),
    tipo: 'Exclusão',
    item: itemChave,
    qtd: qtd,
    refEntradaId: entradaOriginal ? (entradaOriginal.id || null) : null,
    refEntradaData: entradaOriginal ? (entradaOriginal.data || null) : null
  });
}

function excluirItemDoEstoqueComHistorico(itemChave) {
  let alterou = false;
  let pesoAtual = estoque[itemChave] || 0;
  let entradasAtivas = historico.filter(h =>
    h.item === itemChave &&
    h.tipo === "Entrada" &&
    !h.consumida &&
    !h._removidaEstoque
  );
  if (entradasAtivas.length > 0) {
    entradasAtivas.forEach(h => {
      h._removidaEstoque = true;
      registrarExclusaoHistorico(itemChave, h.qtd, h);
      alterou = true;
    });
  } else if (pesoAtual > 0) {
    registrarExclusaoHistorico(itemChave, pesoAtual, null);
    alterou = true;
  }
  if (Object.prototype.hasOwnProperty.call(estoque, itemChave)) {
    delete estoque[itemChave];
    delete estoque[itemChave + '_qtd'];
    alterou = true;
  }
  return alterou;
}

function excluirEstoquePorTipoComHistorico(tipoDesejado) {
  let alterou = false;
  let chaves = Object.keys(estoque).filter(chave => !chave.endsWith('_qtd'));
  chaves.forEach(chave => {
    if (obterTipoDoIdentificador(chave) === tipoDesejado) {
      if (excluirItemDoEstoqueComHistorico(chave)) alterou = true;
    }
  });
  return alterou;
}

function excluirTodoEstoqueComHistorico() {
  let alterou = false;
  let chaves = Object.keys(estoque).filter(chave => !chave.endsWith('_qtd'));
  chaves.forEach(chave => {
    if (excluirItemDoEstoqueComHistorico(chave)) alterou = true;
  });
  return alterou;
}

/* ================= BANCO DE DADOS ================= */

const tipoSelect = document.getElementById("tipoSelect");
const itemSelect = document.getElementById("itemSelect");
const versaoSelect = document.getElementById("versaoSelect");
const saldoAtual = document.getElementById("saldoAtual");
const totalGeralLabel = document.getElementById("totalGeral");
const totalBrfLabel = document.getElementById("totalBrf");
const totalTampasLabel = document.getElementById("totalTampas");
const totalLaminacaoLabel = document.getElementById("totalLaminacao");
const barraBrf = document.getElementById("barraBrf");
const barraTampas = document.getElementById("barraTampas");
const barraLaminacao = document.getElementById("barraLaminacao");
const dataInicio = document.getElementById("dataInicio");
const dataFim = document.getElementById("dataFim");

const bancoPadrao = {
  brf: {
    "2000047": {
      "1":  { tamanho: "66 x 60" },
      "2":  { tamanho: "68.5 x 42.5" },
      "4":  { tamanho: "68.5 x 50" },
      "6":  { tamanho: "52 x 60" },
      "12": { tamanho: "75 x 42.5" },
      "14": { tamanho: "75 x 50" },
      "16": { tamanho: "74 x 42.5" },
      "20": { tamanho: "99 x 20" },
      "23": { tamanho: "65 x 78" },
      "25": { tamanho: "83 x 51" },
      "26": { tamanho: "111 x 68" },
      "27": { tamanho: "117 x 73" },
      "28": { tamanho: "87 x 35" },
      "30": { tamanho: "66 x 50" },
      "31": { tamanho: "86 x 100" },
      "33": { tamanho: "111 x 73" },
      "34": { tamanho: "67.5 x 42.5" },
      "35": { tamanho: "108 x 20" },
      "36": { tamanho: "52 x 50" },
      "37": { tamanho: "74 x 50" },
      "38": { tamanho: "83 x 38" }
    }
  },
  tampas: {
    "1503685": {
      "1": { tamanho: "69 x 78" },
      "2": { tamanho: "89 x 78" }
    },
    "1600100": {
      "1": { tamanho: "92 x 58" }
    },
    "1501826": {
      "8":  { tamanho: "83.5 x 78" },
      "2":  { tamanho: "64.5 x 78" },
      "10": { tamanho: "105 x 58" },
      "4":  { tamanho: "93 x 78" },
      "7":  { tamanho: "91.5 x 58" },
      "9":  { tamanho: "87 x 58" },
      "6":  { tamanho: "94 x 58" }
    },
    "1500767": { "3": { tamanho: "95 x 78" } },
    "1500768": { "6": { tamanho: "91.5 x 58" } },
    "1500483": { "3": { tamanho: "101 x 58" } }
  },
  laminacao: {
    "175813-4":  { "01":  { tamanho: "87.5 x 78" } },
    "168383-4":  { "02":  { tamanho: "58.5 x 76" } },
    "1121221-4": { "2.0": { tamanho: "70.5 x 37" } }
  }
};

let banco = {};

/* ================= ESTADO ================= */

let estoque = {};
let historico = [];
let etiquetasPendentes = [];

function carregarDados() {
  carregarBanco();
  estoque = JSON.parse(localStorage.getItem("estoque")) || {};
  historico = JSON.parse(localStorage.getItem("historico")) || [];

  historico.forEach(h => {
    if (h.tipo === "Entrada" && (!h.id || typeof h.id === 'number')) {
      h.id = crypto.randomUUID();
    }
  });

  if (localStorage.getItem('modoEscuro') === 'true') {
    document.body.classList.add('dark-mode');
    let toggle = document.getElementById('darkModeToggle');
    if (toggle) toggle.checked = true;
    let icone = document.getElementById('darkModeIcon');
    if (icone) icone.textContent = '☀️';
  }

  carregarPendentes();
  salvarDados();
  atualizarTabela();
  atualizarHistorico();

  // Mostrar app se já logou
  if (sessionStorage.getItem('logado') === 'true') {
    let header = document.getElementById('appHeader');
    let nav = document.getElementById('appNav');
    if (header) header.style.display = '';
    if (nav) nav.style.display = '';
  }

  // Inicia escuta do Firebase
  if (typeof escutarFirebase === 'function') {
    escutarFirebase();
  }
}

function salvarDados() {
  localStorage.setItem("estoque", JSON.stringify(estoque));
  localStorage.setItem("historico", JSON.stringify(historico));

  if (typeof salvarNoFirebase === 'function') {
    salvarNoFirebase();
  }
}

/* ================= BANCO NO LOCALSTORAGE ================= */

function carregarBanco() {
  let salvo = localStorage.getItem("bancoCustom");
  if (salvo) {
    banco = JSON.parse(salvo);
  } else {
    banco = JSON.parse(JSON.stringify(bancoPadrao));
    localStorage.setItem("bancoCustom", JSON.stringify(banco));
  }
}

function salvarBanco() {
  localStorage.setItem("bancoCustom", JSON.stringify(banco));
}

let ultimoItem = null;

let ordemEstoque = { coluna: null, asc: true };
let filtroTipoEstoque = 0;
let filtroTipoHistorico = 0;
let ordemHistorico = { coluna: null, estado: 'none' };
let filtroMovimentacao = 0;

document.addEventListener("DOMContentLoaded", function () {
  carregarDados();
  let modalGer = document.getElementById('modalGerador');
  if (modalGer) modalGer.classList.add('hidden');
  document.getElementById('modalPendentes').classList.add('hidden');
  document.querySelector('.nav-top').classList.remove('hidden');
  document.querySelector('.top-header').classList.remove('hidden');
  mostrarTela('movimentar');
});

/* ================= NAVEGAÇÃO ================= */

window.mostrarTela = function(t){
  document.getElementById("movimentar").classList.add("hidden");
  document.getElementById("estoque").classList.add("hidden");
  document.getElementById("historico").classList.add("hidden");
  document.getElementById("detalhesTipo").classList.add("hidden");

  let gerador = document.getElementById("modalGerador");
  if (gerador) gerador.classList.add("hidden");

  let tela = document.getElementById(t);
  if (tela) tela.classList.remove("hidden");

  document.querySelectorAll('.nav-top button').forEach(btn => btn.classList.remove('ativo'));
  let btnTela = document.querySelector(`.nav-top button[onclick="mostrarTela('${t}')"]`);
  if (btnTela) btnTela.classList.add('ativo');

  const btnExpandir = document.getElementById("btnExpandir");
  if (btnExpandir) {
    if (t === "movimentar" || t === "geradorEtiquetas") {
      btnExpandir.style.visibility = "hidden";
      btnExpandir.style.pointerEvents = "none";
    } else {
      btnExpandir.style.visibility = "visible";
      btnExpandir.style.pointerEvents = "auto";
    }
  }

  atualizarTabela();
  atualizarHistorico();
};

/* ================= FILTRO POR TIPO ================= */

function filtrarPorTipo(){
  itemSelect.innerHTML='<option value="">Selecionar item</option>';
  versaoSelect.innerHTML='<option value="">Selecionar versão</option>';
  let tipo = tipoSelect.value;
  if(!banco[tipo]) return;
  Object.keys(banco[tipo]).forEach(item=>{
    let opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    itemSelect.appendChild(opt);
  });
}

itemSelect.addEventListener("change", function(){
  versaoSelect.innerHTML = '<option value="">Selecionar versão</option>';
  let tipo = tipoSelect.value;
  let item = itemSelect.value;
  if(!banco[tipo] || !banco[tipo][item]) return;
  Object.keys(banco[tipo][item]).forEach(v => {
    let tamanho = banco[tipo][item][v].tamanho;
    let opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v + " (" + tamanho + ")";
    versaoSelect.appendChild(opt);
  });
  if (saldoAtual) saldoAtual.innerHTML = "";
});

function atualizarSaldoAtual(item, versao){
  if(!item || !versao){
    if(saldoAtual) saldoAtual.innerHTML = "";
    return;
  }
  let identificador = item + " - V" + versao;
  let saldo = estoque[identificador] || 0;
  if(saldoAtual) saldoAtual.innerHTML = "Saldo atual: <strong>" + formatarPeso(saldo) + " kg</strong>";
}

versaoSelect.addEventListener("change", function(){
  let tipo = tipoSelect.value;
  let item = itemSelect.value;
  let versao = versaoSelect.value;
  if(versao !== ""){
    atualizarSaldoAtual(item, versao);
    let tamanho = "";
    if (banco[tipo] && banco[tipo][item] && banco[tipo][item][versao]) {
      tamanho = banco[tipo][item][versao].tamanho;
    }
    document.getElementById('buscaItem').value = item + " - V" + versao + " (" + tamanho + ")";
    quantidade.focus();
  } else {
    if (saldoAtual) saldoAtual.innerHTML = "";
    document.getElementById('buscaItem').value = '';
  }
});

/* ================= BUSCA MANUAL ================= */

function filtrar(){
  let termo = buscaItem.value.toLowerCase();
  sugestoes.innerHTML = '';
  if(!termo){ sugestoes.classList.add('hidden'); return; }
  Object.keys(banco).forEach(tipo => {
    Object.keys(banco[tipo]).forEach(item => {
      Object.keys(banco[tipo][item]).forEach(versao => {
        let tamanho = banco[tipo][item][versao].tamanho;
        let textoCompleto = item + " - V" + versao + " (" + tamanho + ")";
        if(textoCompleto.toLowerCase().includes(termo)){
          let d = document.createElement('div');
          d.textContent = textoCompleto;
          d.onclick = function(){
            tipoSelect.value = tipo;
            filtrarPorTipo();
            itemSelect.value = item;
            itemSelect.dispatchEvent(new Event("change"));
            versaoSelect.value = versao;
            atualizarSaldoAtual(item, versao);
            buscaItem.value = textoCompleto;
            sugestoes.classList.add('hidden');
            quantidade.focus();
          };
          sugestoes.appendChild(d);
        }
      });
    });
  });
  sugestoes.classList.remove('hidden');
}

function limparBusca(){
  buscaItem.value = '';
  sugestoes.innerHTML = '';
  sugestoes.classList.add('hidden');
  tipoSelect.value = '';
  itemSelect.innerHTML = '<option value="">Selecionar item</option>';
  versaoSelect.innerHTML = '<option value="">Selecionar versão</option>';
  quantidade.value = '';
  document.getElementById('buscaItem').value = '';
  if(saldoAtual) saldoAtual.innerHTML = "";
}

/* ================= REPETIR ÚLTIMO ================= */

function usarUltimo(){
  if(!ultimoItem){ mostrarToast('Nenhum item recente', 'erro'); return; }
  if(!ultimoItem.includes(" - V")){ mostrarToast('Último item sem versão registrada', 'erro'); return; }
  let partes = ultimoItem.split(" - V");
  let item = partes[0];
  let versao = partes[1];
  let tipoEncontrado = null;
  Object.keys(banco).forEach(tipo => { if(banco[tipo][item]) tipoEncontrado = tipo; });
  if(!tipoEncontrado){ mostrarToast('Item não encontrado no banco', 'erro'); return; }
  tipoSelect.value = tipoEncontrado;
  filtrarPorTipo();
  itemSelect.value = item;
  versaoSelect.innerHTML = '<option value="">Selecionar versão</option>';
  Object.keys(banco[tipoEncontrado][item]).forEach(v => {
    let tamanho = banco[tipoEncontrado][item][v].tamanho;
    let opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v + " (" + tamanho + ")";
    versaoSelect.appendChild(opt);
  });
  versaoSelect.value = versao;
  let identificador = item + " - V" + versao;
  let saldo = estoque[identificador] || 0;
  if(saldoAtual) saldoAtual.innerHTML = "Saldo atual: <strong>" + formatarPeso(saldo) + " kg</strong>";
  let tamanho = "";
  if (banco[tipoEncontrado][item] && banco[tipoEncontrado][item][versao]) {
    tamanho = banco[tipoEncontrado][item][versao].tamanho;
  }
  document.getElementById('buscaItem').value = item + " - V" + versao + " (" + tamanho + ")";
  quantidade.value = '';
  quantidade.focus();
}

/* ================= MOVIMENTAÇÃO ================= */

function movimentar(tipoMov){
  let tipo = tipoSelect.value;
  let item = itemSelect.value;
  let versao = versaoSelect.value;
  let faltando = [];
  if(!tipo) faltando.push("tipo");
  if(!item) faltando.push("item");
  if(!versao) faltando.push("versão");
  if(faltando.length > 0){ mostrarToast("Insira: " + faltando.join(", "), 'erro'); return; }
  let qtd = parseFloat(quantidade.value);
  if(!qtd){ mostrarToast("Informe o peso", 'erro'); return; }
  let identificador = item + " - V" + versao;
  if(!estoque[identificador]) estoque[identificador] = 0;

  salvarEstadoParaDesfazer();

  if(tipoMov === 'remove'){
    if(!estoque[identificador] || estoque[identificador] <= 0){ mostrarToast("Sem saldo disponível", 'erro'); return; }
    abrirModalSaida(identificador, qtd);
    return;
  } else {
    estoque[identificador] += qtd;
    if (!estoque[identificador + '_qtd']) estoque[identificador + '_qtd'] = 0;
    estoque[identificador + '_qtd']++;
  }

  historico.push({
    id: crypto.randomUUID(),
    data: new Date().toLocaleString(),
    tipo: tipoMov === 'add' ? 'Entrada' : 'Saída',
    item: identificador,
    qtd: qtd
  });

  ultimoItem = identificador;
  salvarDados();
  atualizarTabela();
  atualizarHistorico();

  tipoSelect.value = '';
  itemSelect.innerHTML = '<option value="">Selecionar item</option>';
  versaoSelect.innerHTML = '<option value="">Selecionar versão</option>';
  quantidade.value = '';
  document.getElementById('buscaItem').value = '';
  sugestoes.innerHTML = '';
  sugestoes.classList.add('hidden');
  if(saldoAtual) saldoAtual.innerHTML = "";

  if (navigator.vibrate) navigator.vibrate([100]);
  mostrarToast(identificador + (tipoMov === 'add' ? " adicionado" : " removido"));
}

/* ================= ESTOQUE ================= */

function ordenarEstoque(coluna) {
  if (coluna === 'tipo') {
    filtroTipoEstoque++;
    if (filtroTipoEstoque > 3) filtroTipoEstoque = 0;
    let thTipo = document.querySelector('#estoque thead th[onclick="ordenarEstoque(\'tipo\')"]');
    if (thTipo) {
      let letras = ['', 'B', 'T', '1ª'];
      thTipo.innerHTML = 'Tipo<span class="sort-arrow">' + (letras[filtroTipoEstoque] ? ' (' + letras[filtroTipoEstoque] + ')' : '') + '</span>';
    }
    atualizarTabela();
    return;
  }
  if (ordemEstoque.coluna === coluna) { ordemEstoque.asc = !ordemEstoque.asc; }
  else { ordemEstoque.coluna = coluna; ordemEstoque.asc = true; }
  document.querySelectorAll('#estoque thead th.sortable').forEach(th => {
    if (!th.getAttribute('onclick').includes('tipo')) {
      th.classList.remove('asc', 'desc', 'none');
      th.classList.add('none');
    }
  });
  const thAtivo = document.querySelector(`#estoque thead th[onclick="ordenarEstoque('${coluna}')"]`);
  if (thAtivo) { thAtivo.classList.remove('none'); thAtivo.classList.add(ordemEstoque.asc ? 'asc' : 'desc'); }
  atualizarTabela();
}

function atualizarTabela(){
  const tabela = document.getElementById('tabela');
  tabela.innerHTML='';
  let termo = document.getElementById('buscaEstoque').value.toLowerCase();
  let pesoTotal = 0, totalBrf = 0, totalTampas = 0, totalLaminacao = 0;

  let dados = Object.keys(estoque)
    .filter(i => !i.endsWith('_qtd'))
    .map(i => {
      let partes = i.split(" - ");
      if (partes.length < 2) return null;
      let item = partes[0];
      let versao = partes[1].replace("V", "").trim();
      let tipoEncontrado = "";
      Object.keys(banco).forEach(tipo => { if (banco[tipo] && banco[tipo][item]) tipoEncontrado = tipo; });
      if (!banco[tipoEncontrado] || !banco[tipoEncontrado][item] || !banco[tipoEncontrado][item][versao]) return null;
      let tamanho = banco[tipoEncontrado][item][versao].tamanho;
      let peso = estoque[i];
      let quantidadeEntradas = estoque[i + '_qtd'] || 0;
      if (quantidadeEntradas === 0 && estoque[i] > 0) {
        let entradasItem = historico.filter(h => h.item === i && h.tipo === "Entrada" && !h.consumida && !h._removidaEstoque);
        let somaTemp = 0;
        for (let idx = entradasItem.length - 1; idx >= 0; idx--) {
          if (somaTemp >= estoque[i]) break;
          somaTemp += entradasItem[idx].qtd;
          quantidadeEntradas++;
        }
        if (quantidadeEntradas === 0) quantidadeEntradas = 1;
      }
      pesoTotal += peso;
      if (tipoEncontrado === "brf") totalBrf += peso;
      if (tipoEncontrado === "tampas") totalTampas += peso;
      if (tipoEncontrado === "laminacao") totalLaminacao += peso;
      return { identificador: i, tipo: tipoEncontrado, item, versao, tamanho, peso, qtdEntradas: quantidadeEntradas };
    })
    .filter(d => d !== null)
    .filter(d => `${d.tipo} ${d.item} ${d.versao} ${d.tamanho} ${d.peso}`.toLowerCase().includes(termo));

  if (filtroTipoEstoque > 0) {
    let prioridades = [null, 'brf', 'tampas', 'laminacao'];
    let tipoPrioritario = prioridades[filtroTipoEstoque];
    dados.sort((a, b) => {
      let aPri = (a.tipo === tipoPrioritario) ? 0 : 1;
      let bPri = (b.tipo === tipoPrioritario) ? 0 : 1;
      if (aPri !== bPri) return aPri - bPri;
      let ordem = { 'brf': 1, 'tampas': 2, 'laminacao': 3 };
      return (ordem[a.tipo] || 4) - (ordem[b.tipo] || 4);
    });
  }

  if(ordemEstoque.coluna){
    dados.sort((a,b)=>{
      let v1 = a[ordemEstoque.coluna], v2 = b[ordemEstoque.coluna];
      if(ordemEstoque.coluna === "tamanho"){
        let p1 = v1.split(" x "), p2 = v2.split(" x ");
        let l1 = parseFloat(p1[0]), l2 = parseFloat(p2[0]);
        let a1 = parseFloat(p1[1]), a2 = parseFloat(p2[1]);
        if(l1 !== l2) return ordemEstoque.asc ? l1-l2 : l2-l1;
        return ordemEstoque.asc ? a1-a2 : a2-a1;
      }
      if (ordemEstoque.coluna === "peso" || ordemEstoque.coluna === "qtdEntradas") { v1 = Number(v1); v2 = Number(v2); }
      else { if (typeof v1==="string") v1=v1.toLowerCase(); if (typeof v2==="string") v2=v2.toLowerCase(); }
      if (v1>v2) return ordemEstoque.asc?1:-1;
      if (v1<v2) return ordemEstoque.asc?-1:1;
      return 0;
    });
  }

  if(totalGeralLabel) totalGeralLabel.innerHTML = formatarPeso(pesoTotal) + " kg";
  let totalBobinasLabel = document.getElementById("totalBobinas");
  let totalBobinasCount = dados.reduce((acc, d) => acc + d.qtdEntradas, 0);
  if(totalBobinasLabel) totalBobinasLabel.textContent = totalBobinasCount + " bobinas";
  if(totalBrfLabel) totalBrfLabel.innerHTML = formatarPeso(totalBrf) + " kg";
  if(totalTampasLabel) totalTampasLabel.innerHTML = formatarPeso(totalTampas) + " kg";
  if(totalLaminacaoLabel) totalLaminacaoLabel.innerHTML = formatarPeso(totalLaminacao) + " kg";

  let percBrf = pesoTotal ? (totalBrf/pesoTotal)*100 : 0;
  let percTampas = pesoTotal ? (totalTampas/pesoTotal)*100 : 0;
  let percLaminacao = pesoTotal ? (totalLaminacao/pesoTotal)*100 : 0;

  function atualizarBarra(barra, percentual) {
    let valor = Math.round(percentual);
    if (valor === 0) { barra.style.width="0%"; barra.textContent=""; barra.style.paddingLeft="0"; return; }
    barra.style.width = valor+"%"; barra.textContent = valor+"%"; barra.style.paddingLeft = "6px";
  }

  if (barraBrf) atualizarBarra(barraBrf, percBrf);
  if (barraTampas) atualizarBarra(barraTampas, percTampas);
  if (barraLaminacao) atualizarBarra(barraLaminacao, percLaminacao);

  let html = '';
  dados.forEach(d=>{
    html += `
      <tr>
        <td>${nomeBonitoTipo(d.tipo)}</td>
        <td>${d.item}</td>
        <td>${d.versao}</td>
        <td>${d.tamanho}</td>
        <td>${d.peso}</td>
        <td>${d.qtdEntradas}</td>
        <td><button class='btn-remove' onclick="remover('${d.identificador}')">🗑</button></td>
      </tr>
    `;
  });
  tabela.innerHTML = html;
}

function remover(item){
  if(!confirm("Tem certeza que deseja remover este item do estoque?")) return;

  salvarEstadoParaDesfazer();

  let entradasParaExcluir = historico.filter(h =>
    h.item === item && h.tipo === "Entrada" && !h.consumida && !h._removidaEstoque
  );

  entradasParaExcluir.forEach(h => {
    h._removidaEstoque = true;
    historico.push({
      id: crypto.randomUUID(),
      data: new Date().toLocaleString(),
      tipo: 'Exclusão',
      item: item,
      qtd: h.qtd,
      refEntradaId: h.id || null,
      refEntradaData: h.data || null
    });
  });

  delete estoque[item];
  delete estoque[item + '_qtd'];

  salvarDados();
  atualizarTabela();
  atualizarHistorico();

  mostrarToast('Item removido');
}

/* ================= HISTÓRICO ================= */

function ordenarHistorico(coluna) {
  if (coluna === 'tipo') {
    filtroTipoHistorico++;
    if (filtroTipoHistorico > 3) filtroTipoHistorico = 0;
    let thTipo = document.querySelector('#historico thead th[onclick="ordenarHistorico(\'tipo\')"]');
    if (thTipo) {
      let letras = ['', 'B', 'T', '1ª'];
      thTipo.innerHTML = 'Tipo<span class="sort-arrow">' + (letras[filtroTipoHistorico] ? ' (' + letras[filtroTipoHistorico] + ')' : '') + '</span>';
    }
    atualizarHistorico();
    return;
  }
  if (coluna === 'movimentacao') {
    filtroMovimentacao++;
    if (filtroMovimentacao > 4) filtroMovimentacao = 0;
    let thMov = document.querySelector('#historico thead th[onclick="ordenarHistorico(\'movimentacao\')"]');
    if (thMov) {
      let letras = ['', 'E', 'S', 'C', 'P'];
      thMov.innerHTML = 'Mov.<span class="sort-arrow">' + (letras[filtroMovimentacao] ? ' (' + letras[filtroMovimentacao] + ')' : '') + '</span>';
    }
    atualizarHistorico();
    return;
  }
  if (ordemHistorico.coluna === coluna) {
    if (ordemHistorico.estado === 'none') ordemHistorico.estado = 'asc';
    else if (ordemHistorico.estado === 'asc') ordemHistorico.estado = 'desc';
    else { ordemHistorico.estado = 'none'; ordemHistorico.coluna = null; }
  } else { ordemHistorico.coluna = coluna; ordemHistorico.estado = 'asc'; }

  document.querySelectorAll('#historico thead th.sortable').forEach(th => {
    if (!th.getAttribute('onclick').includes('movimentacao')) {
      th.classList.remove('asc', 'desc', 'none');
      th.classList.add('none');
    }
  });
  if (ordemHistorico.coluna) {
    const thAtivo = document.querySelector(`#historico thead th[onclick="ordenarHistorico('${coluna}')"]`);
    if (thAtivo) { thAtivo.classList.remove('none'); thAtivo.classList.add(ordemHistorico.estado); }
  }
  atualizarHistorico();
}

function atualizarHistorico(){
  const historicoTabela = document.getElementById('historicoTabela');
  historicoTabela.innerHTML = '';
  let termo = normalizarTexto(document.getElementById('buscaHistorico').value);

  let dados = historico.map(h => {
    let partes = h.item.split(" - V");
    if (partes.length < 2) return null;
    let item = partes[0], versao = partes[1];
    let tipoEncontrado = "";
    Object.keys(banco).forEach(tipo => { if(banco[tipo][item]) tipoEncontrado = tipo; });
    let tamanho = "";
    if (banco[tipoEncontrado] && banco[tipoEncontrado][item] && banco[tipoEncontrado][item][versao]) {
      tamanho = banco[tipoEncontrado][item][versao].tamanho;
    }
    return { original: h, data: h.data.replace(", ", "<br>"), movimentacao: h.tipo, tipo: tipoEncontrado, item, versao, tamanho, qtd: h.qtd };
  }).filter(d => {
    if (!d) return false;
    let termosMovimento = [d.original.tipo || '', d.movimentacao || ''];
    if (d.original.tipo === 'Entrada') {
      termosMovimento.push('entrada');
      if (d.original.consumida) termosMovimento.push('entrada consumida', 'consumida', 'consumo');
      if (d.original._removidaEstoque || d.original.excluida) termosMovimento.push('entrada excluida', 'excluida', 'exclusao', 'exclusão');
    }
    if (d.original.tipo === 'Consumo') termosMovimento.push('consumo', 'consumida');
    if (d.original.tipo === 'Consumo parcial') termosMovimento.push('consumo parcial', 'cons parcial', 'parcial');
    if (d.original.tipo === 'Exclusão') termosMovimento.push('exclusao', 'exclusão', 'excluida', 'excluída');
    if (d.original.tipo === 'Saída') {
      termosMovimento.push('saida', 'saída');
      if (d.original.consumida) termosMovimento.push('consumo', 'consumida');
      if (d.original.excluida) termosMovimento.push('exclusao', 'exclusão', 'excluida', 'excluída');
    }
    let textoCompleto = normalizarTexto(`${d.data} ${termosMovimento.join(' ')} ${nomeBonitoTipo(d.tipo)} ${d.item} ${d.versao} ${d.tamanho} ${d.qtd}`);
    let matchesBusca = textoCompleto.includes(termo);
    let dataISO = d.data.split(",")[0].split("/").reverse().join("-");
    let matchesPeriodo = true;
    if(dataInicio && dataInicio.value) matchesPeriodo = matchesPeriodo && (dataISO >= dataInicio.value);
    if(dataFim && dataFim.value) matchesPeriodo = matchesPeriodo && (dataISO <= dataFim.value);
    return matchesBusca && matchesPeriodo;
  });

  dados.reverse();

  if (filtroTipoHistorico > 0) {
    let prioridades = [null, 'brf', 'tampas', 'laminacao'];
    let tipoPrioritario = prioridades[filtroTipoHistorico];
    dados.sort((a, b) => {
      let aPri = (a.tipo === tipoPrioritario) ? 0 : 1;
      let bPri = (b.tipo === tipoPrioritario) ? 0 : 1;
      if (aPri !== bPri) return aPri - bPri;
      let ordem = { 'brf': 1, 'tampas': 2, 'laminacao': 3 };
      return (ordem[a.tipo] || 4) - (ordem[b.tipo] || 4);
    });
  }

  if (filtroMovimentacao > 0) {
    let ordemMov = { 'Entrada': 1, 'Saída': 2, 'Consumida': 3, 'Consumo parcial': 4 };
    let prioridades = [null, 'Entrada', 'Saída', 'Consumida', 'Consumo parcial'];
    let tipoPrioritario = prioridades[filtroMovimentacao];
    dados.sort((a, b) => {
      let tipoA = a.original.tipo, tipoB = b.original.tipo;
      if (a.original.consumida && tipoA !== 'Consumo parcial') tipoA = 'Consumida';
      if (b.original.consumida && tipoB !== 'Consumo parcial') tipoB = 'Consumida';
      let aPrioritario = (tipoA === tipoPrioritario) ? 0 : 1;
      let bPrioritario = (tipoB === tipoPrioritario) ? 0 : 1;
      if (aPrioritario !== bPrioritario) return aPrioritario - bPrioritario;
      return (ordemMov[tipoA] || 5) - (ordemMov[tipoB] || 5);
    });
  }

  if (ordemHistorico.coluna && ordemHistorico.estado !== 'none') {
    const asc = ordemHistorico.estado === 'asc';
    dados.sort((a, b) => {
      let v1 = a[ordemHistorico.coluna], v2 = b[ordemHistorico.coluna];
      if (ordemHistorico.coluna === 'movimentacao') {
        const ordem = { 'Entrada': 1, 'Saída': 2, 'Consumida': 3, 'Consumo parcial': 4 };
        let o1 = ordem[a.original.consumida ? 'Consumida' : a.original.tipo] || 5;
        let o2 = ordem[b.original.consumida ? 'Consumida' : b.original.tipo] || 5;
        if (a.original.tipo === 'Consumo parcial') o1 = ordem['Consumo parcial'];
        if (b.original.tipo === 'Consumo parcial') o2 = ordem['Consumo parcial'];
        if (o1 !== o2) return asc ? o1-o2 : o2-o1;
        return 0;
      }
      if (ordemHistorico.coluna === 'tamanho') {
        let p1=v1.split(" x "), p2=v2.split(" x ");
        let l1=parseFloat(p1[0]), l2=parseFloat(p2[0]), a1=parseFloat(p1[1]), a2=parseFloat(p2[1]);
        if (l1!==l2) return asc?l1-l2:l2-l1;
        return asc?a1-a2:a2-a1;
      }
      if (ordemHistorico.coluna === 'qtd') { v1=Number(v1); v2=Number(v2); }
      else { v1=String(v1).toLowerCase(); v2=String(v2).toLowerCase(); }
      if (v1>v2) return asc?1:-1;
      if (v1<v2) return asc?-1:1;
      return 0;
    });
  }

  let html = '';
  dados.forEach(d => {
    let indexReal = historico.indexOf(d.original);
    let corLinha = '', movTexto = '', refTexto = '';

    function montarRef(refData) {
      if (!refData) return '';
      let partes = refData.split(", ");
      return `<span class="ref-texto">ref: ${partes[0] || ''}<br>${partes[1] || ''}</span>`;
    }

    switch (d.original.tipo) {
      case 'Entrada':
        corLinha = 'linha-entrada';
        movTexto = 'Entrada';
        if (d.original.consumida) movTexto += `<span class="entrada-status">(consumida)</span>`;
        else if (d.original._removidaEstoque || d.original.excluida) movTexto += `<span class="entrada-status">(excluída)</span>`;
        break;
      case 'Consumo':
        corLinha = 'linha-consumida';
        movTexto = 'Consumo';
        refTexto = montarRef(d.original.refEntradaData);
        break;
      case 'Consumo parcial':
        corLinha = 'linha-consumo-parcial';
        movTexto = 'Cons. parcial';
        refTexto = montarRef(d.original.refEntradaData);
        break;
      case 'Exclusão':
        corLinha = 'linha-excluida';
        movTexto = 'Exclusão';
        refTexto = montarRef(d.original.refEntradaData);
        break;
      case 'Saída':
      default:
        corLinha = 'linha-saida';
        movTexto = 'Saída';
        if (d.original.consumida) { corLinha = 'linha-consumida'; movTexto = 'Consumo'; }
        else if (d.original.excluida) {
          corLinha = 'linha-excluida';
          movTexto = 'Exclusão';
          if (d.original.bobinaOriginalId) {
            let refOriginal = historico.find(h => h.id === d.original.bobinaOriginalId && h.tipo === "Entrada");
            if (refOriginal) refTexto = montarRef(refOriginal.data);
          }
        }
        break;
    }

    html += `
      <tr class="${corLinha}">
        <td>${d.data}</td>
        <td>${movTexto}${refTexto}</td>
        <td>${nomeBonitoTipo(d.tipo)}</td>
        <td>${d.item}<br><strong>V ${d.versao}</strong><br><span style="font-size:11px;">${d.tamanho}</span></td>
        <td>${d.original.qtdOriginal ? Math.round(d.qtd)+'/'+Math.round(d.original.qtdOriginal) : d.qtd}</td>
        <td><button class='btn-menu-historico' onclick="abrirAcoesHistorico(${indexReal})">⋮</button></td>
      </tr>
    `;
  });
  historicoTabela.innerHTML = html;
}

/* ================= EXPORTAÇÃO EXCEL ================= */

function getTimestamp(){
  const agora = new Date();
  return agora.getFullYear() + "-" + String(agora.getMonth()+1).padStart(2,"0") + "-" + String(agora.getDate()).padStart(2,"0") + "_" + String(agora.getHours()).padStart(2,"0") + "-" + String(agora.getMinutes()).padStart(2,"0");
}

function exportarEstoque(dataInicioP, dataFimP) {
  const wb = XLSX.utils.book_new();
  let dadosEstoque = [];
  let totalGeral = 0, totalBobinasGeral = 0;
  let totaisPorTipo = {};

  Object.keys(estoque).forEach(chave => {
    if (chave.endsWith('_qtd')) return;
    let partes = chave.split(" - V");
    if (partes.length < 2) return;
    let item = partes[0], versao = partes[1];
    let tipoInterno = "";
    Object.keys(banco).forEach(tipo => { if (banco[tipo][item]) tipoInterno = tipo; });
    if (!banco[tipoInterno] || !banco[tipoInterno][item] || !banco[tipoInterno][item][versao]) return;
    let tamanho = banco[tipoInterno][item][versao].tamanho;
    let peso = estoque[chave];
    let qtdBobinas = estoque[chave + '_qtd'] || 0;
    if (qtdBobinas === 0 && peso > 0) {
      let entradasItem = historico.filter(h => h.item === chave && h.tipo === "Entrada" && !h.consumida && !h._removidaEstoque);
      let soma = 0;
      for (let idx = entradasItem.length - 1; idx >= 0; idx--) {
        if (soma >= peso) break;
        soma += entradasItem[idx].qtd;
        qtdBobinas++;
      }
      if (qtdBobinas === 0) qtdBobinas = 1;
    }
    let nomeT = nomeCompletoTipo(tipoInterno);
    totalGeral += peso;
    totalBobinasGeral += qtdBobinas;
    if (!totaisPorTipo[nomeT]) totaisPorTipo[nomeT] = { kg: 0, bobinas: 0 };
    totaisPorTipo[nomeT].kg += peso;
    totaisPorTipo[nomeT].bobinas += qtdBobinas;
    dadosEstoque.push({ Tipo: nomeBonitoTipo(tipoInterno), Item: item, Versão: versao, Medidas: tamanho, Kg: peso, Bobinas: qtdBobinas });
  });

  if (dadosEstoque.length === 0) { mostrarToast("Estoque vazio", "erro"); return; }

  let ordemTipo = { 'BRF': 1, 'Tampa': 2, '1ª Lam.': 3 };
  dadosEstoque.sort((a, b) => (ordemTipo[a.Tipo] || 99) - (ordemTipo[b.Tipo] || 99));

  let linhas = [];
  linhas.push(['CONFERÊNCIA DE ESTOQUES', '', '', '', '', '']);
  linhas.push(['Data do relatório:', new Date().toLocaleString('pt-BR'), '', '', '', '']);
  linhas.push(['', '', '', '', '', '']);
  linhas.push(['RESUMO GERAL', '', '', '', '', '']);
  linhas.push(['Total em estoque:', '', '', '', formatarPeso(totalGeral) + ' kg', totalBobinasGeral + ' bobinas']);
  linhas.push(['', '', '', '', '', '']);
  linhas.push(['RESUMO POR TIPO', '', '', '', '', '']);
  linhas.push(['Tipo', '', '', '', 'Kg', 'Bobinas']);

  ['BRF', 'Tampas', '1ª Laminação'].forEach(nomeT => {
    if (totaisPorTipo[nomeT]) {
      let perc = totalGeral > 0 ? Math.round((totaisPorTipo[nomeT].kg / totalGeral) * 100) : 0;
      linhas.push([nomeT, '', '', perc + '%', formatarPeso(totaisPorTipo[nomeT].kg) + ' kg', totaisPorTipo[nomeT].bobinas + ' bobinas']);
    }
  });

  linhas.push(['', '', '', '', '', '']);
  linhas.push(['', '', '', '', '', '']);
  linhas.push(['DETALHAMENTO', '', '', '', '', '']);
  linhas.push(['Tipo', 'Item', 'Versão', 'Medidas', 'Kg', 'Bobinas']);

  let tipoAtual = '', subtotalKg = 0, subtotalBob = 0;
  dadosEstoque.forEach((d, idx) => {
    if (tipoAtual && d.Tipo !== tipoAtual) {
      linhas.push(['', '', '', 'Subtotal ' + tipoAtual + ':', subtotalKg + ' kg', subtotalBob + ' bobinas']);
      linhas.push(['', '', '', '', '', '']);
      subtotalKg = 0; subtotalBob = 0;
    }
    tipoAtual = d.Tipo;
    subtotalKg += d.Kg;
    subtotalBob += d.Bobinas;
    linhas.push([d.Tipo, d.Item, d.Versão, d.Medidas, d.Kg, d.Bobinas]);
    if (idx === dadosEstoque.length - 1) {
      linhas.push(['', '', '', 'Subtotal ' + tipoAtual + ':', subtotalKg + ' kg', subtotalBob + ' bobinas']);
    }
  });

  linhas.push(['', '', '', '', '', '']);
  linhas.push(['', '', '', 'TOTAL GERAL:', formatarPeso(totalGeral) + ' kg', totalBobinasGeral + ' bobinas']);

  const ws = XLSX.utils.aoa_to_sheet(linhas);
  ws['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 20 }, { wch: 14 }, { wch: 14 }];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: 3 } }
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Estoque");
  XLSX.writeFile(wb, "Estoque_" + getTimestamp() + ".xlsx");
  mostrarToast("Estoque exportado com sucesso");
}

function exportarHistorico(dataInicioP, dataFimP){
  const wb = XLSX.utils.book_new();
  let dadosHistorico = historico.filter(h => {
    if(!dataInicioP && !dataFimP) return true;
    let dataISO = h.data.split(",")[0].split("/").reverse().join("-");
    return (!dataInicioP || dataISO >= dataInicioP) && (!dataFimP || dataISO <= dataFimP);
  }).map(h => {
    let partes = h.item.split(" - V");
    if (partes.length < 2) return null;
    let item = partes[0], versao = partes[1];
    let tipoInterno = "";
    Object.keys(banco).forEach(tipo=>{ if(banco[tipo][item]) tipoInterno = tipo; });
    if (!banco[tipoInterno] || !banco[tipoInterno][item] || !banco[tipoInterno][item][versao]) return null;
    let tamanho = banco[tipoInterno][item][versao].tamanho;
    let ref = h.refEntradaData || '';
    return { Data: h.data, Movimentação: h.tipo, Tipo: nomeBonitoTipo(tipoInterno), Item: item, Versão: versao, Medidas: tamanho, Kg: h.qtd, Ref: ref };
  }).filter(d => d !== null);
  const wsHistorico = XLSX.utils.json_to_sheet(dadosHistorico);
  wsHistorico['!autofilter'] = { ref: wsHistorico['!ref'] };
  wsHistorico['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 8 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsHistorico, "Histórico");
  XLSX.writeFile(wb, "Historico_" + getTimestamp() + ".xlsx");
}

function exportarAmbos(dataInicioP, dataFimP) {
  const wb = XLSX.utils.book_new();
  let dadosEstoque = [];
  let totalGeral = 0, totalBobinasGeral = 0;
  let totaisPorTipo = {};

  Object.keys(estoque).forEach(chave => {
    if (chave.endsWith('_qtd')) return;
    let partes = chave.split(" - V");
    if (partes.length < 2) return;
    let item = partes[0], versao = partes[1];
    let tipoInterno = "";
    Object.keys(banco).forEach(tipo => { if (banco[tipo][item]) tipoInterno = tipo; });
    if (!banco[tipoInterno] || !banco[tipoInterno][item] || !banco[tipoInterno][item][versao]) return;
    let tamanho = banco[tipoInterno][item][versao].tamanho;
    let peso = estoque[chave];
    let qtdBobinas = estoque[chave + '_qtd'] || 0;
    if (qtdBobinas === 0 && peso > 0) {
      let entradasItem = historico.filter(h => h.item === chave && h.tipo === "Entrada" && !h.consumida && !h._removidaEstoque);
      let soma = 0;
      for (let idx = entradasItem.length - 1; idx >= 0; idx--) {
        if (soma >= peso) break;
        soma += entradasItem[idx].qtd;
        qtdBobinas++;
      }
      if (qtdBobinas === 0) qtdBobinas = 1;
    }
    let nomeT = nomeCompletoTipo(tipoInterno);
    totalGeral += peso;
    totalBobinasGeral += qtdBobinas;
    if (!totaisPorTipo[nomeT]) totaisPorTipo[nomeT] = { kg: 0, bobinas: 0 };
    totaisPorTipo[nomeT].kg += peso;
    totaisPorTipo[nomeT].bobinas += qtdBobinas;
    dadosEstoque.push({ Tipo: nomeBonitoTipo(tipoInterno), Item: item, Versão: versao, Medidas: tamanho, Kg: peso, Bobinas: qtdBobinas });
  });

  let ordemTipo = { 'BRF': 1, 'Tampa': 2, '1ª Lam.': 3 };
  dadosEstoque.sort((a, b) => (ordemTipo[a.Tipo] || 99) - (ordemTipo[b.Tipo] || 99));

  let linhasEstoque = [];
  linhasEstoque.push(['CONFERÊNCIA DE ESTOQUES', '', '', '', '', '']);
  linhasEstoque.push(['Data do relatório:', new Date().toLocaleString('pt-BR'), '', '', '', '']);
  linhasEstoque.push(['', '', '', '', '', '']);
  linhasEstoque.push(['RESUMO GERAL', '', '', '', '', '']);
  linhasEstoque.push(['Total em estoque:', '', '', '', formatarPeso(totalGeral) + ' kg', totalBobinasGeral + ' bobinas']);
  linhasEstoque.push(['', '', '', '', '', '']);
  linhasEstoque.push(['RESUMO POR TIPO', '', '', '', '', '']);
  linhasEstoque.push(['Tipo', '', '', '', 'Kg', 'Bobinas']);

  ['BRF', 'Tampas', '1ª Laminação'].forEach(nomeT => {
    if (totaisPorTipo[nomeT]) {
      let perc = totalGeral > 0 ? Math.round((totaisPorTipo[nomeT].kg / totalGeral) * 100) : 0;
      linhasEstoque.push([nomeT, '', '', perc + '%', formatarPeso(totaisPorTipo[nomeT].kg) + ' kg', totaisPorTipo[nomeT].bobinas + ' bobinas']);
    }
  });

  linhasEstoque.push(['', '', '', '', '', '']);
  linhasEstoque.push(['', '', '', '', '', '']);
  linhasEstoque.push(['DETALHAMENTO', '', '', '', '', '']);
  linhasEstoque.push(['Tipo', 'Item', 'Versão', 'Medidas', 'Kg', 'Bobinas']);

  let tipoAtual = '', subtotalKg = 0, subtotalBob = 0;
  dadosEstoque.forEach((d, idx) => {
    if (tipoAtual && d.Tipo !== tipoAtual) {
      linhasEstoque.push(['', '', '', 'Subtotal ' + tipoAtual + ':', subtotalKg + ' kg', subtotalBob + ' bobinas']);
      linhasEstoque.push(['', '', '', '', '', '']);
      subtotalKg = 0; subtotalBob = 0;
    }
    tipoAtual = d.Tipo;
    subtotalKg += d.Kg;
    subtotalBob += d.Bobinas;
    linhasEstoque.push([d.Tipo, d.Item, d.Versão, d.Medidas, d.Kg, d.Bobinas]);
    if (idx === dadosEstoque.length - 1) {
      linhasEstoque.push(['', '', '', 'Subtotal ' + tipoAtual + ':', subtotalKg + ' kg', subtotalBob + ' bobinas']);
    }
  });

  linhasEstoque.push(['', '', '', '', '', '']);
  linhasEstoque.push(['', '', '', 'TOTAL GERAL:', formatarPeso(totalGeral) + ' kg', totalBobinasGeral + ' bobinas']);

  const wsEstoque = XLSX.utils.aoa_to_sheet(linhasEstoque);
  wsEstoque['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 20 }, { wch: 14 }, { wch: 14 }];
  wsEstoque['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: 3 } }
  ];
  XLSX.utils.book_append_sheet(wb, wsEstoque, "Estoque");

  let dadosHistorico = historico.filter(h => {
    if (!dataInicioP && !dataFimP) return true;
    let dataISO = h.data.split(",")[0].split("/").reverse().join("-");
    return (!dataInicioP || dataISO >= dataInicioP) && (!dataFimP || dataISO <= dataFimP);
  }).map(h => {
    let partes = h.item.split(" - V");
    if (partes.length < 2) return null;
    let item = partes[0], versao = partes[1];
    let tipoInterno = "";
    Object.keys(banco).forEach(tipo => { if (banco[tipo][item]) tipoInterno = tipo; });
    if (!banco[tipoInterno] || !banco[tipoInterno][item] || !banco[tipoInterno][item][versao]) return null;
    let tamanho = banco[tipoInterno][item][versao].tamanho;
    let ref = h.refEntradaData || '';
    return { Data: h.data, Movimentação: h.tipo, Tipo: nomeBonitoTipo(tipoInterno), Item: item, Versão: versao, Medidas: tamanho, Kg: h.qtd, Ref: ref };
  }).filter(d => d !== null);

  const wsHistorico = XLSX.utils.json_to_sheet(dadosHistorico);
  wsHistorico['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 8 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsHistorico, "Histórico");

  XLSX.writeFile(wb, "Estoque_Historico_" + getTimestamp() + ".xlsx");
  mostrarToast("Exportação concluída");
}

/* ================= EXPORTAÇÃO PDF ================= */

function exportarEstoquePDF(dataInicioP, dataFimP) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape' });
  const agora = new Date().toLocaleString('pt-BR');
  const pageW = doc.internal.pageSize.width;

  let dadosEstoque = [];
  let totalGeral = 0, totalBobinasGeral = 0;
  let totaisPorTipo = {};

  Object.keys(estoque).forEach(chave => {
    if (chave.endsWith('_qtd')) return;
    let partes = chave.split(" - V");
    if (partes.length < 2) return;
    let item = partes[0], versao = partes[1];
    let tipoInterno = "";
    Object.keys(banco).forEach(tipo => { if (banco[tipo][item]) tipoInterno = tipo; });
    if (!banco[tipoInterno] || !banco[tipoInterno][item] || !banco[tipoInterno][item][versao]) return;
    let tamanho = banco[tipoInterno][item][versao].tamanho;
    let peso = estoque[chave];
    let qtdBobinas = estoque[chave + '_qtd'] || 0;
    if (qtdBobinas === 0 && peso > 0) {
      let entradasItem = historico.filter(h => h.item === chave && h.tipo === "Entrada" && !h.consumida && !h._removidaEstoque);
      let soma = 0;
      for (let idx = entradasItem.length - 1; idx >= 0; idx--) {
        if (soma >= peso) break;
        soma += entradasItem[idx].qtd;
        qtdBobinas++;
      }
      if (qtdBobinas === 0) qtdBobinas = 1;
    }
    let nomeT = nomeCompletoTipo(tipoInterno);
    totalGeral += peso;
    totalBobinasGeral += qtdBobinas;
    if (!totaisPorTipo[nomeT]) totaisPorTipo[nomeT] = { kg: 0, bobinas: 0 };
    totaisPorTipo[nomeT].kg += peso;
    totaisPorTipo[nomeT].bobinas += qtdBobinas;
    dadosEstoque.push([nomeBonitoTipo(tipoInterno), item, versao, tamanho, String(peso), String(qtdBobinas)]);
  });

  if (dadosEstoque.length === 0) { mostrarToast('Estoque vazio', 'erro'); return; }

  let ordemTipo = { 'BRF': 1, 'Tampa': 2, '1ª Lam.': 3 };
  dadosEstoque.sort((a, b) => (ordemTipo[a[0]] || 99) - (ordemTipo[b[0]] || 99));

  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageW, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Conferência de Estoques', 14, 9);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(agora, pageW - 14, 9, { align: 'right' });

  let resumoY = 20;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 14, resumoY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatarPeso(totalGeral) + ' kg  ·  ' + totalBobinasGeral + ' bobinas', 32, resumoY);

  resumoY += 5;
  let tiposTexto = [];
  ['BRF', 'Tampas', '1ª Laminação'].forEach(nomeT => {
    if (totaisPorTipo[nomeT]) {
      let perc = totalGeral > 0 ? Math.round((totaisPorTipo[nomeT].kg / totalGeral) * 100) : 0;
      tiposTexto.push(nomeT + ': ' + formatarPeso(totaisPorTipo[nomeT].kg) + ' kg · ' + totaisPorTipo[nomeT].bobinas + ' bob. (' + perc + '%)');
    }
  });
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(tiposTexto.join('    |    '), 14, resumoY);

  resumoY += 3;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(14, resumoY, pageW - 14, resumoY);

  let tabelaBody = [];
  let tipoAtual2 = '', subtotalKg2 = 0, subtotalBob2 = 0;

  dadosEstoque.forEach((d, idx) => {
    if (tipoAtual2 && d[0] !== tipoAtual2) {
      tabelaBody.push([
        { content: '', styles: { fillColor: [245, 247, 250] } },
        { content: '', styles: { fillColor: [245, 247, 250] } },
        { content: '', styles: { fillColor: [245, 247, 250] } },
        { content: 'Subtotal ' + tipoAtual2 + ':', styles: { fontStyle: 'bold', halign: 'right', fillColor: [245, 247, 250], textColor: [80, 80, 80] } },
        { content: formatarPeso(subtotalKg2), styles: { fontStyle: 'bold', fillColor: [245, 247, 250], textColor: [80, 80, 80] } },
        { content: String(subtotalBob2), styles: { fontStyle: 'bold', fillColor: [245, 247, 250], textColor: [80, 80, 80] } }
      ]);
      subtotalKg2 = 0; subtotalBob2 = 0;
    }
    tipoAtual2 = d[0];
    subtotalKg2 += parseFloat(d[4]);
    subtotalBob2 += parseInt(d[5]);
    tabelaBody.push(d);
    if (idx === dadosEstoque.length - 1) {
      tabelaBody.push([
        { content: '', styles: { fillColor: [245, 247, 250] } },
        { content: '', styles: { fillColor: [245, 247, 250] } },
        { content: '', styles: { fillColor: [245, 247, 250] } },
        { content: 'Subtotal ' + tipoAtual2 + ':', styles: { fontStyle: 'bold', halign: 'right', fillColor: [245, 247, 250], textColor: [80, 80, 80] } },
        { content: formatarPeso(subtotalKg2), styles: { fontStyle: 'bold', fillColor: [245, 247, 250], textColor: [80, 80, 80] } },
        { content: String(subtotalBob2), styles: { fontStyle: 'bold', fillColor: [245, 247, 250], textColor: [80, 80, 80] } }
      ]);
    }
  });

  tabelaBody.push([
    { content: '', styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] } },
    { content: '', styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] } },
    { content: '', styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] } },
    { content: 'TOTAL:', styles: { fontStyle: 'bold', halign: 'right', fillColor: [30, 41, 59], textColor: [255, 255, 255] } },
    { content: formatarPeso(totalGeral), styles: { fontStyle: 'bold', fillColor: [30, 41, 59], textColor: [255, 255, 255] } },
    { content: String(totalBobinasGeral), styles: { fontStyle: 'bold', fillColor: [30, 41, 59], textColor: [255, 255, 255] } }
  ]);

  doc.autoTable({
    startY: resumoY + 3,
    head: [['Tipo', 'Item', 'Versão', 'Medidas', 'Kg', 'Bobinas']],
    body: tabelaBody,
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [50, 50, 50] },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [252, 252, 253] },
    columnStyles: {
      0: { cellWidth: 22 }, 1: { cellWidth: 30 }, 2: { cellWidth: 16 },
      3: { cellWidth: 30 }, 4: { cellWidth: 20 }, 5: { cellWidth: 18 }
    }
  });

  let totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text('Página ' + p + '/' + totalPages, pageW / 2, doc.internal.pageSize.height - 5, { align: 'center' });
  }

  doc.save("Estoque_" + getTimestamp() + ".pdf");
  mostrarToast("PDF exportado com sucesso");
}

function exportarHistoricoPDF(dataInicioP, dataFimP) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape' });
  const agora = new Date().toLocaleString('pt-BR');

  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, doc.internal.pageSize.width, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Conferência de Estoques — Histórico', 14, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Gerado em: ' + agora, doc.internal.pageSize.width - 14, 12, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  let dadosHistorico = historico.filter(h => {
    if (!dataInicioP && !dataFimP) return true;
    let dataISO = h.data.split(",")[0].split("/").reverse().join("-");
    return (!dataInicioP || dataISO >= dataInicioP) && (!dataFimP || dataISO <= dataFimP);
  }).map(h => {
    let partes = h.item.split(" - V");
    if (partes.length < 2) return null;
    let item = partes[0], versao = partes[1];
    let tipoInterno = "";
    Object.keys(banco).forEach(tipo => { if (banco[tipo][item]) tipoInterno = tipo; });
    if (!banco[tipoInterno] || !banco[tipoInterno][item] || !banco[tipoInterno][item][versao]) return null;
    let tamanho = banco[tipoInterno][item][versao].tamanho;
    let ref = h.refEntradaData || '';
    return [h.data, h.tipo, nomeBonitoTipo(tipoInterno), item, versao, tamanho, String(h.qtd), ref];
  }).filter(d => d !== null);

  if (dadosHistorico.length === 0) { mostrarToast('Nenhum dado para exportar', 'erro'); return; }

  doc.autoTable({
    startY: 22,
    head: [['Data', 'Movimentação', 'Tipo', 'Item', 'Versão', 'Medidas', 'Kg', 'Ref']],
    body: dadosHistorico,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 244, 255] },
    columnStyles: {
      0: { cellWidth: 34 }, 1: { cellWidth: 26 }, 2: { cellWidth: 16 },
      3: { cellWidth: 26 }, 4: { cellWidth: 14 }, 5: { cellWidth: 24 },
      6: { cellWidth: 14 }, 7: { cellWidth: 34 }
    }
  });

  doc.save("Historico_" + getTimestamp() + ".pdf");
}

/* ================= MODO VISUALIZAÇÃO ================= */

function alternarModoVisualizacao() {
  const telaEstoque = !document.getElementById("estoque").classList.contains("hidden");
  const telaHistorico = !document.getElementById("historico").classList.contains("hidden");
  if (!telaEstoque && !telaHistorico) return;
  const body = document.body;
  const botao = document.getElementById("btnExpandir");
  body.classList.toggle("modo-visualizacao");
  botao.textContent = body.classList.contains("modo-visualizacao") ? "✕" : "⛶";
}

if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registrado:', reg))
      .catch(err => console.error('Erro SW:', err));
  });
}

/* ================= DETALHES POR TIPO ================= */

let tipoDetalheAtual = null;
let ordemDetalhes = { coluna: null, asc: true };

function ordenarDetalhes(coluna) {
  if (ordemDetalhes.coluna === coluna) { ordemDetalhes.asc = !ordemDetalhes.asc; }
  else { ordemDetalhes.coluna = coluna; ordemDetalhes.asc = true; }
  document.querySelectorAll('#detalhesTipo thead th.sortable').forEach(th => {
    th.classList.remove('asc', 'desc', 'none'); th.classList.add('none');
  });
  const thAtivo = document.querySelector(`#detalhesTipo thead th[onclick="ordenarDetalhes('${coluna}')"]`);
  if (thAtivo) { thAtivo.classList.remove('none'); thAtivo.classList.add(ordemDetalhes.asc ? 'asc' : 'desc'); }
  atualizarDetalhes();
}

function abrirDetalhes(tipo) {
  tipoDetalheAtual = tipo;
  document.getElementById('movimentar').classList.add('hidden');
  document.getElementById('estoque').classList.add('hidden');
  document.getElementById('historico').classList.add('hidden');
  document.getElementById('detalhesTipo').classList.remove('hidden');
  document.querySelectorAll('.nav-top button').forEach(btn => btn.classList.remove('ativo'));
  const btnExpandir = document.getElementById("btnExpandir");
  if (btnExpandir) {
    btnExpandir.style.visibility = "visible";
    btnExpandir.style.pointerEvents = "auto";
  }
  document.getElementById('detalheTitulo').textContent = nomeCompletoTipo(tipo);
  document.getElementById('buscaDetalhes').value = '';
  ordemDetalhes = { coluna: null, asc: true };
  document.querySelectorAll('#detalhesTipo thead th.sortable').forEach(th => {
    th.classList.remove('asc', 'desc', 'none');
    th.classList.add('none');
  });
  atualizarDetalhes();
}

function fecharDetalhes() {
  tipoDetalheAtual = null;
  document.getElementById('detalhesTipo').classList.add('hidden');
  document.getElementById('estoque').classList.remove('hidden');
  atualizarTabela();
}

function irParaBobinaNosDetalhes(registro, indexHistorico) {
  if (!registro || !registro.item) return;

  let itemApenas = registro.item.split(" - ")[0].trim();
  let tipo = descobrirTipoPorItem(itemApenas);

  if (!tipo) {
    mostrarToast('Tipo não encontrado', 'erro');
    return;
  }

  abrirDetalhes(tipo);

  let campoBusca = document.getElementById('buscaDetalhes');
  if (campoBusca) campoBusca.value = "";
  atualizarDetalhes();

  setTimeout(() => {
    let partes = registro.item.split(" - V");
    let idGrupo = "gp" + partes[0].replace(/[^a-zA-Z0-9]/g, '') + partes[1].replace(/[^a-zA-Z0-9]/g, '');
    abrirGrupoDetalhePorId(idGrupo);

    let digitalData = registro.data.replace(/[^0-9]/g, "");
    let linha = document.getElementById("BOBINA-" + indexHistorico + "-" + digitalData);
    if (linha) {
      linha.scrollIntoView({ behavior: 'smooth', block: 'center' });
      linha.style.backgroundColor = '#fef3c7';
      linha.style.outline = '3px solid #1e3a8a';
      setTimeout(() => {
        linha.style.backgroundColor = '';
        linha.style.outline = '';
      }, 5000);
    } else {
      mostrarToast("Bobina localizada, mas o filtro a escondeu", "erro");
    }
  }, 350);
}

function abrirGrupoDetalhePorId(idGrupo) {
  let linhas = document.querySelectorAll(`tr[data-grupo="${idGrupo}"]`);
  let principal = document.getElementById("principal-" + idGrupo);
  if (!principal) return;
  principal.classList.add('grupo-aberto');
  let btn = principal.querySelector('.btn-expandir-detalhe');
  if (btn) btn.textContent = "−";
  linhas.forEach(l => l.classList.remove('hidden'));
}

function atualizarDetalhes() {
  const tbody = document.getElementById('detalhesTabela');
  tbody.innerHTML = '';
  const termo = normalizarTexto(document.getElementById('buscaDetalhes').value);
  let pesoTotalAcumulado = 0, totalBobinas = 0;

  let entradas = historico.filter(h => {
    if (h.tipo !== "Entrada") return false;
    if (h._removidaEstoque) return false;
    let partes = h.item.split(" - V");
    if (partes.length < 2) return false;
    let item = partes[0];
    let tipoEncontrado = "";
    Object.keys(banco).forEach(t => { if (banco[t][item]) tipoEncontrado = t; });
    if (tipoEncontrado !== tipoDetalheAtual) return false;
    if (h.consumida) return true;
    if (!estoque[h.item] || estoque[h.item] <= 0) return false;
    return true;
  });

  let agrupado = {};
  let todasEntradas = {};
  entradas.forEach(h => {
    if (!todasEntradas[h.item]) todasEntradas[h.item] = [];
    todasEntradas[h.item].push(h);
  });

  Object.keys(todasEntradas).forEach(chave => {
    let pesoAtual = estoque[chave] || 0;
    let lista = todasEntradas[chave];
    let consumidas = lista.filter(h => h.consumida);
    let ativas = lista.filter(h => !h.consumida);
    if (pesoAtual <= 0 && consumidas.length === 0) return;
    let registrosSelecionados = [];
    let soma = 0;
    for (let i = ativas.length - 1; i >= 0; i--) {
      if (soma >= pesoAtual) break;
      registrosSelecionados.unshift(ativas[i]);
      soma += ativas[i].qtd;
    }
    agrupado[chave] = { registros: [...consumidas, ...registrosSelecionados], total: pesoAtual };
  });

  Object.keys(estoque).filter(chave => !chave.endsWith('_qtd')).forEach(chave => {
    let partes = chave.split(" - V");
    if (partes.length < 2) return;
    let item = partes[0];
    let tipoEncontrado = "";
    Object.keys(banco).forEach(t => { if (banco[t] && banco[t][item]) tipoEncontrado = t; });
    if (tipoEncontrado !== tipoDetalheAtual) return;
    if (!agrupado[chave]) agrupado[chave] = { registros: [], total: estoque[chave] || 0, semHistorico: true };
  });

  let chavesOrdenadas = Object.keys(agrupado).filter(chave => {
    let partes = chave.split(" - V");
    let item = partes[0], versao = partes[1];
    let tamanho = "";
    if (banco[tipoDetalheAtual] && banco[tipoDetalheAtual][item] && banco[tipoDetalheAtual][item][versao]) {
      tamanho = banco[tipoDetalheAtual][item][versao].tamanho;
    }
    let textoRegistros = agrupado[chave].registros.map(reg =>
      [reg.data || '', reg.id || '', reg.qtd || '', reg.tipo || ''].join(' ')
    ).join(' ');
    let textoBusca = normalizarTexto([
      tipoDetalheAtual, nomeCompletoTipo(tipoDetalheAtual), nomeBonitoTipo(tipoDetalheAtual),
      item, versao, tamanho, agrupado[chave].total, agrupado[chave].registros.length, textoRegistros
    ].join(' '));
    return textoBusca.includes(termo);
  });

  if (ordemDetalhes.coluna) {
    chavesOrdenadas.sort((a, b) => {
      let pA = a.split(" - V"), pB = b.split(" - V");
      let itemA = pA[0], versaoA = pA[1], itemB = pB[0], versaoB = pB[1];
      let v1, v2;
      if (ordemDetalhes.coluna === 'item') { v1 = itemA.toLowerCase(); v2 = itemB.toLowerCase(); }
      else if (ordemDetalhes.coluna === 'versao') { v1 = parseFloat(versaoA)||0; v2 = parseFloat(versaoB)||0; }
      else if (ordemDetalhes.coluna === 'tamanho') {
        let tA = "", tB = "";
        if (banco[tipoDetalheAtual] && banco[tipoDetalheAtual][itemA] && banco[tipoDetalheAtual][itemA][versaoA]) tA = banco[tipoDetalheAtual][itemA][versaoA].tamanho;
        if (banco[tipoDetalheAtual] && banco[tipoDetalheAtual][itemB] && banco[tipoDetalheAtual][itemB][versaoB]) tB = banco[tipoDetalheAtual][itemB][versaoB].tamanho;
        let pA1 = tA.split(" x "), pB1 = tB.split(" x ");
        let lA = parseFloat(pA1[0])||0, lB = parseFloat(pB1[0])||0, aA = parseFloat(pA1[1])||0, aB = parseFloat(pB1[1])||0;
        if (lA !== lB) return ordemDetalhes.asc ? lA-lB : lB-lA;
        return ordemDetalhes.asc ? aA-aB : aB-aA;
      } else if (ordemDetalhes.coluna === 'peso') { v1 = agrupado[a].total; v2 = agrupado[b].total; }
      else if (ordemDetalhes.coluna === 'qtd') { v1 = agrupado[a].registros.length; v2 = agrupado[b].registros.length; }
      if (v1>v2) return ordemDetalhes.asc?1:-1;
      if (v1<v2) return ordemDetalhes.asc?-1:1;
      return 0;
    });
  }

  chavesOrdenadas.forEach(chave => {
    let partes = chave.split(" - V");
    let item = partes[0], versao = partes[1], tamanho = "";
    if (banco[tipoDetalheAtual] && banco[tipoDetalheAtual][item] && banco[tipoDetalheAtual][item][versao]) {
      tamanho = banco[tipoDetalheAtual][item][versao].tamanho;
    }
    pesoTotalAcumulado += agrupado[chave].total;
    totalBobinas += agrupado[chave].registros.length;
    let idLimpo = "gp" + item.replace(/[^a-zA-Z0-9]/g, '') + versao.replace(/[^a-zA-Z0-9]/g, '');

    let tr = document.createElement('tr');
    tr.id = "principal-" + idLimpo;
    tr.innerHTML = `
      <td>${item}</td><td>${versao}</td><td>${tamanho}</td>
      <td>${formatarPeso(agrupado[chave].total)}</td>
      <td>${agrupado[chave].registros.filter(r => !r.consumida).length}</td>
      <td><button class="btn-expandir-detalhe" onclick="toggleGrupo('${idLimpo}')">+</button></td>
    `;
    longPress(tr, function() { abrirModalOpcoes('item', chave, null); });
    tbody.appendChild(tr);

    if (agrupado[chave].registros.length > 0) {
      let trLegenda = document.createElement('tr');
      trLegenda.className = "detalhe-legenda hidden";
      trLegenda.setAttribute('data-grupo', idLimpo);
      trLegenda.innerHTML = `<td style="text-align:center;width:2ch;">#</td><td colspan="2" style="text-align:center;">📅</td><td style="text-align:center;">Kg</td><td colspan="2"></td>`;
      tbody.appendChild(trLegenda);

      agrupado[chave].registros.forEach((reg, idx) => {
        let indexReal = historico.indexOf(reg);
        let trReg = document.createElement('tr');
        trReg.className = "detalhe-registro hidden" + (reg.consumida ? " bobina-consumida" : "");
        trReg.setAttribute('data-grupo', idLimpo);
        let digitalData = reg.data.replace(/[^0-9]/g, "");
        trReg.id = "BOBINA-" + indexReal + "-" + digitalData;
        trReg.innerHTML = `
          <td style="text-align:center;width:2ch;"><strong>${idx+1}</strong></td>
          <td colspan="2" style="text-align:center;font-size:11px;">${reg.data}</td>
          <td style="text-align:center;"><strong>${Math.round(reg.qtd)}</strong></td>
          <td style="text-align:center;">
            <button class="btn-qr" onclick="event.stopPropagation(); gerarQRBobina(${indexReal})" title="QR Code">QR</button>
          </td>
          <td></td>
        `;
        longPress(trReg, function() { abrirModalOpcoes('bobina', chave, indexReal); });
        tbody.appendChild(trReg);
      });
    } else {
      let trSem = document.createElement('tr');
      trSem.className = "detalhe-registro hidden";
      trSem.setAttribute('data-grupo', idLimpo);
      trSem.innerHTML = `<td colspan="6" style="text-align:center;font-size:11px;color:#64748b;">Sem registro no histórico</td>`;
      tbody.appendChild(trSem);
    }
  });

  document.getElementById('detalheTotalPeso').textContent = formatarPeso(pesoTotalAcumulado) + ' kg';
  document.getElementById('detalheTotalBobinas').textContent = totalBobinas + ' bobinas';
}

function toggleGrupo(id) {
  let linhas = document.querySelectorAll(`tr[data-grupo="${id}"]`);
  let principal = document.getElementById("principal-" + id);
  let btn = event.target;
  let abrindo = false;
  linhas.forEach(l => {
    if (l.classList.contains('hidden')) { l.classList.remove('hidden'); abrindo = true; }
    else l.classList.add('hidden');
  });
  if (abrindo) { principal.classList.add('grupo-aberto'); btn.textContent = "−"; }
  else { principal.classList.remove('grupo-aberto'); btn.textContent = "+"; }
}

/* ================= BACKUP ================= */

function salvarUltimoBackupLocal(origem = 'manual') {
  const dados = {
    estoque: JSON.parse(JSON.stringify(estoque)),
    historico: JSON.parse(JSON.stringify(historico)),
    banco: JSON.parse(JSON.stringify(banco)),
    dataBackup: new Date().toLocaleString(),
    origem: origem
  };
  localStorage.setItem('ultimoBackupLocal', JSON.stringify(dados));
}

window.restaurarUltimoBackup = function() {
  const salvo = localStorage.getItem('ultimoBackupLocal');
  if (!salvo) { mostrarToast('Nenhum backup local disponível', 'erro'); return; }
  try {
    const dados = JSON.parse(salvo);
    if (!dados.estoque || !dados.historico || !dados.banco) { mostrarToast('Backup local inválido', 'erro'); return; }
    if (!confirm("Restaurar o último backup salvo em " + (dados.dataBackup || "data desconhecida") + "?\n\nIsso substituirá os dados atuais.")) return;
    salvarEstadoParaDesfazer();
    estoque = dados.estoque;
    historico = dados.historico;
    banco = dados.banco;
    salvarBanco();
    salvarDados();
    atualizarTudo();
    fecharModalConfig();
    mostrarToast('Último backup restaurado');
  } catch (e) {
    mostrarToast('Erro ao restaurar último backup', 'erro');
  }
};

function exportarBackup() {
  salvarUltimoBackupLocal('backup exportado manualmente');
  const dados = { estoque, historico, banco, etiquetasPendentes, dataBackup: new Date().toLocaleString() };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "backup_estoque_" + getTimestamp() + ".json";
  link.click();
  mostrarToast('Backup exportado');
}

function importarBackup() { document.getElementById('inputBackup').click(); }

function processarBackup(event) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;
  const leitor = new FileReader();
  leitor.onload = function (e) {
    try {
      const dados = JSON.parse(e.target.result);
      if (!dados.estoque || !dados.historico) { mostrarToast('Arquivo de backup inválido!', 'erro'); return; }
      if (!confirm("Isso vai substituir TODOS os dados atuais pelo backup.\n\nData do backup: " + (dados.dataBackup || "desconhecida") + "\n\nDeseja continuar?")) return;
      salvarUltimoBackupLocal('antes de restaurar backup importado');
      salvarEstadoParaDesfazer();
      estoque = dados.estoque;
      historico = dados.historico;
      if (dados.banco) { banco = dados.banco; salvarBanco(); }
      if (dados.etiquetasPendentes) { etiquetasPendentes = dados.etiquetasPendentes; salvarPendentes(); }
      salvarDados();
      atualizarTabela();
      atualizarHistorico();
      mostrarToast('Backup restaurado com sucesso!');
      fecharModalConfig();
    } catch (erro) {
      mostrarToast('Erro ao ler o arquivo de backup!', 'erro');
    }
  };
  leitor.readAsText(arquivo);
  event.target.value = "";
}

/* ================= LONG PRESS ================= */

let longPressTimer = null;
let opcaoAtual = { tipo: null, chave: null, indexHistorico: null };

function abrirModalOpcoes(tipo, chave, indexHistorico) {
  opcaoAtual.tipo = tipo;
  opcaoAtual.chave = chave;
  opcaoAtual.indexHistorico = indexHistorico;

  let titulo = document.getElementById('modalOpcoesTitulo');
  let btnEditar = document.getElementById('btnOpcaoEditar');

  if (tipo === 'item') {
    titulo.textContent = chave;
    btnEditar.style.display = 'none';
  } else {
    titulo.textContent = chave + ' — #' + (indexHistorico + 1);
    btnEditar.style.display = 'block';
  }

  let btnConsumir = document.getElementById('btnOpcaoConsumir');
  if (tipo === 'bobina' && historico[indexHistorico] && historico[indexHistorico].consumida) {
    btnConsumir.textContent = '↩ Desmarcar consumida';
  } else if (tipo === 'item') {
    let todasConsumidas = historico.filter(h => h.item === chave && h.tipo === "Entrada").every(h => h.consumida);
    btnConsumir.textContent = todasConsumidas ? '↩ Desmarcar consumidas' : '✔️ Marcar como consumida';
  } else {
    btnConsumir.textContent = '✔️ Marcar como consumida';
  }

  let btnExcluirConsumidas = document.getElementById('btnOpcaoExcluirConsumidas');
  if (tipo === 'item') {
    let temConsumida = historico.some(h => h.item === chave && h.tipo === "Entrada" && h.consumida);
    btnExcluirConsumidas.style.display = temConsumida ? 'block' : 'none';
  } else {
    btnExcluirConsumidas.style.display = 'none';
  }

  document.getElementById('modalOpcoes').classList.remove('hidden');
}

function fecharModalOpcoes() {
  document.getElementById('modalOpcoes').classList.add('hidden');
  opcaoAtual = { tipo: null, chave: null, indexHistorico: null };
}

function longPress(elemento, callback) {
  elemento.addEventListener('touchstart', function() { longPressTimer = setTimeout(callback, 500); });
  elemento.addEventListener('touchend', function() { clearTimeout(longPressTimer); });
  elemento.addEventListener('touchmove', function() { clearTimeout(longPressTimer); });
  elemento.addEventListener('mousedown', function() { longPressTimer = setTimeout(callback, 500); });
  elemento.addEventListener('mouseup', function() { clearTimeout(longPressTimer); });
  elemento.addEventListener('mouseleave', function() { clearTimeout(longPressTimer); });
}

function configurarLongPress(botao, callback, tempo = 3000) {
  if (!botao) return;
  let timer = null;
  const iniciar = () => { timer = setTimeout(callback, tempo); };
  const cancelar = () => { clearTimeout(timer); timer = null; };
  botao.addEventListener('touchstart', iniciar);
  botao.addEventListener('touchend', cancelar);
  botao.addEventListener('touchmove', cancelar);
  botao.addEventListener('mousedown', iniciar);
  botao.addEventListener('mouseup', cancelar);
  botao.addEventListener('mouseleave', cancelar);
}

/* ================= AÇÕES DO MODAL ================= */

function editarBobina() {
  if (opcaoAtual.tipo !== 'bobina') return;
  let reg = historico[opcaoAtual.indexHistorico];
  if (!reg) return;
  let novoPeso = prompt("Novo peso (kg):", reg.qtd);
  if (novoPeso === null) return;
  novoPeso = parseFloat(novoPeso);
  if (isNaN(novoPeso) || novoPeso <= 0) { mostrarToast('Peso inválido', 'erro'); return; }
  let diferenca = novoPeso - reg.qtd;
  reg.qtd = novoPeso;
  if (!reg.consumida && estoque[opcaoAtual.chave]) {
    estoque[opcaoAtual.chave] += diferenca;
    if (estoque[opcaoAtual.chave] <= 0) delete estoque[opcaoAtual.chave];
  }
  salvarDados();
  atualizarTudo();
  fecharModalOpcoes();
  mostrarToast('Peso atualizado');
}

function consumirBobina() {
  salvarEstadoParaDesfazer();
  if (opcaoAtual.tipo === 'bobina') {
    let reg = historico[opcaoAtual.indexHistorico];
    if (!reg) return;
    if (reg.consumida) {
      reg.consumida = false;
      if (estoque[opcaoAtual.chave]) estoque[opcaoAtual.chave] += reg.qtd;
      else estoque[opcaoAtual.chave] = reg.qtd;
      if (!estoque[opcaoAtual.chave + '_qtd']) estoque[opcaoAtual.chave + '_qtd'] = 0;
      estoque[opcaoAtual.chave + '_qtd']++;
      for (let i = historico.length - 1; i >= 0; i--) {
        if (historico[i].tipo === 'Consumo' && historico[i].refEntradaId === reg.id) {
          historico.splice(i, 1); break;
        }
      }
      salvarDados(); atualizarTudo(); fecharModalOpcoes();
      mostrarToast('Consumo desmarcado');
    } else {
      reg.consumida = true;
      if (estoque[opcaoAtual.chave]) {
        estoque[opcaoAtual.chave] -= reg.qtd;
        if (estoque[opcaoAtual.chave] <= 0) {
          delete estoque[opcaoAtual.chave];
          delete estoque[opcaoAtual.chave + '_qtd'];
        } else if (estoque[opcaoAtual.chave + '_qtd'] > 0) {
          estoque[opcaoAtual.chave + '_qtd']--;
        }
      }
      historico.push({
        id: crypto.randomUUID(),
        data: new Date().toLocaleString(),
        tipo: 'Consumo',
        item: opcaoAtual.chave,
        qtd: reg.qtd,
        refEntradaId: reg.id,
        refEntradaData: reg.data
      });
      salvarDados(); atualizarTudo(); fecharModalOpcoes();
      mostrarToast('Bobina consumida');
    }
  } else if (opcaoAtual.tipo === 'item') {
    let entradas = historico.filter(h => h.item === opcaoAtual.chave && h.tipo === "Entrada");
    let todasConsumidas = entradas.every(h => h.consumida);
    if (todasConsumidas) {
      entradas.filter(h => h.consumida).forEach(h => {
        h.consumida = false;
        if (estoque[opcaoAtual.chave]) estoque[opcaoAtual.chave] += h.qtd;
        else estoque[opcaoAtual.chave] = h.qtd;
      });
      for (let i = historico.length-1; i >= 0; i--) {
        if (historico[i].tipo === 'Consumo' && historico[i].item === opcaoAtual.chave) historico.splice(i, 1);
      }
      salvarDados(); atualizarTudo(); fecharModalOpcoes();
      mostrarToast('Consumo desmarcado');
    } else {
      entradas.forEach(h => {
        if (!h.consumida) {
          h.consumida = true;
          if (estoque[opcaoAtual.chave]) {
            estoque[opcaoAtual.chave] -= h.qtd;
            if (estoque[opcaoAtual.chave] <= 0) {
              delete estoque[opcaoAtual.chave];
              delete estoque[opcaoAtual.chave + '_qtd'];
            }
          }
          historico.push({
            id: crypto.randomUUID(),
            data: new Date().toLocaleString(),
            tipo: 'Consumo',
            item: opcaoAtual.chave,
            qtd: h.qtd,
            refEntradaId: h.id,
            refEntradaData: h.data
          });
        }
      });
      salvarDados(); atualizarTudo(); fecharModalOpcoes();
      mostrarToast('Todas consumidas');
    }
  }
}

window.excluirBobina = function() {
  salvarEstadoParaDesfazer();
  if (opcaoAtual.tipo === 'bobina') {
    if (!confirm("Remover esta bobina?")) return;
    let reg = historico[opcaoAtual.indexHistorico];
    if (!reg) return;
    if (!reg.consumida && estoque[opcaoAtual.chave]) {
      estoque[opcaoAtual.chave] -= reg.qtd;
      if (estoque[opcaoAtual.chave + '_qtd'] > 0) estoque[opcaoAtual.chave + '_qtd']--;
      if (estoque[opcaoAtual.chave] <= 0) {
        delete estoque[opcaoAtual.chave];
        delete estoque[opcaoAtual.chave + '_qtd'];
      }
    }
    reg._removidaEstoque = true;
    historico.push({
      id: crypto.randomUUID(),
      data: new Date().toLocaleString(),
      tipo: 'Exclusão',
      item: opcaoAtual.chave,
      qtd: reg.qtd,
      refEntradaId: reg.id,
      refEntradaData: reg.data
    });
    salvarDados(); atualizarTudo(); fecharModalOpcoes();
    mostrarToast('Bobina excluída');
  } else if (opcaoAtual.tipo === 'item') {
    if (!confirm("Remover TODAS as bobinas de " + opcaoAtual.chave + "?")) return;
    historico.filter(h => h.item===opcaoAtual.chave && h.tipo==="Entrada" && !h.consumida && !h._removidaEstoque).forEach(h => {
      h._removidaEstoque = true;
      historico.push({
        id: crypto.randomUUID(),
        data: new Date().toLocaleString(),
        tipo: 'Exclusão',
        item: opcaoAtual.chave,
        qtd: h.qtd,
        refEntradaId: h.id,
        refEntradaData: h.data
      });
    });
    delete estoque[opcaoAtual.chave];
    delete estoque[opcaoAtual.chave + '_qtd'];
    salvarDados(); atualizarTudo(); fecharModalOpcoes();
    mostrarToast('Bobinas excluídas');
  }
};

window.excluirConsumidas = function() {
  salvarEstadoParaDesfazer();
  if (!confirm("Remover todas as bobinas consumidas de " + opcaoAtual.chave + "?")) return;
  historico.forEach(h => {
    if (h.item===opcaoAtual.chave && h.tipo==="Entrada" && h.consumida && !h._removidaEstoque) {
      h._removidaEstoque = true;
      historico.push({
        id: crypto.randomUUID(),
        data: new Date().toLocaleString(),
        tipo: 'Exclusão',
        item: opcaoAtual.chave,
        qtd: h.qtd,
        refEntradaId: h.id,
        refEntradaData: h.data
      });
    }
  });
  salvarDados(); atualizarTudo(); fecharModalOpcoes();
  mostrarToast('Consumidas excluídas');
};

/* ================= ATUALIZAR TUDO ================= */

function atualizarTudo() {
  atualizarTabela();
  atualizarHistorico();
  if (tipoDetalheAtual) {
    let gruposAbertos = [];
    document.querySelectorAll('tr.grupo-aberto').forEach(tr => { gruposAbertos.push(tr.id.replace('principal-', '')); });
    atualizarDetalhes();
    gruposAbertos.forEach(id => {
      let linhas = document.querySelectorAll(`tr[data-grupo="${id}"]`);
      let principal = document.getElementById("principal-" + id);
      if (principal) {
        principal.classList.add('grupo-aberto');
        let btn = principal.querySelector('.btn-expandir-detalhe');
        if (btn) btn.textContent = "−";
      }
      linhas.forEach(l => l.classList.remove('hidden'));
    });
  }
}

/* ================= SAÍDA COM SELEÇÃO DE BOBINAS ================= */

let modoSugestao = 'peso'; // 'peso' ou 'idade'
let saidaAtual = { identificador: null, pesoTotal: 0, pesoRestante: 0, bobinas: [], descontos: {}, zeradas: [], combinacoes: [], comboAtual: 0 };
let bobinaZeradaAtual = null;

function encontrarMelhorCombinacao(bobinas, pesoAlvo) {
  return encontrarTodasCombinacoes(bobinas, pesoAlvo)[0] || [];
}
function alternarModoSugestao() {
  modoSugestao = modoSugestao === 'peso' ? 'idade' : 'peso';
  recalcularSugestoes();
}

function recalcularSugestoes() {
  if (modoSugestao === 'idade') {
    let pesoAlvo = saidaAtual.pesoTotal;
    let bobinas = saidaAtual.bobinas;

    // 1. ORDENAÇÃO INFALÍVEL POR DATA (Mais velha primeiro)
    let indicesOrdenados = bobinas.map((bob, idx) => {
      // Pega a data da bobina (dataProducao se existir, senão a data de entrada)
      let dataString = bob.dataProducao || bob.data;
      let timestampOrdenacao = "99999999999999"; // Fallback caso não tenha data (vai pro final)

      if (dataString) {
        // Ex: "22/04/2026, 11:28:49" -> ["22/04/2026", "11:28:49"]
        let partes = dataString.split(", ");
        
        if (partes.length > 0) {
          let dma = partes[0].split("/"); // ["22", "04", "2026"]
          if (dma.length === 3) {
            let ano = dma[2];
            let mes = dma[1].padStart(2, '0');
            let dia = dma[0].padStart(2, '0');
            
            let hora = "000000";
            if (partes[1]) {
              // "11:28:49" -> "112849"
              hora = partes[1].replace(/:/g, "").padEnd(6, '0');
            }
            
            // Ex: 20260422112849
            timestampOrdenacao = ano + mes + dia + hora;
          }
        }
      }
      return { idx: idx, ts: timestampOrdenacao };
    });

    // Ordena do menor (mais antigo) para o maior (mais novo)
    indicesOrdenados.sort((a, b) => a.ts.localeCompare(b.ts));

    // Agora temos a lista de índices das bobinas na ordem cronológica correta
    let ordemIdade = indicesOrdenados.map(o => o.idx);

    // 2. MONTA AS SUGESTÕES
    // Sugestão 1: FIFO puro (pega as mais velhas até atingir ou passar o peso)
    let combo1 = [];
    let soma1 = 0;
    for (let i = 0; i < ordemIdade.length; i++) {
      combo1.push(ordemIdade[i]);
      soma1 += bobinas[ordemIdade[i]].qtd;
      if (soma1 >= pesoAlvo) break;
    }

    // Sugestão 2: FIFO com uma a menos (mostra o que acontece se não pegar a última)
    let combo2 = combo1.length > 1 ? combo1.slice(0, -1) : [];

    // Sugestão 3: FIFO puro + próxima mais velha (se houver)
    let combo3 = [...combo1];
    let usados = new Set(combo3);
    for (let i = 0; i < ordemIdade.length; i++) {
      if (!usados.has(ordemIdade[i])) {
        combo3.push(ordemIdade[i]);
        break;
      }
    }

    // 3. CALCULA DIFERENÇAS E ORDENA AS MELHORES
    let candidatas = [
      { indices: combo1, soma: combo1.reduce((a, i) => a + bobinas[i].qtd, 0) },
      { indices: combo2, soma: combo2.reduce((a, i) => a + bobinas[i].qtd, 0) },
      { indices: combo3, soma: combo3.reduce((a, i) => a + bobinas[i].qtd, 0) }
    ];

    candidatas.forEach(c => { c.diffAbs = Math.abs(c.soma - pesoAlvo); });

    // Remove vazias e duplicadas
    let combos = [];
    let chaves = new Set();

    candidatas.forEach(c => {
      if (c.indices.length === 0) return;
      // Cria uma chave única baseada no peso total e quantidade de bobinas
      let ch = Math.round(c.soma) + '|' + c.indices.length;
      if (!chaves.has(ch)) {
        chaves.add(ch);
        combos.push(c);
      }
    });

    // Ordena pela mais próxima do zero (mesmo respeitando a regra de idade)
    combos.sort((a, b) => {
      if (a.diffAbs !== b.diffAbs) return a.diffAbs - b.diffAbs;
      return a.indices.length - b.indices.length;
    });

    // Pega só os índices
    saidaAtual.combinacoes = combos.slice(0, 3).map(c => c.indices);

  } else {
    // MODO PESO (Lógica inalterada)
    saidaAtual.combinacoes = encontrarTodasCombinacoes(saidaAtual.bobinas, saidaAtual.pesoTotal);
  }

  // 4. APLICA A PRIMEIRA COMBINAÇÃO E RENDERIZA A TELA
  saidaAtual.comboAtual = 0;
  saidaAtual.descontos = {};
  saidaAtual.zeradas = [];

  if (saidaAtual.combinacoes.length > 0) {
    saidaAtual.combinacoes[0].forEach(idx => {
      let indexReal = historico.indexOf(saidaAtual.bobinas[idx]);
      saidaAtual.descontos[indexReal] = saidaAtual.bobinas[idx].qtd;
      saidaAtual.zeradas.push(indexReal);
    });
  }

  renderizarBobinasSaida();
}

window.alternarModoSugestao = alternarModoSugestao;

function encontrarTodasCombinacoes(bobinas, pesoAlvo) {
  let n = bobinas.length;
  let todas = [];

  if (n <= 20) {
    let totalCombinacoes = Math.pow(2, n);

    for (let mask = 1; mask < totalCombinacoes; mask++) {
      let soma = 0;
      let indices = [];

      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) {
          soma += bobinas[i].qtd;
          indices.push(i);
        }
      }

      todas.push({
        indices,
        soma,
        diffAbs: Math.abs(soma - pesoAlvo)
      });
    }
  } else {
    // fallback simples para muitos itens
    let ordenadas = bobinas
      .map((b, i) => ({ idx: i, peso: b.qtd }))
      .sort((a, b) => b.peso - a.peso);

    let tentativas = [];

    // tentativa 1: maiores primeiro
    let soma1 = 0, idx1 = [];
    for (let b of ordenadas) {
      idx1.push(b.idx);
      soma1 += b.peso;
      if (soma1 >= pesoAlvo) break;
    }
    tentativas.push({ indices: idx1, soma: soma1, diffAbs: Math.abs(soma1 - pesoAlvo) });

    // tentativa 2: menores primeiro
    let asc = [...ordenadas].reverse();
    let soma2 = 0, idx2 = [];
    for (let b of asc) {
      idx2.push(b.idx);
      soma2 += b.peso;
      if (soma2 >= pesoAlvo) break;
    }
    tentativas.push({ indices: idx2, soma: soma2, diffAbs: Math.abs(soma2 - pesoAlvo) });

    // tentativa 3: começando do segundo maior
    let soma3 = 0, idx3 = [];
    for (let i = 1; i < ordenadas.length; i++) {
      idx3.push(ordenadas[i].idx);
      soma3 += ordenadas[i].peso;
      if (soma3 >= pesoAlvo) break;
    }
    if (idx3.length) {
      tentativas.push({ indices: idx3, soma: soma3, diffAbs: Math.abs(soma3 - pesoAlvo) });
    }

    todas = tentativas;
  }

  // Ordena pelas mais próximas de zero
  todas.sort((a, b) => {
    if (a.diffAbs !== b.diffAbs) return a.diffAbs - b.diffAbs;
    if (a.indices.length !== b.indices.length) return a.indices.length - b.indices.length;
    return a.soma - b.soma;
  });

  // Remove duplicadas por resultado final
  let unicas = [];
  let vistas = new Set();

  todas.forEach(combo => {
    let chave = Math.round(combo.soma) + '|' + combo.indices.length;
    if (!vistas.has(chave)) {
      vistas.add(chave);
      unicas.push(combo);
    }
  });

  return unicas.slice(0, 3).map(c => c.indices);
}
function abrirModalSaida(identificador, pesoSaida) {
  saidaAtual.identificador = identificador;
  saidaAtual.pesoTotal = pesoSaida;
  saidaAtual.pesoRestante = pesoSaida;
  saidaAtual.descontos = {};
  saidaAtual.zeradas = [];
  
  let entradas = historico.filter(h => h.item === identificador && h.tipo === "Entrada" && !h.consumida && !h._removidaEstoque);
  let pesoAtual = estoque[identificador] || 0;
  let bobinas = [], soma = 0;
  for (let i = entradas.length - 1; i >= 0; i--) {
    if (soma >= pesoAtual) break;
    bobinas.unshift(entradas[i]);
    soma += entradas[i].qtd;
  }
  saidaAtual.bobinas = bobinas;

  // Calcula combinações e aplica a primeira
  saidaAtual.combinacoes = encontrarTodasCombinacoes(bobinas, pesoSaida);
  saidaAtual.comboAtual = 0;
  aplicarCombinacao(0);

  // Define o título simples: Item - Versão
  document.getElementById('modalSaidaTitulo').textContent = identificador;
  
  renderizarBobinasSaida();
  document.getElementById('modalSaida').classList.remove('hidden');
}

function aplicarCombinacao(indice) {
  if (indice < 0 || indice >= saidaAtual.combinacoes.length) return;
  saidaAtual.comboAtual = indice;
  saidaAtual.descontos = {};
  saidaAtual.zeradas = [];

  saidaAtual.combinacoes[indice].forEach(idx => {
    let indexReal = historico.indexOf(saidaAtual.bobinas[idx]);
    saidaAtual.descontos[indexReal] = saidaAtual.bobinas[idx].qtd;
    saidaAtual.zeradas.push(indexReal);
  });

  renderizarBobinasSaida();
}

function proximaCombinacao() {
  let proximo = saidaAtual.comboAtual + 1;
  if (proximo >= saidaAtual.combinacoes.length) proximo = 0;
  aplicarCombinacao(proximo);
}

function combinacaoAnterior() {
  let anterior = saidaAtual.comboAtual - 1;
  if (anterior < 0) anterior = saidaAtual.combinacoes.length - 1;
  aplicarCombinacao(anterior);
}

window.proximaCombinacao = proximaCombinacao;
window.combinacaoAnterior = combinacaoAnterior;

function renderizarBobinasSaida() {
  let tbody = document.getElementById('modalSaidaBody');
  let html = '';
  let totalSelecionado = 0;
  let opPeso = Math.round(saidaAtual.pesoTotal);

  saidaAtual.bobinas.forEach((bob, idx) => {
    let indexReal = historico.indexOf(bob);
    let selecionada = saidaAtual.zeradas.includes(indexReal);
    if (selecionada) totalSelecionado += bob.qtd;

    let classe = '';
    if (selecionada) {
      classe = 'bobina-marcada';
    }

    html += `
      <tr class="${classe}">
        <td>
          <input
            type="radio"
            ${selecionada ? 'checked' : ''}
            onclick="selecionarBobinaSaida(${indexReal})"
            style="width:18px;height:18px;margin:0;cursor:pointer;"
          >
        </td>
        <td style="font-size:14px;"><strong>${idx + 1}</strong></td>
        <td style="font-size:13px;">${bob.data}</td>
        <td style="font-size:15px;"><strong>${formatarPeso(bob.qtd)}</strong></td>
      </tr>
    `;
  });

  tbody.innerHTML = html;

  let diferenca = totalSelecionado - opPeso;

  // ===== TÍTULO =====
  let titulo = document.getElementById('modalSaidaTitulo');
  let partes = saidaAtual.identificador.split(' - V');
  let item = partes[0];
  let versao = partes[1] || '';
  let tipo = descobrirTipoPorItem(item);

  let corTipo = '#64748b', fundoTipo = '#f1f5f9';
  if (tipo === 'brf') { corTipo = '#1d4ed8'; fundoTipo = '#dbeafe'; }
  else if (tipo === 'tampas') { corTipo = '#15803d'; fundoTipo = '#dcfce7'; }
  else if (tipo === 'laminacao') { corTipo = '#c2410c'; fundoTipo = '#ffedd5'; }

  let iconeAtivo = modoSugestao === 'peso' ? '⚖️' : '📅';
  let tooltipAtivo = modoSugestao === 'peso' ? 'Modo: melhor peso' : 'Modo: mais antigas';

  titulo.innerHTML = `
    <div style="
      display:flex;
      align-items:center;
      justify-content:space-between;
      width:100%;
      gap:6px;
    ">
      <div style="
        display:flex;
        align-items:center;
        gap:6px;
        line-height:1.2;
        overflow:hidden;
      ">
        <span style="
          display:inline-flex;
          align-items:center;
          padding:2px 7px;
          border-radius:999px;
          font-size:10px;
          font-weight:700;
          letter-spacing:0.3px;
          background:${fundoTipo};
          color:${corTipo};
          white-space:nowrap;
          flex-shrink:0;
        ">${nomeBonitoTipo(tipo)}</span>

        <span style="
          font-size:15px;
          font-weight:700;
          color:#0f172a;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        ">${item}</span>

        <span style="
          display:inline-flex;
          align-items:center;
          padding:2px 6px;
          border-radius:999px;
          font-size:11px;
          font-weight:700;
          background:#e2e8f0;
          color:#475569;
          flex-shrink:0;
        ">V${versao}</span>
      </div>

      <button onclick="alternarModoSugestao()" title="${tooltipAtivo}" style="
        width:32px;
        height:32px;
        padding:0;
        border:1px solid #e2e8f0;
        border-radius:8px;
        background:#f8fafc;
        cursor:pointer;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        font-size:16px;
        flex-shrink:0;
        transition:transform 0.1s ease;
      ">${iconeAtivo}</button>
    </div>
  `;

  // ===== STATUS =====
  let statusTexto = '';
  let statusCor = '#dc2626';

  if (totalSelecionado === 0) {
    statusTexto = `${formatarPeso(0)} / ${formatarPeso(opPeso)}`;
    statusCor = '#dc2626';
  } else {
    if (diferenca === 0) {
      statusTexto = `${formatarPeso(totalSelecionado)} / ${formatarPeso(opPeso)}`;
      statusCor = '#16a34a';
    } else if (diferenca > 0) {
      statusTexto = `${formatarPeso(totalSelecionado)} / ${formatarPeso(opPeso)} (+${formatarPeso(diferenca)} kg)`;
      statusCor = '#16a34a';
    } else {
      statusTexto = `${formatarPeso(totalSelecionado)} / ${formatarPeso(opPeso)} (-${formatarPeso(Math.abs(diferenca))} kg)`;
      statusCor = '#dc2626';
    }
  }

  // ===== BLOCO SUGESTÕES =====
  let containerStatus = document.getElementById('saidaStatusContainer');
  let headerSaida = document.querySelector('#modalSaida .modal-saida-header');

  if (!containerStatus) {
    containerStatus = document.createElement('div');
    containerStatus.id = 'saidaStatusContainer';

    let restanteAntigo = document.getElementById('modalSaidaRestante');
    if (restanteAntigo) restanteAntigo.style.display = 'none';

    if (headerSaida) {
      headerSaida.style.paddingBottom = '4px';
      headerSaida.insertAdjacentElement('afterend', containerStatus);
    }
  }

  containerStatus.style.cssText = `
    width:100%;
    margin:4px 0 6px;
    display:flex;
    flex-direction:column;
    gap:4px;
    border-bottom:1px solid #e2e8f0;
    padding-bottom:8px;
  `;

  // Botões de navegação
  let navHtml = '';
  if (saidaAtual.combinacoes.length > 1) {
    navHtml = `
      <button onclick="combinacaoAnterior()" style="
        width:28px;
        height:28px;
        padding:0;
        border:none;
        border-radius:6px;
        background:#1e3a8a;
        color:#ffffff;
        cursor:pointer;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        font-size:12px;
        font-weight:700;
        flex-shrink:0;
      ">◀</button>

      <span style="
        font-size:12px;
        font-weight:600;
        color:#64748b;
        min-width:30px;
        text-align:center;
        font-variant-numeric:tabular-nums;
        flex-shrink:0;
      ">${saidaAtual.comboAtual + 1}/${saidaAtual.combinacoes.length}</span>

      <button onclick="proximaCombinacao()" style="
        width:28px;
        height:28px;
        padding:0;
        border:none;
        border-radius:6px;
        background:#1e3a8a;
        color:#ffffff;
        cursor:pointer;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        font-size:12px;
        font-weight:700;
        flex-shrink:0;
      ">▶</button>
    `;
  }

      let totalBobinas = saidaAtual.bobinas.length;
  let selecionadas = saidaAtual.zeradas.length;

  let labelModo = modoSugestao === 'peso' ? 'Sugestões por peso:' : 'Sugestões por idade:';

  let labelSugestao = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
      <span style="font-size:11px; color:#94a3b8; font-weight:500;">
        ${saidaAtual.combinacoes.length > 1 ? labelModo : ''}
      </span>
      <span style="font-size:12px; font-weight:600; color:${selecionadas > 0 ? '#1e3a8a' : '#94a3b8'};">
        ${selecionadas} / ${totalBobinas} bobinas
      </span>
    </div>
  `;

  containerStatus.innerHTML = `
    ${labelSugestao}
    <div style="
      display:flex;
      align-items:center;
      justify-content:flex-end;
      width:100%;
      gap:6px;
    ">
      <div style="
        font-size:15px;
        font-weight:700;
        color:${statusCor};
        font-variant-numeric:tabular-nums;
        white-space:nowrap;
      ">${statusTexto}</div>

      <div style="
        display:flex;
        align-items:center;
        gap:4px;
        flex-shrink:0;
      ">
        ${navHtml}
      </div>
    </div>
  `;

  // Botão desmarcar no cabeçalho da tabela
  let thDesmarcar = document.getElementById('thDesmarcar');
  if (thDesmarcar) {
    if (selecionadas > 0) {
      thDesmarcar.innerHTML = `<input type="radio" checked onclick="desmarcarTodasBobinas()" style="width:18px;height:18px;margin:0;cursor:pointer;" title="Desmarcar todas">`;
    } else {
      thDesmarcar.innerHTML = '';
    }
  }
}

function selecionarBobinaSaida(indexReal) {
  let bob = historico[indexReal];
  if (!bob) return;

  let pos = saidaAtual.zeradas.indexOf(indexReal);
  if (pos !== -1) {
    saidaAtual.zeradas.splice(pos, 1);
    delete saidaAtual.descontos[indexReal];
  } else {
    saidaAtual.descontos[indexReal] = bob.qtd;
    saidaAtual.zeradas.push(indexReal);
  }

  renderizarBobinasSaida();
}

function desmarcarTodasBobinas() {
  saidaAtual.descontos = {};
  saidaAtual.zeradas = [];
  renderizarBobinasSaida();
}

window.desmarcarTodasBobinas = desmarcarTodasBobinas;

function confirmarSaida() {
  if (saidaAtual.zeradas.length === 0) {
    mostrarToast('Selecione pelo menos uma bobina', 'erro');
    return;
  }

  let totalSelecionado = saidaAtual.zeradas.reduce((acc, idx) => acc + (historico[idx] ? historico[idx].qtd : 0), 0);

  if (totalSelecionado < saidaAtual.pesoTotal) {
    if (!confirm('Peso selecionado (' + Math.round(totalSelecionado) + ' kg) é menor que o pedido (' + Math.round(saidaAtual.pesoTotal) + ' kg).\n\nConfirmar mesmo assim?')) return;
  }

  processarZeradas(0);
}

function processarZeradas(indice) {
  if (indice >= saidaAtual.zeradas.length) { finalizarSaida(); return; }
  bobinaZeradaAtual = { indexReal: saidaAtual.zeradas[indice], indiceZerada: indice };
  let bob = historico[bobinaZeradaAtual.indexReal];
  document.getElementById('modalZerouTexto').textContent = 'Bobina #' + (saidaAtual.bobinas.indexOf(bob)+1) + ' — ' + Math.round(bob.qtd) + ' kg';
  document.getElementById('modalZerou').classList.remove('hidden');
}

function zerouConsumir() {
  historico[bobinaZeradaAtual.indexReal]._consumir = true;
  document.getElementById('modalZerou').classList.add('hidden');
  processarZeradas(bobinaZeradaAtual.indiceZerada + 1);
}

function zerouExcluir() {
  historico[bobinaZeradaAtual.indexReal]._excluir = true;
  document.getElementById('modalZerou').classList.add('hidden');
  processarZeradas(bobinaZeradaAtual.indiceZerada + 1);
}

function finalizarSaida() {
  salvarEstadoParaDesfazer();

  let bobsConsumidas = saidaAtual.zeradas.filter(idx => historico[idx] && historico[idx]._consumir);
  let bobsExcluidas = saidaAtual.zeradas.filter(idx => historico[idx] && historico[idx]._excluir);

  let partesMsg = saidaAtual.identificador.split(" - V");
  let itemNome = partesMsg[0], versaoNome = partesMsg[1];
  let mensagemFinal = "";
  let totalSaiu = 0;

  // Processar consumidas
  bobsConsumidas.forEach(idx => {
    let bob = historico[idx];
    if (!bob) return;
    bob.consumida = true;
    totalSaiu += bob.qtd;
    historico.push({
      id: crypto.randomUUID(),
      data: new Date().toLocaleString(),
      tipo: 'Consumo',
      item: saidaAtual.identificador,
      qtd: bob.qtd,
      refEntradaId: bob.id,
      refEntradaData: bob.data
    });
    mensagemFinal += "Bobina consumida (" + itemNome + ", V" + versaoNome + ", " + Math.round(bob.qtd) + "kg)\n";
    delete bob._consumir;
  });

  // Processar excluídas
  bobsExcluidas.forEach(idx => {
    let bob = historico[idx];
    if (!bob) return;
    bob._removidaEstoque = true;
    totalSaiu += bob.qtd;
    historico.push({
      id: crypto.randomUUID(),
      data: new Date().toLocaleString(),
      tipo: 'Exclusão',
      item: saidaAtual.identificador,
      qtd: bob.qtd,
      refEntradaId: bob.id,
      refEntradaData: bob.data
    });
    mensagemFinal += "Bobina excluída (" + itemNome + ", V" + versaoNome + ", " + Math.round(bob.qtd) + "kg)\n";
    delete bob._excluir;
  });

  // Atualizar estoque
  if (estoque[saidaAtual.identificador]) {
    estoque[saidaAtual.identificador] -= totalSaiu;
    let qtdKey = saidaAtual.identificador + '_qtd';
    if (estoque[qtdKey]) {
      estoque[qtdKey] -= saidaAtual.zeradas.length;
      if (estoque[qtdKey] < 0) estoque[qtdKey] = 0;
    }
    if (estoque[saidaAtual.identificador] <= 0) {
      delete estoque[saidaAtual.identificador];
      delete estoque[saidaAtual.identificador + '_qtd'];
    }
  }

  // Limpar flags temporárias
  for (let i = historico.length - 1; i >= 0; i--) {
    if (!historico[i]) continue;
    if (historico[i]._excluir) delete historico[i]._excluir;
    if (historico[i]._consumir) delete historico[i]._consumir;
  }

  salvarDados();
  atualizarTabela();
  atualizarHistorico();
  document.getElementById('modalSaida').classList.add('hidden');

  tipoSelect.value = '';
  itemSelect.innerHTML = '<option value="">Selecionar item</option>';
  versaoSelect.innerHTML = '<option value="">Selecionar versão</option>';
  quantidade.value = '';
  document.getElementById('buscaItem').value = '';
  if (saldoAtual) saidaAtual.innerHTML = "";

  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  mostrarToast('Saída aplicada — ' + Math.round(totalSaiu) + ' kg');
  setTimeout(function() { if (mensagemFinal) alert(mensagemFinal); }, 150);
}

function cancelarSaida() {
  saidaAtual = { identificador: null, pesoTotal: 0, pesoRestante: 0, bobinas: [], descontos: {}, zeradas: [] };
  document.getElementById('modalSaida').classList.add('hidden');
}

/* ================= LONG PRESS LIMPAR TUDO ================= */

document.addEventListener("DOMContentLoaded", function() {
  configurarLongPress(document.getElementById('btnLimparEstoque'), function() {
    if (!confirm("⚠️ ATENÇÃO!\n\nDeseja excluir TODO o estoque?\n\nAs exclusões serão registradas no histórico.")) return;
    salvarEstadoParaDesfazer();
    let alterou = excluirTodoEstoqueComHistorico();
    salvarDados();
    atualizarTabela();
    atualizarHistorico();
    if (tipoDetalheAtual) atualizarDetalhes();
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    if (alterou) mostrarToast('Estoque excluído');
    else mostrarToast('Nenhum item no estoque', 'erro');
  });

  configurarLongPress(document.getElementById('btnLimparHistorico'), function() {
    if (!confirm("⚠️ ATENÇÃO!\n\nDeseja limpar o histórico?\n\nRegistros de bobinas que ainda estão no estoque serão mantidos.")) return;
    historico = historico.filter(h => h.tipo === "Entrada" && !h.consumida && !h._removidaEstoque && estoque[h.item] > 0);
    salvarDados();
    atualizarHistorico();
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    mostrarToast('Histórico limpo');
  });

  configurarLongPress(document.getElementById('btnLimparDetalhes'), function() {
    if (!tipoDetalheAtual) return;
    let nomeTipo = nomeCompletoTipo(tipoDetalheAtual);
    if (!confirm("⚠️ ATENÇÃO!\n\nDeseja excluir todo o estoque de " + nomeTipo + "?\n\nAs exclusões serão registradas no histórico.")) return;
    salvarEstadoParaDesfazer();
    let alterou = excluirEstoquePorTipoComHistorico(tipoDetalheAtual);
    salvarDados();
    atualizarTabela();
    atualizarHistorico();
    atualizarDetalhes();
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    if (alterou) mostrarToast(nomeTipo + ' excluído');
    else mostrarToast('Nenhum item de ' + nomeTipo, 'erro');
  });

  let btnLimparFiltro = document.getElementById("btnLimparFiltro");
  if (btnLimparFiltro) {
    btnLimparFiltro.addEventListener("click", function() {
      document.getElementById("dataInicio").value = "";
      document.getElementById("dataFim").value = "";
      document.getElementById("buscaHistorico").value = "";
      atualizarHistorico();
    });
  }

  let modalGer = document.getElementById('modalGerador');
  if (modalGer) {
    modalGer.addEventListener('click', function(e) {
      if (e.target === this) geradorFecharSimples();
    });
  }

  let modalPend = document.getElementById('modalPendentes');
  if (modalPend) {
    modalPend.addEventListener('click', function(e) {
      if (e.target === this) fecharPendentes();
    });
  }
});

/* ================= REMOVER HISTÓRICO ================= */

window.removerHistorico = function(i) {
  let registro = historico[i];
  if (!registro) return;
  if (registro.tipo === "Entrada" && !registro.consumida && !registro._removidaEstoque && estoque[registro.item] && estoque[registro.item] > 0) {
    if (confirm("❌ Não é permitido excluir uma entrada ativa no estoque.\n\nDeseja localizar esta bobina nos detalhes do tipo?")) {
      irParaBobinaNosDetalhes(registro, i);
    }
    return;
  }
  if (!confirm("Tem certeza que deseja remover este registro do histórico?")) return;
  salvarEstadoParaDesfazer();
  historico.splice(i, 1);
  salvarDados();
  atualizarHistorico();
  mostrarToast('Registro removido');
};

/* ================= MENU CONFIGURAÇÕES ================= */

function configOcultarTodasAsTelas() {
  ['configMenuPrincipal', 'configTelaExportar', 'configTelaBackup', 'configTelaCadastro'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('hidden');
    el.style.display = 'none';
  });
}

function configMostrarTela(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  el.style.gap = '8px';
}

function abrirModalConfig() {
  const modal = document.getElementById('modalConfig');
  if (!modal) return;
  modal.removeAttribute('style');
  modal.classList.remove('hidden');
  voltarConfigPrincipal();
}

function fecharModalConfig() {
  const modal = document.getElementById('modalConfig');
  if (!modal) return;
  modal.classList.add('hidden');
}

function voltarConfigPrincipal() {
  const titulo = document.getElementById('configTitulo');
  if (titulo) titulo.textContent = 'Configurações';

  configOcultarTodasAsTelas();
  configMostrarTela('configMenuPrincipal');
}

function abrirConfigExportar() {
  const titulo = document.getElementById('configTitulo');
  if (titulo) titulo.textContent = 'Exportar dados';

  configOcultarTodasAsTelas();
  configMostrarTela('configTelaExportar');

  if (typeof resetarMenuExportar === 'function') resetarMenuExportar();
}

function abrirConfigBackup() {
  const titulo = document.getElementById('configTitulo');
  if (titulo) titulo.textContent = 'Backup / Restaurar';

  configOcultarTodasAsTelas();
  configMostrarTela('configTelaBackup');
}

function abrirConfigCadastro() {
  const titulo = document.getElementById('configTitulo');
  if (titulo) titulo.textContent = 'Gerenciar cadastro';

  configOcultarTodasAsTelas();
  configMostrarTela('configTelaCadastro');

  if (typeof renderizarCadastro === 'function') renderizarCadastro();
}

function alternarModoEscuro() {
  document.body.classList.toggle('dark-mode');
  let ativo = document.body.classList.contains('dark-mode');
  localStorage.setItem('modoEscuro', ativo);

  let toggle = document.getElementById('darkModeToggle');
  if (toggle) toggle.checked = ativo;

  let icone = document.getElementById('darkModeIcon');
  if (icone) icone.textContent = ativo ? '☀️' : '🌙';
}

/* ================= SISTEMA DE DESFAZER / REFAZER ================= */

let pilhaDesfazer = [];
let pilhaRefazer = [];
const MAX_DESFAZER = 10;

function salvarEstadoParaDesfazer() {
  let snapshot = {
    estoque: JSON.parse(JSON.stringify(estoque)),
    historico: JSON.parse(JSON.stringify(historico))
  };
  pilhaDesfazer.push(snapshot);
  if (pilhaDesfazer.length > MAX_DESFAZER) pilhaDesfazer.shift();
  pilhaRefazer = [];
  atualizarBotoesDesfazerRefazer();
}

window.desfazerAcao = function() {
  if (pilhaDesfazer.length === 0) return;
  pilhaRefazer.push({
    estoque: JSON.parse(JSON.stringify(estoque)),
    historico: JSON.parse(JSON.stringify(historico))
  });
  if (pilhaRefazer.length > MAX_DESFAZER) pilhaRefazer.shift();
  let snapshot = pilhaDesfazer.pop();
  estoque = JSON.parse(JSON.stringify(snapshot.estoque));
  historico = JSON.parse(JSON.stringify(snapshot.historico));
  salvarDados();
  atualizarTudo();
  atualizarBotoesDesfazerRefazer();
  if (navigator.vibrate) navigator.vibrate([50]);
};

window.refazerAcao = function() {
  if (pilhaRefazer.length === 0) return;
  pilhaDesfazer.push({
    estoque: JSON.parse(JSON.stringify(estoque)),
    historico: JSON.parse(JSON.stringify(historico))
  });
  if (pilhaDesfazer.length > MAX_DESFAZER) pilhaDesfazer.shift();
  let snapshot = pilhaRefazer.pop();
  estoque = JSON.parse(JSON.stringify(snapshot.estoque));
  historico = JSON.parse(JSON.stringify(snapshot.historico));
  salvarDados();
  atualizarTudo();
  atualizarBotoesDesfazerRefazer();
  if (navigator.vibrate) navigator.vibrate([50]);
};

function atualizarBotoesDesfazerRefazer() {
  let btnUndo = document.getElementById('btnDesfazer');
  let btnRedo = document.getElementById('btnRefazer');
  if (btnUndo) {
    if (pilhaDesfazer.length > 0) { btnUndo.classList.add('ativo'); btnUndo.title = 'Desfazer (' + pilhaDesfazer.length + ')'; }
    else { btnUndo.classList.remove('ativo'); btnUndo.title = 'Nada para desfazer'; }
  }
  if (btnRedo) {
    if (pilhaRefazer.length > 0) { btnRedo.classList.add('ativo'); btnRedo.title = 'Refazer (' + pilhaRefazer.length + ')'; }
    else { btnRedo.classList.remove('ativo'); btnRedo.title = 'Nada para refazer'; }
  }
}

/* ================= GERENCIAR CADASTRO ================= */

window.abrirConfigCadastro = function() {
  document.getElementById('configTitulo').textContent = 'Gerenciar cadastro';
  document.getElementById('configMenuPrincipal').classList.add('hidden');
  document.getElementById('configTelaExportar').classList.add('hidden');
  document.getElementById('configTelaBackup').classList.add('hidden');
  document.getElementById('configTelaCadastro').classList.remove('hidden');
  renderizarCadastro();
};

function renderizarCadastro() {
  let container = document.getElementById('cadastroAcordeao');
  let tiposAbertos = [];
  let itensAbertos = [];
  container.querySelectorAll('.cad-tipo.aberto').forEach(el => { tiposAbertos.push(el.dataset.tipo); });
  container.querySelectorAll('.cad-item.aberto').forEach(el => { itensAbertos.push(el.dataset.tipo + '|' + el.dataset.item); });
  container.innerHTML = '';

  let tipos = [
    { chave: 'brf', nome: 'BRF' },
    { chave: 'tampas', nome: 'Tampas' },
    { chave: 'laminacao', nome: '1ª Laminação' }
  ];

  tipos.forEach(tipo => {
    if (!banco[tipo.chave]) banco[tipo.chave] = {};
    let itens = Object.keys(banco[tipo.chave]).sort();
    let totalVersoes = itens.reduce((acc, item) => acc + Object.keys(banco[tipo.chave][item]).length, 0);

    let divTipo = document.createElement('div');
    divTipo.className = 'cad-tipo';
    divTipo.dataset.tipo = tipo.chave;
    if (tiposAbertos.includes(tipo.chave)) divTipo.classList.add('aberto');

    let header = document.createElement('button');
    header.className = 'cad-tipo-header';
    header.innerHTML = `
      <span>${tipo.nome} <span style="font-weight:400; font-size:12px; opacity:0.7;">(${itens.length} itens, ${totalVersoes} versões)</span></span>
      <span class="cad-seta">▶</span>
    `;
    header.onclick = function() { divTipo.classList.toggle('aberto'); };

    let body = document.createElement('div');
    body.className = 'cad-tipo-body';

    itens.forEach(itemNome => {
      let versoes = Object.keys(banco[tipo.chave][itemNome]).sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0));
      let divItem = document.createElement('div');
      divItem.className = 'cad-item';
      divItem.dataset.tipo = tipo.chave;
      divItem.dataset.item = itemNome;
      if (itensAbertos.includes(tipo.chave + '|' + itemNome)) divItem.classList.add('aberto');

      let itemHeader = document.createElement('button');
      itemHeader.className = 'cad-item-header';
      itemHeader.innerHTML = `
        <span class="cad-seta">▶</span>
        <span class="cad-item-nome">${itemNome}</span>
        <span class="cad-item-qtd">${versoes.length}v</span>
        <span class="cad-btn-mini" title="Renomear" onclick="event.stopPropagation(); editarNomeItem('${tipo.chave}', '${itemNome}')">✏️</span>
        <span class="cad-btn-mini excluir" title="Excluir item" onclick="event.stopPropagation(); removerItem('${tipo.chave}', '${itemNome}')">🗑️</span>
      `;
      itemHeader.onclick = function(e) {
        if (e.target.classList.contains('cad-btn-mini')) return;
        divItem.classList.toggle('aberto');
      };

      let itemBody = document.createElement('div');
      itemBody.className = 'cad-item-body';

      versoes.forEach(v => {
        let tamanho = banco[tipo.chave][itemNome][v].tamanho || '';
        let divVersao = document.createElement('div');
        divVersao.className = 'cad-versao';
        divVersao.innerHTML = `
          <div class="cad-versao-info">
            <span class="cad-versao-nome">V${v}</span>
            <span class="cad-versao-tamanho">${tamanho}</span>
          </div>
          <div class="cad-versao-acoes">
            <button class="cad-btn-mini" onclick="editarVersao('${tipo.chave}', '${itemNome}', '${v}')" title="Editar">✏️</button>
            <button class="cad-btn-mini excluir" onclick="removerVersao('${tipo.chave}', '${itemNome}', '${v}')" title="Excluir">🗑️</button>
          </div>
        `;
        itemBody.appendChild(divVersao);
      });

      let btnAddVersao = document.createElement('button');
      btnAddVersao.className = 'cad-btn-add';
      btnAddVersao.textContent = '+ Adicionar versão';
      btnAddVersao.onclick = function() { adicionarVersao(tipo.chave, itemNome); };
      itemBody.appendChild(btnAddVersao);

      divItem.appendChild(itemHeader);
      divItem.appendChild(itemBody);
      body.appendChild(divItem);
    });

    let btnAddItem = document.createElement('button');
    btnAddItem.className = 'cad-btn-add';
    btnAddItem.textContent = '+ Adicionar item';
    btnAddItem.onclick = function() { adicionarItem(tipo.chave); };
    body.appendChild(btnAddItem);

    divTipo.appendChild(header);
    divTipo.appendChild(body);
    container.appendChild(divTipo);
  });
}

window.adicionarItem = function(tipo) {
  let nome = prompt("Nome do novo item:");
  if (!nome || !nome.trim()) return;
  nome = nome.trim();
  if (banco[tipo][nome]) { mostrarToast('Este item já existe!', 'erro'); return; }
  banco[tipo][nome] = {};
  salvarBanco();
  renderizarCadastro();
  mostrarToast('Item adicionado');
};

window.editarNomeItem = function(tipo, itemAntigo) {
  let novoNome = prompt("Novo nome para o item:", itemAntigo);
  if (!novoNome || !novoNome.trim() || novoNome.trim() === itemAntigo) return;
  novoNome = novoNome.trim();
  if (banco[tipo][novoNome]) { mostrarToast('Já existe um item com este nome!', 'erro'); return; }
  let temEstoque = Object.keys(estoque).some(chave => chave.startsWith(itemAntigo + " - V"));
  if (temEstoque) {
    if (!confirm("Este item possui entradas no estoque.\n\nAs chaves serão atualizadas.\n\nDeseja continuar?")) return;
    Object.keys(estoque).forEach(chave => {
      if (chave.startsWith(itemAntigo + " - V")) {
        let novaChave = chave.replace(itemAntigo, novoNome);
        estoque[novaChave] = estoque[chave];
        delete estoque[chave];
        if (estoque[chave + '_qtd'] !== undefined) {
          estoque[novaChave + '_qtd'] = estoque[chave + '_qtd'];
          delete estoque[chave + '_qtd'];
        }
      }
    });
    historico.forEach(h => {
      if (h.item && h.item.startsWith(itemAntigo + " - V")) h.item = h.item.replace(itemAntigo, novoNome);
    });
    salvarDados();
  }
  banco[tipo][novoNome] = banco[tipo][itemAntigo];
  delete banco[tipo][itemAntigo];
  salvarBanco();
  renderizarCadastro();
  atualizarTudo();
  mostrarToast('Item renomeado');
};

window.removerItem = function(tipo, item) {
  let versoes = Object.keys(banco[tipo][item]).length;
  if (!confirm("Excluir " + item + " e suas " + versoes + " versão(ões)?")) return;
  delete banco[tipo][item];
  salvarBanco();
  renderizarCadastro();
  mostrarToast('Item excluído');
};

window.adicionarVersao = function(tipo, item) {
  let versao = prompt("Número da versão:");
  if (!versao || !versao.trim()) return;
  versao = versao.trim();
  if (banco[tipo][item][versao]) { mostrarToast('Esta versão já existe!', 'erro'); return; }
  let tamanho = prompt("Medidas (ex: 66 x 60):");
  if (!tamanho || !tamanho.trim()) return;
  banco[tipo][item][versao] = { tamanho: tamanho.trim() };
  salvarBanco();
  renderizarCadastro();
  mostrarToast('Versão adicionada');
};

window.editarVersao = function(tipo, item, versao) {
  let dados = banco[tipo][item][versao];
  let novaVersao = prompt("Número da versão:", versao);
  if (!novaVersao || !novaVersao.trim()) return;
  novaVersao = novaVersao.trim();
  let novoTamanho = prompt("Medidas:", dados.tamanho || '');
  if (!novoTamanho || !novoTamanho.trim()) return;
  novoTamanho = novoTamanho.trim();
  if (novaVersao !== versao) {
    if (banco[tipo][item][novaVersao]) { mostrarToast('Já existe uma versão com este número!', 'erro'); return; }
    let chaveAntiga = item + " - V" + versao;
    let chaveNova = item + " - V" + novaVersao;
    if (estoque[chaveAntiga] !== undefined) {
      if (!confirm("Esta versão possui entradas no estoque.\n\nAs chaves serão atualizadas.\n\nDeseja continuar?")) return;
      estoque[chaveNova] = estoque[chaveAntiga];
      delete estoque[chaveAntiga];
      if (estoque[chaveAntiga + '_qtd'] !== undefined) {
        estoque[chaveNova + '_qtd'] = estoque[chaveAntiga + '_qtd'];
        delete estoque[chaveAntiga + '_qtd'];
      }
      historico.forEach(h => { if (h.item === chaveAntiga) h.item = chaveNova; });
      salvarDados();
    }
    delete banco[tipo][item][versao];
  }
  banco[tipo][item][novaVersao] = { tamanho: novoTamanho };
  salvarBanco();
  renderizarCadastro();
  atualizarTudo();
  mostrarToast('Versão atualizada');
};

window.removerVersao = function(tipo, item, versao) {
  if (!confirm("Excluir a versão V" + versao + "?")) return;
  delete banco[tipo][item][versao];
  if (Object.keys(banco[tipo][item]).length === 0) {
    delete banco[tipo][item];
    salvarBanco();
    renderizarCadastro();
    mostrarToast('Versão e item excluídos');
    return;
  }
  salvarBanco();
  renderizarCadastro();
  mostrarToast('Versão excluída');
};

/* ================= QR CODE ================= */

function gerarQRBobina(index) {
  let reg = historico[index];
  if (!reg || reg.tipo !== "Entrada") return;

  let partes = reg.item.split(" - V");
  let item = partes[0], versao = partes[1];
  let tipo = "";
  Object.keys(banco).forEach(t => { if (banco[t] && banco[t][item]) tipo = t; });

  let tamanho = "";
  if (tipo && banco[tipo] && banco[tipo][item] && banco[tipo][item][versao]) {
    tamanho = banco[tipo][item][versao].tamanho;
  }

  let dataQR = "", dataProducao = "";
  if (reg.data) {
    let partesData = reg.data.split(", ");
    if (partesData.length === 2) {
      let dma = partesData[0].split("/");
      let hms = partesData[1].replace(/:/g, "");
      if (dma.length === 3 && hms.length === 6) {
        dataQR = dma[0] + dma[1] + dma[2] + "/" + hms;
        dataProducao = dma[0] + "/" + dma[1] + "/" + dma[2] + " às " + partesData[1];
      }
    }
  }

  let idCurto = '';
  if (reg.id && typeof reg.id === 'string') {
    idCurto = reg.id.includes('-') ? reg.id.replace(/-/g, '').substring(0, 8) : reg.id.substring(0, 8);
  }

  let conteudoQR = 'BOB/' + item + "/" + versao + "/" + Math.round(reg.qtd);
  if (dataQR) conteudoQR += "/" + dataQR;
  if (idCurto) conteudoQR += "/" + idCurto;

  let container = document.getElementById("qrContainer");
  container.innerHTML = "";

    // QR Code
  let qrWrapper = document.createElement("div");
  qrWrapper.style.cssText = "display:flex; justify-content:center; padding:8px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;";
  container.appendChild(qrWrapper);

  new QRCode(qrWrapper, {
    text: conteudoQR,
    width: 200,
    height: 200,
    colorDark: "#1e293b",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });

  // Informações — tudo numa linha + peso e data separados
  let corTipo = tipo === 'brf' ? '#3b82f6' : tipo === 'tampas' ? '#16a34a' : tipo === 'laminacao' ? '#ea580c' : '#64748b';
  let bgTipo = tipo === 'brf' ? '#dbeafe' : tipo === 'tampas' ? '#dcfce7' : tipo === 'laminacao' ? '#ffedd5' : '#f1f5f9';

  let infoDiv = document.createElement("div");
  infoDiv.style.cssText = "text-align:center; margin-top:14px; display:flex; flex-direction:column; gap:6px;";
  infoDiv.innerHTML = `
    <div style="font-size:14px; font-weight:600; color:#1e293b;">
      <span style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; padding:2px 6px; border-radius:4px; background:${bgTipo}; color:${corTipo}; margin-right:6px;">${nomeCompletoTipo(tipo)}</span>
      ${item} · V${versao} · ${tamanho}
    </div>
    <div style="font-size:22px; font-weight:800; color:#1e3a8a;">${Math.round(reg.qtd)} kg</div>
    <div style="font-size:11px; color:#94a3b8;">📅 ${dataProducao ? dataProducao.replace(' às ', ' - ') : 'Sem data'}</div>
  `;
  container.appendChild(infoDiv);

  // Status — só mostra se consumida ou excluída
  if (reg.consumida || reg._removidaEstoque) {
    let statusDiv = document.createElement("div");
    statusDiv.style.cssText = "text-align:center; margin-top:4px;";
    if (reg.consumida) {
      statusDiv.innerHTML = '<span style="font-size:12px; padding:3px 10px; border-radius:6px; background:#fefce8; color:#ca8a04; font-weight:600;">⚠️ Consumida</span>';
    } else {
      statusDiv.innerHTML = '<span style="font-size:12px; padding:3px 10px; border-radius:6px; background:#fef2f2; color:#dc2626; font-weight:600;">🚫 Excluída</span>';
    }
    container.appendChild(statusDiv);
  }

  // Botão salvar imagem
  let salvarDiv = document.createElement("div");
  salvarDiv.style.cssText = "text-align:center; margin-top:10px;";
  salvarDiv.innerHTML = `<button onclick="salvarImagemQR('${item}', '${versao}', ${Math.round(reg.qtd)})" style="
    background:#1e3a8a;
    color:white;
    border:none;
    border-radius:8px;
    padding:8px 16px;
    font-size:13px;
    font-weight:600;
    cursor:pointer;
    width:100%;
  ">📥 Salvar imagem</button>`;
  container.appendChild(salvarDiv);

  document.getElementById("modalQR").classList.remove("hidden");
}

function salvarImagemQR(item, versao, peso) {
  let qrWrapper = document.querySelector('#qrContainer > div:nth-child(2)');
  if (!qrWrapper) { mostrarToast('Erro ao gerar imagem', 'erro'); return; }

  let qrCanvas = qrWrapper.querySelector('canvas');
  let qrImg = qrWrapper.querySelector('img');
  let qrSrc = '';

  if (qrCanvas) {
    qrSrc = qrCanvas.toDataURL('image/png');
  } else if (qrImg && qrImg.src) {
    qrSrc = qrImg.src;
  }

  if (!qrSrc) { mostrarToast('QR não encontrado', 'erro'); return; }

  let canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 340;
  let ctx = canvas.getContext('2d');

  // Fundo
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 400, 340);

  let img = new Image();
  img.onload = function() {
    // QR centralizado
    ctx.drawImage(img, 100, 16, 200, 200);

    // Textos
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(item + ' — V' + versao, 200, 244);

    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText(peso + ' kg', 200, 278);

    ctx.font = '12px Arial';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Estoque Mobile', 200, 320);

    // Download
    let link = document.createElement('a');
    link.download = (item + '_V' + versao + '_' + peso + 'kg.png').replace(/[^a-zA-Z0-9._-]/g, '_');
    link.href = canvas.toDataURL('image/png');
    link.click();
    mostrarToast('Imagem salva');
  };
  img.src = qrSrc;
}

window.salvarImagemQR = salvarImagemQR;

let historicoSelecionadoIndex = null;

function abrirAcoesHistorico(index) {
  let reg = historico[index];
  if (!reg) return;
  historicoSelecionadoIndex = index;
  document.getElementById("modalHistoricoTitulo").textContent = reg.item || "Ações do registro";
  document.getElementById("btnHistoricoQR").style.display = (reg.tipo === "Entrada") ? "block" : "none";
  document.getElementById("modalHistoricoAcoes").classList.remove("hidden");
}

function fecharModalHistoricoAcoes() {
  document.getElementById("modalHistoricoAcoes").classList.add("hidden");
  historicoSelecionadoIndex = null;
}

function abrirQRDoHistorico() {
  if (historicoSelecionadoIndex === null) return;
  let idx = historicoSelecionadoIndex;
  fecharModalHistoricoAcoes();
  gerarQRBobina(idx);
}

function confirmarRemoverHistoricoSelecionado() {
  if (historicoSelecionadoIndex === null) return;
  let idx = historicoSelecionadoIndex;
  fecharModalHistoricoAcoes();
  removerHistorico(idx);
}

function fecharModalQR() {
  document.getElementById("modalQR").classList.add("hidden");
  document.getElementById("qrContainer").innerHTML = "";
}

/* ================= SCANNER QR ================= */

let leitorQR = null;
let leitorQRAberto = false;
let scannerProcessando = false;
let qrLidoAtual = null;

async function fecharTodosScanners() {
  try {
    if (leitorQR && leitorQRAberto) {
      await leitorQR.stop();
      await leitorQR.clear();
      leitorQR = null;
      leitorQRAberto = false;
    }
  } catch (e) { console.warn("Erro ao fechar scanner single:", e); }
  try {
    if (leitorContinuo && leitorContinuoAberto) {
      await leitorContinuo.stop();
      await leitorContinuo.clear();
      leitorContinuo = null;
      leitorContinuoAberto = false;
    }
  } catch (e) { console.warn("Erro ao fechar scanner contínuo:", e); }
}

async function abrirScannerQR() {
  try {
    await fecharTodosScanners();
    document.getElementById("modalScannerQR").classList.remove("hidden");
    document.getElementById("scannerStatus").textContent = "Aponte a câmera para o QR da bobina";
    document.getElementById("reader").innerHTML = "";
    leitorQR = new Html5Qrcode("reader");
    await leitorQR.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      async (decodedText) => {
        if (scannerProcessando) return;
        scannerProcessando = true;
        await processarLeituraQR(decodedText);
      },
      () => {}
    );
    leitorQRAberto = true;
  } catch (erro) {
    console.error("Erro ao abrir scanner QR:", erro);
    mostrarToast("Não foi possível abrir a câmera", "erro");
    await fecharScannerQR();
  }
}

async function fecharScannerQR() {
  try {
    if (leitorQR && leitorQRAberto) {
      await leitorQR.stop();
      await leitorQR.clear();
    }
  } catch (e) { console.warn("Erro ao fechar scanner:", e); }
  leitorQR = null;
  leitorQRAberto = false;
  scannerProcessando = false;
  const modal = document.getElementById("modalScannerQR");
  if (modal) modal.classList.add("hidden");
  const reader = document.getElementById("reader");
  if (reader) reader.innerHTML = "";
}

async function processarLeituraQR(textoLido) {
  let dados = null;
  try { dados = JSON.parse(textoLido); }
  catch (e) { dados = interpretarQRSimplificado(textoLido); }
  if (!dados) {
    await fecharScannerQR();
    mostrarToast("QR inválido ou fora do padrão", "erro");
    return;
  }
  let registroEncontrado = localizarRegistroPorQR(dados);
  await fecharScannerQR();
  mostrarResultadoQR(dados, registroEncontrado);
  scannerProcessando = false;
}

function interpretarQRSimplificado(texto) {
  if (!texto || !texto.includes("/")) return null;
  let partes = texto.split("/");
  
  // Remove prefixo BOB se existir
  if (partes[0] === 'BOB') partes.shift();
  
  if (partes.length < 3) return null;
  
  let item = partes[0], versao = partes[1];
  let peso = parseFloat(partes[2]);
  if (!item || !versao || isNaN(peso) || peso <= 0) return null;

  let dataFormatada = "", dataBruta = "", bobinaId = null;

  // 1. TENTA ACHAR O ID (Sempre a última parte do QR gerado pelo gerador)
  let ultimaParte = partes[partes.length - 1];
  if (ultimaParte && ultimaParte.length === 8 && /^[a-f0-9]+$/i.test(ultimaParte)) {
    bobinaId = ultimaParte;
  }

  // 2. TRATA A DATA E HORA (Se existirem)
  if (partes.length >= 5) {
    let possData = partes[3];
    let possHora = partes[4]; // Pode ser a Hora ou o ID (se não tiver hora)
    
    // Se a parte 3 for uma data válida (8 números seguidos, ex: 29042026)
    if (/^\d{8}$/.test(possData)) {
      let d = possData;
      let h = "000000"; // Hora padrão caso não exista
      
      // Se a parte 4 for uma hora válida (só números, 4 a 6 dígitos)
      if (possHora && /^\d{4,6}$/.test(possHora)) {
        h = possHora.padEnd(6, '0'); // Garante que tenha 6 casas (HHMMSS)
      }
      
      dataFormatada = d.substring(0,2) + "/" + d.substring(2,4) + "/" + d.substring(4,8) +
        ", " + h.substring(0,2) + ":" + h.substring(2,4) + ":" + h.substring(4,6);
      dataBruta = d + "/" + h;
    }
  }

  // 3. FALLBACK (Para QRs antigos que só tinham 4 partes)
  if (partes.length === 4 && !bobinaId) {
    let quarta = partes[3];
    if (/^\d{8}$/.test(quarta)) {
      dataBruta = quarta + "/000000";
      dataFormatada = quarta.substring(0,2) + "/" + quarta.substring(2,4) + "/" + quarta.substring(4,8) + ", 00:00:00";
    }
  }

  return {
    id: texto,
    bobinaId: bobinaId,
    tipo: descobrirTipoPorItem(item),
    item: item, 
    versao: versao, 
    peso: peso,
    data: dataFormatada,
    dataBruta: dataBruta
  };
}

function localizarRegistroPorQR(dados) {
  // 1. SE O QR TEM ID: Busca estritamente pelo ID
  if (dados.bobinaId) {
    let encontradoPorId = historico.find(h => {
      if (!h || h.tipo !== "Entrada") return false;
      if (!h.id) return false;
      
      // Extrai o ID curto do histórico (serve para UUID e para o formato BOB/...)
      let idCurtoHist = h.id.includes('/') 
        ? h.id.split('/').pop() 
        : h.id.replace(/-/g, '').substring(0, 8);
        
      return idCurtoHist === dados.bobinaId;
    });
    
    // Se achou pelo ID, retorna a bobina. Se não achou, retorna nulo (bobina nova).
    return encontradoPorId || null; 
  }
  
  // 2. SE O QR NÃO TEM ID (Etiquetas antigas apenas com Data/Hora):
  let qrLido = dados.item + "/" + dados.versao + "/" + Math.round(parseFloat(dados.peso));
  if (dados.dataBruta) {
      let partesBruta = dados.dataBruta.split("/");
      let dmaLido = partesBruta[0];
      let hmsLido = partesBruta[1].padEnd(6, '0');
      qrLido += "/" + dmaLido + "/" + hmsLido;
  }

  return historico.find(h => {
    if (!h || h.tipo !== "Entrada") return false;
    
    let partes = h.item.split(" - V");
    let item = partes[0], versao = partes[1];
    let qrDoHistorico = item + "/" + versao + "/" + Math.round(h.qtd);
    
    let dataParaComparar = h.dataProducao || h.data;
    if (dataParaComparar) {
      let partesH = dataParaComparar.split(", ");
      if (partesH.length === 2) {
        let dmaH = partesH[0].split("/");
        let hmsH = partesH[1].replace(/:/g, "").padEnd(6, '0');
        if (dmaH.length === 3) {
          qrDoHistorico += "/" + dmaH[0] + dmaH[1] + dmaH[2] + "/" + hmsH;
        }
      }
    }
    
    if (qrLido === qrDoHistorico) return true;
    if (dados.id && h.id === dados.id) return true;
    
    return false;
  }) || null;
}

function mostrarResultadoQR(dados, registro) {
  qrLidoAtual = { dados, registro };
  let tipo = dados.tipo || descobrirTipoPorItem(dados.item);
  let itemExiste = tipo && banco[tipo] && banco[tipo][dados.item] && banco[tipo][dados.item][String(dados.versao)];
let medida = "-";
if (itemExiste) {
  medida = banco[tipo][dados.item][String(dados.versao)].tamanho || "-";
}

  let etiquetaData = "-";
  if (dados.id && dados.id.includes("/")) {
    let partesId = dados.id.split("/");
    if (partesId.length >= 5) {
      let d = partesId[3], h = partesId[4];
      if (h.length === 4) h = h + "00";
      if (d.length === 8 && h.length === 6) {
        etiquetaData = d.substring(0,2) + "/" + d.substring(2,4) + "/" + d.substring(4,8) +
          " às " + h.substring(0,2) + ":" + h.substring(2,4) + ":" + h.substring(4,6);
      }
    }
  }
  if (etiquetaData === "-" && dados.dataBruta) {
    let d = dados.dataBruta.split("/")[0];
    let h = dados.dataBruta.split("/")[1];
    if (h && h.length === 4) h = h + "00";
    if (d && d.length === 8 && h && h.length === 6) {
      etiquetaData = d.substring(0,2) + "/" + d.substring(2,4) + "/" + d.substring(4,8) +
        " às " + h.substring(0,2) + ":" + h.substring(2,4) + ":" + h.substring(4,6);
    }
  }

  let status = "", statusTipo = "";
  if (!itemExiste) {
    status = `<div style="margin-top:8px; color:#dc2626;"><strong>❌ Erro:</strong> Item ou versão não cadastrado</div>
              <div style="margin-top:4px; padding:6px 10px; background:#fee2e2; border-radius:6px; color:#991b1b; font-size:13px; font-weight:600;">
                ⚠️ Cadastre este item em "Gerenciar cadastro" antes de movimentá-lo.
              </div>`;
    statusTipo = "erro_cadastro";
  } else if (registro) {
    if (registro._removidaEstoque) {
      status = `<div style="margin-top:8px; color:#dc2626;"><strong>🚫 Status:</strong> Bobina excluída</div>`;
      statusTipo = "excluida";
    } else if (registro.consumida) {
      status = `<div style="margin-top:8px; color:#ca8a04;"><strong>⚠️ Status:</strong> Bobina consumida</div>`;
      statusTipo = "consumida";
    } else {
      status = `<div style="margin-top:8px; color:#16a34a;"><strong>✅ Status:</strong> ativa no estoque</div>
                <div style="margin-top:4px; padding:6px 10px; background:#fef3c7; border-radius:6px; color:#92400e; font-size:13px; font-weight:600;">
                  ⚠️ Esta bobina já está no estoque — entrada duplicada não permitida
                </div>`;
      statusTipo = "ativa";
    }
  } else {
    status = `<div style="margin-top:8px; color:#3b82f6;"><strong>🆕 Status:</strong> bobina nova (não encontrada no histórico)</div>`;
    statusTipo = "nova";
  }

    document.getElementById("resultadoQRConteudo").innerHTML = `
    <div><strong>Tipo:</strong> ${tipo ? nomeCompletoTipo(tipo) : '<span style="color:#dc2626">Desconhecido</span>'}</div>
    <div><strong>Item:</strong> ${dados.item || '-'}</div>
    <div><strong>Versão:</strong> ${dados.versao || '-'}</div>
    <div><strong>Medida:</strong> ${medida}</div>
    <div><strong>Peso:</strong> ${dados.peso || '-'} kg</div>
    <div><strong>Data de Produção:</strong> ${etiquetaData}</div>
    ${status}
  `;

  let btnUsar = document.getElementById("btnUsarQRMov");
  let btnEntradaRapida = document.getElementById("btnEntradaRapidaQR");
  let btnConsumir = document.getElementById("btnConsumirQR");
  let btnDesmarcar = document.getElementById("btnDesmarcarQR");
  let btnExcluir = document.getElementById("btnExcluirQR");

  [btnUsar, btnEntradaRapida, btnConsumir, btnDesmarcar, btnExcluir].forEach(b => { if (b) b.style.display = "none"; });

  if (itemExiste) {
    if (statusTipo === "nova") {
      if (btnUsar) btnUsar.style.display = "block";
      if (btnEntradaRapida) btnEntradaRapida.style.display = "block";
    } else if (statusTipo === "ativa") {
      if (btnUsar) btnUsar.style.display = "block";
      if (btnConsumir) btnConsumir.style.display = "block";
      if (btnExcluir) btnExcluir.style.display = "block";
    } else if (statusTipo === "consumida") {
      if (btnDesmarcar) btnDesmarcar.style.display = "block";
    }
  }

  document.getElementById("modalResultadoQR").classList.remove("hidden");
}

function usarQRNaMovimentacao() {
  if (!qrLidoAtual || !qrLidoAtual.dados) return;
  let dados = qrLidoAtual.dados;
  let tipo = dados.tipo || descobrirTipoPorItem(dados.item);
  let item = dados.item, versao = String(dados.versao), peso = dados.peso;
  if (!tipo || !banco[tipo] || !banco[tipo][item] || !banco[tipo][item][versao]) {
    mostrarToast("Item do QR não encontrado no cadastro", "erro");
    return;
  }
  tipoSelect.value = tipo;
  filtrarPorTipo();
  itemSelect.value = item;
  itemSelect.dispatchEvent(new Event("change"));
  versaoSelect.value = versao;
  atualizarSaldoAtual(item, versao);
  let tamanho = banco[tipo][item][versao].tamanho || "";
  document.getElementById("buscaItem").value = item + " - V" + versao + " (" + tamanho + ")";
  quantidade.value = peso || "";
  mostrarTela("movimentar");
  fecharResultadoQR();
  if (peso) mostrarToast("Dados carregados pelo QR");
  else { quantidade.focus(); mostrarToast("Item carregado — informe o peso"); }
}

function entradaRapidaQR() {
  if (!qrLidoAtual || !qrLidoAtual.dados) return;
  let dados = qrLidoAtual.dados;
  let tipo = dados.tipo || descobrirTipoPorItem(dados.item);
  let item = dados.item, versao = String(dados.versao);
  let peso = parseFloat(dados.peso);
  if (!tipo || !banco[tipo] || !banco[tipo][item] || !banco[tipo][item][versao]) {
    mostrarToast("Item não encontrado no cadastro", "erro");
    return;
  }
  if (!peso || peso <= 0) { mostrarToast("Peso inválido no QR", "erro"); return; }
  let registroExistente = localizarRegistroPorQR(dados);
  if (registroExistente) {
    let status = registroExistente._removidaEstoque ? "excluída" : registroExistente.consumida ? "consumida" : "ativa no estoque";
    mostrarToast("Bobina já registrada (" + status + ")", "erro");
    return;
  }
  salvarEstadoParaDesfazer();
  let identificador = item + " - V" + versao;
  let dataEntrada = dados.data || new Date().toLocaleString();
  let idSalvar = dados.id || crypto.randomUUID();
  estoque[identificador] = (estoque[identificador] || 0) + peso;
  estoque[identificador + "_qtd"] = (estoque[identificador + "_qtd"] || 0) + 1;
// Se for opção "entrada", usa a data atual
let dataFinal = (dados.data) ? dados.data : ((opcaoDataProducao === 'entrada') ? new Date().toLocaleString('pt-BR') : dataEntrada);

historico.push({ 
  id: idSalvar, 
  data: dataFinal, 
  tipo: "Entrada", 
  item: identificador, 
  qtd: peso,
  dataProducao: (opcaoDataProducao === 'entrada') ? new Date().toLocaleString('pt-BR') : undefined
});
  ultimoItem = identificador;
  salvarDados();
  atualizarTudo();
  fecharResultadoQR();
  if (dados.bobinaId) removerPendentePorId(dados.bobinaId);
  if (idSalvar) removerPendentePorId(idSalvar);
  if (navigator.vibrate) navigator.vibrate([100]);
  mostrarToast(identificador + " adicionado via QR");
}

function consumirBobinaQR() {
  if (!qrLidoAtual || !qrLidoAtual.registro) return;
  let reg = qrLidoAtual.registro, chave = reg.item;
  if (reg.consumida) { mostrarToast("Bobina já consumida", "erro"); return; }
  salvarEstadoParaDesfazer();
  reg.consumida = true;
  if (estoque[chave]) {
    estoque[chave] -= reg.qtd;
    if (estoque[chave] <= 0) { delete estoque[chave]; delete estoque[chave + "_qtd"]; }
    else if (estoque[chave + "_qtd"] > 0) estoque[chave + "_qtd"]--;
  }
  historico.push({ id: crypto.randomUUID(), data: new Date().toLocaleString(), tipo: "Consumo", item: chave, qtd: reg.qtd, refEntradaId: reg.id, refEntradaData: reg.data });
  salvarDados(); atualizarTudo(); fecharResultadoQR();
  if (navigator.vibrate) navigator.vibrate([100]);
  mostrarToast("Bobina consumida via QR");
}

function desmarcarConsumidaQR() {
  if (!qrLidoAtual || !qrLidoAtual.registro) return;
  let reg = qrLidoAtual.registro, chave = reg.item;
  if (!reg.consumida) { mostrarToast("Bobina não está consumida", "erro"); return; }
  salvarEstadoParaDesfazer();
  reg.consumida = false;
  estoque[chave] = (estoque[chave] || 0) + reg.qtd;
  estoque[chave + "_qtd"] = (estoque[chave + "_qtd"] || 0) + 1;
  for (let i = historico.length - 1; i >= 0; i--) {
    if (historico[i].tipo === "Consumo" && historico[i].refEntradaId === reg.id) { historico.splice(i, 1); break; }
  }
  salvarDados(); atualizarTudo(); fecharResultadoQR();
  if (navigator.vibrate) navigator.vibrate([100]);
  mostrarToast("Consumo desmarcado via QR");
}

function excluirBobinaQR() {
  if (!qrLidoAtual || !qrLidoAtual.registro) return;
  let reg = qrLidoAtual.registro, chave = reg.item;
  if (!confirm("Excluir esta bobina do estoque?")) return;
  salvarEstadoParaDesfazer();
  if (!reg.consumida && estoque[chave]) {
    estoque[chave] -= reg.qtd;
    if (estoque[chave + "_qtd"] > 0) estoque[chave + "_qtd"]--;
    if (estoque[chave] <= 0) { delete estoque[chave]; delete estoque[chave + "_qtd"]; }
  }
  reg._removidaEstoque = true;
  historico.push({ id: crypto.randomUUID(), data: new Date().toLocaleString(), tipo: "Exclusão", item: chave, qtd: reg.qtd, refEntradaId: reg.id, refEntradaData: reg.data });
  salvarDados(); atualizarTudo(); fecharResultadoQR();
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  mostrarToast("Bobina excluída via QR");
}

function fecharResultadoQR() {
  document.getElementById("modalResultadoQR").classList.add("hidden");
  qrLidoAtual = null;
}

/* ================= SCANNER CONTÍNUO ================= */

let leitorContinuo = null;
let leitorContinuoAberto = false;
let continuoProcessando = false;
let continuoContagem = 0;
let continuoIdsLidos = [];

async function abrirScannerContinuo() {
  // Fecha qualquer scanner que esteja aberto
  await fecharTodosScanners();

  continuoContagem = 0;
  continuoIdsLidos = [];
  continuoProcessando = false;
  document.getElementById("modalScannerContinuo").classList.remove("hidden");
  document.getElementById("continuoContador").textContent = "0 bobinas adicionadas";
  document.getElementById("continuoLog").innerHTML = "";
  document.getElementById("readerContinuo").innerHTML = "";

  try {
    leitorContinuo = new Html5Qrcode("readerContinuo");
    await leitorContinuo.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      async (decodedText) => {
        if (continuoProcessando) return;
        continuoProcessando = true;
        try {
          await processarLeituraContinua(decodedText);
        } catch (erro) {
          console.error("Erro no scanner contínuo:", erro);
          adicionarLogContinuo("❌ " + new Date().toLocaleTimeString() + " — erro ao processar leitura", "erro");
          flashScanner('erro');
          if (navigator.vibrate) navigator.vibrate([200]);
        } finally {
          setTimeout(() => { continuoProcessando = false; }, 1500);
        }
      },
      () => {}
    );
    leitorContinuoAberto = true;
  } catch (erro) {
    console.error("Erro ao abrir scanner contínuo:", erro);
    mostrarToast("Não foi possível abrir a câmera", "erro");
    document.getElementById("modalScannerContinuo").classList.add("hidden");
    document.getElementById("readerContinuo").innerHTML = "";
  }
}

async function processarLeituraContinua(textoLido) {
  let dados = null;
  let agora = new Date().toLocaleTimeString();
  try { dados = JSON.parse(textoLido); }
  catch (e) { dados = interpretarQRSimplificado(textoLido); }
  if (!dados) { adicionarLogContinuo("⚠️ " + agora + " — QR inválido", "erro"); return; }

  let idQR = dados.bobinaId || dados.id || (dados.item + "/V" + dados.versao + "/" + dados.peso);
  if (continuoIdsLidos.includes(idQR)) {
    adicionarLogContinuo("⏭️ " + agora + " — " + dados.item + " V" + dados.versao + " — já lido", "duplicado");
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    return;
  }

  let tipo = dados.tipo || descobrirTipoPorItem(dados.item);
  let item = dados.item, versao = String(dados.versao);
  let peso = parseFloat(dados.peso);

  if (!tipo || !banco[tipo] || !banco[tipo][item] || !banco[tipo][item][versao]) {
    adicionarLogContinuo("❌ " + agora + " — " + item + " V" + versao + " — não cadastrado", "erro");
    if (navigator.vibrate) navigator.vibrate([200]);
    return;
  }
  if (!peso || peso <= 0) {
    adicionarLogContinuo("❌ " + agora + " — " + item + " V" + versao + " — peso inválido", "erro");
    if (navigator.vibrate) navigator.vibrate([200]);
    return;
  }

  let registro = localizarRegistroPorQR(dados);
  if (registro) {
    if (registro._removidaEstoque) adicionarLogContinuo("🚫 " + agora + " — " + item + " V" + versao + " — Bobina excluída", "erro");
    else if (registro.consumida) adicionarLogContinuo("⚠️ " + agora + " — " + item + " V" + versao + " — Bobina consumida", "duplicado");
    else adicionarLogContinuo("⚠️ " + agora + " — " + item + " V" + versao + " — já no estoque", "duplicado");
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    return;
  }

  salvarEstadoParaDesfazer();
  let identificador = item + " - V" + versao;
  estoque[identificador] = (estoque[identificador] || 0) + peso;
  estoque[identificador + "_qtd"] = (estoque[identificador + "_qtd"] || 0) + 1;
  let dataEntrada = dados.data || new Date().toLocaleString();
  let idSalvar = dados.id || crypto.randomUUID();
let dataFinal = (dados.data) ? dados.data : ((opcaoDataProducao === 'entrada') ? new Date().toLocaleString('pt-BR') : dataEntrada);

historico.push({ 
  id: idSalvar, 
  data: dataFinal, 
  tipo: "Entrada", 
  item: identificador, 
  qtd: peso,
  dataProducao: (opcaoDataProducao === 'entrada') ? new Date().toLocaleString('pt-BR') : undefined
});
  ultimoItem = identificador;
    salvarDados();

  // Remove da lista de pendentes ao dar entrada
  if (dados.bobinaId) removerPendentePorId(dados.bobinaId);
  if (idSalvar) removerPendentePorId(idSalvar);

  continuoIdsLidos.push(idQR);
  continuoContagem++;
  document.getElementById("continuoContador").textContent = continuoContagem + " bobina(s) adicionada(s)";
  adicionarLogContinuo("✅ " + agora + " — " + item + " V" + versao + " — " + Math.round(peso) + "kg", "sucesso");
  if (navigator.vibrate) navigator.vibrate([100]);
}

function adicionarLogContinuo(texto, tipo) {
  let log = document.getElementById("continuoLog");
  let div = document.createElement("div");
  div.textContent = texto;
  div.style.padding = "3px 0";
  div.style.borderBottom = "1px solid #f1f5f9";
  if (tipo === "sucesso") div.style.color = "#16a34a";
  else if (tipo === "erro") div.style.color = "#dc2626";
  else if (tipo === "duplicado") div.style.color = "#ca8a04";
  if (log.firstChild) log.insertBefore(div, log.firstChild);
  else log.appendChild(div);
}

/* ================= EXPORTAR QR CODES ================= */

function coletarBobinasParaQR(dataInicioP, dataFimP) {
  let bobinas = [];
  historico.forEach((h, index) => {
    if (h.tipo !== "Entrada" || h._removidaEstoque) return;
    if (dataInicioP || dataFimP) {
      let dataISO = h.data.split(",")[0].trim().split("/").reverse().join("-");
      if (dataInicioP && dataISO < dataInicioP) return;
      if (dataFimP && dataISO > dataFimP) return;
    }
    let partes = h.item.split(" - V");
    if (partes.length < 2) return;
    let item = partes[0], versao = partes[1];
    let tipo = "";
    Object.keys(banco).forEach(t => { if (banco[t] && banco[t][item]) tipo = t; });
    let tamanho = "";
    if (tipo && banco[tipo] && banco[tipo][item] && banco[tipo][item][versao]) {
      tamanho = banco[tipo][item][versao].tamanho;
    }
    let dataQR = "";
    if (h.data) {
      let partesData = h.data.split(", ");
      if (partesData.length === 2) {
        let dma = partesData[0].split("/");
        let hms = partesData[1].replace(/:/g, "");
        if (hms.length === 4) hms = hms + "00";
        if (dma.length === 3 && hms.length === 6) {
          dataQR = dma[0] + dma[1] + dma[2] + "/" + hms;
        }
      }
    }
    let idCurto = '';
if (h.id && typeof h.id === 'string') {
  idCurto = h.id.includes('-') ? h.id.replace(/-/g, '').substring(0, 8) : h.id.substring(0, 8);
}
// Adicionamos o 'BOB/' no início
let conteudoQR = 'BOB/' + item + "/" + versao + "/" + Math.round(h.qtd);
if (dataQR) conteudoQR += "/" + dataQR;
if (idCurto) conteudoQR += "/" + idCurto;

    let dataProducao = "";
    if (dataQR) {
      let dParts = dataQR.split("/");
      if (dParts.length === 2) {
        let d = dParts[0], hr = dParts[1];
        if (hr.length === 4) hr = hr + "00";
        if (d.length === 8 && hr.length >= 4) {
          dataProducao = d.substring(0,2) + "/" + d.substring(2,4) + "/" + d.substring(4,8) +
            " " + hr.substring(0,2) + ":" + hr.substring(2,4) + ":" + hr.substring(4,6);
        }
      }
    }

    bobinas.push({
  index, id: conteudoQR, tipo, tipoNome: nomeCompletoTipo(tipo),
  item, versao, tamanho, medida: tamanho, peso: Math.round(h.qtd),
  data: h.data, dataProducao,
  status: h.consumida ? "consumida" : "ativa",
  qrData: conteudoQR
});
  });
  return bobinas;
}

async function exportarQRCodesZIP(dataInicioP, dataFimP) {
  let bobinas = coletarBobinasParaQR(dataInicioP, dataFimP);
  if (bobinas.length === 0) { mostrarToast("Nenhuma bobina encontrada", "erro"); return; }

  let divModal = document.createElement('div');
  divModal.innerHTML = `
    <div class="modal-overlay" id="modalProgressoQR">
      <div class="modal-content" style="text-align:center; max-width:350px;">
        <h3 style="margin-bottom:12px;">Gerando imagens QR</h3>
        <p id="progressoQRTexto">0 / ${bobinas.length}</p>
        <div class="barra" style="margin:12px 0;">
          <div class="barra-preenchimento" id="progressoQRBarra" style="background:#1e3a8a; width:0%;"></div>
        </div>
        <p style="font-size:12px; color:#64748b;">Aguarde...</p>
      </div>
    </div>
  `;
  document.body.appendChild(divModal.firstElementChild);
  setTimeout(async () => { await gerarImagensQRIndividuais(bobinas); }, 100);
}

async function gerarImagensQRIndividuais(bobinas) {
  let container = document.createElement('div');
  container.style.position = 'fixed'; container.style.left = '-9999px'; container.style.top = '0';
  document.body.appendChild(container);
  let arquivos = [];

  for (let i = 0; i < bobinas.length; i++) {
    let bob = bobinas[i];
    let progresso = Math.round(((i + 1) / bobinas.length) * 100);
    document.getElementById('progressoQRTexto').textContent = (i + 1) + " / " + bobinas.length;
    document.getElementById('progressoQRBarra').style.width = progresso + "%";

    let qrDiv = document.createElement('div');
    container.appendChild(qrDiv);

    let qrDataUrl = await new Promise((resolve) => {
      new QRCode(qrDiv, { text: bob.qrData, width: 300, height: 300, correctLevel: QRCode.CorrectLevel.M });
      let checkCount = 0;
      let interval = setInterval(() => {
        let canvas = qrDiv.querySelector('canvas');
        let img = qrDiv.querySelector('img');
        if (canvas) { clearInterval(interval); resolve(canvas.toDataURL('image/png')); }
        else if (img && img.src && img.complete && img.naturalWidth > 0) { clearInterval(interval); resolve(img.src); }
        else if (checkCount++ > 100) { clearInterval(interval); resolve(""); }
      }, 50);
    });

    if (qrDataUrl) {
      let canvas = document.createElement('canvas');
      canvas.width = 400; canvas.height = 500;
      let ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 400, 500);
      await new Promise((resolve) => {
        let tempImg = new Image();
        tempImg.onload = () => { ctx.drawImage(tempImg, 50, 10, 300, 300); resolve(); };
        tempImg.src = qrDataUrl;
      });
      ctx.fillStyle = '#1e293b'; ctx.textAlign = 'center';
      ctx.font = 'bold 22px Arial'; ctx.fillText(bob.item + ' — V' + bob.versao, 200, 340);
      ctx.font = '18px Arial'; ctx.fillText(bob.tamanho + ' | ' + bob.peso + ' kg', 200, 370);
      let producaoTexto = bob.data ? "Produção: " + bob.data.split(", ")[0] + " às " + bob.data.split(", ")[1] : "";
      ctx.font = '14px Arial'; ctx.fillStyle = '#64748b'; ctx.fillText(producaoTexto, 200, 395);
      ctx.font = '12px Arial'; ctx.fillText(bob.tipoNome, 200, 415);
      let blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      let nomeArquivo = (bob.item + "_V" + bob.versao + "_" + bob.peso + "kg_" + i + ".png").replace(/[^a-zA-Z0-9._-]/g, '_');
      arquivos.push({ nome: nomeArquivo, blob });
    }
    qrDiv.remove();
    await new Promise(r => setTimeout(r, 20));
  }

  container.remove();
  if (document.getElementById('modalProgressoQR')) document.getElementById('modalProgressoQR').remove();

  if (arquivos.length > 0) {
    const zip = new JSZip();
    const pasta = zip.folder("QR_Codes_" + getTimestamp());
    arquivos.forEach(arq => pasta.file(arq.nome, arq.blob));
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = "QR_Export_" + getTimestamp() + ".zip";
    link.click();
    mostrarToast(arquivos.length + " imagens extraídas com sucesso");
  } else {
    mostrarToast("Erro: Nenhuma imagem processada", "erro");
  }
}

/* ================= EXPORTAÇÃO ZPL / CSV ZEBRA (ATUALIZADO 10x6) ================= */

function montarZPLDeLista(lista, qtdPorEtiqueta) {
  // Define 8 como o novo padrão para a etiqueta 10x6 (4 colunas x 2 linhas)
  if (!qtdPorEtiqueta) qtdPorEtiqueta = 8; 
  
  let larguraEtiqueta = 799;
  let alturaEtiqueta = 480;
  
  let cols = 4;
  let linhasGrid = 2; // Math.ceil(8 / 4)
  let qrMag = 5;
  let fontH = 20;
  let fontW = 20;
  
  let cellW = 199; // Largura exata da coluna que você calculou
  let cellH = 240; // Altura exata da linha

  let zpl = '';

  for (let i = 0; i < lista.length; i += qtdPorEtiqueta) {
    zpl += '^XA\n^CI28\n^PW' + larguraEtiqueta + '\n^LL' + alturaEtiqueta + '\n';

    // 1. Cria as linhas verticais contínuas (X = 199, 398, 597)
    for (let c = 1; c < cols; c++) {
      let x = c * cellW;
      zpl += '^FO' + x + ',0^GB1,' + alturaEtiqueta + ',3^FS\n';
    }
    
    // 2. Cria a linha horizontal contínua no meio (Y = 240)
    for (let l = 1; l < linhasGrid; l++) {
      let y = l * cellH;
      zpl += '^FO0,' + y + '^GB' + larguraEtiqueta + ',1,3^FS\n';
    }

    // 3. Preenche as células com os QRs e Textos
    for (let j = 0; j < qtdPorEtiqueta; j++) {
      let bob = lista[i + j];
      if (!bob) break; // Se acabarem os itens, para de desenhar

      let col = j % cols;
      let lin = Math.floor(j / cols);
      
      let cellX = col * cellW;
      let cellY = lin * cellH;
      
      // Coordenadas exatas relativas à célula baseadas no seu ZPL
      let qrX = cellX + 32;
      let qrY = cellY + 10;
let textoY = cellY + 165 + fontH;

      // Código de Barras BQN (QR Code)
      zpl += '^FO' + qrX + ',' + qrY + '^BQN,2,' + qrMag + '^FDLA,' + bob.qrData + '^FS\n';
      // Texto linha 1 - Item/Versão e Peso
      zpl += '^FO' + cellX + ',' + textoY + '^A0N,' + fontH + ',' + fontW + '^FB' + cellW + ',1,0,C^FD' + bob.desc + '^FS\n';
// Texto linha 2 - Medida
if (bob.medida) {
  zpl += '^FO' + cellX + ',' + (textoY + 22) + '^A0N,16,16^FB' + cellW + ',1,0,C^FD' + bob.medida + '^FS\n';
}
    }
    zpl += '^XZ\n\n';
  }
  return zpl.trim();
}

function exportarZPLZebra(dataInicioP, dataFimP, qtdPorEtiqueta) {
  if (!qtdPorEtiqueta) qtdPorEtiqueta = 8;
  let bobinas = coletarBobinasParaQR(dataInicioP, dataFimP);
  if (bobinas.length === 0) { mostrarToast("Nenhuma bobina encontrada no período", "erro"); return; }
  let lista = bobinas.map(bob => ({ qrData: bob.qrData, desc: bob.item + "/" + bob.versao + " - " + bob.peso, medida: bob.medida || bob.tamanho || '' }));
  let zpl = montarZPLDeLista(lista, qtdPorEtiqueta);
  let blob = new Blob([zpl], { type: "application/octet-stream" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "Zebra_" + qtdPorEtiqueta + "QR_" + getTimestamp() + ".zpl";
  link.click();
  let totalEtiquetas = Math.ceil(bobinas.length / qtdPorEtiqueta);
  mostrarToast(".zpl exportado com sucesso");
}

function exportarCSVZebraMult(dataInicioP, dataFimP, qtdPorEtiqueta = 8) {
  let bobinas = coletarBobinasParaQR(dataInicioP, dataFimP);
  if (bobinas.length === 0) { mostrarToast("Nenhuma bobina encontrada", "erro"); return; }
  let cabecalho = [];
  for (let i = 1; i <= qtdPorEtiqueta; i++) cabecalho.push(`qr${i}`, `desc${i}`);
  let linhas = [cabecalho.join(",")];
  for (let i = 0; i < bobinas.length; i += qtdPorEtiqueta) {
    let linhaDados = [];
    for (let j = 0; j < qtdPorEtiqueta; j++) {
      let bob = bobinas[i + j];
      if (bob) {
        let desc = bob.item + "/" + bob.versao + " - " + bob.peso + "kg - " + (bob.medida || bob.tamanho || '');
        linhaDados.push('"' + bob.qrData.replace(/"/g, '""') + '"', '"' + desc.replace(/"/g, '""') + '"');
      } else {
        linhaDados.push('""', '""');
      }
    }
    linhas.push(linhaDados.join(","));
  }
  let blob = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8;" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Zebra_${qtdPorEtiqueta}QR_` + getTimestamp() + ".csv";
  link.click();
  mostrarToast(`CSV exportado (${qtdPorEtiqueta} QR por etiqueta)`);
}

/* ================= NOVO MENU EXPORTAR ================= */

let exportTipoSelecionado = 'estoque';
let exportFormatoSelecionado = 'excel';
let exportUsarPeriodo = false;

function selecionarTipoExport(card) {
  document.querySelectorAll('#exportGrid .export-card').forEach(c => c.classList.remove('selecionado'));
  card.classList.add('selecionado');
  exportTipoSelecionado = card.dataset.tipo;

  let formatosNormal = document.getElementById('exportFormatosNormal');
  let formatosQR = document.getElementById('exportFormatosQR');
  let etapaPeriodo = document.getElementById('exportEtapaPeriodo');

  if (exportTipoSelecionado === 'qrcodes') {
    formatosNormal.classList.add('hidden');
    formatosQR.classList.remove('hidden');
    exportFormatoSelecionado = 'zpl';
    formatosQR.querySelectorAll('.export-formato-btn').forEach(b => b.classList.remove('selecionado'));
    formatosQR.querySelector('[data-formato="zpl"]').classList.add('selecionado');
  } else {
    formatosNormal.classList.remove('hidden');
    formatosQR.classList.add('hidden');
    exportFormatoSelecionado = 'excel';
    formatosNormal.querySelectorAll('.export-formato-btn').forEach(b => b.classList.remove('selecionado'));
    formatosNormal.querySelector('[data-formato="excel"]').classList.add('selecionado');
  }

  if (exportTipoSelecionado === 'estoque') etapaPeriodo.classList.add('hidden');
  else etapaPeriodo.classList.remove('hidden');
}

function selecionarFormato(btn) {
  btn.parentElement.querySelectorAll('.export-formato-btn').forEach(b => b.classList.remove('selecionado'));
  btn.classList.add('selecionado');
  exportFormatoSelecionado = btn.dataset.formato;
}

function toggleExportPeriodo(usarPeriodo, btn) {
  exportUsarPeriodo = usarPeriodo;
  btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('selecionado'));
  btn.classList.add('selecionado');
  let datas = document.getElementById('exportPeriodoDatas');
  if (usarPeriodo) datas.classList.remove('hidden');
  else datas.classList.add('hidden');
}

function resetarMenuExportar() {
  exportTipoSelecionado = 'estoque';
  exportFormatoSelecionado = 'excel';
  exportUsarPeriodo = false;

  document.querySelectorAll('#exportGrid .export-card').forEach(c => c.classList.remove('selecionado'));
  let primeiro = document.querySelector('#exportGrid .export-card[data-tipo="estoque"]');
  if (primeiro) primeiro.classList.add('selecionado');

  let formatosNormal = document.getElementById('exportFormatosNormal');
  let formatosQR = document.getElementById('exportFormatosQR');
  if (formatosNormal) formatosNormal.classList.remove('hidden');
  if (formatosQR) formatosQR.classList.add('hidden');

  document.querySelectorAll('.export-formato-btn').forEach(b => b.classList.remove('selecionado'));
  let excelBtn = document.querySelector('#exportFormatosNormal [data-formato="excel"]');
  if (excelBtn) excelBtn.classList.add('selecionado');

  let etapaPeriodo = document.getElementById('exportEtapaPeriodo');
  let periodoDatas = document.getElementById('exportPeriodoDatas');
  if (etapaPeriodo) etapaPeriodo.classList.add('hidden');
  if (periodoDatas) periodoDatas.classList.add('hidden');

  let toggleBtns = document.querySelectorAll('.export-periodo-toggle button');
  toggleBtns.forEach(b => b.classList.remove('selecionado'));
  if (toggleBtns[0]) toggleBtns[0].classList.add('selecionado');

  let di = document.getElementById('exportDataInicio');
  let df = document.getElementById('exportDataFim');
  if (di) di.value = '';
  if (df) df.value = '';
}

function executarExportacaoNova() {
  let dataInicioExp = null, dataFimExp = null;
  if (exportUsarPeriodo) {
    dataInicioExp = document.getElementById('exportDataInicio').value;
    dataFimExp = document.getElementById('exportDataFim').value;
    if (!dataInicioExp && !dataFimExp) { mostrarToast('Informe pelo menos uma data', 'erro'); return; }
  }

  if (exportTipoSelecionado === 'estoque') {
    if (!Object.keys(estoque).some(k => !k.endsWith('_qtd'))) { mostrarToast('Estoque vazio', 'erro'); return; }
  }

  if (exportTipoSelecionado === 'historico' || exportTipoSelecionado === 'ambos') {
    let dadosFiltrados = historico.filter(h => {
      if (!dataInicioExp && !dataFimExp) return true;
      let dataISO = h.data.split(',')[0].trim().split('/').reverse().join('-');
      return (!dataInicioExp || dataISO >= dataInicioExp) && (!dataFimExp || dataISO <= dataFimExp);
    });
    if (dadosFiltrados.length === 0) { mostrarToast('Nenhum registro no período', 'erro'); return; }
  }

  if (exportTipoSelecionado === 'qrcodes') {
    let bobinas = coletarBobinasParaQR(dataInicioExp, dataFimExp);
    if (bobinas.length === 0) { mostrarToast('Nenhuma bobina encontrada', 'erro'); return; }
    if (exportFormatoSelecionado === 'zpl') {
      abrirPreviewEtiqueta(dataInicioExp, dataFimExp);
      fecharModalConfig();
      return;
    } else if (exportFormatoSelecionado === 'imagens') {
      exportarQRCodesZIP(dataInicioExp, dataFimExp);
    } else if (exportFormatoSelecionado === 'csv') {
      exportarCSVZebraMult(dataInicioExp, dataFimExp, 8);
    }
    fecharModalConfig();
    return;
  }

  if (exportFormatoSelecionado === 'pdf') {
    if (exportTipoSelecionado === 'estoque') exportarEstoquePDF(dataInicioExp, dataFimExp);
    if (exportTipoSelecionado === 'historico') exportarHistoricoPDF(dataInicioExp, dataFimExp);
    if (exportTipoSelecionado === 'ambos') { exportarEstoquePDF(dataInicioExp, dataFimExp); exportarHistoricoPDF(dataInicioExp, dataFimExp); }
  } else {
    if (exportTipoSelecionado === 'estoque') exportarEstoque(dataInicioExp, dataFimExp);
    if (exportTipoSelecionado === 'historico') exportarHistorico(dataInicioExp, dataFimExp);
    if (exportTipoSelecionado === 'ambos') exportarAmbos(dataInicioExp, dataFimExp);
  }
  fecharModalConfig();
}

/* ================= PREVIEW ETIQUETA ================= */

let previewDados = {
  bobinas: [], paginaAtual: 0, totalPaginas: 0,
  qrPorEtiqueta: 8,
  dataInicio: null, dataFim: null,
  origem: null
};

function abrirPreviewEtiqueta(dataInicioP, dataFimP) {
  let bobinas = coletarBobinasParaQR(dataInicioP, dataFimP);
  if (bobinas.length === 0) { mostrarToast('Nenhuma bobina encontrada', 'erro'); return; }
  previewDados.bobinas = bobinas;
  previewDados.paginaAtual = 0;
  previewDados.totalPaginas = Math.ceil(bobinas.length / previewDados.qrPorEtiqueta);
  previewDados.dataInicio = dataInicioP;
  previewDados.dataFim = dataFimP;
  previewDados.origem = 'exportar';
  document.getElementById('previewInfo').textContent =
    '100 × 60 mm — ' + bobinas.length + ' bobina(s) em ' + previewDados.totalPaginas + ' etiqueta(s)';
  document.getElementById('modalPreviewEtiqueta').classList.remove('hidden');
  gerarPreviewsQR(function() { desenharPreviewPagina(0); });
}

function fecharPreviewEtiqueta() {
  document.getElementById('modalPreviewEtiqueta').classList.add('hidden');
  previewDados.bobinas = [];
}

function previewPaginaAnterior() {
  if (previewDados.paginaAtual > 0) {
    previewDados.paginaAtual--;
    desenharPreviewPagina(previewDados.paginaAtual);
  }
}

function previewProximaPagina() {
  if (previewDados.paginaAtual < previewDados.totalPaginas - 1) {
    previewDados.paginaAtual++;
    desenharPreviewPagina(previewDados.paginaAtual);
  }
}

function gerarPreviewsQR(callback) {
  let container = document.createElement('div');
  container.style.position = 'fixed'; container.style.left = '-9999px'; container.style.top = '0';
  document.body.appendChild(container);
  let pendentes = previewDados.bobinas.length;
  if (pendentes === 0) { container.remove(); if (callback) callback(); return; }

  let timeoutGlobal = setTimeout(() => { container.remove(); if (callback) callback(); }, 10000);

  previewDados.bobinas.forEach(function(bob, i) {
    let qrDiv = document.createElement('div');
    container.appendChild(qrDiv);
    new QRCode(qrDiv, { text: bob.qrData, width: 200, height: 200, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
    let tentativas = 0;
    let verificar = setInterval(function() {
      tentativas++;
      let canvas = qrDiv.querySelector('canvas');
      let img = qrDiv.querySelector('img');
      let resolvido = false;
      if (canvas) { bob._qrDataUrl = canvas.toDataURL('image/png'); resolvido = true; }
      else if (img && img.complete && img.naturalWidth > 0) {
        let c = document.createElement('canvas'); c.width = 200; c.height = 200;
        c.getContext('2d').drawImage(img, 0, 0, 200, 200);
        bob._qrDataUrl = c.toDataURL('image/png'); resolvido = true;
      } else if (img && !img.complete) {
        clearInterval(verificar);
        img.onload = function() {
          let c = document.createElement('canvas'); c.width = 200; c.height = 200;
          c.getContext('2d').drawImage(img, 0, 0, 200, 200);
          bob._qrDataUrl = c.toDataURL('image/png');
          pendentes--;
          if (pendentes <= 0) { clearTimeout(timeoutGlobal); container.remove(); if (callback) callback(); }
        };
        img.onerror = function() { bob._qrDataUrl = ''; pendentes--; if (pendentes <= 0) { clearTimeout(timeoutGlobal); container.remove(); if (callback) callback(); } };
        return;
      } else if (tentativas > 50) { bob._qrDataUrl = ''; resolvido = true; }
      if (resolvido) {
        clearInterval(verificar);
        pendentes--;
        if (pendentes <= 0) { clearTimeout(timeoutGlobal); container.remove(); if (callback) callback(); }
      }
    }, 50);
  });
}

function desenharPreviewPagina(pagina) {
  let canvas = document.getElementById('previewCanvas');
  let ctx = canvas.getContext('2d');

  // Dimensões exatas: 799x480 pontos (10x6 cm a 203 DPI)
  let W = 799, H = 480;
  canvas.width = W; canvas.height = H;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  let inicio = pagina * previewDados.qrPorEtiqueta;

  // Grade fixa: 4 colunas x 2 linhas = 8 bobinas (idêntico ao ZPL)
  let cols = 4;
  let linhas = 2;
  let cellW = 199;
  let cellH = 240;

  // Linhas de grade (tracejadas no preview, sólidas no ZPL)
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  for (let c = 1; c < cols; c++) {
    let x = c * cellW;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let l = 1; l < linhas; l++) {
    let y = l * cellH;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.setLineDash([]);

  // QR magnification 5 = 5×(4+2×4) = 5×12 = cada módulo 5px
  // QR v2 (25 módulos) = 25×5 = 125px no ZPL
  // Usamos o mesmo tamanho no preview
  let qrSize = 125;

  let imagensParaDesenhar = [];

  for (let j = 0; j < previewDados.qrPorEtiqueta; j++) {
    let bob = previewDados.bobinas[inicio + j];
    if (!bob) break;

    let col = j % cols;
    let lin = Math.floor(j / cols);
    let cellX = col * cellW;
    let cellY = lin * cellH;

    // Coordenadas IDÊNTICAS ao ZPL: qrX = cellX+32, qrY = cellY+10
    let qrX = cellX + 32;
    let qrY = cellY + 10;

    // Texto posição IDÊNTICA ao ZPL: textoY = cellY + 165 + fontH(20) = cellY+185
    let textoY1 = cellY + 185;
    let textoY2 = textoY1 + 22; // mesma distância do ZPL (textoY + 22)

    // Texto linha 1 - Item/Versão e Peso (fonte 20px no ZPL → 20px no preview)
    let desc = bob.item + '/' + (bob.versao || '') + ' - ' + bob.peso;
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(desc, cellX + cellW / 2, textoY1);

    // Texto linha 2 - Medida (fonte 16px no ZPL → 16px no preview)
    if (bob.medida || bob.tamanho) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#64748b';
      ctx.fillText(bob.medida || bob.tamanho || '', cellX + cellW / 2, textoY2);
    }

    // QR Code
    if (bob._qrDataUrl) {
      imagensParaDesenhar.push({
        src: bob._qrDataUrl,
        x: qrX, y: qrY,
        size: qrSize
      });
    } else {
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(qrX, qrY, qrSize, qrSize);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QR', qrX + qrSize / 2, qrY + qrSize / 2 + 4);
    }
  }

  // Rodapé informativo
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '10px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('100 x 60 mm', 6, H - 6);
  ctx.textAlign = 'right';
  ctx.fillText('203 DPI', W - 6, H - 6);
  ctx.textAlign = 'left';

  // Desenha os QR codes após carregar as imagens
  let pendentes = imagensParaDesenhar.length;
  if (pendentes === 0) { atualizarNavPreview(); return; }

  imagensParaDesenhar.forEach(function(item) {
    let img = new Image();
    img.onload = function() {
      ctx.drawImage(img, item.x, item.y, item.size, item.size);
      pendentes--;
      if (pendentes <= 0) atualizarNavPreview();
    };
    img.onerror = function() {
      pendentes--;
      if (pendentes <= 0) atualizarNavPreview();
    };
    img.src = item.src;
  });
}

function atualizarNavPreview() {
  document.getElementById('previewPagina').textContent = (previewDados.paginaAtual + 1) + ' / ' + previewDados.totalPaginas;
  let btns = document.querySelectorAll('.preview-etiqueta-nav button');
  if (btns[0]) btns[0].disabled = (previewDados.paginaAtual <= 0);
  if (btns[1]) btns[1].disabled = (previewDados.paginaAtual >= previewDados.totalPaginas - 1);
}

function confirmarExportZPL() {
  if (geradorBobinas.length > 0) {
    fecharPreviewEtiqueta();
    geradorGerarZPL();
    return;
  }

  if (previewDados.origem === 'pendentes' && etiquetasPendentes.length > 0) {
    fecharPreviewEtiqueta();

    let lista = etiquetasPendentes.map(p => {
      let dataQR = '';
      let origemData = p.dataProducao || p.dataCriacao || '';

      if (origemData) {
        let partesData = origemData.split(", ");
        if (partesData.length === 2) {
          let dma = partesData[0].split("/");
          let hms = partesData[1].replace(/:/g, "");
          if (dma.length === 3 && hms.length >= 4) {
            dataQR = "/" + dma[0] + dma[1] + dma[2] + "/" + hms;
          }
        }
      }

      return {
        qrData: 'BOB/' + p.item + '/' + p.versao + '/' + Math.round(p.peso) + dataQR + '/' + p.idCurto,
        desc: p.item + '/' + p.versao + ' - ' + p.peso,
        medida: p.tamanho || ''
      };
    });

    if (lista.length === 0) {
      mostrarToast('Nenhuma bobina para exportar', 'erro');
      return;
    }

    let zpl = montarZPLDeLista(lista, previewDados.qrPorEtiqueta || 8);
    let blob = new Blob([zpl], { type: 'application/octet-stream' });
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Etiquetas_Pendentes_' + getTimestamp() + '.zpl';
    link.click();
    mostrarToast('.zpl exportado');
    return;
  }

  let di = previewDados.dataInicio;
  let df = previewDados.dataFim;
  fecharPreviewEtiqueta();
  exportarZPLZebra(di, df);
}

/* ================= GERADOR DE ETIQUETAS ================= */

let geradorBobinas = [];
let geradorEditandoIndex = null;
let geradorGrupoAberto = null;

function fecharGerador() { document.getElementById('modalGerador').classList.add('hidden'); }

function abrirGerador() {
  fecharModalConfig();
  if (geradorBobinas.length === 0 && etiquetasPendentes.length > 0) {
    if (confirm('Você tem ' + etiquetasPendentes.length + ' etiqueta(s) pendente(s).\n\nDeseja verificar?')) {
      abrirPendentes(); return;
    }
  }
  document.getElementById('modalGerador').classList.remove('hidden');
  geradorIrPasso(1);
  geradorLimparCampos();
  let busca = document.getElementById('geradorBusca');
  if (busca) busca.value = '';
  geradorRenderizarLista1();
  atualizarCampoDataManualGerador();
}

function geradorConcluir() {
  if (geradorBobinas.length === 0) { mostrarToast('Nenhuma bobina para salvar', 'erro'); return; }
  adicionarPendentes(geradorBobinas);
  let total = geradorBobinas.reduce((acc, b) => acc + b.qtd, 0);
  
  document.getElementById('geradorBotoesAntes').classList.add('hidden');
  document.getElementById('geradorBotoesDepois').classList.remove('hidden');
  
  let resumo = document.getElementById('geradorExportTotal');
  if (resumo) resumo.textContent = '✅ ' + total + ' etiqueta(s) salva(s)!';
  
  if (navigator.vibrate) navigator.vibrate([100]);
  mostrarToast(total + ' etiqueta(s) salva(s) como pendentes');
}

function geradorCancelar() {
  let concluiu = !document.getElementById('geradorBotoesDepois').classList.contains('hidden');

  if (concluiu) {
    geradorResetarTudo();
    document.getElementById('modalGerador').classList.add('hidden');
    return;
  }

  if (geradorBobinas.length > 0) {
    if (!confirm('Descartar ' + geradorBobinas.reduce((a, b) => a + b.qtd, 0) + ' etiqueta(s)?')) return;
  }

  geradorResetarTudo();
  document.getElementById('modalGerador').classList.add('hidden');
  mostrarToast('Etiquetas descartadas');
}

function geradorFecharFinal() {
  geradorResetarTudo();
  document.getElementById('modalGerador').classList.add('hidden');
}

function geradorFecharSimples() {
  let concluiu = !document.getElementById('geradorBotoesDepois').classList.contains('hidden');

  if (concluiu) {
    geradorResetarTudo();
    document.getElementById('modalGerador').classList.add('hidden');
    return;
  }

  if (geradorBobinas.length > 0) {
    if (!confirm('Descartar ' + geradorBobinas.reduce((a, b) => a + b.qtd, 0) + ' etiqueta(s)?')) return;
  }

  geradorResetarTudo();
  document.getElementById('modalGerador').classList.add('hidden');
}

function geradorResetarTudo() {
  geradorBobinas = [];
  geradorEditandoIndex = null;
  geradorGrupoAberto = null;
  geradorLimparCampos();
  let busca = document.getElementById('geradorBusca');
  if (busca) busca.value = '';
  let sug = document.getElementById('geradorSugestoes');
  if (sug) { sug.innerHTML = ''; sug.classList.add('hidden'); }
  let antes = document.getElementById('geradorBotoesAntes');
  let depois = document.getElementById('geradorBotoesDepois');
  if (antes) antes.classList.remove('hidden');
  if (depois) depois.classList.add('hidden');
}

function geradorIrPasso(passo) {
  geradorGrupoAberto = null;
  document.getElementById('geradorPasso1').classList.add('hidden');
  document.getElementById('geradorPasso2').classList.add('hidden');
  document.getElementById('geradorPasso' + passo).classList.remove('hidden');
  document.querySelectorAll('.gerador-passo').forEach(el => {
    let p = parseInt(el.dataset.passo);
    el.classList.remove('ativo', 'completo');
    if (p === passo) el.classList.add('ativo');
    else if (p < passo) el.classList.add('completo');
  });
  if (passo === 1) { geradorRenderizarLista1(); geradorAtualizarResumoTotal(); }
  if (passo === 2) {
    let antes = document.getElementById('geradorBotoesAntes');
    let depois = document.getElementById('geradorBotoesDepois');
    if (antes) antes.classList.remove('hidden');
    if (depois) depois.classList.add('hidden');
    geradorRenderizarLista2();
    geradorRenderizarPasso3();
  }
}

function geradorIrPassoClicavel(passo) {
  if (passo >= 2 && geradorBobinas.length === 0) { mostrarToast('Adicione pelo menos uma bobina', 'erro'); return; }
  geradorIrPasso(passo);
}

function geradorAvancar(passo) {
  if (geradorBobinas.length === 0) { mostrarToast('Adicione pelo menos uma bobina', 'erro'); return; }
  geradorIrPasso(passo);
}

function geradorVoltar(passo) { geradorIrPasso(passo); }

function geradorSelecionouVersao() {
  let tipoEl = document.getElementById('geradorTipo');
  let itemEl = document.getElementById('geradorItem');
  let versaoEl = document.getElementById('geradorVersao');
  let buscaEl = document.getElementById('geradorBusca');
  let pesoEl = document.getElementById('geradorPeso');
  if (!versaoEl || !versaoEl.value) return;
  let tipo = tipoEl ? tipoEl.value : '';
  let item = itemEl ? itemEl.value : '';
  let versao = versaoEl.value;
  let tamanho = '';
  if (tipo && item && versao && banco[tipo] && banco[tipo][item] && banco[tipo][item][versao]) {
    tamanho = banco[tipo][item][versao].tamanho;
  }
  if (buscaEl && item) buscaEl.value = item + ' - V' + versao + ' (' + tamanho + ')';
  if (pesoEl) pesoEl.focus();
}

function geradorLimparCampos() {
  ['geradorTipo', 'geradorPeso'].forEach(id => { let el = document.getElementById(id); if (el) el.value = ''; });
  let el = document.getElementById('geradorItem');
  if (el) el.innerHTML = '<option value="">Selecionar item</option>';
  el = document.getElementById('geradorVersao');
  if (el) el.innerHTML = '<option value="">Selecionar versão</option>';
  el = document.getElementById('geradorQtd');
  if (el) el.value = '1';
  geradorEditandoIndex = null;
}

function geradorFiltrarTipo() {
  let tipoEl = document.getElementById('geradorTipo');
  let itemEl = document.getElementById('geradorItem');
  let versaoEl = document.getElementById('geradorVersao');
  if (!tipoEl || !itemEl || !versaoEl) return;
  let tipo = tipoEl.value;
  itemEl.innerHTML = '<option value="">Selecionar item</option>';
  versaoEl.innerHTML = '<option value="">Selecionar versão</option>';
  if (!banco[tipo]) return;
  Object.keys(banco[tipo]).forEach(item => {
    let opt = document.createElement('option');
    opt.value = item; opt.textContent = item;
    itemEl.appendChild(opt);
  });
  let busca = document.getElementById('geradorBusca');
  if (busca) busca.value = '';
}

function geradorFiltrarItem() {
  let tipoEl = document.getElementById('geradorTipo');
  let itemEl = document.getElementById('geradorItem');
  let versaoEl = document.getElementById('geradorVersao');
  if (!tipoEl || !itemEl || !versaoEl) return;
  let tipo = tipoEl.value, item = itemEl.value;
  versaoEl.innerHTML = '<option value="">Selecionar versão</option>';
  if (!banco[tipo] || !banco[tipo][item]) return;
  Object.keys(banco[tipo][item]).forEach(v => {
    let tamanho = banco[tipo][item][v].tamanho;
    let opt = document.createElement('option');
    opt.value = v; opt.textContent = v + " (" + tamanho + ")";
    versaoEl.appendChild(opt);
  });
  let busca = document.getElementById('geradorBusca');
  if (busca) busca.value = '';
}

function geradorFiltrarBusca() {
  let termo = document.getElementById('geradorBusca').value.toLowerCase();
  let sugestoes = document.getElementById('geradorSugestoes');
  sugestoes.innerHTML = '';
  if (!termo) { sugestoes.classList.add('hidden'); return; }
  Object.keys(banco).forEach(tipo => {
    Object.keys(banco[tipo]).forEach(item => {
      Object.keys(banco[tipo][item]).forEach(versao => {
        let tamanho = banco[tipo][item][versao].tamanho;
        let textoCompleto = item + " - V" + versao + " (" + tamanho + ")";
        if (textoCompleto.toLowerCase().includes(termo)) {
          let d = document.createElement('div');
          d.textContent = textoCompleto;
          d.onclick = function() {
            document.getElementById('geradorTipo').value = tipo;
            geradorFiltrarTipo();
            document.getElementById('geradorItem').value = item;
            geradorFiltrarItem();
            document.getElementById('geradorVersao').value = versao;
            document.getElementById('geradorBusca').value = textoCompleto;
            sugestoes.classList.add('hidden');
            document.getElementById('geradorPeso').focus();
          };
          sugestoes.appendChild(d);
        }
      });
    });
  });
  sugestoes.classList.remove('hidden');
}

function geradorLimparBusca() {
  document.getElementById('geradorBusca').value = '';
  document.getElementById('geradorSugestoes').innerHTML = '';
  document.getElementById('geradorSugestoes').classList.add('hidden');
  geradorLimparCampos();
}

function geradorAdicionar() {
  let tipoEl = document.getElementById('geradorTipo');
  let itemEl = document.getElementById('geradorItem');
  let versaoEl = document.getElementById('geradorVersao');
  let pesoEl = document.getElementById('geradorPeso');
  let qtdEl = document.getElementById('geradorQtd');
  if (!tipoEl || !itemEl || !versaoEl || !pesoEl) return;
  let tipo = tipoEl.value, item = itemEl.value, versao = versaoEl.value;
  let peso = parseFloat(pesoEl.value);
  let qtd = qtdEl ? (parseInt(qtdEl.value) || 1) : 1;
  let faltando = [];
  if (!tipo) faltando.push('tipo');
  if (!item) faltando.push('item');
  if (!versao) faltando.push('versão');
  if (!peso || peso <= 0) faltando.push('peso');
  if (faltando.length > 0) { mostrarToast('Informe: ' + faltando.join(', '), 'erro'); return; }
  let tamanho = '';
  if (banco[tipo] && banco[tipo][item] && banco[tipo][item][versao]) tamanho = banco[tipo][item][versao].tamanho;
  if (geradorEditandoIndex !== null) {
    geradorBobinas[geradorEditandoIndex] = { tipo, item, versao, tamanho, peso, qtd, ids: geradorGerarIds(qtd) };
    geradorEditandoIndex = null;
    mostrarToast('Bobina atualizada');
  } else {
let dataProducao = obterDataProducaoParaEtiqueta();
geradorBobinas.push({ tipo, item, versao, tamanho, peso, qtd, ids: geradorGerarIds(qtd), dataProducao: dataProducao });
    mostrarToast('Adicionada');
  }
  geradorLimparCampos();
  let busca = document.getElementById('geradorBusca');
  if (busca) busca.value = '';
  geradorRenderizarLista1();
  if (navigator.vibrate) navigator.vibrate([50]);
}

function geradorRepetirUltimo() {
  if (geradorBobinas.length === 0) { mostrarToast('Nenhuma bobina para repetir', 'erro'); return; }
  let ultima = geradorBobinas[geradorBobinas.length - 1];
  let el;
  el = document.getElementById('geradorTipo'); if (el) { el.value = ultima.tipo; geradorFiltrarTipo(); }
  el = document.getElementById('geradorItem'); if (el) { el.value = ultima.item; geradorFiltrarItem(); }
  el = document.getElementById('geradorVersao'); if (el) el.value = ultima.versao;
  el = document.getElementById('geradorQtd'); if (el) el.value = ultima.qtd;
  let busca = document.getElementById('geradorBusca');
  if (busca) busca.value = ultima.item + ' - V' + ultima.versao + ' (' + (ultima.tamanho || '') + ')';
  el = document.getElementById('geradorPeso'); if (el) { el.value = ''; el.focus(); }
}

function geradorGerarIds(qtd) {
  let ids = [];
  for (let i = 0; i < qtd; i++) ids.push(crypto.randomUUID());
  return ids;
}

function geradorEditar(index) {
  let bob = geradorBobinas[index];
  if (!bob) return;
  let el;
  el = document.getElementById('geradorTipo'); if (el) { el.value = bob.tipo; geradorFiltrarTipo(); }
  el = document.getElementById('geradorItem'); if (el) { el.value = bob.item; geradorFiltrarItem(); }
  el = document.getElementById('geradorVersao'); if (el) el.value = bob.versao;
  el = document.getElementById('geradorPeso'); if (el) el.value = bob.peso;
  el = document.getElementById('geradorQtd'); if (el) el.value = bob.qtd;
  geradorEditandoIndex = index;
  geradorIrPasso(1);
}

function geradorRemover(index) {
  geradorBobinas.splice(index, 1);
  geradorRenderizarLista1();
  geradorAtualizarResumoTotal();
  mostrarToast(geradorBobinas.length === 0 ? 'Lista vazia' : 'Removida');
}

function geradorRemoverBobina(chaveGrupo, bobinaIndex) {
  let partes = chaveGrupo.split('|');
  let tipo = partes[0], item = partes[1], versao = partes[2];
  let contador = 0;
  for (let i = 0; i < geradorBobinas.length; i++) {
    let bob = geradorBobinas[i];
    if (bob.tipo === tipo && bob.item === item && bob.versao === versao) {
      for (let j = 0; j < bob.ids.length; j++) {
        if (contador === bobinaIndex) {
          bob.ids.splice(j, 1); bob.qtd--;
          if (bob.ids.length === 0) geradorBobinas.splice(i, 1);
          geradorAtualizarResumoTotal();
          geradorGrupoAberto = geradorBobinas.length > 0 ? chaveGrupo : null;
          geradorRenderizarLista1();
          mostrarToast(geradorBobinas.length === 0 ? 'Lista vazia' : 'Bobina removida');
          return;
        }
        contador++;
      }
    }
  }
}

function geradorEditarBobina(chaveGrupo, bobinaIndex) {
  let partes = chaveGrupo.split('|');
  let tipo = partes[0], item = partes[1], versao = partes[2];
  let contador = 0, bobinaAlvo = null, grupoAlvo = null, grupoIndex = -1, idIndex = -1;
  for (let i = 0; i < geradorBobinas.length; i++) {
    let bob = geradorBobinas[i];
    if (bob.tipo === tipo && bob.item === item && bob.versao === versao) {
      for (let j = 0; j < bob.ids.length; j++) {
        if (contador === bobinaIndex) { bobinaAlvo = { peso: bob.peso, id: bob.ids[j] }; grupoAlvo = bob; grupoIndex = i; idIndex = j; break; }
        contador++;
      }
      if (bobinaAlvo) break;
    }
  }
  if (!bobinaAlvo) return;
  let novoPeso = prompt("Novo peso (kg):", bobinaAlvo.peso);
  if (novoPeso === null) return;
  novoPeso = parseFloat(novoPeso);
  if (isNaN(novoPeso) || novoPeso <= 0) { mostrarToast('Peso inválido', 'erro'); return; }
  if (novoPeso === bobinaAlvo.peso) return;
  let idMantido = grupoAlvo.ids[idIndex], tamanhoSalvo = grupoAlvo.tamanho;
  grupoAlvo.ids.splice(idIndex, 1); grupoAlvo.qtd--;
  if (grupoAlvo.ids.length === 0) geradorBobinas.splice(grupoIndex, 1);
  let grupoDestino = geradorBobinas.find(bob => bob.tipo === tipo && bob.item === item && bob.versao === versao && bob.peso === novoPeso);
  if (grupoDestino) { grupoDestino.ids.push(idMantido); grupoDestino.qtd++; }
  else {
    geradorBobinas.splice(Math.min(grupoIndex, geradorBobinas.length), 0, { tipo, item, versao, tamanho: tamanhoSalvo, peso: novoPeso, qtd: 1, ids: [idMantido] });
  }
  geradorAtualizarResumoTotal();
  geradorGrupoAberto = chaveGrupo;
  geradorRenderizarLista1();
  mostrarToast('Peso atualizado');
}

function geradorAddAoGrupo(chaveGrupo) {
  let partes = chaveGrupo.split('|');
  let el;
  el = document.getElementById('geradorTipo'); if (el) { el.value = partes[0]; geradorFiltrarTipo(); }
  el = document.getElementById('geradorItem'); if (el) { el.value = partes[1]; geradorFiltrarItem(); }
  el = document.getElementById('geradorVersao'); if (el) el.value = partes[2];
  el = document.getElementById('geradorQtd'); if (el) el.value = '1';
  el = document.getElementById('geradorPeso'); if (el) { el.value = ''; el.focus(); }
  geradorIrPasso(1);
}

function geradorToggleCard(el) {
  let card = el.closest('.gerador-card');
  card.classList.toggle('aberto');
  if (!card.classList.contains('aberto')) geradorGrupoAberto = null;
}

function geradorRenderizarLista(containerId, comAcoes) {
  let container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (geradorBobinas.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:#94a3b8; font-size:13px; padding:12px;">Nenhuma bobina adicionada</div>';
    return;
  }
  let grupos = {};
  geradorBobinas.forEach((bob, idx) => {
    let chave = bob.tipo + '|' + bob.item + '|' + bob.versao;
    if (!grupos[chave]) grupos[chave] = { tipo: bob.tipo, item: bob.item, versao: bob.versao, tamanho: bob.tamanho, bobinas: [] };
    bob.ids.forEach((id, subIdx) => { grupos[chave].bobinas.push({ peso: bob.peso, id, origemIndex: idx, origemSubIndex: subIdx }); });
  });

  Object.keys(grupos).forEach(chave => {
    let grupo = grupos[chave];
    let qtdBobinas = grupo.bobinas.length;
    let pesoTotal = grupo.bobinas.reduce((acc, b) => acc + b.peso, 0);
    let classTipo = 'tipo-' + grupo.tipo;
    let nomeTipo = nomeBonitoTipo(grupo.tipo);

    let card = document.createElement('div');
    card.className = 'gerador-card';
    if (geradorGrupoAberto === chave) card.classList.add('aberto');

    let bobinasHTML = '';
    grupo.bobinas.forEach((bob, bIdx) => {
      let acoesBtns = comAcoes ? `
        <div class="gerador-bobina-acoes">
          <button class="btn-editar-opcao" onclick="event.stopPropagation(); geradorEditarBobina('${chave}', ${bIdx})" title="Editar">✏️</button>
          <button class="btn-excluir-opcao" onclick="event.stopPropagation(); geradorRemoverBobina('${chave}', ${bIdx})" title="Remover">🗑</button>
        </div>
      ` : '';
      bobinasHTML += `
        <div class="gerador-bobina-linha">
          <span class="gerador-bobina-num">${bIdx + 1}</span>
          <span class="gerador-bobina-peso">${bob.peso} kg</span>
          ${acoesBtns}
        </div>
      `;
    });

    card.innerHTML = `
      <div class="gerador-card-header" onclick="geradorToggleCard(this)" style="display:flex; align-items:center; justify-content:space-between; gap:6px; padding:8px 10px;">
        
        <!-- LADO ESQUERDO: Fica tudo em uma linha e corta com '...' se não couber -->
        <div style="display:flex; align-items:center; gap:6px; overflow:hidden; white-space:nowrap; flex:1;">
          <span class="gerador-card-tipo ${classTipo}" style="margin:0; flex-shrink:0;">${nomeTipo}</span>
          <span style="font-size:13px; font-weight:600; text-overflow:ellipsis; overflow:hidden;">${grupo.item} / V${grupo.versao} · ${grupo.tamanho}</span>
        </div>

        <!-- LADO DIREITO: Total, Qtd e Seta -->
        <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
           <strong style="font-size:13px;">Total: ${formatarPeso(pesoTotal)} kg</strong>
          <span class="gerador-card-qtd" style="margin:0;">${qtdBobinas} bob.</span>
          <span class="gerador-card-seta" style="margin:0;">▶</span>
        </div>

      </div>
      <div class="gerador-card-body">${bobinasHTML}</div>
    `;
    container.appendChild(card);
  });
}

function geradorRenderizarLista1() { geradorRenderizarLista('geradorLista1', true); geradorAtualizarResumoTotal(); }
function geradorRenderizarLista2() { geradorRenderizarLista('geradorLista2', false); }

function geradorRenderizarPasso3() {
  let el = document.getElementById('geradorExportTotal');
  if (el) el.textContent = geradorBobinas.reduce((acc, b) => acc + b.qtd, 0) + ' etiqueta(s) pronta(s)';
}

function geradorAtualizarResumoTotal() {
  let total = geradorBobinas.reduce((acc, b) => acc + b.qtd, 0);
  let elResumo = document.getElementById('geradorResumoTotal');
  if (elResumo) elResumo.textContent = total === 0 ? 'Nenhuma etiqueta' : total + ' etiqueta(s)';
  let elExport = document.getElementById('geradorExportTotal');
  if (elExport) elExport.textContent = total + ' etiqueta(s) pronta(s)';
}

function geradorMontarZPL() {
  let todas = [];
  geradorBobinas.forEach(bob => {
    bob.ids.forEach(id => {
      let idCurto = id.replace(/-/g, '').substring(0, 8);
let dataQR = '';
if (bob.dataProducao) {
  let partesData = bob.dataProducao.split(", ");
  if (partesData.length === 2) {
    let dma = partesData[0].split("/");
    let hms = partesData[1].replace(/:/g, "");
    if (dma.length === 3 && hms.length >= 4) {
      dataQR = "/" + dma[0] + dma[1] + dma[2] + "/" + hms;
    }
  }
}

todas.push({ 
  qrData: 'BOB/' + bob.item + '/' + bob.versao + '/' + Math.round(bob.peso) + dataQR + '/' + idCurto, 
  desc: bob.item + '/' + bob.versao + ' - ' + bob.peso,
  medida: bob.tamanho || ''
});
    });
  });
  return montarZPLDeLista(todas, 8);
}

function geradorGerarZPL() {
  let zpl = geradorMontarZPL();
  let total = geradorBobinas.reduce((acc, b) => acc + b.qtd, 0);
  let blob = new Blob([zpl], { type: 'application/octet-stream' });
  let link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'Etiquetas_' + total + '_' + getTimestamp() + '.zpl';
  link.click();
  mostrarToast('Arquivo .zpl gerado');
}

function geradorCopiarZPL() {
  let zpl = geradorMontarZPL();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(zpl).then(() => {
      mostrarToast('Código .zpl copiado para a área de transferência!');
      if (navigator.vibrate) navigator.vibrate([50]);
    }).catch(() => { geradorCopiarFallback(zpl); });
  } else { geradorCopiarFallback(zpl); }
}

function geradorCopiarFallback(texto) {
  let textarea = document.createElement('textarea');
  textarea.value = texto;
  textarea.style.position = 'fixed'; textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try { document.execCommand('copy'); mostrarToast('ZPL copiado para a área de transferência'); }
  catch (e) { mostrarToast('Não foi possível copiar', 'erro'); }
  document.body.removeChild(textarea);
}

function geradorVisualizarZPL() {
  let todas = [];

  geradorBobinas.forEach(bob => {
    bob.ids.forEach(id => {
      let idCurto = id.replace(/-/g, '').substring(0, 8);

      let dataQR = '';
      if (bob.dataProducao) {
        let partesData = bob.dataProducao.split(", ");
        if (partesData.length === 2) {
          let dma = partesData[0].split("/");
          let hms = partesData[1].replace(/:/g, "");
          if (dma.length === 3 && hms.length >= 4) {
            dataQR = "/" + dma[0] + dma[1] + dma[2] + "/" + hms;
          }
        }
      }

      todas.push({
        qrData: 'BOB/' + bob.item + '/' + bob.versao + '/' + Math.round(bob.peso) + dataQR + '/' + idCurto,
        item: bob.item,
        versao: bob.versao,
        peso: bob.peso,
        medida: bob.tamanho || ''
      });
    });
  });

  if (todas.length === 0) {
    mostrarToast('Nenhuma etiqueta para visualizar', 'erro');
    return;
  }

  previewDados.bobinas = todas;
  previewDados.paginaAtual = 0;
  previewDados.totalPaginas = Math.ceil(todas.length / 8);
  previewDados.origem = 'gerador';
  document.getElementById('previewInfo').textContent =
    '100 × 60 mm — ' + todas.length + ' bobina(s) em ' + previewDados.totalPaginas + ' etiqueta(s)';
  document.getElementById('modalPreviewEtiqueta').classList.remove('hidden');
  gerarPreviewsQR(function() { desenharPreviewPagina(0); });
}

/* ================= ETIQUETAS PENDENTES ================= */

function carregarPendentes() {
  let salvo = localStorage.getItem('etiquetasPendentes');
  if (salvo) { try { etiquetasPendentes = JSON.parse(salvo); } catch (e) { etiquetasPendentes = []; } }
  atualizarBotaoPendentesConfig();
}

function salvarPendentes() {
  localStorage.setItem('etiquetasPendentes', JSON.stringify(etiquetasPendentes));
  atualizarBotaoPendentesConfig();

  if (typeof salvarNoFirebase === 'function') {
    salvarNoFirebase();
  }
}

function atualizarBotaoPendentesConfig() {
  let contador = document.getElementById('btnPendentesContador');
  if (!contador) return;
  if (etiquetasPendentes.length === 0) {
    contador.style.display = 'none';
  } else {
    contador.textContent = '(Pendentes: ' + etiquetasPendentes.length + ')';
    contador.style.display = 'inline';
  }
}

function adicionarPendentes(bobinas) {
  bobinas.forEach(bob => {
    bob.ids.forEach(id => {
      etiquetasPendentes.push({
        id,
        idCurto: id.replace(/-/g, '').substring(0, 8),
        tipo: bob.tipo,
        item: bob.item,
        versao: bob.versao,
        tamanho: bob.tamanho,
        peso: bob.peso,
        dataCriacao: new Date().toLocaleString(),
        dataProducao: bob.dataProducao || null
      });
    });
  });
  salvarPendentes();
}

function removerPendentePorId(bobinaId) {
  if (!bobinaId) return;
  let idStr = String(bobinaId);
  let idCurto = idStr.includes('-') ? idStr.replace(/-/g, '').substring(0, 8) : (idStr.length === 8 ? idStr : idStr.replace(/-/g, '').substring(0, 8));
  let tamanhoAntes = etiquetasPendentes.length;
  etiquetasPendentes = etiquetasPendentes.filter(p => {
    if (p.idCurto === idCurto) return false;
    if (p.id === idStr) return false;
    if (idStr.replace(/-/g, '').startsWith(p.idCurto)) return false;
    return true;
  });
  if (etiquetasPendentes.length < tamanhoAntes) salvarPendentes();
}

function removerPendentePorIndex(index) {
  if (index < 0 || index >= etiquetasPendentes.length) return;
  let p = etiquetasPendentes[index];
  let chaveGrupo = p ? (p.tipo + '|' + p.item + '|' + p.versao) : null;
  etiquetasPendentes.splice(index, 1);
  salvarPendentes();
  renderizarPendentes();
  if (etiquetasPendentes.length === 0) { fecharPendentes(); mostrarToast('Todas as pendentes foram removidas'); }
  else {
    mostrarToast('Pendente removida');
    if (chaveGrupo) {
      document.querySelectorAll('#pendentesLista .gerador-card').forEach(card => {
        let resumo = card.querySelector('.gerador-card-resumo');
        if (!resumo) return;
        let partesCh = chaveGrupo.split('|');
        if (resumo.textContent.includes(partesCh[1] + ' / V' + partesCh[2])) card.classList.add('aberto');
      });
    }
  }
}

function abrirPendentes() {
  fecharModalConfig();
  document.getElementById('modalPendentes').classList.remove('hidden');
  renderizarPendentes();
}

function fecharPendentes() { document.getElementById('modalPendentes').classList.add('hidden'); }

function renderizarPendentes() {
  let container = document.getElementById('pendentesLista');
  let totalEl = document.getElementById('pendentesTotal');

  if (!container) return;

  container.innerHTML = '';

  if (totalEl) {
    totalEl.textContent = etiquetasPendentes.length + ' pendente(s)';
  }

  if (!Array.isArray(etiquetasPendentes) || etiquetasPendentes.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:#94a3b8; font-size:13px; padding:12px;">Nenhuma etiqueta pendente</div>';
    return;
  }

  let grupos = {};

  etiquetasPendentes.forEach((p, idx) => {
    if (!p) return;

    let chave = (p.tipo || '') + '|' + (p.item || '') + '|' + (p.versao || '');

    if (!grupos[chave]) {
      grupos[chave] = {
        tipo: p.tipo || '',
        item: p.item || '',
        versao: p.versao || '',
        tamanho: p.tamanho || '',
        pendentes: []
      };
    }

    grupos[chave].pendentes.push({
      ...p,
      indexReal: idx
    });
  });

  let html = '';

  Object.keys(grupos).forEach(chave => {
    let grupo = grupos[chave];
    let pesoTotal = grupo.pendentes.reduce((acc, p) => acc + (Number(p.peso) || 0), 0);
    let qtd = grupo.pendentes.length;

    let bobinasHTML = '';

    grupo.pendentes.forEach((p, bIdx) => {
      bobinasHTML += `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:4px 0; border-bottom:1px solid #f1f5f9;">
          <span style="font-size:12px;">
            <strong>Bobina ${bIdx + 1}:</strong> ${p.peso} kg
            <span style="font-size:10px; color:#94a3b8; margin-left:4px;">${p.dataCriacao || ''}</span>
          </span>
          <button class="btn-excluir-opcao" style="width:auto; padding:2px 8px; font-size:11px; height:26px; min-width:0;" onclick="event.stopPropagation(); removerPendentePorIndex(${p.indexReal})">🗑</button>
        </div>
      `;
    });

    html += `
      <div class="gerador-card">
        <div class="gerador-card-header" onclick="geradorToggleCard(this)">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; width:100%;">
            <div style="display:flex; align-items:center; gap:6px; overflow:hidden; white-space:nowrap; flex:1;">
              <span class="gerador-card-tipo tipo-${grupo.tipo}">${nomeBonitoTipo(grupo.tipo)}</span>
              <span style="font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis;">
                ${grupo.item} / V${grupo.versao} · ${grupo.tamanho}
              </span>
            </div>
            <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
              <strong style="font-size:13px;">Total: ${formatarPeso(pesoTotal)} kg</strong>
              <span class="gerador-card-qtd">${qtd} bob.</span>
              <span class="gerador-card-seta">▶</span>
            </div>
          </div>
        </div>

        <div class="gerador-card-body">
          <div><strong>Tipo:</strong> ${nomeCompletoTipo(grupo.tipo)}</div>
          <div><strong>Item:</strong> ${grupo.item}</div>
          <div><strong>Versão:</strong> ${grupo.versao} (${grupo.tamanho})</div>
          <div style="margin-top:6px; font-weight:600; font-size:12px; color:#1e3a8a;">Bobinas:</div>
          ${bobinasHTML}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function pendentesMontarZPL() {
  let lista = etiquetasPendentes.map(p => {
    let dataQR = '';
    let origemData = p.dataProducao || p.dataCriacao || '';

    if (origemData) {
      let partesData = origemData.split(", ");
      if (partesData.length === 2) {
        let dma = partesData[0].split("/");
        let hms = partesData[1].replace(/:/g, "");
        if (dma.length === 3 && hms.length >= 4) {
          dataQR = "/" + dma[0] + dma[1] + dma[2] + "/" + hms;
        }
      }
    }

    return {
      qrData: 'BOB/' + p.item + '/' + p.versao + '/' + Math.round(p.peso) + dataQR + '/' + p.idCurto,
      desc: p.item + '/' + p.versao + ' - ' + p.peso,
      medida: p.tamanho || ''
    };
  });

  return montarZPLDeLista(lista, 8);
}

function pendentesVisualizarZPL() {
  if (etiquetasPendentes.length === 0) {
    mostrarToast('Nenhuma pendente', 'erro');
    return;
  }

  let todas = etiquetasPendentes.map(p => {
    let dataQR = '';
    let origemData = p.dataProducao || p.dataCriacao || '';

    if (origemData) {
      let partesData = origemData.split(", ");
      if (partesData.length === 2) {
        let dma = partesData[0].split("/");
        let hms = partesData[1].replace(/:/g, "");
        if (dma.length === 3 && hms.length >= 4) {
          dataQR = "/" + dma[0] + dma[1] + dma[2] + "/" + hms;
        }
      }
    }

    return {
      qrData: 'BOB/' + p.item + '/' + p.versao + '/' + Math.round(p.peso) + dataQR + '/' + p.idCurto,
      item: p.item,
      versao: p.versao,
      peso: p.peso,
      medida: p.tamanho || ''
    };
  });

  previewDados.bobinas = todas;
  previewDados.paginaAtual = 0;
  previewDados.totalPaginas = Math.ceil(todas.length / 8);
  previewDados.origem = 'pendentes';
  document.getElementById('previewInfo').textContent =
    '100 × 60 mm — ' + todas.length + ' bobina(s) em ' + previewDados.totalPaginas + ' etiqueta(s)';
  document.getElementById('modalPreviewEtiqueta').classList.remove('hidden');
  gerarPreviewsQR(function() { desenharPreviewPagina(0); });
}

function pendentesCopiarZPL() {
  if (etiquetasPendentes.length === 0) { mostrarToast('Nenhuma pendente', 'erro'); return; }
  let zpl = pendentesMontarZPL();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(zpl).then(() => {
      mostrarToast('ZPL das pendentes copiado');
      if (navigator.vibrate) navigator.vibrate([50]);
    }).catch(() => { geradorCopiarFallback(zpl); });
  } else { geradorCopiarFallback(zpl); }
}

function pendentesLimparTudo() {
  if (etiquetasPendentes.length === 0) return;
  if (!confirm('Remover todas as ' + etiquetasPendentes.length + ' etiquetas pendentes?')) return;
  etiquetasPendentes = [];
  salvarPendentes();
  fecharPendentes();
  mostrarToast('Pendentes removidas');
}

function copiarZPLDoPreview() {
  let zpl = '';

  // Veio do gerador
  if (geradorBobinas.length > 0) {
    zpl = geradorMontarZPL();
  }
  // Veio das pendentes
  else if (previewDados.origem === 'pendentes' && etiquetasPendentes.length > 0) {
    zpl = pendentesMontarZPL();
  }
  // Veio do menu exportar
  else {
    let bobinas = coletarBobinasParaQR(previewDados.dataInicio, previewDados.dataFim);
    let lista = bobinas.map(bob => ({ qrData: bob.qrData, desc: bob.item + '/' + bob.versao + ' - ' + bob.peso, medida: bob.medida || bob.tamanho || '' }));
    zpl = montarZPLDeLista(lista, previewDados.qrPorEtiqueta || 8);
  }

  if (!zpl) { mostrarToast('Nenhum ZPL para copiar', 'erro'); return; }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(zpl).then(() => {
      mostrarToast('ZPL copiado para a área de transferência');
      if (navigator.vibrate) navigator.vibrate([50]);
    }).catch(() => { geradorCopiarFallback(zpl); });
  } else {
    geradorCopiarFallback(zpl);
  }
}

function geradorLimparEFechar() {
  if (geradorBobinas.length > 0) {
    if (!confirm('Descartar as etiquetas geradas?')) return;
  }
  geradorResetarTudo();
  document.getElementById('modalGerador').classList.add('hidden');
  mostrarToast('Etiquetas descartadas');
}

function geradorExportarDoPreview() { fecharPreviewEtiqueta(); geradorGerarZPL(); }

/* ================= CONFIGURAÇÃO DE DATA DE PRODUÇÃO ================= */
// Opções disponíveis:
//   'geracao'  → usa a data/hora do momento em que clica "Concluir" no gerador
//   'entrada'  → usa a data/hora do momento em que escaneia para dar entrada no estoque
//   'manual'   → o usuário escolhe a data/hora manualmente no campo do gerador
// Para remover/editar: busque por "CONFIGURAÇÃO DE DATA DE PRODUÇÃO"

let opcaoDataProducao = localStorage.getItem('opcaoDataProducao') || 'geracao';

function abrirConfigDataProducao() {
  fecharModalConfig();
  
  let modal = document.getElementById('modalConfigDataProducao');
  modal.classList.remove('hidden');

  // Marca a opção salva corretamente
  modal.querySelectorAll('input[name="opcaoData"]').forEach(function(radio) {
    radio.checked = (radio.value === opcaoDataProducao);
  });
}

function fecharConfigDataProducao() {
  document.getElementById('modalConfigDataProducao').classList.add('hidden');
}

function salvarOpcaoData(opcao) {
  opcaoDataProducao = opcao;
  localStorage.setItem('opcaoDataProducao', opcao);
  atualizarCampoDataManualGerador();
  mostrarToast('Data de produção: ' + nomeOpcaoData(opcao));

  if (typeof salvarNoFirebase === 'function') {
    salvarNoFirebase();
  }
}

function nomeOpcaoData(opcao) {
  if (opcao === 'geracao') return 'data da geração';
  if (opcao === 'entrada') return 'data da entrada';
  if (opcao === 'manual') return 'manual';
  return opcao;
}

function atualizarCampoDataManualGerador() {
  // Mostra ou esconde o campo de data manual no gerador
  let container = document.getElementById('geradorDataManualContainer');
  if (!container) return;

  if (opcaoDataProducao === 'manual') {
    container.classList.remove('hidden');
    // Define valor padrão como agora
    let input = document.getElementById('geradorDataManual');
    if (input && !input.value) {
      let agora = new Date();
      agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
      input.value = agora.toISOString().slice(0, 16);
    }
  } else {
    container.classList.add('hidden');
  }
}

function obterDataProducaoParaEtiqueta() {
  // Retorna a data formatada para gravar na etiqueta/QR
  // Chamada quando uma bobina é adicionada no gerador

  if (opcaoDataProducao === 'geracao') {
    return new Date().toLocaleString('pt-BR');
  }

  if (opcaoDataProducao === 'manual') {
    let input = document.getElementById('geradorDataManual');
    if (input && input.value) {
      return new Date(input.value).toLocaleString('pt-BR');
    }
    return new Date().toLocaleString('pt-BR');
  }

  // Para 'entrada', retorna null (será definida na hora da entrada)
  return null;
}

/* ================= CONFERÊNCIA DE INVENTÁRIO ================= */

let conferencia = {
  ativa: false,
  tipo: 'tudo',
  dataInicio: null,
  fotoEstoque: [],
  conferidas: [],
  extras: [],
  scannerAberto: false,
  leitor: null,
  continuoMode: false
};

function abrirConferencia() {
  fecharModalConfig();

  let salva = localStorage.getItem('conferencia');
  if (salva) {
    try {
      let dados = JSON.parse(salva);
      if (dados.ativa) {
        if (confirm('Existe uma conferência em andamento.\n\nContinuar?')) {
          conferencia = dados;
          mostrarTelaConf('confTelaAndamento');
          confRenderizarLista();
          document.getElementById('modalConferencia').classList.remove('hidden');
          return;
        } else {
          localStorage.removeItem('conferencia');
        }
      }
    } catch (e) {}
  }

  conferencia = {
    ativa: false,
    tipo: 'tudo',
    dataInicio: null,
    fotoEstoque: [],
    conferidas: [],
    extras: [],
    scannerAberto: false,
    leitor: null,
    continuoMode: false
  };

  mostrarTelaConf('confTelaIniciar');
  document.getElementById('modalConferencia').classList.remove('hidden');
}

function fecharConferencia() {
  document.getElementById('modalConferencia').classList.add('hidden');
  if (conferencia.leitor) {
    try { conferencia.leitor.stop(); conferencia.leitor.clear(); } catch (e) {}
    conferencia.leitor = null;
  }
}

function mostrarTelaConf(telaId) {
  ['confTelaIniciar', 'confTelaAndamento', 'confTelaResultado'].forEach(id => {
    let el = document.getElementById(id);
    if (el) {
      el.classList.add('hidden');
      el.style.display = 'none';
    }
  });
  let tela = document.getElementById(telaId);
  if (tela) {
    tela.classList.remove('hidden');
    tela.style.display = 'flex';
    tela.style.flexDirection = 'column';
    tela.style.flex = '1';
    tela.style.minHeight = '0';
  }
}

function iniciarConferencia() {
  let tipoSelecionado = document.querySelector('input[name="confTipo"]:checked').value;

  let foto = [];
  historico.forEach(h => {
    if (h.tipo !== 'Entrada' || h._removidaEstoque || h.consumida) return;
    let partes = h.item.split(' - V');
    if (partes.length < 2) return;
    let item = partes[0], versao = partes[1];

    let tipoItem = '';
    Object.keys(banco).forEach(t => { if (banco[t] && banco[t][item]) tipoItem = t; });

    if (tipoSelecionado !== 'tudo' && tipoItem !== tipoSelecionado) return;

    if (!estoque[h.item] || estoque[h.item] <= 0) return;

    let tamanho = '';
    if (banco[tipoItem] && banco[tipoItem][item] && banco[tipoItem][item][versao]) {
      tamanho = banco[tipoItem][item][versao].tamanho;
    }

    let idCurto = '';
if (h.id && typeof h.id === 'string') {
  if (h.id.includes('/')) {
    idCurto = h.id.split('/').pop();
  } else if (h.id.includes('-')) {
    idCurto = h.id.replace(/-/g, '').substring(0, 8);
  } else {
    idCurto = h.id.substring(0, 8);
  }
}

    foto.push({
      id: h.id,
      idCurto: idCurto,
      item: item,
      versao: versao,
      identificador: h.item,
      tipo: tipoItem,
      peso: h.qtd,
      tamanho: tamanho,
      data: h.data
    });
  });

  if (foto.length === 0) {
    mostrarToast('Nenhuma bobina no estoque para conferir', 'erro');
    return;
  }

  conferencia.ativa = true;
  conferencia.tipo = tipoSelecionado;
  conferencia.dataInicio = new Date().toLocaleString('pt-BR');
  conferencia.fotoEstoque = foto;
  conferencia.conferidas = [];
  conferencia.extras = [];

  confSalvar();
  mostrarTelaConf('confTelaAndamento');
  confRenderizarLista();
  mostrarToast('Conferência iniciada — ' + foto.length + ' bobina(s)');
}

function confSalvar() {
  let dados = {
    ativa: conferencia.ativa,
    tipo: conferencia.tipo,
    dataInicio: conferencia.dataInicio,
    fotoEstoque: conferencia.fotoEstoque,
    conferidas: conferencia.conferidas,
    extras: conferencia.extras
  };
  localStorage.setItem('conferencia', JSON.stringify(dados));
}

function pausarConferencia() {
  confSalvar();
  fecharConferencia();
  mostrarToast('Conferência pausada');
}

function confRenderizarLista() {
  let container = document.getElementById('confLista');
  if (!container) return;

  let termo = '';
  let buscaEl = document.getElementById('confBusca');
  if (buscaEl) termo = normalizarTexto(buscaEl.value);

  let totalBobinas = conferencia.fotoEstoque.length;
  let totalConferidas = conferencia.conferidas.length;
  let percentual = totalBobinas > 0 ? Math.round((totalConferidas / totalBobinas) * 100) : 0;

  let progEl = document.getElementById('confProgresso');
  if (progEl) progEl.textContent = totalConferidas + '/' + totalBobinas + ' (' + percentual + '%)';

  let barraEl = document.getElementById('confBarra');
  if (barraEl) barraEl.style.width = percentual + '%';

  let html = '';

  // Extras
  if (conferencia.extras.length > 0) {
    html += '<div style="font-size:12px; font-weight:700; color:#ca8a04; padding:4px 0;">⚠️ Extras (' + conferencia.extras.length + ')</div>';
    conferencia.extras.forEach((extra, idx) => {
      let textoBusca = normalizarTexto(extra.item + ' ' + extra.versao + ' ' + extra.peso);
      if (termo && !textoBusca.includes(termo)) return;
      html += `
        <div style="display:flex; align-items:center; padding:8px; background:#fefce8; border:1px solid #fde68a; border-radius:8px; gap:8px;">
          <span style="font-size:16px;">⚠️</span>
          <div style="flex:1;">
            <div style="font-size:13px; font-weight:600;">${extra.item} — V${extra.versao}</div>
            <div style="font-size:11px; color:#64748b;">${extra.peso} kg · ${extra.tamanho || ''}</div>
          </div>
          <button class="btn-clear" style="width:28px; height:28px; font-size:12px;" onclick="confRemoverExtra(${idx})">X</button>
        </div>
      `;
    });
  }

  // Conferidas
  let conferidas = conferencia.fotoEstoque.filter(b => conferencia.conferidas.includes(b.id));
  if (conferidas.length > 0) {
    html += '<div style="font-size:12px; font-weight:700; color:#16a34a; padding:4px 0;">✅ Conferidas (' + conferidas.length + ')</div>';
    conferidas.forEach(bob => {
      let textoBusca = normalizarTexto(bob.item + ' ' + bob.versao + ' ' + bob.peso + ' ' + bob.tamanho);
      if (termo && !textoBusca.includes(termo)) return;
      html += `
        <div style="display:flex; align-items:center; padding:8px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; gap:8px;">
          <span style="font-size:16px;">✅</span>
          <div style="flex:1;">
            <div style="font-size:13px; font-weight:600;">${bob.item} — V${bob.versao}</div>
            <div style="font-size:11px; color:#64748b;">${Math.round(bob.peso)} kg · ${bob.tamanho}</div>
          </div>
          <button style="background:#dc2626; color:white; border:none; border-radius:6px; width:28px; height:28px; font-size:12px; cursor:pointer;" onclick="confDesmarcar('${bob.id}')">↩</button>
        </div>
      `;
    });
  }

  // Pendentes
  let pendentes = conferencia.fotoEstoque.filter(b => !conferencia.conferidas.includes(b.id));
  if (pendentes.length > 0) {
    html += '<div style="font-size:12px; font-weight:700; color:#64748b; padding:4px 0;">⬜ Pendentes (' + pendentes.length + ')</div>';
    pendentes.forEach(bob => {
      let textoBusca = normalizarTexto(bob.item + ' ' + bob.versao + ' ' + bob.peso + ' ' + bob.tamanho);
      if (termo && !textoBusca.includes(termo)) return;
      html += `
        <div style="display:flex; align-items:center; padding:8px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; gap:8px; cursor:pointer;" onclick="confMarcarManual('${bob.id}')">
          <span style="font-size:16px;">⬜</span>
          <div style="flex:1;">
            <div style="font-size:13px; font-weight:600;">${bob.item} — V${bob.versao}</div>
            <div style="font-size:11px; color:#64748b;">${Math.round(bob.peso)} kg · ${bob.tamanho}</div>
          </div>
        </div>
      `;
    });
  }

  if (!html) html = '<div style="text-align:center; color:#94a3b8; padding:20px;">Nenhuma bobina encontrada</div>';
  container.innerHTML = html;
}

function confFiltrarLista() {
  confRenderizarLista();
}

function confMarcarManual(id) {
  if (conferencia.conferidas.includes(id)) {
    mostrarToast('Já conferida', 'erro');
    return;
  }
  conferencia.conferidas.push(id);
  confSalvar();
  confRenderizarLista();
  if (navigator.vibrate) navigator.vibrate([50]);
}

function confDesmarcar(id) {
  conferencia.conferidas = conferencia.conferidas.filter(c => c !== id);
  confSalvar();
  confRenderizarLista();
}

function confRemoverExtra(idx) {
  conferencia.extras.splice(idx, 1);
  confSalvar();
  confRenderizarLista();
}

function confProcessarLeitura(textoLido) {
  let dados = null;
  try {
    dados = JSON.parse(textoLido);
  } catch (e) {
    dados = interpretarQRSimplificado(textoLido);
  }

  if (!dados) {
    mostrarToast('QR inválido', 'erro');
    return 'erro';
  }

  let encontrada = null;

  // 1) Match EXATO pelo conteúdo inteiro do QR / id salvo
  if (dados.id) {
    encontrada = conferencia.fotoEstoque.find(bob =>
      String(bob.id || '') === String(dados.id)
    ) || null;
  }

  // 2) Fallback pelo ID curto final
  if (!encontrada && dados.bobinaId) {
    encontrada = conferencia.fotoEstoque.find(bob =>
      String(bob.idCurto || '') === String(dados.bobinaId)
    ) || null;
  }

  // 3) Fallback por data + item + versão + peso
  if (!encontrada && dados.dataBruta) {
    encontrada = conferencia.fotoEstoque.find(bob => {
      let dataNumBob = String(bob.data || '').replace(/[^0-9]/g, '');
      let dataNumQR = String(dados.dataBruta || '').replace(/[^0-9]/g, '');

      return (
        dataNumBob === dataNumQR &&
        String(bob.item) === String(dados.item) &&
        String(bob.versao) === String(dados.versao) &&
        Math.round(Number(bob.peso)) === Math.round(Number(dados.peso))
      );
    }) || null;
  }

  // 4) Último fallback: item + versão + peso
  if (!encontrada) {
    encontrada = conferencia.fotoEstoque.find(bob =>
      String(bob.item) === String(dados.item) &&
      String(bob.versao) === String(dados.versao) &&
      Math.round(Number(bob.peso)) === Math.round(Number(dados.peso))
    ) || null;
  }

  if (encontrada) {
    if (conferencia.conferidas.includes(encontrada.id)) {
      return 'duplicada';
    }

    conferencia.conferidas.push(encontrada.id);
    confSalvar();
    confRenderizarLista();
    return 'conferida';
  }

  // Bobina extra
  let tamanho = '';
  let tipo = dados.tipo || descobrirTipoPorItem(dados.item);

  if (tipo && banco[tipo] && banco[tipo][dados.item] && banco[tipo][dados.item][String(dados.versao)]) {
    tamanho = banco[tipo][dados.item][String(dados.versao)].tamanho;
  }

  conferencia.extras.push({
    item: dados.item,
    versao: String(dados.versao),
    peso: dados.peso,
    tamanho: tamanho,
    tipo: tipo
  });

  confSalvar();
  confRenderizarLista();
  return 'extra';
}

// Scanner QR único
async function confScannerQR() {
  conferencia.continuoMode = false;
  document.getElementById('confScannerTitulo').textContent = 'Escanear para conferência';
  document.getElementById('confScannerStatus').textContent = conferencia.conferidas.length + ' conferida(s)';
  document.getElementById('confScannerLog').innerHTML = '';
  document.getElementById('readerConf').innerHTML = '';
  document.getElementById('modalScannerConf').classList.remove('hidden');

  try {
    conferencia.leitor = new Html5Qrcode('readerConf');
    await conferencia.leitor.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      async (decodedText) => {
        let resultado = confProcessarLeitura(decodedText);
        confLogScanner(resultado, decodedText);
        document.getElementById('confScannerStatus').textContent = conferencia.conferidas.length + ' conferida(s)';

        if (!conferencia.continuoMode) {
          await confFecharScanner();
        }
      },
      () => {}
    );
  } catch (e) {
    console.error('Erro scanner conferência:', e);
    mostrarToast('Não foi possível abrir a câmera', 'erro');
    confFecharScanner();
  }
}

// Scanner contínuo
async function confScannerContinuo() {
  conferencia.continuoMode = true;
  document.getElementById('confScannerTitulo').textContent = 'Leitura contínua — Conferência';
  document.getElementById('confScannerStatus').textContent = conferencia.conferidas.length + ' conferida(s)';
  document.getElementById('confScannerLog').innerHTML = '';
  document.getElementById('readerConf').innerHTML = '';
  document.getElementById('modalScannerConf').classList.remove('hidden');

  let processando = false;
  let ultimoLido = '';

  try {
    conferencia.leitor = new Html5Qrcode('readerConf');
    await conferencia.leitor.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      async (decodedText) => {
        if (processando || decodedText === ultimoLido) return;
        processando = true;
        ultimoLido = decodedText;

        let resultado = confProcessarLeitura(decodedText);
        confLogScanner(resultado, decodedText);
        document.getElementById('confScannerStatus').textContent = conferencia.conferidas.length + ' conferida(s)';

        setTimeout(() => { processando = false; }, 1500);
      },
      () => {}
    );
  } catch (e) {
    console.error('Erro scanner conferência:', e);
    mostrarToast('Não foi possível abrir a câmera', 'erro');
    confFecharScanner();
  }
}

function confLogScanner(resultado, texto) {
  let log = document.getElementById('confScannerLog');
  let agora = new Date().toLocaleTimeString();
  let div = document.createElement('div');
  div.style.padding = '3px 0';
  div.style.borderBottom = '1px solid #f1f5f9';

  let dados = null;
  try { dados = JSON.parse(texto); } catch (e) { dados = interpretarQRSimplificado(texto); }
  let nome = dados ? (dados.item + ' V' + dados.versao) : texto.substring(0, 20);

  if (resultado === 'conferida') {
    div.style.color = '#16a34a';
    div.textContent = '✅ ' + agora + ' — ' + nome + ' conferida';
    if (navigator.vibrate) navigator.vibrate([100]);
  } else if (resultado === 'duplicada') {
    div.style.color = '#ca8a04';
    div.textContent = '⏭️ ' + agora + ' — ' + nome + ' já conferida';
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
  } else if (resultado === 'extra') {
    div.style.color = '#ca8a04';
    div.textContent = '⚠️ ' + agora + ' — ' + nome + ' extra (não no estoque)';
    if (navigator.vibrate) navigator.vibrate([200]);
  } else {
    div.style.color = '#dc2626';
    div.textContent = '❌ ' + agora + ' — QR inválido';
    if (navigator.vibrate) navigator.vibrate([200]);
  }

  if (log.firstChild) log.insertBefore(div, log.firstChild);
  else log.appendChild(div);
}

async function confFecharScanner() {
  try {
    if (conferencia.leitor) {
      await conferencia.leitor.stop();
      await conferencia.leitor.clear();
    }
  } catch (e) {}
  conferencia.leitor = null;
  document.getElementById('modalScannerConf').classList.add('hidden');
  document.getElementById('readerConf').innerHTML = '';
  confRenderizarLista();
}

function finalizarConferencia() {
  let pendentes = conferencia.fotoEstoque.filter(b => !conferencia.conferidas.includes(b.id));
  let conferidas = conferencia.fotoEstoque.filter(b => conferencia.conferidas.includes(b.id));

  if (conferidas.length === 0) {
    mostrarToast('Nenhuma bobina foi conferida ainda', 'erro');
    return;
  }

  if (pendentes.length > 0) {
    if (!confirm('Ainda há ' + pendentes.length + ' bobina(s) não conferida(s).\n\nFinalizar mesmo assim?')) return;
  }

  conferencia.ativa = false;
  confSalvar();

  // Resultado
  document.getElementById('confResConferidas').textContent = conferidas.length;
  document.getElementById('confResNaoEncontradas').textContent = pendentes.length;
  document.getElementById('confResExtras').textContent = conferencia.extras.length;

  let html = '';

  if (conferidas.length > 0) {
    html += '<div style="font-size:12px; font-weight:700; color:#16a34a; padding:4px 0;">✅ Conferidas (' + conferidas.length + ')</div>';
    conferidas.forEach(bob => {
      html += `
        <div style="padding:6px 8px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; font-size:12px;">
          ✅ ${bob.item} — V${bob.versao} · ${Math.round(bob.peso)} kg · ${bob.tamanho}
        </div>
      `;
    });
  }

  if (pendentes.length > 0) {
    html += '<div style="font-size:12px; font-weight:700; color:#dc2626; padding:4px 0;">❌ Não encontradas (' + pendentes.length + ')</div>';
    pendentes.forEach(bob => {
      html += `
        <div style="padding:6px 8px; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; font-size:12px;">
          ❌ ${bob.item} — V${bob.versao} · ${Math.round(bob.peso)} kg · ${bob.tamanho}
        </div>
      `;
    });
  }

  if (conferencia.extras.length > 0) {
    html += '<div style="font-size:12px; font-weight:700; color:#ca8a04; padding:4px 0;">⚠️ Extras (' + conferencia.extras.length + ')</div>';
    conferencia.extras.forEach(extra => {
      html += `
        <div style="padding:6px 8px; background:#fefce8; border:1px solid #fde68a; border-radius:6px; font-size:12px;">
          ⚠️ ${extra.item} — V${extra.versao} · ${Math.round(extra.peso)} kg · ${extra.tamanho || ''}
        </div>
      `;
    });
  }

  document.getElementById('confListaResultado').innerHTML = html;
  mostrarTelaConf('confTelaResultado');
}

function confAjustarEstoque() {
  let pendentes = conferencia.fotoEstoque.filter(b => !conferencia.conferidas.includes(b.id));

  if (pendentes.length === 0 && conferencia.extras.length === 0) {
    mostrarToast('Nada para ajustar', 'erro');
    return;
  }

  let msg = '🔧 Ajustar estoque:\n\n';
  if (pendentes.length > 0) msg += '❌ Remover ' + pendentes.length + ' bobina(s) não encontrada(s)\n';
  if (conferencia.extras.length > 0) msg += '⚠️ Adicionar ' + conferencia.extras.length + ' bobina(s) extra(s)\n';
  msg += '\nDeseja continuar?';

  if (!confirm(msg)) return;

  salvarEstadoParaDesfazer();

  // Remover não encontradas
  pendentes.forEach(bob => {
    let reg = historico.find(h => h.id === bob.id);
    if (reg) {
      reg._removidaEstoque = true;
      historico.push({
        id: crypto.randomUUID(),
        data: new Date().toLocaleString(),
        tipo: 'Exclusão',
        item: bob.identificador,
        qtd: bob.peso,
        refEntradaId: bob.id,
        refEntradaData: bob.data
      });

      if (estoque[bob.identificador]) {
        estoque[bob.identificador] -= bob.peso;
        if (estoque[bob.identificador + '_qtd'] > 0) estoque[bob.identificador + '_qtd']--;
        if (estoque[bob.identificador] <= 0) {
          delete estoque[bob.identificador];
          delete estoque[bob.identificador + '_qtd'];
        }
      }
    }
  });

  // Adicionar extras
  conferencia.extras.forEach(extra => {
    let identificador = extra.item + ' - V' + extra.versao;
    estoque[identificador] = (estoque[identificador] || 0) + extra.peso;
    estoque[identificador + '_qtd'] = (estoque[identificador + '_qtd'] || 0) + 1;

    historico.push({
      id: crypto.randomUUID(),
      data: new Date().toLocaleString(),
      tipo: 'Entrada',
      item: identificador,
      qtd: extra.peso
    });
  });

  salvarDados();
  atualizarTudo();
  localStorage.removeItem('conferencia');
  fecharConferencia();

  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  mostrarToast('Estoque ajustado pela conferência');
}

function confExportarResultado() {
  let conferidas = conferencia.fotoEstoque.filter(b => conferencia.conferidas.includes(b.id));
  let pendentes = conferencia.fotoEstoque.filter(b => !conferencia.conferidas.includes(b.id));

  const wb = XLSX.utils.book_new();
  let linhas = [];

  linhas.push(['CONFERÊNCIA DE INVENTÁRIO', '', '', '', '']);
  linhas.push(['Data início:', conferencia.dataInicio, '', '', '']);
  linhas.push(['Data fim:', new Date().toLocaleString('pt-BR'), '', '', '']);
  linhas.push(['Tipo:', conferencia.tipo === 'tudo' ? 'Todos' : nomeCompletoTipo(conferencia.tipo), '', '', '']);
  linhas.push(['', '', '', '', '']);
  linhas.push(['RESUMO', '', '', '', '']);
  linhas.push(['Conferidas:', conferidas.length, '', '', '']);
  linhas.push(['Não encontradas:', pendentes.length, '', '', '']);
  linhas.push(['Extras:', conferencia.extras.length, '', '', '']);
  linhas.push(['', '', '', '', '']);

  if (conferidas.length > 0) {
    linhas.push(['CONFERIDAS', '', '', '', '']);
    linhas.push(['Item', 'Versão', 'Medidas', 'Kg', 'Status']);
    conferidas.forEach(b => linhas.push([b.item, b.versao, b.tamanho, Math.round(b.peso), 'Conferida']));
    linhas.push(['', '', '', '', '']);
  }

  if (pendentes.length > 0) {
    linhas.push(['NÃO ENCONTRADAS', '', '', '', '']);
    linhas.push(['Item', 'Versão', 'Medidas', 'Kg', 'Status']);
    pendentes.forEach(b => linhas.push([b.item, b.versao, b.tamanho, Math.round(b.peso), 'Não encontrada']));
    linhas.push(['', '', '', '', '']);
  }

  if (conferencia.extras.length > 0) {
    linhas.push(['EXTRAS', '', '', '', '']);
    linhas.push(['Item', 'Versão', 'Medidas', 'Kg', 'Status']);
    conferencia.extras.forEach(b => linhas.push([b.item, b.versao, b.tamanho || '', Math.round(b.peso), 'Extra']));
  }

  const ws = XLSX.utils.aoa_to_sheet(linhas);
  ws['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Conferência');
  XLSX.writeFile(wb, 'Conferencia_' + getTimestamp() + '.xlsx');
  mostrarToast('Relatório exportado');
}

/* ================= EXPOSIÇÃO GLOBAL ================= */

window.fecharGerador = fecharGerador;
window.abrirGerador = abrirGerador;
window.abrirModalGerador = abrirGerador;
window.geradorFiltrarTipo = geradorFiltrarTipo;
window.geradorFiltrarItem = geradorFiltrarItem;
window.geradorFiltrarBusca = geradorFiltrarBusca;
window.geradorLimparBusca = geradorLimparBusca;
window.geradorSelecionouVersao = geradorSelecionouVersao;
window.geradorAdicionar = geradorAdicionar;
window.geradorRepetirUltimo = geradorRepetirUltimo;
window.geradorEditar = geradorEditar;
window.geradorRemover = geradorRemover;
window.geradorRemoverBobina = geradorRemoverBobina;
window.geradorEditarBobina = geradorEditarBobina;
window.geradorAddAoGrupo = geradorAddAoGrupo;
window.geradorToggleCard = geradorToggleCard;
window.geradorAvancar = geradorAvancar;
window.geradorVoltar = geradorVoltar;
window.geradorGerarZPL = geradorGerarZPL;
window.geradorCopiarZPL = geradorCopiarZPL;
window.geradorVisualizarZPL = geradorVisualizarZPL;
window.geradorExportarDoPreview = geradorExportarDoPreview;
window.geradorConcluir = geradorConcluir;
window.geradorCancelar = geradorCancelar;
window.geradorIrPassoClicavel = geradorIrPassoClicavel;
window.abrirPreviewEtiqueta = abrirPreviewEtiqueta;
window.fecharPreviewEtiqueta = fecharPreviewEtiqueta;
window.previewPaginaAnterior = previewPaginaAnterior;
window.previewProximaPagina = previewProximaPagina;
window.confirmarExportZPL = confirmarExportZPL;
window.selecionarTipoExport = selecionarTipoExport;
window.selecionarFormato = selecionarFormato;
window.toggleExportPeriodo = toggleExportPeriodo;
window.executarExportacaoNova = executarExportacaoNova;
window.exportarZPLZebra = exportarZPLZebra;
window.exportarQRCodesZIP = exportarQRCodesZIP;
window.exportarCSVZebra = function() { exportarCSVZebraMult(null, null, 8); };
window.abrirPendentes = abrirPendentes;
window.fecharPendentes = fecharPendentes;
window.removerPendentePorIndex = removerPendentePorIndex;
window.pendentesVisualizarZPL = pendentesVisualizarZPL;
window.pendentesCopiarZPL = pendentesCopiarZPL;
window.pendentesLimparTudo = pendentesLimparTudo;
window.fecharResultadoQR = fecharResultadoQR;
window.usarQRNaMovimentacao = usarQRNaMovimentacao;
window.entradaRapidaQR = entradaRapidaQR;
window.consumirBobinaQR = consumirBobinaQR;
window.desmarcarConsumidaQR = desmarcarConsumidaQR;
window.excluirBobinaQR = excluirBobinaQR;
window.abrirScannerQR = abrirScannerQR;
window.fecharScannerQR = fecharScannerQR;
window.gerarQRBobina = gerarQRBobina;
window.fecharModalQR = fecharModalQR;
window.abrirAcoesHistorico = abrirAcoesHistorico;
window.fecharModalHistoricoAcoes = fecharModalHistoricoAcoes;
window.abrirQRDoHistorico = abrirQRDoHistorico;
window.confirmarRemoverHistoricoSelecionado = confirmarRemoverHistoricoSelecionado;
async function fecharScannerContinuo() {
  try {
    if (leitorContinuo) {
      await leitorContinuo.stop().catch(() => {});
      await leitorContinuo.clear().catch(() => {});
    }
  } catch (e) {
    console.warn("Erro ao fechar scanner contínuo:", e);
  }

  leitorContinuo = null;
  leitorContinuoAberto = false;
  continuoProcessando = false;

  let modal = document.getElementById("modalScannerContinuo");
  if (modal) modal.classList.add("hidden");

  let reader = document.getElementById("readerContinuo");
  if (reader) reader.innerHTML = "";

  if (continuoContagem > 0) {
    atualizarTudo();
    mostrarToast(continuoContagem + " bobina(s) adicionada(s)");
  }
}
window.abrirScannerContinuo = abrirScannerContinuo;
window.fecharScannerContinuo = fecharScannerContinuo;
window.geradorFecharFinal = geradorFecharFinal;
window.geradorFecharSimples = geradorFecharSimples;
window.abrirModalConfig = abrirModalConfig;
window.fecharModalConfig = fecharModalConfig;
window.voltarConfigPrincipal = voltarConfigPrincipal;
window.abrirConfigExportar = abrirConfigExportar;
window.abrirConfigBackup = abrirConfigBackup;
window.alternarModoEscuro = alternarModoEscuro;
window.abrirConfigCadastro = abrirConfigCadastro;
window.copiarZPLDoPreview = copiarZPLDoPreview;
window.geradorLimparEFechar = geradorLimparEFechar;
window.abrirConfigDataProducao = abrirConfigDataProducao;
window.fecharConfigDataProducao = fecharConfigDataProducao;
window.salvarOpcaoData = salvarOpcaoData;
window.abrirConferencia = abrirConferencia;
window.fecharConferencia = fecharConferencia;
window.iniciarConferencia = iniciarConferencia;
window.pausarConferencia = pausarConferencia;
window.confMarcarManual = confMarcarManual;
window.confDesmarcar = confDesmarcar;
window.confRemoverExtra = confRemoverExtra;
window.confFiltrarLista = confFiltrarLista;
window.confScannerQR = confScannerQR;
window.confScannerContinuo = confScannerContinuo;
window.confFecharScanner = confFecharScanner;
window.finalizarConferencia = finalizarConferencia;
window.confAjustarEstoque = confAjustarEstoque;
window.confExportarResultado = confExportarResultado;
