let abortControllerFiltragem = null;

async function listarCadastro() {
    try {
        const response = await fetch('http://localhost:3000/servicos');
        if (!response.ok) {
            throw new Error('Erro ao buscar serviços!');
        }
        const servicos = await response.json();
        atualizarTabela(servicos);
    } catch (error) {
        console.error('Houve um problema com a operação de fetch:', error);
    }
}

// Chama a função ao carregar a página
document.addEventListener('DOMContentLoaded', listarCadastro);

// Atualiza a tabela com os serviços
function atualizarTabela(servicos) {
    const tabelaServicos = document.getElementById('tabela-servicos');
    tabelaServicos.innerHTML = '';

    servicos.forEach((servico, index) => {
        const maquina = servico.maquina || 'LABEFF-01'; // Define um valor padrão se 'maquina' estiver indefinido
        const novaLinha = document.createElement('tr');
        novaLinha.innerHTML = `
            <td>${index + 1}</td>
            <td>${maquina}</td>
            <td>${servico.tipo_servico}</td>
            <td>${servico.urgencia}</td>
            <td>${servico.responsavel}</td>
            <td>${new Date(servico.data_servico).toLocaleDateString()}</td>
            <td>
                <input type="checkbox" id="checkbox-${servico.id_servico}" ${servico.concluido ? 'checked' : ''} 
       onclick="atualizarConclusao(${servico.id_servico}, this.checked)">

            </td>
            <td>
            <!-- Ícone de edição -->
            <img src="../Assets/lapis.png" alt="editar" style="width: 24px; cursor: pointer;" 
                onclick="abrirModalEditar({
                    id_servico: ${servico.id_servico},
                    tipo_servico: '${servico.tipo_servico}',
                    urgencia: '${servico.urgencia}',
                    responsavel: '${servico.responsavel}',
                    data_servico: '${servico.data_servico}',
                    local: '${servico.locall}',
                    maquina: '${servico.maquina}',
                    descricao: '${servico.descricao || ''}'
                })">
                <!-- Ícone de feedback -->
                <img src="../Assets/Lupalistagem.png" alt="lupa" style="width: 24px; cursor: pointer;" 
                    onclick="abrirFeedbackModal(${servico.id_servico})">
                <!-- Ícone de exclusão -->
                <img src="../Assets/lixeira.png" alt="lixeira" style="width: 24px; cursor: pointer;" 
                    onclick="deletarServico(${servico.id_servico})">
            </td>
        `;
        tabelaServicos.appendChild(novaLinha);
    });
}
async function atualizarConclusao(id_servico, concluido) {
    try {
        // Atualiza o status no backend (se necessário)
        const response = await fetch(`http://localhost:3000/servicos/${id_servico}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ concluido })
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar o status de conclusão');
        }

        console.log(`Serviço ${id_servico} atualizado para: ${concluido ? 'Concluído' : 'Não concluído'}`);
    } catch (error) {
        console.error('Erro ao atualizar o status:', error);
    }
}


// Função para abrir o modal ao clicar na checkbox
function abrirSubpagina() {
    const modal = document.getElementById('resolucaoModal');
    modal.style.display = 'block';
}

// Função para fechar o modal
function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

// Função para salvar a resolução
function salvarResolucao() {
    const descricao = document.getElementById('descricaoProblema').value;

    if (descricao.trim() === "") {
        showErrorNotification("Erro: Descrição da resolução não pode ser vazia!");
    } else {
        showSuccessNotification("Resolução salva com sucesso!");
        fecharModal('resolucaoModal');
    }
}

// Função para deletar o serviço ao clicar na lixeira
function deletarServico(idServico) {
    confirmarExclusao(idServico);
}

// Variável global para armazenar o ID do serviço a ser excluído
let elementoParaExcluir = null;

// Função para abrir o modal de confirmação de exclusão
function confirmarExclusao(idServico) {
    elementoParaExcluir = idServico;
    const modal = document.getElementById('modal-confirmacao');
    modal.style.display = 'block';
}

// Função para excluir o serviço após a confirmação no modal
document.getElementById('botao-sim').addEventListener('click', async function() {
    if (elementoParaExcluir !== null) {
        try {
            const response = await fetch(`http://localhost:3000/servicos/${elementoParaExcluir}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showSuccessNotification("Registro excluído com sucesso!");
                listarCadastro(); // Atualiza a tabela após a exclusão
            } else {
                showErrorNotification("Erro ao tentar excluir o registro");
            }
        } catch (error) {
            console.error("Erro:", error);
            showErrorNotification("Ocorreu um erro ao tentar excluir o registro");
        }
        fecharModal('modal-confirmacao');
    }
});

