
import React, { useState, useRef } from 'react';
import { detectPetMood, analyzeBarking } from '../services/geminiService';
import { Pet } from '../types';

interface PetAIToolsProps {
  pet: Pet;
  onUpdatePet: (updatedPet: Pet) => void;
}

const PetAITools: React.FC<PetAIToolsProps> = ({ pet, onUpdatePet }) => {
  const [moodResult, setMoodResult] = useState<{ mood: string, description: string } | null>(pet.lastMoodResult || null);
  const [barkResult, setBarkResult] = useState<string | null>(pet.lastBarkResult || null);
  const [isMoodLoading, setIsMoodLoading] = useState(false);
  const [isBarkLoading, setIsBarkLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsMoodLoading(true);
    setMoodResult(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result as string;
      try {
        const result = await detectPetMood(base64Image);
        setMoodResult(result);
        onUpdatePet({
          ...pet,
          lastMoodResult: result
        });
      } catch (err: any) {
        setMoodResult({ mood: "Error", description: err.message === "AI_KEY_MISSING" ? "AI API Key is missing. Please configure it in settings." : "AI analysis failed. Please try again." });
      } finally {
        setIsMoodLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Audio = reader.result as string;
          setIsBarkLoading(true);
          try {
            const result = await analyzeBarking(base64Audio, 'audio/webm');
            setBarkResult(result);
            onUpdatePet({
              ...pet,
              lastBarkResult: result
            });
          } catch (err: any) {
            setBarkResult(err.message === "AI_KEY_MISSING" ? "AI API Key is missing. Please configure it in settings." : "Sound analysis failed. Please try again.");
          } finally {
            setIsBarkLoading(false);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setBarkResult(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Please allow microphone access to analyze barking.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Mood Detector */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <i className="fas fa-face-smile text-3xl"></i>
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Mood Detector</h3>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Upload a photo of {pet.name} to understand their current emotional state using AI vision.
          </p>
          
          <input 
            type="file" 
            ref={photoInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handlePhotoUpload} 
          />
          
          <button 
            onClick={() => photoInputRef.current?.click()}
            disabled={isMoodLoading}
            className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-lg hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isMoodLoading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <><i className="fas fa-camera"></i> Upload Photo</>
            )}
          </button>

          {moodResult && (
            <div className="mt-6 p-6 bg-rose-50 rounded-2xl border border-rose-100 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  {moodResult.mood}
                </span>
              </div>
              <p className="text-rose-800 font-bold leading-relaxed">{moodResult.description}</p>
            </div>
          )}
        </div>

        {/* Barking Analyzer */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <i className="fas fa-microphone-lines text-3xl"></i>
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Barking Analyzer</h3>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Record {pet.name}'s bark or meow to decipher the meaning behind their vocalizations.
          </p>

          <button 
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isBarkLoading}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 ${
              isRecording 
                ? 'bg-rose-500 text-white animate-pulse' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {isBarkLoading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isRecording ? (
              <><i className="fas fa-stop"></i> Stop Recording</>
            ) : (
              <><i className="fas fa-microphone"></i> Start Recording</>
            )}
          </button>

          {barkResult && (
            <div className="mt-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in zoom-in-95 duration-300">
              <p className="text-indigo-800 font-bold leading-relaxed">{barkResult}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetAITools;
