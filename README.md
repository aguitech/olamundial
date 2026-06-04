# 🔴 La Ola — Cyberpunk Stadium Experience

Experiencia interactiva cyberpunk con cámara web: **activá la Ola en el estadio virtual**.

## 🌐 URL en vivo

👉 **https://aguitech.github.io/olamundial/**

## 🎮 Cómo jugar

1. Entra a la URL
2. Lee el **resumen de energía** (100% — ¡listos para la Ola!)
3. Click en **¡PREPÁRATE!**
4. En la pantalla 2, click en **ACTIVAR LA OLA** (te pedirá permiso de cámara)
5. **Mové los brazos** frente a la cámara
6. La Ola viajará por el estadio según tu movimiento
7. Cuando la Ola complete el recorrido, ¡Misión Cumplida! 🏆

## ✨ Features

- 📹 **Cámara web** activada con `getUserMedia` (requiere HTTPS / localhost)
- 🎬 **Detección de movimiento** en tiempo real (frame differencing)
- 🌊 **Visualización de la Ola** viajando por 40 aficionados virtuales
- ☑️ **Checklist gamificado** que se completa según tu intensidad de movimiento
- 🔴 **Estética cyberpunk** con paleta rojo/negro, scanlines, grid animado, partículas
- 🎉 **Celebración final** con confetti
- 📱 **Responsive** (funciona en cel, tablet, compu)

## 🎨 Stack

- **HTML5 semántico** + **CSS3** (variables, animaciones, grid, flexbox)
- **JavaScript vanilla** (getUserMedia, frame differencing, requestAnimationFrame)
- **Sin frameworks** ni dependencias externas
- **Google Fonts**: Orbitron (display), Rajdhani (UI), Inter (texto)
- Hosteado en **GitHub Pages**

## 📁 Estructura

```
olamundial/
├── README.md
├── index.html              (10KB · 3 pantallas)
├── css/
│   └── styles.css          (21KB · cyberpunk theme)
├── js/
│   └── main.js             (13KB · cámara + motion + ola)
└── images/
    ├── estadio_cyberpunk.png   (1.5MB · hero)
    ├── fan_silhouette.png      (715KB · fondo ola)
    └── trofeo_energia.png      (418KB · pantalla final)
```

## 🔒 Permisos

La página pide acceso a la cámara SOLO cuando hacés click en "ACTIVAR LA OLA". No se guarda ni transmite nada. Si denegás el permiso, la app entra en **modo demo** y simula movimiento aleatorio.

## 📱 Compatibilidad

- ✅ Chrome / Edge / Brave (desktop y Android)
- ✅ Safari (iOS 14+)
- ✅ Firefox
- ❌ No funciona en HTTP — necesita HTTPS (Pages ya lo da)
