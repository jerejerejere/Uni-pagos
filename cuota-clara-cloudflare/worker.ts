import handler from 'vinext/server/fetch-handler';
export default {
  async fetch(request:Request,env:Cloudflare.Env,ctx:ExecutionContext){
    const response=await handler.fetch(request,env,ctx);
    const headers=new Headers(response.headers);
    headers.set('X-Content-Type-Options','nosniff');
    headers.set('X-Frame-Options','DENY');
    headers.set('Referrer-Policy','same-origin');
    headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    if(!new URL(request.url).pathname.startsWith('/assets/'))headers.set('Cache-Control','private, no-store');
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
  }
};
