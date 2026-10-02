# Diario de Estudio

App web para registrar sesiones de estudio, mantener una racha diaria y cumplir tres tareas cada día:

1. **Registrar una sesión** de estudio (fecha, tema y minutos).
2. **Añadir 3 palabras nuevas en inglés.** Nunca se repite una palabra (no distingue mayúsculas ni tildes) y no se pueden añadir más de 3 por día.
3. **Ver un video o podcast en inglés** y responder 5 preguntas en inglés sobre él, además de indicar cuánto entendiste. YouTube, Vimeo y Spotify se reproducen dentro de la app; el resto de plataformas se guardan como enlace.

Cada día que completas tus 3 palabras ganas **1 token 🔑** para desbloquear un consejo que te ayuda a aprovechar mejor tu tiempo de estudio.

Todo se guarda en el navegador (`localStorage`): no necesita servidor ni cuenta.

## Uso

Abre `index.html` en el navegador. Si el reproductor de YouTube no carga al abrir el archivo directamente, sirve la carpeta con cualquier servidor local (por ejemplo, la extensión Live Server de VS Code).

## Pruebas

La lógica está en `logica.js` y se prueba con Node (versión 18 o superior), sin instalar nada:

```bash
node --test
```
