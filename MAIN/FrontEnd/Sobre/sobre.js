// Função para verificar se o token está presente
function verificarToken() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert("Erro: Token não encontrado ou foi apagado. Você será redirecionado para a página de login.");
        redirecionarParaLogin();
        return;
    }

    try {
        // Decodifica o token para verificar validade básica
        const payload = JSON.parse(atob(token.split('.')[1]));
        const agora = Date.now() / 1000; // Tempo atual em segundos

        if (payload.exp && payload.exp < agora) {
            alert("Sua sessão expirou. Faça login novamente.");
            redirecionarParaLogin();
            return;
        }

        console.log("Token válido. Acesso permitido.");
    } catch (erro) {
        console.error("Erro ao verificar o token:", erro);
        alert("Erro no token. Você será redirecionado para a página de login.");
        redirecionarParaLogin();
    }
}

// Função para redirecionar para a página de login
function redirecionarParaLogin() {
    localStorage.removeItem('token'); // Remove qualquer resquício de token inválido
    window.location.href = '../Login/login.html'; // Redireciona para a página de login
}

// Executa a verificação do token ao carregar a página
verificarToken();
