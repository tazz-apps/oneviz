# Tally Forms — Build Spec

Two forms. Build in Tally, share via URL. Free tier sufficient unless photo uploads needed (paid).

---

## FORM 1 — Formularz: Dane do strony
*Onboarding form. Used once per client after deposit paid.*
*Multi-step (each section = separate page in Tally — reduces overwhelm)*

---

### PAGE 1 — Witaj

**[STATEMENT]**
> Wypełnienie zajmuje około 5 minut.
> Przygotuj: dane kontaktowe, opisy usług, ewentualne opinie klientów.
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
Conditional: show if Q above = "Tak"

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

### PAGE 3 — Dane kontaktowe

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

---

### PAGE 4 — Twoje usługi

**[STATEMENT]**
> 3 usługi, na których zarabiasz najwięcej.

**[SHORT TEXT]** "Usługa 1 — nazwa"
Required: YES
Placeholder: Doradztwo kredytowe

**[LONG TEXT]** "Usługa 1 — krótki opis"
Required: YES
Placeholder: 1–2 zdania. Dla kogo, co daje klientowi.

**[SHORT TEXT]** "Usługa 2 — nazwa"
Required: YES

**[LONG TEXT]** "Usługa 2 — opis"
Required: YES

**[SHORT TEXT]** "Usługa 3 — nazwa"
Required: YES

**[LONG TEXT]** "Usługa 3 — opis"
Required: YES

---

### PAGE 5 — Dlaczego klienci wybierają właśnie Ciebie?

**[STATEMENT]**
> 3 konkretne powody. Unikaj ogólników ("jakość", "doświadczenie") — wszyscy to piszą.
> Przykłady: "Jedyna certyfikowana X w mieście" / "Odpowiadam w ciągu 2 godzin" / "15 lat tylko w tej branży"

**[SHORT TEXT]** "Powód 1"
Required: YES
Placeholder: np. Jedyny certyfikowany doradca X w Krakowie

**[SHORT TEXT]** "Powód 2"
Required: YES

**[SHORT TEXT]** "Powód 3"
Required: YES

---

### PAGE 6 — O Tobie

**[LONG TEXT]** "Krótkie bio — kim jesteś, skąd doświadczenie, dla kogo pracujesz"
Required: NO
Placeholder: Jeśli nie masz gotowego tekstu — napisz hasłowo (np. "15 lat w finansach, Open Finance, teraz niezależnie"). My przygotujemy resztę.

**[SHORT TEXT]** "Lata doświadczenia"
Required: NO
Placeholder: 15

**[SHORT TEXT]** "Liczba obsłużonych klientów"
Required: NO
Placeholder: 200+

---

### PAGE 7 — Opinie klientów

**[STATEMENT]**
> Opcjonalne — jeśli nie masz, możemy pominąć tę sekcję lub użyć anonimowych przykładów.

**[LONG TEXT]** "Opinia 1 — treść"
Required: NO
Placeholder: "Dzięki współpracy z [imię] zaoszczędziłem 300 zł miesięcznie na kredycie..."

**[SHORT TEXT]** "Opinia 1 — autor"
Required: NO
Placeholder: Marek K., właściciel firmy budowlanej

**[LONG TEXT]** "Opinia 2 — treść"
Required: NO

**[SHORT TEXT]** "Opinia 2 — autor"
Required: NO

---

### PAGE 8 — Social media i kontakt dodatkowy

*All optional — leave blank if not used*

**[URL]** "Facebook"
Required: NO
Placeholder: https://facebook.com/twojaprofil

**[URL]** "Instagram"
Required: NO
Placeholder: https://instagram.com/twojaprofil

**[URL]** "LinkedIn"
Required: NO

**[SHORT TEXT]** "WhatsApp — numer (do przycisku kontaktowego)"
Required: NO
Placeholder: +48 123 456 789

**[URL]** "Google Maps embed URL (jeśli chcesz mapę na stronie)"
Required: NO
Placeholder: https://maps.google.com/...

---

### PAGE 9 — Zdjęcia i domena

**[MULTIPLE CHOICE]** "Masz zdjęcie profilowe?"
Required: YES
Options:
- Tak — przyślę na WhatsApp / email
- Nie — użyj stocków

**[MULTIPLE CHOICE]** "Masz logo?"
Required: YES
Options:
- Tak — przyślę na WhatsApp / email
- Nie — na razie bez logo

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

### PAGE 10 — Zgody produkcyjne

**[STATEMENT]**
> Ostatni krok. Zaznacz co pasuje — to przyspiesza projekt.

**[CHECKBOXES]** "Zgody"
Required: NO
Options:
- Nie mam gotowych tekstów — proszę przygotować na podstawie moich odpowiedzi
- Nie mam zdjęć — użyj stocków pasujących do branży
- Mogę przesłać dodatkowe materiały przed wdrożeniem

---

### THANK YOU PAGE

> Dziękujemy! Wrócimy do Ciebie w ciągu 24 godzin z potwierdzeniem i harmonogramem.
> W razie pytań: [Twój numer WhatsApp]

---
---

## FORM 2 — Formularz: Zmiana na stronie
*Maintenance update form. Sent to active clients with maintenance subscription.*
*Single page — should take under 60 seconds.*

---

**[STATEMENT]**
> Powiedz nam co zmienić — wrócimy do Ciebie z potwierdzeniem w ciągu 24 godzin.

**[SHORT TEXT]** "Twoje imię i strona"
Required: YES
Placeholder: Jan Kowalski / jankowalski.pl

**[CHECKBOXES]** "Co chcesz zmienić?"
Required: YES
Options:
- Numer telefonu
- Adres email
- Opinia klienta (dodaj / usuń / zmień)
- Opis usługi
- Zdjęcie
- Informacja o urlopie / godziny otwarcia
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

**[LONG TEXT]** "Zmiana opisu usługi — która usługa i nowy tekst"
Required: NO
Placeholder: Usługa 2: nowy opis...
Conditional: show if "Opis usługi" checked

**[LONG TEXT]** "Treść informacji o urlopie lub zmiana godzin"
Required: NO
Placeholder: np. "Urlop 15–22 lipca, kontakt przez email"
Conditional: show if "Informacja o urlopie" checked

**[LONG TEXT]** "Inne zmiany — opisz"
Required: NO
Conditional: show if "Inne" checked

**[SHORT TEXT]** "Termin realizacji (opcjonalne)"
Required: NO
Placeholder: np. przed 15 lipca

---

### THANK YOU PAGE

> Otrzymaliśmy Twoją prośbę. Wrócimy z potwierdzeniem w ciągu 24 godzin.
> Pilna sprawa? Napisz na WhatsApp: [Twój numer]

---

## Notes for Tally setup

- **Workspace:** create one workspace "OneViz" — both forms live there
- **Photo uploads:** handled outside Tally for now (WhatsApp / email) — avoids paid plan requirement
- **Notifications:** set email notification to yourself on every submission
- **Responses:** Tally exports to CSV or connects to Google Sheets via Zapier
- **Branding:** add your logo + accent color in Tally settings (matches OneViz positioning)
- **Sharing:** each form gets a URL — Form 1 sent after deposit, Form 2 sent to maintenance clients
