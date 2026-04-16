async function salvarCadastro() {
    const tipoServico = document.getElementById('tipo-servico').value;
    const urgencia = document.getElementById('urgencia-servico').value;
    const responsavel = document.getElementById('responsavel-servico').value;
    const dataConclusao = document.getElementById('data-servico').value;
    const maquina = document.getElementById('maquina-servico').value;
    const local = document.getElementById('local-servico').value;
    const descricao = document.getElementById('descricao').value.trim(); // Validação extra de espaços em branco

    let valid = true;

    // Validar Tipo de Serviço
    if (!tipoServico) {
        document.getElementById('error-tipo-servico').style.display = 'block';
        valid = false;
    } else {
        document.getElementById('error-tipo-servico').style.display = 'none';
    }

    // Validar Urgência
    if (!urgencia) {
        document.getElementById('error-urgencia-servico').style.display = 'block';
        valid = false;
    } else {
        document.getElementById('error-urgencia-servico').style.display = 'none';
    }

    // Validar Responsável
    if (!responsavel) {
        document.getElementById('error-responsavel-servico').style.display = 'block';
        valid = false;
    } else {
        document.getElementById('error-responsavel-servico').style.display = 'none';
    }

    // Validar Data
    if (!dataConclusao) {
        document.getElementById('error-data-servico').style.display = 'block';
        valid = false;
    } else {
        document.getElementById('error-data-servico').style.display = 'none';
    }

    // Validar Máquina
    if (!maquina) {
        document.getElementById('error-maquina-servico').style.display = 'block';
        valid = false;
    } else {
        document.getElementById('error-maquina-servico').style.display = 'none';
    }

    // Validar Local
    if (!local) {
        document.getElementById('error-local-servico').style.display = 'block';
        valid = false;
    } else {
        document.getElementById('error-local-servico').style.display = 'none';
    }

    // Validar Descrição
    if (!descricao) {
        document.getElementById('error-descricao').style.display = 'block';
        valid = false;
    } else {
        document.getElementById('error-descricao').style.display = 'none';
    }

    if (!valid) {
        showErrorNotification("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    try {
        // Buscar ID da máquina
        const maquinaResponse = await fetch(`http://localhost:3000/maquina/${maquina}`);
        if (!maquinaResponse.ok) {
            throw new Error(`Máquina não encontrada: ${maquina}`);
        }
        const maquinaData = await maquinaResponse.json();
        const fk_maquina_id = maquinaData.id;

        // Buscar ID do local
        const localResponse = await fetch(`http://localhost:3000/local/${local}`);
        if (!localResponse.ok) {
            throw new Error(`Local não encontrado: ${local}`);
        }
        const localData = await localResponse.json();
        const fk_locall_id = localData.id;

        const novoServico = {
            tipo_servico: tipoServico,
            urgencia: urgencia,
            responsavel: responsavel,
            data_servico: dataConclusao,
            concluido: false, // Valor padrão
            fk_maquina_id: fk_maquina_id,
            fk_locall_id: fk_locall_id,
            descricao: descricao,
        };

        console.log("Dados enviados ao backend:", JSON.stringify(novoServico, null, 2));

        const response = await fetch('http://localhost:3000/servicos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(novoServico),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na API: ${errorText}`);
        }

        showSuccessNotification("Cadastro realizado com sucesso!");
        document.querySelector('.form-servico').reset();
        window.location.href = '../Listagem/Listagem.html';
    } catch (error) {
        console.error("Erro na requisição:", error);
        showErrorNotification(`Erro ao realizar o cadastro: ${error.message}`);
    }
}


function voltar() {
    window.history.back();
}

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
    };
};

// Função para exibir notificação de sucesso
function showSuccessNotification(message) {
    // Salva a mensagem no localStorage para persistir após redirecionamento
    localStorage.setItem('successMessage', message);

    const successNotification = document.getElementById('success-notification');
    const successMessageElement = document.getElementById('success-message');

    // Define a mensagem da notificação
    successMessageElement.textContent = message;

    // Exibe a notificação de sucesso
    successNotification.classList.add('visible');

    setTimeout(() => {
        hideSuccessNotification();
    }, 10000);
}

// Função para ocultar notificação de sucesso
function hideSuccessNotification() {
    const successNotification = document.getElementById('success-notification');
    successNotification.classList.remove('visible');

    // Remove a mensagem salva no localStorage
    localStorage.removeItem('successMessage');
}

// Função para exibir notificação de erro
function showErrorNotification(message) {
    // Salva a mensagem no localStorage para persistir após redirecionamento
    localStorage.setItem('errorMessage', message);

    const errorNotification = document.getElementById('error-notification');
    const errorMessageElement = document.getElementById('error-message');

    // Define a mensagem da notificação
    errorMessageElement.textContent = message;

    // Exibe a notificação de erro
    errorNotification.classList.add('visible');

    setTimeout(() => {
        hideErrorNotification();
    }, 5000);
}

// Função para ocultar notificação de erro
function hideErrorNotification() {
    const errorNotification = document.getElementById('error-notification');
    errorNotification.classList.remove('visible');

    // Remove a mensagem salva no localStorage
    localStorage.removeItem('errorMessage');
}

// Função para exibir notificações salvas no localStorage (após redirecionamento)
function displayStoredNotifications() {
    // Verifica se há mensagens de sucesso ou erro salvas
    const successMessage = localStorage.getItem('successMessage');
    const errorMessage = localStorage.getItem('errorMessage');

    if (successMessage) {
        showSuccessNotification(successMessage);
    }

    if (errorMessage) {
        showErrorNotification(errorMessage);
    }
}

// Chama a função para exibir notificações salvas ao carregar a página
document.addEventListener('DOMContentLoaded', displayStoredNotifications);

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










