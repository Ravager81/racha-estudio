# Diario de Estudio

App web para registrar sesiones de estudio, mantener una racha diaria y cumplir tareas diarias de inglés (palabras del día, video o podcast con preguntas, consejos que se desbloquean con tokens).

## Tecnología

- HTML, CSS y JavaScript puros. Sin frameworks, librerías ni paso de compilación.
- Datos guardados solo en el navegador (`localStorage`). No hay backend; no añadir uno sin preguntar.

## Estructura

- `index.html`: la página. Carga `logica.js` y después `app.js`.
- `logica.js`: lógica pura, sin DOM (fechas, racha, palabras, tokens, URL y preguntas). Exporta sus funciones con `module.exports` para las pruebas.
- `app.js`: lee la página, guarda en `localStorage` y pinta.
- `styles.css`: estilos.
- `pruebas/logica.test.js`: pruebas de `logica.js`.

## Pruebas

```bash
node --test
```

Toda lógica nueva va en `logica.js` y lleva su prueba.

## Convenciones

- Nombres y comentarios en español; el contenido para practicar (preguntas) va en inglés.
- Fechas siempre en hora local como texto `"AAAA-MM-DD"`, nunca en UTC (usar `fechaATexto`, `textoAFecha` y `hoy`).
- Mostrar datos del usuario con `textContent`, nunca con `innerHTML`.
- Las claves de `localStorage` empiezan por `diario-estudio-`. No renombrarlas: se perderían los datos guardados.

## Estilo visual

Tarjetas redondeadas, espaciado generoso y tipografía tranquila. Reutilizar las clases existentes (`.tarjeta`, `.nota`, `.lista`…) antes de crear otras nuevas.

## Despliegue

Netlify. Después de cualquier cambio visible hay que redesplegar.

## Forma de trabajar

- Pasos pequeños.
- Preguntar antes de cualquier cambio estructural grande (mover o dividir archivos, cambiar cómo se guardan los datos, añadir dependencias o un servidor).
