import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { queryClientInstance } from '@/lib/query-client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
import {
  COUNTRIES,
  LANGUAGES,
  getCountryDefaults,
} from '@/lib/countries';
import { useAppSettings } from '@/lib/AppSettingsContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import TrainingTypeSelect from '@/components/onboarding/TrainingTypeSelect';
import {
  CALISTHENICS_GOALS,
  WEIGHT_GOALS,
  buildStructurePrompt,
  buildMicrocyclePrompt,
} from '@/lib/trainingTypes';
import { toast } from 'sonner';

const TOTAL_STEPS = 5;

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

function SearchSelect({
  value,
  onChange,
  options,
  placeholder,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = options
    .filter((option) =>
      option.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 200);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event) => {
      if (!event.target.closest('[data-search-select]')) {
        setOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };
  }, [open]);

  return (
    <div
      className="relative"
      data-search-select
    >
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          setSearch('');
        }}
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

        <span
          className={cn(
            'text-muted-foreground text-xs transition-transform',
            open && 'rotate-180'
          )}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute z-[100] top-full mt-1 w-full bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
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
                  setSearch('');
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

function CountrySelect({
  value,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = COUNTRIES.find(
    (country) => country.code === value
  );

  const filtered = COUNTRIES.filter((country) =>
    country.name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event) => {
      if (!event.target.closest('[data-country-select]')) {
        setOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };
  }, [open]);

  return (
    <div
      className="relative"
      data-country-select
    >
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          setSearch('');
        }}
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

        <span
          className={cn(
            'text-muted-foreground text-xs transition-transform',
            open && 'rotate-180'
          )}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute z-[100] top-full mt-1 w-full bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
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

function getErrorMessage(error, fallback) {
  if (!error) return fallback;

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error.message) {
    return error.message;
  }

  if (error.error) {
    return getErrorMessage(error.error, fallback);
  }

  try {
    const parsed =
      typeof error === 'string'
        ? error
        : JSON.stringify(error);

    if (parsed && parsed !== '{}') {
      return parsed;
    }
  } catch {
    // Ignore JSON serialization failures.
  }

  return fallback;
}

/**
 * Supabase Edge Functions return:
 *
 * {
 *   data,
 *   error
 * }
 *
 * The Edge Function itself may also return:
 *
 * {
 *   success: false,
 *   error: ...
 * }
 *
 * This normalizes both cases into the actual AI result.
 */
function normalizeFunctionResponse(response) {
  if (!response) {
    throw new Error(
      'No response was returned by workout-generation.'
    );
  }

  if (response.error) {
    throw new Error(
      getErrorMessage(
        response.error,
        'The workout-generation function returned an error.'
      )
    );
  }

  const data = response.data;

  if (!data) {
    throw new Error(
      'The workout-generation function returned an empty response.'
    );
  }

  if (data.success === false) {
    throw new Error(
      getErrorMessage(
        data.error || data.message,
        'AI generation failed.'
      )
    );
  }

  if (data.error && data.success !== true) {
    throw new Error(
      getErrorMessage(
        data.error,
        'AI generation failed.'
      )
    );
  }

  return data.result ?? data;
}

function parsePositiveNumber(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  return number;
}

