/* ---------- chess rules ---------- */
const col=p=>p<'a'?'w':'b',at=(b,r,f)=>r<0||r>7||f<0||f>7?'':b[r*8+f];
const ND=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]],KD=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const start=()=>({b:'rnbqkbnrpppppppp'.concat(' '.repeat(32),'PPPPPPPPRNBQKBNR').split('').map(c=>c==' '?'':c),turn:'w',c:'KQkq',ep:-1});
function attacked(b,sq,by){const r=sq>>3,f=sq&7,P=c=>by=='w'?c.toUpperCase():c,pr=by=='w'?r+1:r-1;
 for(const d of[-1,1])if(at(b,pr,f+d)==P('p'))return true;
 for(const[a,c]of ND)if(at(b,r+a,f+c)==P('n'))return true;
 for(const[a,c]of KD)if(at(b,r+a,f+c)==P('k'))return true;
 for(let i=0;i<8;i++){const[a,c]=KD[i];let y=r+a,x=f+c;while(y>=0&&y<8&&x>=0&&x<8){const p=b[y*8+x];if(p){if(p==P('q')||p==P(i<4?'r':'b'))return true;break}y+=a;x+=c}}
 return false}
function gen(s){const{b,turn}=s,o=[],opp=turn=='w'?'b':'w';
 for(let i=0;i<64;i++){const p=b[i];if(!p||col(p)!=turn)continue;const t=p.toLowerCase(),r=i>>3,f=i&7;
  const add=(to,x={})=>o.push({f:i,t:to,...x});
  if(t=='p'){const d=turn=='w'?-1:1,st=turn=='w'?6:1,la=turn=='w'?0:7,one=i+d*8,pm=to=>(to>>3)==la?{p:1}:{};
   if(!b[one]){add(one,pm(one));if(r==st&&!b[one+d*8])add(one+d*8)}
   for(const dx of[-1,1]){const nf=f+dx;if(nf<0||nf>7)continue;const to=(r+d)*8+nf;
    if(b[to]&&col(b[to])!=turn)add(to,pm(to));else if(to==s.ep)add(to,{e:1})}}
  else if(t=='n'||t=='k'){for(const[a,c]of t=='n'?ND:KD){const y=r+a,x=f+c;if(y<0||y>7||x<0||x>7)continue;const q=b[y*8+x];if(!q||col(q)!=turn)add(y*8+x)}
   if(t=='k'){const h=turn=='w'?56:0,K=turn=='w'?'K':'k',Q=turn=='w'?'Q':'q',R=turn=='w'?'R':'r';
    if(i==h+4&&!attacked(b,h+4,opp)){
     if(s.c.includes(K)&&!b[h+5]&&!b[h+6]&&b[h+7]==R&&!attacked(b,h+5,opp)&&!attacked(b,h+6,opp))add(h+6);
     if(s.c.includes(Q)&&!b[h+1]&&!b[h+2]&&!b[h+3]&&b[h]==R&&!attacked(b,h+3,opp)&&!attacked(b,h+2,opp))add(h+2)}}}
  else for(let k=t=='b'?4:0;k<(t=='r'?4:8);k++){const[a,c]=KD[k];let y=r+a,x=f+c;while(y>=0&&y<8&&x>=0&&x<8){const q=b[y*8+x];if(!q)add(y*8+x);else{if(col(q)!=turn)add(y*8+x);break}y+=a;x+=c}}}
 return o.flatMap(m=>m.p?['q','r','b','n'].map(p=>({...m,p})):[m])}
const RM={60:'KQ',4:'kq',63:'K',56:'Q',7:'k',0:'q'};
function apply(s,m){const b=s.b.slice(),p=b[m.f],t=p.toLowerCase();b[m.t]=p;b[m.f]='';
 if(m.e)b[(m.f>>3)*8+(m.t&7)]='';
 if(m.p)b[m.t]=s.turn=='w'?m.p.toUpperCase():m.p;
 if(t=='k'&&Math.abs(m.t-m.f)==2){const a=m.t>m.f?m.f+3:m.f-4;b[m.t>m.f?m.f+1:m.f-1]=b[a];b[a]=''}
 const c=s.c.split('').filter(x=>!(RM[m.f]||'').includes(x)&&!(RM[m.t]||'').includes(x)).join('');
 return{b,turn:s.turn=='w'?'b':'w',c,ep:t=='p'&&Math.abs(m.t-m.f)==16?(m.f+m.t)/2:-1}}
