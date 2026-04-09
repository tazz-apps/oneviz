# Tally Forms — Build Spec

Two forms. Build in Tally, share via URL. Free tier sufficient unless photo uploads needed (paid).

---

## FORM 1 — Formularz: Dane do strony
*Onboarding form. Sent after deposit paid. Multi-step — each section = separate page.*

---

### PAGE 1 — Witaj

**[STATEMENT]**
> Wypełnienie zajmuje około 5 minut.
> Jeśli nie masz gotowych tekstów — napisz hasłowo. My przygotujemy profesjonalną treść.
> Jeśli czegoś nie masz — zaznacz to na końcu, a my przygotujemy.

---

### PAGE 2 — Istniejąca strona

**[MULTIPLE CHOICE]** "Czy masz już stronę internetową?"
Required: YES
Options:
- Tak
- Nie

**[URL]** "Adres Twojej obecnej strony"
Required: NO
Placeholder: https://
Conditional: show if above = "Tak"

**[CHECKBOXES]** "Co chcesz zachować ze starej strony?"
Required: NO
Conditional: show if existing site = "Tak"
Options:
- Dane kontaktowe (telefon, email, adres)
- Opisy usług
- Bio / opis firmy
- Social media
- Opinie klientów

**[LONG TEXT]** "Co chcesz zmienić lub dodać?"
Required: NO
Placeholder: np. "nowy numer telefonu", "inne usługi", "dodaj WhatsApp"
Conditional: show if existing site = "Tak"

**[STATEMENT]** *(conditional: show if existing site = "Tak")*
> Jeśli zaznaczyłeś wszystko i nie ma zmian — możesz pominąć resztę formularza i kliknąć "Wyślij".

---

### PAGE 3 — Cel strony i kontakt podczas projektu

**[MULTIPLE CHOICE]** "Jaki jest główny cel strony — co ma zrobić odwiedzający?"
Required: YES
Options:
- Zadzwonić do mnie
- Napisać na WhatsApp
- Wysłać formularz kontaktowy
- Umówić spotkanie
- Przyjść do lokalu

*Determines hero layout, sticky buttons, and mobile CTA.*

**[MULTIPLE CHOICE]** "Jak preferujesz kontakt podczas realizacji projektu?"
Required: YES
Options:
- WhatsApp
- Telefon
- Email

**[SHORT TEXT]** "Numer WhatsApp (jeśli inny niż kontaktowy)"
Required: NO
Placeholder: +48 123 456 789
Conditional: show if communication = "WhatsApp"

---

### PAGE 4 — Dane kontaktowe

**[SHORT TEXT]** "Imię i nazwisko lub nazwa firmy"
Required: YES
Placeholder: Jan Kowalski / Salon Urody Kwiatkowski

**[SHORT TEXT]** "Stanowisko / tytuł zawodowy"
Required: YES
Placeholder: Doradca finansowy / Kosmetolog / Agent ubezpieczeniowy

**[PHONE]** "Telefon"
Required: YES
Placeholder: +48 123 456 789

**[EMAIL]** "Email"
Required: YES

**[SHORT TEXT]** "Miasto / obszar działania"
Required: YES
Placeholder: Kraków / Kraków i okolice

**[SHORT TEXT]** "Adres firmy (jeśli chcesz mapę na stronie)"
Required: NO
Placeholder: ul. Floriańska 12, 31-021 Kraków
*We generate the map embed — you just provide the address.*

---

### PAGE 5 — Twoje usługi

**[STATEMENT]**
> 3 usługi, na których zarabiasz najwięcej.
> Dla każdej usługi odpowiedz na 3 pytania: Dla kogo? Jaki problem rozwiązujesz? Jaki efekt dostaje klient?
> Możesz pisać hasłowo — my przygotujemy tekst.

**[SHORT TEXT]** "Usługa 1 — nazwa"
Required: YES
Placeholder: Doradztwo kredytowe

**[LONG TEXT]** "Usługa 1 — opis"
Required: YES
Placeholder: Dla kogo: właściciele firm / Problem: trudno dostać kredyt / Efekt: kredyt w 2 tygodnie

**[SHORT TEXT]** "Usługa 2 — nazwa"
Required: YES

**[LONG TEXT]** "Usługa 2 — opis"
Required: YES
Placeholder: Dla kogo: ... / Problem: ... / Efekt: ...

**[SHORT TEXT]** "Usługa 3 — nazwa"
Required: YES

