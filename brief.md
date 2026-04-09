# Formularz — Dane do strony

*Wypełnienie zajmuje około 5 minut. Im więcej podasz, tym lepszy efekt.*

---

## 1. Czy masz już stronę internetową?

- [ ] Tak — adres strony: ___________
- [ ] Nie

**Jeśli TAK — co chcesz zachować ze starej strony?**
*(odznacz to, czego NIE chcesz zachować)*

- [ ] Dane kontaktowe (telefon, email, adres)
- [ ] Opisy usług
- [ ] Bio / opis firmy
- [ ] Social media
- [ ] Opinie klientów

Co chcesz zmienić lub dodać:
___________

*→ Jeśli zaznaczyłeś "zachowaj wszystko" i nie ma zmian — możemy przejść od razu do produkcji.*

---

## 2. Dane kontaktowe

Imię i nazwisko / nazwa firmy:
Stanowisko / tytuł zawodowy (np. "Doradca finansowy", "Kosmetolog"):
Telefon:
Email:
Miasto / obszar działania:

---

## 3. Twoje usługi

*3 usługi, na których zarabiasz najwięcej.*

**Usługa 1**
Nazwa:
Krótki opis (1–2 zdania):

**Usługa 2**
Nazwa:
Krótki opis:

**Usługa 3**
Nazwa:
Krótki opis:

---

## 4. Dlaczego klienci wybierają właśnie Ciebie?

*3 konkretne powody. Unikaj ogólników ("jakość", "doświadczenie") — wszyscy to piszą.*

*Przykłady: "Jedyna certyfikowana X w mieście", "Odpowiadam w ciągu 2 godzin", "15 lat tylko w tej branży"*

1.
2.
3.

---

## 5. O Tobie

Krótkie bio (2–3 zdania — kim jesteś, skąd doświadczenie, dla kogo pracujesz):

Lata doświadczenia (opcjonalne):
Liczba klientów (opcjonalne, np. "200+"):

---

## 6. Opinie klientów

*(opcjonalne — jeśli nie masz, możemy pominąć tę sekcję)*

**Opinia 1**
Treść:
Autor (imię + stanowisko lub "Klient"):

**Opinia 2**
Treść:
Autor:

---

## 7. Social media i kontakt

*(zostaw puste jeśli nie używasz)*

Facebook:
Instagram:
LinkedIn:
WhatsApp (numer do przycisku kontaktowego):
Google Maps embed URL (jeśli chcesz mapę na stronie):

---

## 8. Zdjęcia i materiały

- Masz zdjęcie profilowe (profesjonalne lub dobre zdjęcie telefonem)? TAK / NIE
- Masz logo? TAK / NIE

---

## 9. Domena

- [ ] Mam już domenę — adres: ___________
- [ ] Nie mam domeny — proszę o pomoc

---

## Zgody produkcyjne

*Zaznacz wszystko co pasuje — to przyspiesza projekt.*

- [ ] Nie mam gotowych tekstów — proszę przygotować na podstawie moich odpowiedzi
- [ ] Nie mam zdjęć — użyj stocków pasujących do branży
- [ ] Mogę przesłać dodatkowe materiały później (przed wdrożeniem)

---

*Dziękujemy! Wrócimy do Ciebie w ciągu 24 godzin z potwierdzeniem i harmonogramem.*

---

<!-- INTERNAL — variable mapping for template fill
Q2  → FULL_NAME, TITLE, PHONE, EMAIL, CITY
Q3  → SERVICE_1_TITLE/DESC, SERVICE_2_TITLE/DESC, SERVICE_3_TITLE/DESC
Q4  → WHY_1_TITLE/DESC, WHY_2_TITLE/DESC, WHY_3_TITLE/DESC
Q5  → BIO_SHORT, BIO_LONG, EXPERIENCE_YEARS, CLIENTS_COUNT
Q6  → REVIEW_1_TEXT/AUTHOR, REVIEW_2_TEXT/AUTHOR
Q7  → FACEBOOK_URL, INSTAGRAM_URL, LINKEDIN_URL, WHATSAPP_NUMBER, GOOGLE_MAPS_EMBED
Q8  → PHOTO_URL (upload → host → fill)
Q1  → if existing site URL provided → run scraper/scrape.js first, then override with form delta
-->
