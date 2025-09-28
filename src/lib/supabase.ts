import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          location_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          location_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          location_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          postcode: string
          suburb: string
          state: string
          latitude: number
          longitude: number
          solar_zone: number
          grid_region: string
          dmo_pricing: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          postcode: string
          suburb: string
          state: string
          latitude: number
          longitude: number
          solar_zone: number
          grid_region: string
          dmo_pricing?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          postcode?: string
          suburb?: string
          state?: string
          latitude?: number
          longitude?: number
          solar_zone?: number
          grid_region?: string
          dmo_pricing?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add other tables as needed
    }
  }
}