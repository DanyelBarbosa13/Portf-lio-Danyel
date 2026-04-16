document.getElementById("form-cadastro").addEventListener("submit", async function (event) {
    event.preventDefault(); // Previne o comportamento padrão do formulário

    // Validações dos campos
    validateNome(document.getElementById("nome"));
    validateEmail(document.getElementById("email"));
    validatePassword(document.getElementById("senha"));
    validateConfirmPassword();

    // Verifica se há mensagens de erro ativas
    const errors = document.querySelectorAll('.error-message:not(:empty)');
    if (errors.length > 0) {
        return; // Impede o envio do formulário se houver erros
    }

    // Obtendo os valores do formulário
    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    // Caso passe por todas as validações, faz o envio do formulário
    try {
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nome, email, senha }),
        });

        if (response.ok) {
            showNotification("success-notification", "Cadastro realizado com sucesso!");

            // Atualizar senhas (caso necessário)
            const updateResponse = await fetch('http://localhost:3000/atualizar-senhas');
            if (updateResponse.ok) {
                console.log("Senhas atualizadas com sucesso!");
            } else {
                console.error("Erro ao atualizar senhas.");
            }

            setTimeout(() => {
                window.location.href = "../Login/login.html"; // Redireciona para a página de login
            }, 3000);
        } else {
            const errorData = await response.json();
            showNotification("error-notification", `Erro: ${errorData.error}`);
        }
    } catch (error) {
        showNotification("error-notification", "Erro ao tentar cadastrar. Tente novamente.");
        console.error("Erro:", error);
    }
});

// Função de validação de nome
function validateNome(field) {
    const errorMessageElement = document.getElementById("nome-error");
    const value = field.value.trim();
    let messages = [];

    if (!value) {
        messages.push("O campo de nome é obrigatório.");
    } else if (value.length < 3) {
        messages.push("O nome deve conter pelo menos 3 letras.");
    }

    if (messages.length > 0) {
        errorMessageElement.innerHTML = messages.join("<br>");
        errorMessageElement.style.display = "block";
    } else {
        errorMessageElement.innerHTML = "";
        errorMessageElement.style.display = "none";
    }
}

// Função de validação de email
function validateEmail(field) {
    const errorMessageElement = document.getElementById("email-error");
    const value = field.value.trim();
    let messages = [];

    if (!value) {
        messages.push("O campo de email é obrigatório.");
    } else {
        // Verifica se há um "@" no e-mail
        if (!/@/.test(value)) {
            messages.push(`Inclua um "@" no endereço de e-mail. "${value}" está com um "@" faltando.`);
        }

        // Verifica se há uma parte após o "@"
        const parts = value.split("@");
        if (parts.length === 2 && parts[1].trim() === "") {
            messages.push(`Insira uma parte depois do "@". "${value}" está incompleto.`);
        } else if (parts.length > 2) {
            messages.push(`O endereço de e-mail não pode conter mais de um "@".`);
        }

        // Verifica o formato geral do e-mail
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && parts.length === 2 && parts[1].trim() !== "") {
            messages.push("Por favor, insira um e-mail válido.");
        }
    }

    if (messages.length > 0) {
        errorMessageElement.innerHTML = messages.join("<br>");
        errorMessageElement.style.display = "block";
    } else {
        errorMessageElement.innerHTML = "";
        errorMessageElement.style.display = "none";
    }
}

// Validação de senha
function validatePassword(field) {
    const errorMessageElement = document.getElementById("senha-error");
    const value = field.value;
    let messages = [];

    if (!value) {
        messages.push("O campo de senha é obrigatório.");
    } else {
        if (!/[A-Z]/.test(value)) {
            messages.push("A senha deve conter pelo menos uma letra maiúscula.");
        }
        if (!/[!@#$%^&*]/.test(value)) {
            messages.push("A senha deve conter pelo menos um caractere especial.");
        }
        if (value.length < 8) {
            messages.push("A senha deve ter pelo menos 8 caracteres.");
        }
    }

    if (messages.length > 0) {
        errorMessageElement.innerHTML = messages.join("<br>");
        errorMessageElement.style.display = "block";
    } else {
        errorMessageElement.innerHTML = "";
        errorMessageElement.style.display = "none";
    }
}

// Validação de confirmação de senha
function validateConfirmPassword() {
    const password = document.getElementById("senha").value;
    const confirmPassword = document.getElementById("confirmar-senha").value;
    const errorMessageElement = document.getElementById("confirmar-senha-error");

    if (!confirmPassword) {
        errorMessageElement.textContent = "O campo de confirmar senha é obrigatório.";
        errorMessageElement.style.display = "block";
    } else if (password !== confirmPassword) {
        errorMessageElement.textContent = "As senhas não correspondem.";
        errorMessageElement.style.display = "block";
    } else {
        errorMessageElement.textContent = "";
        errorMessageElement.style.display = "none";
    }
}

// Eventos de blur para validação
document.getElementById("nome").addEventListener("blur", function () {
    validateNome(this);
});

document.getElementById("email").addEventListener("blur", function () {
    validateEmail(this);
});

document.getElementById("senha").addEventListener("blur", function () {
    validatePassword(this);
});

document.getElementById("confirmar-senha").addEventListener("blur", function () {
    validateConfirmPassword();
});

// Função para exibir notificações
function showNotification(id, message = null) {
    const notification = document.getElementById(id);
    if (message) notification.querySelector('span').textContent = message;
    notification.classList.add('visible');
    setTimeout(() => {
        notification.classList.remove('visible');
    }, 3000); // Duração da notificação em milissegundos
}
