import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios'; 
import '../styles/DashboardHeader.css';
import socket from './socket';


const handleLogout = async () => {
  try {
    const usuario = JSON.parse(localStorage.getItem('usuario'));

    if (usuario?.id) {
      await axios.post('https://chat-production-c0ef.up.railway.app/logout', { userId: usuario.id });
    }

    // 🔌 Desconectar socket antes de salir
    socket.disconnect();
    console.log('🔌 Socket desconectado al cerrar sesión.');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }

  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('usuario');
  localStorage.removeItem('user');
  window.location.href = '/';
};



function DashboardHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [estudiantes, setEstudiantes] = useState([]); 
  const [asesores, setAsesores] = useState([]); 
  const [revisores, setRevisores] = useState([]); 
  const location = useLocation();
  const [titleVisible, setTitleVisible] = useState(false);
  const [userPhoto, setUserPhoto] = useState(''); // Estado para la foto de perfil del usuario
  const [userName, setUserName] = useState(''); // Estado para el nombre del usuario

  // Verifica si estamos en la página principal del dashboard
  const isDashboard = location.pathname === "/dashboard";
  
  // Obtener la opción actual desde la URL (si existe) y decodificarla
  const opcion = location.pathname.split('/')[2];
  
  // Decodificar la URL y reemplazar los guiones por espacios
  const decodedTitle = opcion ? decodeURIComponent(opcion.replaceAll('-', ' ')) : ''; 

  // Función para abrir o cerrar el menú
  const toggleMenu = () => {
    setIsMenuOpen(prevState => !prevState);
  };

  // Función para confirmar el cierre de sesión
  const confirmLogout = () => {
    setShowConfirmLogout(true);
    setIsMenuOpen(false);
  };

  // Función para confirmar realmente el logout
  const confirmAndLogout = () => {
    handleLogout();
  };

  // Función para cancelar el logout
  const cancelLogout = () => {
    setShowConfirmLogout(false);
  };

  // Cuando el pathname cambia, hacemos aparecer el título con una transición
  useEffect(() => {
    setTitleVisible(false); // Primero ocultamos el título
    const timer = setTimeout(() => {
      setTitleVisible(true); // Mostramos el título después de un tiempo
    }, 100); // Tiempo en ms para que se vea el efecto de transición
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Obtener el rol del usuario desde el localStorage con validación de errores
  const userRole = localStorage.getItem('userRole');

  // Intentar obtener los datos del usuario desde el localStorage y parsearlos correctamente
  let user = null;
  try {
    const userData = localStorage.getItem('usuario');
    user = userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error parsing user data:", error);
  }

  // Si el usuario está logueado con Google, sus datos deben estar en localStorage
  let userEmail = user ? user.correo : '';  
  const userRol = user ? user.rol : '';  

  let Nombre = '';
  let imagen_perfil = ''; 

  // Obtener datos de Google si el usuario está logueado con Google
  useEffect(() => {
    const googleUser = localStorage.getItem('user');
    if (googleUser) {
      const googleData = JSON.parse(googleUser);
      console.log("ID del usuario de Google:", googleData.id); // Mostrar el ID del usuario
      console.log("URL de la foto de perfil del usuario de Google:", googleData.imagen_perfil); // Mostrar la URL de la foto
      setUserPhoto(googleData.imagen_perfil || ''); // Asignar la URL de la imagen de perfil, si existe
      setUserName(googleData.nombre); // Establecer el nombre del usuario
    }
  }, []); // Esta dependencia vacía asegura que se ejecute solo al montar el componente

  useEffect(() => {
    const googleUser = localStorage.getItem('user');
    const normalUser = localStorage.getItem('usuario');

    if (googleUser) {
      const googleData = JSON.parse(googleUser);
      setUserPhoto(googleData.imagen_perfil || '');
      setUserName(googleData.nombre || '');
    } else if (normalUser) {
      const userData = JSON.parse(normalUser);
      setUserPhoto(userData.imagen_perfil || '');
      setUserName(userData.nombre || '');
    }
  }, []);


  useEffect(() => {
    const handleClickOutside = (event) => {
      const menu = document.querySelector('.menu-options');
      const avatar = document.querySelector('.user-photo-container');
  
      if (menu && avatar && !menu.contains(event.target) && !avatar.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  

  // Verifica que la URL de la imagen esté válida antes de asignarla
  const imageUrl = userPhoto || (user && user.imagen_perfil) || 'https://i.imgur.com/6VBx3io.png'; // Imagen por defecto si no hay ninguna
 // Imagen predeterminada en caso de no tener foto

  return (
    <header className="dashboard-header">
      <div className="logo-container">
        <Link to="/dashboard" className="logo-link">
          <img src="/images/logo.png" alt="Logo" className={titleVisible ? 'logo-animate' : ''} />
        </Link>

      </div>

      {/* Mostrar el título de la opción seleccionada o el menú, dependiendo de la ruta */}
      <div className="header-center">
        {decodedTitle ? (
          <h1 className={titleVisible ? 'title-animate' : ''}>
            {decodedTitle.toUpperCase()}
          </h1>
        ) : (
          isDashboard && (
            <div className="navbar-container">
              <nav className="navbar">
                <ul className="header-options">
                    <li className="saludo-usuario">

                    <strong>Hola, {user.nombre}</strong><br />
                    No olvides cerrar sesión. Haz click en el ícono de usuario.
                  </li>

                </ul>
              </nav>
            </div>
          )
        )}
      </div>

      {/* Mostrar la imagen de perfil de usuario autenticado de Google */}
      <div className="user-photo-container">
      <img 
          src={imageUrl}
          alt="Foto de usuario"
          className="user-icon"
          onClick={toggleMenu}
          title="Opciones" 
        />

        
        {/* Mostrar el menú de opciones cuando se hace clic en la foto */}
        {isMenuOpen && (
          
          <div className="menu-options">
            <ul>
              <li onClick={confirmLogout}>Cerrar sesión</li>
            </ul>
          </div>
        )}
      </div>
      {showConfirmLogout && (
      <div className="logout-modal">
        <div className="modal-content">
          <p>¿Estás seguro de que quieres cerrar sesión?</p>
          <div className="modal-buttons">
            <button onClick={confirmAndLogout}>Sí, cerrar sesión</button>
            <button onClick={cancelLogout}>Cancelar</button>
          </div>
        </div>
      </div>
    )}
  
    </header>
    
  );
}

export default DashboardHeader;