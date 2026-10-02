// La lógica (fechas, racha, palabras, tokens, preguntas) está en logica.js.
// Aquí solo leemos la página, guardamos los datos y pintamos.

// Nombres con los que guardamos los datos en localStorage
const CLAVE_GUARDADO = "diario-estudio-sesiones";
const CLAVE_PALABRAS = "diario-estudio-palabras";
const CLAVE_VIDEOS = "diario-estudio-videos";
const CLAVE_CONSEJOS = "diario-estudio-consejos";

// Elementos de la página que vamos a usar
const formulario = document.getElementById("formulario");
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");
const rachaDias = document.getElementById("racha-dias");
const rachaTexto = document.getElementById("racha-texto");
const listaSesiones = document.getElementById("lista-sesiones");
const sinSesiones = document.getElementById("sin-sesiones");

const tareasProgreso = document.getElementById("tareas-progreso");
const tareaSesion = document.getElementById("tarea-sesion");
const tareaPalabras = document.getElementById("tarea-palabras");
const tareaVideo = document.getElementById("tarea-video");

const formularioPalabra = document.getElementById("formulario-palabra");
const campoPalabra = document.getElementById("palabra");
const campoSignificado = document.getElementById("significado");
const errorPalabra = document.getElementById("error-palabra");
const botonPalabra = document.getElementById("boton-palabra");
const palabrasProgreso = document.getElementById("palabras-progreso");
const listaPalabras = document.getElementById("lista-palabras");
const totalPalabras = document.getElementById("total-palabras");

const formularioUrl = document.getElementById("formulario-url");
const campoUrl = document.getElementById("url");
const errorUrl = document.getElementById("error-url");
const videoActual = document.getElementById("video-actual");
const videoPlataforma = document.getElementById("video-plataforma");
const videoEnlace = document.getElementById("video-enlace");
const videoReproductor = document.getElementById("video-reproductor");
const formularioPreguntas = document.getElementById("formulario-preguntas");
const contenedorPreguntas = document.getElementById("preguntas");
const campoComprension = document.getElementById("comprension");
const comprensionValor = document.getElementById("comprension-valor");
const errorRespuestas = document.getElementById("error-respuestas");
const listaVideos = document.getElementById("lista-videos");

const textoTokens = document.getElementById("tokens");
const botonConsejo = document.getElementById("boton-consejo");
const listaConsejos = document.getElementById("lista-consejos");

// Cada sesión es: { id, fecha: "AAAA-MM-DD", tema, minutos }
let sesiones = cargar(CLAVE_GUARDADO, []);
// Cada palabra es: { id, fecha, texto, significado }
let palabras = cargar(CLAVE_PALABRAS, []);
// Cada video es: { id, fecha, url, plataforma, preguntas, respuestas, comprension }
let videos = cargar(CLAVE_VIDEOS, []);
// Cuántos consejos llevas desbloqueados (se desbloquean en orden)
let consejosDesbloqueados = cargar(CLAVE_CONSEJOS, 0);

// Video cargado que todavía no tiene respuestas guardadas
let videoPendiente = null;

// ---------- Guardar y cargar ----------

function cargar(clave, valorInicial) {
  const guardado = localStorage.getItem(clave);
  if (!guardado) {
    return valorInicial;
  }
  try {
    return JSON.parse(guardado);
  } catch (error) {
    return valorInicial;
  }
}

function guardar(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor));
}

// Muestra u oculta un mensaje de error
function mostrarError(elemento, mensaje) {
  elemento.textContent = mensaje || "";
  elemento.hidden = !mensaje;
}

