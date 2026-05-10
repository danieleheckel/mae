let plantas = JSON.parse(localStorage.getItem("plantas")) || [];

function salvar() {
    localStorage.setItem("plantas", JSON.stringify(plantas));
}

function adicionarPlanta() {
    let nome = document.getElementById("nome").value;
    let descricao = document.getElementById("descricao").value;
    let imagemInput = document.getElementById("imagem");

    if (!nome || !imagemInput.files[0]) {
        alert("Preencha o nome e a imagem!");
        return;
    }

    let reader = new FileReader();
    reader.onload = function () {
        let novaPlanta = {
            nome: nome,
            descricao: descricao,
            imagem: reader.result
        };

        plantas.push(novaPlanta);

        // Ordenar alfabeticamente
        plantas.sort((a, b) => a.nome.localeCompare(b.nome));

        salvar();
        mostrarPlantas();
    };

    reader.readAsDataURL(imagemInput.files[0]);
}

function mostrarPlantas() {
    let catalogo = document.getElementById("catalogo");
    catalogo.innerHTML = "";

   plantas.forEach((planta, index) => {
        let card = document.createElement("div");
        card.classList.add("card");

        card.innerHTML = `
    <img src="${planta.imagem}">
    <h3>${planta.nome}</h3>
    <p>${planta.descricao}</p>
    <button onclick="excluirPlanta(${index})">Excluir</button>
`;

        catalogo.appendChild(card);
    });
}

function excluirPlanta(index) {
    if (confirm("Tem certeza que deseja excluir esta planta?")) {
        plantas.splice(index, 1);
        salvar();
        mostrarPlantas();
    }
}

// Carregar ao abrir
mostrarPlantas();