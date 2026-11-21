
import React, { useState } from 'react';
import { Pet, PetType } from '../types';
import { isValidPhoneNumber } from 'libphonenumber-js';
import validator from 'validator';

interface LoginProps {
  onLogin: (petData: Partial<Pet> & { ownerEmail: string, ownerMobile: string }) => void;
  loginError?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, loginError }) => {
  const [petName, setPetName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [errors, setErrors] = useState<{ email?: string; mobile?: string }>({});

  const validateEmail = (email: string) => {
    return validator.isEmail(email);
  };

  const validateMobile = (mobile: string) => {
    return isValidPhoneNumber(mobile);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { email?: string; mobile?: string } = {};
    
    if (!validateEmail(email)) {
      newErrors.email = 'Please enter a universally valid email address';
    }

    if (!validateMobile(mobile)) {
      newErrors.mobile = 'Please enter a valid international mobile number (e.g. +1 555-0100)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    if (!petName || !email || !mobile) return;

    onLogin({
      name: petName,
      ownerEmail: email,
      ownerMobile: mobile,
      type: PetType.DOG, // Defaulting to Dog for initial setup
      breed: 'Golden Retriever',
      birthDate: new Date().toISOString().split('T')[0],
      gender,
      metrics: [],
      vaccinations: []
    });
  };

  // Curated colorful pet images
  const petImages = [
    { src: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80', label: 'Dog' },
    { src: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80', label: 'Cat' },
    { src: 'https://images.unsplash.com/photo-1522913423274-974e548ef86e?auto=format&fit=crop&w=400&q=80', label: 'Bird' },
    { src: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=400&q=80', label: 'Hamster' },
    { src: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&w=400&q=80', label: 'Fish' },
    { src: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80', label: 'Dog' },
    { src: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=400&q=80', label: 'Cat' },
    { src: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&w=400&q=80', label: 'Bird' },
    { src: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=400&q=80', label: 'Dog' },
    { src: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=400&q=80', label: 'Fish' },
    { src: 'https://images.unsplash.com/photo-1513284411132-8419614457e5?auto=format&fit=crop&w=400&q=80', label: 'Hamster' },
    { src: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=400&q=80', label: 'Dog' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-900 relative overflow-hidden">
      {/* Dynamic Colorful Background Grid */}
      <div className="absolute inset-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 opacity-40">
        {petImages.map((pet, i) => (
          <div key={i} className="relative overflow-hidden group">
            <img 
              src={pet.src} 
              alt={pet.label} 
              className="w-full h-full object-cover grayscale-0 group-hover:scale-110 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 to-transparent"></div>
          </div>
        ))}
      </div>

      {/* Decorative Overlay */}
      <div className="absolute inset-0 bg-indigo-900/20 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-md px-6 py-12">
        <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/20 p-8 md:p-10 transform transition-all duration-500 hover:scale-[1.01]">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-rose-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/40 animate-bounce-slow">
              <i className="fas fa-paw text-5xl"></i>
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-1">
              PawPulse <span className="text-indigo-600 italic">AI</span>
            </h1>
            <p className="text-slate-500 font-medium">Your pet's health, our priority</p>
            {loginError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold animate-pulse">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {loginError}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Pet's Name</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <i className="fas fa-tag"></i>
                </span>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Luna"
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-0 focus:border-indigo-500 focus:bg-white outline-none transition-all text-slate-800 font-medium"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Pet's Gender</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setGender('Male')}
                  className={`py-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                    gender === 'Male' 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-sm' 
                      : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <i className="fas fa-mars"></i> Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('Female')}
                  className={`py-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                    gender === 'Female' 
                      ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-sm' 
                      : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <i className="fas fa-venus"></i> Female
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Mobile Number</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <i className="fas fa-phone"></i>
                </span>
                <input 
                  required
                  type="tel" 
                  placeholder="+1 555-0100"
                  className={`w-full pl-11 pr-4 py-4 bg-slate-50 border-2 rounded-2xl focus:ring-0 outline-none transition-all text-slate-800 font-medium ${
                    errors.mobile ? 'border-rose-400 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500 focus:bg-white'
                  }`}
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    if (errors.mobile) setErrors({ ...errors, mobile: undefined });
                  }}
                />
              </div>
              {errors.mobile && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1 uppercase tracking-wider">{errors.mobile}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Owner's Email ID</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <i className="fas fa-envelope"></i>
                </span>
                <input 
                  required
                  type="email" 
                  placeholder="Email for health reports"
                  className={`w-full pl-11 pr-4 py-4 bg-slate-50 border-2 rounded-2xl focus:ring-0 outline-none transition-all text-slate-800 font-medium ${
                    errors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500 focus:bg-white'
                  }`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                />
              </div>
              {errors.email && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1 uppercase tracking-wider">{errors.email}</p>}
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-2xl font-black text-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-xl shadow-indigo-200 active:scale-[0.98] flex items-center justify-center gap-3 group mt-6"
            >
              Start Caring
              <i className="fas fa-heart group-hover:scale-125 transition-transform text-rose-300"></i>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center gap-6 text-slate-400">
            <i className="fas fa-dog hover:text-indigo-500 cursor-pointer transition-colors"></i>
            <i className="fas fa-cat hover:text-rose-400 cursor-pointer transition-colors"></i>
            <i className="fas fa-crow hover:text-blue-400 cursor-pointer transition-colors"></i>
            <i className="fas fa-fish hover:text-cyan-400 cursor-pointer transition-colors"></i>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) rotate(12deg); }
          50% { transform: translateY(-10px) rotate(8deg); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;
