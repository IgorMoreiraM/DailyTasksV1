import { useAuth } from '../contexts/AuthContext';
// Importa os estilos da HOME
import styles from '../pages/Home.module.css'; 

export const Header = () => {
  const { logout } = useAuth();

  return (
    // Usa a classe .header
    <header className={styles.header}> 
      <h1>Daily Tasks</h1>
      <nav>
        {/* Usa a classe .logoutButton */}
        <button onClick={logout} className={styles.logoutButton}>
          Logout
        </button>
        {/* <button id="toggleThemeBtn" className={styles.toggleThemeBtn}>🌙 Tema Escuro</button> */}
      </nav>
    </header>
  );
};