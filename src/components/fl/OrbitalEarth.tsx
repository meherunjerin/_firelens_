import { useEffect, useRef, useState } from "react";
import worldMap from "@/assets/world-map.jpg";
import { OrbitLoader } from "./OrbitLoader";

/** An illustrative orbit scene, not a geolocated observation layer. */
export function OrbitalEarth() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};
    void import("three").then(T => {
      if (disposed) return;
      let renderer: InstanceType<typeof T.WebGLRenderer>;
      try { renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); }
      catch { setUnavailable(true); return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      el.appendChild(renderer.domElement);
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(38, 1, .1, 30);
      camera.position.set(0, 0, 7.8);
      const token = (name: string) => new T.Color(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
      // CSS resolves modern color spaces before Three consumes them.
      const color = (name: string) => { const probe = document.createElement("span"); probe.style.color = `var(${name})`; el.appendChild(probe); const value = getComputedStyle(probe).color; probe.remove(); const ctx = document.createElement("canvas").getContext("2d"); if (!ctx) return token(name); ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1); const p = ctx.getImageData(0, 0, 1, 1).data; return new T.Color().setRGB((p[0] ?? 0)/255, (p[1] ?? 0)/255, (p[2] ?? 0)/255, T.SRGBColorSpace); };
      const satColor = color("--sat"), fireColor = color("--fire");
      const earth = new T.Mesh(new T.SphereGeometry(1.45, 48, 32), new T.MeshBasicMaterial({ color: color("--foreground") }));
      earth.rotation.z = .18;
      scene.add(earth);
      const texture = new T.TextureLoader().load(worldMap, () => { if (disposed) return; texture.colorSpace = T.SRGBColorSpace; earth.material.map = texture; earth.material.needsUpdate = true; setReady(true); render(); }, undefined, () => { if (!disposed) { setUnavailable(true); } });
      const orbiters = [0, 1].map(i => {
        const plane = new T.Group(); plane.rotation.set(.6 + i * .85, .25, -.4 + i * .9); scene.add(plane);
        const radius = 1.9 + i * .3;
        const points = Array.from({ length: 129 }, (_, n) => new T.Vector3(Math.cos(n/128*Math.PI*2)*radius, Math.sin(n/128*Math.PI*2)*radius, 0));
        plane.add(new T.LineLoop(new T.BufferGeometry().setFromPoints(points), new T.LineBasicMaterial({ color: satColor, transparent:true, opacity:.28 })));
        const satellite = new T.Group();
        satellite.add(new T.Mesh(new T.BoxGeometry(.12,.12,.12), new T.MeshBasicMaterial({color:color("--foreground")})));
        [-1,1].forEach(side => { const panel = new T.Mesh(new T.BoxGeometry(.2,.13,.02),new T.MeshBasicMaterial({color:satColor})); panel.position.x=side*.19; satellite.add(panel); });
        plane.add(satellite);
        const beam = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineDashedMaterial({color:i ? fireColor : satColor, transparent:true, opacity:.45, dashSize:.09, gapSize:.12}));
        plane.add(beam);
        return {plane, radius, satellite, beam};
      });
      let frame = 0, visible = true, dragging = false, previousX = 0, angle = 0, last = 0;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      const render = () => renderer.render(scene,camera);
      const update = (now: number) => {
        frame = 0;
        const dt = Math.min((now-last)/1000,.05); last=now;
        if (!reduced.matches && !dragging) { angle += dt*.13; earth.rotation.y += dt*.028; }
        orbiters.forEach((o,i) => { const a=angle*(i ? -.76 : 1)+i*2.2; o.satellite.position.set(Math.cos(a)*o.radius,Math.sin(a)*o.radius,0); o.satellite.rotation.z=a; const inner=o.satellite.position.clone().normalize().multiplyScalar(1.46); o.beam.geometry.setFromPoints([o.satellite.position,inner]); o.beam.computeLineDistances(); o.beam.material.opacity=reduced.matches ?.35 : .25+.2*Math.sin(angle*8+i); });
        render();
        if (visible && !document.hidden && !reduced.matches) frame=requestAnimationFrame(update);
      };
      const resume = () => { cancelAnimationFrame(frame); frame=0; if (visible && !document.hidden) { last=performance.now(); frame=requestAnimationFrame(update); } };
      const observer = new IntersectionObserver(([entry]) => { visible=entry?.isIntersecting ?? false; resume(); }); observer.observe(el);
      const resize = new ResizeObserver(() => { renderer.setSize(el.clientWidth,el.clientHeight); camera.aspect=el.clientWidth/Math.max(1,el.clientHeight); camera.updateProjectionMatrix(); render(); }); resize.observe(el);
      const down = (e: PointerEvent) => { dragging=true; previousX=e.clientX; el.setPointerCapture(e.pointerId); };
      const move = (e: PointerEvent) => { if (!dragging) return; earth.rotation.y+=(e.clientX-previousX)*.005; previousX=e.clientX; render(); };
      const up = () => { dragging=false; };
      el.addEventListener("pointerdown",down); el.addEventListener("pointermove",move); el.addEventListener("pointerup",up); el.addEventListener("pointercancel",up);
      document.addEventListener("visibilitychange",resume); reduced.addEventListener("change",resume); resume();
      cleanup = () => { cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect(); document.removeEventListener("visibilitychange",resume); reduced.removeEventListener("change",resume); el.removeEventListener("pointerdown",down); el.removeEventListener("pointermove",move); el.removeEventListener("pointerup",up); el.removeEventListener("pointercancel",up); scene.traverse(obj => { if (obj instanceof T.Mesh || obj instanceof T.Line) { obj.geometry.dispose(); const materials=Array.isArray(obj.material)?obj.material:[obj.material]; materials.forEach(m=>m.dispose()); } }); texture.dispose(); renderer.dispose(); renderer.domElement.remove(); };
    }).catch(() => { if (!disposed) setUnavailable(true); });
    return () => { disposed=true; cleanup(); };
  }, []);
  return <div className="orbital-earth absolute" ref={host} role="img" aria-label="Illustrative rotating Earth with MODIS and VIIRS satellite orbits">{!ready && !unavailable && <div className="absolute inset-0 grid place-items-center"><OrbitLoader label="Establishing orbital view" /></div>}{!unavailable && <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center gap-6 font-mono text-[9px] text-sat"><span>MODIS · TERRA</span><span className="text-ember">VIIRS · SUOMI-NPP</span></div>}</div>;
}