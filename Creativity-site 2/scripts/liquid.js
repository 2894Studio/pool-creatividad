/* liquid.js — gotas líquidas (metaballs) en WebGL para el fondo del inicio.
   Cada gota suma un campo; donde el campo supera 1 hay "líquido". Así dos gotas
   que se acercan estiran un cuello entre ellas y acaban fundiéndose en una.
   Colores de marca: cuerpo cobalto/cielo con un núcleo luminoso casi blanco.

   JOY.createLiquid(canvas, { alpha, soft, maxScale }) → null si no hay WebGL, o { resize(w, h), render(balls, time) }
   alpha: opacidad general (0..1) · soft: cuánto se difumina el borde (0 nítido)
   maxScale: píxeles de lienzo por px CSS como mucho (por defecto 1.5); el shader es caro por píxel
   balls: [{ x, y, r, tone (0 cielo … 1 cobalto), angle, stretch, wobble, phase }] en px CSS */
(function () {
  const JOY = (window.JOY = window.JOY || {});
  const MAX = 24;

  const VERT = 'attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }';

  const FRAG = [
    '#extension GL_OES_standard_derivatives : enable',
    'precision highp float;',
    'uniform vec2 uRes;',
    'uniform float uScale;',
    'uniform float uTime;',
    'uniform int uCount;',
    'uniform float uAlpha;',
    'uniform float uSoft;',
    'uniform vec4 uBall[' + MAX + '];',
    'uniform vec4 uShape[' + MAX + '];',
    'const vec3 COBALT = vec3(0.039, 0.275, 1.0);',
    'const vec3 SKY = vec3(0.49, 0.718, 1.0);',
    'const vec3 GLOW = vec3(0.86, 0.93, 1.0);',
    'const vec3 WHITE = vec3(0.985, 0.99, 1.0);',
    'void main() {',
    '  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale;',
    '  float F = 0.0;',
    '  float wsum = 0.0;',
    '  vec3 body = vec3(0.0);',
    '  vec3 coreCol = vec3(0.0);',
    '  float core = 0.0;',
    '  for (int i = 0; i < ' + MAX + '; i++) {',
    '    if (i >= uCount) break;',
    '    vec4 b = uBall[i];',
    '    vec4 s = uShape[i];',
    '    if (b.z < 0.5) continue;',
    '    vec2 d = p - b.xy;',
    '    float ca = cos(s.x); float sa = sin(s.x);',
    // estirar sin cambiar el área: eje largo × (1+st), eje corto ÷ (1+st)
    '    d = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y);',
    '    d.x /= (1.0 + s.y); d.y *= (1.0 + s.y);',
    '    float a = atan(d.y, d.x);',
    '    float rr = b.z * (1.0 + s.z * (0.55 * sin(3.0 * a + uTime * 1.3 + s.w) + 0.45 * sin(5.0 * a - uTime * 1.8 + s.w * 1.7)));',
    // núcleo compacto (1 - d²/R²)² con R = 2r: fuera de 2r no influye; en d = r vale 0.5625
    '    float q = dot(d, d) / (4.0 * rr * rr);',
    '    if (q >= 1.0) continue;',
    '    float f = (1.0 - q) * (1.0 - q) / 0.5625;',
    '    F += f;',
    '    float w = f * f;',
    '    body += mix(SKY, COBALT, b.w) * w;',
    '    wsum += w;',
    '    float c = smoothstep(0.55, 0.0, sqrt(q) * 2.0 - 0.15);',
    '    coreCol += mix(WHITE, GLOW, b.w) * c;',
    '    core += c;',
    '  }',
    '  if (F < 0.2) { gl_FragColor = vec4(0.0); return; }',
    '  vec3 base = body / max(wsum, 1e-4);',
    '  vec3 glowC = core > 0.0 ? coreCol / core : WHITE;',
    '  float depth = clamp((F - 1.0) / 3.0, 0.0, 1.0);',
    // borde más saturado, interior que se aclara hacia el núcleo
    '  vec3 col = mix(base * 0.92, base, smoothstep(0.0, 0.25, depth));',
    '  col = mix(col, glowC, clamp(core, 0.0, 1.0) * 0.8);',
    // un brillo suave desde arriba a la izquierda, a partir del gradiente del campo
    '  vec2 g = vec2(dFdx(F), -dFdy(F));',
    '  float lit = clamp(dot(normalize(vec3(-g * 6.0, 1.0)), normalize(vec3(-0.5, 0.6, 0.65))), 0.0, 1.0);',
    '  col += vec3(0.08) * pow(lit, 6.0) * (1.0 - depth);',
    '  float aa = max(max(fwidth(F), 1e-3) * 1.2, uSoft);',
    '  float alpha = smoothstep(1.0 - aa, 1.0 + aa, F);',
    // halo difuso alrededor, como los círculos difuminados originales
    '  float halo = smoothstep(0.2, 1.0, F) * 0.22 * (1.0 - alpha);',
    '  vec3 haloC = mix(base, SKY, 0.5);',
    '  gl_FragColor = vec4(col * alpha + haloC * halo, alpha + halo) * uAlpha;',
    '}',
  ].join('\n');

  function compile(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('liquid.js:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  JOY.createLiquid = (canvas, opts) => {
    const o = opts || {};
    let gl = null;
    try { gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true }); } catch (_) { gl = null; }
    if (!gl || !gl.getExtension('OES_standard_derivatives')) return null;
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {};
    ['uRes', 'uScale', 'uTime', 'uCount', 'uAlpha', 'uSoft', 'uBall', 'uShape'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
    const ballData = new Float32Array(MAX * 4);
    const shapeData = new Float32Array(MAX * 4);
    let scale = 1;

    return {
      resize(w, h) {
        scale = Math.min(window.devicePixelRatio || 1, o.maxScale || 1.5);
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        gl.viewport(0, 0, canvas.width, canvas.height);
      },
      render(balls, time) {
        const n = Math.min(balls.length, MAX);
        for (let i = 0; i < n; i++) {
          const b = balls[i];
          ballData.set([b.x, b.y, b.r, b.tone || 0], i * 4);
          shapeData.set([b.angle || 0, b.stretch || 0, b.wobble || 0, b.phase || 0], i * 4);
        }
        gl.uniform2f(U.uRes, canvas.width, canvas.height);
        gl.uniform1f(U.uScale, scale);
        gl.uniform1f(U.uTime, time);
        gl.uniform1i(U.uCount, n);
        gl.uniform1f(U.uAlpha, o.alpha == null ? 1 : o.alpha);
        gl.uniform1f(U.uSoft, o.soft || 0);
        gl.uniform4fv(U.uBall, ballData);
        gl.uniform4fv(U.uShape, shapeData);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    };
  };
})();
