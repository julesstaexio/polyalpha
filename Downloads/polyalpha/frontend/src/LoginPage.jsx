import { useState, useEffect, useRef } from 'react'
import { Waves } from './WaveBackground.jsx'
import { LiquidButton } from './LiquidButton.jsx'
import { usePrivy } from '@privy-io/react-auth'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');

  :root {
    --void:#040406;--void2:#08080d;--sf:#0c0c14;--sf2:#10101a;
    --w:#ffffff;--w90:rgba(255,255,255,0.90);--w60:rgba(255,255,255,0.60);
    --w30:rgba(255,255,255,0.30);--w10:rgba(255,255,255,0.10);
    --w06:rgba(255,255,255,0.06);--w04:rgba(255,255,255,0.04);--w03:rgba(255,255,255,0.03);
    --ice:#a8c4ff;--green:#7fffd4;--gold:#ffd97a;--red:#ff8080;
    --sans:'Outfit',system-ui,sans-serif;--mono:'JetBrains Mono',monospace;
    --r:18px;--r2:12px;--r3:100px;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;overflow:hidden;background:var(--void);font-family:var(--sans);color:var(--w90);}

  @keyframes riseIn{from{opacity:0;transform:translateY(20px) scale(.97);}to{opacity:1;transform:translateY(0) scale(1);}}
  @keyframes slideR{from{opacity:0;transform:translateX(24px);}to{opacity:1;transform:translateX(0);}}
  @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
  @keyframes fadeOut{from{opacity:1;}to{opacity:0;}}
  @keyframes orbit{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  @keyframes orbit2{from{transform:rotate(0deg);}to{transform:rotate(-360deg);}}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(.7);}}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes ticker{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
  @keyframes borderGlow{
    0%,100%{box-shadow:0 0 0 1px rgba(255,255,255,.07),0 0 16px rgba(255,255,255,.02),inset 0 0 0 1px rgba(255,255,255,.03);}
    50%{box-shadow:0 0 0 1px rgba(255,255,255,.15),0 0 32px rgba(168,196,255,.08),inset 0 0 0 1px rgba(168,196,255,.05);}
  }
  @keyframes borderGlowGold{
    0%,100%{box-shadow:0 0 0 1px rgba(255,217,122,.12),0 0 14px rgba(255,217,122,.04);}
    50%{box-shadow:0 0 0 1px rgba(255,217,122,.28),0 0 32px rgba(255,217,122,.10);}
  }

  .s0{animation:riseIn .55s cubic-bezier(.22,1,.36,1) both 0ms;}
  .s1{animation:riseIn .55s cubic-bezier(.22,1,.36,1) both 80ms;}
  .s2{animation:riseIn .55s cubic-bezier(.22,1,.36,1) both 160ms;}
  .s3{animation:riseIn .55s cubic-bezier(.22,1,.36,1) both 240ms;}
  .s4{animation:riseIn .55s cubic-bezier(.22,1,.36,1) both 320ms;}
  .s5{animation:riseIn .55s cubic-bezier(.22,1,.36,1) both 400ms;}

  .lbtn{
    display:flex;align-items:center;gap:12px;width:100%;padding:13px 18px;
    background:var(--w03);border:1px solid var(--w10);border-radius:var(--r2);
    color:var(--w60);font-family:var(--sans);font-size:13px;font-weight:400;
    cursor:pointer;text-align:left;transition:all .18s ease;
    animation:borderGlow 4.5s ease-in-out infinite;position:relative;overflow:hidden;
  }
  .lbtn:hover{background:var(--w06);border-color:rgba(255,255,255,.25);color:var(--w);transform:translateX(3px);animation:none;}
  .lbtn:active{transform:translateX(0);}
  .lbtn:disabled{opacity:.4;cursor:not-allowed;transform:none!important;}

  .lbtn-gold{border-color:rgba(255,217,122,.2);color:var(--gold);animation:borderGlowGold 4.5s ease-in-out infinite;}
  .lbtn-gold:hover{border-color:rgba(255,217,122,.45);color:var(--gold);animation:none;}

  /* Override RainbowKit ConnectButton to match our design */
  .wallet-wrap 
  .wallet-wrap button:hover{
    background:var(--w06)!important;
    border-color:rgba(255,217,122,.45)!important;
    transform:translateX(3px)!important;
    animation:none!important;
  }

  .div-line{display:flex;align-items:center;gap:12px;font-family:var(--mono);font-size:9px;color:var(--w30);letter-spacing:2px;}
  .div-line::before,.div-line::after{content:'';flex:1;height:1px;background:var(--w10);}

  .glass{background:rgba(4,4,6,.82);backdrop-filter:blur(28px) saturate(1.3);-webkit-backdrop-filter:blur(28px) saturate(1.3);}

  .ticker-wrap{overflow:hidden;}
  .ticker-inner{display:flex;gap:48px;white-space:nowrap;width:max-content;animation:ticker 38s linear infinite;}

  .email-input{
    width:100%;padding:11px 16px;background:var(--w03);border:1px solid var(--w10);
    border-radius:var(--r2);color:var(--w90);font-family:var(--sans);font-size:13px;font-weight:300;
    outline:none;transition:border-color .18s,box-shadow .18s;
  }
  .email-input:focus{border-color:rgba(255,255,255,.25);box-shadow:0 0 0 3px rgba(255,255,255,.04);}
  .email-input::placeholder{color:var(--w30);}
  .err-msg{font-size:11px;color:var(--red);font-weight:300;margin-top:6px;animation:fadeIn .2s ease;}
  .ok-msg{font-size:11px;color:var(--green);font-weight:300;margin-top:6px;animation:fadeIn .2s ease;}

  @media(max-width:700px){.left-col{display:none!important;}.right-col{width:100%!important;border-left:none!important;}}
`


function DashboardMockup() {
  return (
    <div style={{position:'fixed',inset:0,zIndex:0,background:'#040406',overflow:'hidden',fontFamily:'var(--sans)'}}>
      {/* Top bar */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:56,borderBottom:'1px solid rgba(255,255,255,0.06)',
        display:'flex',alignItems:'center',padding:'0 24px',gap:16}}>
        <div style={{width:90,height:10,borderRadius:4,background:'rgba(255,255,255,0.18)'}}/>
        <div style={{flex:1}}/>
        {[70,55,45].map((w,i)=><div key={i} style={{width:w,height:7,borderRadius:4,background:'rgba(255,255,255,0.07)'}}/>)}
        <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(255,255,255,0.09)'}}/>
      </div>
      {/* Stats */}
      <div style={{position:'absolute',top:70,left:24,right:24,display:'flex',gap:10}}>
        {[['$2.4M','Volume 24h'],['847','Signals'],['94%','Accuracy'],['12','Live']].map(([v,l],i)=>(
          <div key={i} style={{flex:1,padding:'12px 14px',background:'rgba(255,255,255,0.03)',borderRadius:10,border:'1px solid rgba(255,255,255,0.05)'}}>
            <div style={{fontSize:16,fontWeight:500,color:'rgba(255,255,255,0.6)',fontFamily:'monospace'}}>{v}</div>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.2)',marginTop:2,letterSpacing:'0.05em'}}>{l}</div>
          </div>
        ))}
      </div>
      {/* Pills */}
      <div style={{position:'absolute',top:148,left:24,display:'flex',gap:7}}>
        {['All','✦ Opportunities','▲ Undervalued','▼ Overvalued'].map((f,i)=>(
          <div key={i} style={{padding:'4px 12px',borderRadius:100,fontSize:9,
            background:i===0?'rgba(255,255,255,0.07)':'transparent',
            border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.3)'}}>{f}</div>
        ))}
      </div>
      {/* Rows */}
      {[
        {q:'Will Trump win 2024?',p:72,s:'STRONG BUY',v:'$2.1M',c:'POLITICS',g:'+14%'},
        {q:'Fed rate cut before June?',p:38,s:'BUY',v:'$890K',c:'ECONOMICS',g:'+8%'},
        {q:'SpaceX Starship orbit?',p:61,s:'SELL',v:'$445K',c:'TECH',g:'-6%'},
        {q:'Ukraine ceasefire 2025?',p:29,s:'STRONG BUY',v:'$3.2M',c:'POLITICS',g:'+18%'},
        {q:'Apple Vision Pro 2?',p:55,s:'BUY',v:'$210K',c:'TECH',g:'+5%'},
        {q:'Bitcoin halving impact?',p:88,s:'SELL',v:'$1.8M',c:'CRYPTO',g:'-9%'},
        {q:'WHO pandemic treaty?',p:44,s:'BUY',v:'$320K',c:'HEALTH',g:'+7%'},
        {q:'Nvidia stock split 2025?',p:33,s:'STRONG BUY',v:'$560K',c:'TECH',g:'+12%'},
      ].map((m,i)=>(
        <div key={i} style={{
          position:'absolute',left:24,right:24,top:182+i*50,
          padding:'11px 14px',background:'rgba(255,255,255,0.02)',
          borderRadius:9,border:'1px solid rgba(255,255,255,0.04)',
          display:'flex',alignItems:'center',gap:10,
        }}>
          <div style={{width:20,height:20,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.08)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:'rgba(255,255,255,0.2)',fontFamily:'monospace'}}>{i+1}</div>
          <div style={{flex:1,fontSize:11,color:'rgba(255,255,255,0.45)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.q}</div>
          <div style={{fontSize:9,color:'rgba(255,255,255,0.2)',width:48}}>{m.c}</div>
          <div style={{fontSize:10,fontFamily:'monospace',color:'rgba(255,255,255,0.35)',width:30}}>{m.p}%</div>
          <div style={{fontSize:8,fontWeight:700,padding:'2px 7px',borderRadius:5,
            background:m.s.includes('BUY')?'rgba(127,255,212,0.06)':'rgba(255,128,128,0.06)',
            color:m.s.includes('BUY')?'rgba(127,255,212,0.6)':'rgba(255,128,128,0.6)',
            border:`1px solid ${m.s.includes('BUY')?'rgba(127,255,212,0.12)':'rgba(255,128,128,0.12)'}`}}>{m.s}</div>
          <div style={{fontSize:9,color:m.g.startsWith('+')?'rgba(127,255,212,0.5)':'rgba(255,128,128,0.5)',fontFamily:'monospace',width:32,textAlign:'right'}}>{m.g}</div>
          <div style={{fontSize:9,color:'rgba(255,255,255,0.15)',width:40,textAlign:'right'}}>{m.v}</div>
        </div>
      ))}
    </div>
  )
}

function BlurOverlay() {
  return (
    <div style={{position:'fixed',inset:0,zIndex:1,pointerEvents:'none',
      backdropFilter:'blur(14px) brightness(0.6)',
      background:'rgba(4,4,6,0.35)',
    }}/>
  )
}

function ShaderLinesBg() {
  const containerRef = useRef(null)
  const sceneRef = useRef({ camera:null, scene:null, renderer:null, uniforms:null, animationId:null })

  useEffect(()=>{
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/89/three.min.js'
    script.onload = () => {
      const container = containerRef.current
      if (!container || !window.THREE) return
      const THREE = window.THREE
      container.innerHTML = ''
      const camera = new THREE.Camera()
      camera.position.z = 1
      const scene = new THREE.Scene()
      const geometry = new THREE.PlaneBufferGeometry(2, 2)
      const uniforms = {
        time:       { type:'f',  value:1.0 },
        resolution: { type:'v2', value:new THREE.Vector2() },
      }
      const vertexShader = `void main() { gl_Position = vec4(position, 1.0); }`
      const fragmentShader = `
        #define TWO_PI 6.2831853072
        precision highp float;
        uniform vec2 resolution;
        uniform float time;
        float random(in float x){ return fract(sin(x)*1e4); }
        float random(vec2 st){ return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123); }
        void main(void) {
          vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
          vec2 fMosaicScal = vec2(4.0, 2.0);
          vec2 vScreenSize = vec2(256.0,256.0);
          uv.x = floor(uv.x * vScreenSize.x / fMosaicScal.x) / (vScreenSize.x / fMosaicScal.x);
          uv.y = floor(uv.y * vScreenSize.y / fMosaicScal.y) / (vScreenSize.y / fMosaicScal.y);
          float t = time*0.06+random(uv.x)*0.4;
          float lineWidth = 0.0008;
          vec3 color = vec3(0.0);
          for(int j = 0; j < 3; j++){
            for(int i=0; i < 5; i++){
              color[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*1.0 - length(uv));
            }
          }
          gl_FragColor = vec4(color[2],color[1],color[0],1.0);
        }
      `
      const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
      scene.add(new THREE.Mesh(geometry, material))
      const renderer = new THREE.WebGLRenderer()
      renderer.setPixelRatio(window.devicePixelRatio)
      container.appendChild(renderer.domElement)
      sceneRef.current = { camera, scene, renderer, uniforms, animationId:null }
      const resize = () => {
        const rect = container.getBoundingClientRect()
        renderer.setSize(rect.width, rect.height)
        uniforms.resolution.value.x = renderer.domElement.width
        uniforms.resolution.value.y = renderer.domElement.height
      }
      resize()
      window.addEventListener('resize', resize)
      const animate = () => {
        sceneRef.current.animationId = requestAnimationFrame(animate)
        uniforms.time.value += 0.05
        renderer.render(scene, camera)
      }
      animate()
    }
    document.head.appendChild(script)
    return () => {
      if (sceneRef.current.animationId) cancelAnimationFrame(sceneRef.current.animationId)
      if (sceneRef.current.renderer) sceneRef.current.renderer.dispose()
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [])

  return <div ref={containerRef} style={{position:'fixed',inset:0,zIndex:0,background:'#000',overflow:'hidden'}}/>
}

function DotsBg() {
  const canvasRef = useRef(null)

  useEffect(()=>{
    const canvas = canvasRef.current
    if (!canvas) return
    let gl = canvas.getContext('webgl2',{alpha:true})
    const isGL2 = !!gl
    if (!gl) gl = canvas.getContext('webgl',{alpha:true}) || canvas.getContext('experimental-webgl',{alpha:true})
    if (!gl) return

    const vert = isGL2
      ? `#version 300 es
