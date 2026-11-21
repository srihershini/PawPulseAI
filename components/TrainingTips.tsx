
import React from 'react';
import { Pet } from '../types';

interface TrainingTipsProps {
  pet: Pet;
}

const TrainingTips: React.FC<TrainingTipsProps> = ({ pet }) => {
  const tips = pet.trainingTips || [
    "Consistency is key. Use the same commands every time.",
    "Keep training sessions short and fun (5-10 minutes).",
    "Always end on a positive note with a successful command.",
    "Use high-value treats to reward good behavior.",
    "Be patient. Every pet learns at their own pace."
  ];

  const techniques = pet.trainingTechniques || [
    {
      title: "The 'Sit' Command",
      description: "Foundation of all training. Teaches focus and control.",
      steps: [
        "Hold a treat close to your pet's nose.",
        "Move your hand up, allowing their head to follow the treat and causing their bottom to lower.",
        "Once they are in a sitting position, say 'Sit', give them the treat, and share affection."
      ]
    },
    {
      title: "Positive Reinforcement",
      description: "Reward good behavior to encourage it to happen again.",
      steps: [
        "Identify a behavior you want to encourage.",
        "Immediately reward the behavior with a treat, praise, or play.",
        "Repeat consistently to build a strong association."
      ]
    }
  ];

  const exerciseTips = pet.exerciseRecommendations || [
    "Daily walks are essential for physical health.",
    "Interactive play helps with mental stimulation.",
    "Adjust exercise intensity based on age and energy levels.",
    "Provide safe toys for independent play.",
    "Monitor for signs of fatigue or overheating."
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Training Section */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
            <i className="fas fa-graduation-cap text-3xl"></i>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Training Tips for {pet.breed}</h3>
            <p className="text-slate-500 text-sm">Expert techniques tailored for {pet.name}'s breed.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {tips.map((tip, index) => (
            <div key={index} className="flex gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-amber-200 transition-all group">
              <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-600 font-black group-hover:bg-amber-600 group-hover:text-white transition-all">
                {index + 1}
              </div>
              <p className="text-slate-700 font-medium leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>

        <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-book-open text-amber-500"></i> Step-by-Step Techniques
        </h4>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {techniques.map((tech, index) => (
            <div key={index} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="h-48 relative">
                <img 
                  src={tech.imageUrl || `https://picsum.photos/seed/${tech.title}/800/400`} 
                  alt={tech.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <h5 className="text-xl font-black text-white">{tech.title}</h5>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-slate-600 text-sm mb-6 font-medium italic">"{tech.description}"</p>
                <div className="space-y-4">
                  {tech.steps.map((step, sIdx) => (
                    <div key={sIdx} className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-black">
                        {sIdx + 1}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exercise Section */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
            <i className="fas fa-running text-3xl"></i>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Exercise Guide</h3>
            <p className="text-slate-500 text-sm">Tailored recommendations for a {pet.age}-year-old {pet.breed}.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exerciseTips.map((tip, index) => (
            <div key={index} className="flex gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 transition-all group">
              <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 font-black group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <i className="fas fa-check"></i>
              </div>
              <p className="text-slate-700 font-medium leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-amber-100">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-4xl">
            <i className="fas fa-lightbulb"></i>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-2xl font-black mb-2">Pro Training Secret</h4>
            <p className="text-amber-50 opacity-90 font-medium leading-relaxed">
              Did you know that {pet.breed}s respond best to visual cues combined with verbal commands? 
              Try using a hand signal every time you say "Sit" or "Stay" for 2x faster learning!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingTips;
