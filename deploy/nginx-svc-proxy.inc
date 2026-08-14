# Included by hospital-frontend.conf. Service OpenAPI is localhost-only;
# this exposes it on HTTPS under /svc/<name>/openapi.json plus a UI at /svc/.

location = /svc {
    return 301 /svc/;
}

# alias-to-file in an exact location causes nginx 500 ("not a directory").
location = /svc/ {
    default_type text/html;
    root /var/www/hospital-frontend/deploy;
    rewrite ^ /svc-docs.html break;
    add_header Cache-Control "no-cache";
}

location = /svc/gateway/openapi.json {
    proxy_pass http://127.0.0.1:8000/openapi.json;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /svc/auth/openapi.json {
    proxy_pass http://127.0.0.1:8001/openapi.json;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /svc/master/openapi.json {
    proxy_pass http://127.0.0.1:8002/openapi.json;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /svc/patient/openapi.json {
    proxy_pass http://127.0.0.1:8005/openapi.json;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /svc/visit/openapi.json {
    proxy_pass http://127.0.0.1:8006/openapi.json;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /svc/reception/openapi.json {
    proxy_pass http://127.0.0.1:8010/openapi.json;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /svc/triage/openapi.json {
    proxy_pass http://127.0.0.1:8011/openapi.json;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /svc/consultation/openapi.json {
    proxy_pass http://127.0.0.1:8012/openapi.json;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /svc/laboratory/openapi.json {
    proxy_pass http://127.0.0.1:8013/openapi.json;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /svc/radiology/openapi.json {
    proxy_pass http://127.0.0.1:8014/openapi.json;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /svc/pharmacy/openapi.json {
    proxy_pass http://127.0.0.1:8015/openapi.json;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /svc/billing/openapi.json {
    proxy_pass http://127.0.0.1:8016/openapi.json;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /svc/ward/openapi.json {
    proxy_pass http://127.0.0.1:8017/openapi.json;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /svc/admin/openapi.json {
    proxy_pass http://127.0.0.1:8018/openapi.json;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /svc/notification/openapi.json {
    proxy_pass http://127.0.0.1:8019/openapi.json;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /svc/report/openapi.json {
    proxy_pass http://127.0.0.1:8020/openapi.json;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
