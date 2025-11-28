import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database'; // Realtime Database
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getStorage } from 'firebase/storage'; // Firebase Storage

// Firebase configuration
const firebaseConfig = {
   apiKey: "AIzaSyDVmKCBT6EwFQ4boBP-5L56-vUUcO65gHk",
  authDomain: "cabletechnow.firebaseapp.com",
  databaseURL: "https://cabletechnow-default-rtdb.firebaseio.com",
  projectId: "cabletechnow",
  storageBucket: "cabletechnow.firebasestorage.app",
  messagingSenderId: "799752499491",
  appId: "1:799752499491:web:fb6f9a0bc3221ff749dc96",
  measurementId: "G-BHQ1QPCCR6"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize a secondary app for creating users without affecting current session
// This prevents logging out the current user when creating new accounts
const secondaryApp = initializeApp(firebaseConfig, 'Secondary');

// Initialize services
const db = getFirestore(app);
const realtimeDb = getDatabase(app);
const auth = getAuth(app);
const secondaryAuth = getAuth(secondaryApp); // Auth instance for creating users without affecting session
const storage = getStorage(app); // Initialize Storage

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Conditionally initialize Analytics
let analytics;
isSupported().then(supported => {
    if (supported) {
        analytics = getAnalytics(app);
    }
});

// Export Firebase services
export { app, analytics, db, auth, realtimeDb, storage, googleProvider, secondaryAuth };

// Type definitions
export type UserType = 'customer' | 'technician';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  user_type: UserType;
  avatar_url: string | null;
  address: string | null;
  state: string | null;
  zipCode: string | null;
  created_at: string;
}

export interface TechnicianProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
  specializations: string[];
  years_experience: number;
  certifications: string[];
  hourly_rate: number;
  availability: 'available' | 'busy' | 'offline';
  profile_image_url: string;
  portfolio_images: string[];
  rating: number;
  completed_jobs: number;
  response_time: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequestProposal {
  technician_id?: string;
  technician_email: string;
  technician_name: string;
  proposed_amount: number;
  estimated_time: number;
  notes: string;
  proposed_date?: string;
  start_time?: string;
  end_time?: string;
  submitted_at: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ServiceRequest {
  id: string;
  customer_id: string;
  title: string;
  description: string;
  service_type: 'Cable & Coax' | 'Audio/Video' | 'Network & Internet' | 'Computer Support' | 'Smart Home' | 'Business Services';
  urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
  preferred_date: string | null;
  address: string;
  zipCode?: string;
  state?: string;
  service_mode: 'video_call' | 'onsite';
  budget_range?: '$25-$50' | '$50-$100' | '$100-$200' | '$200-$500' | '$500+';
  images?: string[];
  status: 'pending' | 'proposals_received' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'assigned';
  proposals?: ServiceRequestProposal[];
  // New fields for technician targeting
  target_technician_type?: 'all' | 'specific' | 'admin';
  target_technician_id?: string | null;
  target_technician_name?: string | null;
  target_technician_email?: string | null;
  // Admin assignment fields
  assignedBy?: string;
  assignedAt?: Date | { seconds: number; nanoseconds: number };
  reassignedBy?: string;
  reassignedAt?: Date | { seconds: number; nanoseconds: number };
  // Job acceptance fields
  acceptedBy?: string;
  acceptedAt?: Date | { seconds: number; nanoseconds: number };
  rejectedBy?: string;
  rejectedAt?: Date | { seconds: number; nanoseconds: number };
  // Equipment questionnaire fields
  is_new_equipment?: string;
  is_installed?: string;
  is_installed_by?: string;
  is_lights_on?: string;
  is_working_before?: string;
  is_last_working_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  service_request_id: string;
  technician_id: string;
  proposed_price: number;
  estimated_duration: number;
  message: string | null;
  proposed_date?: string;
  start_time?: string;
  end_time?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  participants: string[]; // Array of user IDs
  customer_id: string;
  technician_id: string;
  last_message: string;
  last_message_timestamp: string;
  unread_count: { [userId: string]: number };
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'service_request';
  timestamp: string;
  read_by: string[];
  metadata?: {
    service_request_id?: string;
    image_url?: string;
  };
}

export interface DirectServiceRequest {
  id: string;
  customer_id: string;
  technician_id: string;
  title: string;
  description: string;
  preferred_date: string | null;
  urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
  budget_range?: '$25-$50' | '$50-$100' | '$100-$200' | '$200-$500' | '$500+';
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  created_at: string;
  updated_at: string;
}