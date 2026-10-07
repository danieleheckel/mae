const STORAGE_KEY = "plantas";
const PLANTAS_POR_PAGINA = 12; // ao encher uma página, outra é criada

const form = document.getElementById("form-planta");
const nomeInput = document.getElementById("nome");
const descricaoInput = document.getElementById("descricao");
const imagemInput = document.getElementById("imagem");
const avisoImagem = document.getElementById("aviso-imagem");
const botaoSubmit = document.getElementById("botao-submit");
const botaoCancelar = document.getElementById("botao-cancelar");
const catalogo = document.getElementById("catalogo");
const mensagemVazia = document.getElementById("mensagem-vazia");
const paginacao = document.getElementById("paginacao");

let plantas = carregarPlantas();
let paginaAtual = 1;
let idEmEdicao = null; // quando não é null, o formulário está editando

function carregarPlantas() {
  try {
    const dados = localStorage.getItem(STORAGE_KEY);
    return dados ? JSON.parse(dados) : [];
  } catch {
    return [];
  }
}

function salvarPlantas() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plantas));
}

function ordenarPlantas() {
  plantas.sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
  );
}

function gerarId() {
  return crypto.randomUUID();
}

/* ---------- Padronização de imagens ---------- */

const LARGURA_PADRAO = 800;
const ALTURA_PADRAO = 600;

// Redimensiona e recorta qualquer imagem para 800x600 (proporção 4:3),
// independente do tamanho original do arquivo.
function padronizarImagem(arquivo) {
  return new Promise((resolver, rejeitar) => {
    const reader = new FileReader();

    reader.onerror = () => rejeitar(new Error("Falha ao ler o arquivo."));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => rejeitar(new Error("Arquivo de imagem inválido."));

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = LARGURA_PADRAO;
        canvas.height = ALTURA_PADRAO;

        const ctx = canvas.getContext("2d");

        // Recorte centralizado (estilo "cover"): preenche 800x600 sem distorcer
        const escala = Math.max(
          LARGURA_PADRAO / img.width,
          ALTURA_PADRAO / img.height
        );
        const larguraRecorte = LARGURA_PADRAO / escala;
        const alturaRecorte = ALTURA_PADRAO / escala;
        const origemX = (img.width - larguraRecorte) / 2;
        const origemY = (img.height - alturaRecorte) / 2;

        ctx.drawImage(
          img,
          origemX,
          origemY,
          larguraRecorte,
          alturaRecorte,
          0,
          0,
          LARGURA_PADRAO,
          ALTURA_PADRAO
        );

        resolver(canvas.toDataURL("image/jpeg", 0.85));
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(arquivo);
  });
}

function validarArquivo(arquivo) {
  if (!arquivo) {
    alert("Selecione uma imagem.");
    return false;
  }

  if (!arquivo.type.startsWith("image/")) {
    alert("O arquivo selecionado precisa ser uma imagem.");
    return false;
  }

  const limiteMB = 3;
  if (arquivo.size > limiteMB * 1024 * 1024) {
    alert(`A imagem deve ter no máximo ${limiteMB} MB.`);
    return false;
  }

  return true;
}

/* ---------- Formulário ---------- */

function limparFormulario() {
  form.reset();
  idEmEdicao = null;
  botaoSubmit.textContent = "Adicionar";
  botaoCancelar.classList.add("oculto");
  avisoImagem.textContent = "";
  imagemInput.required = true;
  nomeInput.focus();
}

function iniciarEdicao(id) {
  const planta = plantas.find((p) => p.id === id);
  if (!planta) return;

  idEmEdicao = id;
  nomeInput.value = planta.nome;
  descricaoInput.value = planta.descricao || "";
  imagemInput.value = ""; // imagem atual é mantida se nenhuma nova for escolhida
  imagemInput.required = false;
  avisoImagem.textContent =
    "Editando: deixe o campo de imagem vazio para manter a imagem atual.";
  botaoSubmit.textContent = "Salvar alterações";
  botaoCancelar.classList.remove("oculto");

  form.scrollIntoView({ behavior: "smooth", block: "start" });
  nomeInput.focus();
}

/* ---------- Renderização ---------- */

function criarElemento(tag, texto = "") {
  const elemento = document.createElement(tag);
  if (texto) elemento.textContent = texto;
  return elemento;
}

function calcularTotalPaginas() {
  return Math.max(1, Math.ceil(plantas.length / PLANTAS_POR_PAGINA));
}

