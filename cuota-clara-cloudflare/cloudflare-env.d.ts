declare namespace Cloudflare {
  interface Env {
    DB:D1Database;
    FIREBASE_PROJECT_ID:string;
    FIREBASE_API_KEY:string;
    ADMIN_UID:string;
    AUTO_SEND_ENABLED?:string;
    WHATSAPP_ACCESS_TOKEN?:string;
    WHATSAPP_PHONE_NUMBER_ID?:string;
    WHATSAPP_API_VERSION?:string;
  }
}
