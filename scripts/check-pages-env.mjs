export function validEndpoint(value) {
  try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash&&!['localhost','127.0.0.1','::1'].includes(url.hostname)&&url.pathname==='/api/walking-routes';} catch {return false;}
}
if(!validEndpoint(process.env.VITE_WALKING_ROUTE_ENDPOINT)) {
  console.error('Set repository variable VITE_WALKING_ROUTE_ENDPOINT to the real HTTPS backend URL ending /api/walking-routes before publishing Pages.');
  process.exitCode=1;
}
if(process.env.VITE_ROUTING_DEMO==='true') {console.error('Production Pages must not publish provisional demo recommendations.');process.exitCode=1;}
