import {lazy,Suspense,useEffect,useState,type ComponentType} from 'react';
import {successAnimation} from '@/lib/lottie-data';
const Player=lazy(()=>import('lottie-react').then(m=>({default:m.Lottie as ComponentType<any>})));
export function SuccessLottie(){
  const [ready,setReady]=useState(false);
  useEffect(()=>{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)setReady(true);},[]);
  if(!ready)return null;
  return <Suspense fallback={null}><Player src={successAnimation} autoplay loop={false} className="pointer-events-none absolute -inset-4" /></Suspense>;
}
