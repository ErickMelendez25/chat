// 1. Agrega un nuevo endpoint en tu backend (por ejemplo en Express):
// GET /api/predicciones -> para obtener las combinaciones sugeridas más recientes

// --- En tu backend Node (ejemplo): ---
// app.get('/api/predicciones', async (req, res) => {
//   const predicciones = await db.query('SELECT * FROM predicciones ORDER BY id DESC LIMIT 10');
//   res.json(predicciones);
// });

// 2. Ahora agrega esta sección en tu componente React para mostrar combinaciones sugeridas y superposición:

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import './TinkaDashboard.css';


const API = 'https://tinka-production.up.railway.app/api';        // API de tu backend Node.js
const API_TINKA = 'http://localhost:8001/api';      // API del modelo cuántico (FastAPI)


const TinkaDashboard = () => {
  const [nuevaBola, setNuevaBola] = useState({ bola1: '', bola2: '', bola3: '', bola4: '', bola5: '', bola6: '', boliyapa: '', fecha: '' });
  const [frecuencias, setFrecuencias] = useState([]);
  const [sorteos, setSorteos] = useState([]);
  const [predicciones, setPredicciones] = useState([]);
  

  useEffect(() => {
    fetch(`${API}/sorteos`).then(res => res.json()).then(setSorteos);
    fetch(`${API}/frecuencias`).then(res => res.json()).then(setFrecuencias);
    fetch(`${API}/predicciones`).then(res => res.json()).then(setPredicciones);
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setNuevaBola(prev => ({ ...prev, [name]: value }));
  };

  const guardarSorteo = async () => {
    const response = await fetch(`${API}/sorteos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevaBola)
    });
    if (response.ok) {
      alert('Sorteo registrado');
      window.location.reload();
    } else {
      alert('Error al guardar sorteo');
    }
  };

const ejecutarModelo = async () => {
  try {
    const res = await fetch(`${API_TINKA}/ejecutarmodelo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ejecutar: true })  // ← porque tu endpoint espera este body
    });
    const data = await res.json();
    alert(data.message || '✅ Modelo ejecutado correctamente');
    obtenerPredicciones();
  } catch (error) {
    console.error('Error ejecutando el modelo:', error);
    alert('❌ Error al ejecutar el modelo');
  }
};



  const obtenerPredicciones = async () => {
    const res = await fetch(`${API}/predicciones`);
    const data = await res.json();
    setPredicciones(data);
  };

  useEffect(() => {
    obtenerPredicciones();
  }, []);


  const colores = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="dashboard">
      <h2 className="title">📊 Registro y Predicción de Resultados de La Tinka</h2>

      <section className="formulario">
        <h3>Registrar nuevo sorteo</h3>
        <div className="inputs">
          <input type="date" name="fecha" value={nuevaBola.fecha} onChange={handleChange} />
          {[1, 2, 3, 4, 5, 6].map(i => (
            <input key={i} name={`bola${i}`} placeholder={`Bola ${i}`} value={nuevaBola[`bola${i}`]} onChange={handleChange} type="number" min="1" max="50" />
          ))}
          <input name="boliyapa" placeholder="BoliYapa" value={nuevaBola.boliyapa} onChange={handleChange} type="number" min="1" max="50" />
        </div>
        <button onClick={guardarSorteo} className="btn-guardar">Guardar Sorteo</button>
      </section>

      <section className="grafico">
        <h3>🎯 Frecuencia de Números</h3>
        <BarChart width={800} height={300} data={frecuencias}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="numero" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="veces_salida" fill="#4f46e5" radius={[5, 5, 0, 0]} />
        </BarChart>
      </section>

      <section className="tabla">
        <h3>📅 Histórico de Sorteos</h3>
        <table>
          <thead>
            <tr><th>Fecha</th><th>Bolas</th><th>BoliYapa</th></tr>
          </thead>
          <tbody>
            {sorteos.map(s => (
              <tr key={s.fecha}>
                <td>{s.fecha}</td>
                <td>{[s.bola1, s.bola2, s.bola3, s.bola4, s.bola5, s.bola6].map((n, i) => (
                  <span key={i} className="bolita">{n}</span>
                ))}</td>
                <td>{s.boliyapa && <span className="bolita boliyapa">{s.boliyapa}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>


      <section className="prediccion">
        <h3>🔮 Predicción Cuántica</h3>
        <button onClick={ejecutarModelo} className="btn-ejecutar">Ejecutar modelo</button>
      </section>
      <section className="tabla">
  <h3>✨ Combinaciones Sugeridas</h3>
  <table>
    <thead>
      <tr>
        <th style={{ width: '300px' }}>Bolas</th>
        <th style={{ width: '60px' }}>BoliYapa</th>

        <th style={{ width: '60px' }}>Probabilidad</th>
        <th style={{ width: '60px' }}>Pares</th>
        <th style={{ width: '60px' }}>Tríos</th>
        <th style={{ width: '180px' }}>Modelo</th>

      </tr>
    </thead>
    <tbody>
          {predicciones.map((p, i) => (
            <tr key={i}>
              <td>
                {[p.bola1, p.bola2, p.bola3, p.bola4, p.bola5, p.bola6].map((n, i) => (
                  <span key={i} className="bolita">{n}</span>
                ))}
              </td>
              <td><span className="bolita boliyapa">{p.boliyapa}</span></td>

              <td>{(p.probabilidad * 100).toFixed(0)}%</td>
              <td>{p.pares}</td>
              <td>{p.trios}</td>
              <td>{p.modelo_version}</td>              
            </tr>
          ))}
        </tbody>
      </table>
    </section>
    <section className="graficos-flex">
      <div className="grafico">
        <h3>🌌 Visualización Cuántica: Superposición y Colapso</h3>
        <img src="http://localhost:8001/static/superposicion_colapso.png" alt="Colapso Cuántico" style={{ maxWidth: '100%', borderRadius: '8px' }} />
        <p className="nota">* Simulación visual del principio de superposición colapsando a un resultado clásico.</p>
      </div>

      <div className="grafico">
        <h3>🌀 Superposición y Colapso Cuántico (Visual)</h3>
        <PieChart width={400} height={300}>
          <Pie
            data={frecuencias.slice(0, 6).map((f, i) => ({ name: `#${f.numero}`, value: f.veces_salida }))}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {frecuencias.slice(0, 6).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
        <p className="nota">* Esto simula la idea de que los números pueden estar en "superposición" y luego se "colapsan" a uno al ser elegidos.</p>
      </div>
    </section>




    </div>

  );
};

export default TinkaDashboard;
