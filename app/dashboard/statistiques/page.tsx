"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Chart from "@/components/Chart";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Statistics {
  parType: Array<{ _id: string; count: number }>;
  parQuartier: Array<{ _id: string; count: number }>;
  parEtat: Array<{ _id: string; count: number }>;
  evolution: Array<{ _id: { year: number; month: number }; count: number }>;
  parDepartement: Array<{ _id: string; count: number }>;
  parCommune: Array<{ _id: string; count: number }>;
  parArrondissement: Array<{ _id: string; count: number }>;
  parVillage: Array<{ _id: string; count: number }>;
}

export default function StatistiquesPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDepartement, setSelectedDepartement] = useState("Littoral");
  const [selectedCommune, setSelectedCommune] = useState("");
  const [selectedArrondissement, setSelectedArrondissement] = useState("");
  const [communeData, setCommuneData] = useState<
    Array<{ _id: string; count: number }>
  >([]);
  const [arrondissementData, setArrondissementData] = useState<
    Array<{ _id: string; count: number }>
  >([]);
  const [villageData, setVillageData] = useState<
    Array<{ _id: string; count: number }>
  >([]);

  useEffect(() => {
    if (!token) return;
    fetchStatistics();
    fetchCommunes("Littoral");
    fetchArrondissementsByDepartement("Littoral");
  }, [token]);

  const fetchStatistics = async () => {
    if (!token) {
      console.log("Token non disponible");
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Statistics data:", response.data);
      setStats(response.data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunes = async (departement: string) => {
    if (!departement || !token) {
      setCommuneData([]);
      return;
    }
    const response = await axios.get(`${API_URL}/statistics/communes`, {
      params: { departement },
      headers: { Authorization: `Bearer ${token}` },
    });
    setCommuneData(response.data.data || []);
  };

  const fetchArrondissements = async (commune: string) => {
    if (!commune || !token) {
      setArrondissementData([]);
      return;
    }
    const response = await axios.get(`${API_URL}/statistics/arrondissements`, {
      params: { commune },
      headers: { Authorization: `Bearer ${token}` },
    });
    setArrondissementData(response.data.data || []);
  };

  const fetchArrondissementsByDepartement = async (departement: string) => {
    if (!departement || !token) {
      setArrondissementData([]);
      return;
    }
    const response = await axios.get(`${API_URL}/statistics/arrondissements`, {
      params: { departement },
      headers: { Authorization: `Bearer ${token}` },
    });
    setArrondissementData(response.data.data || []);
  };

  const fetchVillages = async (arrondissement: string) => {
    if (!arrondissement || !token) {
      setVillageData([]);
      return;
    }
    const response = await axios.get(`${API_URL}/statistics/villages`, {
      params: { arrondissement },
      headers: { Authorization: `Bearer ${token}` },
    });
    setVillageData(response.data.data || []);
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500">Erreur de chargement</div>
    );
  }

  const officialDepartements = [
    "Alibori",
    "Atacora",
    "Atlantique",
    "Borgou",
    "Collines",
    "Couffo",
    "Donga",
    "Littoral",
    "Mono",
    "Ouémé",
    "Plateau",
    "Zou",
  ];

  const departementsChartData = officialDepartements.map((name) => {
    const match = stats.parDepartement.find((item) => item._id === name);
    return {
      _id: name,
      count: match ? match.count : 0,
    };
  });

  const officialCommunesByDepartement: Record<string, string[]> = {
    Alibori: [
      "Banikoara",
      "Gogounou",
      "Kandi",
      "Karimama",
      "Malanville",
      "Ségbana",
    ],
    Atacora: [
      "Boukoumbé",
      "Cobly",
      "Kérou",
      "Kouandé",
      "Matéri",
      "Natitingou",
      "Pehunco",
      "Tanguiéta",
      "Toucountouna",
    ],
    Atlantique: [
      "Abomey-Calavi",
      "Allada",
      "Kpomassè",
      "Ouidah",
      "Sô-Ava",
      "Toffo",
      "Tori-Bossito",
      "Zè",
    ],
    Borgou: [
      "Bembèrèkè",
      "Kalalé",
      "N’Dali",
      "Nikki",
      "Parakou",
      "Pèrèrè",
      "Sinendé",
      "Tchaourou",
    ],
    Collines: ["Bantè", "Dassa-Zoumè", "Glazoué", "Ouèssè", "Savalou", "Savè"],
    Couffo: [
      "Aplahoué",
      "Djakotomey",
      "Dogbo",
      "Klouékanmè",
      "Lalo",
      "Toviklin",
    ],
    Donga: ["Bassila", "Copargo", "Djougou", "Ouaké"],
    Littoral: ["Cotonou"],
    Mono: ["Athiémé", "Bopa", "Comè", "Grand-Popo", "Houéyogbé", "Lokossa"],
    Ouémé: [
      "Adjarra",
      "Adjohoun",
      "Aguégués",
      "Akpro-Missérété",
      "Avrankou",
      "Bonou",
      "Dangbo",
      "Porto-Novo",
      "Sèmè-Kpodji",
    ],
    Plateau: ["Adja-Ouèrè", "Ifangni", "Kétou", "Pobè", "Sakété"],
    Zou: [
      "Abomey",
      "Agbangnizoun",
      "Bohicon",
      "Covè",
      "Djidja",
      "Ouinhi",
      "Za-Kpota",
      "Zagnanado",
      "Zogbodomey",
    ],
  };

  const normalizeText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/’/g, "'")
      .toLowerCase();

  const officialCommunesAll = Object.values(
    officialCommunesByDepartement,
  ).flat();
  const selectedCommunes = selectedDepartement
    ? officialCommunesByDepartement[selectedDepartement] || []
    : officialCommunesAll;

  const communeChartData = selectedCommunes.map((name) => {
    const dataSource = selectedDepartement ? communeData : stats.parCommune;
    const match = dataSource.find(
      (item) => normalizeText(item._id) === normalizeText(name),
    );
    return {
      _id: name,
      count: match ? match.count : 0,
    };
  });

  const communeOptions = selectedCommunes;

  const officialArrondissementsByCommune: Record<string, string[]> = {
    Banikoara: [
      "Banikoara",
      "Founougo",
      "Gomparou",
      "Goumori",
      "Kokey",
      "Kokiborou",
      "Ounet",
      "Sompérékou",
      "Soroko",
      "Toura",
    ],
    Gogounou: [
      "Bagou",
      "Gogounou",
      "Gounarou",
      "Ouara",
      "Sori",
      "Zoungou-Pantrossi",
    ],
    Kandi: [
      "Angaradébou",
      "Bensékou",
      "Donwari",
      "Kandi I",
      "Kandi II",
      "Kandi III",
      "Kassakou",
      "Saah",
      "Sam",
      "Sonsoro",
    ],
    Karimama: ["Birni Lafia", "Bogo-Bogo", "Karimama", "Kompa", "Monsey"],
    Malanville: ["Garou", "Guéné", "Malanville", "Madécali", "Toumboutou"],
    Ségbana: ["Libantè", "Liboussou", "Lougou", "Ségbana", "Sokotindji"],
    Boukoumbé: [
      "Boukoumbé",
      "Dipoli",
      "Korontière",
      "Kossoucoingou",
      "Manta",
      "Natta",
      "Tabota",
    ],
    Cobly: ["Cobly", "Datori", "Kountori", "Tapoga"],
    Kérou: ["Brignamaro", "Firou", "Kérou", "Koabagou"],
    Kouandé: [
      "Birni",
      "Chabi-Couma",
      "Fô-Tancé",
      "Guilmaro",
      "Kouandé",
      "Oroukayo",
    ],
    Matéri: [
      "Dassari",
      "Gouandé",
      "Matéri",
      "Nodi",
      "Tantéga",
      "Tchianhoun-Cossi",
    ],
    Natitingou: [
      "Kotopounga",
      "Kouaba",
      "Koundata",
      "Natitingou I",
      "Natitingou II",
      "Natitingou III",
      "Natitingou IV",
      "Perma",
      "Tchoumi-Tchoumi",
    ],
    Péhunco: ["Gnémasson", "Péhunco", "Tobré"],
    Tanguiéta: ["Cotiakou", "N'Dahonta", "Taiakou", "Tanguiéta", "Tanongou"],
    Toucountouna: ["Kouarfa", "Tampégré", "Toucountouna"],
    "Abomey-Calavi": [
      "Abomey-Calavi",
      "Akassato",
      "Godomey",
      "Glo-Djigbé",
      "Hêvié",
      "Kpanroun",
      "Ouèdo",
      "Togba",
      "Zinvié",
    ],
    Allada: [
      "Agbanou",
      "Ahouannonzoun",
      "Allada",
      "Attogon",
      "Avakpa",
      "Ayou",
      "Hinvi",
      "Lissègazoun",
      "Lon-Agonmey",
      "Sekou",
      "Togoudo",
      "Tokpa-Avagoudo",
    ],
    Kpomassè: [
      "Aganmalomè",
      "Agbanto",
      "Agonkanmè",
      "Dédomè",
      "Dékanmè",
      "Kpomassè",
      "Sègbèya",
      "Sègbohouè",
      "Tokpa-Domè",
    ],
    Ouidah: [
      "Avlékété",
      "Djègbadji",
      "Gakpé",
      "Houakpè-Daho",
      "Ouidah I",
      "Ouidah II",
      "Ouidah III",
      "Ouidah IV",
      "Pahou",
      "Savi",
    ],
    "Sô-Ava": [
      "Ahomey-Lokpo",
      "Dékanmey",
      "Ganvié I",
      "Ganvié II",
      "Houédo-Aguékon",
      "Sô-Ava",
      "Vekky",
    ],
    Toffo: [
      "Agué",
      "Colli-Agbamè",
      "Coussi",
      "Damè",
      "Djanglanmè",
      "Houègbo",
      "Kpomè",
      "Sè",
      "Sèhouè",
      "Toffo-Agué",
    ],
    "Tori-Bossito": [
      "Avamè",
      "Azohouè-Aliho",
      "Azohouè-Cada",
      "Tori-Bossito",
      "Tori-Cada",
      "Tori-Gare",
      "Tori aïdohoue",
      "Tori acadjamè",
    ],
    Zè: [
      "Adjan",
      "Dawè",
      "Djigbé",
      "Dodji-Bata",
      "Hèkanmé",
      "Koundokpoé",
      "Sèdjè-Dénou",
      "Sèdjè-Houégoudo",
      "Tangbo-Djevié",
      "Yokpo",
      "Zè",
    ],
    Bembéréké: ["Bembéréké", "Béroubouay", "Bouanri", "Gamia", "Ina"],
    Kalalé: ["Basso", "Bouka", "Dérassi", "Dunkassa", "Kalalé", "Péonga"],
    "N'Dali": ["Bori", "Gbégourou", "N'Dali", "Ouénou", "Sirarou"],
    Nikki: [
      "Biro",
      "Gnonkourakali",
      "Nikki",
      "Ouénou",
      "Sérékalé",
      "Suya",
      "Tasso",
    ],
    Parakou: [
      "1er arrondissement de Parakou",
      "2e arrondissement de Parakou",
      "3e arrondissement de Parakou",
    ],
    Pèrèrè: ["Gninsy", "Guinagourou", "Kpané", "Pébié", "Pèrèrè", "Sontou"],
    Sinendé: ["Fô-Bourè", "Sèkèrè", "Sikki", "Sinendé"],
    Tchaourou: [
      "Alafiarou",
      "Bétérou",
      "Goro",
      "Kika",
      "Sanson",
      "Tchaourou",
      "Tchatchou",
    ],
    Bantè: [
      "Agoua",
      "Akpassi",
      "Atokoligbé",
      "Bantè",
      "Bobè",
      "Gouka",
      "Koko",
      "Lougba",
      "Pira",
    ],
    "Dassa-Zoumè": [
      "Akofodjoulè",
      "Dassa I",
      "Dassa II",
      "Gbaffo",
      "Kerè",
      "Kpingni",
      "Lèma",
      "Paouignan",
      "Soclogbo",
      "Tré",
    ],
    Glazoué: [
      "Aklankpa",
      "Assanté",
      "Glazoué",
      "Gomè",
      "Kpakpaza",
      "Magoumi",
      "Ouèdèmè",
      "Sokponta",
      "Thio",
      "Zaffé",
    ],
    Ouèssè: [
      "Challa-Ogoi",
      "Djègbè",
      "Gbanlin",
      "Kémon",
      "Kilibo",
      "Laminou",
      "Odougba",
      "Ouèssè",
      "Toui",
    ],
    Savalou: [
      "Djaloukou",
      "Doumè",
      "Gobada",
      "Kpataba",
      "Lahotan",
      "Lèma",
      "Logozohè",
      "Monkpa",
      "Ottola",
      "Ouèssè",
      "Savalou-aga",
      "Savalou-agbado",
      "Savalou-attakè",
      "Tchetti",
    ],
    Savè: [
      "Adido",
      "Bèssè",
      "Boni",
      "Kaboua",
      "Ofè",
      "Okpara",
      "Plateau",
      "Sakin",
    ],
    Bassila: ["Alédjo", "Bassila", "Manigri", "Pénéssoulou"],
    Copargo: ["Anandana", "Copargo", "Pabégou", "Singré"],
    Djougou: [
      "Barei",
      "Bariénou",
      "Bélléfoungou",
      "Bougou",
      "Djougou I",
      "Djougou II",
      "Djougou III",
      "Kolokondé",
      "Onklou",
      "Patargo",
      "Pélébina",
      "Sérou",
    ],
    Ouaké: ["Badjoudè", "Kondé", "Ouaké", "Sèmèrè I", "Sèmèrè II", "Tchalinga"],
    Aplahoué: [
      "Aplahoué",
      "Atomè",
      "Azovè",
      "Dekpo",
      "Godohou",
      "Kissamey",
      "Lonkly",
    ],
    Djakotomey: [
      "Adjintimey",
      "Bètoumey",
      "Djakotomey I",
      "Djakotomey II",
      "Gohomey",
      "Houègamey",
      "Kinkinhoué",
      "Kokohoué",
      "Kpoba",
      "Sokouhoué",
    ],
    "Dogbo-Tota": [
      "Ayomi",
      "Dèvè",
      "Honton",
      "Lokogohoué",
      "Madjrè",
      "Tota",
      "Totchagni",
    ],
    Klouékanmè: [
      "Adjanhonmè",
      "Ahogbèya",
      "Aya-Hohoué",
      "Djotto",
      "Hondji",
      "Klouékanmè",
      "Lanta",
      "Tchikpé",
    ],
    Lalo: [
      "Adoukandji",
      "Ahondjinnako",
      "Ahomadegbe",
      "Banigbé",
      "Gnizounmè",
      "Hlassamè",
      "Lalo",
      "Lokogba",
      "Tchito",
      "Tohou",
      "Zalli",
    ],
    Toviklin: [
      "Adjido",
      "Avédjin",
      "Doko",
      "Houédogli",
      "Missinko",
      "Tannou-Gola",
      "Toviklin",
    ],
    Cotonou: [
      "1er arrondissement de Cotonou",
      "2e arrondissement de Cotonou",
      "3e arrondissement de Cotonou",
      "4e arrondissement de Cotonou",
      "5e arrondissement de Cotonou",
      "6e arrondissement de Cotonou",
      "7e arrondissement de Cotonou",
      "8e arrondissement de Cotonou",
      "9e arrondissement de Cotonou",
      "10e arrondissement de Cotonou",
      "11e arrondissement de Cotonou",
      "12e arrondissement de Cotonou",
      "13e arrondissement de Cotonou",
    ],
    Athiémé: ["Adohoun", "Atchannou", "Athiémé", "Dédékpoé", "Kpinnou"],
    Bopa: [
      "Agbodji",
      "Badazoui",
      "Bopa",
      "Gbakpodji",
      "Lobogo",
      "Possotomè",
      "Yégodoé",
    ],
    Comè: ["Agatogbo", "Akodéha", "Comè", "Ouèdèmè-Pédah", "Oumako"],
    "Grand-Popo": [
      "Adjaha",
      "Agoué",
      "Avloh",
      "Djanglanmey",
      "Gbéhoué",
      "Grand-Popo",
      "Sazoué",
    ],
    Houéyogbé: ["Dahé", "Doutou", "Honhoué", "Houéyogbé", "Sè", "Zoungbonou"],
    Lokossa: ["Agamé", "Houin", "Koudo", "Lokossa", "Ouèdèmè"],
    Adjarra: [
      "Adjarra I",
      "Adjarra II",
      "Aglôgbé",
      "Honvié",
      "Malanhoui",
      "Médédjonou",
    ],
    Adjohoun: [
      "Adjohoun",
      "Akpadanou",
      "Awonou",
      "Azowlissè",
      "Dèmè",
      "Gangban",
      "Kodè",
      "Togbota",
    ],
    Aguégués: ["Avagbodji", "Houédomè", "Zoungamè"],
    "Akpro-Missérété": [
      "Akpro-Missérété",
      "Gomè-Sota",
      "Katagon",
      "Vakon",
      "Zodogbomey",
    ],
    Avrankou: [
      "Atchoukpa",
      "Avrankou",
      "Djomon",
      "Gbozounmè",
      "Kouty",
      "Ouanho",
      "Sado",
    ],
    Bonou: ["Affamè", "Atchonsa", "Bonou", "Damè-Wogon", "Houinviguè"],
    Dangbo: [
      "Dangbo",
      "Dèkin",
      "Gbéko",
      "Houédomey",
      "Hozin",
      "Késsounou",
      "Zounguè",
    ],
    "Porto-Novo": [
      "1er arrondissement",
      "2e arrondissement",
      "3e arrondissement",
      "4e arrondissement",
      "5e arrondissement",
    ],
    "Sèmè-Kpodji": [
      "Agblangandan",
      "Aholouyèmè",
      "Djèrègbè",
      "Ekpè",
      "Sèmè-Kpodji",
      "Tohouè",
    ],
    "Adja-Ouèrè": [
      "Adja-Ouèrè",
      "Ikpinlè",
      "Kpoulou",
      "Massè",
      "Oko-Akarè",
      "Totonnoukon",
    ],
    Ifangni: [
      "Banigbé",
      "Daagbé",
      "Ifangni",
      "Ko-Koumolou",
      "Lagbé",
      "Tchaada",
    ],
    Kétou: ["Adakplamé", "Idigny", "Kpankou", "Kétou", "Odometa", "Okpometa"],
    Pobè: ["Ahoyéyé", "Igana", "Issaba", "Pobè", "Towé"],
    Sakété: ["Aguidi", "Ita-Djèbou", "Sakété I", "Sakété II", "Takon", "Yoko"],
    Abomey: [
      "Agbokpa",
      "Dètohou",
      "Djègbè",
      "Hounli",
      "Sèhoun",
      "Vidolè",
      "Zounzounmè",
    ],
    Agbangnizoun: [
      "Adahondjigon",
      "Adingningon",
      "Agbangnizoun",
      "Kinta",
      "Kpota",
      "Lissazounmè",
      "Sahé",
      "Siwé",
      "Tanvé",
      "Zoungoudo",
    ],
    Bohicon: [
      "Agongointo",
      "Avogbanna",
      "Bohicon I",
      "Bohicon II",
      "Gnidjazoun",
      "Lissèzoun",
      "Ouassaho",
      "Passagon",
      "Saclo",
      "Sodohomè",
    ],
    Covè: [
      "Adogbé",
      "Gounli",
      "Houéko",
      "Houen-Hounso",
      "Lahinta-Cogbè",
      "Naogon",
      "Soli",
      "Zogba",
    ],
    Djidja: [
      "Agondji",
      "Agouna",
      "Dan",
      "Djidja",
      "Dohouimè",
      "Gobaix",
      "Monsourou",
      "Mougnon",
      "Oungbègamè",
      "Houto",
      "Setto",
      "Zoukon",
    ],
    Ouinhi: ["Dasso", "Ouinhi", "Sagon", "Tohoué"],
    "Za-Kpota": [
      "Allahé",
      "Assalin",
      "Houngomey",
      "Kpakpamè",
      "Kpozoun",
      "Za-Kpota",
      "Za-Tanta",
      "Zèko",
    ],
    Zagnanado: [
      "Agonli-Houégbo",
      "Banamè",
      "N'-Tan",
      "Dovi",
      "Kpédékpo",
      "Zagnanado",
    ],
    Zogbodomey: [
      "Akiza",
      "Avlamè",
      "Cana I",
      "Cana II",
      "Domè",
      "Koussoukpa",
      "Kpokissa",
      "Massi",
      "Tanwé-Hessou",
      "Zogbodomey",
      "Zoukou",
    ],
  };

  const officialArrondissementsAll = Object.values(
    officialArrondissementsByCommune,
  ).flat();

  // Récupérer les arrondissements du département sélectionné
  const getArrondissementsByDepartement = (departement: string) => {
    if (!departement) return officialArrondissementsAll;

    const communesOfDept = officialCommunesByDepartement[departement] || [];
    const arrondissements: string[] = [];

    communesOfDept.forEach((commune) => {
      const arrs = officialArrondissementsByCommune[commune] || [];
      arrondissements.push(...arrs);
    });

    return arrondissements;
  };

  const selectedArrondissements = selectedDepartement
    ? getArrondissementsByDepartement(selectedDepartement)
    : officialArrondissementsAll;

  const arrondissementChartData = selectedArrondissements.map((name) => {
    const dataSource = selectedDepartement
      ? arrondissementData
      : stats.parArrondissement;
    const match = dataSource.find(
      (item) => normalizeText(item._id) === normalizeText(name),
    );
    return {
      _id: name,
      count: match ? match.count : 0,
    };
  });

  const arrondissementOptions = selectedArrondissements;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Statistiques Détaillées
        </h1>
        <p className="text-gray-600 mt-1">Analyse approfondie des données</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Répartition par Type
            </h2>
            {stats.parType && stats.parType.length > 0 ? (
              <Chart
                data={stats.parType}
                type="pie"
                dataKey="count"
                nameKey="_id"
              />
            ) : (
              <p className="text-gray-500 text-center py-8">
                Aucune donnée disponible
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Répartition par État
            </h2>
            {stats.parEtat && stats.parEtat.length > 0 ? (
              <Chart
                data={stats.parEtat}
                type="pie"
                dataKey="count"
                nameKey="_id"
              />
            ) : (
              <p className="text-gray-500 text-center py-8">
                Aucune donnée disponible
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Infrastructures par Département
          </h2>
          <Chart
            data={departementsChartData}
            type="bar"
            dataKey="count"
            nameKey="_id"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Infrastructures par Commune
          </h2>
          <div className="mb-4">
            <select
              value={selectedDepartement}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedDepartement(value);
                setSelectedCommune("");
                setSelectedArrondissement("");
                setVillageData([]);
                fetchCommunes(value);
                fetchArrondissementsByDepartement(value);
              }}
              className="w-full md:w-80 border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Choisir un departement</option>
              {officialDepartements.map((departement) => (
                <option key={departement} value={departement}>
                  {departement}
                </option>
              ))}
            </select>
          </div>
          <Chart
            data={communeChartData}
            type="bar"
            dataKey="count"
            nameKey="_id"
            xAxisFontSize={9}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Infrastructures par Arrondissement
          </h2>
          <Chart
            data={arrondissementChartData}
            type="bar"
            dataKey="count"
            nameKey="_id"
            xAxisFontSize={9}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Évolution (6 derniers mois)
          </h2>
          <Chart
            data={stats.evolution.map((e) => ({
              _id: `${e._id.month}/${e._id.year}`,
              count: e.count,
            }))}
            type="bar"
            dataKey="count"
            nameKey="_id"
          />
        </div>
      </div>
    </div>
  );
}
