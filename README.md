# ✏️ Basta Mexicano Online • Stop / Tutti Frutti / Bachillerato 🇲🇽

[![CI/CD Quality Gates](https://github.com/pinguxx/basta/actions/workflows/ci.yml/badge.svg)](https://github.com/pinguxx/basta/actions/workflows/ci.yml)
[![Rust](https://img.shields.io/badge/Rust-1.80%2B-orange?logo=rust)](https://www.rust-lang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render)](https://render.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance, real-time multiplayer web edition of the beloved Mexican & Latin American category word game **¡Basta!** (also celebrated worldwide as *Stop*, *Tutti Frutti*, *Bachillerato*, or *Scattergories*). Built with a **Rust** backend (**Axum 0.8**, **Tokio**, **WebSockets**) and a responsive, nostalgia-fueled ruled notebook client featuring 100% procedural Web Audio sound synthesis.

Part of the traditional Mexican parlor games collection alongside **Canicas Mexicanas 3D** (`canicas`), **Lotería Mexicana** (`loteria`), **Serpientes y Escaleras** (`shoots_ladders`), **La Pirinola / Toma Todo** (`pirinola`), and **El Juego de la Oca** (`oca`).

---

## 🇺🇸 English Guide

### 🌟 Key Features

1. **Classic Notebook & Fiesta Design System**:
   - 📓 **Cuaderno Escolar (Default)**: Authentic blue horizontal rules, red margin guide, spiral/tape borders, and pencil aesthetics.
   - 🇲🇽 **Feria Mexicana / Papel Picado**: Vibrant carnival colors with traditional festive top banner.
   - 🏺 **Talavera Poblana**: Deep cobalt blue and ceramic gold ornamentation.

2. **Real-Time Multiplayer & Mexican Bot Opponents**:
   - Instant 6-letter room codes, 1-click shareable URLs (`?room=CODE`), and offline **📱 QR Code Party Invites**.
   - Solo & mixed play against iconic Mexican bot personalities:
     - `🤖 El Chavo`: Fast, creative, loves food (*"¡Torta de jamón!"*), occasional humorous mistakes.
     - `🤖 Don Ramón`: Cynical, nostalgic, writes classic Mexican neighborhood terms.
     - `🤖 La Chilindrina`: Competitive speed-typer who rushes to scream Basta first.
     - `🤖 Quico`: Boastful, writes elaborate words (*"¡Cosas de alcurnia!"*).
     - `🤖 Cantinflas`: Highly eloquent with clever Spanish wordplay.
     - `🤖 El Santo`: Decisive, noble words and fast reflexes (*"¡El Enmascarado de Plata!"*).

3. **100% Procedural Web Audio API Sound Effects**:
   - Synthesized pencil scratching noise while typing.
   - Dramatic school bell & buzzer alarm when **¡BASTA!** is called.
   - Ticking countdown clock with accelerating heartbeat urgency.
   - Upward chime for answer approval, low thud for vetoes.
   - Triumphant brass **Mariachi Victory Fanfare** on the podium!

4. **Embedded Dictionary & Real-Time Democratic Voting**:
   - Built-in database of thousands of Spanish names, surnames, cities/countries, animals, fruits/foods, objects, colors, and plants.
   - **Scoring Rules**:
     - **100 pts**: Valid unique answer.
     - **50 pts**: Valid repeated answer (shared with other players).
     - **200 pts**: *Único Sobreviviente* (sole valid answer in the room for that category).
     - **0 pts**: Blank, incorrect initial letter, or rejected by peer voting.
   - Interactive review table where players can thumbs-up 👍 or veto 👎 disputed submissions live.

5. **Trophy Generator & Standalone Artifact**:
   - Shareable **800×1000 Canvas Trophy Card** with top 3 podium standings and final telemetry, downloadable as a high-res PNG.
   - Zero-dependency standalone HTML bundle via `bundle_standalone.py`.

---

## 🇲🇽 Guía en Español

### 🌟 Características Principales

1. **Diseño de Cuaderno Escolar y Tradición Mexicana**:
   - Cuaderno con renglones azules, margen rojo clásico y temas intercambiables: Cuaderno Escolar, Papel Picado de Feria y Talavera Poblana.
2. **Multijugador en Tiempo Real y Bots Mexicanos**:
   - Salas privadas de 6 letras, invitaciones por código QR y juego en solitario contra El Chavo, Don Ramón, La Chilindrina, Quico, Cantinflas y El Santo.
3. **Audio 100% Procedural (Web Audio API)**:
   - Sonido de grafito de lápiz sobre papel, alarma de ¡BASTA!, reloj en cuenta regresiva y fanfarria triunfal de trompetas de mariachi.
4. **Validación Automática y Mesa de Calificación**:
   - Diccionario hispano integrado para revisión instantánea con votación comunitaria en vivo.
5. **Generador de Trofeos**:
   - Descarga de tarjeta postal de victoria en alta resolución (PNG 800x1000).

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Rust 2021, Axum 0.8, Tokio 1.54, WebSockets, Tower-HTTP, Serde, Rand.
- **Frontend**: HTML5, Vanilla JavaScript (ES2022), Responsive CSS3 Custom Properties.
- **Sound**: 100% Procedural Web Audio API (zero audio asset dependencies).
- **Tooling**: GitHub Actions CI/CD (`ci.yml`), Multi-stage `Dockerfile`, `render.yaml` blueprint.

---

## 🚀 Quick Start (Local Development)

```bash
# Clone the repository
git clone https://github.com/pinguxx/basta.git
cd basta

# Run test suite
cargo test

# Launch local server
cargo run
# Open http://localhost:3000 in your browser!
```

### Standalone HTML Bundle Generator

To generate a single zero-dependency offline file:

```bash
python3 bundle_standalone.py dist/basta_standalone.html
```

---

## 🐳 Docker & Cloud Deployment

```bash
# Build Docker container
docker build -t basta:latest .

# Run container
docker run -p 3000:3000 basta:latest
```

One-click deployment on **Render**: connect your repository and Render will automatically detect `render.yaml`!

---

## 📄 License

MIT License • Diseñado con orgullo y nostalgia mexicana por **@pinguxx**.
