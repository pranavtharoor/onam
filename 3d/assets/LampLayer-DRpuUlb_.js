import{r as e}from"./react-EV4rRv3L.js";import{n as t,t as n}from"./motion-BuTe_SpI.js";import{i as r,n as i,r as a,t as o}from"./3d-CiiHmGtU.js";import{_ as s,a as c,c as l,d as u,f as d,g as f,h as p,i as m,l as h,m as g,n as _,o as v,p as y,r as b,s as x,t as S,u as C,v as w}from"./three-BrzgtQDF.js";var T=e();function E(e,n){let a=new m({canvas:e,alpha:!0,premultipliedAlpha:!0,antialias:n.antialias??!0,powerPreference:`high-performance`,preserveDrawingBuffer:!1,failIfMajorPerformanceCaveat:!i()});a.setClearColor(0,0);let s=!1,c=!1,l=!0,u=0,d=0,f=!i(),p=1,h=0,g=0,_=()=>{let t=e.getBoundingClientRect();t.width&&t.height&&(a.setPixelRatio(Math.min(window.devicePixelRatio||1,n.maxDpr??1.5)*p),a.setSize(t.width,t.height,!1),n.onResize(t.width,t.height),l=!0)},v=e=>{if(!s||c||document.hidden){u=0;return}let t=u?Math.min(e-u,1/20):1/60;if(u=e,r.paused||(d+=t),n.frame({time:d,dt:r.paused?0:t})||l){let e=performance.now();n.render(),o.draw(performance.now()-e),o.dpr=a.getPixelRatio(),l=!1,++g>20&&t>1/30?h++:t<1/45&&(h=Math.max(0,h-1)),f&&h>24&&p===1&&(p*=.75,h=0,_())}},y=e=>{e.preventDefault(),c=!0,n.onLost?.()},b=()=>{c=!1,n.onRestored?.()};e.addEventListener(`webglcontextlost`,y),e.addEventListener(`webglcontextrestored`,b);let x=new ResizeObserver(_);x.observe(e);let S=new IntersectionObserver(([e])=>{s=!!e?.isIntersecting,l=!0});return S.observe(e),t.ticker.add(v),_(),{renderer:a,invalidate:()=>{l=!0},renderNow:()=>{c||(n.frame({time:d,dt:0}),n.render())},dispose(){t.ticker.remove(v),e.removeEventListener(`webglcontextlost`,y),e.removeEventListener(`webglcontextrestored`,b),x.disconnect(),S.disconnect(),a.dispose(),a.forceContextLoss()}}}function D(e){let t=new f,n=(e,n,r,i,a=0)=>{let o=new C({color:new v(n).multiplyScalar(r)});a&&(o.side=1);let s=new h(e,o);return i(s),t.add(s),s};n(new c(7,4.2,7),`#d6d0bd`,.5,e=>e.position.set(0,2.1,.8),1),n(new g(7,7),`#6e2419`,.12,e=>{e.rotation.x=-Math.PI/2,e.position.set(0,.002,.8)}),n(new g(7,7),`#2a1a10`,.25,e=>{e.rotation.x=Math.PI/2,e.position.set(0,4.19,.8)}),n(new g(2.6,2.6),`#e4e8e0`,6,e=>{e.rotation.x=Math.PI/2,e.position.set(0,4.15,2.3)}),n(new g(6.6,2.4),`#cbb89a`,1.7,e=>{e.rotation.y=Math.PI,e.position.set(0,1,4.28)}),n(new g(7,.7),`#3d2515`,.35,e=>e.position.set(0,2.5,-2.68));for(let e of[-1.9,1.9])n(new c(.22,4.2,.22),`#24150c`,.4,t=>t.position.set(e,2.1,-2.4));let r=new b(e),i=r.fromScene(t,.035);return r.dispose(),t.traverse(e=>{e instanceof h&&(e.geometry.dispose(),e.material.dispose())}),i.texture}var O={blending:5,blendSrc:201,blendDst:201,blendSrcAlpha:200,blendDstAlpha:201};function k(){let e=new g(1,1);return e.translate(0,.5,0),e}function A(e){return new s({...O,transparent:!0,depthWrite:!1,toneMapped:!1,uniforms:{uTime:{value:0},uSeed:{value:e},uLit:{value:1}},vertexShader:`
      uniform float uTime, uSeed, uLit;
      varying vec2 vUv;
      varying float vN;
      void main() {
        vUv = uv;
        float t = uTime;
        float n = sin(t * 6.1 + uSeed * 7.0) * 0.55 + sin(t * 11.3 + uSeed * 3.0) * 0.3 + sin(t * 23.7 + uSeed) * 0.15;
        vN = n;
        vec3 p = position;
        p.y *= (0.93 + 0.07 * n) * mix(0.12, 1.0, uLit);
        p.x *= mix(0.55, 1.0, uLit);
        p.x += n * 0.035 * uv.y * uv.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,fragmentShader:`
      uniform float uTime, uSeed, uLit;
      varying vec2 vUv;
      varying float vN;
      void main() {
        // Flame space: x in [-1, 1] across the body (the middle third of the quad), y 0..1 up.
        float x = (vUv.x - 0.5) * 6.0;
        float y = vUv.y * 1.18;
        x -= vN * 0.18 * y * y;                          // the tip leans with the draught
        float yp = pow(clamp(y, 0.0, 1.0), 0.6);
        float hw = pow(clamp(4.0 * yp * (1.0 - yp), 0.0, 1.0), 0.8) + 1e-3;
        float d = abs(x) / hw;
        float inside = step(y, 1.0);
        float body = smoothstep(1.0, 0.45, d) * smoothstep(0.0, 0.07, y) * inside;
        float core = smoothstep(0.7, 0.05, d) * smoothstep(0.04, 0.2, y) * smoothstep(0.72, 0.3, y) * inside;
        float root = smoothstep(0.2, 0.02, y) * smoothstep(1.1, 0.2, d) * smoothstep(0.0, 0.03, y);
        vec3 bodyCol = mix(vec3(1.0, 0.38, 0.07), vec3(1.0, 0.66, 0.22), smoothstep(0.95, 0.3, y));
        vec3 col = bodyCol * body * 1.05 + vec3(1.0, 0.9, 0.66) * core * 1.25 + vec3(0.18, 0.28, 1.0) * root * 0.28;
        // A soft glow around the flame, inside the quad.
        vec2 g = vec2((vUv.x - 0.5) * 2.2, (vUv.y - 0.36) * 1.7);
        col += vec3(1.0, 0.55, 0.2) * exp(-dot(g, g) * 5.0) * 0.16;
        float flick = 0.93 + 0.07 * sin(uTime * 17.0 + uSeed * 5.0);
        // Fade the quad's rectangle to nothing at its borders.
        float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x) * smoothstep(1.0, 0.9, vUv.y);
        gl_FragColor = vec4(col * uLit * flick * edge, 0.0);
      }`})}function j(){return new s({...O,transparent:!0,depthWrite:!1,depthTest:!1,toneMapped:!1,uniforms:{uGain:{value:0},uTime:{value:0}},vertexShader:`
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,fragmentShader:`
      uniform float uGain, uTime;
      varying vec2 vUv;
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r2 = dot(p, p);
        float g = exp(-r2 * 9.0) * 0.55 + exp(-r2 * 2.6) * 0.25;
        g *= smoothstep(1.0, 0.7, sqrt(r2));
        float flick = 0.95 + 0.05 * sin(uTime * 9.0) * sin(uTime * 3.7);
        gl_FragColor = vec4(vec3(1.0, 0.62, 0.3) * g * uGain * flick, 0.0);
      }`})}function M({albedo:e,normal:t,dish:n}){return new s({...O,transparent:!0,depthWrite:!1,toneMapped:!1,defines:{N_FLAMES:5,DISH:+!!n},uniforms:{uFlames:{value:Array.from({length:5},()=>new w)},uLit:{value:[,,,,,].fill(0)},uAlbedo:{value:new v(e)},uLight:{value:new v(`#ffb566`)},uNormal:{value:t},uGain:{value:.002},uDish:{value:new w(0,n?.y??0,n?.r??0)},uClipZ:{value:-10},uFadeAt:{value:new w},uFadeR:{value:[.3,.6]}},vertexShader:`
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,fragmentShader:`
      uniform vec3 uFlames[N_FLAMES];
      uniform float uLit[N_FLAMES];
      uniform vec3 uAlbedo, uLight, uNormal, uDish, uFadeAt;
      uniform float uFadeR[2];
      uniform float uGain, uClipZ;
      varying vec3 vWorld;
      void main() {
        if (vWorld.z < uClipZ) discard;
        float sum = 0.0;
        for (int i = 0; i < N_FLAMES; i++) {
          vec3 L = uFlames[i] - vWorld;
          float d2 = max(dot(L, L), 1e-4);
          float cosT = max(dot(uNormal, L) * inversesqrt(d2), 0.0);
          float occ = 1.0;
          #if DISH
            float t = (uDish.y - vWorld.y) / L.y;
            vec2 c = vWorld.xz + L.xz * t;
            occ = smoothstep(uDish.z - 0.015, uDish.z + 0.02, length(c));
          #endif
          sum += uLit[i] * cosT / d2 * occ;
        }
        // Keep the light off the edges of the quad (and so off the edges of the canvas).
        float fade = 1.0 - smoothstep(uFadeR[0], uFadeR[1], distance(vWorld, uFadeAt));
        gl_FragColor = vec4(uAlbedo * uLight * sum * uGain * fade, 0.0);
      }`})}var N={start:.45,step:.032,each:.03},P={start:.3,end:.64,elev:[3,11],yaw:[-14,0]},F=17,I=.448,L={y:.421,r:.094},R={w:.042,h:.036},z={color:`#ff9f4d`,candela:.004},B=(e,t,n)=>{let r=l.clamp((n-e)/(t-e),0,1);return r*r*(3-2*r)};async function V(e,t){e.toneMapping=7,e.toneMappingExposure=1;let n=await new _().setMeshoptDecoder(S).loadAsync(t),r=new f,i=D(e);r.environment=i;let a=n.scene;r.add(a);let o=[],s=[i];a.traverse(e=>{if(/^Flame_\d$/.test(e.name)&&o.push(e),!(e instanceof h))return;let t=e.material;if(e.name===`Nilavilakku`){let n=new u({map:t.map,aoMap:t.aoMap,roughnessMap:t.roughnessMap,metalnessMap:t.metalnessMap,metalness:1,roughness:1,aoMapIntensity:1,envMapIntensity:1,anisotropy:.3,anisotropyRotation:0});t.dispose(),e.material=n,s.push(n)}else if(e.name===`Oil`){let n=new d({color:new v(`#5a3510`),roughness:.04,metalness:0,transparent:!0,opacity:.72,envMapIntensity:1.3});t.dispose(),e.material=n,e.renderOrder=1,s.push(n)}else if(e.name===`Shadow`){let n=new C({map:t.map,color:0,transparent:!0,opacity:.55,depthWrite:!1});t.dispose(),e.material=n,e.renderOrder=-1,s.push(n)}else e.name.startsWith(`Wick`)&&(t.roughness=.85,t.side=2);s.push(e.geometry)}),o.sort((e,t)=>e.name.localeCompare(t.name));let c=new x;r.add(c);let m=k();s.push(m);let b=o.map((e,t)=>{let n=A(t*1.7+.3),r=new h(m,n);return e.getWorldPosition(r.position),r.position.y-=.004,r.scale.set(R.w,R.h,1),r.renderOrder=3,c.add(r),s.push(n),r}),T=new p(z.color,0,0,2);b[0]&&T.position.copy(b[0].position).add(new w(0,.012,0)),r.add(T);let E=new h(new g(1,1),j());E.position.set(0,.452,0),E.scale.setScalar(.24),E.renderOrder=4,r.add(E),s.push(E.geometry,E.material);let O=M({albedo:`#6e2419`,normal:new w(0,1,0),dish:L}),V=new h(new g(1.5,1.5),O);V.rotation.x=-Math.PI/2,V.position.y=5e-4,V.renderOrder=2,r.add(V);let H=M({albedo:`#d9cdb0`,normal:new w(0,0,1)}),U=new h(new g(.86,.86),H);U.renderOrder=2,r.add(U),s.push(V.geometry,O,U.geometry,H);for(let e of[O,H])b.forEach((t,n)=>e.uniforms.uFlames.value[n].copy(t.position).add(new w(0,.012,0)));O.uniforms.uGain.value=.0016,O.uniforms.uFadeAt.value.set(0,0,0),O.uniforms.uFadeR.value=[.25,.75],H.uniforms.uGain.value=.0011,H.uniforms.uFadeR.value=[.12,.42];let W=new y(F,1,.05,30),G=b[0]?b[0].position.clone().add(new w(0,.011,0)):new w(0,I,0),K=3,q={x:0,y:0},J=``,Y=(e,t)=>{let n=l.degToRad(e),r=l.degToRad(t);W.position.set(Math.sin(r)*Math.cos(n),Math.sin(n),Math.cos(r)*Math.cos(n)).multiplyScalar(K).add(G),W.lookAt(G),W.updateMatrixWorld()},X=()=>{W.updateProjectionMatrix();let e=W.projectionMatrix.elements;e[8]=-q.x,e[9]=-q.y,W.projectionMatrixInverse.copy(W.projectionMatrix).invert()},Z=e=>.5-e.clone().project(W).y/2,Q=null;return{layout(e){Q=e,W.aspect=e.width/e.height,q={x:e.flame.x*2-1,y:1-e.flame.y*2};let t=l.degToRad(P.elev[1]),n=Math.tan(l.degToRad(F)/2);K=G.y*Math.cos(t)/(2*n*(e.foot-e.flame.y));for(let t=0;t<4;t++){Y(P.elev[1],0),X();let t=Z(new w(0,0,0));K*=(t-e.flame.y)/(e.foot-e.flame.y)}Y(P.elev[1],0),X();let r=.05,i=6;for(let t=0;t<30;t++){let t=(r+i)/2;Z(new w(0,0,-t))>e.floorLine?r=t:i=t}let a=-(r+i)/2;U.position.set(0,I,a),O.uniforms.uClipZ.value=a,H.uniforms.uFadeAt.value.set(0,I,a),J=``},update(e,t){if(!Q||e>=.999)return!1;let n=B(P.start,P.end,e);Y(l.lerp(P.elev[0],P.elev[1],n),l.lerp(P.yaw[0],P.yaw[1],n)),X();let r=0,i=0;b.forEach((n,a)=>{let o=B(N.start+a*N.step,N.start+a*N.step+N.each,e);r+=o;let s=n.material.uniforms;s.uTime.value=t,s.uLit.value=o,n.visible=o>.001,n.rotation.y=Math.atan2(W.position.x-n.position.x,W.position.z-n.position.z);let c=.9+.06*Math.sin(t*6.1+a*7)+.04*Math.sin(t*13.7+a);i+=o*c,O.uniforms.uLit.value[a]=o*c,H.uniforms.uLit.value[a]=o*c}),T.intensity=z.candela*i;let a=E.material.uniforms;a.uGain.value=.55*r/5,a.uTime.value=t,E.quaternion.copy(W.quaternion);let o=`${e.toFixed(5)}|${r>0?t.toFixed(3):``}`,s=o!==J;return J=o,s},render(){e.render(r,W)},dispose(){s.forEach(e=>e.dispose()),r.clear()}}}var H=new URLSearchParams(location.search).has(`lampms`),U=new Uint8Array(4);function W({section:e,wall:t,profile:r}){let[i,s]=(0,T.useState)(0);return(0,T.useEffect)(()=>{let i=document.createElement(`canvas`);i.className=`nm-lamp3d`,i.setAttribute(`aria-hidden`,`true`),t.appendChild(i);let c=!1,l=null,u=null,d=!1,f=t=>{delete e.dataset.lamp,d=!1,o.lamp=`2D`,o.reason=t};o.profile=r.name,o.msaa=r.antialias;let p=()=>n.getAll().find(t=>t.pin===e)?.animation,m=(e,n)=>{if(!l)return;let o=t.getBoundingClientRect(),s=i.getBoundingClientRect(),c=t.querySelector(`.nm-floor`)?.getBoundingClientRect(),u=e=>(o.top+e*o.height-s.top)/s.height;l.layout({width:e,height:n,flame:{x:(o.left+a.x*o.width-s.left)/s.width,y:u(a.y)},foot:u(r.foot),floorLine:c?(c.top-s.top)/s.height:u(.86)})};try{u=E(i,{maxDpr:r.maxDpr,antialias:r.antialias,onResize:m,onLost:()=>f(`context lost`),onRestored:()=>s(e=>e+1),frame:({time:e})=>l?l.update(p()?.progress()??0,e):!1,render:()=>{if(l){if(H){let e=u.renderer.getContext(),t=performance.now();l.render(),e.readPixels(0,0,1,1,e.RGBA,e.UNSIGNED_BYTE,U),(window.__lampMs??=[]).push(performance.now()-t)}else l.render();d||(d=!0,e.dataset.lamp=`3d`,o.lamp=`3D`,o.reason=``)}}})}catch{f(`WebGL failed to start`),i.remove();return}let h=new URL(`../models/${r.model}`,document.baseURI).href;return V(u.renderer,h).then(e=>{if(c){e.dispose();return}l=e;let t=i.getBoundingClientRect();m(t.width,t.height),u?.renderNow()}).catch(()=>f(`model failed to load`)),()=>{c=!0,f(`unmounted`),l?.dispose(),u?.dispose(),i.remove()}},[e,t,r,i]),null}export{W as default};