function renderizarPlantas() {
  const totalPaginas = calcularTotalPaginas();

  // Garante que a página atual continua válida após exclusões/edições
  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

  const inicio = (paginaAtual - 1) * PLANTAS_POR_PAGINA;
  const fim = inicio + PLANTAS_POR_PAGINA;
  const plantasDaPagina = plantas.slice(inicio, fim);

  catalogo.innerHTML = "";
  mensagemVazia.style.display = plantas.length === 0 ? "block" : "none";

  plantasDaPagina.forEach((planta) => {
    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
    img.className = "card-imagem";
    img.src = planta.imagem;
    img.alt = `Imagem da planta ${planta.nome}`;

    const conteudo = document.createElement("div");
    conteudo.className = "card-conteudo";

    const titulo = criarElemento("h3", planta.nome);
    const descricao = criarElemento(
      "p",
      planta.descricao || "Sem descrição informada."
    );

    const acoes = document.createElement("div");
    acoes.className = "card-acoes";

    const botaoEditar = criarElemento("button", "Editar");
    botaoEditar.type = "button";
    botaoEditar.className = "botao-editar";
    botaoEditar.addEventListener("click", () => iniciarEdicao(planta.id));

    const botaoExcluir = criarElemento("button", "Excluir");
    botaoExcluir.type = "button";
    botaoExcluir.className = "botao-excluir";
    botaoExcluir.addEventListener("click", () => excluirPlanta(planta.id));

    acoes.append(botaoEditar, botaoExcluir);
    conteudo.append(titulo, descricao, acoes);
    card.append(img, conteudo);
    catalogo.appendChild(card);
  });

  renderizarPaginacao(totalPaginas);
}

function renderizarPaginacao(totalPaginas) {
  paginacao.innerHTML = "";

  if (totalPaginas <= 1) return; // sem paginação enquanto cabe em uma página

  const botaoAnterior = criarElemento("button", "‹");
  botaoAnterior.type = "button";
  botaoAnterior.disabled = paginaAtual === 1;
  botaoAnterior.addEventListener("click", () => {
    paginaAtual--;
    renderizarPlantas();
  });

  const botaoProximo = criarElemento("button", "›");
  botaoProximo.type = "button";
  botaoProximo.disabled = paginaAtual === totalPaginas;
  botaoProximo.addEventListener("click", () => {
    paginaAtual++;
    renderizarPlantas();
  });

  paginacao.append(botaoAnterior);

  for (let numero = 1; numero <= totalPaginas; numero++) {
    const botaoPagina = criarElemento("button", String(numero));
    botaoPagina.type = "button";
    if (numero === paginaAtual) botaoPagina.classList.add("pagina-atual");
    botaoPagina.addEventListener("click", () => {
      paginaAtual = numero;
      renderizarPlantas();
    });
    paginacao.append(botaoPagina);
  }

  paginacao.append(botaoProximo);
}

/* ---------- Ações ---------- */

async function adicionarPlanta(event) {
  event.preventDefault();

  const nome = nomeInput.value.trim();
  const descricao = descricaoInput.value.trim();
  const arquivo = imagemInput.files[0];

  if (!nome) {
    alert("Preencha o nome da planta.");
    nomeInput.focus();
    return;
  }

  // Modo edição: imagem é opcional (mantém a atual se vazia)
  if (idEmEdicao && !arquivo) {
    const planta = plantas.find((p) => p.id === idEmEdicao);
    if (!planta) return;

    planta.nome = nome;
    planta.descricao = descricao;
    ordenarPlantas();
    salvarPlantas();
    limparFormulario();
    renderizarPlantas();
    return;
  }

  if (!validarArquivo(arquivo)) {
    return;
  }

  try {
    const imagemPadronizada = await padronizarImagem(arquivo);

    if (idEmEdicao) {
      const planta = plantas.find((p) => p.id === idEmEdicao);
      if (!planta) return;

      planta.nome = nome;
      planta.descricao = descricao;
      planta.imagem = imagemPadronizada;
    } else {
      plantas.push({
        id: gerarId(),
        nome,
        descricao,
        imagem: imagemPadronizada,
      });
    }

    ordenarPlantas();
    salvarPlantas();
    limparFormulario();
    renderizarPlantas();
  } catch (erro) {
    alert("Não foi possível processar a imagem. Tente outro arquivo.");
  }
}

function excluirPlanta(id) {
  const confirmar = confirm("Tem certeza que deseja excluir esta planta?");
  if (!confirmar) return;

  if (idEmEdicao === id) limparFormulario();

  plantas = plantas.filter((planta) => planta.id !== id);
  salvarPlantas();
  renderizarPlantas();
}

form.addEventListener("submit", adicionarPlanta);
botaoCancelar.addEventListener("click", limparFormulario);
ordenarPlantas();
renderizarPlantas();