import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Universitario Vóley Club · Mensualidades',description:'Gestiona las mensualidades de Universitario Vóley Club y sus recordatorios por WhatsApp.',icons:{icon:'/universitario-voley-club.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
