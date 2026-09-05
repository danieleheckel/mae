const STORAGE_KEY = "plantas";

const form = document.getElementById("form-planta");
const nomeInput = document.getElementById("nome");
const descricaoInput = document.getElementById("descricao");
const imagemInput = document.getElementById("imagem");
const catalogo = document.getElementById("catalogo");
const mensagemVazia = document.getElementById("mensagem-vazia");

let plantas = carregarPlantas();

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

function limparFormulario() {
  form.reset();
  nomeInput.focus();
}

function criarElemento(tag, texto = "") {
  const elemento = document.createElement(tag);
  if (texto) elemento.textContent = texto;
  return elemento;
}

function renderizarPlantas() {
  catalogo.innerHTML = "";

  mensagemVazia.style.display = plantas.length === 0 ? "block" : "none";

  plantas.forEach((planta) => {
    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
    img.src = planta.imagem;
    img.alt = `Imagem da planta ${planta.nome}`;

    const conteudo = document.createElement("div");
    conteudo.className = "card-conteudo";

    const titulo = criarElemento("h3", planta.nome);
    const descricao = criarElemento(
      "p",
      planta.descricao || "Sem descrição informada."
    );

    const botaoExcluir = criarElemento("button", "Excluir");
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", () => excluirPlanta(planta.id));

    conteudo.append(titulo, descricao, botaoExcluir);
    card.append(img, conteudo);
    catalogo.appendChild(card);
  });
}

function adicionarPlanta(event) {
  event.preventDefault();

  const nome = nomeInput.value.trim();
  const descricao = descricaoInput.value.trim();
  const arquivo = imagemInput.files[0];

  if (!nome) {
    alert("Preencha o nome da planta.");
    nomeInput.focus();
    return;
  }

  if (!validarArquivo(arquivo)) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    const novaPlanta = {
      id: gerarId(),
      nome,
      descricao,
      imagem: reader.result,
    };

    plantas.push(novaPlanta);
    ordenarPlantas();
    salvarPlantas();
    renderizarPlantas();
    limparFormulario();
  };

  reader.readAsDataURL(arquivo);
}

function excluirPlanta(id) {
  const confirmar = confirm("Tem certeza que deseja excluir esta planta?");
  if (!confirmar) return;

  plantas = plantas.filter((planta) => planta.id !== id);
  salvarPlantas();
  renderizarPlantas();
}

form.addEventListener("submit", adicionarPlanta);
ordenarPlantas();
renderizarPlantas();