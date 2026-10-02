// Lógica de la app sin nada de la página (DOM), para poder probarla con Node.
// En el navegador estas funciones quedan disponibles para app.js.

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

// Número de día (0, 1, 2…) de una fecha "AAAA-MM-DD". Sirve para rotar cosas cada día.
function numeroDeDia(texto) {
  const partes = texto.split("-");
  const milisegundos = Date.UTC(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  return Math.floor(milisegundos / 86400000);
}

// ---------- Racha ----------

function calcularRacha(sesiones, fechaHoy) {
  // Guardamos los días que tienen al menos una sesión
  const diasConSesion = new Set();
  for (const sesion of sesiones) {
    diasConSesion.add(sesion.fecha);
  }

  // Empezamos a contar desde hoy. Si hoy aún no hay sesión,
  // empezamos desde ayer (la racha sigue viva hasta que acabe el día).
  let dia = fechaHoy;
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

// ---------- Palabras del día ----------

const PALABRAS_POR_DIA = 3;

// Deja la palabra lista para comparar: sin espacios de más, en minúsculas y sin tildes.
// Así "Run", " run " y "rún" cuentan como la misma palabra.
function normalizarPalabra(texto) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

function palabrasDelDia(palabras, fecha) {
  return palabras.filter(function (palabra) {
    return palabra.fecha === fecha;
  });
}

// Devuelve un mensaje de error, o null si la palabra se puede añadir hoy.
function validarPalabra(texto, palabras, fechaHoy) {
  const normalizada = normalizarPalabra(texto);

  if (normalizada === "") {
    return "Escribe una palabra.";
  }
  if (normalizada.length > 40) {
    return "Es demasiado larga (máximo 40 letras).";
  }
  // Letras en inglés; se permiten apóstrofos, guiones y hasta 4 palabras (ej.: "give up")
  if (!/^[a-z]+(['-][a-z]+)*( [a-z]+(['-][a-z]+)*){0,3}$/.test(normalizada)) {
    return "Usa solo letras (se permiten ' y -).";
  }
  if (palabrasDelDia(palabras, fechaHoy).length >= PALABRAS_POR_DIA) {
    return "Ya añadiste tus " + PALABRAS_POR_DIA + " palabras de hoy. ¡Vuelve mañana!";
  }
  const repetida = palabras.some(function (palabra) {
    return normalizarPalabra(palabra.texto) === normalizada;
  });
  if (repetida) {
    return "Ya tienes esa palabra. Elige una nueva.";
  }
  return null;
}

// ---------- Tokens y consejos ----------

// Cada día en el que completas tus 3 palabras ganas 1 token.
function tokensGanados(palabras) {
  const porDia = {};
  for (const palabra of palabras) {
    porDia[palabra.fecha] = (porDia[palabra.fecha] || 0) + 1;
  }
  let tokens = 0;
  for (const fecha in porDia) {
    if (porDia[fecha] >= PALABRAS_POR_DIA) {
      tokens = tokens + 1;
    }
  }
  return tokens;
}

// Tokens ganados menos los que ya gastaste desbloqueando consejos.
function tokensDisponibles(palabras, consejosDesbloqueados) {
  return Math.max(0, tokensGanados(palabras) - consejosDesbloqueados);
}

const CONSEJOS = [
  "Estudia en bloques cortos de 25 minutos con 5 de descanso: rindes más que en una sola sesión larga.",
  "Repasa una palabra justo antes de olvidarla: al día siguiente, a los 3 días y a la semana.",
  "Usa tus palabras nuevas en una frase sobre tu propia vida; así se quedan mucho más tiempo.",
  "Mira el mismo video dos veces: la primera sin subtítulos y la segunda con subtítulos en inglés.",
  "Practica shadowing: pausa el video y repite la frase imitando el ritmo y la entonación.",
  "Estudia a la misma hora cada día. El hábito pesa más que la fuerza de voluntad.",
  "Deja el celular en otra habitación mientras estudias. 30 minutos sin distracciones valen por una hora.",
  "Antes de dormir, repasa en 5 minutos lo que aprendiste: el sueño ayuda a fijar la memoria.",
  "Cuéntale a alguien (o a ti mismo en voz alta) de qué trató el video. Explicar es la mejor prueba.",
  "Elige contenido que te guste aunque no lo entiendas todo: entender el 70 % ya es un buen nivel.",
  "Escribe tus dudas en el momento y búscalas al final, sin cortar el ritmo de la sesión.",
  "Cambia el idioma de tu celular o de un juego al inglés: sumas minutos de práctica sin darte cuenta.",
];

// ---------- Video o podcast en inglés ----------

// Revisa la URL y reconoce la plataforma. Devuelve null si no es una URL web válida.
// "inserción" es la dirección para mostrar el video dentro de la app, si la plataforma lo permite.
function analizarUrl(texto) {
  let url;
  try {
    url = new URL(texto.trim());
  } catch (error) {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return null;
  }

  const host = url.hostname.replace(/^(www\.|m\.)/, "");

  // YouTube: youtube.com/watch?v=ID, youtu.be/ID y youtube.com/shorts/ID
  if (host === "youtube.com" || host === "youtu.be" || host === "music.youtube.com") {
    let id = null;
    if (host === "youtu.be") {
      id = url.pathname.slice(1);
    } else if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/live/")) {
      id = url.pathname.split("/")[2];
    } else {
      id = url.searchParams.get("v");
    }
    const insercion = /^[\w-]{11}$/.test(id || "")
      ? "https://www.youtube-nocookie.com/embed/" + id
      : null;
    return { url: url.href, plataforma: "YouTube", insercion: insercion };
  }

  if (host === "vimeo.com") {
    const id = url.pathname.split("/")[1];
    const insercion = /^\d+$/.test(id || "") ? "https://player.vimeo.com/video/" + id : null;
    return { url: url.href, plataforma: "Vimeo", insercion: insercion };
  }

  // Spotify: episodios de podcast (open.spotify.com/episode/ID)
  if (host === "open.spotify.com") {
    const partes = url.pathname.split("/");
    const tipo = partes[1];
    const id = partes[2];
    const insercion =
      (tipo === "episode" || tipo === "show") && /^[A-Za-z0-9]+$/.test(id || "")
        ? "https://open.spotify.com/embed/" + tipo + "/" + id
        : null;
    return { url: url.href, plataforma: "Spotify", insercion: insercion };
  }

  const conocidas = {
    "podcasts.apple.com": "Apple Podcasts",
    "tiktok.com": "TikTok",
    "instagram.com": "Instagram",
    "facebook.com": "Facebook",
    "twitch.tv": "Twitch",
    "soundcloud.com": "SoundCloud",
    "ted.com": "TED",
    "netflix.com": "Netflix",
    "dailymotion.com": "Dailymotion",
  };
  const plataforma = conocidas[host] || host;
  return { url: url.href, plataforma: plataforma, insercion: null };
}

