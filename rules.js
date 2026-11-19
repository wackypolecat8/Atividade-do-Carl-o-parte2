
function verificarRegra(mensagem) {

    const texto = mensagem
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    // Saudacoes
    const saudacoes = [
        "oi",
        "ola",
        "bom dia",
        "boa tarde",
        "boa noite"
    ];

    if (saudacoes.includes(texto)) {
        return "Olá! Seja bem-vindo à Marmita Caseira! Como posso ajudar?";
    }

    // Ajuda
    if (texto === "ajuda" || texto === "help") {
        return "Posso ajudar com preços, cardápio, acompanhamentos e pedidos!";
    }

    // Encerrar
    if (texto === "sair") {
        return "Obrigado por conversar conosco! Até a próxima!";
    }

    // Reiniciar
    if (texto === "reiniciar") {
        return "Conversa reiniciada! Como posso ajudar?";
    }

    return null;
}
