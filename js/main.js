/* ============================================================
   LA OLA — Cyberpunk Stadium Experience
   - Manejo de pantalla (3 estados)
   - Activación de cámara web con getUserMedia
   - Detección de movimiento por diferencia de frames
   - Visualización de la Ola viajando
   - Checklist de misión con checks automáticos
   ============================================================ */
(function () {
    'use strict';

    // ============== STATE ==============
    const state = {
        currentScreen: 1,
        olaActive: false,
        motionLevel: 0,
        motionHistory: [],
        olaProgress: 0,
        stream: null,
        video: null,
        canvas: null,
        ctx: null,
        prevFrame: null,
        animFrame: null,
        completedChecks: new Set(),
        startTime: Date.now()
    };

    // ============== HUD TIME ==============
    function updateHUDTime() {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        const el = document.getElementById('hud-time');
        if (el) el.textContent = `${mins}:${secs}`;
    }
    setInterval(updateHUDTime, 1000);

    // ============== PARTICLES ==============
    function spawnParticles() {
        const container = document.getElementById('particles');
        if (!container) return;
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('span');
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (6 + Math.random() * 6) + 's';
            p.style.animationDelay = (-Math.random() * 10) + 's';
            p.style.opacity = (0.3 + Math.random() * 0.5);
            p.style.width = p.style.height = (2 + Math.random() * 4) + 'px';
            container.appendChild(p);
        }
    }
    spawnParticles();

    // ============== SCREEN NAVIGATION ==============
    window.goToScreen = function (n) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`screen-${n}`);
        if (target) {
            target.classList.add('active');
            state.currentScreen = n;
            // Update HUD step
            const stepTexts = { 1: '09. ENERGÍA COMPLETA', 2: '10. HAZ LA OLA', 3: '10. MISIÓN CUMPLIDA' };
            const hudStep = document.getElementById('hud-step');
            if (hudStep) hudStep.textContent = stepTexts[n] || '';
        }
        // Stop camera when leaving screen 2
        if (n !== 2) stopOla();
    };

    // ============== CAMERA ==============
    async function startCamera() {
        if (state.stream) return state.stream;
        try {
            const constraints = {
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                audio: false
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            state.stream = stream;
            const video = document.getElementById('cam-video');
            if (video) {
                video.srcObject = stream;
                await video.play().catch(() => {});
            }
            updateCamStatus('CÁMARA: ACTIVA ✓', 'green');
            return stream;
        } catch (err) {
            console.error('Camera error:', err);
            updateCamStatus('CÁMARA: DENEGADA — PERMITE EL ACCESO', 'red');
            throw err;
        }
    }

    function stopCamera() {
        if (state.stream) {
            state.stream.getTracks().forEach(t => t.stop());
            state.stream = null;
        }
    }

    function updateCamStatus(text, color) {
        const el = document.getElementById('cam-status');
        if (el) {
            el.textContent = text;
            el.style.borderColor = color === 'green' ? '#00ff66' : 'var(--red)';
            el.style.color = color === 'green' ? '#00ff66' : 'var(--red-bright)';
        }
    }

    // ============== MOTION DETECTION ==============
    function startMotionDetection() {
        if (!state.video) {
            state.video = document.getElementById('cam-video');
            state.canvas = document.getElementById('cam-canvas');
            if (state.canvas) {
                state.ctx = state.canvas.getContext('2d', { willReadFrequently: true });
                state.canvas.width = 160;
                state.canvas.height = 120;
            }
        }
        if (!state.video || !state.ctx) return;

        // Wait for video to have data
        const detectFrame = () => {
            if (!state.olaActive) {
                state.animFrame = null;
                return;
            }
            try {
                state.ctx.drawImage(state.video, 0, 0, state.canvas.width, state.canvas.height);
                const frame = state.ctx.getImageData(0, 0, state.canvas.width, state.canvas.height);
                const motion = computeMotion(frame);
                state.motionLevel = motion;
                updateMotionDisplay(motion);
                updateOla(motion);
            } catch (e) {
                // Video might not be ready
            }
            state.animFrame = requestAnimationFrame(detectFrame);
        };
        state.animFrame = requestAnimationFrame(detectFrame);
    }

    function computeMotion(currentFrame) {
        if (!state.prevFrame) {
            state.prevFrame = currentFrame;
            return 0;
        }
        const prev = state.prevFrame.data;
        const curr = currentFrame.data;
        let diff = 0;
        let count = 0;
        // Sample every 4th pixel for performance
        for (let i = 0; i < curr.length; i += 16) {
            const r = Math.abs(curr[i] - prev[i]);
            const g = Math.abs(curr[i + 1] - prev[i + 1]);
            const b = Math.abs(curr[i + 2] - prev[i + 2]);
            diff += (r + g + b);
            count++;
        }
        state.prevFrame = currentFrame;
        // Normalize to 0-100
        return Math.min(100, (diff / count / 3) * 0.5);
    }

    function updateMotionDisplay(motion) {
        const el = document.getElementById('motion-pct');
        if (el) el.textContent = Math.round(motion) + '%';
    }

    // ============== OLA ANIMATION ==============
    function initOlaFans() {
        const row = document.getElementById('ola-fan-row');
        if (!row) return;
        row.innerHTML = '';
        const numFans = 40;
        for (let i = 0; i < numFans; i++) {
            const fan = document.createElement('div');
            fan.className = 'ola-fan';
            fan.dataset.index = i;
            row.appendChild(fan);
        }
    }
    initOlaFans();

    function updateOla(motion) {
        // Accumulate motion into a "wave" that travels left-to-right
        state.motionHistory.push(motion);
        if (state.motionHistory.length > 30) state.motionHistory.shift();

        // Compute average recent motion
        const avgMotion = state.motionHistory.reduce((a, b) => a + b, 0) / state.motionHistory.length;
        // Boost progress when user moves
        if (avgMotion > 15) {
            state.olaProgress += 0.5;
            if (state.olaProgress > 100) state.olaProgress = 100;
        }

        // Update fans raised state
        const fans = document.querySelectorAll('.ola-fan');
        const wavePos = (state.olaProgress / 100) * fans.length;

        fans.forEach((fan, i) => {
            const dist = Math.abs(i - wavePos);
            if (dist < 3) {
                fan.classList.add('raised');
                fan.style.height = (40 + 60 * (1 - dist / 3)) + '%';
            } else if (dist < 8) {
                fan.classList.add('raised');
                fan.style.height = (20 + 30 * (1 - (dist - 3) / 5)) + '%';
            } else {
                fan.classList.remove('raised');
                fan.style.height = '15%';
            }
        });

        // Show the arrow
        const arrow = document.getElementById('ola-arrow');
        if (arrow) {
            if (avgMotion > 10) arrow.classList.add('active');
            else arrow.classList.remove('active');
        }

        // Auto-check items based on motion intensity
        if (avgMotion > 8)  state.completedChecks.add(1); // levantar brazos
        if (avgMotion > 15) state.completedChecks.add(2); // mover afición
        if (avgMotion > 25) state.completedChecks.add(3); // aplaudir (rápido)
        if (avgMotion > 18) state.completedChecks.add(4); // agitar manos
        if (avgMotion > 35) state.completedChecks.add(5); // saltar
        renderChecklist();

        // Energy bar reacts
        const fill = document.getElementById('energy-fill');
        if (fill) {
            const w = Math.min(100, 70 + avgMotion * 0.7);
            fill.style.width = w + '%';
        }

        // Auto-complete when wave is at the end
        if (state.olaProgress >= 100 && state.olaActive) {
            // Check: is the user still moving?
            if (avgMotion > 12) {
                setTimeout(() => completeOla(), 800);
            }
        }
    }

    function renderChecklist() {
        document.querySelectorAll('.checklist-item').forEach(el => {
            const n = parseInt(el.dataset.check, 10);
            if (state.completedChecks.has(n)) el.classList.add('done');
            else el.classList.remove('done');
        });
    }

    // ============== FLOW ==============
    window.startOla = async function () {
        if (state.olaActive) return;
        state.olaActive = true;
        state.olaProgress = 0;
        state.completedChecks.clear();
        state.motionHistory = [];
        renderChecklist();

        const btn = document.getElementById('start-ola-btn');
        if (btn) {
            btn.textContent = '🔴 LA OLA EN CURSO...';
            btn.disabled = true;
        }

        try {
            await startCamera();
        } catch (e) {
            // User denied camera; we can still simulate the wave
            updateCamStatus('MODO DEMO — MUEVE EL CEL', 'red');
        }

        // Start motion detection (or simulation if no camera)
        startMotionDetection();
        if (!state.stream) startSimulation();
    };

    function startSimulation() {
        // Simulated motion for demo / no-camera case
        const simulate = () => {
            if (!state.olaActive) return;
            // Random motion bursts
            const motion = 20 + Math.random() * 40;
            state.motionLevel = motion;
            updateMotionDisplay(motion);
            updateOla(motion);
            setTimeout(simulate, 200);
        };
        simulate();
    }

    function stopOla() {
        state.olaActive = false;
        if (state.animFrame) {
            cancelAnimationFrame(state.animFrame);
            state.animFrame = null;
        }
        const btn = document.getElementById('start-ola-btn');
        if (btn) {
            btn.innerHTML = '<span class="cta-text">ACTIVAR LA OLA</span>';
            btn.disabled = false;
        }
        stopCamera();
        // Reset fans
        document.querySelectorAll('.ola-fan').forEach(fan => {
            fan.classList.remove('raised');
            fan.style.height = '15%';
        });
        const arrow = document.getElementById('ola-arrow');
        if (arrow) arrow.classList.remove('active');
    }

    function completeOla() {
        if (state.currentScreen === 3) return; // already done
        stopOla();
        goToScreen(3);
        // Celebration
        celebrate();
    }

    function celebrate() {
        // Big energy burst animation
        for (let i = 0; i < 80; i++) {
            setTimeout(() => spawnConfetti(), i * 30);
        }
    }

    function spawnConfetti() {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            top: -10px;
            left: ${Math.random() * 100}vw;
            width: ${4 + Math.random() * 8}px;
            height: ${4 + Math.random() * 8}px;
            background: hsl(${Math.random() * 60}, 100%, 50%);
            z-index: 9999;
            pointer-events: none;
            transition: transform 2.5s ease-in, opacity 2.5s ease-in;
        `;
        document.body.appendChild(particle);
        requestAnimationFrame(() => {
            particle.style.transform = `translateY(110vh) rotate(${Math.random() * 720}deg)`;
            particle.style.opacity = '0';
        });
        setTimeout(() => particle.remove(), 2600);
    }

    window.restartOla = function () {
        state.olaProgress = 0;
        state.completedChecks.clear();
        goToScreen(2);
    };

    // ============== INIT ==============
    console.log('🔴 La Ola — SDM Robotics · Cyberpunk Stadium Experience');
    console.log('📱 Click "ACTIVAR LA OLA" para iniciar la cámara');

    // Pre-fill all checklist items as not done
    renderChecklist();
})();
