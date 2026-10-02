// Nombre con el que guardamos las sesiones en localStorage
const CLAVE_GUARDADO = "diario-estudio-sesiones";

// Elementos de la página que vamos a usar
const formulario = document.getElementById("formulario");
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");
const rachaDias = document.getElementById("racha-dias");
const rachaTexto = document.getElementById("racha-texto");
const listaSesiones = document.getElementById("lista-sesiones");
const sinSesiones = document.getElementById("sin-sesiones");

// Lista de sesiones. Cada sesión es: { id, fecha: "AAAA-MM-DD", tema, minutos }
let sesiones = cargarSesiones();

// ---------- Fechas (siempre en hora local, nunca UTC) ----------

// Convierte un objeto Date en texto "AAAA-MM-DD" usando la fecha local
function fechaATexto(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return anio + "-" + mes + "-" + dia;
}

// Convierte un texto "AAAA-MM-DD" en un objeto Date local.
// (No usamos new Date("AAAA-MM-DD") porque lo interpreta como UTC)
function textoAFecha(texto) {
  const partes = texto.split("-");
  return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
}

// Devuelve la fecha de hoy como "AAAA-MM-DD"
function hoy() {
  return fechaATexto(new Date());
}

// Devuelve el día anterior a una fecha "AAAA-MM-DD"
function diaAnterior(texto) {
  const fecha = textoAFecha(texto);
  fecha.setDate(fecha.getDate() - 1);
  return fechaATexto(fecha);
}

// ---------- Guardar y cargar ----------

function cargarSesiones() {
  const guardado = localStorage.getItem(CLAVE_GUARDADO);
  if (!guardado) {
    return [];
  }
  try {
    return JSON.parse(guardado);
  } catch (error) {
    return [];
  }
}

function guardarSesiones() {
  localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(sesiones));
}

// ---------- Racha ----------

function calcularRacha() {
  // Guardamos los días que tienen al menos una sesión
  const diasConSesion = new Set();
  for (const sesion of sesiones) {
    diasConSesion.add(sesion.fecha);
  }

  // Empezamos a contar desde hoy. Si hoy aún no hay sesión,
  // empezamos desde ayer (la racha sigue viva hasta que acabe el día).
  let dia = hoy();
  if (!diasConSesion.has(dia)) {
    dia = diaAnterior(dia);
  }

  // Contamos hacia atrás mientras haya sesión ese día
  let racha = 0;
  while (diasConSesion.has(dia)) {
    racha = racha + 1;
    dia = diaAnterior(dia);
  }
  return racha;
}

// ---------- Pintar en pantalla ----------

function mostrarRacha() {
  const racha = calcularRacha();
  rachaDias.textContent = racha;
  rachaTexto.textContent = racha === 1 ? "día seguido" : "días seguidos";
}

function mostrarSesiones() {
  listaSesiones.innerHTML = "";

  // Ordenamos de la más reciente a la más antigua.
  // Si dos sesiones tienen la misma fecha, va primero la última que se añadió.
  const ordenadas = [...sesiones].sort(function (a, b) {
    if (a.fecha !== b.fecha) {
      return a.fecha < b.fecha ? 1 : -1;
    }
    return b.id - a.id;
  });

  sinSesiones.hidden = ordenadas.length > 0;

  for (const sesion of ordenadas) {
    const elemento = document.createElement("li");
    elemento.className = "sesion";

    const info = document.createElement("div");

    const tema = document.createElement("div");
    tema.className = "sesion-tema";
    tema.textContent = sesion.tema;

    const fecha = document.createElement("div");
    fecha.className = "sesion-fecha";
    fecha.textContent = textoAFecha(sesion.fecha).toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const minutos = document.createElement("div");
    minutos.className = "sesion-minutos";
    minutos.textContent = sesion.minutos + " min";

    info.appendChild(tema);
    info.appendChild(fecha);
    elemento.appendChild(info);
    elemento.appendChild(minutos);
    listaSesiones.appendChild(elemento);
  }
}

function actualizarPantalla() {
  mostrarRacha();
  mostrarSesiones();
}

// ---------- Formulario ----------

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault(); // Evita que la página se recargue

  const fecha = campoFecha.value;
  const tema = campoTema.value.trim();
  const minutos = Number(campoMinutos.value);

  // Comprobaciones por si acaso (el HTML ya valida lo básico)
  if (!fecha || tema === "" || !(minutos > 0)) {
    return;
  }

  sesiones.push({
    id: Date.now(),
    fecha: fecha,
    tema: tema,
    minutos: minutos,
  });

  guardarSesiones();
  actualizarPantalla();

  // Limpiamos tema y minutos, pero dejamos la fecha por si apuntas varias del mismo día
  campoTema.value = "";
  campoMinutos.value = "";
  campoTema.focus();
});

// ---------- Inicio ----------

campoFecha.value = hoy();
actualizarPantalla();
