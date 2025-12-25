
export type StoryCategory = 'DREAM' | 'ADVENTURE' | 'MILESTONE' | 'MEMORY' | 'IMAGINATION';

export type StoryStatus = 'cart' | 'generating' | 'completed' | 'draft' | 'failed';

export interface StoryPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
  imageUrl?: string; // Supabase Storage URL
  coloredImageUrl?: string; // Supabase Storage URL
}

export interface Story {
  id: string;
  userId: string;
  createdAt: string;
  title: string;
  pages: StoryPage[];
  category: StoryCategory;
  status: StoryStatus;
  isPurchased: boolean;
  hasBeenRegenerated: boolean; // 1 free creative redo
  pageCount: number;
  coverImage?: string;
  originalPrompt?: string;
  childName: string;
  childAge: number;
  characterDescription?: string;
  childGender: string;
  progress?: number;
  characterReferenceUrl?: string; // Master 12-panel grid reference
  subtitle?: string;
  authorName?: string;
  isbn?: string;
  description?: string;
  keywords?: string;
  copyrightYear?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  samplesUsed: number;
  storeCreditBalance: number; // Monetary reward (USD) from referrals
  isAdmin: boolean;
  lastSampleAt?: string;
}

export interface UserInput {
  category: StoryCategory;
  childName: string;
  childAge: number;
  childGender: string;
  characterDescription: string;
  prompt: string;
  pageCount: number;
  location?: string;
  participants?: string;
  milestoneType?: string;
  mood?: string;
  subtitle?: string;
  authorName?: string;
  isbn?: string;
  description?: string;
  keywords?: string;
  copyrightYear?: string;
}

export enum AppState {
  INPUT = 'INPUT',
  GENERATING_STORY = 'GENERATING_STORY',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  PREVIEW = 'PREVIEW',
  LIBRARY = 'LIBRARY',
  MAGIC_STUDIO = 'MAGIC_STUDIO',
  PRICING = 'PRICING',
  CART = 'CART',
  ERROR = 'ERROR'
}

export interface GenerationProgress {
  currentStep: string;
  progress: number;
  totalImages?: number;
  completedImages?: number;
}

export interface CartItem {
  id: string;
  bookId: string;
  title: string;
  type: 'DIGITAL' | 'HARDCOVER' | 'BUNDLE';
  price: number;
  coverUrl?: string;
  // Store input details for late generation
  inputDetails?: UserInput;
}
