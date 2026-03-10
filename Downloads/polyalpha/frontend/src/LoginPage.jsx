import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient.js'
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
  #lp-canvas{position:fixed;inset:0;z-index:0;pointer-events:none;}

  @keyframes riseIn{from{opacity:0;transform:translateY(20px) scale(.97);}to{opacity:1;transform:translateY(0) scale(1);}}
  @keyframes slideR{from{opacity:0;transform:translateX(24px);}to{opacity:1;transform:translateX(0);}}
  @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
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
  .wallet-wrap button{
    background:var(--w03)!important;
    border:1px solid rgba(255,217,122,.2)!important;
    border-radius:var(--r2)!important;
    color:var(--gold)!important;
    font-family:var(--sans)!important;
    font-size:13px!important;
    font-weight:400!important;
    width:100%!important;
    padding:13px 18px!important;
    justify-content:flex-start!important;
    gap:12px!important;
    animation:borderGlowGold 4.5s ease-in-out infinite!important;
    transition:all .18s!important;
  }
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

function Stars() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas=ref.current; if(!canvas) return
    const ctx=canvas.getContext('2d'); let raf
    function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight}
    resize(); window.addEventListener('resize',resize)
    const STARS=Array.from({length:260},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.1+.2,speed:Math.random()*.35+.08,phase:Math.random()*Math.PI*2,featured:Math.random()<.04}))
    let t=0
    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);t+=.005
      for(const s of STARS){
        const op=s.featured?.4+.6*Math.abs(Math.sin(t*s.speed+s.phase)):.1+.25*Math.abs(Math.sin(t*s.speed+s.phase))
        const x=s.x*canvas.width,y=s.y*canvas.height,r=s.featured?s.r*2:s.r
        if(s.featured){const arm=r*5;ctx.save();ctx.globalAlpha=op*.6;ctx.strokeStyle='#a8c4ff';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(x-arm,y);ctx.lineTo(x+arm,y);ctx.moveTo(x,y-arm);ctx.lineTo(x,y+arm);ctx.stroke();ctx.restore()}
        ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=s.featured?`rgba(168,196,255,${op})`:`rgba(255,255,255,${op})`;ctx.fill()
      }
      raf=requestAnimationFrame(draw)
    }
    draw()
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize)}
  },[])
  return <canvas id="lp-canvas" ref={ref}/>
}

