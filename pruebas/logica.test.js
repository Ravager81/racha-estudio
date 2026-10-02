// Pruebas de logica.js. Se ejecutan con: node --test
const { test } = require("node:test");
const assert = require("node:assert/strict");
const logica = require("../logica.js");

const HOY = "2026-10-01";
const AYER = "2026-09-30";

function palabra(texto, fecha) {
  return { id: Math.random(), fecha: fecha, texto: texto, significado: "" };
}

// ---------- Racha ----------

test("la racha sigue viva si hoy todavía no hay sesión", function () {
  const sesiones = [{ fecha: AYER }, { fecha: "2026-09-29" }];
  assert.equal(logica.calcularRacha(sesiones, HOY), 2);
});

test("la racha se corta si falta un día", function () {
  const sesiones = [{ fecha: HOY }, { fecha: "2026-09-29" }];
  assert.equal(logica.calcularRacha(sesiones, HOY), 1);
});

test("la racha cruza el cambio de mes", function () {
  const sesiones = [{ fecha: "2026-10-01" }, { fecha: "2026-09-30" }, { fecha: "2026-09-29" }];
  assert.equal(logica.calcularRacha(sesiones, HOY), 3);
});

// ---------- Palabras ----------

test("normaliza mayúsculas, espacios y tildes", function () {
  assert.equal(logica.normalizarPalabra("  Café   Latte "), "cafe latte");
});

test("acepta una palabra nueva", function () {
  assert.equal(logica.validarPalabra("meaningful", [], HOY), null);
});

test("acepta phrasal verbs y palabras con apóstrofo o guion", function () {
  assert.equal(logica.validarPalabra("give up", [], HOY), null);
  assert.equal(logica.validarPalabra("o'clock", [], HOY), null);
  assert.equal(logica.validarPalabra("well-known", [], HOY), null);
});

test("rechaza vacíos, números y símbolos", function () {
  assert.match(logica.validarPalabra("   ", [], HOY), /Escribe/);
  assert.match(logica.validarPalabra("abc123", [], HOY), /letras/);
  assert.match(logica.validarPalabra("hello!", [], HOY), /letras/);
});

test("no permite repetir una palabra, aunque cambien mayúsculas o tildes", function () {
  const palabras = [palabra("Run", "2026-01-15")];
  assert.match(logica.validarPalabra("run", palabras, HOY), /Ya tienes/);
  assert.match(logica.validarPalabra("  RUN ", palabras, HOY), /Ya tienes/);
  assert.match(logica.validarPalabra("rún", palabras, HOY), /Ya tienes/);
});

test("no permite más de 3 palabras el mismo día", function () {
  const palabras = [palabra("one", HOY), palabra("two", HOY), palabra("three", HOY)];
  assert.match(logica.validarPalabra("four", palabras, HOY), /Vuelve mañana/);
  // Las de días anteriores no cuentan para el límite de hoy
  assert.equal(logica.validarPalabra("four", palabras, "2026-10-02"), null);
});

// ---------- Tokens ----------

test("se gana 1 token solo los días con 3 palabras", function () {
  const palabras = [
    palabra("one", AYER), palabra("two", AYER), palabra("three", AYER),
    palabra("four", HOY), palabra("five", HOY),
  ];
  assert.equal(logica.tokensGanados(palabras), 1);
  palabras.push(palabra("six", HOY));
  assert.equal(logica.tokensGanados(palabras), 2);
});

test("los consejos desbloqueados gastan tokens y nunca quedan negativos", function () {
  const palabras = [palabra("one", HOY), palabra("two", HOY), palabra("three", HOY)];
  assert.equal(logica.tokensDisponibles(palabras, 0), 1);
  assert.equal(logica.tokensDisponibles(palabras, 1), 0);
  assert.equal(logica.tokensDisponibles(palabras, 5), 0);
});

// ---------- URL ----------

test("reconoce YouTube en sus distintos formatos", function () {
  const insercion = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";
  for (const url of [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=30s",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ",
  ]) {
    const resultado = logica.analizarUrl(url);
    assert.equal(resultado.plataforma, "YouTube", url);
    assert.equal(resultado.insercion, insercion, url);
  }
});

test("reconoce Vimeo y episodios de Spotify", function () {
  assert.equal(
    logica.analizarUrl("https://vimeo.com/76979871").insercion,
    "https://player.vimeo.com/video/76979871"
  );
  assert.equal(
    logica.analizarUrl("https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk").insercion,
    "https://open.spotify.com/embed/episode/4rOoJ6Egrf8K2IrywzwOMk"
  );
});

test("otras plataformas se guardan como enlace, sin reproductor", function () {
  const resultado = logica.analizarUrl("https://www.tiktok.com/@alguien/video/123");
  assert.equal(resultado.plataforma, "TikTok");
  assert.equal(resultado.insercion, null);
});

test("rechaza textos que no son enlaces web", function () {
  assert.equal(logica.analizarUrl("hola"), null);
  assert.equal(logica.analizarUrl("javascript:alert(1)"), null);
  assert.equal(logica.analizarUrl("ftp://ejemplo.com/video"), null);
});

test("un ID de YouTube con formato raro no se inserta", function () {
  const resultado = logica.analizarUrl("https://www.youtube.com/watch?v=<script>");
  assert.equal(resultado.plataforma, "YouTube");
  assert.equal(resultado.insercion, null);
});

// ---------- Preguntas ----------

test("cada día hay 5 preguntas en inglés, sin repetir y empezando por el resumen", function () {
  const preguntas = logica.preguntasDelDia(HOY);
  assert.equal(preguntas.length, logica.PREGUNTAS_POR_VIDEO);
  assert.equal(preguntas[0], logica.PREGUNTAS[0]);
  assert.equal(new Set(preguntas).size, preguntas.length);
});

test("las preguntas son las mismas todo el día y cambian al día siguiente", function () {
  assert.deepEqual(logica.preguntasDelDia(HOY), logica.preguntasDelDia(HOY));
  assert.notDeepEqual(logica.preguntasDelDia(HOY), logica.preguntasDelDia("2026-10-02"));
});

test("cada respuesta necesita al menos 3 palabras", function () {
  assert.equal(logica.primeraRespuestaIncompleta(["I liked it a lot", "It was about cooking"]), 0);
  assert.equal(logica.primeraRespuestaIncompleta(["I liked it", "  yes  "]), 2);
});

// ---------- Tareas ----------

test("el estado de las tareas solo mira el día indicado", function () {
  const sesiones = [{ fecha: HOY }];
  const palabras = [palabra("one", HOY), palabra("two", HOY), palabra("three", AYER)];
  const videos = [{ fecha: AYER }];
  assert.deepEqual(logica.estadoTareas(HOY, sesiones, palabras, videos), {
    sesion: true,
    palabras: false,
    video: false,
  });
});
