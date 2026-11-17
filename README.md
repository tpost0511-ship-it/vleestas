# vleestas
heeuujjj

## Componentstructuur

De interface volgt Atomic Design. Herbruikbare basiscomponenten staan in `components/atoms`, samengestelde UI in `components/molecules`, grotere interacties in `components/organisms`, de tabinhoud in `components/pages` en de algemene app-layout in `components/templates`. `App.js` beheert de appstatus en koppelt de pagina's aan de navigatie.

De tabbladen hebben elk een eigen URL: `/`, `/challenges`, `/shop`, `/roulette`, `/ranking`, `/reviews` en `/settings`. De Cloudflare Worker serveert de SPA voor deze routes.

## Supabase login instellen

Bij registratie stuurt Puntjacht de bevestigingsmail terug naar `https://vleestas.tpost0511.workers.dev/`. Stel in Supabase onder **Authentication → URL Configuration** dezelfde URL in als **Site URL** en voeg `https://vleestas.tpost0511.workers.dev/**` toe aan **Redirect URLs**. Eventuele preview-deployments moeten hun eigen Cloudflare-hostnaam als redirect URL krijgen.
