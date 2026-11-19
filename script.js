
// ==========================================
// 1. CARDÁPIO
// ==========================================

const cardapio = [
    {
        id: "frango",
        nome: "Marmita de frango grelhado",
        preco: 20,
        descricao: "Arroz, feijão, frango grelhado e legumes.",
        palavras: ["marmita de frango grelhado", "frango grelhado", "marmita de frango", "frango"]
    },
    {
        id: "bife",
        nome: "Marmita de bife acebolado",
        preco: 23,
        descricao: "Arroz, feijão, bife acebolado e acompanhamentos.",
        palavras: ["marmita de bife acebolado", "bife acebolado", "marmita de bife", "bifes", "bife"]
    },
    {
        id: "carne",
        nome: "Marmita de carne moída",
        preco: 21,
        descricao: "Arroz, feijão e carne moída.",
        palavras: ["marmita de carne moida", "carne moida", "marmita de carne"]
    },
    {
        id: "linguica",
        nome: "Marmita de linguiça acebolada",
        preco: 20,
        descricao: "Arroz, feijão e linguiça acebolada.",
        palavras: ["marmita de linguica acebolada", "linguica acebolada", "marmita de linguica"]
    },
    {
        id: "vegetariana",
        nome: "Marmita vegetariana",
        preco: 19,
        descricao: "Arroz, feijão e legumes.",
        palavras: ["marmita vegetariana", "vegetariana"]
    },
    {
        id: "milanesa",
        nome: "Marmita de frango à milanesa",
        preco: 22,
        descricao: "Arroz, feijão e frango à milanesa.",
        palavras: ["marmita de frango a milanesa", "frango a milanesa"]
    },
    {
        id: "ovo",
        nome: "Ovo frito",
        preco: 3,
        descricao: "Ovo frito extra.",
        palavras: ["ovos fritos extras", "ovos fritos", "ovo frito", "ovos extras", "ovo extra", "ovos", "ovo"]
    },
    {
        id: "batata",
        nome: "Batata frita",
        preco: 5,
        descricao: "Porção de batata frita.",
        palavras: ["porcoes de batata frita", "porcao de batata frita", "batatas fritas", "batata frita", "porcao de batata", "batata extra", "batata"]
    },
    {
        id: "arroz",
        nome: "Porção extra de arroz",
        preco: 4,
        descricao: "Porção adicional de arroz.",
        palavras: ["porcao extra de arroz", "arroz extra"]
    },
    {
        id: "feijao",
        nome: "Porção extra de feijão",
        preco: 4,
        descricao: "Porção adicional de feijão.",
        palavras: ["porcao extra de feijao", "feijao extra"]
    }
];

// ==========================================
// 2. DADOS DO ATENDIMENTO
// ==========================================

let carrinho = {};
let historico = [];
let tipoEntrega = "entrega";
let ultimoProdutoId = null;
let enviando = false;
let intents = [];

const TAXA_ENTREGA = 5;

// ==========================================
// 3. CARREGAR INTENTS.JSON
// ==========================================

async function carregarIntents() {
    try {
        const resposta = await fetch("./intents.json");

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar intents.json");
        }

        const dados = await resposta.json();
        intents = dados.intents || [];

    } catch (erro) {
        console.error("Erro ao carregar intenções:", erro);
    }
}

// ==========================================
// 4. FUNÇÕES AUXILIARES
// ==========================================

function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[.,!?;:]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function formatarDinheiro(valor) {
    return Number(valor).toFixed(2).replace(".", ",");
}

function converterNumero(valor) {
    const numeros = {
        um: 1,
        uma: 1,
        dois: 2,
        duas: 2,
        tres: 3,
        quatro: 4,
        cinco: 5,
        seis: 6,
        sete: 7,
        oito: 8,
        nove: 9,
        dez: 10
    };

    return numeros[valor] || parseInt(valor, 10) || 1;
}

function adicionarMensagem(texto, tipo) {
    const chat = document.getElementById("chat");
    const mensagem = document.createElement("div");

    mensagem.className = "mensagem " + tipo;
    mensagem.textContent = texto;

    chat.appendChild(mensagem);
    chat.scrollTop = chat.scrollHeight;
}

// ==========================================
// 5. CONSULTAR INTENÇÕES
// ==========================================

function identificarIntencao(textoOriginal) {
    const texto = normalizar(textoOriginal);

    for (const intent of intents) {
        for (const pattern of intent.patterns) {
            if (texto === normalizar(pattern)) {
                return intent;
            }
        }
    }

    return null;
}

