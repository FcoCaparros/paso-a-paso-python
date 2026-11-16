# Ruta de estudio · Programación avanzada

Preparación sugerida: 16–25 de noviembre de 2026. Examen indicado: jueves 26.
No hay un temario especial confirmado: contrasta esta ruta con los anuncios del curso.
Los ejercicios son originales, no soluciones oficiales ni una predicción del examen.

## Cómo aprender con cada set

1. Lee la idea y traza el ejemplo a mano: anota variables, tipos y salida.
2. Resuelve el primer ejercicio guiado. Predice la salida antes de ejecutar.
3. Sigue con los ejercicios de construir. A los 10 minutos de bloqueo, abre una pista.
4. Si ves la solución, ciérrala y reconstruye después sin copiar. Explica cada línea.
5. Anota un error y su causa. Al día siguiente repite un ejercicio parecido sin ayudas.

Una sesión orientativa: 10 min recordar + 20 min explicación + 45 min practicar,
pausa de 10 min y 30–45 min reconstruir. Ajusta el tiempo a tu disponibilidad.
La barra prueba salidas, no inspecciona si usaste la clase, el generador o el diseño
solicitado. Comprueba tú ese requisito y explica por qué lo elegiste.

## Calendario adaptable

| Día | Tema | Antes de avanzar, deberías poder… |
|---|---|---|
| Lun 16 | Bases y S01 | Diferenciar return/print, clase/objeto, copia/alias; leer con with. |
| Mar 17 | S02–03 | Importar, explicar rutas y elegir lista, set, dict, pila o cola. |
| Mié 18 | S04 | Seguir self y super; usar property; explicar polimorfismo y MRO. |
| Jue 19 | S05 | Capturar errores concretos; crear y consumir un iterador; recorrer nodos. |
| Vie 20 | S08 | Combinar filter/map/reduce, consumir generadores y agrupar correctamente. |
| Sáb 21 | S09 | Trazar una carrera, proteger una operación y terminar hilos. |
| Dom 22 | S10–11 | Serializar, validar HTTP y reconstruir mensajes por bytes. |
| Lun 23 | S13–14 | Conectar callbacks, separar backend y vista, mantener la GUI responsiva. |
| Mar 24 | S15 | Elegir regex, BFS/DFS, máscaras y ejes; filtrar/agrupar tablas. |
| Mié 25 | Repaso | Resolver 45 min sin pistas, corregir y explicar tus fallos. |

Semanas 6 y 12: evaluaciones; 7: receso; 16: cierre; 17: examen en el calendario.
Si un día no puedes estudiar, usa el siguiente para la base pendiente antes de
avanzar a su dependencia. Reduce ejercicios repetidos que ya puedas reconstruir;
no saltes una base que todavía no entiendes. La S15 tiene varios sets: puedes
adelantar uno por día desde el fin de semana si te faltan todos.

## Laboratorios reales: fuera del navegador

Descarga laboratorios.py junto a esta guía. Abre una terminal en esa carpeta.
Los ejemplos están completos para poder explorarlos primero. Después realiza
los cambios propuestos y explica qué función recibe qué datos y qué devuelve.
No pegues estos laboratorios en el editor web: PyQt y sockets/hilos del sistema
requieren Python de escritorio. Los ejercicios web de estas materias son modelos
deterministas de su lógica, no equivalentes a probar una GUI o una red real.

### 1. Hilos, Lock y Event (S09)

Ejecuta `python laboratorios.py hilos`. Debe imprimir `Contador: 2000`.

- Identifica target, start, wait, set, join y la sección crítica.
- Cambia a tres hilos y 500 incrementos; actualiza la comprobación: debe dar 1500.
- Dibuja un orden que perdería una actualización sin Lock. Que una ejecución
  sin candado “salga bien” no demuestra ausencia de carreras.
- Desafío: un productor entrega números 1–5 mediante queue.Queue y un consumidor
  suma hasta recibir un centinela None. Esperado: 15 y ambos hilos terminados.

### 2. TCP y protocolo (S11)

Ejecuta `python laboratorios.py red`. Debe imprimir
`Respuesta: HOLA, PROGRAMACIÓN`. Usa solo 127.0.0.1 y un puerto libre.

- Sigue los dos sockets del servidor: el que escucha y el que devuelve accept.
- Explica por qué recibir_exacto tiene un ciclo y qué significa un recv vacío.
- Cambia el texto a `á🐍`. Debe regresar `Á🐍`; el largo cuenta bytes, no caracteres.
- Desafío: procesa tres mensajes en la misma conexión; ajusta tanto cliente como
  servidor y conserva el encabezado por mensaje. Espera tres respuestas.
- Prueba un emisor que envíe encabezado y cuerpo en fragmentos. No supongas que
  la red conservará los límites de cada sendall.

### 3. HTTP real (S10)

Si no están instaladas las bibliotecas: `python -m pip install flask requests`.
En una terminal ejecuta `python laboratorios.py api` y déjala abierta.
En otra ejecuta `python laboratorios.py cliente-api`.

Debe mostrar 200 con resultado 6, 400 con un error y 200 con resultado 0.
Para detener el servidor local, Ctrl+C en su terminal.

- Explica URL, método, cuerpo, código de respuesta y diferencia entre json y params.
- Desafío: agrega `/triple`, valida igual y responde 3 veces el valor.
- Prueba valor ausente, texto, booleano y cero. Solo enteros deben aceptarse.
- Usa timeout en el cliente y captura requests.RequestException para explicar
  una conexión fallida sin confundirla con una respuesta HTTP 400.

### 4. Ventana real, timer y QThread (S13–14)

Si falta la biblioteca: `python -m pip install PyQt6`.
Ejecuta `python laboratorios.py gui`.

- La ventana cuenta segundos. Pausar/reanudar conserva el número.
- Iniciar trabajo muestra pasos 1 a 10; el reloj y los botones deben seguir
  respondiendo. El worker no toca widgets: emite una señal.
- Cierra durante el trabajo: debe pedir interrupción y cerrar al terminar,
  sin destruir un QThread que todavía corre ni bloquear la ventana con wait.
- Desafío: añade un botón Reiniciar que ponga el reloj en cero y lo pause.
- Desafío: añade un botón Detener trabajo con requestInterruption. Comprueba
  que se puede volver a iniciar después de finished.

## Guardado individual

Cada navegador guarda sus códigos y ejercicios resueltos en este sitio. Tus
amigos pueden usar el mismo enlace sin mezclar avances si usan sus propios
navegadores. No hay cuentas ni sincronización automática. En un computador
compartido, usen perfiles de navegador diferentes. Descarga tu avance antes de
borrar datos o cambiar de dispositivo y cárgalo en el destino.

Los identificadores de los 26 ejercicios originales se conservan. Los respaldos
anteriores de semana 15 siguen siendo compatibles. Los nuevos ejercicios tienen
sus propios identificadores. La descarga guarda tu código actual, no un historial
de todas las versiones de cada intento.
