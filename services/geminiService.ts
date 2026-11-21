
import { GoogleGenAI, Type } from "@google/genai";
import { Pet, DailyDietPlan, Vaccination } from "../types";

// Note: process.env.API_KEY is injected by the environment automatically.
// We initialize it here, but also allow for dynamic re-instantiation if needed.
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  if (!apiKey || apiKey === "undefined") {
    throw new Error("AI_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

let globalCooldownUntil = 0;

export const isApiCoolingDown = () => Date.now() < globalCooldownUntil;
export const getRemainingCooldown = () => Math.max(0, Math.ceil((globalCooldownUntil - Date.now()) / 1000));

const PRE_BAKED_PROFILES: Record<string, any> = {
  "Golden Retriever": {
    idealWeight: 30, idealHeight: 58,
    breedAdvice: "Golden Retrievers are social, active, and require 1-2 hours of exercise daily. They are prone to hip dysplasia. Their gentle nature makes them perfect family pets.",
    dietaryRecommendation: "High-protein diet. Avoid excessive treats to prevent obesity. Glucosamine supplements are recommended for joint health.",
    dietPlan: {
      meals: [
        { time: "08:00 AM", label: "Breakfast", quantity: "1.5 cups kibble", notes: "Rich in Omega-3" },
        { time: "07:00 PM", label: "Dinner", quantity: "1.5 cups kibble", notes: "Monitor eating speed" }
      ],
      waterIntake: "2 Liters/day", totalCalories: "1400 kcal"
    },
    trainingTips: ["Start socialization early.", "Use positive reinforcement.", "Teach 'stay' and 'come' commands."],
    trainingTechniques: [
      {
        title: "The 'Sit' Command",
        description: "Teaching your Golden to sit is the foundation of all training.",
        steps: [
          "Hold a treat close to your pet's nose.",
          "Move your hand up, allowing their head to follow the treat and causing their bottom to lower.",
          "Once they are in a sitting position, say 'Sit', give them the treat, and share affection."
        ]
      },
      {
        title: "Loose Leash Walking",
        description: "Goldens can be pullers; this technique helps them walk calmly by your side.",
        steps: [
          "Start walking with your pet on a leash.",
          "If they pull, stop immediately and wait for them to look back at you.",
          "Reward them with a treat when they return to your side and continue walking."
        ]
      }
    ],
    exerciseRecommendations: ["30-60 minutes of walking daily.", "Fetch games in the yard.", "Swimming if possible."]
  },
  "Labrador": {
    idealWeight: 32, idealHeight: 56,
    breedAdvice: "High energy dogs. They love to swim and fetch. Prone to obesity, so strict portion control and daily exercise are non-negotiable.",
    dietaryRecommendation: "Joint-support formula kibble. Low-calorie treats are preferred.",
    dietPlan: {
      meals: [
        { time: "07:00 AM", label: "Breakfast", quantity: "2 cups kibble", notes: "Slow feeder bowl recommended" },
        { time: "07:00 PM", label: "Dinner", quantity: "2 cups kibble", notes: "No table scraps" }
      ],
      waterIntake: "2.5 Liters/day", totalCalories: "1500 kcal"
    },
    trainingTips: ["Focus on leash training.", "Provide plenty of mental stimulation.", "Teach them to 'drop it'."],
    trainingTechniques: [
      {
        title: "The 'Drop It' Command",
        description: "Crucial for Labs who love to carry things in their mouths.",
        steps: [
          "Give your dog a toy they like.",
          "Offer a high-value treat in exchange for the toy.",
          "As they release the toy, say 'Drop it' and give them the treat."
        ]
      }
    ],
    exerciseRecommendations: ["At least 1 hour of active play.", "Daily long walks.", "Agility training."]
  },
  "German Shepherd": {
    idealWeight: 35, idealHeight: 62,
    breedAdvice: "German Shepherds are highly intelligent and loyal. They need a job to do and plenty of mental and physical stimulation. Prone to hip and elbow dysplasia.",
    dietaryRecommendation: "High-quality protein for muscle maintenance. Joint supplements are a must.",
    dietPlan: {
      meals: [
        { time: "07:30 AM", label: "Breakfast", quantity: "2 cups high-protein kibble", notes: "Focus on digestion" },
        { time: "06:30 PM", label: "Dinner", quantity: "2 cups high-protein kibble", notes: "Avoid exercise right after eating" }
      ],
      waterIntake: "2.5 Liters/day", totalCalories: "1600 kcal"
    },
    trainingTips: ["Start obedience training early.", "Consistent leadership is key.", "Provide puzzle toys."],
    trainingTechniques: [
      {
        title: "The 'Heel' Command",
        description: "Essential for controlling a strong dog like a GSD.",
        steps: ["Walk with the dog on your left.", "Use a treat to keep them at your side.", "Reward when they stay in position."]
      }
    ],
    exerciseRecommendations: ["2 hours of exercise daily.", "Hiking.", "Obedience drills."]
  },
  "Beagle": {
    idealWeight: 11, idealHeight: 35,
    breedAdvice: "Beagles are scent hounds with a strong urge to follow their noses. They are friendly but can be stubborn. They need secure fencing.",
    dietaryRecommendation: "Balanced diet. Beagles love food, so watch their weight carefully.",
    dietPlan: {
      meals: [
        { time: "08:00 AM", label: "Breakfast", quantity: "0.75 cup kibble", notes: "Low calorie" },
        { time: "06:00 PM", label: "Dinner", quantity: "0.75 cup kibble", notes: "No extra treats" }
      ],
      waterIntake: "1 Liter/day", totalCalories: "700 kcal"
    },
    trainingTips: ["Use scent-based games.", "Patience is required.", "Recall training is critical."],
    trainingTechniques: [
      {
        title: "Recall Training",
        description: "Hard for Beagles due to their scent drive.",
        steps: ["Use a long lead.", "Call them with a high-pitched voice.", "Reward with high-value treats."]
      }
    ],
    exerciseRecommendations: ["Long scent walks.", "Playtime in a fenced yard.", "Daily 30-minute walks."]
  },
  "Bulldog": {
    idealWeight: 23, idealHeight: 35,
    breedAdvice: "Bulldogs are calm, courageous, and friendly. They are prone to overheating and respiratory issues due to their flat faces. Avoid strenuous exercise.",
    dietaryRecommendation: "Moderate-calorie diet. Watch for skin allergies.",
    dietPlan: {
      meals: [
        { time: "08:30 AM", label: "Breakfast", quantity: "1 cup kibble", notes: "Small bites" },
        { time: "06:30 PM", label: "Dinner", quantity: "1 cup kibble", notes: "Easy to digest" }
      ],
      waterIntake: "1.5 Liters/day", totalCalories: "900 kcal"
    },
    trainingTips: ["Keep sessions short.", "Use food rewards.", "Be patient but firm."],
    trainingTechniques: [
      {
        title: "Leash Manners",
        description: "Bulldogs can be stubborn on a leash.",
        steps: ["Use a harness.", "Stop if they pull.", "Reward for walking beside you."]
      }
    ],
    exerciseRecommendations: ["Short 15-minute walks.", "Indoor play.", "Avoid heat."]
  },
  "Poodle": {
    idealWeight: 20, idealHeight: 50,
    breedAdvice: "Poodles are highly intelligent and active. They require regular professional grooming. They excel in obedience and agility.",
    dietaryRecommendation: "High-quality kibble for active dogs. Monitor for bloat.",
    dietPlan: {
      meals: [
        { time: "07:00 AM", label: "Breakfast", quantity: "1.25 cups kibble", notes: "High energy" },
        { time: "07:00 PM", label: "Dinner", quantity: "1.25 cups kibble", notes: "Balanced nutrition" }
      ],
      waterIntake: "1.8 Liters/day", totalCalories: "1200 kcal"
    },
    trainingTips: ["Provide mental challenges.", "Advanced obedience.", "Agility training."],
    trainingTechniques: [
      {
        title: "Advanced Tricks",
        description: "Poodles love to learn complex tasks.",
        steps: ["Break down into small steps.", "Use clicker training.", "Reward immediately."]
      }
    ],
    exerciseRecommendations: ["Daily long walks.", "Mental puzzles.", "Swimming."]
  },
  "Persian Cat": {
    idealWeight: 5, idealHeight: 25,
    breedAdvice: "Quiet and sweet-tempered. They prefer a calm environment. Their long coats require daily grooming to prevent matting.",
    dietaryRecommendation: "Hairball control formula. Wet food helps with hydration.",
    dietPlan: {
      meals: [
        { time: "07:00 AM", label: "Breakfast", quantity: "1/4 cup dry food", notes: "Hairball control" },
        { time: "06:00 PM", label: "Dinner", quantity: "3 oz wet food", notes: "High moisture" }
      ],
      waterIntake: "0.4 Liters/day", totalCalories: "250 kcal"
    },
    trainingTips: ["Focus on grooming tolerance.", "Use gentle handling.", "Quiet play sessions."],
    trainingTechniques: [
      {
        title: "Grooming Acceptance",
        description: "Essential for long-haired cats.",
        steps: ["Start with short sessions.", "Brush gently.", "Reward with a small treat."]
      }
    ],
    exerciseRecommendations: ["Short bursts of play with feather wands.", "Climbing towers.", "Interactive toys."]
  },
  "Siamese Cat": {
    idealWeight: 4, idealHeight: 28,
    breedAdvice: "Siamese cats are vocal, social, and highly intelligent. They crave attention and can be demanding. They are prone to dental issues.",
    dietaryRecommendation: "High-protein diet. Dental treats are recommended.",
    dietPlan: {
      meals: [
        { time: "07:30 AM", label: "Breakfast", quantity: "1/4 cup dry", notes: "Dental support" },
        { time: "06:30 PM", label: "Dinner", quantity: "3 oz wet", notes: "Grain-free" }
      ],
      waterIntake: "0.5 Liters/day", totalCalories: "280 kcal"
    },
    trainingTips: ["Teach them to fetch.", "Provide plenty of vertical space.", "Interactive play."],
    trainingTechniques: [
      {
        title: "Fetching",
        description: "Siamese cats often enjoy retrieving toys.",
        steps: ["Toss a small toy.", "Encourage them to bring it back.", "Reward with praise."]
      }
    ],
    exerciseRecommendations: ["Active play with toys.", "Climbing trees.", "Puzzle feeders."]
  },
  "Maine Coon": {
    idealWeight: 8, idealHeight: 35,
    breedAdvice: "The 'gentle giants' of the cat world. They are friendly, playful, and sturdy. Prone to hypertrophic cardiomyopathy (HCM).",
    dietaryRecommendation: "Large-breed cat food. Monitor for joint health.",
    dietPlan: {
      meals: [
        { time: "08:00 AM", label: "Breakfast", quantity: "1/3 cup dry", notes: "Large kibble" },
        { time: "07:00 PM", label: "Dinner", quantity: "5 oz wet", notes: "High protein" }
      ],
      waterIntake: "0.6 Liters/day", totalCalories: "350 kcal"
    },
    trainingTips: ["Leash training (they often enjoy it).", "Socialize early.", "Provide large scratching posts."],
    trainingTechniques: [
      {
        title: "Leash Walking",
        description: "Maine Coons are often called 'dog-like' and can be walked.",
        steps: ["Use a harness.", "Start indoors.", "Reward for walking forward."]
      }
    ],
    exerciseRecommendations: ["Outdoor walks (supervised).", "Large climbing structures.", "Interactive play."]
  },
  "Generic Dog": {
    idealWeight: 20, idealHeight: 45,
    breedAdvice: "A balanced mix of activity and rest. Regular vet checkups and a consistent routine are important for overall health.",
    dietaryRecommendation: "Standard adult dog food. Ensure it meets AAFCO standards.",
    dietPlan: {
      meals: [
        { time: "08:00 AM", label: "Breakfast", quantity: "1 cup kibble", notes: "Standard portion" },
        { time: "07:00 PM", label: "Dinner", quantity: "1 cup kibble", notes: "Standard portion" }
      ],
      waterIntake: "1.5 Liters/day", totalCalories: "1000 kcal"
    },
    trainingTips: ["Basic obedience.", "Daily walks.", "Socialization."],
    trainingTechniques: [
      {
        title: "Basic Sit",
        description: "The most fundamental command.",
        steps: ["Lure with treat.", "Say 'Sit'.", "Reward."]
      }
    ],
    exerciseRecommendations: ["30-45 minutes of walking.", "Daily play."]
  },
  "Generic Cat": {
    idealWeight: 4.5, idealHeight: 25,
    breedAdvice: "Cats are independent but social. Provide scratching posts and vertical space. Keep indoors for safety.",
    dietaryRecommendation: "Mix of wet and dry food. High protein, low carb.",
    dietPlan: {
      meals: [
        { time: "07:00 AM", label: "Breakfast", quantity: "1/4 cup dry", notes: "Crunchy for teeth" },
        { time: "07:00 PM", label: "Dinner", quantity: "3 oz wet", notes: "Hydration" }
      ],
      waterIntake: "0.3 Liters/day", totalCalories: "220 kcal"
    },
    trainingTips: ["Litter box training.", "Scratching post use.", "Gentle play."],
    trainingTechniques: [
      {
        title: "Scratching Training",
        description: "Protect your furniture.",
        steps: ["Place post near sleeping area.", "Use catnip to attract.", "Reward use."]
      }
    ],
    exerciseRecommendations: ["15 minutes of active play.", "Laser pointers (carefully).", "Climbing."]
  }
};

async function callWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  if (isApiCoolingDown()) {
    throw new Error(`AI Limit Reached. Please wait ${getRemainingCooldown()}s.`);
  }

  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error.message?.toLowerCase() || "";
    
    if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("limit")) {
      // Increase cooldown to 30 seconds for quota issues
      globalCooldownUntil = Date.now() + 30000;
      throw new Error("AI Service Limit Reached. PawPulse is currently busy, please try again in 30 seconds.");
    }

    if (errorMsg.includes("api key") || errorMsg.includes("invalid") || errorMsg.includes("403")) {
      throw new Error("Invalid AI API Key. Please check your configuration.");
    }

    if (retries > 0) {
      const delay = (3 - retries) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

export const identifyBreedFromImage = async (base64Image: string): Promise<string> => {
  try {
    return await callWithRetry(async () => {
      const ai = getAIClient();
      const dataPart = base64Image.split(',')[1];
      if (!dataPart) return "Mixed Breed";
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: dataPart } },
            { text: "Identify pet breed name ONLY. One word or short phrase." }
          ]
        }],
      });
      return response.text?.trim() || "Mixed Breed";
    });
  } catch (error) {
    console.warn("Breed identification failed, falling back to Mixed Breed:", error);
    return "Mixed Breed";
  }
};

