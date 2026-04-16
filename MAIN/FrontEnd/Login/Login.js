document.getElementById('login-btn').addEventListener('click', async (event) => {
    event.preventDefault();

    const email = document.getElementById('usuario').value; // Campo de e-mail
    const senha = document.getElementById('senha').value; // Campo de senha

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('success-notification');
            localStorage.setItem('token', data.token);
            localStorage.setItem('nome', data.nome);
            localStorage.setItem('email', data.email);
            setTimeout(() => {
                window.location.href = '../Home/Home.html';
            }, 2000); // Atraso para exibir a notificação
        } else {
            showNotification('error-notification', data.error || 'Erro ao realizar login.');
        }
    } catch (error) {
        console.error('Erro na requisição de login:', error);
        showNotification('error-notification', 'Erro de rede. Tente novamente mais tarde.');
    }
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


bcrypt.hash('Cabrito2$', 10, (err, hashedPassword) => {
    console.log(hashedPassword);
});
