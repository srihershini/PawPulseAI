
import React, { useState, useRef, useEffect } from 'react';
import { Pet, PetType, HealthMetric } from '../types';
import { identifyBreedFromImage, generateFullPetProfile, isApiCoolingDown, getRemainingCooldown } from '../services/geminiService';

interface Breed {
  name: string;
  image: string;
}

interface PetSetupProps {
  pet: Pet;
  onUpdate: (updatedPet: Pet) => void;
  onComplete: () => void;
}

const BreedImage: React.FC<{ src: string; alt: string; isSelected: boolean }> = ({ src, alt, isSelected }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [src]);

  const getFallback = () => {
    const a = alt.toLowerCase();
    if (a.includes('dog')) return 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=60&w=400';
    if (a.includes('cat')) return 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=60&w=400';
    if (a.includes('finches')) return 'https://images.unsplash.com/photo-1555008889-51b2a7a2740a?auto=format&fit=crop&q=60&w=400';
    if (a.includes('canaries')) return 'https://images.unsplash.com/photo-1522913423274-974e548ef86e?auto=format&fit=crop&q=60&w=400';
    if (a.includes('bird')) return 'https://images.unsplash.com/photo-1522913423274-974e548ef86e?auto=format&fit=crop&q=60&w=400';
    if (a.includes('fish')) return 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&q=60&w=400';
    if (a.includes('snake')) return 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&q=60&w=400';
    if (a.includes('hen')) return 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=60&w=400';
    if (a.includes('insects')) return 'https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?auto=format&fit=crop&q=60&w=400';
    if (a.includes('livestock')) return 'https://images.unsplash.com/photo-1589182337358-2cb63099350c?auto=format&fit=crop&q=60&w=400';
    return 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=60&w=400';
  };

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={error ? getFallback() : src}
        alt={alt}
        onLoad={() => setLoading(false)}
        onError={() => {
          if (!error) setError(true);
          else setLoading(false);
        }}
        className={`w-full h-full object-cover transition-all duration-700 ${
          isSelected ? 'scale-110 saturate-100' : 'saturate-[0.85] group-hover:scale-110 group-hover:saturate-100'
        } ${loading ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
};

const PET_TYPES = [
  { type: PetType.DOG, icon: 'fa-dog', color: 'bg-amber-100 text-amber-600', label: 'Dog' },
  { type: PetType.CAT, icon: 'fa-cat', color: 'bg-rose-100 text-rose-600', label: 'Cat' },
  { type: PetType.BIRD, icon: 'fa-dove', color: 'bg-blue-100 text-blue-600', label: 'Bird' },
  { type: PetType.RABBIT, icon: 'fa-carrot', color: 'bg-emerald-100 text-emerald-600', label: 'Rabbit' },
  { type: PetType.HAMSTER, icon: 'fa-cheese', color: 'bg-orange-100 text-orange-600', label: 'Hamster/Mice' },
  { type: PetType.FISH, icon: 'fa-fish-fins', color: 'bg-cyan-100 text-cyan-600', label: 'Fish' },
  { type: PetType.OTHER, icon: 'fa-paw', color: 'bg-slate-100 text-slate-600', label: 'Other' },
];

const BREED_DATA: Record<string, Breed[]> = {
  [PetType.DOG]: [
    { name: 'Golden Retriever', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400' },
    { name: 'Labrador', image: 'https://images.unsplash.com/photo-1553736026-ff14d1f8d222?auto=format&fit=crop&q=80&w=400' },
    { name: 'Beagle', image: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=400' },
    { name: 'Shih Tzu', image: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&q=80&w=400' },
    { name: 'Poodle', image: 'https://images.unsplash.com/photo-1594005374167-5fd900fb82c9?auto=format&fit=crop&q=80&w=400' },
    { name: 'German Shepherd', image: 'https://images.unsplash.com/photo-1551717743-49959800b1f6?auto=format&fit=crop&q=80&w=400' },
  ],
  [PetType.CAT]: [
    { name: 'Maine Coon', image: 'https://images.unsplash.com/photo-1589883661923-6476cb0ae9f2?auto=format&fit=crop&q=80&w=400' },
    { name: 'British Shorthair', image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&q=80&w=400' },
    { name: 'Siamese', image: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&q=80&w=400' },
    { name: 'Persian Cat', image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&q=80&w=400' },
  ],
  [PetType.BIRD]: [
    { name: 'Love Birds', image: 'https://images.unsplash.com/photo-1620694563886-c3a80ec55f41?auto=format&fit=crop&q=80&w=400' },
    { name: 'Parrot', image: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&q=80&w=400' },
    { name: 'Budgies', image: 'https://images.unsplash.com/photo-1511823794984-b87716139b88?auto=format&fit=crop&q=80&w=400&v=3' },
  ],
  [PetType.RABBIT]: [
    { name: 'Holland Lop', image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=400' },
    { name: 'Rex Rabbit', image: 'https://images.unsplash.com/photo-1559214369-a6b1d7919865?auto=format&fit=crop&q=80&w=400' },
  ],
  [PetType.HAMSTER]: [
    { name: 'Syrian Hamster', image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&q=80&w=400' },
    { name: 'Chinese Hamster', image: 'https://images.unsplash.com/photo-1452857297128-d9c29adba80b?auto=format&fit=crop&q=80&w=400' },
  ],
  [PetType.FISH]: [
    { name: 'Goldfish', image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&q=80&w=400' },
    { name: 'Betta Fish', image: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&q=80&w=400' },
    { name: 'Fighter Fish', image: 'https://images.unsplash.com/photo-1620230392601-83196566d919?auto=format&fit=crop&q=80&w=400' },
  ],
  [PetType.OTHER]: [
    { name: 'Snake', image: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&q=80&w=400&v=7' },
    { name: 'Hen', image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=400&v=7' },
    { name: 'Insects', image: 'https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?auto=format&fit=crop&q=80&w=400&v=14' },
    { name: 'Livestock', image: 'https://images.unsplash.com/photo-1589182337358-2cb63099350c?auto=format&fit=crop&q=80&w=400&v=8' },
  ]
};

const PetSetup: React.FC<PetSetupProps> = ({ pet, onUpdate, onComplete }) => {
  const [selectedType, setSelectedType] = useState<PetType | null>(pet.type || null);
  const [selectedBreed, setSelectedBreed] = useState<string>(pet.breed === 'Unknown' ? '' : pet.breed);
  const [petAge, setPetAge] = useState<number>(pet.age || 0);
  const [petGender, setPetGender] = useState<'Male' | 'Female'>(pet.gender || 'Male');
  const [isSpayed, setIsSpayed] = useState<boolean>(pet.cycleTracking?.isSpayed || false);
  const [lastCycleDate, setLastCycleDate] = useState<string>(pet.cycleTracking?.lastCycleStart || '');
  const [isLookingForPartner, setIsLookingForPartner] = useState<boolean>(pet.matingPreferences?.lookingForPartner || false);
  const [matingNotes, setMatingNotes] = useState<string>(pet.matingPreferences?.preferences || '');
  const [initialWeight, setInitialWeight] = useState<string>('');
  const [initialHeight, setInitialHeight] = useState<string>('');
  const [initialVaccineName, setInitialVaccineName] = useState<string>('');
  const [initialVaccineDate, setInitialVaccineDate] = useState<string>('');
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identificationError, setIdentificationError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [setupStep, setSetupStep] = useState<string>('');
  const [cooldown, setCooldown] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const TOTAL_STEPS = 4;

  // Expanded instant breeds to reduce API calls
  const INSTANT_BREEDS = ["Golden Retriever", "Labrador", "Beagle", "Maine Coon", "British Shorthair", "Parrot", "Goldfish", "Betta Fish"];

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown(getRemainingCooldown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSave = async () => {
    if (!selectedType || !selectedBreed) return;

    setIsProcessing(true);
    setSetupStep('Customizing care schedule...');

    try {
      const breedInfo = Object.values(BREED_DATA).flat().find(b => b.name === selectedBreed);
      const insights = await generateFullPetProfile({ breed: selectedBreed, type: selectedType });

      const metrics: HealthMetric[] = [];
      if (initialWeight && initialHeight) {
        metrics.push({
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight: parseFloat(initialWeight),
          height: parseFloat(initialHeight),
          mood: 'Happy',
          activityLevel: 8
        });
      }

      const vaccinations = [...pet.vaccinations];
      if (initialVaccineName && initialVaccineDate) {
        vaccinations.push({
          id: `v-initial-${Date.now()}`,
          name: initialVaccineName,
          dueDate: initialVaccineDate.split('-').reverse().join('.'),
          isRequired: true
        });
      }

      onUpdate({
        ...pet,
        type: selectedType,
        breed: selectedBreed,
        image: breedInfo?.image || pet.image,
        age: petAge,
        gender: petGender,
        cycleTracking: petGender === 'Female' ? {
          isSpayed: isSpayed,
          lastCycleStart: lastCycleDate,
          expectedNextCycle: (() => {
            if (!lastCycleDate) return undefined;
            const d = new Date(lastCycleDate);
            d.setMonth(d.getMonth() + 6);
            return d.toISOString().split('T')[0];
          })(),
          history: lastCycleDate ? [{ startDate: lastCycleDate }] : []
        } : undefined,
        matingPreferences: petGender === 'Female' ? {
          lookingForPartner: isLookingForPartner,
          preferences: matingNotes
        } : undefined,
        vaccinations: vaccinations,
        dietPlan: insights.dietPlan,
        breedAdvice: insights.breedAdvice,
        dietaryRecommendation: insights.dietaryRecommendation,
        standardHeight: insights.idealHeight,
        metrics: metrics
      });
      
      setIsProcessing(false);
      onComplete();
    } catch (err: any) {
      setIsProcessing(false);
      setSetupStep(`AI Busy. Instant breeds (⚡) work best right now.`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIdentificationError(null);
    setIsIdentifying(true);
    
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result as string;
      try {
        const breed = await identifyBreedFromImage(base64Image);
        
        if (breed === "Unknown Breed") {
          setIdentificationError("AI Quota exhausted. Please choose manually.");
        } else {
          const found = Object.values(BREED_DATA).flat().find(b => 
            b.name.toLowerCase().includes(breed.toLowerCase()) || 
            breed.toLowerCase().includes(b.name.toLowerCase())
          );
          setSelectedBreed(found ? found.name : breed);
        }
      } catch (err: any) {
        setIdentificationError("Service limit reached. Manual selection recommended.");
      } finally {
        setIsIdentifying(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const breeds = selectedType ? BREED_DATA[selectedType] || [{ name: 'Standard', image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=400' }] : [];

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {cooldown > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800 animate-in slide-in-from-top shadow-sm">
          <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center animate-pulse">
            <i className="fas fa-bolt"></i>
          </div>
          <div>
            <p className="text-sm font-bold">Standard AI Offline (Quota Reached)</p>
            <p className="text-[10px] opacity-80 font-medium">Auto-resume in {cooldown}s. Instant breeds marked with ⚡ work immediately!</p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-8 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 ${
                currentStep >= s ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 'bg-slate-200 text-slate-400'
              }`}
            >
              {s}
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-700 ease-out"
            style={{ width: `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">
        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-900 p-12 text-center text-white relative">
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            {currentStep === 1 && "Choose Your Pet Species"}
            {currentStep === 2 && `What breed is ${pet.name}?`}
            {currentStep === 3 && "Pet Personality & Basics"}
            {currentStep === 4 && "Initial Health Stats"}
          </h2>
          <p className="text-indigo-100 text-lg font-medium max-w-2xl mx-auto opacity-90">
            {currentStep === 1 && "Start your journey by telling us what kind of pet you have."}
            {currentStep === 2 && "The right breed helps us customize care and health insights."}
            {currentStep === 3 && "Tell us about your pet's gender and age."}
            {currentStep === 4 && "These help us establish a baseline for your pet's growth."}
          </p>
        </div>

        <div className="p-8 md:p-14 flex-1">
          {currentStep === 1 && (
            <section className="animate-in slide-in-from-right duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">1</div>
                <h3 className="text-2xl font-black text-slate-800">Select Species</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                {PET_TYPES.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => { setSelectedType(item.type); setSelectedBreed(''); setIdentificationError(null); }}
                    className={`flex flex-col items-center p-6 rounded-[2.5rem] border-2 transition-all ${
                      selectedType === item.type ? 'border-indigo-600 bg-indigo-50 shadow-lg' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${item.color}`}>
                      <i className={`fas ${item.icon} text-2xl`}></i>
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {currentStep === 2 && (
            <section className="animate-in slide-in-from-right duration-500">
              <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">2</div>
                  <h3 className="text-2xl font-black text-slate-800">Identify Breed</h3>
                </div>
                <div className="flex flex-col md:flex-row items-end gap-2">
                  <div className="relative w-full md:w-64">
                    <input 
                      type="text"
                      value={selectedBreed}
                      onChange={(e) => setSelectedBreed(e.target.value)}
                      placeholder="Or type breed manually..."
                      className="w-full px-6 py-3 bg-slate-50 border-2 border-slate-200 rounded-full text-xs font-bold outline-none focus:border-indigo-500 transition-all font-sans"
                    />
                  </div>
                  <button 
                    disabled={cooldown > 0}
                    onClick={() => fileInputRef.current?.click()} 
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-30"
                  >
                    <i className="fas fa-magic"></i> AI Photo ID
                  </button>
                  {identificationError && (
                    <p className="text-[10px] text-rose-500 font-bold bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
                      {identificationError}
                    </p>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>

              {isIdentifying ? (
                <div className="py-20 flex flex-col items-center justify-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-indigo-200">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-indigo-600 font-bold uppercase tracking-widest">Running AI Recognition...</p>
                </div>
              ) : (
                <div className="relative group/carousel">
                  <div ref={carouselRef} className="flex overflow-x-auto gap-6 pb-8 snap-x no-scrollbar scroll-smooth">
                    {breeds.map((breed) => (
                      <button
                        key={breed.name}
                        onClick={() => { setSelectedBreed(breed.name); setIdentificationError(null); }}
                        className={`snap-center flex-shrink-0 w-64 rounded-[3rem] overflow-hidden border-4 transition-all ${
                          selectedBreed === breed.name ? 'border-indigo-600 shadow-xl scale-[1.02]' : 'border-white hover:border-indigo-50 shadow-md'
                        }`}
                      >
                        <div className="aspect-[3/4]"><BreedImage src={breed.image} alt={breed.name} isSelected={selectedBreed === breed.name} /></div>
                        <div className={`p-4 text-center font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 ${selectedBreed === breed.name ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'}`}>
                          {breed.name}
                          {INSTANT_BREEDS.includes(breed.name) && (
                            <i className="fas fa-bolt text-[10px] text-amber-400" title="Offline-Ready Instant Profile"></i>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {currentStep === 3 && (
            <section className="animate-in slide-in-from-right duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">3</div>
                <h3 className="text-2xl font-black text-slate-800">Basic Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Pet Age (Years)</label>
                  <input 
                    type="number" 
                    value={petAge} 
                    onChange={(e) => setPetAge(parseInt(e.target.value) || 0)}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 outline-none focus:border-indigo-500 transition-all font-bold text-lg"
                    placeholder="Enter age"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Gender</label>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setPetGender('Male')}
                      className={`flex-1 py-4 rounded-2xl border-2 font-black transition-all ${petGender === 'Male' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}
                    >
                      <i className="fas fa-mars mr-2"></i> Male
                    </button>
                    <button 
                      onClick={() => setPetGender('Female')}
                      className={`flex-1 py-4 rounded-2xl border-2 font-black transition-all ${petGender === 'Female' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}
                    >
                      <i className="fas fa-venus mr-2"></i> Female
                    </button>
                  </div>
                </div>

                {petGender === 'Female' && (
                  <div className="md:col-span-2 mt-4 space-y-6">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs">
                        <i className="fas fa-venus"></i>
                      </div>
                      <h4 className="text-xl font-black text-slate-800">Female Specific Settings</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Spayed Status</label>
                        <div className="flex gap-4">
                          <button 
                            onClick={() => setIsSpayed(true)}
                            className={`flex-1 py-4 rounded-2xl border-2 font-black transition-all ${isSpayed ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}
                          >
                            Yes
                          </button>
                          <button 
                            onClick={() => setIsSpayed(false)}
                            className={`flex-1 py-4 rounded-2xl border-2 font-black transition-all ${!isSpayed ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {!isSpayed && (
                        <div>
                          <label className="block text-xs font-black uppercase tracking-widest text-rose-500 mb-3">Last Mating Cycle</label>
                          <input 
                            type="date" 
                            value={lastCycleDate} 
                            onChange={(e) => setLastCycleDate(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl border-2 border-rose-200 outline-none focus:border-rose-500 transition-all font-bold text-lg"
                          />
                        </div>
                      )}

                      <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-slate-800">Looking for a mating partner?</p>
                          <p className="text-xs text-slate-400">Makes profile visible to other owners.</p>
                        </div>
                        <div 
                          onClick={() => setIsLookingForPartner(!isLookingForPartner)}
                          className={`w-14 h-7 rounded-full relative cursor-pointer transition-all ${isLookingForPartner ? 'bg-rose-500' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isLookingForPartner ? 'left-8' : 'left-1'}`}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {currentStep === 4 && (
            <section className="animate-in slide-in-from-right duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">4</div>
                <h3 className="text-2xl font-black text-slate-800">Health Baseline</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Initial Weight (kg)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={initialWeight} 
                    onChange={(e) => setInitialWeight(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 outline-none focus:border-indigo-500 transition-all font-bold text-lg"
                    placeholder="Enter weight"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Initial Height (cm)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={initialHeight} 
                    onChange={(e) => setInitialHeight(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 outline-none focus:border-indigo-500 transition-all font-bold text-lg"
                    placeholder="Enter height"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Upcoming Vaccine (Name)</label>
                  <input 
                    type="text" 
                    value={initialVaccineName} 
                    onChange={(e) => setInitialVaccineName(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 outline-none focus:border-indigo-500 transition-all font-bold text-lg"
                    placeholder="e.g. Rabies"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Vaccine Date</label>
                  <input 
                    type="date" 
                    value={initialVaccineDate} 
                    onChange={(e) => setInitialVaccineDate(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 outline-none focus:border-indigo-500 transition-all font-bold text-lg"
                  />
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="p-8 md:px-14 md:py-10 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-6">
          <button
            onClick={prevStep}
            disabled={currentStep === 1 || isProcessing}
            className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-800 disabled:opacity-0 transition-all"
          >
            <i className="fas fa-arrow-left"></i> Back
          </button>
          
          <div className="flex-1 text-center">
            {isProcessing && (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                <p className="text-indigo-600 font-bold text-sm tracking-tight">{setupStep}</p>
              </div>
            )}
          </div>

          <button
            disabled={
              (currentStep === 1 && !selectedType) || 
              (currentStep === 2 && !selectedBreed) ||
              isProcessing
            }
            onClick={currentStep === TOTAL_STEPS ? handleSave : nextStep}
            className="px-12 py-5 bg-indigo-600 text-white rounded-full font-black text-lg hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50 flex items-center gap-4 active:scale-95"
          >
            {isProcessing ? 'Finalizing...' : currentStep === TOTAL_STEPS ? 'Complete Profile' : 'Continue'}
            {!isProcessing && <i className={`fas fa-${currentStep === TOTAL_STEPS ? 'check' : 'arrow-right'}`}></i>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetSetup;
