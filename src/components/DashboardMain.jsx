import React, { useEffect, useState, useRef } from 'react';

import EmojiPicker from 'emoji-picker-react';
import './chat.css';
import socket from './socket';

const API = 'https://chat-production-c0ef.up.railway.app/api';

const DashboardMain = () => {
  const [usuario, setUsuario] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [receptorId, setReceptorId] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = useState(false);

  const [ultimosMensajes, setUltimosMensajes] = useState({});

  const mensajesRef = useRef(null);

  const emojiPickerRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !event.target.closest('.emoji-btn') // Para no cerrarlo cuando haces clic en el botón
      ) {
        setMostrarEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Obtener usuario de localStorage
useEffect(() => {
  const raw = localStorage.getItem('usuario');
  console.log('Contenido de localStorage:', raw);

  if (!raw) {
    console.log('⚠️ No hay usuario guardado');
    return;
  }

  const usuarioGuardado = JSON.parse(raw);

  // Usar el ID que ya venga (por ejemplo, si viene de Google)
  let idUsuario = usuarioGuardado?.id;

  // Si no hay 'id', buscar entre los posibles campos
  if (!idUsuario) {
    idUsuario =
      usuarioGuardado?.id_estudiante ??
      usuarioGuardado?.id_asesor ??
      usuarioGuardado?.id_revisor;
  }

  if (idUsuario) {
    // Nos aseguramos de que siempre tenga un 'id'
    setUsuario({ ...usuarioGuardado, id: idUsuario });
    console.log('✅ Usuario autenticado:', { ...usuarioGuardado, id: idUsuario });
    socket.emit('unirse', idUsuario);
  } else {
    console.log('⚠️ Usuario no autenticado. Inicia sesión para continuar.');
  }
}, []);



  // Conectar socket a la sala del usuario
  useEffect(() => {
    const handleConnect = () => {
      if (usuario?.id) {
        socket.emit('usuario-conectado', usuario.id);
        console.log(`✅ Usuario conectado a su sala personalizada: usuario_${usuario.id}`);
      }
    };

    socket.on('connect', handleConnect);

    if (socket.connected) handleConnect();

    return () => {
      socket.off('connect', handleConnect);
    };
  }, [usuario?.id]);

  // Obtener lista de usuarios
// Obtener usuarios y últimos mensajes
  useEffect(() => {
    if (!usuario?.id) return;

    const obtenerUsuariosYMensajes = async () => {
      try {
        const [resUsuarios, resUltimos] = await Promise.all([
          fetch(`${API}/usuarios`),
          fetch(`${API}/ultimos-mensajes/${usuario.id}`)
        ]);

        const usuariosData = await resUsuarios.json();
        const ultimosData = await resUltimos.json();

        const usuariosFiltrados = usuariosData
          .filter(u => u.id !== usuario.id)
          .map(u => ({
            ...u,
            estado: u.estado ?? 0
          }));

        const ultimos = {};
        for (const mensaje of ultimosData) {
          const otroUsuarioId = mensaje.emisor_id === usuario.id ? mensaje.receptor_id : mensaje.emisor_id;
          ultimos[otroUsuarioId] = {
            texto: mensaje.mensaje,
            leido: mensaje.receptor_id === usuario.id && mensaje.leido === 1,
            fecha_envio: mensaje.fecha_envio
          };

        }

        setUsuarios(usuariosFiltrados);
        setUltimosMensajes(ultimos);
      } catch (err) {
        console.error('Error al obtener usuarios o últimos mensajes:', err);
      }
    };

    obtenerUsuariosYMensajes();
  }, [usuario]);


  // Obtener mensajes al cambiar de receptor
  useEffect(() => {
    if (!usuario?.id || !receptorId) return;

    const obtenerMensajes = async () => {
      try {
        const res = await fetch(`${API}/mensajes/${usuario.id}/${receptorId}`);
        const data = await res.json();
        setMensajes(data);
      } catch (err) {
        console.error('Error al obtener mensajes:', err);
      }
    };

    obtenerMensajes();
  }, [usuario?.id, receptorId]);

  // Escuchar mensajes entrantes
  useEffect(() => {
    const handleNuevoMensaje = (data) => {

      console.log(
        `📨 Mensaje recibido de ${data.emisor_id} a ${data.receptor_id}. Conversación actual: ${usuario?.id} ↔ ${receptorId}`
      );
      const esConversacionActual =
        (data.emisor_id === receptorId && data.receptor_id === usuario?.id) ||
        (data.emisor_id === usuario?.id && data.receptor_id === receptorId);

        if (esConversacionActual) {
          setMensajes((prev) => {
            const yaExiste = prev.some(m => m.id === data.id);
            const mensajeConFecha = {
              ...data,
              fecha_envio: data.fecha_envio || new Date().toISOString()
            };
            return yaExiste ? prev : [...prev, mensajeConFecha];
          });

        } else {
          console.log('📩 Mensaje recibido que no pertenece a la conversación actual');
        }

        // Siempre actualiza el último mensaje
        const otroUsuarioId = data.emisor_id === usuario.id ? data.receptor_id : data.emisor_id;
        setUltimosMensajes((prev) => ({
          ...prev,
          [otroUsuarioId]: {
            texto: data.mensaje,
            leido: receptorId === otroUsuarioId,
            fecha_envio: data.fecha_envio || new Date().toISOString()
          }
        }));


    };



    socket.on('nuevo-mensaje', handleNuevoMensaje);

    return () => {
      socket.off('nuevo-mensaje', handleNuevoMensaje); // 👈 Este es el que debe estar, no 'mensaje-recibido'
    };
  }, [usuario?.id, receptorId]);



  useEffect(() => {
  if (receptorId) {
    setUltimosMensajes((prev) => ({
      ...prev,
      [receptorId]: {
        ...prev[receptorId],
        leido: true
      }
    }));
  }
}, [receptorId]);


useEffect(() => {
  if (mensajesRef.current && mensajes.length > 0) {
    const ultimoMensaje = mensajes[mensajes.length - 1];
    if (
      ultimoMensaje.emisor_id === receptorId ||
      ultimoMensaje.receptor_id === receptorId
    ) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }
}, [mensajes]);



  // Escuchar cambios de estado de usuarios
  useEffect(() => {
    const actualizarEstados = (usuariosConectadosIds) => {
      setUsuarios(prevUsuarios =>
        prevUsuarios.map(u => {
          if (usuariosConectadosIds.includes(u.id) && u.estado !== 1) {
            return { ...u, estado: 1 };
          } else if (!usuariosConectadosIds.includes(u.id) && u.estado !== 0) {
            return { ...u, estado: 0 };
          }
          return u; // sin cambios
        })
      );
    };

    socket.on('estado-usuarios', actualizarEstados);

    return () => {
      socket.off('estado-usuarios', actualizarEstados);
    };
  }, []);




  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [mensajes]);



  // Enviar mensaje
