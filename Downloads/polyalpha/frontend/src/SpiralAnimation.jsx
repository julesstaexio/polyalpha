import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

class Vector2D {
  constructor(x, y) { this.x = x; this.y = y }
  static random(min, max) { return min + Math.random() * (max - min) }
}

class Vector3D {
  constructor(x, y, z) { this.x = x; this.y = y; this.z = z }
  static random(min, max) { return min + Math.random() * (max - min) }
}

class Star {
  constructor(cameraZ, cameraTravelDistance) {
    this.angle = Math.random() * Math.PI * 2
    this.distance = 30 * Math.random() + 15
    this.rotationDirection = Math.random() > 0.5 ? 1 : -1
    this.expansionRate = 1.2 + Math.random() * 0.8
    this.finalScale = 0.7 + Math.random() * 0.6
    this.dx = this.distance * Math.cos(this.angle)
    this.dy = this.distance * Math.sin(this.angle)
    this.spiralLocation = (1 - Math.pow(1 - Math.random(), 3.0)) / 1.3
    this.z = Vector2D.random(0.5 * cameraZ, cameraTravelDistance + cameraZ)
    const lerp = (s, e, t) => s * (1 - t) + e * t
    this.z = lerp(this.z, cameraTravelDistance / 2, 0.3 * this.spiralLocation)
    this.strokeWeightFactor = Math.pow(Math.random(), 2.0)
  }

  render(p, ctrl) {
    const spiralPos = ctrl.spiralPath(this.spiralLocation)
    const q = p - this.spiralLocation
    if (q <= 0) return
    const dp = ctrl.constrain(4 * q, 0, 1)
    const linearE = dp, elasticE = ctrl.easeOutElastic(dp), powerE = Math.pow(dp, 2)
    let easing
    if (dp < 0.3) easing = ctrl.lerp(linearE, powerE, dp / 0.3)
    else if (dp < 0.7) easing = ctrl.lerp(powerE, elasticE, (dp - 0.3) / 0.4)
    else easing = elasticE

    let sx, sy
    if (dp < 0.3) {
      sx = ctrl.lerp(spiralPos.x, spiralPos.x + this.dx * 0.3, easing / 0.3)
      sy = ctrl.lerp(spiralPos.y, spiralPos.y + this.dy * 0.3, easing / 0.3)
    } else if (dp < 0.7) {
      const mp = (dp - 0.3) / 0.4
      const cs = Math.sin(mp * Math.PI) * this.rotationDirection * 1.5
      const bx = spiralPos.x + this.dx * 0.3, by = spiralPos.y + this.dy * 0.3
      const tx = spiralPos.x + this.dx * 0.7, ty = spiralPos.y + this.dy * 0.7
      sx = ctrl.lerp(bx, tx, mp) + (-this.dy * 0.4 * cs) * mp
      sy = ctrl.lerp(by, ty, mp) + (this.dx * 0.4 * cs) * mp
    } else {
      const fp = (dp - 0.7) / 0.3
      const bx = spiralPos.x + this.dx * 0.7, by = spiralPos.y + this.dy * 0.7
      const td = this.distance * this.expansionRate * 1.5
      const sa = this.angle + 1.2 * this.rotationDirection * fp * Math.PI
      const tx = spiralPos.x + td * Math.cos(sa), ty = spiralPos.y + td * Math.sin(sa)
      sx = ctrl.lerp(bx, tx, fp); sy = ctrl.lerp(by, ty, fp)
    }

    const vx = (this.z - ctrl.cameraZ) * sx / ctrl.viewZoom
    const vy = (this.z - ctrl.cameraZ) * sy / ctrl.viewZoom
    let sm
    if (dp < 0.6) sm = 1.0 + dp * 0.2
    else { const t = (dp - 0.6) / 0.4; sm = 1.2 * (1 - t) + this.finalScale * t }
    ctrl.showProjectedDot(new Vector3D(vx, vy, this.z), 8.5 * this.strokeWeightFactor * sm)
  }
}

class AnimationController {
  constructor(canvas, ctx, dpr, size) {
    this.canvas = canvas; this.ctx = ctx; this.dpr = dpr; this.size = size
    this.time = 0
    this.changeEventTime = 0.32
    this.cameraZ = -400
    this.cameraTravelDistance = 3400
    this.startDotYOffset = 28
    this.viewZoom = 100
    this.numberOfStars = 5000
    this.trailLength = 80
    this.stars = []
    this.timeline = gsap.timeline({ repeat: -1 })
    const orig = Math.random
    let seed = 1234
    Math.random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
    for (let i = 0; i < this.numberOfStars; i++) this.stars.push(new Star(this.cameraZ, this.cameraTravelDistance))
    Math.random = orig
    this.timeline.to(this, { time: 1, duration: 15, repeat: -1, ease: 'none', onUpdate: () => this.render() })
  }