const kingSq=(s,c)=>s.b.indexOf(c=='w'?'K':'k');
const inCheck=(s,c)=>attacked(s.b,kingSq(s,c),c=='w'?'b':'w');
const legal=s=>gen(s).filter(m=>!inCheck(apply(s,m),s.turn));
function insufficient(s){const x=s.b.filter(p=>p&&p.toLowerCase()!='k');return x.length==0||(x.length==1&&/[nb]/i.test(x[0]))}
/* ---------- bots ---------- */
const BOTS=[{n:'Pebble',d:0,x:0,r:400,t:'Moves at random. Good for learning the pieces.'},{n:'Sprout',d:1,x:90,r:800,t:'Grabs whatever it can see.'},
 {n:'Marlow',d:2,x:35,r:1100,t:'Thinks two moves ahead.'},{n:'Vesper',d:3,x:10,r:1400,t:'Plans ahead and rarely blunders.'},{n:'Hollis',d:4,x:0,r:1600,t:'Patient and precise. Takes a moment.'}];
const V={p:100,n:320,b:330,r:500,q:900,k:0};
function ev(s){let v=0;for(let i=0;i<64;i++){const p=s.b[i];if(!p)continue;const t=p.toLowerCase(),w=p<'a',r=w?7-(i>>3):i>>3,f=i&7;
 let x=V[t];const cd=Math.abs(3.5-f)+Math.abs(3.5-(i>>3));if(t=='n'||t=='b')x+=14-4*cd;if(t=='p')x+=r*7+(cd<2.5?8:0);if(t=='k')x+=(r==0?8:-6*r);if(t=='q'||t=='r')x+=2-cd;
 v+=w?x:-x}return s.turn=='w'?v:-v}
function search(s,d,a,b){const L=legal(s);if(!L.length)return inCheck(s,s.turn)?-99999-d:0;if(!d)return ev(s);
 L.sort((m,n)=>sc(s,n)-sc(s,m));for(const m of L){const v=-search(apply(s,m),d-1,-b,-a);if(v>=b)return b;if(v>a)a=v}return a}
const sc=(s,m)=>(s.b[m.t]?V[s.b[m.t].toLowerCase()]*10-V[s.b[m.f].toLowerCase()]:0)+(m.p?800:0);
function botPick(s,bot){const L=legal(s);if(!bot.d)return L[Math.random()*L.length|0];let best,bv=-1e9;
 for(const m of L){const v=-search(apply(s,m),bot.d-1,-1e9,1e9)+Math.random()*bot.x;if(v>bv){bv=v;best=m}}return best}

/* ---------- notation + game review ---------- */
function san(s,m){const p=s.b[m.f].toLowerCase(),sq=i=>'abcdefgh'[i&7]+(8-(i>>3)),cap=s.b[m.t]||m.e;let x;
 if(p=='k'&&Math.abs(m.t-m.f)==2)x=m.t>m.f?'O-O':'O-O-O';
 else if(p=='p')x=(cap?'abcdefgh'[m.f&7]+'x':'')+sq(m.t)+(m.p?'='+m.p.toUpperCase():'');
 else{const am=legal(s).filter(o=>o.t==m.t&&o.f!=m.f&&s.b[o.f]==s.b[m.f]);let d='';
  if(am.length)d=am.some(o=>(o.f&7)==(m.f&7))?(am.some(o=>(o.f>>3)==(m.f>>3))?sq(m.f):8-(m.f>>3)):'abcdefgh'[m.f&7];
  x=p.toUpperCase()+d+(cap?'x':'')+sq(m.t)}
 const n=apply(s,m);return x+(inCheck(n,n.turn)?(legal(n).length?'+':'#'):'')}
const same=(m,a)=>m.f==a[0]&&m.t==a[1]&&(m.p||'')==(a[2]||'');
const win=c=>50+50*(2/(1+Math.exp(-0.00368208*Math.max(-1500,Math.min(1500,c))))-1);
function analyze(moves,prog){let s=start();const ev=[],pl=[],D=3,acc={w:[],b:[]},cnt={w:{best:0,good:0,inaccuracy:0,mistake:0,blunder:0},b:{best:0,good:0,inaccuracy:0,mistake:0,blunder:0}};
 for(let i=0;i<moves.length;i++){const Lm=legal(s);let best=-1e9,bm=null,pv=-1e9,mv=null;
  for(const m of Lm){const v=-search(apply(s,m),D-1,-1e9,1e9);if(v>best){best=v;bm=m}if(same(m,moves[i])){pv=v;mv=m}}
  ev.push(s.turn=='w'?best:-best);
  const d=Math.max(0,win(best)-win(pv)),cls=Lm.length==1||same(bm,[mv.f,mv.t,mv.p])||d<1?'best':d<4?'good':d<9?'inaccuracy':d<18?'mistake':'blunder',c=s.turn;
  pl.push({c:cls,bs:san(s,bm)});cnt[c][cls]++;acc[c].push(Math.max(0,Math.min(100,103.1668*Math.exp(-0.04354*d)-3.1669)));
  s=apply(s,mv);prog&&prog((i+1)/moves.length)}
 const f=search(s,D,-1e9,1e9);ev.push(s.turn=='w'?f:-f);
 const av=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):100;
 return{ev,pl,cnt,acc:{w:av(acc.w),b:av(acc.b)}}}
