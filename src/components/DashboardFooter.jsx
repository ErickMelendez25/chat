import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Importamos Link para las rutas
import '../styles/DashboardFooter.css';

function DashboardFooter() {
  const [showText, setShowText] = useState(false); // Estado para manejar la visibilidad del texto
  const fullText = "La mejor combinación para tu próxima jugada";
  const year = new Date().getFullYear(); // Año actual dinámico


  useEffect(() => {
    // Hacemos que el texto aparezca después de un pequeño retraso
    const timer = setTimeout(() => {
      setShowText(true); // Mostrar el texto después de 1 segundo
    }, 1000); // Retraso de 1 segundo

    return () => clearTimeout(timer); // Limpiar el timer si el componente se desmonta
  }, []);

  return (
    <footer className="dashboard-footer">
      {/* Solo en /dashboard mostramos las opciones en el pie de página */}
      {window.location.pathname === "/dashboard" && (
        <div className="footer-options">
          {/* Enlaces a las opciones que mencionaste */}

        </div>
      )}

      {/* El texto con animación de desvanecimiento */}
      {showText && (
        <div className="footer-text">
          <h3>{fullText}</h3>
        </div>
      )}
      <p className="copyright">© {year} TinkRuby. Todos los derechos reservados.</p>


    </footer>
  );
}

export default DashboardFooter;
