# razloMAK

Web aplikacija za učenje razlomaka. Pokriva deset čestih miskoncepcija: razlomak kao jedan broj, brojnik i nazivnik, zbrajanje dijelova, usporedbu, jednake razlomke, odnos prema cijelom broju, mješovite brojeve, provjeru smisla, slikovne modele i prenošenje pravila cijelih brojeva.

## Značajke

- **Vizualiziraj** — Kružni i trakasti modeli, brojevni pravac, decimalni i mješoviti zapis
- **Vježbe** 
- **Kviz** — 10 pitanja, po jedno iz svake kategorije

## Pokretanje

Nije potreban build. Otvori `index.html` u pregledniku ili pokreni lokalni poslužitelj:

```powershell
python -m http.server 8080
```

Zatim otvori [http://localhost:8080](http://localhost:8080).

## Struktura projekta

```
razloMAK/
├── index.html
├── css/styles.css
└── js/
    ├── app.js       # Sučelje i logika načina rada
    ├── topics.js    # Deset cjelina i generatori zadataka
    ├── fraction.js  # Matematičke funkcije
    └── visual.js    # Crtanje na canvasu
    └── candy-quiz.js
    └── flower-sub-game.js
    └── mul-garden-game.js
    └── pizza-mixed-game.js
    └── window-compare-game.js
    └── window-game.js
```