// ==========================================
// 6. CONSULTAS INFORMATIVAS
// ==========================================

function ehConsultaInformativa(texto) {
    const consultas = [
        /\b(o que vem|o que acompanha|que acompanha|quais ingredientes|ingredientes|composicao|acompanha)\b/,
        /\b(quanto custa|quanto e|qual o preco|qual preco|preco de|valor de)\b/,
        /\b(cardapio|quais sao as opcoes|quais produtos|opcoes disponiveis|o que voces vendem)\b/,
        /\b(tem|ha|existe)\b.*\b(vegetariana|frango|bife|carne moida|linguica|milanesa|batata frita|ovo frito)\b/,
        /\b(quero saber|gostaria de saber|pode me informar|me informe)\b/
    ];

    return consultas.some(regex => regex.test(texto));
}

function responderConsulta(textoOriginal) {
    const texto = normalizar(textoOriginal);

    if (/\b(cardapio|menu|opcoes disponiveis|quais produtos|o que voces vendem)\b/.test(texto)) {
        return "Nosso cardápio:\n\n" +
            cardapio.map(p => `${p.nome} - R$ ${formatarDinheiro(p.preco)}`).join("\n");
    }

    const produtoEncontrado = identificarProdutos(texto);

    if (produtoEncontrado.length > 0) {
        const produto = produtoEncontrado[0].produto;

        if (/\b(quanto custa|preco|valor|quanto e)\b/.test(texto)) {
            return `${produto.nome} custa R$ ${formatarDinheiro(produto.preco)} por unidade.`;
        }

        if (/\b(o que vem|acompanha|ingredientes|composicao)\b/.test(texto)) {
            return `${produto.nome}: ${produto.descricao}`;
        }

        return `${produto.nome} custa R$ ${formatarDinheiro(produto.preco)}. ${produto.descricao}`;
    }

    if (/\b(preco|quanto custa|valores)\b/.test(texto)) {
        return "Posso informar os preços! Pergunte pelo nome da marmita desejada ou peça nosso cardápio.";
    }

    return "Posso informar os preços, ingredientes e opções disponíveis. Qual produto você gostaria de conhecer?";
}

// ==========================================
// 7. IDENTIFICAR QUANTIDADES
// ==========================================