const TICKS=[
  {q:'BTC > $120k',poly:'72%',ai:'57%',v:'SHORT'},{q:'ETH ETF',poly:'29%',ai:'60%',v:'LONG'},
  {q:'AAPL AR',poly:'55%',ai:'33%',v:'SELL'},{q:'US Unemployment',poly:'18%',ai:'37%',v:'LONG'},
  {q:'BTC/YES',poly:'34%',ai:'58%',v:'LONG'},{q:'Fed Cut Q2',poly:'61%',ai:'43%',v:'SHORT'},
  {q:'Trump AI Order',poly:'47%',ai:'68%',v:'LONG'},{q:'GPT-5',poly:'72%',ai:'57%',v:'SHORT'},
]
function Ticker() {
  const items=[...TICKS,...TICKS]
  const col=v=>v==='LONG'?'var(--green)':v==='SHORT'?'var(--red)':'var(--gold)'
  return (
    <div className="ticker-wrap" style={{borderBottom:'1px solid var(--w06)',height:28,background:'rgba(4,4,6,.6)',flexShrink:0}}>
      <div className="ticker-inner" style={{height:'100%',alignItems:'center'}}>
        {items.map((t,i)=>(
          <span key={i} style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--w30)',letterSpacing:.5,display:'flex',alignItems:'center',gap:8}}>
            <span style={{color:'var(--w60)',fontWeight:400}}>{t.q}</span>
            <span>·</span><span>{t.poly}</span><span style={{color:'var(--w30)'}}>→</span><span>{t.ai}</span>
            <span>·</span><span style={{color:col(t.v),fontWeight:600}}>{t.v}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function OrbitLogo() {
  return (
    <div style={{position:'relative',width:44,height:44,flexShrink:0}}>
      <div style={{position:'absolute',inset:0,borderRadius:'50%',border:'1px solid rgba(168,196,255,.25)',animation:'orbit 12s linear infinite'}}>
        <div style={{position:'absolute',top:-2.5,left:'50%',transform:'translateX(-50%)',width:5,height:5,borderRadius:'50%',background:'rgba(168,196,255,.8)',boxShadow:'0 0 8px rgba(168,196,255,.6)'}}/>
      </div>
      <div style={{position:'absolute',inset:4,borderRadius:'50%',border:'1px solid rgba(255,255,255,.08)',animation:'orbit2 8s linear infinite'}}>
        <div style={{position:'absolute',bottom:-2,left:'50%',transform:'translateX(-50%)',width:4,height:4,borderRadius:'50%',background:'rgba(255,217,122,.6)',boxShadow:'0 0 6px rgba(255,217,122,.4)'}}/>
      </div>
      <div style={{position:'absolute',inset:0,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,.04)',fontSize:18,color:'var(--w)'}}>◈</div>
    </div>
  )
}

function DashPreview() {
  const rows=[
    {q:'Will Bitcoin exceed $120K before July 2025?',cat:'CRYPTO',p:.72,diff:.15},
    {q:'Will the Fed cut rates in Q2 2025?',cat:'ECONOMICS',p:.43,diff:.18},
    {q:'Will Trump sign executive order on AI by June?',cat:'POLITICS',p:.61,diff:.22},
    {q:'Will OpenAI release GPT-5 before August 2025?',cat:'TECH',p:.55,diff:.13},
    {q:'Will Ethereum ETF inflows exceed $2B in Q2?',cat:'CRYPTO',p:.38,diff:.20},
    {q:'Will US unemployment exceed 5% by end of 2025?',cat:'ECONOMICS',p:.29,diff:.16},
    {q:'Will Apple announce AR glasses at WWDC 2025?',cat:'TECH',p:.44,diff:.19},
  ]
  const catC={CRYPTO:'rgba(168,196,255,.7)',ECONOMICS:'rgba(255,217,122,.7)',POLITICS:'rgba(255,128,128,.7)',TECH:'rgba(127,255,212,.7)'}
  return (
    <div style={{padding:'0 28px'}}>
      {rows.map((r,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',marginBottom:6,borderRadius:14,background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.04)'}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:'rgba(255,255,255,.7)',marginBottom:4,lineHeight:1.4}}>{r.q}</div>
            <span style={{fontSize:8,color:catC[r.cat]||'rgba(255,255,255,.3)',fontWeight:600,letterSpacing:.5}}>{r.cat}</span>
          </div>
          <div style={{textAlign:'right',flexShrink:0}}>
            <div style={{fontFamily:'var(--mono)',fontSize:11,color:'rgba(255,255,255,.5)'}}>{Math.round(r.p*100)}%</div>
            <div style={{fontFamily:'var(--mono)',fontSize:9,color:r.diff>.18?'rgba(255,217,122,.8)':'rgba(255,255,255,.2)',marginTop:2}}>Δ{Math.round(r.diff*100)}%</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatCount({label,value,color}) {
  return (
    <div>
      <div style={{fontFamily:'var(--mono)',fontSize:22,fontWeight:300,color,lineHeight:1,marginBottom:4}}>{value}</div>
      <div style={{fontSize:9,color:'var(--w30)',fontWeight:600,letterSpacing:1.5,textTransform:'uppercase'}}>{label}</div>
    </div>
  )
}

const IcoGoogle=()=>(
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)
const IcoGithub=()=>(
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
)
const IcoMail=()=>(
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)
const IcoWallet=()=>(
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
    <path d="M16 3H8L4 7h16l-4-4z"/>
    <circle cx="17" cy="14" r="1.5" fill="currentColor"/>
  </svg>
)


/* ── Wallet Buttons ── */
function SolanaWalletBtn({busy}) {
  const { setVisible } = useWalletModal()
  return (
    <button className="lbtn lbtn-gold" onClick={()=>setVisible(true)} disabled={busy}>
      <IcoWallet/>
      <span style={{flex:1}}>Solana Wallet</span>
      <span style={{fontSize:9,color:'rgba(127,255,212,0.5)',background:'rgba(127,255,212,0.08)',border:'1px solid rgba(127,255,212,0.15)',borderRadius:100,padding:'1px 6px'}}>SOL</span>
      <span style={{fontSize:10}}>→</span>
    </button>
  )
}

function EVMWalletBtn({busy}) {
  return (
    <ConnectButton.Custom>
      {({openConnectModal})=>(
        <button className="lbtn" onClick={openConnectModal} disabled={busy} style={{borderColor:'rgba(168,196,255,.2)',color:'var(--ice)'}}>
          <IcoWallet/>
          <span style={{flex:1}}>EVM Wallet</span>
          <span style={{fontSize:9,color:'rgba(168,196,255,0.5)',background:'rgba(168,196,255,0.08)',border:'1px solid rgba(168,196,255,0.15)',borderRadius:100,padding:'1px 6px'}}>ETH</span>
          <span style={{fontSize:10}}>→</span>
        </button>
      )}
    </ConnectButton.Custom>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const [loading, setLoading]     = useState(null)
  const [email, setEmail]         = useState('')
  const [showEmail, setShowEmail] = useState(false)
  const [msg, setMsg]             = useState(null)
  const [stats, setStats]         = useState({users:0,signals:0,markets:0})

  useEffect(()=>{
    const targets={users:1247,signals:8934,markets:312}
    const dur=1600,start=Date.now()
    const tick=()=>{
      const p=Math.min(1,(Date.now()-start)/dur),e=1-Math.pow(1-p,3)
      setStats({users:Math.round(targets.users*e),signals:Math.round(targets.signals*e),markets:Math.round(targets.markets*e)})
      if(p<1) requestAnimationFrame(tick)
    }
    setTimeout(()=>requestAnimationFrame(tick),600)
  },[])

  const loginWith=async(provider)=>{
    setLoading(provider);setMsg(null)
    console.log('Trying OAuth with:', provider)
    const{data,error}=await supabase.auth.signInWithOAuth({
      provider,
      options:{redirectTo:window.location.origin},
    })
    console.log('OAuth result:', data, error)
    if(error){setMsg({type:'err',text:error.message});setLoading(null)}
  }

  const sendOTP=async()=>{
    if(!email.trim()) return
    setLoading('email');setMsg(null)
    const{error}=await supabase.auth.signInWithOtp({
      email:email.trim(),
      options:{emailRedirectTo:window.location.origin},
    })
    setLoading(null)
    if(error) setMsg({type:'err',text:error.message})
    else setMsg({type:'ok',text:'Magic link sent — check your inbox ✓'})
  }

  const busy=!!loading

  return (
    <>
      <style>{css}</style>
      <Stars/>

      <div style={{height:'100vh',display:'flex',flexDirection:'column',position:'relative',zIndex:1}}>
        <Ticker/>

        <div style={{flex:1,display:'flex',overflow:'hidden'}}>

          {/* LEFT */}
          <div className="left-col" style={{flex:1,position:'relative',overflow:'hidden',borderRight:'1px solid var(--w04)'}}>
            <div style={{position:'absolute',inset:0,zIndex:2,pointerEvents:'none',background:'linear-gradient(to right,transparent 55%,#040406 100%)'}}/>
            <div style={{position:'absolute',bottom:0,left:0,right:0,height:200,zIndex:2,pointerEvents:'none',background:'linear-gradient(to top,#040406 0%,transparent 100%)'}}/>
            <div style={{position:'absolute',top:0,left:0,right:0,height:60,zIndex:2,pointerEvents:'none',background:'linear-gradient(to bottom,#040406 0%,transparent 100%)'}}/>
            <div style={{padding:'32px 28px',opacity:.5,filter:'blur(.3px)'}}>
              <DashPreview/>
            </div>
            <div style={{position:'absolute',bottom:36,left:28,zIndex:3,animation:'riseIn .7s cubic-bezier(.22,1,.36,1) .5s both'}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:7,padding:'4px 12px',borderRadius:100,background:'rgba(127,255,212,.07)',border:'1px solid rgba(127,255,212,.15)',marginBottom:14}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',flexShrink:0,animation:'pulse 2s ease-in-out infinite',boxShadow:'0 0 5px var(--green)'}}/>
                <span style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--green)',letterSpacing:1.5,textTransform:'uppercase'}}>AI Signal Engine · Live</span>
              </div>
              <div style={{fontSize:30,fontWeight:300,lineHeight:1.3,color:'var(--w)',marginBottom:24,letterSpacing:-.4,maxWidth:380}}>
                Find mispriced markets<br/><span style={{color:'var(--w30)'}}>before the crowd does.</span>
              </div>
              <div style={{display:'flex',gap:40}}>
                <StatCount label="Users"             value={stats.users.toLocaleString()}   color="var(--w)"/>
                <StatCount label="Signals Generated" value={stats.signals.toLocaleString()} color="var(--ice)"/>
                <StatCount label="Alpha Markets"     value={stats.markets.toLocaleString()} color="var(--gold)"/>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="right-col glass" style={{width:368,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',padding:'36px 30px',borderLeft:'1px solid var(--w06)'}}>
            <div style={{width:'100%',animation:'slideR .55s cubic-bezier(.22,1,.36,1) .1s both'}}>

              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:36}}>
                <OrbitLogo/>
                <div>
                  <div style={{fontSize:19,fontWeight:600,color:'var(--w)',letterSpacing:.3,lineHeight:1}}>Polyalpha</div>
                  <div style={{fontSize:9,color:'var(--w30)',fontFamily:'var(--mono)',fontWeight:300,marginTop:5,letterSpacing:.5}}>prediction market scanner</div>
                </div>
              </div>

              <div className="s0" style={{marginBottom:30}}>
                <div style={{fontSize:24,fontWeight:300,color:'var(--w)',marginBottom:7,letterSpacing:-.3}}>Sign in</div>
                <div style={{fontSize:12,color:'var(--w30)',lineHeight:1.9,fontWeight:300}}>Scan live markets · Get AI signals in seconds</div>
              </div>

              {/* Social OAuth */}
              <div className="s1" style={{marginBottom:14}}>
                <div style={{fontSize:8,color:'var(--w30)',letterSpacing:2,marginBottom:10,fontFamily:'var(--mono)',textTransform:'uppercase'}}>Social</div>
                <div style={{display:'flex',flexDirection:'column',gap:7}}>
                  <button className="lbtn" onClick={()=>loginWith('google')} disabled={busy}>
                    {loading==='google'?<span style={{width:16,height:16,border:'1.5px solid rgba(255,255,255,.1)',borderTopColor:'rgba(255,255,255,.5)',borderRadius:'50%',animation:'spin .7s linear infinite',flexShrink:0}}/>:<IcoGoogle/>}
                    <span style={{flex:1}}>{loading==='google'?'Redirecting…':'Google'}</span>
                    <span style={{fontSize:10,color:'var(--w30)'}}>→</span>
                  </button>
                  <button className="lbtn" onClick={()=>loginWith('github')} disabled={busy}>
                    {loading==='github'?<span style={{width:16,height:16,border:'1.5px solid rgba(255,255,255,.1)',borderTopColor:'rgba(255,255,255,.5)',borderRadius:'50%',animation:'spin .7s linear infinite',flexShrink:0}}/>:<IcoGithub/>}
                    <span style={{flex:1}}>{loading==='github'?'Redirecting…':'GitHub'}</span>
                    <span style={{fontSize:10,color:'var(--w30)'}}>→</span>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="s2" style={{marginBottom:14}}><div className="div-line">or</div></div>

              {/* Wallet */}
              <div className="s3" style={{marginBottom:14}}>
                <div style={{fontSize:8,color:'var(--w30)',letterSpacing:2,marginBottom:10,fontFamily:'var(--mono)',textTransform:'uppercase'}}>Wallet</div>
                <div style={{display:'flex',flexDirection:'column',gap:7}}>
                  <SolanaWalletBtn busy={busy}/>
                  <EVMWalletBtn busy={busy}/>
                </div>
              </div>

              {/* Divider */}
              <div className="s3" style={{marginBottom:14}}><div className="div-line">or</div></div>

              {/* Email OTP */}
              <div className="s4" style={{marginBottom:28}}>
                <div style={{fontSize:8,color:'var(--w30)',letterSpacing:2,marginBottom:10,fontFamily:'var(--mono)',textTransform:'uppercase'}}>Email</div>
                {!showEmail
                  ?<button className="lbtn" onClick={()=>setShowEmail(true)} disabled={busy}>
                    <IcoMail/>
                    <span style={{flex:1}}>Continue with Email</span>
                    <span style={{fontSize:10,color:'var(--w30)'}}>→</span>
                  </button>
                  :<div>
                    <input className="email-input" type="email" placeholder="your@email.com"
                      value={email} onChange={e=>setEmail(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&sendOTP()} autoFocus style={{marginBottom:8}}/>
                    <button className="lbtn" onClick={sendOTP} disabled={busy||!email.trim()}
                      style={{justifyContent:'center',fontWeight:500,color:'var(--w)',background:'var(--w06)',borderColor:'rgba(255,255,255,.2)'}}>
                      {loading==='email'?<><span style={{width:14,height:14,border:'1.5px solid rgba(255,255,255,.1)',borderTopColor:'rgba(255,255,255,.5)',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>Sending…</>:'Send magic link ↗'}
                    </button>
                    {msg&&<div className={msg.type==='ok'?'ok-msg':'err-msg'}>{msg.text}</div>}
                  </div>
                }
              </div>

              <div className="s5" style={{borderTop:'1px solid var(--w06)',paddingTop:16,fontSize:9,color:'var(--w30)',lineHeight:2.2,fontFamily:'var(--mono)',fontWeight:300,letterSpacing:.3}}>
                Google & GitHub redirect instantly — no modal<br/>
                <span style={{color:'rgba(255,255,255,.12)'}}>Supabase Auth · RainbowKit · Non-custodial</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  )
}
