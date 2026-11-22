import { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { 
  Rocket, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Lightbulb, 
  Target, 
  Users, 
  User, 
  Camera, 
  Video, 
  Building2, 
  Briefcase, 
  Layers, 
  Check, 
  UploadCloud, 
  FileText, 
  Trash2, 
  Paperclip, 
  Search,
  Globe,
  Landmark,
  Sparkles,
  Users2
} from 'lucide-react';
import { api } from '../../lib/api';

const GABON_PROVINCES = [
  'Estuaire',
  'Haut-Ogooué',
  'Moyen-Ogooué',
  'Ngounié',
  'Nyanga',
  'Ogooué-Ivindo',
  'Ogooué-Lolo',
  'Ogooué-Maritime',
  'Woleu-Ntem'
] as const;

const PROVINCE_CITIES: Record<string, string[]> = {
  'Estuaire': ['Libreville', 'Akanda', 'Owendo', 'Ntoum', 'Kango', 'Cocobeach'],
  'Haut-Ogooué': ['Franceville', 'Moanda', 'Mounana', 'Bongoville', 'Akiéni', 'Okondja', 'Bakoumba', 'Lékoni'],
  'Moyen-Ogooué': ['Lambaréné', 'Ndjolé'],
  'Ngounié': ['Mouila', 'Ndendé', 'Fougamou', 'Lébamba', 'Mbigou', 'Mimongo', 'Mandji'],
  'Nyanga': ['Tchibanga', 'Mayumba', 'Moabi', 'Mabanda'],
  'Ogooué-Ivindo': ['Makokou', 'Booué', 'Mékambo', 'Ovan'],
  'Ogooué-Lolo': ['Koulamoutou', 'Lastoursville', 'Pana', 'Iboundji'],
  'Ogooué-Maritime': ['Port-Gentil', 'Gamba', 'Omboué'],
  'Woleu-Ntem': ['Oyem', 'Bitam', 'Mitzic', 'Minvoul', 'Médouneu']
};

const PROVINCE_DEPARTMENTS: Record<string, string[]> = {
  'Haut-Ogooué': ['Mpassa', 'Lébombi-Léyou', 'Sébé-Brikolo', 'Lékoni-Lékori', 'Djouori-Agnili', 'Plateaux', 'Ogooué-Létili', 'Lékabi-Léwolo', 'Bayi-Brikolo'],
  'Moyen-Ogooué': ['Ogooué et des Lacs', 'Abanga-Bigné'],
  'Ngounié': ['Douya-Onoye', 'Tsamba-Magotsi', 'Boumi-Louetsi', 'Louetsi-Wano', 'Louetsi-Bibaka', 'Ogoulou', 'Dola', 'Ndolou', 'Mougalaba'],
  'Nyanga': ['Mougoutsi', 'Haute-Banio', 'Basse-Banio', 'Douigny', 'Doutsila', 'Mongo'],
  'Ogooué-Ivindo': ['Ivindo', 'Lopé', 'Zadié', 'Mvoung'],
  'Ogooué-Lolo': ['Lolo-Bouénguidi', 'Mulundu', 'Lombo-Bouénguidi', 'Offoué-Onoye'],
  'Ogooué-Maritime': ['Bendjé', 'Ndougou', 'Etimboué'],
  'Woleu-Ntem': ['Woleu', 'Ntem', 'Okano', 'Haut-Ntem', 'Haut-Como']
};

const PROVINCE_QUARTIERS: Record<string, string[]> = {
  'Estuaire': [
    'Louis', 'Glass', 'Oloumi', 'Lalala', 'Nzeng-Ayong', 'Charbonnages', 
    'Angondjé', 'Batterie 4', 'Haut de Gué-Gué', 'Bas de Gué-Gué', 'Mont-Bouët', 
    'Nkembo', 'Cocotiers', 'Plein-Ciel', 'Mindoubé', 'PK 5 - PK 12', 'Alibandeng', 
    'Sablière', 'Avorbam', 'Akournam', 'Alénakiri', 'Essassa', 'Nkoltang'
  ],
  'Haut-Ogooué': [
    'Potos', 'Ongali', 'Yéné', 'Ménaye', 'Saint-Hilaire', 'Sable', 'Mont-Moanda', 
    'Rio', 'Commercial', 'Alliance', 'Lekolo', 'Djouori'
  ],
  'Moyen-Ogooué': [
    'Isaac', 'Adouma', 'Schweitzer', 'Atongowanga', 'Grand-Village', 'Petit Paris', 'Dakar', 'Fang'
  ],
  'Ngounié': [
    'Dikongo', 'Val-Marie', 'Chapelle', 'Mavoundi', 'Moukoundou', 'Bavanga', 'Guidouma'
  ],
  'Nyanga': [
    'Bibora', 'Likoumba', 'Mougoutsi', 'Minvoul-Tchibanga', 'Massanga', 'Mavoungou'
  ],
  'Ogooué-Ivindo': [
    'Epassendjé', 'Allaralang', 'Mbolo', 'Petit Paris', 'Zoatab', 'Mayibouth'
  ],
  'Ogooué-Lolo': [
    'Mayang', 'Mikoumou', 'Bakélé', 'Boulevard', 'Dibangui', 'Bambao'
  ],
  'Ogooué-Maritime': [
    'Cap Lopez', 'Ntchengué', 'Salsa', 'Quartier Chic', 'Grand Village', 'Mosquée', 
    'Balise', 'Sans-Fil', 'Matanda', 'Sindara', 'Sainte-Barbe', 'Château', 'Colombie', 'Yenzi'
  ],
  'Woleu-Ntem': [
    'Akoakam', 'Methui', 'Nkoum', 'Eyenassi', 'Mont-Miyélé', 'Angone', 'Batouri'
  ]
};

// Quartiers spécifiques par Arrondissement pour Libreville, Akanda et Owendo
const LIBREVILLE_ARRONDISSEMENTS_QUARTIERS: Record<string, string[]> = {
  '1er arrondissement': [
    'Batterie 4', 'Haut de Gué-Gué', 'Bas de Gué-Gué', 'Louis', 'Charbonnages', 
    'Alibandeng', 'La Sablière', 'Camp de Police', 'Stade Omnisports', 'Jeanne et Madeleine', 
    'Okala Carrière', 'Ambowè', 'Kalikak'
  ],
  '2e arrondissement': [
    'Nkembo', 'Cocotiers', 'Camp de Gaulle', 'Sotega', 'Atong-Abè', 
    'Plaine-Orety', 'Mont-Bouët (Côté 2e)', 'Belle-Vue 1', 'Belle-Vue 2', 'Université (UOB)'
  ],
  '3e arrondissement': [
    'Kinguélé', 'Belle-Vue 3', 'Sorbonne', 'Likouala', 'Peyrie', 
    'Saint-Michel', 'Nombakélé', 'Mont-Bouët (Grand Marché)', 'Baraka', 'Sainte-Marie'
  ],
  '4e arrondissement': [
    'Glass', 'Oloumi', 'London', 'Plaine-Niger', 'Tolérance', 
    'Baraka Sud', 'Nomba Domaine', 'Awendjé', 'Zone Industrielle Oloumi'
  ],
  '5e arrondissement': [
    'Lalala Dakar', 'Lalala à droite', 'Lalala à gauche', 'Mindoubé 1', 'Mindoubé 2', 
    'Mindoubé 3', 'Ozoungué', 'IAI', 'Plein-Ciel Bissegué', 'Soduco'
  ],
  '6e arrondissement': [
    'Nzeng-Ayong (Nouvelle Cité)', 'Nzeng-Ayong (Fin Goudron)', 'Nzeng-Ayong (Dragages)', 
    'Montalier', 'Sibang', 'PK 5 à PK 8', 'PK 9 à PK 12', 'Melen', 'Beau-Séjour', 'Bambouchine'
  ],
  'Akanda - 1er arrondissement': [
    'Angondjé', 'Avorbam', 'Château', 'La Sablière Nord', 'Delta Postal', 'Cap Caravane'
  ],
  'Akanda - 2e arrondissement': [
    'Cap Estérias', 'Malibé 1', 'Malibé 2'
  ],
  'Owendo - 1er arrondissement': [
    'Akournam 1', 'Akournam 2', 'SNI Owendo', 'Octra', 'Port d\'Owendo'
  ],
  'Owendo - 2e arrondissement': [
    'Alénakiri', 'Razel', 'SETRAG', 'Rougier', 'Barrangoi'
  ]
};

const ESTUAIRE_OTHER_CITIES_QUARTIERS: Record<string, string[]> = {
  'Akanda': [
    'Angondjé', 'Avorbam', 'Château', 'La Sablière Nord', 'Delta Postal', 'Cap Caravane', 'Cap Estérias', 'Malibé 1', 'Malibé 2'
  ],
  'Owendo': [
    'Akournam 1', 'Akournam 2', 'Alénakiri', 'SNI Owendo', 'Octra', 'Port d\'Owendo', 'Razel', 'SETRAG', 'Rougier', 'Barrangoi'
  ],
  'Ntoum': [
    'Centre-ville Ntoum', 'Essassa', 'Nkoltang', 'Bikélé', 'Meyang', 'Donguila'
  ],
  'Cocobeach': [
    'Centre-ville', 'Bord de Mer', 'Mission', 'Plage'
  ],
  'Kango': [
    'Centre-ville', 'Pont de Kango', 'Bokoué', 'Andem'
  ]
};

export default function PublicApplicationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [referenceCode, setReferenceCode] = useState('');
  
  // Étape 1 : Profil & Stade
  const [structureType, setStructureType] = useState<'PORTEUR_IDEE' | 'STARTUP' | 'PME' | 'ORGANISATION' | ''>('');
  const [stage, setStage] = useState('');

  // Helpers de distinction de structure
  const isIndividualOrStartup = structureType === 'PORTEUR_IDEE' || structureType === 'STARTUP';
  const isPmeOrOrg = structureType === 'PME' || structureType === 'ORGANISATION';

  // Étape 2 : Dirigeant / Représentant
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [arrondissement, setArrondissement] = useState('');
  const [department, setDepartment] = useState('');
  const [quartier, setQuartier] = useState('');

  const handleProvinceChange = (newProvince: string) => {
    setProvince(newProvince);
    setCity('');
    setArrondissement('');
    setDepartment('');
    setQuartier('');
  };

  // Liste dynamique des quartiers selon la province, la ville et l'arrondissement précis
  const currentQuartiersSuggestions = useMemo(() => {
    if (province === 'Estuaire') {
      if (arrondissement) {
        const arrTrim = arrondissement.trim();
        const arrLower = arrTrim.toLowerCase();
        
        // Correspondance directe ou partielle avec un arrondissement de Libreville, Akanda ou Owendo
        for (const [key, qList] of Object.entries(LIBREVILLE_ARRONDISSEMENTS_QUARTIERS)) {
          if (arrLower.includes(key.toLowerCase()) || key.toLowerCase().includes(arrLower)) {
            return qList;
          }
        }
        
        // Si l'utilisateur saisit "1", "1er", "2", "3", etc.
        const digitMatch = arrLower.match(/^(\d+)/);
        if (digitMatch && !arrLower.includes('akanda') && !arrLower.includes('owendo')) {
          const num = digitMatch[1];
          const standardKey = `${num}${num === '1' ? 'er' : 'e'} arrondissement`;
          if (LIBREVILLE_ARRONDISSEMENTS_QUARTIERS[standardKey]) {
            return LIBREVILLE_ARRONDISSEMENTS_QUARTIERS[standardKey];
          }
        }
      }
      
      // Si une ville spécifique de l'Estuaire est saisie (ex: Akanda, Owendo, Ntoum...)
      if (city && ESTUAIRE_OTHER_CITIES_QUARTIERS[city]) {
        return ESTUAIRE_OTHER_CITIES_QUARTIERS[city];
      }
      
      return PROVINCE_QUARTIERS['Estuaire'] || [];
    }
    
    return PROVINCE_QUARTIERS[province] || [];
  }, [province, city, arrondissement]);

  // Spécifique Groupe 1 (Porteur d'Idée / Startup)
  const [role, setRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [age, setAge] = useState('');
  const [showcaseUrl, setShowcaseUrl] = useState('');
  const [marketTest, setMarketTest] = useState<'OUI' | 'EN_COURS' | 'NON'>('NON');
  const [oapiProtection, setOapiProtection] = useState<'OUI' | 'EN_COURS' | 'NON'>('NON');
  const [targetMarket, setTargetMarket] = useState<'LOCAL' | 'CEMAC' | 'INTERNATIONAL'>('LOCAL');

  // Spécifique Groupe 2 (PME / Organisation)
  const [position, setPosition] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [headquartersAddress, setHeadquartersAddress] = useState('');
  const [targetClientele, setTargetClientele] = useState<'B2C' | 'B2B' | 'B2G' | 'MIXTE'>('B2B');
  const [hasBankAccount, setHasBankAccount] = useState<'OUI' | 'NON'>('OUI');
  const [orgType, setOrgType] = useState<'COOPERATIVE' | 'GIE' | 'ASSOCIATION' | 'FEDERATION'>('COOPERATIVE');
  const [filiere, setFiliere] = useState('');
  const [membersCount, setMembersCount] = useState<'MOINS_20' | '20_50' | 'PLUS_50'>('20_50');
  const [womenPercentage, setWomenPercentage] = useState('50%');
  const [productionProvince, setProductionProvince] = useState('Estuaire');
  const [hasOfficialRegistration, setHasOfficialRegistration] = useState<'OUI' | 'EN_COURS' | 'NON'>('OUI');

  // Transversaux (Étape 4)
  const [discoveryChannel, setDiscoveryChannel] = useState('RESEAUX_SOCIAUX');
  const [timeSlotPreference, setTimeSlotPreference] = useState<'MATIN' | 'APRES_MIDI' | 'INDIFFERENT'>('INDIFFERENT');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setStepError('La photo ne doit pas dépasser 5 Mo.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  // Étape 3 : Entreprise / Projet
  const [companyName, setCompanyName] = useState('');
  const [sector, setSector] = useState('');
  const [legalStatus, setLegalStatus] = useState('SARL');
  const [rccm, setRccm] = useState('');
  const [nif, setNif] = useState('');
  const [companySize, setCompanySize] = useState('MICRO');
  const [creationYear, setCreationYear] = useState<number>(new Date().getFullYear());
  const [annualRevenue, setAnnualRevenue] = useState('MOINS_10M');
  const [description, setDescription] = useState('');

  // Pièces jointes & Documents pour le suivi
  interface UploadedDoc {
    fileId: string;
    originalName: string;
    size: number;
    mimeType: string;
    category: string;
  }
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadDocError, setUploadDocError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingDoc(true);
    setUploadDocError('');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setUploadDocError(`Le fichier "${file.name}" dépasse la taille maximale autorisée (10 Mo).`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        let res: Response | null = null;
        let lastErr: any = null;

        // Jusqu'à 3 tentatives automatiques pour absorber le réveil à froid de Render
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            res = await fetch('/api/v1/applications/public/attachments', {
              method: 'POST',
              headers: {
                'X-Requested-With': 'iml-digital',
              },
              body: formData,
            });
            if (res && res.ok) break;
          } catch (fetchErr: any) {
            lastErr = fetchErr;
            if (attempt < 3) {
              await new Promise(r => setTimeout(r, 2000 * attempt));
            }
          }
        }

        if (!res && lastErr) {
          throw lastErr;
        }

        if (!res || !res.ok) {
          const errJson = await res?.json().catch(() => null);
          throw new Error(errJson?.error?.message || 'Erreur lors du téléversement du fichier');
        }

        const data = await res.json();
        if (data?.attachment) {
          const lower = file.name.toLowerCase();
          let cat = 'AUTRE';
          if (lower.includes('business') || lower.includes('plan') || lower.includes('bp')) cat = 'BUSINESS_PLAN';
          else if (lower.includes('pitch') || lower.includes('deck') || lower.includes('presentation')) cat = 'PITCH_DECK';
          else if (lower.includes('rccm') || lower.includes('statut') || lower.includes('kbis') || lower.includes('nif')) cat = 'JURIDIQUE';
          else if (lower.includes('cni') || lower.includes('passeport') || lower.includes('identite')) cat = 'IDENTITE';
          else if (lower.includes('devis') || lower.includes('financier') || lower.includes('bilan')) cat = 'FINANCIER';

          setDocuments(prev => [
            ...prev,
            {
              fileId: data.attachment.fileId,
              originalName: data.attachment.originalName,
              size: data.attachment.size,
              mimeType: data.attachment.mimeType,
              category: cat,
            }
          ]);
        }
      } catch (err: any) {
        const isNetworkErr = err?.message === 'Load failed' || err?.message?.includes('Failed to fetch') || err?.name === 'TypeError';
        const errorMsg = isNetworkErr
          ? `Le serveur sécurisé s'active (délai de sécurité gratuit Render). Veuillez patienter 10 secondes et sélectionner à nouveau "${file.name}".`
          : (err?.message || `Échec du téléversement de ${file.name}`);
        setUploadDocError(errorMsg);
      }
    }

    setIsUploadingDoc(false);
    e.target.value = '';
  };

  const handleRemoveDoc = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateDocCategory = (index: number, category: string) => {
    setDocuments(prev => prev.map((doc, i) => i === index ? { ...doc, category } : doc));
  };

  // Étape 4 : Besoins & Modalités
  const [needs, setNeeds] = useState<string[]>([]);
  const [interviewPreference, setInterviewPreference] = useState<'PRESENTIEL' | 'VIDEO'>('PRESENTIEL');
  const [hasVideoEquipment, setHasVideoEquipment] = useState(true);

  // Erreurs de validation par étape
  const [stepError, setStepError] = useState('');

  const mut = useMutation({
    mutationFn: (data: any) => api<{ application: any }>('/applications/submit', { method: 'POST', body: data }),
    onSuccess: (res: any) => {
      const seq = res?.application?.seqNumber;
      const code = seq ? `IML-2026-${String(seq).padStart(4, '0')}` : 'IML-' + Math.floor(100000 + Math.random() * 900000);
      setReferenceCode(code);
      setSubmitted(true);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('iml_last_submission', Date.now().toString());
        } catch {}
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err: any) => {
      setStepError(err?.message || "Une erreur est survenue lors de l'enregistrement de votre candidature.");
    }
  });

  const toggleNeed = (item: string) => {
    setNeeds(prev => 
      prev.includes(item) ? prev.filter(n => n !== item) : [...prev, item]
    );
  };

  const validateStep = (stepNumber: number): boolean => {
    setStepError('');
    if (stepNumber === 1) {
      if (!structureType) {
        setStepError('Veuillez choisir votre situation parmi les 4 options.');
        return false;
      }
      if (!stage) {
        setStepError('Veuillez indiquer où en est votre projet aujourd’hui.');
        return false;
      }
      return true;
    }
    if (stepNumber === 2) {
      if (!firstName.trim() || !lastName.trim()) {
        setStepError('Veuillez renseigner votre prénom et votre nom.');
        return false;
      }
      if (!email.trim() || !email.includes('@')) {
        setStepError('Veuillez renseigner une adresse email valide.');
        return false;
      }
      if (!phone.trim()) {
        setStepError('Veuillez renseigner votre numéro de téléphone.');
        return false;
      }
      return true;
    }
    if (stepNumber === 3) {
      if (!companyName.trim()) {
        setStepError('Veuillez renseigner le nom de votre entreprise ou projet.');
        return false;
      }
      if (!sector.trim()) {
        setStepError('Veuillez préciser votre secteur d’activité.');
        return false;
      }
      if (!description.trim()) {
        setStepError('Veuillez présenter brièvement vos activités et vos défis.');
        return false;
      }
      return true;
    }
    if (stepNumber === 4) {
      if (needs.length === 0) {
        setStepError('Veuillez cocher au moins un besoin prioritaire pour votre accompagnement.');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setStepError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 4) {
      handleNext();
      return;
    }
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    const compName = companyName.trim() || 'Entreprise sans nom';

    mut.mutate({
      applicantData: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        photo: (structureType === 'PORTEUR_IDEE' || structureType === 'STARTUP') ? (photoPreview || undefined) : undefined,
        email: email.trim(),
        phone: phone.trim(),
        province: province.trim() || undefined,
        city: city.trim() || undefined,
        arrondissement: province === 'Estuaire' && arrondissement.trim() ? arrondissement.trim() : undefined,
        department: province !== 'Estuaire' && department.trim() ? department.trim() : undefined,
        quartier: quartier.trim() || undefined,
        structureType,
        companyName: compName,
        // Spécifique Porteur / Startup
        role: isIndividualOrStartup ? (role === 'Autre' && customRole.trim() ? customRole.trim() : role) : undefined,
        age: isIndividualOrStartup && age.trim() ? (parseInt(age.trim(), 10) || age.trim()) : undefined,
        ageRange: isIndividualOrStartup && age.trim() ? (parseInt(age.trim(), 10) < 25 ? 'MOINS_25' : parseInt(age.trim(), 10) <= 35 ? '25_35' : 'PLUS_35') : undefined,
        // Spécifique PME / Organisation
        position: isPmeOrOrg ? (position.trim() || undefined) : undefined,
        businessPhone: isPmeOrOrg ? (businessPhone.trim() || undefined) : undefined,
        headquartersAddress: isPmeOrOrg ? (headquartersAddress.trim() || undefined) : undefined,
        // PME juridique
        rccm: (structureType === 'PME' || structureType === 'STARTUP') && rccm.trim() ? rccm.trim() : undefined,
        nif: (structureType === 'PME' || structureType === 'STARTUP') && nif.trim() ? nif.trim() : undefined,
        legalStatus: (structureType === 'PME' || structureType === 'STARTUP') ? legalStatus : undefined,
        companySize: (structureType === 'PME' || structureType === 'STARTUP') ? companySize : undefined,
        annualRevenue: (structureType === 'PME' || structureType === 'STARTUP') ? annualRevenue : undefined,
        creationYear: (structureType === 'PME' || structureType === 'STARTUP') ? creationYear : undefined,
        targetClientele: structureType === 'PME' ? targetClientele : undefined,
        hasBankAccount: structureType === 'PME' ? hasBankAccount : undefined,
        // Organisation / Coopérative
        orgType: structureType === 'ORGANISATION' ? orgType : undefined,
        filiere: structureType === 'ORGANISATION' ? (filiere.trim() || undefined) : undefined,
        membersCount: structureType === 'ORGANISATION' ? membersCount : undefined,
        womenPercentage: structureType === 'ORGANISATION' ? womenPercentage : undefined,
        productionProvince: structureType === 'ORGANISATION' ? productionProvince : undefined,
        hasOfficialRegistration: structureType === 'ORGANISATION' ? hasOfficialRegistration : undefined,
        // Entretien & Transversal
        interviewPreference,
        hasVideoEquipment: interviewPreference === 'VIDEO' ? hasVideoEquipment : false,
        timeSlotPreference,
        discoveryChannel,
      },
      projectData: {
        title: compName,
        description: description.trim(),
        sector: sector.trim(),
        stage: stage,
        needs: needs,
        documents: documents,
        showcaseUrl: isIndividualOrStartup && showcaseUrl.trim() ? showcaseUrl.trim() : undefined,
        marketTest: isIndividualOrStartup ? marketTest : undefined,
        oapiProtection: isIndividualOrStartup ? oapiProtection : undefined,
        targetMarket: isIndividualOrStartup ? targetMarket : undefined,
      }
    });
  };

  const stagesList = structureType === 'PME' ? [
    { id: 'DEMARRAGE', label: '1 à 3 ans', desc: 'Premières années d\'activité' },
    { id: 'CROISSANCE', label: 'En développement', desc: 'Plus de clients et nouveaux recrutements' },
    { id: 'RESTRUCTURATION', label: 'Mise à niveau', desc: 'Passer au numérique et s\'organiser' },
    { id: 'MATURITE', label: 'Maturité (> 5 ans)', desc: 'Nouveaux marchés et investissements' },
  ] : structureType === 'ORGANISATION' ? [
    { id: 'CONSTITUTION', label: 'Constitution / Légalisation', desc: 'Membres regroupés, statut en formalisation' },
    { id: 'DEMARRAGE', label: 'Activité pilote', desc: 'Premières campagnes ou récoltes des membres' },
    { id: 'STRUCTURATION', label: 'Structuration & Mutualisation', desc: 'Équipements et circuits communs' },
    { id: 'EXPANSION', label: 'Croissance & Débouchés', desc: 'Accès aux grands acheteurs et transformation' },
  ] : [
    { id: 'IDEE', label: 'Idée & Cadrage', desc: 'Je réfléchis encore à mon projet' },
    { id: 'PROTOTYPE', label: 'Prototype / Premier lot', desc: 'Première version ou échantillon testé' },
    { id: 'COMMERCIAL', label: 'Lancement marché', desc: 'Premiers clients et premières ventes' },
    { id: 'CROISSANCE', label: 'En accélération', desc: 'Activité grandit et recherche de financements' },
  ];

  const availableNeeds = structureType === 'PME' ? [
    { label: 'Diagnostic stratégique & Financier', desc: 'Analyser la santé de l\'entreprise et optimiser les finances' },
    { label: 'Mise à niveau organisationnelle & RH', desc: 'Mieux organiser les équipes et recruter le bon personnel' },
    { label: 'Transition numérique & Outils digitaux', desc: 'Adopter des outils informatiques pour gagner du temps' },
    { label: 'Accès aux financements & Banques', desc: 'Préparer un dossier solide pour obtenir un crédit bancaire' },
    { label: 'Conformité fiscale & Juridique', desc: 'Être en règle avec les impôts, les contrats et les lois' },
    { label: 'Accès aux marchés & Partenariats', desc: 'Trouver de gros clients et signer des partenariats commerciaux' }
  ] : structureType === 'ORGANISATION' ? [
    { label: 'Structuration juridique & Statuts OHADA', desc: 'Mettre en conformité la coopérative et son registre de membres' },
    { label: 'Organisation de filière & Mutualisation', desc: 'Mutualiser les achats d\'intrants, équipements et stockage' },
    { label: 'Recherche de subventions & Appuis bailleurs', desc: 'Accéder aux fonds dédiés aux coopératives et groupements (BAD, AFD, État)' },
    { label: 'Débouchés commerciaux & Ventes groupées', desc: 'Écouler les productions auprès des grossistes et supermarchés' },
    { label: 'Gestion administrative & Tenue des comptes', desc: 'Organiser la comptabilité et la gouvernance de la coopérative' },
    { label: 'Transformation locale & Normes qualité', desc: 'Améliorer le conditionnement et la conservation des produits' }
  ] : [
    { label: 'Diagnostic & Stratégie', desc: 'Faire le point sur mon projet et définir les bonnes priorités' },
    { label: 'Accompagnement méthodologique', desc: 'Apprendre à bien structurer mon travail étape par étape' },
    { label: 'Mentorat & Coaching individuel', desc: 'Être conseillé et guidé par un expert expérimenté' },
    { label: 'Recherche de financements & Subventions', desc: 'Trouver des aides financières, prêts ou investisseurs' },
    { label: 'Développement commercial & Pitch', desc: 'Trouver des clients, vendre et bien présenter son projet' },
    { label: 'Réseau & Partenariats', desc: 'Rencontrer des professionnels et nouer des collaborations' }
  ];

  const stepsList = [
    { num: 1, title: 'Profil de structure', icon: Briefcase, desc: 'Type & maturité' },
    { num: 2, title: isIndividualOrStartup ? 'Porteur / Fondateur' : 'Représentant', icon: Users, desc: 'Contact & mandat' },
    { num: 3, title: 'Entreprise & Projet', icon: Building2, desc: 'Activité & juridique' },
    { num: 4, title: 'Besoins & Entretien', icon: Target, desc: 'Forfait & rendez-vous' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-4 sm:py-10 px-2.5 sm:px-6 lg:px-8 font-sans selection:bg-[#f06553] selection:text-white">
      <div className="max-w-[1360px] mx-auto space-y-6">
        
        {/* Navigation retour & Suivi de dossier */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#f06553] transition-colors"
            >
              <ArrowLeft className="size-4" /> Retour au site IML Digit
            </Link>

            <span className="text-slate-300">|</span>

            <Link
              to="/suivi-candidature"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#f06553] bg-white hover:bg-orange-50/70 px-3.5 py-1.5 rounded-full border border-slate-200/90 shadow-2xs transition-all cursor-pointer group"
            >
              <Search className="size-3.5 text-[#f06553] group-hover:scale-110 transition-transform" />
              <span>Suivre mon dossier</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Guichet de candidature • Incubateur IML Digit</span>
          </div>
        </div>

        {submitted ? (
          /* =========================================================================
              CONFIRMATION DE SOUMISSION AVEC SUCCÈS
             ========================================================================= */
          <div className="bg-white rounded-3xl p-8 sm:p-14 shadow-2xl border border-slate-100 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300 max-w-2xl mx-auto">
            <div className="size-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="size-10" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3.5 py-1 rounded-full bg-orange-100 text-[#f06553] text-xs font-bold uppercase tracking-wider">
                Numéro de dossier : {referenceCode}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Candidature enregistrée avec succès !
              </h1>
              <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                Votre dossier a bien été transmis aux agents et experts de l'<strong>incubateur IML Digit</strong>.
              </p>
            </div>

            {/* Étapes suivantes */}
            <div className="bg-slate-50 rounded-2xl p-6 text-left border border-slate-200/80 max-w-md mx-auto space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prochaines étapes :</h3>
              <ul className="text-xs sm:text-sm text-slate-700 space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-[#14233c] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                  <span>Examen de recevabilité de votre dossier sous <strong>48 à 72 heures</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-[#14233c] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                  <span>Envoi automatique d'une convocation officielle pour votre entretien d'évaluation (Présentiel à B2 ou Visioconférence).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-[#14233c] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                  <span>Restitution du diagnostic de maturité et intégration dans la promotion d'incubation.</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link 
                to={`/suivi-candidature?code=${encodeURIComponent(referenceCode)}`} 
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white font-extrabold text-sm transition-all shadow-lg shadow-[#f06553]/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="size-4" />
                <span>Suivre mon dossier en direct</span>
              </Link>
              <Link 
                to="/" 
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors shadow-md"
              >
                Retour à l'accueil
              </Link>
            </div>
          </div>
        ) : (
          /* =========================================================================
              FORMULAIRE DE CANDIDATURE PAR ÉTAPES (Centré & Optimisé)
             ========================================================================= */
          <div className="max-w-4xl mx-auto w-full">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
                
                {/* Barre de Stepper Horizontale Supérieure */}
                <div className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {stepsList.map((st, i) => {
                      const isDone = currentStep > st.num;
                      const isCurrent = currentStep === st.num;
                      const IconComp = st.icon;

                      return (
                        <div key={st.num} className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (st.num < currentStep || validateStep(currentStep)) {
                                setCurrentStep(st.num);
                              }
                            }}
                            className={`flex items-center gap-2.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              isCurrent
                                ? 'bg-white text-[#f06553] shadow-xs border border-orange-200 ring-2 ring-[#f06553]/20'
                                : isDone
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-transparent text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <div className={`size-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                              isDone ? 'bg-emerald-600 text-white' : isCurrent ? 'bg-[#f06553] text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {isDone ? <Check className="size-3.5 stroke-[3]" /> : <IconComp className="size-3.5" />}
                            </div>
                            <span className="hidden sm:inline whitespace-nowrap">{st.title}</span>
                          </button>

                          {i < stepsList.length - 1 && (
                            <div className="w-4 sm:w-8 h-0.5 bg-slate-200 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Barre de progression continue - Couleur Unie Simple */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div 
                      className="bg-[#f06553] h-full transition-all duration-300"
                      style={{ width: `${(currentStep / 4) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Formulaire Contenu */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                  
                  {/* Alerte Erreur de validation */}
                  {stepError && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
                      <div className="size-2 rounded-full bg-red-500 animate-ping" />
                      <span>{stepError}</span>
                    </div>
                  )}

                  {/* ===================================================================
                      ÉTAPE 1 : PROFIL DE LA STRUCTURE & MATURITÉ
                     =================================================================== */}
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Briefcase className="size-5 text-[#f06553]" />
                          <h2 className="text-lg font-bold text-slate-900">1. Quel est le profil de votre structure ?</h2>
                        </div>
                        <p className="text-xs text-slate-500">
                          Sélectionnez la catégorie qui décrit le mieux votre activité pour adapter votre accompagnement.
                        </p>
                      </div>

                      {/* 4 Cartes de sélection en Grille Ergonomique (2x2 sur Mobile, 4x1 sur Grand Écran) */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                        {[
                          { id: 'PORTEUR_IDEE', label: "Porteur d'Idée", desc: "Projet ou concept en émergence", icon: Lightbulb, badge: 'Phase 1' },
                          { id: 'STARTUP', label: "Startup", desc: "Projet innovant à fort potentiel", icon: Rocket, badge: 'Innovation' },
                          { id: 'PME', label: "TPE / PME", desc: "Entreprise formelle en activité", icon: Building2, badge: 'Croissance' },
                          { id: 'ORGANISATION', label: "Organisation / Coop", desc: "Groupement, coopérative ou filière", icon: Layers, badge: 'Filière' }
                        ].map((type) => {
                          const IconComp = type.icon;
                          const isSelected = structureType === type.id;
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => {
                                setStructureType(prev => {
                                  const nextVal = prev === type.id ? '' : (type.id as any);
                                  if (nextVal === 'PME' || nextVal === 'ORGANISATION') {
                                    handleRemovePhoto();
                                  }
                                  return nextVal;
                                });
                                setStepError('');
                              }}
                              className={`p-3 sm:p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[110px] sm:h-36 select-none ${
                                isSelected
                                  ? 'border-[#23c3b1] bg-[#23c3b1]/10 text-slate-900 ring-2 ring-[#23c3b1]/30 shadow-sm'
                                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className={`size-7 sm:size-9 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-[#23c3b1] text-white shadow-xs' : 'bg-slate-200 text-slate-600'}`}>
                                  <IconComp className="size-4 sm:size-5" />
                                </div>
                                <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full transition-colors ${isSelected ? 'bg-[#23c3b1] text-white shadow-xs' : 'bg-slate-200 text-slate-600'}`}>
                                  {type.badge}
                                </span>
                              </div>
                              <div className="mt-1 sm:mt-0">
                                <div className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">{type.label}</div>
                                <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 leading-tight line-clamp-2">{type.desc}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Stade d'avancement horizontal (2x2 sur Mobile, 4x1 sur Grand Écran) */}
                      <div className="pt-4 border-t border-slate-100 space-y-2.5 sm:space-y-3">
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Stade de développement actuel
                        </label>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                          {stagesList.map((item) => {
                            const isSelected = stage === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setStage(prev => (prev === item.id ? '' : item.id));
                                  setStepError('');
                                }}
                                className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl text-left border transition-all cursor-pointer select-none flex flex-col justify-between min-h-[64px] sm:min-h-0 ${
                                  isSelected
                                    ? 'border-[#f06553] bg-orange-50/80 text-slate-900 ring-2 ring-[#f06553]/20 shadow-2xs'
                                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <div className="text-xs font-bold leading-tight text-slate-900">{item.label}</div>
                                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 leading-tight">{item.desc}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===================================================================
                      ÉTAPE 2 : DIRIGEANT OU REPRÉSENTANT (Distingue Porteur/Startup vs PME/Organisation)
                     =================================================================== */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="size-5 text-[#f06553]" />
                          <h2 className="text-lg font-bold text-slate-900">
                            {isIndividualOrStartup 
                              ? "2. Profil du Porteur de projet ou Fondateur" 
                              : "2. Représentant légal & Point de contact officiel"}
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500">
                          {isIndividualOrStartup 
                            ? "Ces informations serviront pour adapter votre accompagnement individuel et la création de votre espace sécurisé."
                            : "Coordonnées de la personne habilitée à représenter légalement la structure auprès de l'incubateur IML Digit."}
                        </p>
                      </div>

                      {/* Photo d'identité / Portrait (uniquement pour Bénéficiaire individuel / Porteur d'idée ou Startup) */}
                      {isIndividualOrStartup && (
                        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-4">
                          <div className="relative size-16 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group">
                            {photoPreview ? (
                              <img src={photoPreview} alt="Aperçu photo" className="size-full object-cover" />
                            ) : (
                              <User className="size-8 text-slate-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="block text-xs font-bold text-slate-800">
                                Photo du porteur de projet / dirigeant
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                                Recommandé
                              </span>
                            </div>
                            <span className="block text-[11px] text-slate-400 mt-0.5 mb-2">
                              Prise ou fichier (JPG, PNG – max 5 Mo)
                            </span>

                            <input 
                              type="file" 
                              ref={photoInputRef}
                              accept="image/*"
                              onChange={handlePhotoChange}
                              className="hidden" 
                            />

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => photoInputRef.current?.click()}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-all cursor-pointer hover:text-[#f06553] shadow-2xs"
                              >
                                <Camera className="size-3.5 text-[#f06553]" />
                                <span>{photoPreview ? 'Changer la photo' : 'Prendre / Charger'}</span>
                              </button>

                              {photoPreview && (
                                <button
                                  type="button"
                                  onClick={handleRemovePhoto}
                                  className="px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                                  title="Supprimer la photo"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Prénom, Nom */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            {isPmeOrOrg ? "Prénom du représentant" : "Prénom"} <span className="text-[#f06553]">*</span>
                          </label>
                          <input 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required 
                            placeholder=""
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            {isPmeOrOrg ? "Nom du représentant" : "Nom de famille"} <span className="text-[#f06553]">*</span>
                          </label>
                          <input 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required 
                            placeholder=""
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                          />
                        </div>
                      </div>

                      {/* Champs spécifiques : Groupe 1 (Porteur / Startup) */}
                      {isIndividualOrStartup && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-orange-50/40 border border-orange-100">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              Rôle dans le projet
                            </label>
                            <select
                              value={role}
                              onChange={(e) => setRole(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-[#f06553] cursor-pointer"
                            >
                              <option value="">Sélectionnez un rôle...</option>
                              <option value="Porteur de projet">Porteur de projet</option>
                              <option value="Co-fondateur">Co-fondateur</option>
                              <option value="Associé">Associé</option>
                              <option value="Chef de projet">Chef de projet</option>
                              <option value="Chef d'équipe">Chef d'équipe</option>
                              <option value="Leader">Leader</option>
                              <option value="Directeur Général">Directeur Général</option>
                              <option value="Responsable opérationnel">Responsable opérationnel</option>
                              <option value="Autre">Autre</option>
                            </select>
                            {role === 'Autre' && (
                              <input
                                type="text"
                                value={customRole}
                                onChange={(e) => setCustomRole(e.target.value)}
                                placeholder=""
                                className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#f06553]"
                              />
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              Âge
                            </label>
                            <input
                              type="number"
                              min={16}
                              max={99}
                              value={age}
                              onChange={(e) => setAge(e.target.value)}
                              placeholder=""
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-[#f06553] transition-all"
                            />
                          </div>
                        </div>
                      )}

                      {/* Champs spécifiques : Groupe 2 (PME / Organisation) */}
                      {isPmeOrOrg && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              Fonction et Mandat officiel <span className="text-[#f06553]">*</span>
                            </label>
                            <input
                              value={position}
                              onChange={(e) => setPosition(e.target.value)}
                              placeholder=""
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                            />
                          </div>

                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              Quartier et Zone du Siège
                            </label>
                            <input
                              value={headquartersAddress}
                              onChange={(e) => setHeadquartersAddress(e.target.value)}
                              placeholder=""
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                            />
                          </div>

                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              Téléphone du bureau et Siège (Optionnel)
                            </label>
                            <input
                              value={businessPhone}
                              onChange={(e) => setBusinessPhone(e.target.value)}
                              placeholder=""
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Coordonnées de contact (Email & Téléphone WhatsApp) */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            {isPmeOrOrg ? "Adresse e-mail professionnelle" : "Adresse e-mail"} <span className="text-[#f06553]">*</span>
                          </label>
                          <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                            placeholder=""
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Téléphone WhatsApp et Appel direct <span className="text-[#f06553]">*</span>
                          </label>
                          <input 
                            type="tel" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required 
                            placeholder=""
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                          />
                        </div>
                      </div>

                      {/* Localisation dynamique adaptée par Province : Province, Ville, Arrondissement (Estuaire) ou Département (Autres provinces), Quartier */}
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* 1. Province */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                              Province <span className="text-[#f06553]">*</span>
                            </label>
                            <select
                              value={province}
                              onChange={(e) => handleProvinceChange(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all cursor-pointer font-medium"
                            >
                              <option value="">Sélectionnez une province...</option>
                              {GABON_PROVINCES.map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>

                          {/* 2. Ville */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                              {isPmeOrOrg ? "Ville d'implantation" : "Ville"} <span className="text-[#f06553]">*</span>
                            </label>
                            <input 
                              type="text"
                              list="current-province-cities-list"
                              value={city}
                              onChange={(e) => {
                                setCity(e.target.value);
                                setArrondissement('');
                                setDepartment('');
                                setQuartier('');
                              }}
                              required 
                              placeholder=""
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                            />
                            <datalist id="current-province-cities-list">
                              {(PROVINCE_CITIES[province] || []).map((c) => (
                                <option key={c} value={c} />
                              ))}
                            </datalist>
                          </div>

                          {/* 3. Arrondissement (Estuaire / Libreville) OU Département (Autres provinces) */}
                          {province === 'Estuaire' ? (
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Arrondissement
                              </label>
                              <input 
                                type="text"
                                list="arrondissements-list"
                                value={arrondissement}
                                onChange={(e) => {
                                  setArrondissement(e.target.value);
                                  setQuartier('');
                                }}
                                placeholder=""
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                              />
                              <datalist id="arrondissements-list">
                                <option value="1er arrondissement" />
                                <option value="2e arrondissement" />
                                <option value="3e arrondissement" />
                                <option value="4e arrondissement" />
                                <option value="5e arrondissement" />
                                <option value="6e arrondissement" />
                                <option value="Akanda - 1er arrondissement" />
                                <option value="Akanda - 2e arrondissement" />
                                <option value="Owendo - 1er arrondissement" />
                                <option value="Owendo - 2e arrondissement" />
                              </datalist>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Département
                              </label>
                              <input 
                                type="text"
                                list="current-province-departments-list"
                                value={department}
                                onChange={(e) => {
                                  setDepartment(e.target.value);
                                  setQuartier('');
                                }}
                                placeholder=""
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                              />
                              <datalist id="current-province-departments-list">
                                {(PROVINCE_DEPARTMENTS[province] || []).map((d) => (
                                  <option key={d} value={d} />
                                ))}
                              </datalist>
                            </div>
                          )}

                          {/* 4. Quartier */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                              Quartier
                            </label>
                            <input 
                              type="text"
                              list="current-province-quartiers-list"
                              value={quartier}
                              onChange={(e) => setQuartier(e.target.value)}
                              placeholder=""
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                            />
                            <datalist id="current-province-quartiers-list">
                              {currentQuartiersSuggestions.map((q) => (
                                <option key={q} value={q} />
                              ))}
                            </datalist>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ===================================================================
                      ÉTAPE 3 : ENTREPRISE & PROJET
                     =================================================================== */}
                  {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="size-5 text-[#f06553]" />
                          <h2 className="text-lg font-bold text-slate-900">
                            3. Présentation de votre Entreprise ou Projet
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500">
                          Détails juridiques, secteur d'activité et synthèse de vos produits ou services.
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-5">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            {structureType === 'PME' ? "Raison sociale / Nom commercial" : "Nom du projet ou de la structure"} <span className="text-[#f06553]">*</span>
                          </label>
                          <input 
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required 
                            placeholder={structureType === 'PME' ? "Gabon Services & Logistique SARL" : "PayGabon Tech"}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Secteur d'activité <span className="text-[#f06553]">*</span>
                          </label>
                          <input 
                            value={sector}
                            onChange={(e) => setSector(e.target.value)}
                            required 
                            placeholder="Agro, Tech, BTP, Santé..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all" 
                          />
                        </div>
                      </div>

                      {/* SECTION 3.A : SPÉCIFIQUE PORTEUR D'IDÉE & STARTUP (Tous domaines) */}
                      {isIndividualOrStartup && (
                        <div className="p-5 rounded-2xl bg-orange-50/40 border border-orange-100 space-y-4">
                          <div className="flex items-center justify-between border-b border-orange-200/70 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                              <Sparkles className="size-4 text-[#f06553]" />
                              Vitrine, Maturité & Marché visé
                            </span>
                            <span className="text-[11px] font-medium text-slate-500">Innovation & Potentiel</span>
                          </div>

                          {/* Lien vitrine / Réseaux sociaux */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Lien vitrine / Page réseaux sociaux / Démo (Optionnel)
                            </label>
                            <div className="relative">
                              <Globe className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                value={showcaseUrl}
                                onChange={(e) => setShowcaseUrl(e.target.value)}
                                placeholder="https://facebook.com/votre-page ou https://monsite.ga ou boutique WhatsApp"
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#f06553]"
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              Lien vers vos photos de produits, page Facebook, compte Instagram ou prototype.
                            </span>
                          </div>

                          <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Test auprès du marché
                              </label>
                              <select 
                                value={marketTest}
                                onChange={(e) => setMarketTest(e.target.value as any)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#f06553]"
                              >
                                <option value="OUI">Oui, premiers clients / ventes réalisées</option>
                                <option value="EN_COURS">En phase d'échantillons ou test pilote</option>
                                <option value="NON">Pas encore testé sur le marché</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Marché géographique ciblé
                              </label>
                              <select 
                                value={targetMarket}
                                onChange={(e) => setTargetMarket(e.target.value as any)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#f06553]"
                              >
                                <option value="LOCAL">National (Libreville & Gabon)</option>
                                <option value="CEMAC">Sous-région Afrique centrale (CEMAC)</option>
                                <option value="INTERNATIONAL">International / Exportation</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Protection de la marque / brevet
                              </label>
                              <select 
                                value={oapiProtection}
                                onChange={(e) => setOapiProtection(e.target.value as any)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#f06553]"
                              >
                                <option value="NON">Non protégé pour le moment</option>
                                <option value="EN_COURS">Dépôt OAPI en cours</option>
                                <option value="OUI">Marque ou brevet enregistré (OAPI)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SECTION 3.B : SPÉCIFIQUE TPE / PME (Entreprise formelle) */}
                      {structureType === 'PME' && (
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                              <Landmark className="size-4 text-[#23c3b1]" />
                              Données administratives, juridiques & Marché (PME)
                            </span>
                            <span className="text-[11px] font-medium text-slate-400">OHADA / Fiscalité</span>
                          </div>

                          <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Forme juridique
                              </label>
                              <select 
                                value={legalStatus}
                                onChange={(e) => setLegalStatus(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                              >
                                <option value="SARL">SARL / SARLU</option>
                                <option value="SAS">SAS / SASU</option>
                                <option value="ETS">Établissement (ETS)</option>
                                <option value="COOPERATIVE">Coopérative / GIE</option>
                                <option value="EN_COURS">En cours d'immatriculation</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                N° RCCM
                              </label>
                              <input 
                                value={rccm}
                                onChange={(e) => setRccm(e.target.value)}
                                placeholder="RG/LIB/2022/B/..."
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                NIF
                              </label>
                              <input 
                                value={nif}
                                onChange={(e) => setNif(e.target.value)}
                                placeholder="123456 A"
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                              />
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Taille effectif
                              </label>
                              <select 
                                value={companySize}
                                onChange={(e) => setCompanySize(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                              >
                                <option value="MICRO">Micro (1 à 5 salariés)</option>
                                <option value="PETITE">Petite (6 à 20 salariés)</option>
                                <option value="MOYENNE">Moyenne (21 à 100 salariés)</option>
                                <option value="GRANDE">Grande (&gt; 100 salariés)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Année de création
                              </label>
                              <input 
                                type="number" 
                                value={creationYear}
                                onChange={(e) => setCreationYear(Number(e.target.value))}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                CA annuel estimé
                              </label>
                              <select 
                                value={annualRevenue}
                                onChange={(e) => setAnnualRevenue(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                              >
                                <option value="MOINS_10M">&lt; 10M FCFA</option>
                                <option value="10M_50M">10M à 50M FCFA</option>
                                <option value="50M_250M">50M à 250M FCFA</option>
                                <option value="PLUS_250M">&gt; 250M FCFA</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Compte bancaire pro
                              </label>
                              <select 
                                value={hasBankAccount}
                                onChange={(e) => setHasBankAccount(e.target.value as any)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                              >
                                <option value="OUI">Oui, compte pro actif</option>
                                <option value="NON">En cours / Non</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Clientèle principale ciblée
                            </label>
                            <select
                              value={targetClientele}
                              onChange={(e) => setTargetClientele(e.target.value as any)}
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                            >
                              <option value="B2C">Particuliers & Grand public (B2C)</option>
                              <option value="B2B">Grandes entreprises & PME partenaires (B2B)</option>
                              <option value="B2G">Marchés publics & Administrations (B2G)</option>
                              <option value="MIXTE">Clientèle mixte (Particuliers & Entreprises)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* SECTION 3.C : SPÉCIFIQUE ORGANISATION / COOPÉRATIVE */}
                      {structureType === 'ORGANISATION' && (
                        <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/70 space-y-4">
                          <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                              <Users2 className="size-4 text-emerald-600" />
                              Structure Collective, Filière & Membres
                            </span>
                            <span className="text-[11px] font-medium text-emerald-700">Filières & Impact</span>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Statut de l'organisation
                              </label>
                              <select 
                                value={orgType}
                                onChange={(e) => setOrgType(e.target.value as any)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                              >
                                <option value="COOPERATIVE">Coopérative simplifiée (OHADA)</option>
                                <option value="GIE">Groupement d'Intérêt Économique (GIE)</option>
                                <option value="ASSOCIATION">Association de producteurs / artisans</option>
                                <option value="FEDERATION">Fédération / Union de coopératives</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Filière / Activité de production <span className="text-[#f06553]">*</span>
                              </label>
                              <input 
                                value={filiere}
                                onChange={(e) => setFiliere(e.target.value)}
                                placeholder="Manioc & Dérivés, Maraîchage, Pêche, Artisanat..."
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Nombre d'adhérents / membres actifs
                              </label>
                              <select 
                                value={membersCount}
                                onChange={(e) => setMembersCount(e.target.value as any)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                              >
                                <option value="MOINS_20">Moins de 20 membres</option>
                                <option value="20_50">20 à 50 membres</option>
                                <option value="PLUS_50">Plus de 50 membres</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Part estimée de femmes parmi les membres
                              </label>
                              <select 
                                value={womenPercentage}
                                onChange={(e) => setWomenPercentage(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                              >
                                <option value="PLUS_50">Majoritairement des femmes (&gt; 50%)</option>
                                <option value="30_50">30% à 50% de femmes</option>
                                <option value="MOINS_30">Moins de 30%</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Province / Bassin d'activité
                              </label>
                              <select 
                                value={productionProvince}
                                onChange={(e) => setProductionProvince(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                              >
                                <option value="Estuaire">Estuaire (Libreville, Ntoum, Kango...)</option>
                                <option value="Woleu-Ntem">Woleu-Ntem (Oyem, Bitam...)</option>
                                <option value="Ngounié">Ngounié (Mouila, Ndendé...)</option>
                                <option value="Ogooué-Maritime">Ogooué-Maritime (Port-Gentil, Gamba...)</option>
                                <option value="Haut-Ogooué">Haut-Ogooué (Franceville, Moanda...)</option>
                                <option value="Moyen-Ogooué">Moyen-Ogooué (Lambaréné...)</option>
                                <option value="Nyanga">Nyanga (Tchibanga...)</option>
                                <option value="Ogooué-Ivindo">Ogooué-Ivindo (Makokou...)</option>
                                <option value="Ogooué-Lolo">Ogooué-Lolo (Koulamoutou...)</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Récépissé ou Agrément officiel du Ministère
                            </label>
                            <select 
                              value={hasOfficialRegistration}
                              onChange={(e) => setHasOfficialRegistration(e.target.value as any)}
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                            >
                              <option value="OUI">Oui, récépissé ou agrément officiel obtenu</option>
                              <option value="EN_COURS">En cours d'enregistrement / formalisation</option>
                              <option value="NON">Non immatriculé pour le moment</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Description des activités & défis */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Présentation des activités & défis actuels <span className="text-[#f06553]">*</span>
                        </label>
                        <textarea 
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          required 
                          rows={4} 
                          placeholder="Présentez brièvement vos activités, vos produits ou services, et vos principaux défis (marché, financement, structuration, etc.)..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all resize-none" 
                        />
                      </div>

                      {/* Téléversement de documents pour le suivi du projet */}
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-200/90 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/70 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                              <UploadCloud className="size-4" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Documents & Pièces jointes pour le suivi
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                Business Plan, Pitch Deck, Statuts, RCCM, Devis, Pièce d'identité...
                              </p>
                            </div>
                          </div>
                          <span className="self-start sm:self-auto text-[10px] font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200/70">
                            Recommandé pour un meilleur suivi
                          </span>
                        </div>

                        {/* Zone de glisser-déposer / sélection de fichiers */}
                        <div className="relative">
                          <input
                            type="file"
                            id="beneficiary-docs-input"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                            onChange={handleFileUpload}
                            disabled={isUploadingDoc}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                          />
                          <div className="p-6 border-2 border-dashed border-slate-300 hover:border-[#23c3b1] rounded-2xl bg-white/80 hover:bg-white flex flex-col items-center justify-center text-center transition-all cursor-pointer group">
                            {isUploadingDoc ? (
                              <div className="flex flex-col items-center gap-2 text-emerald-600 py-2">
                                <Loader2 className="size-6 animate-spin" />
                                <span className="text-xs font-medium">Téléversement de votre document en cours...</span>
                              </div>
                            ) : (
                              <>
                                <div className="size-11 rounded-full bg-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 text-slate-500 flex items-center justify-center mb-2 transition-all">
                                  <Paperclip className="size-5" />
                                </div>
                                <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                  Cliquez pour choisir un ou plusieurs documents, ou glissez-déposez ici
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1">
                                  Formats acceptés : PDF, Word, Excel, PowerPoint, Images (Max 10 Mo par fichier)
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Message d'erreur de téléversement */}
                        {uploadDocError && (
                          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                            <span>⚠️</span>
                            <span>{uploadDocError}</span>
                          </div>
                        )}

                        {/* Liste des documents déjà téléversés */}
                        {documents.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
                              <span>{documents.length} document{documents.length > 1 ? 's' : ''} joint{documents.length > 1 ? 's' : ''} au dossier :</span>
                              <span className="text-[11px] text-emerald-600 font-bold">✓ Prêt pour l'analyse</span>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-2.5">
                              {documents.map((doc, idx) => (
                                <div 
                                  key={idx}
                                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="size-8 rounded-lg bg-slate-100 text-[#14233c] flex items-center justify-center shrink-0">
                                      <FileText className="size-4 text-emerald-600" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-slate-800 truncate" title={doc.originalName}>
                                        {doc.originalName}
                                      </p>
                                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                        <span>{(doc.size / 1024).toFixed(0)} Ko</span>
                                        <span>•</span>
                                        <select
                                          value={doc.category}
                                          onChange={(e) => handleUpdateDocCategory(idx, e.target.value)}
                                          className="text-[10px] font-medium bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600"
                                        >
                                          <option value="BUSINESS_PLAN">Business Plan</option>
                                          <option value="PITCH_DECK">Pitch Deck</option>
                                          <option value="JURIDIQUE">Statuts / RCCM</option>
                                          <option value="IDENTITE">Pièce d'identité</option>
                                          <option value="FINANCIER">Financier / Devis</option>
                                          <option value="AUTRE">Autre document</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDoc(idx)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Supprimer ce document"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ===================================================================
                      ÉTAPE 4 : BESOINS & MODALITÉS D'ENTRETIEN
                     =================================================================== */}
                  {currentStep === 4 && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="size-5 text-[#f06553]" />
                          <h2 className="text-lg font-bold text-slate-900">
                            4. Besoins prioritaires & Modalités d'échange
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500">
                          Identifiez vos attentes d'accompagnement et choisissez votre modalité d'entretien.
                        </p>
                      </div>

                      {/* Grille horizontale des besoins */}
                      <div className="space-y-2.5">
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Vos priorités (cochez les plus pertinentes)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                          {availableNeeds.map((item) => {
                            const isSelected = needs.includes(item.label);
                            return (
                              <button
                                type="button"
                                key={item.label}
                                onClick={() => toggleNeed(item.label)}
                                className={`p-2.5 sm:p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left w-full ${
                                  isSelected
                                    ? 'border-[#f06553] bg-orange-50/70 text-slate-900 shadow-2xs ring-2 ring-[#f06553]/20'
                                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <div className="flex flex-col min-w-0 pr-2 sm:pr-3">
                                  <span className="text-xs font-bold text-slate-900 leading-tight">{item.label}</span>
                                  <span className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 leading-snug">{item.desc}</span>
                                </div>
                                <input 
                                  type="checkbox" 
                                  readOnly 
                                  checked={isSelected} 
                                  className="rounded accent-[#f06553] size-4 pointer-events-none shrink-0" 
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Modalités d'entretien */}
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Modalité souhaitée pour votre entretien de cadrage
                        </label>
                        
                        <div className="grid sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setInterviewPreference('PRESENTIEL')}
                            className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all cursor-pointer text-left w-full ${
                              interviewPreference === 'PRESENTIEL'
                                ? 'border-[#23c3b1] bg-[#23c3b1]/10 ring-2 ring-[#23c3b1]/20 shadow-2xs'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Building2 className={`size-4.5 ${interviewPreference === 'PRESENTIEL' ? 'text-[#23c3b1]' : 'text-slate-500'}`} />
                                <span className="font-bold text-xs sm:text-sm text-slate-900">En présentiel</span>
                              </div>
                              <input
                                type="radio"
                                name="interviewPref"
                                checked={interviewPreference === 'PRESENTIEL'}
                                readOnly
                                className="accent-[#23c3b1] size-4 pointer-events-none"
                              />
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              Dans les locaux d'<strong>IML Digit - Espace PME (Quartier B2, Libreville)</strong>.
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setInterviewPreference('VIDEO')}
                            className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all cursor-pointer text-left w-full ${
                              interviewPreference === 'VIDEO'
                                ? 'border-[#f06553] bg-orange-50/70 ring-2 ring-[#f06553]/20 shadow-2xs'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Video className={`size-4.5 ${interviewPreference === 'VIDEO' ? 'text-[#f06553]' : 'text-slate-500'}`} />
                                <span className="font-bold text-xs sm:text-sm text-slate-900">En visioconférence</span>
                              </div>
                              <input
                                type="radio"
                                name="interviewPref"
                                checked={interviewPreference === 'VIDEO'}
                                readOnly
                                className="accent-[#f06553] size-4 pointer-events-none"
                              />
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              Lien vidéo sécurisé en 1 clic (aucun logiciel à installer, depuis mobile ou PC).
                            </p>
                          </button>
                        </div>

                        {interviewPreference === 'VIDEO' && (
                          <div className="p-3.5 rounded-xl bg-orange-50/80 border border-orange-200/80 animate-in fade-in duration-200 flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              id="hasVideoEquipment"
                              checked={hasVideoEquipment}
                              onChange={(e) => setHasVideoEquipment(e.target.checked)}
                              className="accent-[#f06553] size-4 mt-0.5 shrink-0 cursor-pointer"
                            />
                            <label htmlFor="hasVideoEquipment" className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none">
                              <strong>Confirmation technique</strong> : Je dispose d'un smartphone ou ordinateur avec caméra, micro et connexion Internet stable.
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Créneau horaire préféré */}
                      <div className="pt-4 border-t border-slate-100 space-y-2.5">
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Créneau horaire préféré pour l'entretien
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                          {[
                            { id: 'MATIN', label: 'Matinée', desc: '09h00 - 12h00' },
                            { id: 'APRES_MIDI', label: 'Après-midi', desc: '14h00 - 17h00' },
                            { id: 'INDIFFERENT', label: 'Indifférent', desc: 'Selon disponibilités' },
                          ].map((t) => {
                            const isSelected = timeSlotPreference === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setTimeSlotPreference(t.id as any)}
                                className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-[#23c3b1] bg-[#23c3b1]/10 text-slate-900 ring-2 ring-[#23c3b1]/20 shadow-2xs'
                                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <div className="text-xs font-bold text-slate-900">{t.label}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Canal de découverte */}
                      <div className="pt-4 border-t border-slate-100 space-y-2">
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Comment avez-vous connu l'Incubateur IML Digit ?
                        </label>
                        <select
                          value={discoveryChannel}
                          onChange={(e) => setDiscoveryChannel(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#f06553]"
                        >
                          <option value="RESEAUX_SOCIAUX">Réseaux sociaux (Facebook, LinkedIn, Instagram, TikTok)</option>
                          <option value="BOUCHE_A_OREILLE">Bouche-à-oreille / Recommandation d'un entrepreneur</option>
                          <option value="ESPACE_PME">Passage à l'Espace PME (Quartier B2, Libreville)</option>
                          <option value="EVENEMENT">Événement, Salon, Caravane de l'entrepreneuriat</option>
                          <option value="PARTENAIRE">Partenaire bancaire ou institutionnel (Ministères, Bailleurs)</option>
                          <option value="AUTRE">Autre canal</option>
                        </select>
                      </div>

                    </div>
                  )}

                  {/* ===================================================================
                      BARRE DE NAVIGATION DU STEPPER (Boutons Précédent / Suivant / Valider)
                     =================================================================== */}
                  <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    {currentStep > 1 ? (
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="w-full sm:w-auto px-6 py-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ArrowLeft className="size-4" />
                        <span>Étape précédente</span>
                      </button>
                    ) : (
                      <div className="hidden sm:block" />
                    )}

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {currentStep < 4 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white font-extrabold text-sm shadow-lg shadow-[#f06553]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>Continuer vers l'étape {currentStep + 1}</span>
                          <ArrowRight className="size-4" />
                        </button>
                      ) : (
                        <button 
                          type="submit" 
                          disabled={mut.isPending} 
                          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white font-extrabold text-sm shadow-xl shadow-[#f06553]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                        >
                          {mut.isPending ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              <span>Envoi de votre dossier...</span>
                            </>
                          ) : (
                            <>
                              <Rocket className="size-4" />
                              <span>Soumettre ma candidature au programme</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-center text-[11px] text-slate-400">
                    Vos données sont confidentielles et transmises uniquement aux conseillers certifiés de l'Incubateur Multisectoriel de Libreville.
                  </p>

                </form>

              </div>
            </div>
        )}

      </div>
    </div>
  );
}
