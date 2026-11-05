// „najśmieszniejsza” tura dla filmu Zgrzyta: zdarzenia dobrane tak, żeby odpaliły każdą śmieszną gałąź kronikarza
// (odwet, seria, rewanż, „znowu”, zdrada, traktat z wrogiem, długi pokój, wielka bitwa, skutki, staty). Goblandia obrywa za wszystkich.
// P(f, k) → { p, miejsce } dla k-tej prowincji krainy f; morze → { a, miejsce }
export const smiesznaTura = (P, morze) => ({
  pamiec: [
    { tura: 2, typ: "wojna", d: { A: "rogus-ardens", B: "goblandia" } },
    { tura: 3, typ: "wojna", d: { A: "aurelia", B: "czarny-smok" } },
    { tura: 3, typ: "wojna", d: { A: "gor-khar", B: "aurelia" } }, { tura: 4, typ: "wojna", d: { A: "gor-khar", B: "goblandia" } },
    { tura: 4, typ: "wynik", d: { A: "aurelia", przegrani: ["czarny-smok"] } },
    { tura: 4, typ: "wynik", d: { A: "gor-khar", przegrani: ["goblandia"] } }, { tura: 5, typ: "wynik", d: { A: "rogus-ardens", przegrani: ["goblandia"] } },
    { tura: 6, typ: "wynik", d: { A: "gor-khar", przegrani: ["goblandia"] } }, { tura: 6, typ: "wynik", d: { A: "gor-khar", przegrani: ["aurelia"] } },
  ],
  zdarzenia: [
    { typ: "wojna", d: { A: "goblandia", B: "rogus-ardens" } },
    { typ: "wojna", d: { A: "gor-khar", B: "krag-mhor" } },
    { typ: "bitwa", d: { ...P("rogus-ardens", 1), lista: ["goblandia", "rogus-ardens", "grobowe-imperium"] } },
    { typ: "wynik", d: { ...P("rogus-ardens", 1), A: "rogus-ardens", przegrani: ["goblandia"], polegli: ["What"] } },
    { typ: "wynik", d: { skutki: true, ...P("rogus-ardens", 1), niewola: ["Kapitan Gobjack"], ranni: ["Gobloni"] } },
    { typ: "wynik", d: { ...P("aurelia", 3), A: "czarny-smok", przegrani: ["aurelia"] } },
    { typ: "wynik", d: { ...P("krag-mhor", 2), A: "gor-khar", przegrani: ["krag-mhor"], zdobycz: true, prowincja: P("krag-mhor", 2).p } },
    { typ: "bitwa", d: { morska: true, a: morze, miejsce: "na morzu „Zatoka Kości”", lista: ["goblandia", "grobowe-imperium"] } },
    { typ: "wynik", d: { morska: true, a: morze, miejsce: "na morzu „Zatoka Kości”", A: "grobowe-imperium", przegrani: ["goblandia"] } },
    { typ: "wlasciciel", d: { prowincja: P("goblandia", 4).p, p: P("goblandia", 4).p, A: "goblandia", B: "gor-khar" } },
    { typ: "pokoj", d: { A: "aurelia", B: "czarny-smok" } },
    { typ: "zerwanie", d: { rodzaj: "sojusz", nazwa: "Wieczna Przyjaźń na Zawsze", lista: ["goblandia", "krag-mhor"] } },
    { typ: "traktat", d: { rodzaj: "wasalstwo", nazwa: "Hołd Pustej Sakiewki", lista: ["goblandia", "gor-khar"] } },
    { typ: "traktat", d: { rodzaj: "handel", nazwa: "Szlak Kryształowej Łuski", lista: ["aurelia", "czarny-smok"] } },
    { typ: "gm", d: { tekst: "Z dworu Czarnego Smoka zniknęła Baba Jaga. Chatka na kurzych nogach odeszła razem z nią, zostawiając jajko i niezapłacony rachunek za siano" } },
  ].map(z => ({ ...z, kraje: [] })),
  staty: { przed: { goblandia: { prowincje: 17 }, "gor-khar": { prowincje: 19 }, "krag-mhor": { prowincje: 18 }, "rogus-ardens": { prowincje: 18 } },
    teraz: { goblandia: { prowincje: 12 }, "gor-khar": { prowincje: 23 }, "krag-mhor": { prowincje: 17 }, "rogus-ardens": { prowincje: 19 } } },
});
