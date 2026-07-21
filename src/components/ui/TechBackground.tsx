import React, { useEffect, useRef } from 'react';

const TechBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationFrame = 0;
    let running = false;
    
    // 粒子配置
    const particles: Particle[] = [];
    const properties = {
      bgColor: 'rgba(17, 24, 39, 1)', // gray-900
      particleColor: 'rgba(100, 200, 255, 1)', // 亮青色粒子
      particleRadius: 3,
      particleCount: window.innerWidth < 768 ? 32 : 60,
      lineLength: 150,
      particleSpeed: 0.5,
    };

    class Particle {
      x: number;
      y: number;
      velocityX: number;
      velocityY: number;

      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.velocityX = Math.random() * (properties.particleSpeed * 2) - properties.particleSpeed;
        this.velocityY = Math.random() * (properties.particleSpeed * 2) - properties.particleSpeed;
      }

      position() {
        if ((this.x + this.velocityX > w && this.velocityX > 0)
          || (this.x + this.velocityX < 0 && this.velocityX < 0)) {
          this.velocityX *= -1;
        }
        if ((this.y + this.velocityY > h && this.velocityY > 0)
          || (this.y + this.velocityY < 0 && this.velocityY < 0)) {
          this.velocityY *= -1;
        }
        this.x += this.velocityX;
        this.y += this.velocityY;
      }

      reDraw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, properties.particleRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = properties.particleColor;
        ctx.fill();
      }
    }

    const reDrawBackground = () => {
      ctx.fillStyle = properties.bgColor;
      ctx.fillRect(0, 0, w, h);
    };

    const drawLines = () => {
      let x1, y1, x2, y2, length, opacity;
      for (const i in particles) {
        for (const j in particles) {
          x1 = particles[i].x;
          y1 = particles[i].y;
          x2 = particles[j].x;
          y2 = particles[j].y;
          length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          if (length < properties.lineLength) {
            opacity = 1 - length / properties.lineLength;
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = `rgba(100, 200, 255, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.closePath();
            ctx.stroke();
          }
        }
      }
    };

    const reDrawParticles = () => {
      for (const i in particles) {
        particles[i].position();
        particles[i].reDraw();
      }
    };

    const drawFrame = (moveParticles = true) => {
      reDrawBackground();
      if (moveParticles) {
        reDrawParticles();
      } else {
        for (const particle of particles) {
          particle.reDraw();
        }
      }
      drawLines();
    };

    const loop = () => {
      if (!running || document.hidden) return;
      drawFrame();
      animationFrame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || reducedMotion || document.hidden) return;
      running = true;
      animationFrame = requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(animationFrame);
    };

    const init = () => {
      for (let i = 0; i < properties.particleCount; i++) {
        particles.push(new Particle());
      }
      drawFrame(false);
      start();
    };

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      drawFrame(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    init();
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stop();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />;
};

export default TechBackground;
