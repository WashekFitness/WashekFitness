import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Zap,
  Target,
  Flame,
  Trophy,
  Sparkles,
  Dumbbell,
  Scale,
  Heart,
  Wind,
  PersonStanding,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';

import { queryClientInstance } from '@/lib/query-client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TrainingTypeSelect } from '@/components/onboarding/TrainingTypeSelect';
import { COUNTRIES, LANGUAGES, getCountryDefaults } from '@/lib/countries';
import { useAppSettings } from '@/lib/AppSettingsContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  CALISTHENICS_GOALS,
  WEIGHT_GOALS,
  buildStructurePrompt,
  buildMicrocyclePrompt,
} from '@/lib/trainingTypes';

const levels = [
  {
    value: 'beginner',
    label: 'Beginner',
    desc: '0–6 months training',
    icon: Flame,
    placeholder:
      'e.g. 10 push-ups, bodyweight squats, a few jumping pull-ups...',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    desc: '6–24 months',
    icon: Zap,
    placeholder:
      'e.g. 8 pull-ups, 15 dips, can hold an L-sit for 5s...',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    desc: '2–5 years',
    icon: Target,
    placeholder:
      'e.g. muscle-ups, 30s handstand, working on front lever...',
  },
  {
    value: 'elite',
    label: 'Elite',
    desc: '5+ years',
    icon: Trophy,
    placeholder:
      'e.g. straddle planche, full front lever 5s, learning flag...',
  },
];

const GOAL_ICONS = {
  Dumbbell,
  Scale,
  Trophy,
  Wind,
  Target,
  Heart,
  PersonStanding,
  Sparkles,
};

/* ============================================================
   HELPERS
============================================================ */

function getErrorMessage(error, fallback = 'Something went wrong.') {
  if (!error) return fallback;

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error?.message) {
    return error.error.message;
  }

  if (error?.details) {
    return error.details;
  }

  if (error?.hint) {
    return error.hint;
  }

  try {
    const stringified = JSON.stringify(error);

    if (stringified && stringified !== '{}') {
      return stringified;
    }
  } catch {
    // Ignore serialization errors.
  }

  return fallback;
}

function normalizeFunctionResponse(response, functionName) {
  console.log(
    '[ONBOARDING]',
    functionName,
    'raw response:',
    response
  );

  if (!response) {
    throw new Error(functionName + ' returned no response.');
  }

  if (response.error) {
    throw new Error(
      getErrorMessage(
        response.error,
        functionName + ' returned an error.'
      )
    );
  }

  if (response.data == null) {
    throw new Error(
      functionName + ' returned an empty response.'
    );
  }

  const data = response.data;

  if (data && data.success === false) {
    throw new Error(
      getErrorMessage(
        data.error || data.message,
        functionName + ' failed.'
      )
    );
  }

  return data && data.result != null
    ? data.result
    : data;
}

/*
 * This progress system is deliberately NOT time based.
 *
 * The percentage represents completed known operations.
 * While an operation is running, the percentage does not
 * move until that operation actually succeeds.
 *
 * Therefore:
 *
 * 0%   = nothing started
 * 10%  = authentication complete
 * 20%  = profile saved
 * 30%  = structure generated
 * 30–85% = each microcycle generation actually completed
 * 90%  = program saved
 * 95%  = cache refresh completed
 * 100% = finished
 *
 * The percentage is NOT an estimate of remaining time.
 */

