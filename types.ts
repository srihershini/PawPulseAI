
export enum PetType {
  DOG = 'Dog',
  CAT = 'Cat',
  BIRD = 'Bird',
  RABBIT = 'Rabbit',
  HAMSTER = 'Hamster',
  FISH = 'Fish',
  OTHER = 'Other'
}

export interface HealthMetric {
  date: string;
  weight: number;
  height: number;
  mood: string;
  activityLevel: number; // 1-10
}

export interface Vaccination {
  id: string;
  name: string;
  dueDate: string;
  completedDate?: string;
  isRequired: boolean;
}

export interface DietMeal {
  time: string;
  label: string;
  quantity: string;
  notes: string;
}

export interface DailyDietPlan {
  meals: DietMeal[];
  waterIntake: string;
  totalCalories?: string;
}

export interface CycleEntry {
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface MatingEvent {
  id: string;
  date: string;
  partnerName: string;
  notes?: string;
  result?: string; // e.g. "Successful", "Failed", "In Progress"
}

export interface MedicalRecord {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'Checkup' | 'Surgery' | 'Injury' | 'Medication' | 'Other';
  attachments?: string[]; // Image IDs or paths
}

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  breed: string;
  birthDate: string;
  age: number;
  gender: 'Male' | 'Female';
  ownerEmail?: string;
  ownerMobile?: string;
  image?: string;
  metrics: HealthMetric[];
  vaccinations: Vaccination[];
  medicalRecords: MedicalRecord[];
  matingEvents: MatingEvent[];
  dietPlan?: DailyDietPlan;
  lastDietUpdate?: string;
  breedAdvice?: string;
  dietaryRecommendation?: string;
  trainingTips?: string[];
  trainingTechniques?: {
    title: string;
    description: string;
    steps: string[];
    imageUrl?: string;
  }[];
  exerciseRecommendations?: string[];
  standardHeight?: number; // Ideal height for the breed
  exerciseGoal?: number; // Daily goal in minutes
  dailyExercise?: Record<string, number>; // Date (YYYY-MM-DD) to minutes
  chatHistory?: ChatMessage[];
  lastMoodResult?: { mood: string, description: string } | null;
  lastBarkResult?: string | null;
  cycleTracking?: {
    lastCycleStart?: string;
    expectedNextCycle?: string;
    history: CycleEntry[];
    isSpayed?: boolean;
  };
  matingPreferences?: {
    lookingForPartner: boolean;
    preferences?: string;
    contactInfo?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
