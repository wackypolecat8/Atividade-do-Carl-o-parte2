
function verificarRegra(mensagem) {

    const texto = mensagem.toLowerCase().trim();

    // REGRA 1: Saudações
    const saudacoes = [
        "oi",
        "olá",
        "ola",
        "bom dia",
        "boa tarde",
        "boa noite"
    ];

    if (saudacoes.includes(texto)) {
        return "Olá! Seja bem-vindo à Marmita Caseira! Como posso ajudar?";
    }

    // REGRA 2: Ajuda
    if (texto === "ajuda" || texto === "help") {
        return "Posso ajudar com preços, cardápio, acompanhamentos e pedidos!";
    }

    // REGRA 3: Encerrar conversa
    if (texto === "sair") {
        return "Obrigado por conversar conosco! Até a próxima!";
    }

    // REGRA 4: Reiniciar
    if (texto === "reiniciar") {
        return "Conversa reiniciada! Como posso ajudar?";
    }

    // Nenhuma regra encontrada
    return null;
}
