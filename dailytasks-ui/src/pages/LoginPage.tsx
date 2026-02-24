import { useState, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import logo from '/img/Logo.png'; 
import styles from './LoginPage.module.css'; 

export const LoginPage = () => { 
  const { isAuthenticated, isAdmin, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const response = await api.post('/login', { 
        username: username, 
        password: password 
      });
      login(response.data.token); 
    } catch (err: any) {
      console.error('Falha no login:', err);
      setError('Usuário ou senha inválidos.');
    }
  };

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  return (
    <div className={styles.loginPageWrapper}> 
      <div className={styles.container}>
        <div className={`${styles.panel} ${styles.loginSection}`}>
          
          {/* Usa a classe .logo */}
          <img src={logo} alt="Daily Tasks" className={styles.logo} />
          
          <h2>Bem vindo ao Daily Tasks</h2>
          <p>Gerencie suas tarefas</p>

          <form id="loginForm" onSubmit={handleSubmit}>
            <label htmlFor="email">Usuário/E-mail</label>
            {/* Usa a classe .input */}
            <input
              type="text" 
              id="email" 
              placeholder="Entre com seu usuário ou e-mail"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={styles.input} 
            />

            <label htmlFor="password">Senha</label>
            {/* Usa a classe .input */}
            <input
              type="password"
              id="password" 
              placeholder="Entre com sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input} 
            />

            {/* Usa a classe .button */}
            <button type="submit" className={styles.button}>Entrar</button>
            {error && <p className={styles.errorMessage}>{error}</p>} 
          </form>
        </div>

        <div className={`${styles.panel} ${styles.welcomeSection}`}>
          <h2>O Daily Tasks te ajuda!</h2>
          <p>Faça login para começar.</p>
          {/* O seu protótipo tinha um botão de registo aqui, 
              que usa .toggleButton, mas nós o removemos. */}
        </div>
      </div>
    </div>
  );
};