  ease(p, g) { return p < 0.5 ? 0.5 * Math.pow(2*p, g) : 1 - 0.5 * Math.pow(2*(1-p), g) }
  easeOutElastic(x) {
    if (x <= 0) return 0; if (x >= 1) return 1
    return Math.pow(2, -8*x) * Math.sin((x*8 - 0.75) * (2*Math.PI/4.5)) + 1
  }
  map(v, s1, e1, s2, e2) { return s2 + (e2-s2) * ((v-s1)/(e1-s1)) }
  constrain(v, mn, mx) { return Math.min(Math.max(v, mn), mx) }
  lerp(s, e, t) { return s*(1-t) + e*t }

  spiralPath(p) {
    p = this.constrain(1.2*p, 0, 1); p = this.ease(p, 1.8)
    const theta = 2*Math.PI*6*Math.sqrt(p), r = 170*Math.sqrt(p)
    return new Vector2D(r*Math.cos(theta), r*Math.sin(theta) + this.startDotYOffset)
  }

  rotate(v1, v2, p, orientation) {
    const mid = new Vector2D((v1.x+v2.x)/2, (v1.y+v2.y)/2)
    const dx = v1.x-mid.x, dy = v1.y-mid.y
    const angle = Math.atan2(dy, dx), o = orientation ? -1 : 1
    const r = Math.sqrt(dx*dx+dy*dy)
    const bounce = Math.sin(p*Math.PI)*0.05*(1-p)
    return new Vector2D(
      mid.x + r*(1+bounce)*Math.cos(angle + o*Math.PI*this.easeOutElastic(p)),
      mid.y + r*(1+bounce)*Math.sin(angle + o*Math.PI*this.easeOutElastic(p))
    )
  }

  showProjectedDot(pos, sizeFactor) {
    const t2 = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1)
    const newCameraZ = this.cameraZ + this.ease(Math.pow(t2, 1.2), 1.8) * this.cameraTravelDistance
    if (pos.z > newCameraZ) {
      const depth = pos.z - newCameraZ
      const x = this.viewZoom * pos.x / depth
      const y = this.viewZoom * pos.y / depth
      const sw = 400 * sizeFactor / depth
      this.ctx.lineWidth = sw
      this.ctx.beginPath()
      this.ctx.arc(x, y, 0.5, 0, Math.PI*2)
      this.ctx.fill()
    }
  }

  render() {
    const ctx = this.ctx
    ctx.fillStyle = 'black'; ctx.fillRect(0, 0, this.size, this.size)
    ctx.save(); ctx.translate(this.size/2, this.size/2)
    const t1 = this.constrain(this.map(this.time, 0, this.changeEventTime+0.25, 0, 1), 0, 1)
    const t2 = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1)
    ctx.rotate(-Math.PI * this.ease(t2, 2.7))
    for (let i = 0; i < this.trailLength; i++) {
      const f = this.map(i, 0, this.trailLength, 1.1, 0.1)
      const sw = (1.3*(1-t1) + 3.0*Math.sin(Math.PI*t1)) * f
      ctx.fillStyle = 'white'; ctx.lineWidth = sw
      const pos = this.spiralPath(t1 - 0.00015*i)
      const offset = new Vector2D(pos.x+5, pos.y+5)
      const rot = this.rotate(pos, offset, Math.sin(this.time*Math.PI*2)*0.5+0.5, i%2===0)
      ctx.beginPath(); ctx.arc(rot.x, rot.y, sw/2, 0, Math.PI*2); ctx.fill()
    }
    ctx.fillStyle = 'white'
    for (const star of this.stars) star.render(t1, this)
    if (this.time > this.changeEventTime) {
      const dy = this.cameraZ * this.startDotYOffset / this.viewZoom
      this.showProjectedDot(new Vector3D(0, dy, this.cameraTravelDistance), 2.5)
    }
    ctx.restore()
  }

  destroy() { this.timeline.kill() }
}

export function SpiralAnimation() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    const onResize = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const size = Math.max(dims.w, dims.h)
    canvas.width = size * dpr; canvas.height = size * dpr
    canvas.style.width = dims.w + 'px'; canvas.style.height = dims.h + 'px'
    ctx.scale(dpr, dpr)
    animRef.current = new AnimationController(canvas, ctx, dpr, size)
    return () => { if (animRef.current) { animRef.current.destroy(); animRef.current = null } }
  }, [dims])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}/>
    </div>
  )
}