// Função para cancelar a exclusão
document.getElementById('botao-nao').addEventListener('click', function() {
    fecharModal('modal-confirmacao'); // Fecha o modal sem excluir
});

// Filtragem
document.getElementById('filtrar').addEventListener('change', function() {
    const tipoServico = document.getElementById('tipo-servico');
    const urgencia = document.getElementById('urgencia');
    const periodo = document.getElementById('periodo');
    const responsavel = document.getElementById('responsavel');
    const concluido = document.getElementById('concluido');

    // Ocultar todos os filtros inicialmente
    [tipoServico, urgencia, periodo, responsavel, concluido].forEach(filtro => {
        filtro.style.display = 'none';
    });

    // Mostrar apenas o filtro selecionado
    switch (this.value) {
        case 'mostrarTipoServico':
            tipoServico.style.display = 'inline';
            break;
        case 'mostrarUrgencia':
            urgencia.style.display = 'inline';
            break;
        case 'mostrarPeriodo':
            periodo.style.display = 'inline';
            break;
        case 'mostrarResponsavel':
            responsavel.style.display = 'inline';
            break;
        case 'mostrarConcluido':
            concluido.style.display = 'inline';
            break;
    }
    // Resetar para a listagem original
    atualizarTabela(servicosOriginais);
    
});

// Função para aplicar filtros
document.getElementById('filtrar-btn').addEventListener('click', async function () {
    const filtroSelecionado = document.getElementById('filtrar').value;
    let tipoServico = '';
    let urgencia = '';
    let responsavel = '';
    let periodo = '';
    let concluido = '';

    // Determina qual filtro aplicar e reseta os outros
    switch (filtroSelecionado) {
        case 'mostrarTipoServico':
            tipoServico = document.getElementById('tipo-servico').value;
            break;
        case 'mostrarUrgencia':
            urgencia = document.getElementById('urgencia').value;
            break;
        case 'mostrarResponsavel':
            responsavel = document.getElementById('responsavel').value;
            break;
        case 'mostrarPeriodo':
            periodo = document.getElementById('periodo').value;
            break;
        case 'mostrarConcluido':
            concluido = document.getElementById('concluido').checked;
            break;
        default:
            // Caso nenhum filtro seja selecionado, retorna a listagem original
            atualizarTabela(servicosOriginais);
            return;
    }

    try {
        // Limpa a tabela antes de realizar a nova requisição
        const tabelaServicos = document.getElementById('tabela-servicos');
        tabelaServicos.innerHTML = ''; // Limpa a tabela completamente

        // Realiza a filtragem com o filtro selecionado
        const servicosFiltrados = await filtrarServicos(tipoServico, urgencia, responsavel, periodo, concluido);

        // Atualiza a tabela com os resultados filtrados
        if (servicosFiltrados.length > 0) {
            atualizarTabela(servicosFiltrados);
        } else {
            tabelaServicos.innerHTML = '<tr><td colspan="9">Nenhum serviço encontrado com o filtro aplicado.</td></tr>';
        }

    } catch (error) {
        console.error("Erro ao aplicar filtros:", error);
        if (error.name !== 'AbortError') {
            showErrorNotification("Erro ao aplicar filtros!");
        }
    }
});