in vec2 pos;
void main(){ gl_Position=vec4(pos,0,1); }`
      : `attribute vec2 pos;
void main(){ gl_Position=vec4(pos,0,1); }`
    const frag = isGL2
      ? `#version 300 es
precision mediump float;
uniform float u_time; uniform vec2 u_res;
out vec4 fragColor;
float rnd(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void main(){
  float sz=18.0,dot=3.5;
  vec2 st=gl_FragCoord.xy;
  vec2 cell=floor(st/sz); vec2 local=fract(st/sz);
  float r=rnd(cell);
  float t=floor(u_time*0.3+r*10.0);
  float alpha=rnd(cell+t)*0.7+0.15;
  float inside=step(local.x,dot/sz)*step(local.y,dot/sz);
  vec2 center=u_res*0.5/sz;
  float dist=length(center-cell);
  float reveal=clamp(u_time*0.5-dist*0.018,0.0,1.0);
  fragColor=vec4(1.0,1.0,1.0,alpha*inside*reveal);
  fragColor.rgb*=fragColor.a;
}`
      : `precision mediump float;
uniform float u_time; uniform vec2 u_res;
float rnd(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void main(){
  float sz=18.0,dot=3.5;
  vec2 st=gl_FragCoord.xy;
  vec2 cell=floor(st/sz); vec2 local=fract(st/sz);
  float r=rnd(cell); float t=floor(u_time*0.3+r*10.0);
  float alpha=rnd(cell+t)*0.7+0.15;
  float inside=step(local.x,dot/sz)*step(local.y,dot/sz);
  vec2 center=u_res*0.5/sz; float dist=length(center-cell);
  float reveal=clamp(u_time*0.5-dist*0.018,0.0,1.0);
  gl_FragColor=vec4(1.0,1.0,1.0,alpha*inside*reveal);
  gl_FragColor.rgb*=gl_FragColor.a;
}`

    function mk(type,src){
      const sh=gl.createShader(type); gl.shaderSource(sh,src); gl.compileShader(sh)
      if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh))
      return sh
    }
    const prog=gl.createProgram()
    gl.attachShader(prog,mk(gl.VERTEX_SHADER,vert))
    gl.attachShader(prog,mk(gl.FRAGMENT_SHADER,frag))
    gl.linkProgram(prog)
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){console.error(gl.getProgramInfoLog(prog));return}
    gl.useProgram(prog)
    const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf)
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW)
    const loc=gl.getAttribLocation(prog,'pos')
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0)
    const resLoc=gl.getUniformLocation(prog,'u_res')
    const timeLoc=gl.getUniformLocation(prog,'u_time')
    function resize(){
      canvas.width=innerWidth*devicePixelRatio; canvas.height=innerHeight*devicePixelRatio
      canvas.style.width=innerWidth+'px'; canvas.style.height=innerHeight+'px'
      gl.viewport(0,0,canvas.width,canvas.height)
      gl.uniform2f(resLoc,canvas.width,canvas.height)
    }
    resize(); window.addEventListener('resize',resize)
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA)
    let raf,t=0
    function draw(){ raf=requestAnimationFrame(draw); t+=0.016
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(timeLoc,t); gl.drawArrays(gl.TRIANGLES,0,3)
    }
    draw()
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize',resize) }
  },[])

  return <canvas ref={canvasRef} style={{position:'fixed',inset:0,zIndex:2,display:'block',pointerEvents:'none'}}/>
}


export default function LoginPage({ onEnter, splashOnly, splashDone }) {
  const { login } = usePrivy()
  const { setVisible: openSolanaModal } = useWalletModal()
  // Show splash if not done yet
  const showSplash = !splashDone

  // ── Splash ──────────────────────────────────────────────────────────────
  if (showSplash) return (
    <>
      <style>{css}</style>
      <ShaderLinesBg/>
      <div style={{
        position:'fixed',inset:0,zIndex:10,
        display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',
        gap:28,
      }}>
        <div style={{
          fontSize:11,letterSpacing:'0.35em',color:'rgba(255,255,255,0.3)',
          textTransform:'uppercase',fontWeight:500,
          animation:'fadeIn 1.2s ease both 0.3s',opacity:0,
        }}>Polyalpha · Prediction Markets Scanner</div>

        <h1 style={{
          fontFamily:'var(--sans)',fontWeight:300,
          fontSize:'clamp(44px,7vw,90px)',
          color:'var(--w)',letterSpacing:'-0.02em',
          textAlign:'center',lineHeight:1.05,
          animation:'riseIn 1s cubic-bezier(.22,1,.36,1) both 0.5s',opacity:0,
        }}>Get Started<br/>For Free</h1>

        <LiquidButton
          onClick={() => onEnter?.()}
          style={{marginTop:8, animation:'riseIn .8s cubic-bezier(.22,1,.36,1) both 0.15s', opacity:0, position:'relative'}}
        >Enter →</LiquidButton>
      </div>
    </>
  )

  // ── Login ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>

      {/* Wave background */}
      <div style={{position:'fixed',inset:0,zIndex:0}}>
        <Waves
          strokeColor="rgba(255,255,255,0.2)"
          backgroundColor="#040406"
          pointerSize={0.6}
        />
      </div>

      {/* Connect button — centered */}
      <div style={{
        position:'fixed',inset:0,zIndex:10,
        display:'flex',alignItems:'center',justifyContent:'center',
      }}>
        <button
          onClick={login}
          style={{
            background:'transparent',
            border:'none',outline:'none',
            cursor:'pointer',
            color:'rgba(255,255,255,0.9)',
            fontFamily:'var(--sans)',
            fontSize:13,fontWeight:300,
            letterSpacing:'0.35em',
            textTransform:'uppercase',
            transition:'all .3s ease',
            animation:'fadeIn 1.5s ease both 0.5s',
            opacity:0,
          }}
          onMouseEnter={e=>{e.currentTarget.style.letterSpacing='0.5em';e.currentTarget.style.color='#fff'}}
          onMouseLeave={e=>{e.currentTarget.style.letterSpacing='0.35em';e.currentTarget.style.color='rgba(255,255,255,0.9)'}}
        >
          Connect
        </button>
      </div>
    </>
  )
}
