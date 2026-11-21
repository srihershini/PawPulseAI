
import React, { useState, useEffect, useCallback } from 'react';
import { Pet, HealthMetric, DailyDietPlan } from '../types';
import HealthChart from './HealthChart';
import { generateFullPetProfile, isApiCoolingDown, getRemainingCooldown } from '../services/geminiService';

interface DashboardProps {
  pet: Pet;
  onUpdatePet: (updatedPet: Pet) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ pet, onUpdatePet }) => {
  const [advice, setAdvice] = useState<string>(pet.breedAdvice || '');
  const [diet, setDiet] = useState<string>(pet.dietaryRecommendation || '');
  const [structuredDiet, setStructuredDiet] = useState<DailyDietPlan | null>(pet.dietPlan || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newWeight, setNewWeight] = useState('');
  const [newHeight, setNewHeight] = useState('');
  const [exerciseMinutes, setExerciseMinutes] = useState('');
  const [exerciseGoal, setExerciseGoal] = useState(pet.exerciseGoal?.toString() || '30');
  const [cooldown, setCooldown] = useState(0);
  const [newCycleDate, setNewCycleDate] = useState('');
  const [showCycleHistory, setShowCycleHistory] = useState(false);
  const [matingPartner, setMatingPartner] = useState('');
  const [matingDate, setMatingDate] = useState('');
  const [matingNotesInput, setMatingNotesInput] = useState('');
  const [showMatingHistory, setShowMatingHistory] = useState(false);

  const todayKey = new Date().toISOString().split('T')[0];
  const currentExercise = pet.dailyExercise?.[todayKey] || 0;
  const currentGoal = pet.exerciseGoal || 30;
  const progress = Math.min((currentExercise / currentGoal) * 100, 100);

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseMinutes) return;
    const mins = parseInt(exerciseMinutes);
    const updatedDailyExercise = { ...(pet.dailyExercise || {}) };
    updatedDailyExercise[todayKey] = (updatedDailyExercise[todayKey] || 0) + mins;
    
    onUpdatePet({
      ...pet,
      dailyExercise: updatedDailyExercise
    });
    setExerciseMinutes('');
  };

  const handleSetGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseGoal) return;
    onUpdatePet({
      ...pet,
      exerciseGoal: parseInt(exerciseGoal)
    });
  };

  const fetchMissingInfo = useCallback(async (force = false) => {
    const today = new Date().toLocaleDateString('en-GB');
    const needsDailyUpdate = pet.lastDietUpdate !== today;

    // If we have all data AND it's not a new day, don't hit the API at all
    if (!force && !needsDailyUpdate && pet.breedAdvice && pet.dietaryRecommendation && pet.dietPlan && pet.trainingTips && pet.exerciseRecommendations && pet.vaccinations.length > 0) {
      setAdvice(pet.breedAdvice);
      setDiet(pet.dietaryRecommendation);
      setStructuredDiet(pet.dietPlan);
      return;
    }

    if (isApiCoolingDown() && !force && !needsDailyUpdate) {
      setCooldown(getRemainingCooldown());
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const insights = await generateFullPetProfile({ breed: pet.breed, type: pet.type, age: pet.age });
      
      // Add a "Daily Special" or variation to the diet plan if it's a daily update
      if (insights.dietPlan && insights.dietPlan.meals.length > 0) {
        const dailyVariations = [
          "Add a spoonful of pumpkin puree for digestion.",
          "Mix in some blueberries for antioxidants.",
          "Include a small piece of boiled chicken as a topper.",
          "Sprinkle some salmon oil for a shiny coat.",
          "Add a bit of plain Greek yogurt for probiotics."
        ];
        const dayIndex = new Date().getDate() % dailyVariations.length;
        const lastMeal = insights.dietPlan.meals[insights.dietPlan.meals.length - 1];
        lastMeal.notes = `${lastMeal.notes} | Daily Special: ${dailyVariations[dayIndex]}`;
      }

      const updatedPet = {
        ...pet,
        breedAdvice: insights.breedAdvice,
        dietaryRecommendation: insights.dietaryRecommendation,
        dietPlan: insights.dietPlan,
        trainingTips: insights.trainingTips,
        trainingTechniques: insights.trainingTechniques,
        exerciseRecommendations: insights.exerciseRecommendations,
        lastDietUpdate: today,
        // Only auto-populate vaccinations if the user hasn't added any AND we don't have any yet
        vaccinations: pet.vaccinations.length > 0 ? pet.vaccinations : [], 
        standardHeight: insights.idealHeight
      };

      setAdvice(insights.breedAdvice);
      setDiet(insights.dietaryRecommendation);
      setStructuredDiet(insights.dietPlan);
      onUpdatePet(updatedPet);
      setError(null);

    } catch (err: any) {
      setError("AI syncing paused (Quota reached). Manual mode active.");
      setCooldown(getRemainingCooldown() || 60);
    } finally {
      setLoading(false);
    }
  }, [pet, onUpdatePet]);

  useEffect(() => {
    fetchMissingInfo();
    
    const timer = setInterval(() => {
      if (isApiCoolingDown()) {
        setCooldown(getRemainingCooldown());
        if (!error) setError("AI sync paused (Busy). Dashboard features remain fully active.");
      } else {
        setCooldown(0);
        if (error?.includes("sync paused")) setError(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [pet.id, error]);

  const handleAddMetric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || !newHeight) return;

    const newMetric: HealthMetric = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: parseFloat(newWeight),
      height: parseFloat(newHeight),
      mood: 'Happy',
      activityLevel: 7
    };

    onUpdatePet({
      ...pet,
      metrics: [...pet.metrics, newMetric]
    });
    setNewWeight('');
    setNewHeight('');
  };

  const handleAddCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycleDate) return;
    
    const nextCycle = new Date(newCycleDate);
    nextCycle.setMonth(nextCycle.getMonth() + 6);

    const newHistory = [...(pet.cycleTracking?.history || [])];
    newHistory.unshift({ startDate: newCycleDate });

    onUpdatePet({
      ...pet,
      cycleTracking: {
        ...pet.cycleTracking!,
        lastCycleStart: newCycleDate,
        expectedNextCycle: nextCycle.toISOString().split('T')[0],
        history: newHistory
      }
    });
    setNewCycleDate('');
  };
  
  const handleAddMatingEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matingPartner || !matingDate) return;

    const newEvent = {
      id: `mate-${Date.now()}`,
      date: matingDate,
      partnerName: matingPartner,
      notes: matingNotesInput
    };

    onUpdatePet({
      ...pet,
      matingEvents: [newEvent, ...(pet.matingEvents || [])]
    });

    setMatingPartner('');
    setMatingDate('');
    setMatingNotesInput('');
  };

  const calculateDaysLeft = (dueDate: string) => {
    const [day, month, year] = dueDate.split('.');
    const due = new Date(`${year}-${month}-${day}`);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nextVaccine = pet.vaccinations
    .filter(v => !v.completedDate)
    .sort((a, b) => {
      const dateA = a.dueDate.split('.').reverse().join('-');
      const dateB = b.dueDate.split('.').reverse().join('-');
      return dateA.localeCompare(dateB);
    })[0];

  const lastMetric = pet.metrics[pet.metrics.length - 1];
  const firstMetric = pet.metrics[0];
  const weightDiff = lastMetric && firstMetric ? (lastMetric.weight - firstMetric.weight).toFixed(1) : '0';
  const daysLeft = nextVaccine ? calculateDaysLeft(nextVaccine.dueDate) : null;

  const calculatePredictedCycle = (lastStart?: string) => {
    if (!lastStart) return null;
    const last = new Date(lastStart);
    // Dogs/Cats typically have cycles every 6 months (approx 180 days)
    last.setMonth(last.getMonth() + 6);
    return last.toLocaleDateString('en-GB');
  };

  const predictedCycle = pet.cycleTracking?.expectedNextCycle 
    ? new Date(pet.cycleTracking.expectedNextCycle).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : calculatePredictedCycle(pet.cycleTracking?.lastCycleStart);

  const cycleDaysLeft = pet.cycleTracking?.expectedNextCycle
    ? calculateDaysLeft(pet.cycleTracking.expectedNextCycle.split('-').reverse().join('.'))
    : (pet.cycleTracking?.lastCycleStart ? calculateDaysLeft(pet.cycleTracking.lastCycleStart.split('-').reverse().join('.')) + 180 : null);

  const getPetIcon = (type: string, breed?: string) => {
    const b = breed?.toLowerCase() || '';
    if (b.includes('snake')) return 'fa-snake';
    if (b.includes('turtle') || b.includes('tortoise')) return 'fa-turtle';
    if (b.includes('frog')) return 'fa-frog';
    if (b.includes('spider')) return 'fa-spider';
    if (b.includes('horse')) return 'fa-horse';
    if (b.includes('lizard') || b.includes('dragon') || b.includes('gecko')) return 'fa-dragon';
    if (b.includes('pig')) return 'fa-piggy-bank';
    if (b.includes('cow')) return 'fa-cow';
    if (b.includes('bug') || b.includes('insect')) return 'fa-bug';
    if (b.includes('hen') || b.includes('chicken') || b.includes('rooster')) return 'fa-egg';

    switch (type) {
      case 'Dog': return 'fa-dog';
      case 'Cat': return 'fa-cat';
      case 'Bird': return 'fa-dove';
      case 'Rabbit': return 'fa-carrot';
      case 'Hamster': return 'fa-cheese';
      case 'Fish': return 'fa-fish-fins';
      default: return 'fa-paw';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Pet Hero Section */}
      <div className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden shadow-xl group">
        <img 
          src={pet.image || `https://picsum.photos/seed/${pet.id}/1200/600`} 
          alt={pet.breed} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
          <div className="flex items-center gap-4 mb-2">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-md text-white border border-white/30`}>
              <i className={`fas ${getPetIcon(pet.type, pet.breed)} text-xl`}></i>
            </div>
            <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
              {pet.type} • {pet.breed}
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
            {pet.name}
          </h2>
          <p className="text-white/80 font-medium mt-2 flex items-center gap-2">
            <i className="fas fa-cake-candles text-indigo-400"></i> {pet.age} years old • {pet.gender}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-center justify-between gap-3 text-sm shadow-sm animate-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
              <i className="fas fa-wifi-slash"></i>
            </div>
            <span className="font-medium">
              {error} {cooldown > 0 && `(${cooldown}s)`}
            </span>
          </div>
          <button 
            disabled={loading || cooldown > 0}
            onClick={() => fetchMissingInfo(true)}
            className="px-4 py-1.5 bg-white border border-amber-300 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 disabled:opacity-30 transition-all"
          >
            {loading ? 'Re-Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}

      {pet.gender === 'Female' && !pet.cycleTracking?.isSpayed && cycleDaysLeft !== null && cycleDaysLeft <= 7 && cycleDaysLeft > -14 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-3 text-sm shadow-sm animate-pulse">
          <div className="w-8 h-8 bg-rose-200 rounded-full flex items-center justify-center">
            <i className="fas fa-venus-double"></i>
          </div>
          <div className="flex-1">
            <p className="font-black">Imminent Heat Cycle Alert</p>
            <p className="text-xs opacity-80">
              {cycleDaysLeft === 0 ? "Potential cycle start today!" : 
               cycleDaysLeft > 0 ? `Next cycle predicted in ~${cycleDaysLeft} days.` :
               `Potential cycle ongoing (Started ~${Math.abs(cycleDaysLeft)} days ago).`}
            </p>
          </div>
          <i className="fas fa-circle-exclamation text-rose-500"></i>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <i className="fas fa-weight-scale text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Weight</p>
              <h3 className="text-2xl font-bold text-slate-800">{lastMetric?.weight || '--'} kg</h3>
              <p className={`text-[10px] font-black ${parseFloat(weightDiff) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {parseFloat(weightDiff) >= 0 ? '+' : ''}{weightDiff} kg progress
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center">
              <i className="fas fa-ruler-vertical text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Height</p>
              <h3 className="text-2xl font-bold text-slate-800">{lastMetric?.height || '--'} cm</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                {lastMetric ? 'Current height' : 'Not logged yet'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${daysLeft !== null && daysLeft < 7 ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
              <i className="fas fa-syringe text-xl"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-500 font-medium">Next Vax</p>
              <div className="flex flex-col">
                {nextVaccine ? (
                  <>
                    <h3 className="text-sm font-bold text-slate-800 truncate">{nextVaccine.name}</h3>
                    <h3 className="text-lg font-black text-slate-800">{nextVaccine.dueDate}</h3>
                    <div className="mt-1 flex items-center gap-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        daysLeft !== null && daysLeft < 0 ? 'bg-rose-100 text-rose-600' : 
                        daysLeft !== null && daysLeft <= 7 ? 'bg-amber-100 text-amber-600' : 
                        'bg-indigo-100 text-indigo-600'
                      }`}>
                        {daysLeft !== null ? (daysLeft < 0 ? 'OVERDUE' : `${daysLeft}d left`) : ''}
                      </span>
                      {daysLeft !== null && daysLeft <= 7 && (
                        <i className="fas fa-circle-exclamation text-amber-500 text-[10px] animate-pulse"></i>
                      )}
                    </div>
                  </>
                ) : (
                  <h3 className="text-xl font-bold text-slate-800">None logged</h3>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <i className={`fas ${getPetIcon(pet.type, pet.breed)} text-xl`}></i>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Breed</p>
              <h3 className="text-lg font-bold text-slate-800 truncate">{pet.breed}</h3>
            </div>
          </div>
        </div>
      </div>

      {pet.gender === 'Female' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom duration-500">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform">
              <i className="fas fa-calendar-heart text-7xl text-rose-600"></i>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                <i className="fas fa-venus"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Cycle Tracker</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Estrus Cycle Management</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Status</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${pet.cycleTracking?.isSpayed ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
                  {pet.cycleTracking?.isSpayed ? 'Spayed' : 'Intact'}
                </span>
              </div>

              {!pet.cycleTracking?.isSpayed && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Last Cycle</p>
                      <p className="text-lg font-black text-slate-800">{pet.cycleTracking?.lastCycleStart || 'Not set'}</p>
                    </div>
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Predicted Next</p>
                      <p className="text-lg font-black text-slate-800">{predictedCycle || '--'}</p>
                    </div>
                    {cycleDaysLeft !== null && cycleDaysLeft > 0 && (
                      <div className="col-span-2 flex items-center gap-2 px-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-rose-500 rounded-full transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (180 - cycleDaysLeft) / 1.8)}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-black text-rose-600 uppercase">~{cycleDaysLeft} days left</span>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleAddCycle} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Log New Cycle</p>
                    <div className="flex gap-2">
                      <input 
                        type="date" 
                        value={newCycleDate}
                        onChange={(e) => setNewCycleDate(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500 transition-all"
                      />
                      <button className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all">
                        Log
                      </button>
                    </div>
                  </form>

                  {(pet.cycleTracking?.history?.length || 0) > 0 && (
                    <div className="pt-2">
                      <button 
                        onClick={() => setShowCycleHistory(!showCycleHistory)}
                        className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
                      >
                        {showCycleHistory ? 'Hide History' : 'View Cycle History'}
                        <i className={`fas fa-chevron-${showCycleHistory ? 'up' : 'right'}`}></i>
                      </button>
                      
                      {showCycleHistory && (
                        <div className="mt-4 space-y-2 animate-in slide-in-from-top duration-300">
                          {pet.cycleTracking?.history.map((entry, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-xs font-bold text-slate-700">
                                {new Date(entry.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium italic">Cycle Started</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:translate-x-2 transition-transform">
              <i className="fas fa-heart text-7xl text-rose-400"></i>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white/10 text-rose-400 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <i className="fas fa-hand-holding-heart text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Mating & Matching</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Connect with other {pet.type}s</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Matchmaking Status</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${pet.matingPreferences?.lookingForPartner ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-900/50' : 'bg-white/10 text-slate-400'}`}>
                  {pet.matingPreferences?.lookingForPartner ? 'Visible' : 'Private'}
                </span>
              </div>

              {pet.matingPreferences?.lookingForPartner ? (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">My Preferences</p>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{pet.matingPreferences.preferences || 'Open to all suitable matches.'}"
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 bg-white/5 rounded-2xl border border-dashed border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Private Profile</p>
                  <p className="text-xs text-slate-400">Matchmaking is currently disabled.</p>
                </div>
              )}
              
              <button 
                onClick={() => alert('Search feature coming soon! Looking for a match for ' + pet.name + '...')}
                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all transform active:scale-95"
              >
                <i className="fas fa-search-heart mr-2"></i> Find Match
              </button>

              {/* Mating Events Recorder */}
              <div className="pt-6 border-t border-white/10">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4">Record Mating Event</p>
                <form onSubmit={handleAddMatingEvent} className="space-y-3">
                  <input 
                    type="text"
                    placeholder="Partner Pet Name"
                    value={matingPartner}
                    onChange={(e) => setMatingPartner(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-rose-400 transition-all"
                  />
                  <input 
                    type="date"
                    value={matingDate}
                    onChange={(e) => setMatingDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-rose-400 transition-all"
                  />
                  <textarea 
                    placeholder="Notes (optional)"
                    value={matingNotesInput}
                    onChange={(e) => setMatingNotesInput(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-rose-400 transition-all"
                    rows={2}
                  />
                  <button className="w-full py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all">
                    Save Event
                  </button>
                </form>
              </div>

              {(pet.matingEvents?.length || 0) > 0 && (
                <div className="mt-4">
                  <button 
                    onClick={() => setShowMatingHistory(!showMatingHistory)}
                    className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
                  >
                    {showMatingHistory ? 'Hide Mating History' : 'View Mating History'}
                    <i className={`fas fa-chevron-${showMatingHistory ? 'up' : 'right'}`}></i>
                  </button>
                  {showMatingHistory && (
                    <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {pet.matingEvents.map((event) => (
                        <div key={event.id} className="p-3 bg-white/5 rounded-xl border border-white/10">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black text-rose-300">w/ {event.partnerName}</span>
                            <span className="text-[10px] text-slate-500">{new Date(event.date).toLocaleDateString('en-GB')}</span>
                          </div>
                          {event.notes && <p className="text-[10px] text-slate-400 italic">"{event.notes}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Daily Diet Plan */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Care Schedule</h3>
            <p className="text-slate-500 text-sm">Personalized routine for {pet.name}</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2">
              <i className="fas fa-droplet text-blue-500"></i>
              <span className="text-xs font-bold text-blue-700">{structuredDiet?.waterIntake || '800ml/day'}</span>
            </div>
          </div>
        </div>

        {structuredDiet ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {structuredDiet.meals.map((meal, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 p-6 rounded-3xl transition-all hover:border-indigo-200">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md">
                    {meal.time}
                  </span>
                  <div className="text-slate-400">
                    <i className="fas fa-clock"></i>
                  </div>
                </div>
                <h4 className="font-bold text-slate-800 mb-1">{meal.label}</h4>
                <p className="text-sm font-black text-indigo-500 mb-2">{meal.quantity}</p>
                <p className="text-xs text-slate-500 leading-relaxed italic">{meal.notes}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
            <p className="text-sm text-slate-400">Sync pending AI capacity.</p>
          </div>
        )}
      </div>

      {/* Exercise Tracking Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Daily Exercise</h3>
              <p className="text-slate-500 text-sm">Keep {pet.name} active and healthy</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Goal</p>
                <p className="text-lg font-black text-indigo-600">{currentGoal} min</p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <i className="fas fa-person-running text-xl"></i>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-slate-100"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 80}
                  strokeDashoffset={2 * Math.PI * 80 * (1 - progress / 100)}
                  strokeLinecap="round"
                  className="text-indigo-600 transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-800">{currentExercise}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Minutes</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <h4 className="text-sm font-black text-slate-700 mb-4 uppercase tracking-wider">Log Activity</h4>
                <form onSubmit={handleAddExercise} className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <i className="fas fa-stopwatch"></i>
                    </span>
                    <input
                      type="number"
                      placeholder="Minutes"
                      value={exerciseMinutes}
                      onChange={(e) => setExerciseMinutes(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95">
                    Add
                  </button>
                </form>
              </div>

              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${progress >= 100 ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-400'}`}></div>
                  <span className="text-xs font-bold text-slate-500">
                    {progress >= 100 ? 'Goal Achieved! 🎉' : `${currentGoal - currentExercise} mins to reach goal`}
                  </span>
                </div>
                <span className="text-xs font-black text-indigo-600">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-6">Set New Goal</h3>
          <form onSubmit={handleSetGoal} className="space-y-4 flex-1 flex flex-col">
            <div className="flex-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Daily Target (Minutes)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <i className="fas fa-bullseye"></i>
                </span>
                <input
                  type="number"
                  value={exerciseGoal}
                  onChange={(e) => setExerciseGoal(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-black text-lg"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-3 italic leading-relaxed">
                Most {pet.type}s benefit from at least 30-60 minutes of active play daily.
              </p>
            </div>
            <button className="w-full py-4 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
              Update Goal
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Growth Tracking</h3>
            <form onSubmit={handleAddMetric} className="flex gap-2">
              <input 
                type="number" step="0.1" placeholder="Weight (kg)" value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-20 outline-none"
              />
              <input 
                type="number" step="0.1" placeholder="Height (cm)" value={newHeight}
                onChange={(e) => setNewHeight(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-20 outline-none"
              />
              <button className="bg-indigo-600 text-white p-1.5 rounded-lg text-xs px-3">
                <i className="fas fa-plus mr-1"></i> Log
              </button>
            </form>
          </div>
          <HealthChart data={pet.metrics} />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <i className="fas fa-lightbulb text-amber-500"></i> Breed Advice
          </h3>
          <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
            {advice || "Standard care applies. Provide fresh water and daily play."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
