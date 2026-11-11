import {fitCanvas,reduced,tint} from './lattice.js';
const tau=Math.PI*2;
function sphere(ctx,x,y,r,hi,mid,lo){
 const g=ctx.createRadialGradient(x-r*.32,y-r*.4,r*.05,x+r*.08,y+r*.12,r*1.14);
 g.addColorStop(0,hi);g.addColorStop(.36,mid);g.addColorStop(1,lo);
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,tau);ctx.fill();
}
function ringPoint(a,r,tilt,turn){
 const x=Math.cos(a)*r,y=Math.sin(a)*r*Math.cos(tilt);
 return [x*Math.cos(turn)-y*Math.sin(turn),x*Math.sin(turn)+y*Math.cos(turn),Math.sin(a)*r*Math.sin(tilt)];
}
export function drawModel(canvas,e,now,dark=false){
 const frame=fitCanvas(canvas);if(!frame)return;const {ctx,width:w,height:h}=frame;
 ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(w*.5,h*.495);
 const size=Math.min(w*.42,h*.46),clock=reduced.matches?.32:now*.00016;
 const shadow=ctx.createRadialGradient(0,0,0,0,0,size*.46);
 shadow.addColorStop(0,dark?'#bded7b2c':'#687e463c');shadow.addColorStop(1,'transparent');
 ctx.fillStyle=shadow;ctx.fillRect(-size,-size,size*2,size*2);
 const parts=[];
 for(let s=0;s<e.shells.length;s++){
  const count=e.shells[s],frac=(s+1)/e.shells.length;
  const r=size*(.44+.57*frac),tilt=.79+.28*Math.sin(s*1.3+.5),turn=-.58+s*.9+Math.sin(clock*.25)*.1;
  ctx.lineWidth=dark?1.25:1.1;ctx.strokeStyle=dark?'#c7dfb58c':'#586a50aa';
  for(let j=0;j<96;j++){
   const a=ringPoint(j/96*tau,r,tilt,turn),b=ringPoint((j+1)/96*tau,r,tilt,turn);
   parts.push({z:(a[2]+b[2])/2,draw:()=>{ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();}});
  }
  for(let j=0;j<count;j++){
   const [x,y,z]=ringPoint(j*tau/count+clock*(1-.055*s)+s*1.53+.9,r,tilt,turn);
   const er=Math.max(1.7,size*(e.number<15?.046:.029));parts.push({z,draw:()=>sphere(ctx,x,y,er,'#f7ffe9','#9dbb61','#3e5a30')});
  }
 }
 // A compact particle cluster illustrates the nucleus, independently of isotope.
 const n=e.theoretical?1:Math.min(56,Math.max(1,Math.round(parseFloat(e.mass.replace(/[\[\]]/g,''))))),nr=size*(n===1?.12:.18),pr=n===1?nr:nr*(1.26/Math.cbrt(n));
 for(let k=0;k<n;k++){
  const u=1-2*(k+.5)/n,a=k*Math.PI*(3-Math.sqrt(5))+clock*.25,rr=nr*Math.sqrt(1-u*u);
  const x=n===1?0:rr*Math.cos(a),y=n===1?0:u*nr,z=rr*Math.sin(a);const pale=k%2===0;
  parts.push({z,draw:()=>sphere(ctx,x,y,pr,pale?'#eef8d6':'#c7d3c2',pale?'#acc675':'#718575',pale?'#455e3a':'#253b33')});
 }
 parts.sort((a,b)=>a.z-b.z).forEach(p=>p.draw());ctx.restore();
}
export function drawWalls(canvas,color){
 const frame=fitCanvas(canvas);if(!frame)return;const {ctx,width:w,height:h}=frame;
 // Perspective projection of the four inward-facing sides and rear face of an open box.
 const focal=h*.9,cx=w*.44,cy=h*.46,halfWidth=w/h*.66,halfHeight=.66;
 const project=([x,y,z])=>[cx+x*focal/z,cy+y*focal/z];
 const face=(quad,mult)=>{
  const p=quad.map(project);ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=tint(color,mult,4);ctx.fill();
  ctx.lineWidth=.8;ctx.strokeStyle=tint(color,mult+.1,5);ctx.stroke();
  for(let axis=0;axis<2;axis++)for(let i=1;i<12;i++){
   const t=i/12,from=quad[0],to=quad[axis?3:1],other=quad[axis?1:3],end=quad[2];
   const interp=(a,b)=>a.map((v,j)=>v+(b[j]-v)*t);const a=project(interp(from,to)),b=project(interp(other,end));
   ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
  }
 };
 const section=z=>[[-halfWidth,-halfHeight,z],[halfWidth,-halfHeight,z],[halfWidth,halfHeight,z],[-halfWidth,halfHeight,z]];
 const a=section(.32),b=section(1.85);face(b,.12);
 for(let i=0;i<4;i++){const j=(i+1)%4;face([a[i],a[j],b[j],b[i]],[.15,.19,.23,.17][i]);}
}
