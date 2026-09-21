import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
 return {
  name:"Titan Zero",short_name:"Titan Zero",
  description:"Titan Zero — managed Advanced Intelligence and AI workforce for business.",
  start_url:"/app",scope:"/",display:"standalone",
  background_color:"#07090d",theme_color:"#f97316",
  icons:[
   {src:"/icons/icon-192.png",sizes:"192x192",type:"image/png",purpose:"any"},
   {src:"/icons/icon-512.png",sizes:"512x512",type:"image/png",purpose:"any"},
   {src:"/icons/icon-maskable-512.png",sizes:"512x512",type:"image/png",purpose:"maskable"}
  ],
  shortcuts:[
   {name:"Command",short_name:"Command",description:"Open Titan Zero Command",url:"/app",icons:[{src:"/icons/icon-192.png",sizes:"192x192",type:"image/png"}]},
   {name:"Capture",short_name:"Capture",description:"Capture information for your AI workforce",url:"/app/capture",icons:[{src:"/icons/icon-192.png",sizes:"192x192",type:"image/png"}]}
  ]
 };
}