export const generateFullPetProfile = async (pet: { breed: string, type: string, age?: number }) => {
  // Check pre-baked profiles first (case-insensitive)
  const breedKey = Object.keys(PRE_BAKED_PROFILES).find(k => k.toLowerCase() === pet.breed.toLowerCase());
  if (breedKey) {
    const data = PRE_BAKED_PROFILES[breedKey];
    return { 
      ...data, 
      vaccinations: []
    };
  }

  try {
    const result = await callWithRetry(async () => {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          role: 'user',
          parts: [{ text: `Generate a structured pet care profile for a ${pet.breed} ${pet.type} (Age: ${pet.age || 'unknown'}) in JSON. Include health metrics, a diet plan, breed-specific training tips, and tailored exercise recommendations based on their breed and age.` }]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              idealWeight: { type: Type.NUMBER },
              idealHeight: { type: Type.NUMBER },
              breedAdvice: { type: Type.STRING },
              dietaryRecommendation: { type: Type.STRING },
              trainingTips: { type: Type.ARRAY, items: { type: Type.STRING } },
              trainingTechniques: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    steps: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["title", "description", "steps"]
                }
              },
              exerciseRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              dietPlan: {
                type: Type.OBJECT,
                properties: {
                  meals: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        time: { type: Type.STRING },
                        label: { type: Type.STRING },
                        quantity: { type: Type.STRING },
                        notes: { type: Type.STRING }
                      },
                      required: ["time", "label", "quantity", "notes"]
                    }
                  },
                  waterIntake: { type: Type.STRING }
                },
                required: ["meals", "waterIntake"]
              }
            },
            required: ["idealWeight", "idealHeight", "breedAdvice", "dietaryRecommendation", "dietPlan", "trainingTips", "trainingTechniques", "exerciseRecommendations"]
          }
        }
      });
      return JSON.parse(response.text.trim());
    });

    return { 
      ...result, 
      vaccinations: []
    };
  } catch (error) {
    console.warn("Profile generation failed, falling back to generic profile:", error);
    const fallbackKey = pet.type.toLowerCase() === 'cat' ? 'Generic Cat' : 'Generic Dog';
    return {
      ...PRE_BAKED_PROFILES[fallbackKey],
      vaccinations: []
    };
  }
};

