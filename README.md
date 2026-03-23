# 🎵 MelodIA

> **MelodIA** convierte tus emociones en canciones originales. Sube una imagen o escribe cómo te sientes, la IA analiza tu estado de ánimo, compone una melodía única, genera la letra y la canta con voz sintetizada, mostrando la partitura animada en tiempo real.

---

## 🌐 Demo en vivo

🔗 [Ver demo desplegada](#) *(enlace disponible próximamente)*

---

## 📸 Capturas del proyecto

![MelodIA - Diseño principal](./screenshot.png)

> Vista principal con fondo estrellado, selector de avatar, panel de entrada de emociones, panel de canción generada con reproductor, historial y footer con los desarrolladores.

---

## ✨ ¿Qué hace MelodIA?

1. 📸 **Sube una imagen o escribe cómo te sientes**
2. 🧠 **La IA analiza tu estado de ánimo** (mood)
3. ✍️ **Genera una letra original** acorde a la emoción detectada
4. 🎵 **Compone la melodía** y la canta con voz sintetizada por IA
5. 🎼 **Muestra la partitura animada** sincronizada con la música
6. 💾 **Exporta** el audio (.mp3), la partitura (.pdf) y la letra (.txt)

---

## 🛠️ Tecnologías utilizadas

### Frontend
| Tecnología | Uso |
|---|---|
| **Angular** | Framework principal de la aplicación |
| **Tailwind CSS** | Estilos y diseño de la interfaz |
| **Tone.js** | Síntesis y reproducción de audio en el navegador |
| **VexFlow** | Renderizado de partitura musical animada |

### Inteligencia Artificial
| Servicio | Uso |
|---|---|
| **[API in One](https://apiin.one/es)** | Puerta de enlace unificada de IA (50+ modelos) |
| **Suno** (vía API in One) | Generación de melodías y música original |
| **ElevenLabs** (vía API in One) | Voz cantada sintetizada por IA |
| **Gemini** (vía API in One) | Análisis de mood e imagen + generación de letra |

> API in One permite acceder a todos los modelos de IA con una sola clave API y un único saldo de créditos, simplificando enormemente la integración.

### Infraestructura — CubePath

MelodIA está completamente desplegada en **[CubePath](https://midu.link/cubepath)**, utilizando tres servicios principales:

#### ⚙️ N8N — Orquestador de la pipeline IA

N8N es el cerebro de toda la automatización de MelodIA. Desplegado con un solo clic desde CubePath, gestiona el flujo completo de procesamiento:

1. **Recibe** la imagen o texto enviado por el usuario desde el frontend Angular
2. **Llama a Gemini** (vía API in One) para analizar el estado de ánimo y generar la letra
3. **Llama a Suno** (vía API in One) para componer la melodía original
4. **Llama a ElevenLabs** (vía API in One) para sintetizar la voz cantada
5. **Devuelve** el resultado completo (audio, letra, notas) a la aplicación

Sin N8N en CubePath, la orquestación entre múltiples APIs de IA sería imposible de gestionar de forma tan limpia y escalable.

#### 🌐 HestiaCP — Hosting del frontend

HestiaCP hospeda el build de producción de la app Angular directamente desde CubePath, exponiendo la URL pública accesible para la demo del hackathon.

#### 🗄️ NocoDB — Base de datos

NocoDB almacena el historial de canciones generadas por los usuarios, guardando el mood detectado, la letra, el audio y la fecha de cada canción.

#### 🏗️ Arquitectura completa

```
[Usuario]
    ↓
[Angular + Tailwind]  ←→  [N8N en CubePath]
                                  ↓
                           [API in One]
                          ↙     ↓      ↘
                     [Gemini] [Suno] [ElevenLabs]
                       mood   música    voz
                          ↓              ↓
                   [NocoDB CubePath]  [HestiaCP CubePath]
                    (base de datos)   (hosting frontend)
```

---

## 👥 Equipo

| Integrante | GitHub |
|---|---|
| Stivinson Correa Maturana | [@Stivinsonweb](https://github.com/Stivinsonweb) |
| Willy | [@willyrr19](https://github.com/willyrr19) |

---

## 📄 Licencia

MIT License — libre para usar, modificar y distribuir.

---

<p align="center">
  Hecho con ❤️ para el Hackathon — desplegado en <strong>CubePath</strong>
</p>
