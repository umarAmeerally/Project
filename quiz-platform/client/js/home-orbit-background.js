const canvas = document.getElementById("orbitCanvas");

if (canvas) {
  const ctx = canvas.getContext("2d");

  const symbols = [
    "📘", "📚", "📖", "📝", "✏️", "🖊️", "🧠", "🎓",
    "📐", "📏", "🧪", "🔬", "🧬", "➕", "➗", "∑",
    "π", "√", "⚛️", "🌍", "🗂️", "📓", "📒", "📑",
    "🧾", "📋", "🗃️", "🧮", "🧑‍🏫", "🏫"
  ];

  const particles = [];
  const mouse = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    active: false
  };

  let width = 0;
  let height = 0;
  let centerX = 0;
  let centerY = 0;

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    centerX = width * 0.48;
    centerY = height * 0.5;
  }

  function rotatePoint(x, y, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return {
      x: x * cos - y * sin,
      y: x * sin + y * cos
    };
  }

  function createParticles() {
    particles.length = 0;

    const ringConfigs = [
  {
    count: 22,
    radiusX: width * 0.38,
    radiusY: height * 0.16,
    speed: 0.0043,
    sizeMin: 18,
    sizeMax: 30,
    rotation: -0.34,
    opacityMin: 0.28,
    opacityMax: 0.5
  },
  {
    count: 24,
    radiusX: width * 0.52,
    radiusY: height * 0.23,
    speed: -0.0032,
    sizeMin: 16,
    sizeMax: 28,
    rotation: -0.34,
    opacityMin: 0.22,
    opacityMax: 0.42
  },
  {
    count: 18,
    radiusX: width * 0.44,
    radiusY: height * 0.14,
    speed: 0.0034,
    sizeMin: 16,
    sizeMax: 26,
    rotation: 0.52,
    opacityMin: 0.2,
    opacityMax: 0.38
  }
];

    ringConfigs.forEach((config, ringIndex) => {
      for (let i = 0; i < config.count; i += 1) {
        particles.push({
          symbol: symbols[Math.floor(Math.random() * symbols.length)],
          ringIndex,
          angle: (Math.PI * 2 * i) / config.count + randomBetween(-0.16, 0.16),
          speed: config.speed + randomBetween(-0.0007, 0.0007),
          baseRadiusX: config.radiusX + randomBetween(-16, 16),
          baseRadiusY: config.radiusY + randomBetween(-10, 10),
          radiusOffset: 0,
          radiusVelocity: 0,
          wobblePhase: randomBetween(0, Math.PI * 2),
          wobbleSpeed: randomBetween(0.008, 0.018),
          wobbleAmount: randomBetween(3, 10),
          size: randomBetween(config.sizeMin, config.sizeMax),
          opacity: randomBetween(config.opacityMin, config.opacityMax),
          rotation: config.rotation
        });
      }
    });
  }

  function drawBackgroundHaze() {
    const glow = ctx.createRadialGradient(
      centerX,
      centerY,
      40,
      centerX,
      centerY,
      Math.max(width, height) * 0.72
    );
    glow.addColorStop(0, "rgba(124, 92, 255, 0.08)");
    glow.addColorStop(0.35, "rgba(38, 208, 255, 0.05)");
    glow.addColorStop(0.7, "rgba(255, 255, 255, 0.015)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  function drawCoreGlow() {
    const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 240);
    outerGlow.addColorStop(0, "rgba(124, 92, 255, 0.22)");
    outerGlow.addColorStop(0.32, "rgba(38, 208, 255, 0.12)");
    outerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 240, 0, Math.PI * 2);
    ctx.fill();

    const innerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 80);
    innerGlow.addColorStop(0, "rgba(255,255,255,0.95)");
    innerGlow.addColorStop(0.16, "rgba(38,208,255,0.62)");
    innerGlow.addColorStop(0.42, "rgba(124,92,255,0.28)");
    innerGlow.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawOrbitGuides() {
    const guides = [
  { rx: width * 0.38, ry: height * 0.16, rotation: -0.34, alpha: 0.08 },
  { rx: width * 0.52, ry: height * 0.23, rotation: -0.34, alpha: 0.05 },
  { rx: width * 0.44, ry: height * 0.14, rotation: 0.52, alpha: 0.06 }
];

    guides.forEach((guide) => {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(guide.rotation);
      ctx.strokeStyle = `rgba(255,255,255,${guide.alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, guide.rx, guide.ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  function updateAndDrawParticles() {
    const influenceRadius = 180;
    const springStrength = 0.018;
    const damping = 0.9;

    particles.forEach((particle) => {
      particle.angle += particle.speed;
      particle.wobblePhase += particle.wobbleSpeed;

      const wobble = Math.sin(particle.wobblePhase) * particle.wobbleAmount;

      if (mouse.active) {
        const baseLocalX = Math.cos(particle.angle) * (particle.baseRadiusX + particle.radiusOffset + wobble);
        const baseLocalY = Math.sin(particle.angle) * (particle.baseRadiusY + particle.radiusOffset * 0.3 + wobble * 0.25);
        const rotatedBase = rotatePoint(baseLocalX, baseLocalY, particle.rotation);

        const approxX = centerX + rotatedBase.x;
        const approxY = centerY + rotatedBase.y;

        const dx = approxX - mouse.x;
        const dy = approxY - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < influenceRadius && distance > 0.001) {
          const force = (influenceRadius - distance) / influenceRadius;
          particle.radiusVelocity += force * 2.7;
        }
      }

      particle.radiusVelocity += (0 - particle.radiusOffset) * springStrength;
      particle.radiusVelocity *= damping;
      particle.radiusOffset += particle.radiusVelocity;

      const localX = Math.cos(particle.angle) * (particle.baseRadiusX + particle.radiusOffset + wobble);
      const localY = Math.sin(particle.angle) * (particle.baseRadiusY + particle.radiusOffset * 0.3 + wobble * 0.25);
      const rotated = rotatePoint(localX, localY, particle.rotation);

      const x = centerX + rotated.x;
      const y = centerY + rotated.y;

      const depthFactor = Math.sin(particle.angle);
      const alphaBoost = depthFactor > 0 ? 0.08 : -0.03;
      const drawAlpha = Math.max(0.08, Math.min(0.75, particle.opacity + alphaBoost));

      ctx.save();
      ctx.globalAlpha = drawAlpha;
      ctx.font = `${particle.size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(particle.symbol, x, y);
      ctx.restore();
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    drawBackgroundHaze();
    drawOrbitGuides();
    drawCoreGlow();
    updateAndDrawParticles();
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", () => {
    resizeCanvas();
    createParticles();
  });

  document.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    mouse.active = true;
  });

  document.addEventListener("mouseleave", () => {
    mouse.active = false;
  });

  resizeCanvas();
  createParticles();
  animate();
}