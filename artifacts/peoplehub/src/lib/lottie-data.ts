// Small bundled vector animations. No remote asset is needed for the defaults.
const transform = (p:number[],scale:number[]= [100,100,100]) => ({o:{a:0,k:100},r:{a:0,k:0},p:{a:0,k:p},a:{a:0,k:[0,0,0]},s:{a:0,k:scale}});
export const orbitAnimation = {
  v:"5.7.4",fr:30,ip:0,op:180,w:400,h:400,nm:"People orbit",ddd:0,assets:[],
  layers:[0,1,2].map((n)=>({
    ddd:0,ind:n+1,ty:4,nm:`People orbit ${n+1}`,sr:1,ks:{...transform([200,200,0]),r:{a:1,k:[{t:0,s:[n*120],e:[n*120+360],i:{x:[0.67],y:[1]},o:{x:[0.33],y:[0]}},{t:180,s:[n*120+360]}]}},ao:0,ip:0,op:180,st:0,bm:0,
    shapes:[{ty:"gr",it:[{ty:"el",p:{a:0,k:[105,0]},s:{a:0,k:[18,18]},nm:"Person"},{ty:"fl",c:{a:0,k:n===0?[0.55,0.36,0.96,1]:n===1?[0.13,0.83,0.93,1]:[0.93,0.28,0.6,1]},o:{a:0,k:100},r:1},{ty:"tr",p:{a:0,k:[0,0]},a:{a:0,k:[0,0]},s:{a:0,k:[100,100]},r:{a:0,k:0},o:{a:0,k:100},sk:{a:0,k:0},sa:{a:0,k:0}}]}],
  })),
};
export const successAnimation = {
  v:"5.7.4",fr:30,ip:0,op:60,w:200,h:200,nm:"Registration complete",ddd:0,assets:[],
  layers:[{ddd:0,ind:1,ty:4,nm:"Success ring",sr:1,ks:{...transform([100,100,0]),s:{a:1,k:[{t:0,s:[30,30,100],e:[100,100,100],i:{x:[0.2,0.2,0.2],y:[1,1,1]},o:{x:[0.2,0.2,0.2],y:[0,0,0]}},{t:25,s:[100,100,100]}]}},ao:0,ip:0,op:60,st:0,bm:0,
    shapes:[{ty:"gr",it:[{ty:"el",p:{a:0,k:[0,0]},s:{a:0,k:[165,165]}},{ty:"st",c:{a:0,k:[0.13,0.83,0.93,1]},o:{a:0,k:100},w:{a:0,k:4},lc:2,lj:2},{ty:"tr",p:{a:0,k:[0,0]},a:{a:0,k:[0,0]},s:{a:0,k:[100,100]},r:{a:0,k:0},o:{a:0,k:100},sk:{a:0,k:0},sa:{a:0,k:0}}]}]}],
};