**[LONG TEXT]** "Usługa 3 — opis"
Required: YES
Placeholder: Dla kogo: ... / Problem: ... / Efekt: ...

---

### PAGE 6 — Dlaczego klienci wybierają właśnie Ciebie?

**[STATEMENT]**
> 3 konkretne powody. Unikaj ogólników ("jakość", "doświadczenie") — wszyscy to piszą.
> Przykłady: "Jedyna certyfikowana X w mieście" / "Odpowiadam w 2 godziny" / "15 lat tylko w tej branży"

**[SHORT TEXT]** "Powód 1"
Required: YES
Placeholder: np. Jedyny certyfikowany doradca X w Krakowie

**[SHORT TEXT]** "Powód 2"
Required: YES

**[SHORT TEXT]** "Powód 3"
Required: YES

---

### PAGE 7 — O Tobie

**[LONG TEXT]** "Krótkie bio — opisz w punktach:"
Required: NO
Placeholder: • Od którego roku działasz
• Gdzie pracowałeś wcześniej
• Specjalizacja / nisza
• Dla kogo głównie pracujesz
Jeśli nie masz gotowego tekstu — napisz hasłowo, my przygotujemy.

**[SHORT TEXT]** "Od którego roku działasz?"
Required: NO
Placeholder: 2012

**[SHORT TEXT]** "Liczba obsłużonych klientów"
Required: NO
Placeholder: 200+

---

### PAGE 8 — Opinie klientów

**[STATEMENT]**
> Opcjonalne — jeśli nie masz, możemy pominąć lub użyć anonimowych przykładów.

**[LONG TEXT]** "Opinia 1 — treść"
Required: NO
Placeholder: "Dzięki współpracy zaoszczędziłem 300 zł miesięcznie na kredycie..."

**[SHORT TEXT]** "Opinia 1 — autor"
Required: NO
Placeholder: Marek K., właściciel firmy budowlanej

**[LONG TEXT]** "Opinia 2 — treść"
Required: NO

**[SHORT TEXT]** "Opinia 2 — autor"
Required: NO

---

### PAGE 9 — Social media i kontakt dodatkowy

*All optional — leave blank if not used*

**[URL]** "Facebook"
Required: NO
Placeholder: https://facebook.com/twojaprofil

**[URL]** "Instagram"
Required: NO

**[URL]** "LinkedIn"
Required: NO

**[SHORT TEXT]** "WhatsApp — numer do przycisku kontaktowego"
Required: NO
Placeholder: +48 123 456 789

---

### PAGE 10 — Zdjęcia i domena

**[MULTIPLE CHOICE]** "Zdjęcie profilowe"
Required: YES
Options:
- Mam własne — przyślę na WhatsApp / email
- Nie mam — użyj stocków pasujących do branży
- Nie mam — użyj AI (generowane)
- Przyślę później (przed wdrożeniem)

**[MULTIPLE CHOICE]** "Logo"
Required: YES
Options:
- Mam — przyślę na WhatsApp / email
- Nie mam — na razie bez logo
- Przyślę później

**[MULTIPLE CHOICE]** "Domena"
Required: YES
Options:
- Mam już domenę
- Nie mam — proszę o pomoc

**[SHORT TEXT]** "Adres domeny"
Required: NO
Placeholder: jankowalski.pl
Conditional: show if domain = "Mam już domenę"

---

### PAGE 11 — Ostatnie pytania

**[LONG TEXT]** "Czy jest coś czego NIE chcesz na stronie?"
Required: NO
Placeholder: np. żadnych zdjęć stockowych z uśmiechniętymi ludźmi, bez formularzy kontaktowych, bez konkretnego koloru

**[MULTIPLE CHOICE]** "Kto będzie akceptował gotową stronę?"
Required: YES
Options:
- Ja sam/a
- Ja i wspólnik / partner
- Inna osoba (marketing, rodzina)

**[SHORT TEXT]** "Nazwa projektu do URL (slug)"
Required: NO
Placeholder: kowalski-ubezpieczenia / salon-kwiatkowski
*Used for folder naming, repo, and Netlify URL. We'll suggest one if left blank.*

---

### PAGE 12 — Zgody

**[STATEMENT]**
> Standardowy czas realizacji: 5–10 dni roboczych od otrzymania wszystkich materiałów.

**[CHECKBOXES — REQUIRED]** "Zakres projektu — akceptacja"
Required: YES
Options (all must be checked):
- Projekt obejmuje jedną rundę poprawek
- Dodatkowe zmiany wyceniane są osobno
- Publikacja następuje po płatności końcowej

