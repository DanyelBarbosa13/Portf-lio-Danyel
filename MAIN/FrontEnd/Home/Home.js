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

// Função para atualizar a área do usuário
function atualizarAreaUsuario() {
    const nome = localStorage.getItem('nome'); // Obtém o nome do usuário do localStorage
    const userNameSpan = document.getElementById('user-name');
    const userIcon = document.getElementById('user-icon');

    if (nome) {
        userNameSpan.textContent = nome; // Atualiza o nome na interface
        userIcon.style.display = 'inline'; // Exibe o ícone do usuário
    } else {
        userNameSpan.textContent = 'Usuário não logado';
        userIcon.style.display = 'none'; // Esconde o ícone se não há usuário
    }
}

// Função para realizar o logout
document.getElementById('logout-btn').addEventListener('click', (event) => {
    event.preventDefault();
    localStorage.clear(); // Limpa os dados do localStorage
    showSuccessNotification('Logout realizado com sucesso!');
    window.location.href = '../Login/Login.html'; // Redireciona para a página de login
});

// Atualiza a área do usuário ao carregar a página
document.addEventListener('DOMContentLoaded', atualizarAreaUsuario);

document.getElementById('user-icon').addEventListener('click', () => {
    const userArea = document.querySelector('.user-area');
    userArea.classList.toggle('active'); // Alterna entre exibir/ocultar o menu
});


