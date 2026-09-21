import type { MetadataRoute } from "next";
export default function robots():MetadataRoute.Robots{
 return {
  rules:[
   {userAgent:"*",allow:["/","/workforce","/assessment","/privacy","/terms"],disallow:["/app/","/api/","/portal/","/intake/","/estimate/","/booking/","/titan/"]}
  ],
  sitemap:"/sitemap.xml"
 };
}