// Função para filtrar serviços no backend via POST
async function filtrarServicos(tipoServico, urgencia, responsavel, periodo, concluido) {
    // Criação de um objeto com apenas o filtro preenchido
    const filtros = {};

    if (tipoServico) filtros.tipo = tipoServico;
    if (urgencia) filtros.urgencia = urgencia;
    if (responsavel) filtros.responsavel = responsavel;
    if (periodo) filtros.periodo = periodo;
    if (concluido !== '') filtros.concluido = concluido;

    try {
        const response = await fetch('http://localhost:3000/filtraServicos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filtros)
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar serviços filtrados!');
        }

        const servicosFiltrados = await response.json();
        return servicosFiltrados; // Retorna os resultados filtrados
    } catch (error) {
        console.error('Erro na requisição de filtragem:', error);
        throw error; // Propaga o erro para ser tratado onde a função é chamada
    }
}



// Limpar Filtros
document.getElementById('limpar-filtros-btn').addEventListener('click', function() {
    // Reseta todos os campos de filtro
    document.getElementById('filtrar').value = ''; // Reseta a opção de filtro
    document.getElementById('tipo-servico').value = ''; // Limpa o campo de tipo de serviço
    document.getElementById('urgencia').value = ''; // Limpa o campo de urgência
    document.getElementById('responsavel').value = ''; // Limpa o campo de responsável
    document.getElementById('periodo').value = ''; // Limpa o campo de data
    // Limpa todos os campos de filtros visíveis
    [document.getElementById('tipo-servico'), document.getElementById('urgencia'), document.getElementById('responsavel'), document.getElementById('periodo')].forEach(filtro => {
        filtro.style.display = 'none';
    });
    // Recarrega a tabela com a lista original (certifique-se que a lista de serviços original está armazenada)
    listarCadastro(); 
});

// Função para salvar a resolução e atualizar "Informações do Serviço"
function salvarResolucao() {
    const descricao = document.getElementById('descricaoProblema').value;

    if (descricao.trim() === "") {
        showErrorNotification("Erro: Descrição da resolução não pode ser vazia!");
    } else {
        showSuccessNotification("Resolução salva com sucesso!");
        
        // Aqui você pode enviar a descrição para o backend associada ao serviço
        const servicoID = elementoParaExcluir; // ou outro ID que representa o serviço atual
        salvarDescricaoServico(servicoID, descricao);
        
        fecharModal('resolucaoModal');
    }
}

// Função para salvar a descrição da resolução no backend
async function salvarDescricaoServico(servicoID, descricao) {
    try {
        const response = await fetch(`http://localhost:3000/servicos/${servicoID}/descricao`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ descricao })
        });

        if (response.ok) {
            listarCadastro(); // Atualiza a tabela após salvar a descrição
        } else {
            console.error("Erro ao salvar descrição:", response.statusText);
            alert("Erro ao tentar salvar a descrição.");
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Ocorreu um erro ao tentar salvar a descrição.");
    }
}

// Função para abrir o modal de feedback e exibir a descrição
let descricaoResolucao = ""; // Variável global para armazenar a descrição da resolução

// Função para salvar a resolução
function salvarResolucao() {
    const descricao = document.getElementById('descricaoProblema').value;

    if (descricao.trim() === "") {
        alert("Erro: Descrição da resolução não pode ser vazia!");
    } else {
        descricaoResolucao = descricao; // Armazena a descrição
        alert("Resolução salva com sucesso!");
        fecharModal('resolucaoModal');
    }
}

// Variável para armazenar o estado original da checkbox
let estadoOriginalCheckbox = null;

// Função chamada ao clicar na checkbox
function marcarCheckbox(id_servico, isChecked) {
    estadoOriginalCheckbox = isChecked; // Salva o estado original da checkbox
}