function obterQuantidade(texto, posicao) {
    const antes = texto.slice(Math.max(0, posicao - 45), posicao);

    const resultado = antes.match(
        /\b(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\s*(?:(?:marmitas?|porcoes?|extras?)\s*)?(?:de\s*)?$/
    );

    return resultado ? converterNumero(resultado[1]) : 1;
}

// ==========================================
// 8. IDENTIFICAR PRODUTOS
// ==========================================

function identificarProdutos(texto) {
    const candidatos = [];

    const tiposMarmita = {
        1: "frango",
        2: "bife",
        3: "carne",
        4: "linguica",
        5: "vegetariana",
        6: "milanesa"
    };

    const numeroTipo = texto.match(/\b(?:tipo|opcao|numero|n)\s*(\d+)\b/);

    if (numeroTipo && /\bmarmitas?\b/.test(texto)) {
        const produto = cardapio.find(p => p.id === tiposMarmita[numeroTipo[1]]);

        if (produto) {
            candidatos.push({
                produto,
                posicao: numeroTipo.index,
                tamanho: numeroTipo[0].length,
                quantidade: obterQuantidade(texto, numeroTipo.index)
            });
        }
    }

    for (const produto of cardapio) {
        for (const palavra of produto.palavras) {
            let inicio = 0;

            while (true) {
                const posicao = texto.indexOf(palavra, inicio);

                if (posicao === -1) break;

                const antes = texto[posicao - 1] || "";
                const depois = texto[posicao + palavra.length] || "";

                if (!/[a-z0-9]/.test(antes) && !/[a-z0-9]/.test(depois)) {
                    candidatos.push({
                        produto,
                        posicao,
                        tamanho: palavra.length,
                        quantidade: obterQuantidade(texto, posicao)
                    });
                }

                inicio = posicao + 1;
            }
        }
    }

    candidatos.sort((a, b) => b.tamanho - a.tamanho);

    const encontrados = [];

    for (const candidato of candidatos) {
        const sobrepoe = encontrados.some(item =>
            candidato.posicao < item.posicao + item.tamanho &&
            candidato.posicao + candidato.tamanho > item.posicao
        );

        const repetido = encontrados.some(
            item => item.produto.id === candidato.produto.id
        );

        if (!sobrepoe && !repetido) {
            encontrados.push(candidato);
        }
    }

    return encontrados.sort((a, b) => a.posicao - b.posicao);
}

// ==========================================
// 9. OPERAÇÃO NO CARRINHO
// ==========================================

function identificarOperacao(texto) {
    if (/\b(somente|apenas|so|exatamente|deixa so|fica so|ajusta para)\b/.test(texto)) {
        return "definir";
    }

    if (/\b(remover|remova|retirar|retire|tirar|tira|excluir|cancela|menos|nao quero mais|nao quero)\b/.test(texto)) {
        return "remover";
    }

    return "adicionar";
}

function alterarQuantidade(id, quantidade, operacao, produtoReferencia = null) {
    const produto = produtoReferencia || cardapio.find(p => p.id === id);

    if (!produto) return;

    if (!carrinho[id] && operacao === "remover") return;

    if (!carrinho[id]) {
        carrinho[id] = {
            produto,
            quantidade: 0,
            personalizacao: ""
        };
    }

    if (operacao === "definir") {
        carrinho[id].quantidade = quantidade;
    } else if (operacao === "remover") {
        carrinho[id].quantidade -= quantidade;
    } else {
        carrinho[id].quantidade += quantidade;
    }

    if (carrinho[id].quantidade <= 0) {
        delete carrinho[id];
    }
}

// ==========================================
// 10. PERSONALIZAÇÕES
// ==========================================

function identificarPersonalizacoes(textoOriginal) {
    const texto = normalizar(textoOriginal);
    const resultado = [];

    if (/\b(sem cebola|retirar cebola|tirar cebola|tira cebola|remover cebola)\b/.test(texto)) {
        resultado.push("Sem cebola");
    }

    if (/\b(sem alho|retirar alho|tirar alho|tira alho|remover alho)\b/.test(texto)) {
        resultado.push("Sem alho");
    }

    if (texto.includes("bem passado")) {
        resultado.push("Bem passada");
    } else if (texto.includes("mal passado")) {
        resultado.push("Malpassada");
    } else if (texto.includes("ao ponto")) {
        resultado.push("Ao ponto");
    }

    return resultado;
}

function aplicarPersonalizacao(id, personalizacoes) {
    if (!carrinho[id]) return;

    for (const personalizacao of personalizacoes) {
        const atual = carrinho[id].personalizacao || "";

        if (!atual.includes(personalizacao)) {
            carrinho[id].personalizacao = atual
                ? atual + ", " + personalizacao
                : personalizacao;
        }
    }
}

// ==========================================
// 11. ENTREGA E RETIRADA
// ==========================================

function atualizarFormaRecebimento(texto) {
    if (/\b(retirada|vou buscar|buscar no restaurante|retirar no restaurante)\b/.test(texto)) {
        tipoEntrega = "retirada";
    }

    if (/\b(com entrega|quero entrega|entrega em casa|receber em casa)\b/.test(texto)) {
        tipoEntrega = "entrega";
    }
}

// ==========================================
// 12. ATUALIZAR CARRINHO
// ==========================================

function atualizarCarrinho(textoOriginal) {
    const texto = normalizar(textoOriginal);

    if (ehConsultaInformativa(texto)) return false;

    atualizarFormaRecebimento(texto);

    const encontrados = identificarProdutos(texto);
    const personalizacoes = identificarPersonalizacoes(texto);
    const mencionaIngrediente = /\b(cebola|alho|sal|pimenta)\b/.test(texto);
    const operacao = identificarOperacao(texto);

    if (encontrados.length === 0 && personalizacoes.length > 0 && ultimoProdutoId) {
        aplicarPersonalizacao(ultimoProdutoId, personalizacoes);
        return true;
    }

    if (encontrados.length === 0 && mencionaIngrediente) return false;

    if (encontrados.length === 0 && ultimoProdutoId &&
        /\b(mais uma|mais um|mais duas|mais dois|outra|outro|so uma|so um|so duas|so dois|deixa so|fica so)\b/.test(texto)) {

        const match = texto.match(/\b(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\b/);
        const quantidade = match ? converterNumero(match[1]) : 1;

        alterarQuantidade(ultimoProdutoId, quantidade, operacao);
        return true;
    }

    for (const item of encontrados) {
        const id = item.produto.id;

        alterarQuantidade(id, item.quantidade, operacao, item.produto);

        if (carrinho[id]) {
            ultimoProdutoId = id;

            if (personalizacoes.length > 0) {
                aplicarPersonalizacao(id, personalizacoes);
            }
        } else if (ultimoProdutoId === id) {
            ultimoProdutoId = null;
        }
    }

    return encontrados.length > 0;
}

// ==========================================
// 13. CALCULAR TOTAL
// ==========================================

function calcularTotal() {
    let subtotal = 0;

    for (const item of Object.values(carrinho)) {
        subtotal += item.produto.preco * item.quantidade;
    }

    const entrega = tipoEntrega === "entrega" ? TAXA_ENTREGA : 0;

    return {
        subtotal,
        entrega,
        total: subtotal + entrega
    };
}

// ==========================================
// 14. EXIBIR NOTA DO PEDIDO
// ==========================================

function exibirCarrinho() {
    const nota = document.getElementById("notaFiscal");

    if (!nota) return;

    nota.innerHTML = "";

    const cabecalho = document.createElement("div");
    cabecalho.className = "nota-cabecalho";

    const titulo = document.createElement("h2");
    titulo.textContent = "🧾 Seu pedido";

    const nome = document.createElement("p");
    nome.textContent = "Marmita Caseira";

    cabecalho.append(titulo, nome);
    nota.appendChild(cabecalho);

    const itens = Object.values(carrinho);

    if (itens.length === 0) {
        const vazio = document.createElement("div");
        vazio.className = "nota-vazia";
        vazio.innerHTML = "<span>🛒</span><p>Seu pedido aparecerá aqui.</p><small>Escolha os itens pelo chat para começar.</small>";
        nota.appendChild(vazio);
        return;
    }

    for (const item of itens) {
        const id = item.produto.id;
        const linha = document.createElement("div");
        linha.className = "nota-item";

        const topo = document.createElement("div");
        topo.className = "nota-item-linha";

        const descricao = document.createElement("span");
        descricao.textContent = `${item.quantidade}x ${item.produto.nome}`;

        const preco = document.createElement("span");
        preco.textContent = `R$ ${formatarDinheiro(item.produto.preco * item.quantidade)}`;

        topo.append(descricao, preco);
        linha.appendChild(topo);

        if (item.personalizacao) {
            const detalhe = document.createElement("small");
            detalhe.textContent = "Personalização: " + item.personalizacao;
            linha.appendChild(detalhe);
        }

        const controles = document.createElement("div");
        controles.style.cssText = "display:flex;gap:8px;margin-top:10px;flex-wrap:wrap";

        const diminuir = document.createElement("button");
        diminuir.type = "button";
        diminuir.textContent = "− Diminuir 1";
        diminuir.addEventListener("click", () => {
            alterarQuantidade(id, 1, "remover");
            exibirCarrinho();
        });

        const remover = document.createElement("button");
        remover.type = "button";
        remover.textContent = "Remover produto";
        remover.addEventListener("click", () => {
            if (confirm(`Deseja remover ${item.produto.nome} completamente?`)) {
                delete carrinho[id];
                if (ultimoProdutoId === id) ultimoProdutoId = null;
                exibirCarrinho();
            }
        });

        controles.append(diminuir, remover);
        linha.appendChild(controles);
        nota.appendChild(linha);
    }

    const valores = calcularTotal();

    const valoresDiv = document.createElement("div");
    valoresDiv.className = "nota-valores";

    const subtotal = document.createElement("div");
    subtotal.className = "nota-valor-linha";
    subtotal.innerHTML = `<span>Subtotal</span><span>R$ ${formatarDinheiro(valores.subtotal)}</span>`;

    const entrega = document.createElement("div");
    entrega.className = "nota-valor-linha";
    entrega.innerHTML = `<span>${tipoEntrega === "entrega" ? "Entrega" : "Retirada"}</span><span>${tipoEntrega === "entrega" ? "R$ " + formatarDinheiro(valores.entrega) : "Grátis"}</span>`;

    valoresDiv.append(subtotal, entrega);
    nota.appendChild(valoresDiv);

    const total = document.createElement("div");
    total.className = "nota-total";
    total.innerHTML = `<span>TOTAL</span><span>R$ ${formatarDinheiro(valores.total)}</span>`;

    nota.appendChild(total);

    const rodape = document.createElement("div");
    rodape.className = "nota-rodape";
    rodape.textContent = "Obrigado pela preferência!";

    nota.appendChild(rodape);
}

// ==========================================
// 15. REINICIAR PEDIDO
// ==========================================

function limparPedido() {
    carrinho = {};
    historico = [];
    ultimoProdutoId = null;
    tipoEntrega = "entrega";

    const campo = document.getElementById("mensagem");
    if (campo) campo.value = "";

    const chat = document.getElementById("chat");
    chat.innerHTML = "";

    adicionarMensagem(
        "Olá! Seja bem-vindo novamente à Marmita Caseira! Seu pedido anterior foi apagado. Como posso ajudar?",
        "bot"
    );

    exibirCarrinho();

    if (campo) campo.focus();
}

function novoPedido() {
    if (enviando) {
        alert("Aguarde o atendimento atual terminar.");
        return;
    }

    if (confirm("Deseja realmente começar um novo pedido? A conversa e o carrinho serão apagados.")) {
        limparPedido();
    }
}

// ==========================================
// 16. DETECTAR PEDIDO NOVO
// ==========================================

function solicitouNovoPedido(texto) {
    const frases = [
        "novo pedido",
        "comecar outro pedido",
        "fazer outro pedido",
        "comecar de novo",
        "quero recomecar",
        "cancelar tudo",
        "cancela tudo",
        "zerar o pedido",
        "comecar do zero"
    ];

    return frases.some(frase => texto.includes(frase));
}

// ==========================================
// 17. RESPOSTA DO CHATBOT
// ==========================================

function gerarResposta(textoOriginal) {
    const texto = normalizar(textoOriginal);

    // Primeiro verifica os guardrails e regras locais.
    const respostaRegra = verificarRegra(textoOriginal);

    if (respostaRegra) return respostaRegra;

    // Consulta as intenções cadastradas.
    const intencao = identificarIntencao(textoOriginal);

    if (intencao && intencao.responses.length > 0) {
        return intencao.responses[0];
    }

    // Perguntas informativas não alteram o carrinho.
    if (ehConsultaInformativa(texto)) {
        return responderConsulta(textoOriginal);
    }

    // Atualiza o carrinho.
    const alterou = atualizarCarrinho(textoOriginal);

    if (alterou) {
        const itens = Object.values(carrinho);

        if (itens.length === 0) {
            return "O produto foi removido do seu pedido. Gostaria de adicionar mais alguma coisa?";
        }

        return "Certo! Atualizei seu pedido. Confira os itens e o valor total na nota ao lado. Deseja adicionar mais alguma coisa?";
    }

    if (/\b(total|valor da compra|quanto ficou|quanto deu)\b/.test(texto)) {
        const valores = calcularTotal();

        return `O subtotal é R$ ${formatarDinheiro(valores.subtotal)}, a entrega é R$ ${formatarDinheiro(valores.entrega)} e o total é R$ ${formatarDinheiro(valores.total)}.`;
    }

    if (/\b(entrega|retirada)\b/.test(texto)) {
        return `Sua forma de recebimento está configurada como ${tipoEntrega}. A taxa de entrega é R$ 5,00.`;
    }

    return "Desculpe, não entendi. Você pode perguntar sobre nosso cardápio, preços ou informar os produtos e quantidades que deseja pedir. Digite ajuda para conhecer as opções de atendimento.";
}

// ==========================================
// 18. ENVIAR MENSAGEM
// ==========================================

async function enviarMensagem() {
    if (enviando) return;

    const campo = document.getElementById("mensagem");

    if (!campo) return;

    const texto = campo.value.trim();

    if (!texto) return;

    if (solicitouNovoPedido(normalizar(texto))) {
        campo.value = "";

        if (confirm("Deseja apagar a conversa e começar um novo pedido?")) {
            limparPedido();
        }

        return;
    }

    enviando = true;
    campo.value = "";

    adicionarMensagem(texto, "usuario");

    const respostaBot = document.createElement("div");
    respostaBot.className = "mensagem bot";
    respostaBot.textContent = "Analisando sua mensagem...";
    document.getElementById("chat").appendChild(respostaBot);

    try {
        const resposta = gerarResposta(texto);

        exibirCarrinho();

        respostaBot.textContent = resposta;

        historico.push({
            role: "user",
            content: texto
        });

        historico.push({
            role: "assistant",
            content: resposta
        });

    } catch (erro) {
        console.error("Erro no chatbot:", erro);
        respostaBot.textContent = "Desculpe, ocorreu um problema no atendimento.";
    }

    const chat = document.getElementById("chat");
    chat.scrollTop = chat.scrollHeight;

    enviando = false;
    campo.focus();
}

// ==========================================
// 19. INICIALIZAÇÃO
// ==========================================

document.addEventListener("DOMContentLoaded", async function () {
    const campo = document.getElementById("mensagem");

    if (campo) {
        campo.addEventListener("keydown", function (evento) {
            if (evento.key === "Enter" && !evento.shiftKey) {
                evento.preventDefault();
                enviarMensagem();
            }
        });
    }

    await carregarIntents();
    exibirCarrinho();
});
