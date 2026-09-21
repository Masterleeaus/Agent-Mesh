import type { MetadataRoute } from "next";
export default function sitemap():MetadataRoute.Sitemap{
 const base=process.env.NEXT_PUBLIC_SITE_URL||"https://titanzero.io";
 const routes=[
  ["",1,"weekly"],["/workforce",.9,"monthly"],["/assessment",.9,"monthly"],
  ["/booking",.5,"monthly"],["/estimate",.5,"monthly"],["/intake",.5,"monthly"],
  ["/privacy",.3,"yearly"],["/terms",.3,"yearly"]
 ] as const;
 return routes.map(([path,priority,changeFrequency])=>({url:`${base}${path}`,lastModified:new Date(),changeFrequency,priority}));
}