**[CHECKBOXES]** "Zgody produkcyjne"
Required: NO
Options:
- Nie mam gotowych tekstów — proszę przygotować na podstawie moich odpowiedzi
- Nie mam zdjęć — użyj stocków / AI pasujących do branży
- Mogę przesłać dodatkowe materiały przed wdrożeniem

**[CHECKBOX]** "Zgoda na portfolio"
Required: NO
Option: Zgadzam się na pokazanie tej strony w portfolio OneViz

---

### THANK YOU PAGE

> Dziękujemy! Wrócimy do Ciebie w ciągu 24 godzin z potwierdzeniem i harmonogramem.
> Pytania? Napisz na WhatsApp: [Twój numer]

---
---

## FORM 2 — Formularz: Zmiana na stronie
*Maintenance update form. Single page. Under 60 seconds.*

---

**[STATEMENT]**
> Powiedz nam co zmienić — wrócimy z potwierdzeniem w ciągu 24–72 godzin.

**[SHORT TEXT]** "Twoje imię i strona"
Required: YES
Placeholder: Jan Kowalski / jankowalski.pl

**[MULTIPLE CHOICE]** "Priorytet"
Required: YES
Options:
- Standard — do 3 dni roboczych
- Pilne — do 24 godzin (+150 PLN)

**[CHECKBOXES]** "Co chcesz zmienić?"
Required: YES
Options:
- Numer telefonu
- Adres email
- Opinia klienta (dodaj / usuń / zmień)
- Opis usługi
- Zdjęcie
- Informacja o urlopie / godziny
- Inne

**[SHORT TEXT]** "Nowy numer telefonu"
Required: NO
Conditional: show if "Numer telefonu" checked

**[SHORT TEXT]** "Nowy adres email"
Required: NO
Conditional: show if "Adres email" checked

**[LONG TEXT]** "Nowa opinia — treść i autor"
Required: NO
Placeholder: "Świetna obsługa!" — Anna K., Kraków
Conditional: show if "Opinia klienta" checked

**[LONG TEXT]** "Zmiana opisu usługi — która i nowy tekst"
Required: NO
Placeholder: Usługa 2: nowy opis...
Conditional: show if "Opis usługi" checked

**[LONG TEXT]** "Treść informacji o urlopie lub zmiana godzin"
Required: NO
Placeholder: Urlop 15–22 lipca, kontakt przez email
Conditional: show if "Informacja o urlopie" checked

**[LONG TEXT]** "Inne zmiany — opisz"
Required: NO
Conditional: show if "Inne" checked

**[SHORT TEXT]** "Termin (opcjonalne)"
Required: NO
Placeholder: przed 15 lipca

---

### THANK YOU PAGE

> Otrzymaliśmy Twoją prośbę. Wrócimy z potwierdzeniem w ciągu 24–72 godzin.
> Pilna sprawa? WhatsApp: [Twój numer]

---

## Tally Setup Notes

- **Workspace:** "OneViz" — both forms live here
- **Photos:** handled outside Tally (WhatsApp / email) — stays on free plan
- **Notifications:** email alert to yourself on every submission
- **Branding:** logo + accent color in Tally settings
- **Sharing:** Form 1 URL sent after deposit; Form 2 URL sent to all active maintenance clients
- **Responses:** export CSV or connect Google Sheets via Zapier when you have 5+ clients

---

## Variable Mapping (internal — for template fill)

```
PAGE 3  → CTA_PRIMARY (call/whatsapp/form), meta for layout choice
PAGE 4  → FULL_NAME, TITLE, PHONE, EMAIL, CITY, GOOGLE_MAPS_EMBED (generated from address)
PAGE 5  → SERVICE_1_TITLE/DESC, SERVICE_2_TITLE/DESC, SERVICE_3_TITLE/DESC
PAGE 6  → WHY_1_TITLE/DESC, WHY_2_TITLE/DESC, WHY_3_TITLE/DESC
PAGE 7  → BIO_SHORT, BIO_LONG, EXPERIENCE_YEARS (calculated from "since year"), CLIENTS_COUNT
PAGE 8  → REVIEW_1_TEXT/AUTHOR, REVIEW_2_TEXT/AUTHOR
PAGE 9  → FACEBOOK_URL, INSTAGRAM_URL, LINKEDIN_URL, WHATSAPP_NUMBER
PAGE 2  → if URL provided → run scraper/scrape.js first, then override with form delta
```
