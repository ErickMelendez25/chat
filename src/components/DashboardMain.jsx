import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';


const API = 'https://chat-production-c0ef.up.railway.app/api';
const socket = io('https://chat-production-c0ef.up.railway.app'); // 🔧 agrega esta línea

const DashboardMain = () => {
  const [usuario, setUsuario] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [receptorId, setReceptorId] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = useState(false);


  // Cargar usuario logueado
useEffect(() => {
  const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
  if (usuarioGuardado?.id) {
    setUsuario(usuarioGuardado);
    socket.emit('usuario-conectado', usuarioGuardado.id); // ✅ notificamos al backend
  }
}, []);


  // Obtener usuarios
useEffect(() => {
    if (!usuario?.id) return;

    const obtenerUsuarios = async () => {
      try {
        const res = await fetch(`${API}/usuarios`);
        const data = await res.json();
        setUsuarios(data.filter(u => u.id !== usuario.id));
      } catch (err) {
        console.error('Error al obtener usuarios:', err);
      }
    };

    obtenerUsuarios(); // primer fetch

    socket.on('actualizar-usuarios', obtenerUsuarios); // escuchamos cambios del backend

    return () => {
      socket.off('actualizar-usuarios', obtenerUsuarios); // limpieza
    };
  }, [usuario]);


  // Obtener mensajes con el receptor
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
    const intervalo = setInterval(obtenerMensajes, 3000);
    return () => clearInterval(intervalo);
  }, [usuario, receptorId]);

  // Enviar mensaje
  const enviarMensaje = async () => {
    if (!mensaje.trim() || !usuario?.id || !receptorId) return;

    const nuevoMensaje = {
      emisor_id: usuario.id,
      receptor_id: receptorId,
      mensaje: mensaje.trim(),
      tipo: 'texto',
      url_archivo: null
    };

    try {
      const res = await fetch(`${API}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoMensaje)
      });

      if (!res.ok) throw new Error('Error al enviar mensaje');

      setMensaje('');
      setMensajes(prev => [...prev, { ...nuevoMensaje, fecha_envio: new Date().toISOString() }]);
    } catch (err) {
      console.error(err);
    }
  };

  if (!usuario) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <p>⚠️ Usuario no autenticado.Inicia con google por favor y conoce tu oferta horaria</p>
        <button
          onClick={() => window.location.href = '/login'}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Ir al login
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Lista de usuarios */}
      <aside style={{ width: '250px', borderRight: '1px solid #ddd', padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Usuarios</h3>
        {usuarios.map(u => (
          <div
            key={u.id}
            onClick={() => setReceptorId(u.id)}
            style={{
              padding: '0.5rem',
              marginBottom: '0.5rem',
              backgroundColor: receptorId === u.id ? '#f0f0f0' : '#fff',
              cursor: 'pointer',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid #ccc'
            }}
          >
            <span>
              {u.nombre}
              <span style={{ fontSize: '0.8em', color: '#666' }}> (ID {u.id})</span>
            </span>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: u.estado === 1 ? '#28a745' : '#ccc'
              }}
              title={u.estado === 1 ? 'Activo' : 'Inactivo'}
            />
          </div>
        ))}
      </aside>

      {/* Chat principal */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Chat</h3>

        {receptorId ? (
          <>
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: '#fafafa'
              }}
            >
              {mensajes.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: m.emisor_id === usuario.id ? 'flex-end' : 'flex-start',
                    marginBottom: '0.5rem'
                  }}
                >
                  <span
                    style={{
                      backgroundColor: m.emisor_id === usuario.id ? '#007bff' : '#e0e0e0',
                      color: m.emisor_id === usuario.id ? '#fff' : '#000',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      maxWidth: '60%'
                    }}
                  >
                    {m.mensaje}
                  </span>
                </div>
              ))}
            </div>

          <div style={{ position: 'relative', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Botón para mostrar el picker */}
            <button
              onClick={() => setMostrarEmojiPicker(!mostrarEmojiPicker)}
              style={{
                padding: '0.3rem 0.5rem',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ccc',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              😊
            </button>

            {/* Picker de emojis */}
            {mostrarEmojiPicker && (
              <div style={{ position: 'absolute', bottom: '60px', left: '0', zIndex: 1000 }}>
                <EmojiPicker
                  onEmojiClick={(emojiData) => {
                    setMensaje(prev => prev + emojiData.emoji);
                  }}
                />
              </div>
            )}

            {/* Input de mensaje */}
            <input
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              placeholder="Escribe un mensaje..."
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #ccc'
              }}
            />

            {/* Botón de enviar */}
            <button
              onClick={enviarMensaje}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Enviar
            </button>
          </div>

          </>
        ) : (
          <p>Selecciona un usuario para comenzar a chatear</p>
        )}
      </main>
    </div>
  );
};

export default DashboardMain;