// Enviar mensaje
  const enviarMensaje = async () => {
    if (!mensaje.trim() || !usuario?.id || !receptorId) return;

    const nuevoMensaje = {
      emisor_id: usuario.id,
      receptor_id: receptorId,
      mensaje: mensaje.trim(),
      tipo: 'texto',
      url_archivo: null,
    };

    try {
      const res = await fetch(`${API}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoMensaje),
      });

      if (!res.ok) throw new Error('Error al enviar mensaje');

      const { id } = await res.json();
      const fechaEnvio = new Date().toISOString();

      socket.emit('nuevo-mensaje', { ...nuevoMensaje, id, fecha_envio: fechaEnvio });

      setMensajes(prev => [...prev, { ...nuevoMensaje, id, fecha_envio: fechaEnvio }]);

      setMensaje('');

      // 👇 Agrega esta parte para actualizar últimos mensajes al enviar
      setUltimosMensajes((prev) => ({
        ...prev,
        [receptorId]: {
          texto: nuevoMensaje.mensaje,
          leido: true  // El usuario que lo envía siempre lo ve como leído
        }
      }));

    } catch (err) {
      console.error(err);
    }
  };


  if (!usuario) {
    return (
      <div className="no-auth">
        <p>⚠️ Usuario no autenticado. Inicia sesión para continuar.</p>
        <button onClick={() => window.location.href = '/login'}>Ir al login</button>
      </div>
    );
  }

  const formatearHora = (isoString) => {
    if (!isoString) return '';
    const fecha = new Date(isoString);
    if (isNaN(fecha.getTime())) return '';
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    return `${horas}:${minutos}`;
  };


  return (
    <div className="dashboard">
      <aside className="usuarios">
 
        {usuarios.map(u => (
        <div
          key={u.id}
          onClick={() => setReceptorId(u.id)}
          className={`usuario-item ${receptorId === u.id ? 'activo' : ''}`}
        >
          <div className="usuario-info">
            <span className="usuario-nombre">{u.nombre} <span className="id"></span></span>
            {ultimosMensajes[u.id] && (
              <div className={`ultimo-mensaje ${!ultimosMensajes[u.id].leido ? 'negrita' : ''}`}>
                <span className="texto">{ultimosMensajes[u.id].texto}</span>
                {ultimosMensajes[u.id].fecha_envio && (
                  <span className="hora">{formatearHora(ultimosMensajes[u.id].fecha_envio)}</span>
                )}
              </div>
            )}

          </div>
          <span className={`estado ${u.estado === 1 ? 'verde' : 'gris'}`} />
        </div>

        ))}
      </aside>

      <main className="chat">
        {receptorId ? (
          <>
            <div className="mensajes" ref={mensajesRef}>
              {mensajes.map((m, i) => (
                <div key={i} className={`mensaje-linea ${m.emisor_id === usuario.id ? 'yo' : 'ellos'}`}>
                  <span className="burbuja">{m.mensaje}</span>
                  <span className="hora">{formatearHora(m.fecha_envio)}</span>
                </div>
              ))}
            </div>


            <div className="entrada-mensaje">
              <button
                className="emoji-btn"
                onClick={() => setMostrarEmojiPicker(!mostrarEmojiPicker)}
              >
                😊
              </button>

              

              {mostrarEmojiPicker && (
                <div className="emoji-picker" ref={emojiPickerRef}>
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setMensaje((prev) => prev + emojiData.emoji);
                    }}
                  />
                </div>
              )}


              <input
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                placeholder="Escribe un mensaje..."
              />
              <button className="enviar-btn" onClick={enviarMensaje}>Enviar</button>
            </div>
          </>
        ) : (
          <p className="selecciona-receptor">Selecciona un usuario para comenzar a chatear</p>
        )}
      </main>
    </div>
  );
};

export default DashboardMain;