function parseInteger(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return null;
  }

  const number = Number.parseInt(value, 10);

  return Number.isFinite(number)
    ? number
    : null;
}

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

  const [goalDescription, setGoalDescription] =
    useState('');

  const [timeframe, setTimeframe] = useState('');
  const [equipment, setEquipment] = useState('');
  const [requirements, setRequirements] =
    useState('');

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] =
    useState('');

  const progressTimer = useRef(null);
  const generationStartedRef = useRef(false);

  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');

  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [heightCm, setHeightCm] = useState('');

  const [fitnessGoals, setFitnessGoals] =
    useState([]);

  const [currentSkills, setCurrentSkills] =
    useState('');

  const [gender, setGender] = useState('');

  const [weightGoals, setWeightGoals] =
    useState([]);

  const hasSkills =
    trainingType === 'calisthenics' ||
    trainingType === 'weighted_calisthenics' ||
    trainingType === 'hybrid';

  const hasWeightGoals =
    trainingType === 'weights' ||
    trainingType === 'hybrid';

  const handleCountryChange = useCallback(
    (code) => {
      setCountry(code);

      const defaults =
        getCountryDefaults(code);

      if (defaults) {
        setLanguage(
          defaults.language || 'English'
        );

        setUnit(
          defaults.unit || 'imperial'
        );
      }
    },
    []
  );

  const toggleGoal = useCallback((value) => {
    setFitnessGoals((previous) =>
      previous.includes(value)
        ? previous.filter(
            (goal) => goal !== value
          )
        : [...previous, value]
    );
  }, []);

  const toggleWeightGoal = useCallback(
    (value) => {
      setWeightGoals((previous) =>
        previous.includes(value)
          ? previous.filter(
              (goal) => goal !== value
            )
          : [...previous, value]
      );
    },
    []
  );

  /**
   * Keep the browser back button synchronized
   * with onboarding steps without creating a
   * new history entry every render.
   */
  useEffect(() => {
    const initialState = window.history.state;

    if (
      !initialState ||
      initialState.onboardingFlow !== true
    ) {
      window.history.replaceState(
        {
          ...initialState,
          onboardingFlow: true,
          onboardingStep: 0,
        },
        ''
      );
    }

    const handlePopState = (event) => {
      const browserStep =
        Number.isInteger(
          event.state?.onboardingStep
        )
          ? event.state.onboardingStep
          : Math.max(0, step - 1);

      setStep(
        Math.max(
          0,
          Math.min(
            TOTAL_STEPS - 1,
            browserStep
          )
        )
      );
    };

    window.addEventListener(
      'popstate',
      handlePopState
    );

    return () => {
      window.removeEventListener(
        'popstate',
        handlePopState
      );
    };
  }, [step]);

  useEffect(() => {
    return () => {
      if (progressTimer.current) {
        clearInterval(
          progressTimer.current
        );
      }
    };
  }, []);

  const goToStep = useCallback(
    (nextStep) => {
      if (loading) return;

      const safeStep = Math.max(
        0,
        Math.min(
          TOTAL_STEPS - 1,
          nextStep
        )
      );

      if (safeStep === step) return;

      window.history.pushState(
        {
          onboardingFlow: true,
          onboardingStep: safeStep,
        },
        ''
      );

      setStep(safeStep);

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    },
    [loading, step]
  );

  const runProgressTo = useCallback(
    (target) => {
      if (progressTimer.current) {
        clearInterval(
          progressTimer.current
        );
      }

      progressTimer.current =
        setInterval(() => {
          setProgress((current) => {
            if (current >= target) {
              if (progressTimer.current) {
                clearInterval(
                  progressTimer.current
                );
              }

              return target;
            }

            const remaining =
              target - current;

            const increment = Math.max(
              remaining * 0.04,
              0.1
            );

            return Math.min(
              current + increment,
              target
            );
          });
        }, 400);
    },
    []
  );

  const step3Valid = hasSkills
    ? Boolean(
        level &&
          (!hasWeightGoals ||
            weightGoals.length > 0)
      )
    : weightGoals.length > 0;

  const step4Valid =
    equipment.trim().length > 0 &&
    (!hasSkills ||
      goalDescription.trim().length >= 10);

  /**
   * Generate the complete program.
   *
   * Important fixes:
   * - Prevents double-click generation.
   * - Correctly handles Supabase invoke errors.
   * - Correctly handles metric weight.
   * - Correctly handles metric height.
   * - Validates every generated phase.
   * - Does not save an incomplete program.
   * - Clears progress timers on success/failure.
   */
  const handleGenerate = async () => {
    if (
      loading ||
      generationStartedRef.current
    ) {
      return;
    }

    if (!country) {
      toast.error(
        'Please select your country.'
      );
      goToStep(0);
      return;
    }

    if (!trainingType) {
      toast.error(
        'Please select your training type.'
      );
      goToStep(1);
      return;
    }

    if (!gender) {
      toast.error(
        'Please select your gender.'
      );
      goToStep(2);
      return;
    }

    if (
      hasSkills &&
      fitnessGoals.length === 0
    ) {
      toast.error(
        'Please select at least one goal.'
      );
      goToStep(2);
      return;
    }

    if (
      hasSkills &&
      !level
    ) {
      toast.error(
        'Please select your training level.'
      );
      goToStep(3);
      return;
    }

    if (
      hasWeightGoals &&
      weightGoals.length === 0
    ) {
      toast.error(
        'Please select at least one weight-training goal.'
      );
      goToStep(3);
      return;
    }

    if (!equipment.trim()) {
      toast.error(
        'Please enter your available equipment.'
      );
      return;
    }

    if (
      hasSkills &&
      goalDescription.trim().length < 10
    ) {
      toast.error(
        'Please describe your goals in a little more detail.'
      );
      return;
    }

    generationStartedRef.current = true;
    setLoading(true);
    setProgress(5);
    setLoadingPhase(
      'Connecting to your AI coach…'
    );

    try {
      updateSettings({
        country,
        language,
        unit,
      });

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          'No authenticated user found. Please sign in again.'
        );
      }

      /*
       * ------------------------------------------
       * NORMALIZE BODY MEASUREMENTS
       * ------------------------------------------
       */

      const parsedAge =
        parseInteger(age);

      const parsedWeight =
        parsePositiveNumber(weight);

      let weightKg = null;
      let weightLbs = null;

      if (
        parsedWeight !== null
      ) {
        if (unit === 'metric') {
          weightKg = parsedWeight;
          weightLbs =
            parsedWeight * 2.2046226218;
        } else {
          weightLbs = parsedWeight;
          weightKg =
            parsedWeight / 2.2046226218;
        }
      }

      let heightInches = null;
      let normalizedHeightCm = null;

      if (unit === 'imperial') {
        const feet =
          parsePositiveNumber(heightFt) ||
          0;

        const inches =
          parsePositiveNumber(heightIn) ||
          0;

        const totalInches =
          feet * 12 + inches;

        if (totalInches > 0) {
          heightInches = totalInches;
          normalizedHeightCm =
            totalInches * 2.54;
        }
      } else {
        const cm =
          parsePositiveNumber(heightCm);

        if (cm !== null) {
          normalizedHeightCm = cm;
          heightInches =
            cm / 2.54;
        }
      }

      /*
       * ------------------------------------------
       * SAVE USER PROFILE
       * ------------------------------------------
       */

      setLoadingPhase(
        'Saving your profile…'
      );

      const profileData = {
        id: user.id,

        first_name:
          firstName.trim(),

        last_name:
          lastName.trim(),

        training_type:
          trainingType,

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

        age: parsedAge,

        gender:
          gender || null,

        /*
         * Store the database's existing
         * weight_lbs field in pounds regardless
         * of the user's selected display unit.
         */
        weight_lbs:
          weightLbs,

        /*
         * Store height in both representations
         * so the profile remains normalized.
         */
        height_inches:
          heightInches,

        height_cm:
          normalizedHeightCm,

        country,
        language,
        unit,

        onboarded: true,
      };

      const {
        error: profileError,
      } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id',
        });

      if (profileError) {
        throw profileError;
      }

      /*
       * ------------------------------------------
       * PROMPT DATA
       * ------------------------------------------
       *
       * Keep the user's selected display values
       * for the AI prompt, while also supplying
       * normalized values where useful.
       */

      const promptData = {
        gender,
        level,

        age:
          parsedAge !== null
            ? String(parsedAge)
            : '',

        weightLbs:
          weightLbs !== null
            ? String(
                Number(weightLbs.toFixed(2))
              )
            : '',

        weightKg:
          weightKg !== null
            ? String(
                Number(weightKg.toFixed(2))
              )
            : '',

        heightFt,
        heightIn,
        heightCm,

        normalizedHeightCm:
          normalizedHeightCm !== null
            ? String(
                Number(
                  normalizedHeightCm.toFixed(1)
                )
              )
            : '',

        unit,

        currentSkills:
          currentSkills.trim(),

        goalDescription:
          goalDescription.trim(),

        timeframe:
          timeframe.trim(),

        equipment:
          equipment.trim(),

        requirements:
          requirements.trim(),

        fitnessGoals,
        weightGoals,
      };

      /*
       * ------------------------------------------
       * PHASE 1: PROGRAM STRUCTURE
       * ------------------------------------------
       */

      runProgressTo(25);

      setLoadingPhase(
        'Designing your program structure…'
      );

      const structurePrompt =
        buildStructurePrompt(
          trainingType,
          promptData
        );

      const structureResponse =
        await supabase.functions.invoke(
          'workout-generation',
          {
            body: {
              type: 'structure',
              prompt: structurePrompt,

              schema: {
                type: 'object',
                additionalProperties: false,

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
            },
          }
        );

      const structureResult =
        normalizeFunctionResponse(
          structureResponse
        );

      if (
        !structureResult ||
        typeof structureResult !==
          'object'
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

      /*
       * Validate that every phase has enough
       * information to generate a microcycle.
       */
      const invalidMesoIndex =
        mesocycles.findIndex(
          (meso) =>
            !meso ||
            typeof meso !== 'object'
        );

      if (invalidMesoIndex !== -1) {
        throw new Error(
          `AI returned an invalid training phase at phase ${
            invalidMesoIndex + 1
          }. Please try again.`
        );
      }

      /*
       * ------------------------------------------
       * PHASE 2: MICROCYCLES
       * ------------------------------------------
       */

      const allMicrocycles = [];

      for (
        let index = 0;
        index < mesocycles.length;
        index++
      ) {
        const meso =
          mesocycles[index];

        const target =
          25 +
          ((index + 1) /
            mesocycles.length) *
            65;

        runProgressTo(target);

        const phaseName =
          meso?.name ||
          `training phase ${index + 1}`;

        setLoadingPhase(
          `Building ${phaseName}…`
        );

        const microPrompt =
          buildMicrocyclePrompt(
            trainingType,
            promptData,
            index,
            meso
          );

        const microResponse =
          await supabase.functions.invoke(
            'workout-generation',
            {
              body: {
                type: 'microcycle',
                prompt: microPrompt,

                schema: {
                  type: 'object',
                  additionalProperties: false,

                  properties: {
                    microcycles: {
                      type: 'array',
                    },
                  },

                  required: [
                    'microcycles',
                  ],
                },
              },
            }
          );

        const microResult =
          normalizeFunctionResponse(
            microResponse
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
            `AI returned no workouts for ${phaseName}.`
          );
        }

        allMicrocycles.push(
          ...generatedMicrocycles
        );
      }

      if (!allMicrocycles.length) {
        throw new Error(
          'No workouts were generated. Please try again.'
        );
      }

      /*
       * ------------------------------------------
       * SAVE COMPLETE PROGRAM
       * ------------------------------------------
       */

      if (progressTimer.current) {
        clearInterval(
          progressTimer.current
        );
      }

      setProgress(95);

      setLoadingPhase(
        'Saving your personalized program…'
      );

      const programPayload = {
        user_id: user.id,

        ...structureResult,

        microcycles:
          allMicrocycles,

        training_type:
          trainingType,

        fitness_level:
          level || 'intermediate',

        goal:
          goalDescription.trim() ||
          weightGoals.join(', ') ||
          fitnessGoals.join(', '),

        current_week: 1,

        status: 'active',
      };

      const {
        data: savedProgram,
        error: programError,
      } = await supabase
        .from('workout_programs')
        .insert(programPayload)
        .select()
        .single();

      if (programError) {
        throw programError;
      }

      if (!savedProgram) {
        throw new Error(
          'The program was generated but could not be saved.'
        );
      }

      /*
       * ------------------------------------------
       * COMPLETE
       * ------------------------------------------
       */

      if (progressTimer.current) {
        clearInterval(
          progressTimer.current
        );
      }

      setProgress(100);

      setLoadingPhase(
        'Your program is ready!'
      );

      await queryClientInstance.invalidateQueries();

      toast.success(
        'Your personalized program is ready!'
      );

      setTimeout(() => {
        navigate('/', {
          replace: true,
        });
      }, 700);
    } catch (error) {
      console.error(
        '[ONBOARDING] PROGRAM GENERATION FAILED:',
        error
      );

      if (progressTimer.current) {
        clearInterval(
          progressTimer.current
        );
        progressTimer.current = null;
      }

      generationStartedRef.current = false;
      setLoading(false);
      setProgress(0);
      setLoadingPhase('');

      const message =
        getErrorMessage(
          error,
          'Failed to generate your program. Please try again.'
        );

      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">
      {/* Progress */}
      <div className="px-6 pt-4 pb-4">
        <div className="flex items-center gap-2 mb-2">
          {Array.from({
            length: TOTAL_STEPS,
          }).map((_, index) => (
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
        {/* =========================================
            STEP 0 — WELCOME
        ========================================= */}
        {step === 0 && (
          <motion.div
            key="welcome"
            initial={{
              opacity: 0,
              x: 50,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -50,
            }}
            className="flex-1 flex flex-col px-6 overflow-y-auto"
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
                    setFirstName(
                      event.target.value
                    )
                  }
                  className="h-14 text-lg rounded-2xl"
                  autoComplete="given-name"
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
                    setLastName(
                      event.target.value
                    )
                  }
                  className="h-14 text-lg rounded-2xl"
                  autoComplete="family-name"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium flex items-center gap-1.5">
                  <Globe className="w-3 h-3" />
                  Country
                </p>

                <CountrySelect
                  value={country}
                  onChange={
                    handleCountryChange
                  }
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
                  ].map(
                    ({
                      value,
                      label,
                    }) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() =>
                          setUnit(value)
                        }
                        className={cn(
                          'h-11 rounded-2xl border-2 text-sm font-semibold transition-all',
                          unit === value
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                        )}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <Button
              type="button"
              size="lg"
              className="w-full h-14 text-lg font-heading font-semibold mb-8 mt-6"
              disabled={
                !firstName.trim() ||
                !country
              }
              onClick={() =>
                goToStep(1)
              }
            >
              Get Started
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        )}

        {/* =========================================
            STEP 1 — TRAINING TYPE
        ========================================= */}
        {step === 1 && (
          <motion.div
            key="training-type"
            initial={{
              opacity: 0,
              x: 50,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -50,
            }}
            className="flex-1 flex flex-col px-6 overflow-y-auto"
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

            <div className="flex gap-3 mb-8 mt-6">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-14"
                onClick={() =>
                  goToStep(0)
                }
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <Button
                type="button"
                size="lg"
                className="flex-1 h-14 text-lg font-heading font-semibold"
                disabled={!trainingType}
                onClick={() =>
                  goToStep(2)
                }
              >
                Continue
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* =========================================
            STEP 2 — BODY STATS
        ========================================= */}
        {step === 2 && (
          <motion.div
            key="bodystats"
            initial={{
              opacity: 0,
              x: 50,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -50,
            }}
            className="flex-1 flex flex-col px-6 overflow-y-auto"
          >
            <h2 className="font-heading text-2xl font-bold mb-1">
              About You
            </h2>

            <p className="text-muted-foreground mb-6">
              Your stats help us personalize
              nutrition goals and training load.
            </p>

            <div className="space-y-4 flex-1">
              {/* Gender */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
                  Gender
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    'male',
                    'female',
                  ].map(
                    (genderOption) => (
                      <button
                        type="button"
                        key={genderOption}
                        onClick={() =>
                          setGender(
                            genderOption
                          )
                        }
                        className={cn(
                          'h-12 rounded-2xl border-2 font-semibold text-sm capitalize transition-all',
                          gender ===
                            genderOption
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                        )}
                      >
                        {genderOption ===
                        'male'
                          ? '♂ Male'
                          : '♀ Female'}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Age + Weight */}
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
                      setAge(
                        event.target.value
                      )
                    }
                    className="h-12 text-base"
                    inputMode="numeric"
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
                    min="1"
                    step="0.1"
                    placeholder={
                      unit === 'metric'
                        ? 'e.g. 80'
                        : 'e.g. 175'
                    }
                    value={weight}
                    onChange={(event) =>
                      setWeight(
                        event.target.value
                      )
                    }
                    className="h-12 text-base"
                    inputMode="decimal"
                  />
                </div>
              </div>

              {/* Height */}
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  Height
                </p>

                {unit === 'metric' ? (
                  <Input
                    type="number"
                    min="1"
                    step="0.1"
                    placeholder="Height in cm (e.g. 178)"
                    value={heightCm}
                    onChange={(event) =>
                      setHeightCm(
                        event.target.value
                      )
                    }
                    className="h-12 text-base"
                    inputMode="decimal"
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
                        setHeightFt(
                          event.target.value
                        )
                      }
                      className="h-12 text-base"
                      inputMode="numeric"
                    />

                    <Input
                      type="number"
                      min="0"
                      max="11"
                      placeholder="Inches (e.g. 10)"
                      value={heightIn}
                      onChange={(event) =>
                        setHeightIn(
                          event.target.value
                        )
                      }
                      className="h-12 text-base"
                      inputMode="numeric"
                    />
                  </div>
                )}
              </div>

              {/* Calisthenics goals */}
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
                          GOAL_ICONS[
                            iconName
                          ] ||
                          Dumbbell;

                        const selected =
                          fitnessGoals.includes(
                            value
                          );

                        return (
                          <button
                            type="button"
                            key={value}
                            onClick={() =>
                              toggleGoal(
                                value
                              )
                            }
                            aria-pressed={
                              selected
                            }
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

            <div className="flex gap-3 mb-8 mt-6">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-14"
                onClick={() =>
                  goToStep(1)
                }
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <Button
                type="button"
                size="lg"
                className="flex-1 h-14 text-lg font-heading font-semibold"
                disabled={
                  !gender ||
                  (hasSkills &&
                    fitnessGoals.length ===
                      0)
                }
                onClick={() =>
                  goToStep(3)
                }
              >
                Continue
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* =========================================
            STEP 3 — LEVEL / WEIGHT GOALS
        ========================================= */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{
              opacity: 0,
              x: 50,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -50,
            }}
            className="flex-1 flex flex-col px-6 overflow-y-auto"
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
                            setLevel(
                              value
                            )
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
                                level ===
                                  value
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

                        {level ===
                          value && (
                          <div className="mt-1.5 px-1">
                            <Textarea
                              value={
                                currentSkills
                              }
                              onChange={(
                                event
                              ) =>
                                setCurrentSkills(
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder={
                                placeholder
                              }
                              className="text-sm resize-none min-h-[72px] rounded-2xl border-primary/40 bg-primary/5 focus:border-primary leading-relaxed"
                            />

                            <p className="text-xs text-muted-foreground mt-1 pl-1">
                              What skills & moves can you currently do?
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
                            GOAL_ICONS[
                              iconName
                            ] ||
                            Dumbbell;

                          const selected =
                            weightGoals.includes(
                              value
                            );

                          return (
                            <button
                              type="button"
                              key={value}
                              onClick={() =>
                                toggleWeightGoal(
                                  value
                                )
                              }
                              aria-pressed={
                                selected
                              }
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
                  What do you want to achieve
                  with weight training,{' '}
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
                        GOAL_ICONS[
                          iconName
                        ] ||
                        Dumbbell;

                      const selected =
                        weightGoals.includes(
                          value
                        );

                      return (
                        <button
                          type="button"
                          key={value}
                          onClick={() =>
                            toggleWeightGoal(
                              value
                            )
                          }
                          aria-pressed={
                            selected
                          }
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

            <div className="flex gap-3 mb-8 mt-6">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-14"
                onClick={() =>
                  goToStep(2)
                }
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <Button
                type="button"
                size="lg"
                className="flex-1 h-14 text-lg font-heading font-semibold"
                disabled={!step3Valid}
                onClick={() =>
                  goToStep(4)
                }
              >
                Continue
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* =========================================
            STEP 4 — FINAL DETAILS
        ========================================= */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{
              opacity: 0,
              x: 50,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -50,
            }}
            className="flex-1 flex flex-col px-6 overflow-y-auto"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-primary" />

              <h2 className="font-heading text-2xl font-bold">
                {hasSkills
                  ? `Tell us your goals, ${
                      firstName || 'Athlete'
                    }`
                  : `Final details, ${
                      firstName || 'Athlete'
                    }`}
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
                      setGoalDescription(
                        event.target.value
                      )
                    }
                    placeholder='e.g. "I want to learn the muscle up and build a strong back. I can currently do 10 pull-ups and 15 dips. I want to improve my strength while taking care of my shoulders."'
                    className="min-h-[140px] text-sm resize-none bg-card border-border focus:border-primary rounded-2xl p-4 leading-relaxed"
                  />

                  <div className="bg-muted/50 rounded-2xl p-4 border border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      ⏱ Timeframe for your goals
                    </p>

                    <Textarea
                      value={timeframe}
                      onChange={(event) =>
                        setTimeframe(
                          event.target.value
                        )
                      }
                      placeholder='e.g. "Muscle up in 3 months, handstand in 6 months."'
                      className="min-h-[60px] text-sm resize-none bg-card border-border focus:border-primary rounded-xl p-3 leading-relaxed"
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
                      {weightGoals.join(
                        ', '
                      ) ||
                        'General fitness'}
                    </span>
                  </p>
                </div>
              )}

              <div className="bg-muted/50 rounded-2xl p-4 border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  🏋️ Available equipment{' '}
                  <span className="text-destructive">
                    *
                  </span>
                </p>

                <Textarea
                  value={equipment}
                  onChange={(event) =>
                    setEquipment(
                      event.target.value
                    )
                  }
                  placeholder={
                    hasSkills
                      ? 'e.g. "Pull-up bar, dip bars, resistance bands, gymnastic rings, parallettes."'
                      : 'e.g. "Full gym access: barbells, dumbbells, cables, machines, squat rack, bench."'
                  }
                  className="min-h-[70px] text-sm resize-none bg-card border-border focus:border-primary rounded-xl p-3 leading-relaxed"
                />

                <p className="text-[10px] text-muted-foreground mt-1.5">
                  List everything you have
                  access to — this is required.
                </p>
              </div>

              <div className="bg-muted/50 rounded-2xl p-4 border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  📝 Requirements & Notes
                </p>

                <Textarea
                  value={requirements}
                  onChange={(event) =>
                    setRequirements(
                      event.target.value
                    )
                  }
                  placeholder='e.g. "I can train 4 days a week, about 60 min per session. I want to focus on my chest and shoulders."'
                  className="min-h-[80px] text-sm resize-none bg-card border-border focus:border-primary rounded-xl p-3 leading-relaxed"
                />

                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Time available, limitations,
                  areas to focus on, and anything
                  else that helps personalize your
                  program.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mb-8 mt-6">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-14"
                disabled={loading}
                onClick={() =>
                  goToStep(3)
                }
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <Button
                type="button"
                size="lg"
                className="flex-1 h-14 text-lg font-heading font-semibold"
                disabled={
                  loading ||
                  !step4Valid
                }
                onClick={
                  handleGenerate
                }
              >
                {loading ? (
                  <div className="flex items-center gap-3 w-full justify-center">
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />

                    <span className="truncate">
                      {loadingPhase ||
                        'Building your program…'}{' '}
                      {Math.round(
                        progress
                      )}
                      %
                    </span>
                  </div>
                ) : (
                  <>
                    Build My Program
                    <Sparkles className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </div>

            {loading && (
              <div className="mb-6 space-y-2">
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          progress
                        )
                      )}%`,
                    }}
                  />
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  {loadingPhase ||
                    'Building your program…'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