function fechaLegible(texto) {
  return textoAFecha(texto).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------- Pintar en pantalla ----------

function mostrarRacha() {
  const racha = calcularRacha(sesiones, hoy());
  rachaDias.textContent = racha;
  rachaTexto.textContent = racha === 1 ? "día seguido" : "días seguidos";
}

function mostrarTareas() {
  const estado = estadoTareas(hoy(), sesiones, palabras, videos);
  tareaSesion.classList.toggle("hecha", estado.sesion);
  tareaPalabras.classList.toggle("hecha", estado.palabras);
  tareaVideo.classList.toggle("hecha", estado.video);

  const hechas = [estado.sesion, estado.palabras, estado.video].filter(Boolean).length;
  tareasProgreso.textContent = hechas + "/3";
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
    fecha.textContent = fechaLegible(sesion.fecha);

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

function mostrarPalabras() {
  const deHoy = palabrasDelDia(palabras, hoy());
  palabrasProgreso.textContent = deHoy.length + "/" + PALABRAS_POR_DIA;

  // Cuando ya tienes las 3 de hoy, bloqueamos el formulario hasta mañana
  const completo = deHoy.length >= PALABRAS_POR_DIA;
  campoPalabra.disabled = completo;
  campoSignificado.disabled = completo;
  botonPalabra.disabled = completo;
  botonPalabra.textContent = completo ? "¡Listo por hoy!" : "Añadir palabra";

  listaPalabras.innerHTML = "";
  for (const palabra of deHoy) {
    const elemento = document.createElement("li");
    elemento.className = "sesion";

    const texto = document.createElement("div");
    texto.className = "sesion-tema";
    texto.textContent = palabra.texto;

    const significado = document.createElement("div");
    significado.className = "sesion-fecha";
    significado.textContent = palabra.significado;

    elemento.appendChild(texto);
    elemento.appendChild(significado);
    listaPalabras.appendChild(elemento);
  }

  totalPalabras.textContent = "Tu vocabulario: " + palabras.length +
    (palabras.length === 1 ? " palabra." : " palabras.");
}

function mostrarConsejos() {
  const disponibles = tokensDisponibles(palabras, consejosDesbloqueados);
  const quedan = consejosDesbloqueados < CONSEJOS.length;
  textoTokens.textContent = disponibles;
  botonConsejo.disabled = disponibles === 0 || !quedan;
  botonConsejo.textContent = quedan
    ? "Desbloquear consejo (1 🔑)"
    : "Ya desbloqueaste todos los consejos";

  listaConsejos.innerHTML = "";
  for (const consejo of CONSEJOS.slice(0, consejosDesbloqueados)) {
    const elemento = document.createElement("li");
    elemento.textContent = consejo;
    listaConsejos.appendChild(elemento);
  }
}

function mostrarVideos() {
  listaVideos.innerHTML = "";

  const ordenados = [...videos].sort(function (a, b) {
    return b.id - a.id;
  });

  for (const video of ordenados) {
    const elemento = document.createElement("li");
    elemento.className = "video";

    const cabecera = document.createElement("div");
    cabecera.className = "sesion";

    const info = document.createElement("div");
    const enlace = document.createElement("a");
    enlace.className = "sesion-tema";
    enlace.href = video.url;
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
    enlace.textContent = video.plataforma;
    const fecha = document.createElement("div");
    fecha.className = "sesion-fecha";
    fecha.textContent = fechaLegible(video.fecha);
    info.appendChild(enlace);
    info.appendChild(fecha);

    const comprension = document.createElement("div");
    comprension.className = "sesion-minutos";
    comprension.textContent = video.comprension + " %";

    cabecera.appendChild(info);
    cabecera.appendChild(comprension);

    // Respuestas plegadas para no llenar la pantalla
    const detalle = document.createElement("details");
    const resumen = document.createElement("summary");
    resumen.textContent = "Ver respuestas";
    detalle.appendChild(resumen);
    for (let i = 0; i < video.preguntas.length; i++) {
      const pregunta = document.createElement("p");
      pregunta.className = "pregunta";
      pregunta.textContent = video.preguntas[i];
      const respuesta = document.createElement("p");
      respuesta.className = "respuesta";
      respuesta.textContent = video.respuestas[i];
      detalle.appendChild(pregunta);
      detalle.appendChild(respuesta);
    }

    elemento.appendChild(cabecera);
    elemento.appendChild(detalle);
    listaVideos.appendChild(elemento);
  }
}

function actualizarPantalla() {
  mostrarRacha();
  mostrarTareas();
  mostrarPalabras();
  mostrarConsejos();
  mostrarVideos();
  mostrarSesiones();
}

// ---------- Formulario de sesiones ----------

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

  guardar(CLAVE_GUARDADO, sesiones);
  actualizarPantalla();

  // Limpiamos tema y minutos, pero dejamos la fecha por si apuntas varias del mismo día
  campoTema.value = "";
  campoMinutos.value = "";
  campoTema.focus();
});

// ---------- Formulario de palabras ----------

