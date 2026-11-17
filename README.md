# vleestas
heeuujjj

## Supabase login instellen

Bij registratie stuurt Puntjacht de bevestigingsmail terug naar de huidige app-URL. Stel in Supabase onder **Authentication → URL Configuration** de productie-URL in als **Site URL** en voeg `https://<jouw-domein>/**` toe aan **Redirect URLs**. Voeg preview-deployments alleen toe met hun eigen Cloudflare Pages-hostnaam, bijvoorbeeld `https://<jouw-preview-host>.pages.dev/**`. De redirect behoudt het app-pad en verwijdert oude URL-fragmenten, zodat Supabase de sessie veilig kan verwerken.
