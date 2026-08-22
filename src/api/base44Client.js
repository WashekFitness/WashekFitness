// src/api/base44Client.js
//
// Base44 has been removed.
// This file is kept only so old imports do not break.
// All backend calls now use Supabase.

import { supabase } from "@/lib/supabase";

export const base44 = {
  auth: {
    me: async () => {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser();

      if (error) throw error;

      return user;
    },

    logout: async () => {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;
    }
  },

  functions: {
    invoke: async (functionName, options = {}) => {
      const { data, error } = await supabase.functions.invoke(
        functionName,
        options
      );

      if (error) throw error;

      return {
        data
      };
    }
  },

  db: supabase
};

export default base44;
