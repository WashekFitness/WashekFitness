import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { queryClientInstance } from '@/lib/query-client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

import {
  motion,
  AnimatePresence,
} from 'framer-motion';

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


/* ==========================================================================
   LEVELS
   ========================================================================== */

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


/* ==========================================================================
   GOAL ICONS
   ========================================================================== */

const GOAL_ICONS = {
  Dumbbell,
  Scale,
  Trophy,
  Wind,
  Target,
  PersonStanding,
  Sparkles,
};


/* ==========================================================================
   SEARCH SELECT
   ========================================================================== */

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
      option
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .slice(0, 200);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          setSearch('');
        }}
        className="
          w-full
          h-12
          px-4
          rounded-2xl
          border-2
          border-border
          bg-card
          text-sm
          text-left
          flex
          items-center
          justify-between
          hover:border-muted-foreground/30
          transition-all
        "
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
        <div
          className="
            absolute
            z-50
            top-full
            mt-1
            w-full
            bg-card
            border
            border-border
            rounded-2xl
            shadow-2xl
            overflow-hidden
          "
        >
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search..."
              className="
                w-full
                h-9
                px-3
                text-sm
                bg-muted
                rounded-xl
                outline-none
                placeholder:text-muted-foreground
              "
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


/* ==========================================================================
   COUNTRY SELECT
   ========================================================================== */

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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          setSearch('');
        }}
        className="
          w-full
          h-12
          px-4
          rounded-2xl
          border-2
          border-border
          bg-card
          text-sm
          text-left
          flex
          items-center
          justify-between
          hover:border-muted-foreground/30
          transition-all
        "
      >
        <span
          className={
            selected
              ? 'text-foreground'
              : 'text-muted-foreground'
          }
        >
          {selected?.name ||
            'Select your country…'}
        </span>

        <span className="text-muted-foreground text-xs">
          ▾
        </span>
      </button>

      {open && (
        <div
          className="
            absolute
            z-50
            top-full
            mt-1
            w-full
            bg-card
            border
            border-border
            rounded-2xl
            shadow-2xl
            overflow-hidden
          "
        >
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search country..."
              className="
                w-full
                h-9
                px-3
                text-sm
                bg-muted
                rounded-xl
                outline-none
                placeholder:text-muted-foreground
              "
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


/* ==========================================================================
   ONBOARDING
   ========================================================================== */

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateSettings } = useAppSettings();

  const [step, setStep] = useState(0);

  /* Profile */
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('English');
  const [unit, setUnit] = useState('imperial');

  /* Training */
  const [trainingType, setTrainingType] = useState('');
  const [level, setLevel] = useState('');

  /* Goals */
  const [goalDescription, setGoalDescription] =
    useState('');

  const [timeframe, setTimeframe] =
    useState('');

  /* Equipment */
  const [equipment, setEquipment] =
    useState('');

  const [requirements, setRequirements] =
    useState('');

  /* Body */
  const [age, setAge] = useState('');
  const [weightLbs, setWeightLbs] =
    useState('');

  const [heightFt, setHeightFt] =
    useState('');

  const [heightIn, setHeightIn] =
    useState('');

  const [gender, setGender] =
    useState('');

  /* Fitness */
  const [fitnessGoals, setFitnessGoals] =
    useState([]);

  const [currentSkills, setCurrentSkills] =
    useState('');

  const [weightGoals, setWeightGoals] =
    useState([]);

  /* Generation */
  const [loading, setLoading] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [loadingPhase, setLoadingPhase] =
    useState('');

  const progressTimer =
    useRef(null);


  /* ==========================================================================
     CLEANUP
     ========================================================================== */

  useEffect(() => {
    return () => {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
      }
    };
  }, []);


  /* ==========================================================================
     COUNTRY
     ========================================================================== */

  const handleCountryChange = (code) => {
    setCountry(code);

    const defaults =
      getCountryDefaults(code);

    if (defaults) {
      setLanguage(defaults.language);
      setUnit(defaults.unit);
    }
  };


  /* ==========================================================================
     GOALS
     ========================================================================== */

  const toggleGoal = (value) => {
    setFitnessGoals((previous) =>
      previous.includes(value)
        ? previous.filter(
            (goal) => goal !== value
          )
        : [...previous, value]
    );
  };

  const toggleWeightGoal = (value) => {
    setWeightGoals((previous) =>
      previous.includes(value)
        ? previous.filter(
            (goal) => goal !== value
          )
        : [...previous, value]
    );
  };


  /* ==========================================================================
     TRAINING FLAGS
     ========================================================================== */

  const hasSkills =
    trainingType === 'calisthenics' ||
    trainingType === 'weighted_calisthenics' ||
    trainingType === 'hybrid';

  const hasWeightGoals =
    trainingType === 'weights' ||
    trainingType === 'hybrid';


  /* ==========================================================================
     IOS / BROWSER BACK HANDLING
     ========================================================================== */

  useEffect(() => {
    if (step === 0) return;

    window.history.pushState(
      { onboardingStep: step },
      ''
    );

    const handlePopState = () => {
      setStep((current) =>
        Math.max(0, current - 1)
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


  /* ==========================================================================
     PROGRESS
     ========================================================================== */

  const runProgressTo = (target) => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
    }

    progressTimer.current =
      setInterval(() => {
        setProgress((current) => {
          if (current >= target - 0.5) {
            return current;
          }

          const remaining =
            target - current;

          return Math.min(
            current +
              Math.max(
                remaining * 0.04,
                0.1
              ),
            target - 0.5
          );
        });
      }, 400);
  };


  /* ==========================================================================
     AI RESPONSE HELPER
     ========================================================================== */

  const extractAIResult = (response) => {
    if (!response) {
      throw new Error(
        'No response received from workout-generation.'
      );
    }

    if (response.error) {
      throw response.error;
    }

    const data = response.data;

    if (!data) {
      throw new Error(
        'workout-generation returned no data.'
      );
    }

    /*
     * Support the existing response format:
     *
     * {
     *   result: {...}
     * }
     *
     * while also allowing the edge function to return:
     *
     * {
     *   data: {...}
     * }
     */
    const result =
      data.result ??
      data.data ??
      data;

    if (!result) {
      throw new Error(
        'workout-generation returned an empty AI result.'
      );
    }

    return result;
  };


  /* ==========================================================================
     GENERATE PROGRAM
     ========================================================================== */

  const handleGenerate = async () => {
    if (loading) return;

    setLoading(true);
    setProgress(5);
    setLoadingPhase(
      'Saving your profile…'
    );

    updateSettings({
      country,
      language,
      unit,
    });

    const heightInches =
      (parseInt(heightFt, 10) || 0) * 12 +
      (parseInt(heightIn, 10) || 0);

    try {
      /* --------------------------------------------------------------
         AUTH USER
         -------------------------------------------------------------- */

      const {
        data: authData,
        error: userError,
      } = await supabase.auth.getUser();

      const user = authData?.user;

      if (userError || !user) {
        throw new Error(
          'No authenticated user found.'
        );
      }


      /* --------------------------------------------------------------
         PROFILE
         -------------------------------------------------------------- */

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

        age:
          parseInt(age, 10) || null,

        gender:
          gender || null,

        weight_lbs:
          unit === 'imperial'
            ? parseFloat(weightLbs) || null
            : null,

        height_inches:
          unit === 'imperial'
            ? heightInches || null
            : null,

        /*
         * IMPORTANT:
         * Your existing field names are preserved.
         */
        height_cm:
          unit === 'metric'
            ? parseFloat(heightFt) || null
            : null,

        country,
        language,
        unit,

        /*
         * This is what App.jsx checks.
         */
        onboarded: true,
      };


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

      if (profileError) {
        throw profileError;
      }


      /* --------------------------------------------------------------
         AI PROMPT DATA
         -------------------------------------------------------------- */

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


      /* ==============================================================
         PHASE 1
         PROGRAM STRUCTURE
         ============================================================== */

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

                properties: {
                  program_name: {
                    type: 'string',
                  },

                  duration_weeks: {
                    type: 'number',
                  },

                  macrocycle: {
                    type: 'object',
                  },

                  mesocycles: {
                    type: 'array',
                  },
                },

                required: [
                  'program_name',
                  'duration_weeks',
                  'mesocycles',
                ],
              },
            },
          }
        );


      const structureResult =
        extractAIResult(
          structureResponse
        );


      if (
        !structureResult.mesocycles ||
        !Array.isArray(
          structureResult.mesocycles
        )
      ) {
        throw new Error(
          'AI returned an invalid program structure. No mesocycles were found.'
        );
      }


      /* ==============================================================
         PHASE 2
         MICROCYCLES
         ============================================================== */

      const mesocycles =
        structureResult.mesocycles;

      const allMicrocycles = [];


      for (
        let i = 0;
        i < mesocycles.length;
        i++
      ) {
        const meso =
          mesocycles[i];

        const percentage =
          25 +
          ((i + 1) /
            mesocycles.length) *
            65;

        runProgressTo(
          percentage
        );

        setLoadingPhase(
          `Building ${
            meso?.name ||
            `training phase ${i + 1}`
          }…`
        );


        const microPrompt =
          buildMicrocyclePrompt(
            trainingType,
            promptData,
            i,
            meso
          );


        const microResponse =
          await supabase.functions.invoke(
            'workout-generation',
            {
              body: {
                type: 'microcycle',

                prompt:
                  microPrompt,

                schema: {
                  type: 'object',

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
          extractAIResult(
            microResponse
          );


        if (
          !Array.isArray(
            microResult.microcycles
          )
        ) {
          throw new Error(
            `AI returned an invalid microcycle response for phase ${
              i + 1
            }.`
          );
        }


        allMicrocycles.push(
          ...microResult.microcycles
        );
      }


      /* ==============================================================
         SAVE PROGRAM
         ============================================================== */

      if (progressTimer.current) {
        clearInterval(
          progressTimer.current
        );
      }

      setProgress(95);

      setLoadingPhase(
        'Saving your program…'
      );


      const programData = {
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
        error: programError,
      } = await supabase
        .from('workout_programs')
        .insert(
          programData
        );


      if (programError) {
        throw programError;
      }


      /* ==============================================================
         COMPLETE
         ============================================================== */

      setProgress(100);

      setLoadingPhase(
        'Your program is ready!'
      );


      /*
       * Refresh all cached application data.
       */
      await queryClientInstance.invalidateQueries();


      /*
       * Small delay lets the 100% state render before navigation.
       */
      setTimeout(() => {
        navigate('/', {
          replace: true,
        });
      }, 600);


    } catch (error) {
      console.error(
        'ONBOARDING / AI GENERATION ERROR:',
        error
      );

      if (progressTimer.current) {
        clearInterval(
          progressTimer.current
        );
      }

      setLoading(false);
      setProgress(0);
      setLoadingPhase('');

      const message =
        error?.message ||
        'Failed to generate your program.';

      toast.error(
        message
      );
    }
  };


  /* ==========================================================================
     VALIDATION
     ========================================================================== */

  const step3Valid = hasSkills
    ? Boolean(
        level &&
        (!hasWeightGoals ||
          weightGoals.length > 0)
      )
    : weightGoals.length > 0;


  const step4Valid = hasSkills
    ? goalDescription.trim().length >= 10 &&
      equipment.trim().length > 0
    : equipment.trim().length > 0;


  /* ==========================================================================
     RENDER
     ========================================================================== */

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">

      {/* ================================================================
          PROGRESS STEPS
          ================================================================ */}

      <div className="px-6 pt-4 pb-4">
        <div className="flex items-center gap-2 mb-2">
          {[0, 1, 2, 3, 4].map(
            (index) => (
              <div
                key={index}
                className={cn(
                  'h-1 rounded-full flex-1 transition-all duration-500',
                  index <= step
                    ? 'bg-primary'
                    : 'bg-muted'
                )}
              />
            )
          )}
        </div>
      </div>


      <AnimatePresence mode="wait">

        {/* ==============================================================
            STEP 0 — WELCOME
            ============================================================== */}

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
                <div className="
                  w-32
                  h-32
                  rounded-full
                  bg-primary/10
                  flex
                  items-center
                  justify-center
                  border
                  border-primary/20
                ">
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
                />
              </div>


              <div>
                <p className="
                  text-xs
                  text-muted-foreground
                  mb-1
                  font-medium
                  flex
                  items-center
                  gap-1.5
                ">
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
              size="lg"
              className="
                w-full
                h-14
                text-lg
                font-heading
                font-semibold
                mb-8
                mt-4
              "
              disabled={
                !firstName.trim() ||
                !country
              }
              onClick={() =>
                setStep(1)
              }
            >
              Get Started
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>

          </motion.div>
        )}


        {/* ==============================================================
            STEP 1 — TRAINING TYPE
            ============================================================== */}

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
            className="flex-1 flex flex-col px-6"
          >

            <h2 className="font-heading text-2xl font-bold mb-1">
              Choose Your Path
            </h2>

            <p className="text-muted-foreground mb-6">
              What type of training are you here for,{' '}
              {firstName || 'Athlete'}?
            </p>


            <div className="flex-1">
              <TrainingTypeSelect
                value={trainingType}
                onChange={
                  setTrainingType
                }
              />
            </div>


            <div className="flex gap-3 mb-8 mt-4">

              <Button
                variant="outline"
                size="lg"
                className="h-14"
                onClick={() =>
                  setStep(0)
                }
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>


              <Button
                size="lg"
                className="
                  flex-1
                  h-14
                  text-lg
                  font-heading
                  font-semibold
                "
                disabled={!trainingType}
                onClick={() =>
                  setStep(2)
                }
              >
                Continue
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>

            </div>

          </motion.div>
        )}


        {/* ==============================================================
            STEP 2 — BODY STATS
            ============================================================== */}

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
            className="flex-1 flex flex-col px-6"
          >

            <h2 className="font-heading text-2xl font-bold mb-1">
              About You
            </h2>

            <p className="text-muted-foreground mb-6">
              Your stats help us personalize nutrition goals and training load.
            </p>


            <div className="space-y-4 flex-1">

              {/* Gender */}

              <div>
                <p className="
                  text-xs
                  text-muted-foreground
                  mb-2
                  font-medium
                  uppercase
                  tracking-wider
                ">
                  Gender
                </p>

                <div className="grid grid-cols-2 gap-3">

                  {[
                    'male',
                    'female',
                  ].map(
                    (genderValue) => (
                      <button
                        type="button"
                        key={genderValue}
                        onClick={() =>
                          setGender(
                            genderValue
                          )
                        }
                        className={cn(
                          'h-12 rounded-2xl border-2 font-semibold text-sm capitalize transition-all',
                          gender ===
                            genderValue
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                        )}
                      >
                        {genderValue ===
                        'male'
                          ? '♂ Male'
                          : '♀ Female'}
                      </button>
                    )
                  )}

                </div>
              </div>


              {/* Age / Weight */}

              <div className="grid grid-cols-2 gap-3">

                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium">
                    Age
                  </p>

                  <Input
                    type="number"
                    placeholder="e.g. 24"
                    value={age}
                    onChange={(event) =>
                      setAge(
                        event.target.value
                      )
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
                    placeholder={
                      unit === 'metric'
                        ? 'e.g. 80'
                        : 'e.g. 175'
                    }
                    value={weightLbs}
                    onChange={(event) =>
                      setWeightLbs(
                        event.target.value
                      )
                    }
                    className="h-12 text-base"
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
                    placeholder="Height in cm (e.g. 178)"
                    value={heightFt}
                    onChange={(event) =>
                      setHeightFt(
                        event.target.value
                      )
                    }
                    className="h-12 text-base"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">

                    <Input
                      type="number"
                      placeholder="Feet (e.g. 5)"
                      value={heightFt}
                      onChange={(event) =>
                        setHeightFt(
                          event.target.value
                        )
                      }
                      className="h-12 text-base"
                    />

                    <Input
                      type="number"
                      placeholder="Inches (e.g. 10)"
                      value={heightIn}
                      onChange={(event) =>
                        setHeightIn(
                          event.target.value
                        )
                      }
                      className="h-12 text-base"
                    />

                  </div>
                )}
              </div>


              {/* Fitness goals */}

              {hasSkills && (
                <div>
                  <p className="
                    text-xs
                    text-muted-foreground
                    mb-2
                    font-medium
                    uppercase
                    tracking-wider
                  ">
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

                        return (
                          <button
                            type="button"
                            key={value}
                            onClick={() =>
                              toggleGoal(
                                value
                              )
                            }
                            aria-pressed={fitnessGoals.includes(
                              value
                            )}
                            className={cn(
                              'flex items-center gap-2 p-3 rounded-2xl border-2 text-left transition-all',
                              fitnessGoals.includes(
                                value
                              )
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

              <Button
                variant="outline"
                size="lg"
                className="h-14"
                onClick={() =>
                  setStep(1)
                }
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>


              <Button
                size="lg"
                className="
                  flex-1
                  h-14
                  text-lg
                  font-heading
                  font-semibold
                "
                disabled={
                  !gender ||
                  (hasSkills &&
                    fitnessGoals.length ===
                      0)
                }
                onClick={() =>
                  setStep(3)
                }
              >
                Continue
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>

            </div>

          </motion.div>
        )}


        {/* ==============================================================
            STEP 3
            ============================================================== */}

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
                              className="
                                text-sm
                                resize-none
                                min-h-[72px]
                                rounded-2xl
                                border-primary/40
                                bg-primary/5
                                focus:border-primary
                                leading-relaxed
                              "
                              onClick={(
                                event
                              ) =>
                                event.stopPropagation()
                              }
                            />

                            <p className="
                              text-xs
                              text-muted-foreground
                              mt-1
                              pl-1
                            ">
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

                    <p className="
                      text-xs
                      text-muted-foreground
                      mb-2
                      font-medium
                      uppercase
                      tracking-wider
                    ">
                      Weight Training Goals (select all that apply)
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

                          return (
                            <button
                              type="button"
                              key={value}
                              onClick={() =>
                                toggleWeightGoal(
                                  value
                                )
                              }
                              aria-pressed={weightGoals.includes(
                                value
                              )}
                              className={cn(
                                'flex items-center gap-2 p-3 rounded-2xl border-2 text-left transition-all',
                                weightGoals.includes(
                                  value
                                )
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
                  What do you want to achieve with weight training,{' '}
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

                      return (
                        <button
                          type="button"
                          key={value}
                          onClick={() =>
                            toggleWeightGoal(
                              value
                            )
                          }
                          aria-pressed={weightGoals.includes(
                            value
                          )}
                          className={cn(
                            'flex items-center gap-2 p-4 rounded-2xl border-2 text-left transition-all',
                            weightGoals.includes(
                              value
                            )
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

              <Button
                variant="outline"
                size="lg"
                className="h-14"
                onClick={() =>
                  setStep(2)
                }
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>


              <Button
                size="lg"
                className="
                  flex-1
                  h-14
                  text-lg
                  font-heading
                  font-semibold
                "
                disabled={!step3Valid}
                onClick={() =>
                  setStep(4)
                }
              >
                Continue
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>

            </div>

          </motion.div>
        )}


        {/* ==============================================================
            STEP 4 — FINAL DETAILS
            ============================================================== */}

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
            className="flex-1 flex flex-col px-6"
          >

            <div className="flex items-center gap-2 mb-1">

              <Sparkles className="w-5 h-5 text-primary" />

              <h2 className="font-heading text-2xl font-bold">
                {hasSkills
                  ? `Tell us your goals, ${
                      firstName ||
                      'Athlete'
                    }`
                  : `Final details, ${
                      firstName ||
                      'Athlete'
                    }`}
              </h2>

            </div>


            <p className="text-muted-foreground mb-4">
              {hasSkills
                ? 'Describe your goals, what you want to achieve, and any limitations. The more detail you give, the more personalized your program will be.'
                : 'List your available equipment and any requirements. This helps us build the perfect program for you.'}
            </p>


            <div className="flex-1 flex flex-col gap-3">

              {/* Calisthenics goals */}

              {hasSkills && (
                <>

                  <Textarea
                    value={
                      goalDescription
                    }
                    onChange={(event) =>
                      setGoalDescription(
                        event.target.value
                      )
                    }
                    placeholder={`e.g. "I want to learn the muscle up and build a strong back. I can currently do 10 pull-ups and 15 dips. I had a shoulder injury last year so I want to take it slow on pressing movements."`}
                    className="
                      min-h-[140px]
                      text-sm
                      resize-none
                      bg-card
                      border-border
                      focus:border-primary
                      rounded-2xl
                      p-4
                      leading-relaxed
                    "
                  />


                  <div className="
                    bg-muted/50
                    rounded-2xl
                    p-4
                    border
                    border-border
                  ">

                    <p className="
                      text-xs
                      font-semibold
                      text-muted-foreground
                      uppercase
                      tracking-wider
                      mb-2
                    ">
                      ⏱ Timeframe for your goals
                    </p>

                    <Textarea
                      value={timeframe}
                      onChange={(event) =>
                        setTimeframe(
                          event.target.value
                        )
                      }
                      placeholder={`e.g. "Muscle up in 3 months, handstand in 6 months."`}
                      className="
                        min-h-[60px]
                        text-sm
                        resize-none
                        bg-card
                        border-border
                        focus:border-primary
                        rounded-xl
                        p-3
                        leading-relaxed
                      "
                    />

                  </div>

                </>
              )}


              {/* Weight goals */}

              {!hasSkills && (
                <div className="
                  bg-muted/50
                  rounded-2xl
                  p-4
                  border
                  border-border
                ">

                  <p className="
                    text-xs
                    font-semibold
                    text-muted-foreground
                    uppercase
                    tracking-wider
                    mb-2
                  ">
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


              {/* Equipment */}

              <div className="
                bg-muted/50
                rounded-2xl
                p-4
                border
                border-border
              ">

                <p className="
                  text-xs
                  font-semibold
                  text-muted-foreground
                  uppercase
                  tracking-wider
                  mb-2
                ">
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
                      ? `e.g. "Pull-up bar, dip bars, resistance bands, gymnastic rings, parallettes."`
                      : `e.g. "Full gym access: barbells, dumbbells, cables, machines, squat rack, bench." or "Home gym: dumbbells up to 50lbs, bench, pull-up bar."`
                  }
                  className="
                    min-h-[70px]
                    text-sm
                    resize-none
                    bg-card
                    border-border
                    focus:border-primary
                    rounded-xl
                    p-3
                    leading-relaxed
                  "
                />

                <p className="text-[10px] text-muted-foreground mt-1.5">
                  List everything you have access to — this is required.
                </p>

              </div>


              {/* Requirements */}

              <div className="
                bg-muted/50
                rounded-2xl
                p-4
                border
                border-border
              ">

                <p className="
                  text-xs
                  font-semibold
                  text-muted-foreground
                  uppercase
                  tracking-wider
                  mb-2
                ">
                  📝 Requirements & Notes
                </p>

                <Textarea
                  value={requirements}
                  onChange={(event) =>
                    setRequirements(
                      event.target.value
                    )
                  }
                  placeholder={`e.g. "I can train 4 days a week, about 60 min per session. I have a history of lower back pain so I want to be careful with heavy deadlifts. I also want to focus on my chest since it's lagging."`}
                  className="
                    min-h-[80px]
                    text-sm
                    resize-none
                    bg-card
                    border-border
                    focus:border-primary
                    rounded-xl
                    p-3
                    leading-relaxed
                  "
                />

                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Time available, injuries, limitations, areas to focus on — anything that helps us make your program perfect.
                </p>

              </div>

            </div>


            {/* Buttons */}

            <div className="flex gap-3 mb-8 mt-4">

              <Button
                variant="outline"
                size="lg"
                className="h-14"
                disabled={loading}
                onClick={() =>
                  setStep(3)
                }
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>


              <Button
                size="lg"
                className="
                  flex-1
                  h-14
                  text-lg
                  font-heading
                  font-semibold
                "
                disabled={
                  !step4Valid ||
                  loading
                }
                onClick={
                  handleGenerate
                }
              >

                {loading ? (
                  <div className="flex items-center gap-3">

                    <div className="
                      w-5
                      h-5
                      border-2
                      border-primary-foreground
                      border-t-transparent
                      rounded-full
                      animate-spin
                    " />

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


            {/* Generation progress */}

            {loading && (
              <div className="mb-6 space-y-2">

                <div className="
                  w-full
                  h-1.5
                  bg-muted
                  rounded-full
                  overflow-hidden
                ">
                  <div
                    className="
                      h-full
                      bg-primary
                      rounded-full
                      transition-all
                      duration-500
                      ease-out
                    "
                    style={{
                      width: `${progress}%`,
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
