#!/usr/bin/env python3
"""
Gume — baixa a capa de cada livro do CSV e salva como <ISBN>.jpg.

O que faz, por linha do CSV:
  1. Se já tem isbn + cover_url  -> baixa a capa direto.
  2. Se falta isbn ou cover_url  -> busca no Google Books (isbn13 + capa) e,
     se não achar, cai pro Open Library (isbn + capa por título/autor).
  3. Salva em  capas/<categoria>/<isbn>.jpg  e grava o isbn de volta no CSV.

Requisitos: Python 3, `requests`  (pip install requests)
Rode a partir da pasta que contém  gume_livros_para_criar.csv:
    python3 baixar_capas.py

Precisa de acesso à internet (o Claude Code tem; o ambiente onde isto foi gerado não tinha).
Dedup: pula ISBN já baixado. Idempotente: pode rodar de novo que só completa o que faltou.
"""
import csv, os, re, time, unicodedata, json
import requests

CSV = "gume_livros_para_criar.csv"
OUT = "capas"
UA  = {"User-Agent": "GumeCoverBot/1.0 (contato@4real.ventures)"}

def slug_cat(c):
    m = {
        "H1 Editora": "02_h1_editora",
        "Clube de Literatura Clássica": "03_clube_literatura_classica",
    }
    if c in m: return m[c]
    s = unicodedata.normalize("NFKD", c).encode("ascii","ignore").decode()
    return "05_" + re.sub(r"[^a-z0-9]+","_", s.lower()).strip("_")

def norm(s):
    s = unicodedata.normalize("NFKD", (s or "")).encode("ascii","ignore").decode()
    return re.sub(r"[^a-z0-9]+"," ", s.lower()).strip()

def valid_jpg(b):
    return b and len(b) > 5000 and b[:3] == b"\xff\xd8\xff"

def google_books(title, author):
    """Retorna (isbn13, cover_url) ou (None,None)."""
    q = f'intitle:{title}'
    if author: q += f'+inauthor:{author.split(",")[0]}'
    try:
        r = requests.get("https://www.googleapis.com/books/v1/volumes",
                         params={"q": q, "country": "BR", "maxResults": 5},
                         headers=UA, timeout=20)
        items = r.json().get("items", [])
    except Exception:
        return None, None
    for it in items:
        vi = it.get("volumeInfo", {})
        isbn = None
        for idf in vi.get("industryIdentifiers", []):
            if idf.get("type") == "ISBN_13":
                isbn = idf.get("identifier")
        img = (vi.get("imageLinks") or {})
        cover = img.get("thumbnail") or img.get("smallThumbnail")
        if isbn and cover:
            # pega a versão maior e sem curl da borda
            cover = cover.replace("&edge=curl","").replace("zoom=1","zoom=3")
            return isbn, cover.replace("http://","https://")
    return None, None

def openlibrary(title, author):
    try:
        r = requests.get("https://openlibrary.org/search.json",
                         params={"title": title, "author": author or "", "limit": 5},
                         headers=UA, timeout=20)
        docs = r.json().get("docs", [])
    except Exception:
        return None, None
    for d in docs:
        isbns = d.get("isbn") or []
        isbn13 = next((i for i in isbns if len(i) == 13 and i.startswith("978")), None)
        cid = d.get("cover_i")
        if isbn13 and cid:
            return isbn13, f"https://covers.openlibrary.org/b/id/{cid}-L.jpg"
    return None, None

def download(url):
    try:
        r = requests.get(url, headers=UA, timeout=30)
        if r.status_code == 200 and valid_jpg(r.content):
            return r.content
    except Exception:
        pass
    return None

def main():
    rows = list(csv.DictReader(open(CSV, encoding="utf-8")))
    seen_isbn = set()
    ok = miss = 0
    for row in rows:
        title, author, cat = row["titulo"], row["autor"], row["categoria"]
        folder = os.path.join(OUT, slug_cat(cat)); os.makedirs(folder, exist_ok=True)
        isbn = (row.get("isbn") or "").strip()
        cover = (row.get("cover_url") or "").strip()

        # 1. achar isbn+capa se faltar
        if not (isbn and cover):
            gi, gc = google_books(title, author)
            if not isbn: isbn = gi or ""
            if not cover: cover = gc or ""
            if not (isbn and cover):
                oi, oc = openlibrary(title, author)
                if not isbn: isbn = oi or ""
                if not cover: cover = oc or ""
            row["isbn"], row["cover_url"] = isbn, cover
            time.sleep(0.4)  # gentileza com as APIs

        if not isbn:
            print(f"[SEM ISBN] {title} — {author}"); miss += 1; continue
        if isbn in seen_isbn:
            continue
        seen_isbn.add(isbn)

        dest = os.path.join(folder, f"{isbn}.jpg")
        if os.path.exists(dest) and os.path.getsize(dest) > 5000:
            ok += 1; continue
        if not cover:
            print(f"[SEM CAPA] {isbn} {title}"); miss += 1; continue
        data = download(cover)
        if data:
            open(dest, "wb").write(data); ok += 1
            print(f"[OK] {isbn}  {title}")
        else:
            print(f"[FALHOU CAPA] {isbn} {title}  ({cover})"); miss += 1

    # grava isbn/cover_url de volta no CSV
    with open(CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=rows[0].keys()); w.writeheader(); w.writerows(rows)

    print(f"\nPronto. {ok} capas na pasta, {miss} sem casar (confira o log acima).")

if __name__ == "__main__":
    main()
