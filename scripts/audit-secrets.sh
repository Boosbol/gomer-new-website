#!/usr/bin/env bash
# Audit keamanan sederhana. Jalankan: npm run audit:secrets  (setelah `npm run build` untuk cek bundle)
set -u
fail=0
red() { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }

echo "1) .gitignore memuat .env dan .env.local"
for f in ".env" ".env.local"; do
  grep -qxF "$f" .gitignore && green "  ok: $f" || { red "  GAGAL: $f tidak ada di .gitignore"; fail=1; }
done

if git rev-parse --git-dir >/dev/null 2>&1; then
  echo "2) File .env tidak di-track Git"
  tracked=$(git ls-files | grep -E '(^|/)\.env($|\.)' | grep -v '\.env\.example$' || true)
  [ -z "$tracked" ] && green "  ok" || { red "  GAGAL, ter-track: $tracked"; fail=1; }
else
  echo "2) (bukan repo Git — lewati cek tracked files)"
fi

echo "3) Pola credential di source code (file *.test.ts berisi nilai palsu dan dikecualikan)"
patterns='AIza[0-9A-Za-z_-]{35}|-----BEGIN [A-Z ]*PRIVATE KEY-----|postgres(ql)?://[^:@[:space:]]+:[^@[:space:]]+@|SPOTIFY_(CLIENT_SECRET|REFRESH_TOKEN)[[:space:]]*=[[:space:]]*["'"'"']?[A-Za-z0-9_-]{20,}|(client_secret|api_key|apikey|password|passwd)[[:space:]]*[:=][[:space:]]*["'"'"'][A-Za-z0-9_@#$%^&*!-]{12,}["'"'"']'
hits=$(grep -RInE "$patterns" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git --exclude=.env.example --exclude=package-lock.json --exclude=audit-secrets.sh --exclude="*.test.ts" . 2>/dev/null || true)
[ -z "$hits" ] && green "  ok: tidak ada pola credential" || { red "  DITEMUKAN:"; echo "$hits"; fail=1; }

echo "4) Secret tidak ada di bundle frontend (.next/static)"
if [ -d .next/static ]; then
  for name in SPOTIFY_CLIENT_SECRET SPOTIFY_REFRESH_TOKEN YOUTUBE_API_KEY CRON_SECRET ADMIN_PASSWORD DATABASE_URL; do
    grep -RIl "$name" .next/static >/dev/null 2>&1 && { red "  GAGAL: nama $name muncul di .next/static"; fail=1; }
  done
  for envfile in .env.local .env; do
    [ -f "$envfile" ] || continue
    while IFS='=' read -r key value; do
      case "$key" in SPOTIFY_CLIENT_SECRET|SPOTIFY_REFRESH_TOKEN|YOUTUBE_API_KEY|CRON_SECRET|ADMIN_PASSWORD|DATABASE_URL)
        value="${value%\"}"; value="${value#\"}"
        if [ "${#value}" -ge 8 ] && grep -RIlF -- "$value" .next/static >/dev/null 2>&1; then
          red "  GAGAL: NILAI $key ditemukan di .next/static"; fail=1
        fi;;
      esac
    done < "$envfile"
  done
  [ "$fail" -eq 0 ] && green "  ok: bundle frontend bersih"
else
  echo "  (belum ada .next/static — jalankan npm run build dulu)"
fi

echo "5) Tidak ada NEXT_PUBLIC_ yang berisi secret"
bad=$(grep -RInE 'NEXT_PUBLIC_[A-Z_]*(SECRET|TOKEN|PASSWORD|API_KEY)' --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git --exclude=audit-secrets.sh . 2>/dev/null || true)
[ -z "$bad" ] && green "  ok" || { red "  GAGAL:"; echo "$bad"; fail=1; }

echo
[ "$fail" -eq 0 ] && green "AUDIT LULUS" || { red "AUDIT GAGAL"; exit 1; }