// La primera pregunta siempre pide un resumen; las demás rotan cada día.
const PREGUNTAS = [
  "In one or two sentences, what was the video about?",
  "What are three things you understood clearly?",
  "Was there a part you didn't understand? What do you think happened there?",
  "How did you feel while watching it? Why?",
  "Write a sentence or expression you heard and remember.",
  "Do you agree with the main idea? Why or why not?",
  "Who would you recommend this video to, and why?",
  "What did you learn that you didn't know before?",
  "If you could ask the speaker one question, what would it be?",
  "How did the speakers talk: fast or slow, formal or informal?",
];

const PREGUNTAS_POR_VIDEO = 5;

function preguntasDelDia(fecha) {
  const resto = PREGUNTAS.slice(1);
  const inicio = numeroDeDia(fecha) % resto.length;
  const elegidas = [PREGUNTAS[0]];
  for (let i = 0; i < PREGUNTAS_POR_VIDEO - 1; i++) {
    elegidas.push(resto[(inicio + i) % resto.length]);
  }
  return elegidas;
}

// Cada respuesta debe tener al menos 3 palabras. Devuelve el número de la
// primera respuesta que falla (empezando en 1), o 0 si todas están bien.
const PALABRAS_MINIMAS_RESPUESTA = 3;

function primeraRespuestaIncompleta(respuestas) {
  for (let i = 0; i < respuestas.length; i++) {
    const palabras = respuestas[i].trim().split(/\s+/).filter(Boolean);
    if (palabras.length < PALABRAS_MINIMAS_RESPUESTA) {
      return i + 1;
    }
  }
  return 0;
}

// ---------- Tareas diarias ----------

function estadoTareas(fecha, sesiones, palabras, videos) {
  return {
    sesion: sesiones.some(function (s) {
      return s.fecha === fecha;
    }),
    palabras: palabrasDelDia(palabras, fecha).length >= PALABRAS_POR_DIA,
    video: videos.some(function (v) {
      return v.fecha === fecha;
    }),
  };
}

// Para las pruebas con Node (en el navegador "module" no existe)
if (typeof module !== "undefined") {
  module.exports = {
    fechaATexto,
    textoAFecha,
    diaAnterior,
    numeroDeDia,
    calcularRacha,
    PALABRAS_POR_DIA,
    normalizarPalabra,
    palabrasDelDia,
    validarPalabra,
    tokensGanados,
    tokensDisponibles,
    CONSEJOS,
    analizarUrl,
    PREGUNTAS,
    PREGUNTAS_POR_VIDEO,
    preguntasDelDia,
    primeraRespuestaIncompleta,
    estadoTareas,
  };
}
