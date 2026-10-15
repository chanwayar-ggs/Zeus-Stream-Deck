# ⚡ Zeus Stream Deck

<p align="center">
  <strong>Convierte tu teléfono móvil o tablet en un Stream Deck profesional para OBS Studio.</strong><br>
  100% Gratuito • Código Abierto • Sin suscripciones • Sin hardware costoso
</p>

<p align="center">
  <a href="https://github.com/TU_USUARIO/zeus-stream-deck/releases/latest">
    <img src="https://img.shields.io/github/v/release/TU_USUARIO/zeus-stream-deck?color=f59e0b&label=Última%20Versión&style=for-the-badge" alt="Última Versión">
  </a>
  <img src="https://img.shields.io/badge/Windows-10%20%7C%2011-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Windows Compatible">
  <img src="https://img.shields.io/badge/Android-8.0%2B-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android Compatible">
  <img src="https://img.shields.io/badge/OBS%20Studio-v28%2B-white?style=for-the-badge&logo=obsstudio&logoColor=black" alt="OBS Compatible">
</p>

---

## 📥 Descarga e Instalación

No necesitas compilar nada ni usar la terminal. Solo descarga los dos instaladores oficiales desde la sección de **[Releases (Lanzamientos)](../../releases/latest)**:

| Plataforma | Archivo a Descargar | Descripción |
| :--- | :--- | :--- |
| 🖥️ **Para tu PC (Windows)** | **`ZeusStreamDeck-Setup.exe`** | Servidor host en segundo plano. Configura el Firewall de forma 100% automática durante la instalación. |
| 📱 **Para tu Teléfono (Android)** | **`ZeusStreamDeck.apk`** | App móvil táctil con escáner QR de conexión rápida y botonera personalizada. |

---

## 🚀 Inicio en 3 Pasos (Sin tocar código)

### Paso 1: Instala la aplicación en tu PC
1. Descarga y ejecuta **`ZeusStreamDeck-Setup.exe`**.
2. Si Windows solicita permisos de Administrador, haz clic en **Sí** *(esto permite que el instalador autorice la conexión local de tu teléfono en el Firewall sin que debas configurar nada a mano)*.
3. Abre **Zeus Stream Deck** en tu PC. Verás una ventana limpia mostrando un **Código QR grande** y el estado de tu OBS.

### Paso 2: Instala la aplicación en tu Teléfono
1. Pasa el archivo **`ZeusStreamDeck.apk`** a tu móvil Android e instálalo.
2. Abre la app **Zeus Stream Deck** en tu teléfono y presiona el botón **"Escanear Código QR de la PC"**.
3. Apunta la cámara de tu celular a la pantalla de tu PC. **¡Se conectarán al instante!**

### Paso 3: Configura tus Teclas a tu Gusto
* La pantalla en tu teléfono comenzará limpia.
* Toca el botón flotante **`(+)`** para añadir las teclas que necesites:
  * 🎬 **Cambiar Escenas de OBS** (Inicio, Gameplay, Charla, Pausa).
  * 🎙️ **Silenciar o Activar Pistas de Audio** (Micrófono, Spotify, Discord, Juego).
  * 🚨 **Botón de Pánico Anti-Copyright** (Silencia al instante toda la música para evitar strikes y silenciamientos de VOD).
  * 🔴 **Iniciar / Detener Transmisión en Vivo y Grabación**.
  * ⌨️ **Atajos de Teclado y Macros de PC** (F13 a F24 para macros de Discord o juegos).

---

## ⚙️ Configuración en OBS Studio (Solo la primera vez)

Zeus se conecta directamente con el motor nativo de OBS Studio:

1. Abre **OBS Studio** en tu PC.
2. En el menú superior, ve a **Herramientas > Configuración del servidor WebSocket**.
3. Asegúrate de que esté marcada la casilla **"Habilitar el servidor WebSocket"** (puerto por defecto: `4455`).
4. Haz clic en **Aceptar**.

> **Nota:** Tu PC y tu teléfono móvil deben estar conectados a la **misma red Wi-Fi**.

---

## ✨ Características Principales

* 🔒 **Cero Configuración de Red:** El instalador abre el puerto necesario en Windows automáticamente; el código QR empareja ambos dispositivos en un segundo sin tener que escribir números de IP.
* ⚡ **Latencia Ultra Baja:** Comunicación directa por red local (< 5 ms). Cada toque en el móvil reacciona de forma instantánea en OBS Studio.
* 🎛️ **Botonera Dinámica y Modular:** Crea solo las teclas que uses, personalizando iconos, colores y tamaños.
* 🛡️ **Protección de Copyright para Streamers:** Silencia reproductores multimedia (Spotify, navegadores) con un solo toque de emergencia antes de que caiga un reclamo.
* 🔋 **Segundo Plano en PC:** Zeus se minimiza silenciosamente a la bandeja del sistema (System Tray junto al reloj de Windows), permitiéndote jugar a pantalla completa.

---

## ☕ Apoyo a la Comunidad

Zeus Stream Deck es un proyecto libre bajo licencia **MIT**, desarrollado para que los creadores de contenido no tengan que pagar precios desorbitados por hardware de streaming. 

Si te ha sido de utilidad, puedes apoyar el desarrollo invitándonos un café en **[Ko-fi](https://ko-fi.com/zeusstreamdeck)** o dejando una ⭐ en el repositorio.