function SearchSelect({
  value,
  onChange,
  options,
  placeholder,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return options
      .filter((option) =>
        option.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 200);
  }, [options, search]);

  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full h-12 px-4 rounded-2xl border-2 border-border bg-card text-sm text-left flex items-center justify-between hover:border-muted-foreground/30 transition-all"
      >
        <span
          className={
            value
              ? 'text-foreground'
              : 'text-muted-foreground'
          }
        >
          {value || placeholder}
        </span>

        <span className="text-muted-foreground text-xs">
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search..."
              className="w-full h-9 px-3 text-sm bg-muted rounded-xl outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            {filtered.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-2.5 text-sm text-left hover:bg-muted/80 transition-all',
                  option === value &&
                    'bg-primary/10 text-primary font-semibold'
                )}
              >
                {option}
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="px-4 py-3 text-xs text-muted-foreground">
                No results
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CountrySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = COUNTRIES.find(
    (item) => item.code === value
  );

  const filtered = useMemo(() => {
    return COUNTRIES.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full h-12 px-4 rounded-2xl border-2 border-border bg-card text-sm text-left flex items-center justify-between hover:border-muted-foreground/30 transition-all"
      >
        <span
          className={
            selected
              ? 'text-foreground'
              : 'text-muted-foreground'
          }
        >
          {selected?.name || 'Select your country…'}
        </span>

        <span className="text-muted-foreground text-xs">
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search country..."
              className="w-full h-9 px-3 text-sm bg-muted rounded-xl outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            {filtered.map((countryOption) => (
              <button
                type="button"
                key={countryOption.code}
                onClick={() => {
                  onChange(countryOption.code);
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'w-full px-4 py-2.5 text-sm text-left hover:bg-muted/80 transition-all',
                  countryOption.code === value &&
                    'bg-primary/10 text-primary font-semibold'
                )}
              >
                {countryOption.name}
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="px-4 py-3 text-xs text-muted-foreground">
                No results
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MAIN ONBOARDING
============================================================ */

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateSettings } = useAppSettings();

  const [step, setStep] = useState(0);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('English');
  const [unit, setUnit] = useState('imperial');

  const [trainingType, setTrainingType] = useState('');
  const [level, setLevel] = useState('');

  const [goalDescription, setGoalDescription] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [equipment, setEquipment] = useState('');
  const [requirements, setRequirements] = useState('');

  const [age, setAge] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');

  const [fitnessGoals, setFitnessGoals] = useState([]);
  const [currentSkills, setCurrentSkills] = useState('');
  const [gender, setGender] = useState('');
  const [weightGoals, setWeightGoals] = useState([]);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [generationError, setGenerationError] = useState('');

  const generationStartedRef = useRef(false);

  const hasSkills =
    trainingType === 'calisthenics' ||
    trainingType === 'weighted_calisthenics' ||
    trainingType === 'hybrid';

  const hasWeightGoals =
    trainingType === 'weights' ||
    trainingType === 'hybrid';

  const handleCountryChange = (code) => {
    setCountry(code);

    const defaults = getCountryDefaults(code);

    if (defaults) {
      setLanguage(defaults.language);
      setUnit(defaults.unit);
    }
  };

  const toggleGoal = (value) => {
    setFitnessGoals((previous) =>
      previous.includes(value)
        ? previous.filter((goal) => goal !== value)
        : [...previous, value]
    );
  };

  const toggleWeightGoal = (value) => {
    setWeightGoals((previous) =>
      previous.includes(value)
        ? previous.filter((goal) => goal !== value)
        : [...previous, value]
    );
  };

  useEffect(() => {
    if (step === 0) return;

    window.history.pushState(
      { onboardingStep: step },
      ''
    );

    const handlePopState = () => {
      if (!loading) {
        setStep((current) => Math.max(0, current - 1));
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [step, loading]);

  const step3Valid = hasSkills
    ? Boolean(
        level &&
          (!hasWeightGoals || weightGoals.length > 0)
      )
    : weightGoals.length > 0;

  const generateValid =
    equipment.trim().length > 0 &&
    (!hasSkills || goalDescription.trim().length >= 10);

  /*
   * Centralized progress update.
   */
  const setGenerationStage = (value, message) => {
    const safeValue = Math.max(
      0,
      Math.min(100, Math.round(value))
    );

    console.log(
      '[ONBOARDING] PROGRESS:',
      safeValue + '%',
      message
    );

    setProgress(safeValue);
    setLoadingPhase(message);
  };

  /*
   * Explicit wrapper around Supabase function invocation.
   *
   * This is intentionally verbose so the browser console clearly
   * shows whether the request was attempted and whether Supabase
   * returned.
   */
  const invokeWorkoutGeneration = async (
    type,
    prompt,
    schema,
    label
  ) => {
    console.log(
      '[ONBOARDING] ========================================'
    );

    console.log(
      '[ONBOARDING] SUPABASE INVOCATION START:',
      label
    );

    console.log(
      '[ONBOARDING] Function:',
      'workout-generation'
    );

    console.log(
      '[ONBOARDING] Type:',
      type
    );

    console.log(
      '[ONBOARDING] Supabase client exists:',
      Boolean(supabase)
    );

    if (!supabase) {
      throw new Error(
        'Supabase client is not available in the browser.'
      );
    }

    try {
      const response =
        await supabase.functions.invoke(
          'workout-generation',
          {
            body: {
              type,
              prompt,
              schema,
            },
          }
        );

      console.log(
        '[ONBOARDING] SUPABASE INVOCATION RETURNED:',
        label,
        response
      );

      console.log(
        '[ONBOARDING] SUPABASE INVOCATION END:',
        label
      );

      return normalizeFunctionResponse(
        response,
        label
      );
    } catch (error) {
      console.error(
        '[ONBOARDING] SUPABASE INVOCATION FAILED:',
        label,
        error
      );

      throw error;
    }
  };

  /* ============================================================
     GENERATION
  ============================================================ */

  const handleGenerate = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log(
      '[ONBOARDING] ========================================'
    );

    console.log(
      '[ONBOARDING] BUILD MY PROGRAM CLICKED'
    );

    console.log(
      '[ONBOARDING] Button handler reached successfully.'
    );

    console.log(
      '[ONBOARDING] Current form state:',
      {
        trainingType,
        level,
        equipment,
        goalDescription,
        fitnessGoals,
        weightGoals,
      }
    );

    /*
     * Prevent duplicate generation.
     */
    if (generationStartedRef.current || loading) {
      console.warn(
        '[ONBOARDING] Generation already running.'
      );
      return;
    }

    /*
     * Validate before locking the process.
     */
    if (!equipment.trim()) {
      console.warn(
        '[ONBOARDING] Generation blocked: equipment missing.'
      );

      toast.error(
        'Please enter your available equipment.'
      );

      return;
    }

    if (
      hasSkills &&
      goalDescription.trim().length < 10
    ) {
      console.warn(
        '[ONBOARDING] Generation blocked: goal description too short.'
      );

      toast.error(
        'Please describe your goals in a little more detail.'
      );

      return;
    }

    /*
     * LOCK IMMEDIATELY.
     *
     * This happens synchronously inside the click handler,
     * before the first await.
     */
    generationStartedRef.current = true;
    setGenerationError('');
    setLoading(true);

    /*
     * The user should immediately see that the click worked.
     */
    setGenerationStage(
      1,
      'Starting your personalized program…'
    );

    console.log(
      '[ONBOARDING] Loading state enabled.'
    );

    try {
      /* ========================================================
         1. SETTINGS
      ======================================================== */

      console.log(
        '[ONBOARDING] Updating application settings...'
      );

      try {
        updateSettings({
          country,
          language,
          unit,
        });
      } catch (settingsError) {
        console.warn(
          '[ONBOARDING] Settings update warning:',
          settingsError
        );
      }

      /* ========================================================
         2. AUTHENTICATION
      ======================================================== */

      setGenerationStage(
        5,
        'Connecting to your account…'
      );

      console.log(
        '[ONBOARDING] ABOUT TO CALL supabase.auth.getUser()'
      );

      if (!supabase) {
        throw new Error(
          'Supabase client is not initialized.'
        );
      }

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      console.log(
        '[ONBOARDING] supabase.auth.getUser() RETURNED:',
        {
          authData,
          authError,
        }
      );

      if (authError) {
        throw authError;
      }

      const user = authData?.user;

      if (!user) {
        throw new Error(
          'No authenticated user was found. Please sign in again.'
        );
      }

      setGenerationStage(
        10,
        'Account connected.'
      );

      console.log(
        '[ONBOARDING] AUTHENTICATED USER:',
        user.id
      );

      /* ========================================================
         3. PROFILE
      ======================================================== */

      const parsedAge = parseInt(age, 10);

      /*
       * NOTE:
       * The existing database field is weight_lbs.
       * For metric users we convert kg -> lbs before saving.
       */
      let weightInLbs = null;

      const parsedWeight = parseFloat(weightLbs);

      if (
        Number.isFinite(parsedWeight) &&
        parsedWeight > 0
      ) {
        weightInLbs =
          unit === 'metric'
            ? parsedWeight * 2.2046226218
            : parsedWeight;
      }

      let heightInches = null;
      let heightCm = null;

      if (unit === 'imperial') {
        const feet =
          parseInt(heightFt, 10) || 0;

        const inches =
          parseInt(heightIn, 10) || 0;

        const calculated =
          feet * 12 + inches;

        if (calculated > 0) {
          heightInches = calculated;
        }
      } else {
        const cm = parseFloat(heightFt);

        if (
          Number.isFinite(cm) &&
          cm > 0
        ) {
          heightCm = cm;
        }
      }

      const profileData = {
        id: user.id,

        first_name: firstName.trim(),
        last_name: lastName.trim(),

        training_type: trainingType,

        fitness_level:
          level || 'intermediate',

        primary_goal:
          goalDescription.trim() ||
          weightGoals.join(', ') ||
          fitnessGoals.join(', '),

        goal_timeframe:
          timeframe.trim(),

        available_equipment:
          equipment.trim(),

        training_requirements:
          requirements.trim(),

        weight_goals:
          weightGoals,

        fitness_goals:
          fitnessGoals,

        current_skills:
          currentSkills.trim(),

        age:
          Number.isFinite(parsedAge)
            ? parsedAge
            : null,

        gender:
          gender || null,

        weight_lbs:
          weightInLbs,

        height_inches:
          heightInches,

        height_cm:
          heightCm,

        country,
        language,
        unit,

        onboarded: true,
      };

      setGenerationStage(
        12,
        'Saving your profile…'
      );

      console.log(
        '[ONBOARDING] PROFILE UPSERT START:',
        profileData
      );

      const {
        error: profileError,
      } = await supabase
        .from('profiles')
        .upsert(
          profileData,
          {
            onConflict: 'id',
          }
        );

      console.log(
        '[ONBOARDING] PROFILE UPSERT RETURNED:',
        profileError
      );

      if (profileError) {
        throw profileError;
      }

      setGenerationStage(
        20,
        'Profile saved. Preparing your program…'
      );

      /* ========================================================
         4. PROMPT DATA
      ======================================================== */

      const promptData = {
        gender,
        level,
        age,
        weightLbs,
        heightFt,
        heightIn,
        unit,
        currentSkills,
        goalDescription,
        timeframe,
        equipment,
        requirements,
        fitnessGoals,
        weightGoals,
      };

      console.log(
        '[ONBOARDING] PROMPT DATA READY:',
        promptData
      );

      /* ========================================================
         5. PROGRAM STRUCTURE
      ======================================================== */

      setGenerationStage(
        22,
        'Designing your program structure…'
      );

      const structurePrompt =
        buildStructurePrompt(
          trainingType,
          promptData
        );

      console.log(
        '[ONBOARDING] STRUCTURE PROMPT CREATED.'
      );

      const structureResult =
        await invokeWorkoutGeneration(
          'structure',
          structurePrompt,
          {
            type: 'object',
            additionalProperties: true,
            properties: {
              program_name: {
                type: 'string',
              },

              duration_weeks: {
                type: 'number',
              },

              macrocycle: {
                type: 'object',
                additionalProperties: true,
              },

              mesocycles: {
                type: 'array',
              },
            },

            required: [
              'program_name',
              'duration_weeks',
              'macrocycle',
              'mesocycles',
            ],
          },
          'workout-generation / structure'
        );

      console.log(
        '[ONBOARDING] STRUCTURE RESULT:',
        structureResult
      );

      if (
        !structureResult ||
        typeof structureResult !== 'object'
      ) {
        throw new Error(
          'AI returned an invalid program structure.'
        );
      }

      const mesocycles =
        Array.isArray(
          structureResult.mesocycles
        )
          ? structureResult.mesocycles
          : [];

      if (!mesocycles.length) {
        throw new Error(
          'AI returned no training phases. Please try again.'
        );
      }

      setGenerationStage(
        30,
        'Program structure complete.'
      );

      console.log(
        '[ONBOARDING] TOTAL TRAINING PHASES:',
        mesocycles.length
      );

      /* ========================================================
         6. MICROCYCLES
      ======================================================== */

      const allMicrocycles = [];

      const microcycleStart = 30;
      const microcycleEnd = 85;
      const microcycleRange =
        microcycleEnd - microcycleStart;

      for (
        let index = 0;
        index < mesocycles.length;
        index += 1
      ) {
        const meso =
          mesocycles[index];

        const phaseName =
          meso?.name ||
          'Training phase ' + (index + 1);

        /*
         * Percentage BEFORE the current phase starts.
         *
         * It intentionally stays here while Supabase/AI
         * is processing this phase.
         */
        const progressBefore =
          microcycleStart +
          (index / mesocycles.length) *
            microcycleRange;

        setGenerationStage(
          progressBefore,
          'Building ' +
            phaseName +
            '…'
        );

        console.log(
          '[ONBOARDING] ========================================'
        );

        console.log(
          '[ONBOARDING] MICROCYCLE START:',
          index + 1,
          'of',
          mesocycles.length
        );

        console.log(
          '[ONBOARDING] PHASE:',
          phaseName
        );

        const microPrompt =
          buildMicrocyclePrompt(
            trainingType,
            promptData,
            index,
            meso
          );

        const microResult =
          await invokeWorkoutGeneration(
            'microcycle',
            microPrompt,
            {
              type: 'object',
              additionalProperties: true,
              properties: {
                microcycles: {
                  type: 'array',
                },
              },
              required: [
                'microcycles',
              ],
            },
            'workout-generation / microcycle ' +
              (index + 1)
          );

        console.log(
          '[ONBOARDING] MICROCYLCE RESULT:',
          index + 1,
          microResult
        );

        const generatedMicrocycles =
          Array.isArray(
            microResult?.microcycles
          )
            ? microResult.microcycles
            : [];

        if (
          !generatedMicrocycles.length
        ) {
          throw new Error(
            'AI returned no workouts for ' +
              phaseName +
              '.'
          );
        }

        allMicrocycles.push(
          ...generatedMicrocycles
        );

        /*
         * ONLY after this operation has actually completed
         * successfully do we advance the percentage.
         */
        const completed =
          index + 1;

        const completedProgress =
          microcycleStart +
          (completed / mesocycles.length) *
            microcycleRange;

        setGenerationStage(
          completedProgress,
          phaseName +
            ' complete (' +
            completed +
            '/' +
            mesocycles.length +
            ').'
        );

        console.log(
          '[ONBOARDING] MICROCYCLE COMPLETE:',
          index + 1,
          'of',
          mesocycles.length
        );
      }

      if (!allMicrocycles.length) {
        throw new Error(
          'No workouts were generated.'
        );
      }

      console.log(
        '[ONBOARDING] ALL MICROCYCLES GENERATED:',
        allMicrocycles.length
      );

      /* ========================================================
         7. SAVE FINAL PROGRAM
      ======================================================== */

      setGenerationStage(
        90,
        'Saving your personalized program…'
      );

      const primaryGoal =
        goalDescription.trim() ||
        weightGoals.join(', ') ||
        fitnessGoals.join(', ');

      const programPayload = {
        user_id: user.id,

        program_name:
          structureResult.program_name,

        duration_weeks:
          structureResult.duration_weeks,

        macrocycle:
          structureResult.macrocycle,

        mesocycles:
          structureResult.mesocycles,

        microcycles:
          allMicrocycles,

        training_type:
          trainingType,

        fitness_level:
          level || 'intermediate',

        goal:
          primaryGoal,

        current_week: 1,

        status: 'active',
      };

      console.log(
        '[ONBOARDING] PROGRAM INSERT START:',
        programPayload
      );

      const {
        data: savedProgram,
        error: programError,
      } = await supabase
        .from('workout_programs')
        .insert(programPayload)
        .select()
        .single();

      console.log(
        '[ONBOARDING] PROGRAM INSERT RETURNED:',
        {
          savedProgram,
          programError,
        }
      );

      if (programError) {
        throw programError;
      }

      if (!savedProgram) {
        throw new Error(
          'The program was generated but could not be confirmed as saved.'
        );
      }

      setGenerationStage(
        93,
        'Program saved successfully.'
      );

      /* ========================================================
         8. CACHE REFRESH
      ======================================================== */

      console.log(
        '[ONBOARDING] CACHE REFRESH START'
      );

      try {
        await queryClientInstance.invalidateQueries();

        console.log(
          '[ONBOARDING] CACHE REFRESH COMPLETE'
        );

        setGenerationStage(
          97,
          'Finishing up your personalized program…'
        );
      } catch (cacheError) {
        console.warn(
          '[ONBOARDING] CACHE REFRESH WARNING:',
          cacheError
        );

        /*
         * Cache refresh is not required for program creation
         * to be successful.
         */
        setGenerationStage(
          97,
          'Program saved. Finishing up…'
        );
      }

      /* ========================================================
         9. COMPLETE
      ======================================================== */

      setGenerationStage(
        100,
        'Your personalized program is ready!'
      );

      console.log(
        '[ONBOARDING] ========================================'
      );

      console.log(
        '[ONBOARDING] PROGRAM GENERATION COMPLETE'
      );

      console.log(
        '[ONBOARDING] SAVED PROGRAM ID:',
        savedProgram.id
      );

      console.log(
        '[ONBOARDING] ========================================'
      );

      toast.success(
        'Your personalized program is ready!'
      );

      /*
       * Let the user actually see 100%.
       */
      await new Promise((resolve) => {
        window.setTimeout(resolve, 800);
      });

      navigate('/', {
        replace: true,
      });
    } catch (error) {
      console.error(
        '[ONBOARDING] ========================================'
      );

      console.error(
        '[ONBOARDING] PROGRAM GENERATION FAILED'
      );

      console.error(
        '[ONBOARDING] ERROR:',
        error
      );

      console.error(
        '[ONBOARDING] ========================================'
      );

      const message =
        getErrorMessage(
          error,
          'Failed to generate your program. Please try again.'
        );

      setGenerationError(message);

      setLoading(false);
      setProgress(0);
      setLoadingPhase('');

      generationStartedRef.current = false;

      toast.error(message);
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">
      <div className="px-6 pt-4 pb-4">
        <div className="flex items-center gap-2 mb-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={cn(
                'h-1 rounded-full flex-1 transition-all duration-500',
                index <= step
                  ? 'bg-primary'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ======================================================
            STEP 0
        ====================================================== */}

        {step === 0 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col px-6"
          >
            <h1 className="font-heading text-4xl font-bold mb-2 tracking-tight">
              Welcome to{' '}
              <span className="text-primary">
                Washek Fitness
              </span>
            </h1>

            <p className="text-muted-foreground text-lg mb-8">
              Your AI-powered training coach.
              Let's build your perfect program.
            </p>

            <div className="flex-1 flex flex-col justify-center gap-4">
              <div className="flex justify-center mb-4">
                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Zap className="w-14 h-14 text-primary" />
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  First Name
                </p>

                <Input
                  placeholder="e.g. Alex"
                  value={firstName}
                  onChange={(event) =>
                    setFirstName(event.target.value)
                  }
                  className="h-14 text-lg rounded-2xl"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  Last Name
                </p>

                <Input
                  placeholder="e.g. Johnson"
                  value={lastName}
                  onChange={(event) =>
                    setLastName(event.target.value)
                  }
                  className="h-14 text-lg rounded-2xl"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium flex items-center gap-1.5">
                  <Globe className="w-3 h-3" />
                  Country
                </p>

                <CountrySelect
                  value={country}
                  onChange={handleCountryChange}
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  Language
                </p>

                <SearchSelect
                  value={language}
                  onChange={setLanguage}
                  options={LANGUAGES}
                  placeholder="Select language…"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  Measurement System
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      value: 'metric',
                      label: 'Metric (kg, cm)',
                    },
                    {
                      value: 'imperial',
                      label: 'Imperial (lbs, ft)',
                    },
                  ].map(({ value, label }) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setUnit(value)}
                      className={cn(
                        'h-11 rounded-2xl border-2 text-sm font-semibold transition-all',
                        unit === value
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={
                !firstName.trim() ||
                !country
              }
              onClick={() => setStep(1)}
              className="w-full h-14 rounded-xl bg-primary text-primary-foreground text-lg font-heading font-semibold mb-8 mt-4 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center"
            >
              Get Started
              <ChevronRight className="ml-2 w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* ======================================================
            STEP 1
        ====================================================== */}

        {step === 1 && (
          <motion.div
            key="training-type"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col px-6"
          >
            <h2 className="font-heading text-2xl font-bold mb-1">
              Choose Your Path
            </h2>

            <p className="text-muted-foreground mb-6">
              What type of training are you here
              for, {firstName || 'Athlete'}?
            </p>

            <div className="flex-1">
              <TrainingTypeSelect
                value={trainingType}
                onChange={setTrainingType}
              />
            </div>

            <div className="flex gap-3 mb-8 mt-4">
              <button
                type="button"
                className="h-14 px-5 rounded-xl border border-border bg-card hover:bg-muted transition-all"
                onClick={() => setStep(0)}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                className="flex-1 h-14 rounded-xl bg-primary text-primary-foreground text-lg font-heading font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center"
                disabled={!trainingType}
                onClick={() => setStep(2)}
              >
                Continue
                <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================
            STEP 2
        ====================================================== */}

        {step === 2 && (
          <motion.div
            key="bodystats"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col px-6"
          >
            <h2 className="font-heading text-2xl font-bold mb-1">
              About You
            </h2>

            <p className="text-muted-foreground mb-6">
              Your stats help us personalize
              nutrition goals and training load.
            </p>

            <div className="space-y-4 flex-1">
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
                  Gender
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {['male', 'female'].map(
                    (genderOption) => (
                      <button
                        type="button"
                        key={genderOption}
                        onClick={() =>
                          setGender(genderOption)
                        }
                        className={cn(
                          'h-12 rounded-2xl border-2 font-semibold text-sm capitalize transition-all',
                          gender === genderOption
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                        )}
                      >
                        {genderOption === 'male'
                          ? '♂ Male'
                          : '♀ Female'}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium">
                    Age
                  </p>

                  <Input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 24"
                    value={age}
                    onChange={(event) =>
                      setAge(event.target.value)
                    }
                    className="h-12 text-base"
                  />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium">
                    Weight (
                    {unit === 'metric'
                      ? 'kg'
                      : 'lbs'}
                    )
                  </p>

                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder={
                      unit === 'metric'
                        ? 'e.g. 80'
                        : 'e.g. 175'
                    }
                    value={weightLbs}
                    onChange={(event) =>
                      setWeightLbs(event.target.value)
                    }
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  Height
                </p>

                {unit === 'metric' ? (
                  <Input
                    type="number"
                    min="0"
                    placeholder="Height in cm (e.g. 178)"
                    value={heightFt}
                    onChange={(event) =>
                      setHeightFt(event.target.value)
                    }
                    className="h-12 text-base"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      min="0"
                      max="8"
                      placeholder="Feet (e.g. 5)"
                      value={heightFt}
                      onChange={(event) =>
                        setHeightFt(event.target.value)
                      }
                      className="h-12 text-base"
                    />

                    <Input
                      type="number"
                      min="0"
                      max="11"
                      placeholder="Inches (e.g. 10)"
                      value={heightIn}
                      onChange={(event) =>
                        setHeightIn(event.target.value)
                      }
                      className="h-12 text-base"
                    />
                  </div>
                )}
              </div>

              {hasSkills && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
                    Your Goals (select all that apply)
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {CALISTHENICS_GOALS.map(
                      ({
                        value,
                        label,
                        iconName,
                      }) => {
                        const GoalIcon =
                          GOAL_ICONS[iconName] ||
                          Dumbbell;

                        const selected =
                          fitnessGoals.includes(value);

                        return (
                          <button
                            type="button"
                            key={value}
                            onClick={() =>
                              toggleGoal(value)
                            }
                            aria-pressed={selected}
                            className={cn(
                              'flex items-center gap-2 p-3 rounded-2xl border-2 text-left transition-all',
                              selected
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                            )}
                          >
                            <GoalIcon className="w-4 h-4 flex-shrink-0" />

                            <span className="text-sm font-medium">
                              {label}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mb-8 mt-4">
              <button
                type="button"
                className="h-14 px-5 rounded-xl border border-border bg-card hover:bg-muted transition-all"
                onClick={() => setStep(1)}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                className="flex-1 h-14 rounded-xl bg-primary text-primary-foreground text-lg font-heading font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center"
                disabled={
                  !gender ||
                  (hasSkills &&
                    fitnessGoals.length === 0)
                }
                onClick={() => setStep(3)}
              >
                Continue
                <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================
            STEP 3
        ====================================================== */}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col px-6"
          >
            {hasSkills && (
              <>
                <h2 className="font-heading text-2xl font-bold mb-1">
                  Your Level
                </h2>

                <p className="text-muted-foreground mb-6">
                  Where are you in your journey,{' '}
                  {firstName || 'Athlete'}?
                </p>

                <div className="space-y-3 flex-1">
                  {levels.map(
                    ({
                      value,
                      label,
                      desc,
                      icon: Icon,
                      placeholder,
                    }) => (
                      <div key={value}>
                        <button
                          type="button"
                          onClick={() =>
                            setLevel(value)
                          }
                          className={cn(
                            'w-full p-4 rounded-2xl border-2 text-left transition-all',
                            level === value
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-card hover:border-muted-foreground/30'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center',
                                level === value
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              <Icon className="w-5 h-5" />
                            </div>

                            <div>
                              <p className="font-semibold">
                                {label}
                              </p>

                              <p className="text-sm text-muted-foreground">
                                {desc}
                              </p>
                            </div>
                          </div>
                        </button>

                        {level === value && (
                          <div className="mt-1.5 px-1">
                            <Textarea
                              value={currentSkills}
                              onChange={(event) =>
                                setCurrentSkills(
                                  event.target.value
                                )
                              }
                              placeholder={placeholder}
                              className="text-sm resize-none min-h-[72px] rounded-2xl border-primary/40 bg-primary/5 focus:border-primary leading-relaxed"
                            />

                            <p className="text-xs text-muted-foreground mt-1 pl-1">
                              What skills & moves can
                              you currently do?
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>

                {hasWeightGoals && (
                  <div className="mt-6">
                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
                      Weight Training Goals
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {WEIGHT_GOALS.map(
                        ({
                          value,
                          label,
                          iconName,
                        }) => {
                          const GoalIcon =
                            GOAL_ICONS[iconName] ||
                            Dumbbell;

                          const selected =
                            weightGoals.includes(value);

                          return (
                            <button
                              type="button"
                              key={value}
                              onClick={() =>
                                toggleWeightGoal(value)
                              }
                              aria-pressed={selected}
                              className={cn(
                                'flex items-center gap-2 p-3 rounded-2xl border-2 text-left transition-all',
                                selected
                                  ? 'border-primary bg-primary/10 text-foreground'
                                  : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                              )}
                            >
                              <GoalIcon className="w-4 h-4 flex-shrink-0" />

                              <span className="text-sm font-medium">
                                {label}
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {!hasSkills && (
              <>
                <h2 className="font-heading text-2xl font-bold mb-1">
                  Your Goals
                </h2>

                <p className="text-muted-foreground mb-6">
                  What do you want to achieve with
                  weight training,{' '}
                  {firstName || 'Athlete'}?
                </p>

                <div className="grid grid-cols-2 gap-3 flex-1">
                  {WEIGHT_GOALS.map(
                    ({
                      value,
                      label,
                      iconName,
                    }) => {
                      const GoalIcon =
                        GOAL_ICONS[iconName] ||
                        Dumbbell;

                      const selected =
                        weightGoals.includes(value);

                      return (
                        <button
                          type="button"
                          key={value}
                          onClick={() =>
                            toggleWeightGoal(value)
                          }
                          aria-pressed={selected}
                          className={cn(
                            'flex items-center gap-2 p-4 rounded-2xl border-2 text-left transition-all',
                            selected
                              ? 'border-primary bg-primary/10 text-foreground'
                              : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                          )}
                        >
                          <GoalIcon className="w-5 h-5 flex-shrink-0" />

                          <span className="text-sm font-medium">
                            {label}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </>
            )}

            <div className="flex gap-3 mb-8 mt-4">
              <button
                type="button"
                className="h-14 px-5 rounded-xl border border-border bg-card hover:bg-muted transition-all"
                onClick={() => setStep(2)}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                className="flex-1 h-14 rounded-xl bg-primary text-primary-foreground text-lg font-heading font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center"
                disabled={!step3Valid}
                onClick={() => setStep(4)}
              >
                Continue
                <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================
            STEP 4
        ====================================================== */}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col px-6"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-primary" />

              <h2 className="font-heading text-2xl font-bold">
                {hasSkills
                  ? 'Tell us your goals, ' +
                    (firstName || 'Athlete')
                  : 'Final details, ' +
                    (firstName || 'Athlete')}
              </h2>
            </div>

            <p className="text-muted-foreground mb-4">
              {hasSkills
                ? 'Describe your goals, what you want to achieve, and any limitations. The more detail you give, the more personalized your program will be.'
                : 'List your available equipment and any requirements. This helps us build the perfect program for you.'}
            </p>

            <div className="flex-1 flex flex-col gap-3">
              {hasSkills && (
                <>
                  <Textarea
                    value={goalDescription}
                    onChange={(event) =>
                      setGoalDescription(event.target.value)
                    }
                    placeholder='e.g. "I want to learn the muscle up and build a strong back. I can currently do 10 pull-ups and 15 dips. I want to improve my strength while taking care of my shoulders."'
                    className="min-h-[140px] text-sm resize-none bg-card border-border focus:border-primary rounded-2xl p-4 leading-relaxed"
                    disabled={loading}
                  />

                  <div className="bg-muted/50 rounded-2xl p-4 border border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      ⏱ Timeframe for your goals
                    </p>

                    <Textarea
                      value={timeframe}
                      onChange={(event) =>
                        setTimeframe(event.target.value)
                      }
                      placeholder='e.g. "Muscle up in 3 months, handstand in 6 months."'
                      className="min-h-[60px] text-sm resize-none bg-card border-border focus:border-primary rounded-xl p-3 leading-relaxed"
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              {!hasSkills && (
                <div className="bg-muted/50 rounded-2xl p-4 border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    📋 Goals summary
                  </p>

                  <p className="text-sm text-muted-foreground">
                    You selected:{' '}
                    <span className="font-semibold text-foreground">
                      {weightGoals.join(', ') ||
                        'General fitness'}
                    </span>
                  </p>
                </div>
              )}

              <div className="bg-muted/50 rounded-2xl p-4 border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  🏋️ Available equipment{' '}
                  <span className="text-destructive">*</span>
                </p>

                <Textarea
                  value={equipment}
                  onChange={(event) =>
                    setEquipment(event.target.value)
                  }
                  placeholder={
                    hasSkills
                      ? 'e.g. "Pull-up bar, dip bars, resistance bands, gymnastic rings, parallettes."'
                      : 'e.g. "Full gym access: barbells, dumbbells, cables, machines, squat rack, bench."'
                  }
                  className="min-h-[70px] text-sm resize-none bg-card border-border focus:border-primary rounded-xl p-3 leading-relaxed"
                  disabled={loading}
                />

                <p className="text-[10px] text-muted-foreground mt-1.5">
                  List everything you have access to — this
                  is required.
                </p>
              </div>

              <div className="bg-muted/50 rounded-2xl p-4 border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  📝 Requirements & Notes
                </p>

                <Textarea
                  value={requirements}
                  onChange={(event) =>
                    setRequirements(event.target.value)
                  }
                  placeholder='e.g. "I can train 4 days a week, about 60 min per session. I want to focus on my chest and shoulders."'
                  className="min-h-[80px] text-sm resize-none bg-card border-border focus:border-primary rounded-xl p-3 leading-relaxed"
                  disabled={loading}
                />

                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Time available, limitations, areas to
                  focus on, and anything else that helps
                  personalize your program.
                </p>
              </div>
            </div>

            {/* ==================================================
                GENERATION STATUS
            ================================================== */}

            {loading && (
              <div className="mt-5 mb-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />

                    <p className="text-sm font-semibold truncate">
                      {loadingPhase ||
                        'Building your program…'}
                    </p>
                  </div>

                  <span className="text-sm font-bold text-primary flex-shrink-0">
                    {Math.round(progress)}%
                  </span>
                </div>

                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                    style={{
                      width:
                        Math.max(
                          0,
                          Math.min(100, progress)
                        ) + '%',
                    }}
                  />
                </div>

                <p className="text-[11px] text-muted-foreground mt-2">
                  The percentage advances only when a
                  generation step actually completes.
                </p>
              </div>
            )}

            {generationError && !loading && (
              <div className="mt-5 mb-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-semibold text-destructive mb-1">
                  Program generation failed
                </p>

                <p className="text-xs text-muted-foreground break-words">
                  {generationError}
                </p>

                <p className="text-[11px] text-muted-foreground mt-2">
                  Check the browser console for the detailed
                  Supabase request log.
                </p>
              </div>
            )}

            <div className="flex gap-3 mb-8 mt-4">
              <button
                type="button"
                className="h-14 px-5 rounded-xl border border-border bg-card hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                onClick={() => setStep(3)}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                id="build-my-program-button"
                data-onboarding-build-button="true"
                disabled={
                  loading ||
                  !generateValid
                }
                onClick={handleGenerate}
                onPointerDown={() => {
                  console.log(
                    '[ONBOARDING] BUILD BUTTON POINTER DOWN'
                  );
                }}
                className={cn(
                  'relative z-50 pointer-events-auto flex-1 h-14 rounded-xl text-lg font-heading font-semibold transition-all flex items-center justify-center',
                  'bg-primary text-primary-foreground',
                  'hover:opacity-90 active:scale-[0.99]',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
                )}
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />

                    <span>
                      Building…{' '}
                      {Math.round(progress)}%
                    </span>
                  </span>
                ) : (
                  <>
                    {generationError
                      ? 'Try Again'
                      : 'Build My Program'}

                    <Sparkles className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {!loading && !generateValid && (
              <p className="text-xs text-muted-foreground text-center mb-6">
                {hasSkills &&
                goalDescription.trim().length < 10
                  ? 'Add a little more detail about your goals to continue.'
                  : 'Enter your available equipment to continue.'}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