// Função para abrir o modal de feedback
async function abrirFeedbackModal(id_servico) {
    try {
        const response = await fetch(`http://localhost:3000/servicos/${id_servico}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar detalhes do serviço');
        }

        const servico = await response.json();
        const checkbox = document.getElementById(`checkbox-${id_servico}`);
        const concluido = checkbox.checked ? 'Sim' : 'Não';

        const detalhesServicoContainer = document.querySelector(".detalhes-servico");
        detalhesServicoContainer.innerHTML = `
            <p><strong>Tipo de Serviço:</strong> ${servico.tipo_servico || 'Não especificado'}</p>
            <p><strong>Urgência:</strong> ${servico.urgencia || 'Não especificada'}</p>
            <p><strong>Responsável:</strong> ${servico.responsavel || 'Não especificado'}</p>
            <p><strong>Máquina:</strong> ${servico.maquina || 'Não especificada'}</p>
            <p><strong>Data de Conclusão:</strong> ${new Date(servico.data_servico).toLocaleDateString() || 'Não concluído'}</p>
            <p><strong>Local:</strong> ${servico.locall || 'Não especificado'}</p>
            <p><strong>Descrição:</strong> ${servico.descricao || 'Nenhuma descrição disponível.'}</p>
            <p><strong>Concluído:</strong> ${concluido}</p>
        `;

        const modal = document.getElementById("feedbackModal");
        modal.style.display = 'block';
    } catch (error) {
        console.error('Erro ao abrir o modal de feedback:', error);
        showErrorNotification('Erro ao buscar os detalhes do serviço. Tente novamente.');
    }
}

// Função para fechar o modal
function fecharFeedback(event) {
    event.preventDefault();  // Previne a recarga da página

    const modal = document.getElementById('feedbackModal');
    modal.style.display = 'none';

    // Garantir que a checkbox não seja desmarcada automaticamente
    const checkbox = document.getElementById(`checkbox-${id_servico}`);
    checkbox.checked = estadoOriginalCheckbox;  // Restaura o estado original da checkbox
}

// Adicionar um event listener diretamente para garantir que o evento seja prevenido corretamente
const cancelarButton = document.getElementById('cancelarButton'); // O ID do botão cancelar
if (cancelarButton) {
    cancelarButton.addEventListener('click', function(event) {
        event.preventDefault();  // Previne o comportamento padrão
        fecharFeedback(event);  // Chama a função de fechar o modal
    });
} 


// Função para verificar se o token está presente
function verificarToken() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        showErrorNotification("Erro: Token não encontrado ou foi apagado. Você será redirecionado para a página de login.");
        redirecionarParaLogin();
        return;
    }

    try {
        // Decodifica o token para verificar validade básica
        const payload = JSON.parse(atob(token.split('.')[1]));
        const agora = Date.now() / 1000; // Tempo atual em segundos

        if (payload.exp && payload.exp < agora) {
            showErrorNotification("Sua sessão expirou. Faça login novamente.");
            redirecionarParaLogin();
            return;
        }

        console.log("Token válido. Acesso permitido.");
    } catch (erro) {
        console.error("Erro ao verificar o token:", erro);
        showErrorNotification("Erro no token. Você será redirecionado para a página de login.");
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

// Função para exibir notificação de sucesso
function showSuccessNotification(message) {
    const successNotification = document.getElementById('success-notification');
    const successMessageElement = document.getElementById('success-message');

    // Define a mensagem da notificação
    successMessageElement.textContent = message;

    // Exibe a notificação de sucesso
    successNotification.classList.add('visible');

    // Oculta após 5 segundos
    setTimeout(() => {
        hideSuccessNotification();
    }, 5000);
}

// Função para ocultar notificação de sucesso
function hideSuccessNotification() {
    const successNotification = document.getElementById('success-notification');
    successNotification.classList.remove('visible');
}

// Função para exibir notificação de erro
function showErrorNotification(message) {
    const errorNotification = document.getElementById('error-notification');
    const errorMessageElement = document.getElementById('error-message');

    // Define a mensagem da notificação
    errorMessageElement.textContent = message;

    // Exibe a notificação de erro
    errorNotification.classList.add('visible');

    // Oculta após 5 segundos
    setTimeout(() => {
        hideErrorNotification();
    }, 5000);
}

// Função para ocultar notificação de erro
function hideErrorNotification() {
    const errorNotification = document.getElementById('error-notification');
    errorNotification.classList.remove('visible');
}

function abrirModalEditar(servico) {
    const overlay = document.getElementById('overlay-editar');

    // Buscar e preencher opções de locais
    fetch('http://localhost:3000/locais')
        .then((response) => response.json())
        .then((locais) => {
            const selectLocal = document.getElementById('fk-locall-id');
            selectLocal.innerHTML = ''; // Limpa opções
            locais.forEach((local) => {
                const option = document.createElement('option');
                option.value = local.id;
                option.textContent = local.descricao;
                if (local.id === servico.locall) option.selected = true; // Selecionar local
                selectLocal.appendChild(option);
            });
        });

    // Buscar e preencher opções de máquinas
    fetch('http://localhost:3000/maquinas')
        .then((response) => response.json())
        .then((maquinas) => {
            const selectMaquina = document.getElementById('maquina-servico');
            selectMaquina.innerHTML = ''; // Limpa opções
            maquinas.forEach((maquina) => {
                const option = document.createElement('option');
                option.value = maquina.id;
                option.textContent = maquina.descricao;
                if (maquina.id === servico.maquina) option.selected = true; // Selecionar máquina
                selectMaquina.appendChild(option);
            });
        });

    // Preenchendo outros campos com os valores do serviço
    document.getElementById('tipo-servico1').value = servico.tipo_servico || '';
    document.getElementById('urgencia-servico').value = servico.urgencia || '';
    document.getElementById('responsavel-servico').value = servico.responsavel || '';
    document.getElementById('data_servico').value = servico.data_servico
        ? new Date(servico.data_servico).toISOString().split('T')[0]
        : '';
    document.getElementById('descricao').value = servico.descricao || '';

    // Armazenar o ID do serviço no modal
    overlay.setAttribute('data-servico-id', servico.id_servico);

    overlay.style.display = 'block';
}

function fecharModalEditar() {
    const overlay = document.getElementById('overlay-editar');
    overlay.style.display = 'none';
}

function atualizarServico() {
    const overlay = document.getElementById('overlay-editar');
    const id_servico = overlay.getAttribute('data-servico-id');

    if (!id_servico || isNaN(id_servico)) {
        alert("ID do serviço inválido");
        return;
    }

    // Capturar os valores do formulário
    const tipo_servico = document.getElementById('tipo-servico1').value;
    const urgencia = document.getElementById('urgencia-servico').value;
    const responsavel = document.getElementById('responsavel-servico').value;
    const data_servico = document.getElementById('data_servico').value;
    const fk_locall_id = document.getElementById('fk-locall-id').value;
    const fk_maquina_id = document.getElementById('maquina-servico').value;
    const descricao = document.getElementById('descricao').value;

    // Criar o objeto do serviço atualizado
    const servicoAtualizado = {
        tipo_servico,
        urgencia,
        responsavel,
        data_servico,
        fk_locall_id,
        fk_maquina_id,
        descricao,
    };

    // Verificar se algum campo está preenchido
    if (Object.values(servicoAtualizado).every((val) => !val)) {
        showErrorNotification("Nenhum campo foi alterado.");
        return;
    }

    // Enviar a requisição PATCH
    fetch(`http://localhost:3000/servicos/${id_servico}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(servicoAtualizado),
    })
        .then((response) => {
            if (!response.ok) {
                if (response.status === 404) throw new Error('Serviço não encontrado');
                throw new Error('Erro ao atualizar o serviço');
            }
            return response.text();
        })
        .then((data) => {
            showSuccessNotification(data); // Mensagem de sucesso
            fecharModalEditar(); // Fecha o modal
            listarCadastro(); // Atualiza a lista de serviços
        })
        .catch((error) => {
            console.error(error);
            alert(`Erro: ${error.message}`);
        });
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