formularioPalabra.addEventListener("submit", function (evento) {
  evento.preventDefault();

  // Las palabras siempre cuentan para hoy: no se pueden añadir a días pasados
  const error = validarPalabra(campoPalabra.value, palabras, hoy());
  mostrarError(errorPalabra, error);
  if (error) {
    return;
  }

  palabras.push({
    id: Date.now(),
    fecha: hoy(),
    texto: campoPalabra.value.trim().replace(/\s+/g, " "),
    significado: campoSignificado.value.trim(),
  });

  guardar(CLAVE_PALABRAS, palabras);
  actualizarPantalla();

  campoPalabra.value = "";
  campoSignificado.value = "";
  if (!campoPalabra.disabled) {
    campoPalabra.focus();
  }
});

// Al escribir de nuevo, quitamos el error anterior
campoPalabra.addEventListener("input", function () {
  mostrarError(errorPalabra, null);
});

// ---------- Consejos ----------

botonConsejo.addEventListener("click", function () {
  if (tokensDisponibles(palabras, consejosDesbloqueados) === 0) {
    return;
  }
  if (consejosDesbloqueados >= CONSEJOS.length) {
    return;
  }
  consejosDesbloqueados = consejosDesbloqueados + 1;
  guardar(CLAVE_CONSEJOS, consejosDesbloqueados);
  actualizarPantalla();
});

// ---------- Video o podcast ----------

formularioUrl.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const analizado = analizarUrl(campoUrl.value);
  if (!analizado) {
    mostrarError(errorUrl, "Ese enlace no es válido. Debe empezar por https://");
    return;
  }
  mostrarError(errorUrl, null);

  videoPendiente = {
    url: analizado.url,
    plataforma: analizado.plataforma,
    preguntas: preguntasDelDia(hoy()),
  };

  videoPlataforma.textContent = analizado.plataforma;
  videoEnlace.href = analizado.url;

  // Si la plataforma lo permite, mostramos el video dentro de la app
  videoReproductor.innerHTML = "";
  if (analizado.insercion) {
    const marco = document.createElement("iframe");
    marco.src = analizado.insercion;
    marco.title = "Reproductor de " + analizado.plataforma;
    marco.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
    marco.allowFullscreen = true;
    marco.loading = "lazy";
    if (analizado.plataforma === "Spotify") {
      marco.className = "audio";
    }
    videoReproductor.appendChild(marco);
  }
  videoReproductor.hidden = !analizado.insercion;

  // Una caja de respuesta por pregunta
  contenedorPreguntas.innerHTML = "";
  videoPendiente.preguntas.forEach(function (pregunta, i) {
    const etiqueta = document.createElement("label");
    etiqueta.htmlFor = "respuesta-" + i;
    etiqueta.textContent = (i + 1) + ". " + pregunta;

    const caja = document.createElement("textarea");
    caja.id = "respuesta-" + i;
    caja.rows = 2;
    caja.lang = "en";
    caja.required = true;

    contenedorPreguntas.appendChild(etiqueta);
    contenedorPreguntas.appendChild(caja);
  });

  campoComprension.value = 50;
  comprensionValor.textContent = "50 %";
  mostrarError(errorRespuestas, null);
  videoActual.hidden = false;
});

campoComprension.addEventListener("input", function () {
  comprensionValor.textContent = campoComprension.value + " %";
});

formularioPreguntas.addEventListener("submit", function (evento) {
  evento.preventDefault();
  if (!videoPendiente) {
    return;
  }

  const respuestas = videoPendiente.preguntas.map(function (_, i) {
    return document.getElementById("respuesta-" + i).value.trim();
  });

  const incompleta = primeraRespuestaIncompleta(respuestas);
  if (incompleta) {
    mostrarError(errorRespuestas, "La respuesta " + incompleta +
      " necesita al menos 3 palabras. Try to answer in English!");
    document.getElementById("respuesta-" + (incompleta - 1)).focus();
    return;
  }

  videos.push({
    id: Date.now(),
    fecha: hoy(),
    url: videoPendiente.url,
    plataforma: videoPendiente.plataforma,
    preguntas: videoPendiente.preguntas,
    respuestas: respuestas,
    comprension: Number(campoComprension.value),
  });
  guardar(CLAVE_VIDEOS, videos);

  // Limpiamos para el próximo video
  videoPendiente = null;
  videoActual.hidden = true;
  videoReproductor.innerHTML = "";
  campoUrl.value = "";
  actualizarPantalla();
});

// ---------- Inicio ----------

campoFecha.value = hoy();
actualizarPantalla();
