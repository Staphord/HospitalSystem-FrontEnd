# Keycloak admin (localhost :8080). Keep Keycloak at URL root so
# backend KEYCLOAK_URL=http://keycloak:8080 stays valid.
# Included only from a dedicated server_name, never from gilgali.com
# (the SPA already uses /admin).

location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_buffering off;
    proxy_read_timeout 3600s;
}