export const detectPetMood = async (base64Image: string): Promise<{ mood: string, description: string }> => {
  return await callWithRetry(async () => {
    const ai = getAIClient();
    const dataPart = base64Image.split(',')[1];
    if (!dataPart) return { mood: "Unknown", description: "No image data found." };
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: dataPart } },
          { text: "Analyze the pet's body language and facial expression. Return a JSON object with 'mood' (EXACTLY one word, e.g., 'Happy', 'Anxious', 'Playful') and 'description' (max 2 sentences explaining why)." }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["mood", "description"]
        }
      }
    });
    return JSON.parse(response.text?.trim() || '{"mood": "Unknown", "description": "Could not determine mood."}');
  });
};

export const analyzeBarking = async (audioData: string, mimeType: string): Promise<string> => {
  return await callWithRetry(async () => {
    const ai = getAIClient();
    const dataPart = audioData.split(',')[1] || audioData;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: mimeType, data: dataPart } },
          { text: "Listen to this pet sound (barking/meowing). Analyze the pitch, frequency, and pattern. Why is the pet making this sound? (e.g., hunger, alert, playfulness, anxiety). Provide a helpful explanation." }
        ]
      }],
    });
    return response.text?.trim() || "Could not analyze the sound.";
  });
};

export const chatWithAssistant = async (history: {role: string, content: string}[], message: string, petContext?: Pet) => {
  try {
    return await callWithRetry(async () => {
      const ai = getAIClient();
      
      // Clean and map history to model/user
      const mappedHistory = history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      }));

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `You are PawPulse AI, a professional pet care expert. You are helping with a ${petContext?.breed || 'pet'} named ${petContext?.name || 'the pet'}. 
          IMPORTANT: If the user mentions FEVER, VOMITING, LETHARGY, or signs of PAIN, you MUST strongly advise visiting a veterinarian immediately. Never diagnose; only advise. Be empathetic but professional.`,
        },
        history: mappedHistory
      });

      const result = await chat.sendMessage({ message: message });
      return result.text;
    });
  } catch (error: any) {
    console.error("Chat failed:", error);
    if (error.message?.includes("Limit Reached")) {
      return "I'm currently resting my AI brain to stay within my free usage limits! 🐾 While I'm cooling down, remember that regular exercise and a balanced diet are key to a happy pet. I'll be back in about 30 seconds to answer your specific questions!";
    }
    return "I'm having a little trouble connecting right now. Please try again in a moment!";
  }
};
