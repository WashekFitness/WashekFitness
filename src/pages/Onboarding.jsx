import { useState, useRef, useEffect } from 'react';
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


/* ============================================================
   CONSTANTS
============================================================ */

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
   SEARCH SELECT
============================================================ */

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

  return (
    <div className="relative">
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


/* ============================================================
   COUNTRY SELECT
============================================================ */

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
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search country..."
              className="w-full h-9 px-3 text-sm bg-muted rounded-xl outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            {filtered.map((countryItem) => (
              <button
                type="button"
                key={countryItem.code}
                onClick={() => {
                  onChange(countryItem.code);
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'w-full px-4 py-2.5 text-sm text-left hover:bg-muted/80 transition-all',
                  countryItem.code === value &&
                    'bg-primary/10 text-primary font-semibold'
                )}
              >
                {countryItem.name}
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
   AI RESPONSE HELPERS
============================================================ */

/**
 * Supabase Edge Functions can return:
 *
 * { data: { result: {...} }, error: null }
 *
 * or sometimes:
 *
 * { data: {...}, error: null }
 *
 * This helper safely extracts the actual AI result.
 */
function extractAIResult(response) {
  if (!response) {
    throw new Error('Empty AI response.');
  }

  if (response.error) {
    throw response.error;
  }

  const data = response.data;

  if (!data) {
    throw new Error('AI function returned no data.');
  }

  if (data.error) {
    throw new Error(
      typeof data.error === 'string'
        ? data.error
        : 'AI function returned an error.'
    );
  }

  if (data.result) {
    return data.result;
  }

  if (data.data?.result) {
    return data.data.result;
  }

  if (data.data) {
    return data.data;
  }

  return data;
}


/**
 * Calls the actual Supabase AI Edge Function.
 *
 * Keeping this in one place makes the AI connection
 * consistent throughout onboarding.
 */
async function callWorkoutAI({
  type,
  prompt,
  schema,
}) {
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

  return extractAIResult(response);
}


/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function Onboarding() {
  const navigate = useNavigate();

  const {
    updateSettings,
  } = useAppSettings();

  const [step, setStep] = useState(0);

  /* Identity */
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  /* Locale */
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
  const [weightLbs, setWeightLbs] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [gender, setGender] = useState('');

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


  /* ==========================================================
     DERIVED STATE
  ========================================================== */

  const hasSkills =
    trainingType === 'calisthenics' ||
    trainingType === 'weighted_calisthenics' ||
    trainingType === 'hybrid';

  const hasWeightGoals =
    trainingType === 'weights' ||
    trainingType === 'hybrid';


  /* ==========================================================
     CLEANUP
  ========================================================== */

  useEffect(() => {
    return () => {
      clearInterval(progressTimer.current);
    };
  }, []);


  /* ==========================================================
     BROWSER / IOS BACK BUTTON
  ========================================================== */

  useEffect(() => {
    if (step === 0) {
      return;
    }

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


  /* ==========================================================
     COUNTRY
  ========================================================== */

  const handleCountryChange = (code) => {
    setCountry(code);

    const defaults =
      getCountryDefaults(code);

    setLanguage(defaults.language);
    setUnit(defaults.unit);
  };


  /* ==========================================================
     GOAL TOGGLES
  ========================================================== */

  const toggleGoal = (value) => {
    setFitnessGoals((current) =>
      current.includes(value)
        ? current.filter(
            (goal) => goal !== value
          )
        : [...current, value]
    );
  };

  const toggleWeightGoal = (value) => {
    setWeightGoals((current) =>
      current.includes(value)
        ? current.filter(
            (goal) => goal !== value
          )
        : [...current, value]
    );
  };


  /* ==========================================================
     PROGRESS
  ========================================================== */

  const runProgressTo = (target) => {
    clearInterval(progressTimer.current);

    progressTimer.current =
      setInterval(() => {
        setProgress((current) => {
          if (
            current >=
            target - 0.5
          ) {
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


  /* ==========================================================
     VALIDATION
  ========================================================== */

  const step3Valid = hasSkills
    ? level &&
      (!hasWeightGoals ||
        weightGoals.length > 0)
    : weightGoals.length > 0;

  const step4Valid = hasSkills
    ? goalDescription.trim().length >= 10 &&
      equipment.trim().length > 0
    : equipment.trim().length > 0;


  /* ==========================================================
     GENERATE COMPLETE PROGRAM
  ========================================================== */

  const handleGenerate = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setProgress(5);
    setLoadingPhase(
      'Saving your profile…'
    );

    clearInterval(
      progressTimer.current
    );

    try {
      /* ------------------------------------------------------
         AUTHENTICATED USER
      ------------------------------------------------------ */

      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth.getUser();

      if (
        authError ||
        !authData?.user
      ) {
        throw new Error(
          'No authenticated user found. Please sign in again.'
        );
      }

      const user =
        authData.user;


      /* ------------------------------------------------------
         LOCALE SETTINGS
      ------------------------------------------------------ */

      updateSettings({
        country,
        language,
        unit,
      });


      /* ------------------------------------------------------
         HEIGHT
      ------------------------------------------------------ */

      let heightInches = null;
      let heightCm = null;

      if (unit === 'metric') {
        const cm =
          parseFloat(heightFt);

        if (
          Number.isFinite(cm) &&
          cm > 0
        ) {
          heightCm = cm;
        }
      } else {
        const feet =
          parseInt(heightFt, 10) || 0;

        const inches =
          parseInt(heightIn, 10) || 0;

        const total =
          feet * 12 + inches;

        if (total > 0) {
          heightInches = total;
        }
      }


      /* ------------------------------------------------------
         NUMERIC VALUES
      ------------------------------------------------------ */

      const parsedAge =
        parseInt(age, 10);

      const parsedWeight =
        parseFloat(weightLbs);


      /* ------------------------------------------------------
         PROFILE
      ------------------------------------------------------ */

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
          Number.isFinite(parsedAge)
            ? parsedAge
            : null,

        gender:
          gender || null,

        weight_lbs:
          Number.isFinite(parsedWeight)
            ? parsedWeight
            : null,

        height_inches:
          heightInches,

        height_cm:
          heightCm,

        country:
          country || null,

        language:
          language || 'English',

        unit:
          unit || 'imperial',

        onboarded:
          true,

        updated_at:
          new Date().toISOString(),
      };


      const {
        error: profileError,
      } =
        await supabase
          .from('profiles')
          .upsert(
            profileData,
            {
              onConflict: 'id',
            }
          );

      if (profileError) {
        throw new Error(
          `Unable to save profile: ${profileError.message}`
        );
      }


      /* ------------------------------------------------------
         AI PROMPT DATA
      ------------------------------------------------------ */

      const promptData = {
        firstName:
          firstName.trim(),

        lastName:
          lastName.trim(),

        gender,

        level:
          level || 'intermediate',

        age,

        weightLbs,

        heightFt,

        heightIn,

        unit,

        trainingType,

        currentSkills,

        goalDescription,

        timeframe,

        equipment,

        requirements,

        fitnessGoals,

        weightGoals,

        country,

        language,
      };


      /* ======================================================
         AI PHASE 1
         PROGRAM STRUCTURE
      ====================================================== */

      runProgressTo(25);

      setLoadingPhase(
        'Connecting to your AI coach…'
      );


      const structurePrompt =
        buildStructurePrompt(
          trainingType,
          promptData
        );


      if (
        !structurePrompt ||
        structurePrompt.trim().length === 0
      ) {
        throw new Error(
          'The AI program prompt could not be created.'
        );
      }


      setLoadingPhase(
        'Designing your program structure…'
      );


      const structureResult =
        await callWorkoutAI({
          type: 'structure',

          prompt:
            structurePrompt,

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
        });


      if (
        !structureResult ||
        typeof structureResult !==
          'object'
      ) {
        throw new Error(
          'The AI returned an invalid program structure.'
        );
      }


      const mesocycles =
        Array.isArray(
          structureResult.mesocycles
        )
          ? structureResult.mesocycles
          : [];


      if (mesocycles.length === 0) {
        throw new Error(
          'The AI did not create any training phases.'
        );
      }


      /* ======================================================
         AI PHASE 2
         MICRO-CYCLES
      ====================================================== */

      const allMicrocycles = [];


      for (
        let i = 0;
        i < mesocycles.length;
        i++
      ) {
        const meso =
          mesocycles[i];

        const phaseProgress =
          25 +
          ((i + 1) /
            mesocycles.length) *
            65;

        runProgressTo(
          phaseProgress
        );


        setLoadingPhase(
          `Building ${
            meso?.name ||
            `Phase ${i + 1}`
          }…`
        );


        const microcyclePrompt =
          buildMicrocyclePrompt(
            trainingType,
            promptData,
            i,
            meso
          );


        if (
          !microcyclePrompt ||
          microcyclePrompt.trim().length ===
            0
        ) {
          throw new Error(
            `Could not create the AI prompt for phase ${
              i + 1
            }.`
          );
        }


        const microcycleResult =
          await callWorkoutAI({
            type: 'microcycle',

            prompt:
              microcyclePrompt,

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
          });


        const generatedMicrocycles =
          Array.isArray(
            microcycleResult?.microcycles
          )
            ? microcycleResult.microcycles
            : [];


        if (
          generatedMicrocycles.length === 0
        ) {
          throw new Error(
            `The AI did not return workouts for ${
              meso?.name ||
              `phase ${i + 1}`
            }.`
          );
        }


        allMicrocycles.push(
          ...generatedMicrocycles
        );
      }


      /* ======================================================
         SAVE COMPLETE AI PROGRAM
      ====================================================== */

      clearInterval(
        progressTimer.current
      );

      setProgress(95);

      setLoadingPhase(
        'Saving your program…'
      );


      const {
        error: programError,
      } =
        await supabase
          .from('workout_programs')
          .insert({
            user_id:
              user.id,

            program_name:
              structureResult.program_name ||
              'My Training Program',

            duration_weeks:
              structureResult.duration_weeks ||
              null,

            macrocycle:
              structureResult.macrocycle ||
              {},

            mesocycles:
              structureResult.mesocycles ||
              [],

            microcycles:
              allMicrocycles,

            training_type:
              trainingType,

            fitness_level:
              level ||
              'intermediate',

            goal:
              goalDescription.trim() ||
              weightGoals.join(', ') ||
              fitnessGoals.join(', ') ||
              'General fitness',

            current_week:
              1,

            status:
              'active',
          });


      if (programError) {
        throw new Error(
          `The AI program was generated but could not be saved: ${programError.message}`
        );
      }


      /* ======================================================
         FINISHED
      ====================================================== */

      setProgress(100);

      setLoadingPhase(
        'Your program is ready!'
      );


      await queryClientInstance.invalidateQueries();


      /*
       * Give React/Supabase a moment to finish updating
       * before navigating into the app.
       */
      setTimeout(() => {
        navigate('/', {
          replace: true,
        });
      }, 700);

    } catch (error) {
      console.error(
        'ONBOARDING / AI GENERATION ERROR:',
        error
      );

      clearInterval(
        progressTimer.current
      );

      setLoading(false);
      setProgress(0);
      setLoadingPhase('');


      const message =
        error?.message ||
        'Failed to generate your program.';


      toast.error(
        message,
        {
          duration: 6000,
        }
      );
    }
  };


  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">

      {/* ======================================================
          PROGRESS INDICATOR
      ====================================================== */}

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

        {/* ====================================================
            STEP 0 — WELCOME
        ==================================================== */}

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
                      label:
                        'Metric (kg, cm)',
                    },
                    {
                      value: 'imperial',
                      label:
                        'Imperial (lbs, ft)',
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
              className="w-full h-14 text-lg font-heading font-semibold mb-8 mt-4"
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


        {/* ====================================================
            STEP 1 — TRAINING TYPE
        ==================================================== */}

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
                className="flex-1 h-14 text-lg font-heading font-semibold"
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


        {/* ====================================================
            STEP 2 — BODY STATS
        ==================================================== */}

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
                    (value) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() =>
                          setGender(
                            value
                          )
                        }
                        className={cn(
                          'h-12 rounded-2xl border-2 font-semibold text-sm capitalize transition-all',
                          gender === value
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                        )}
                      >
                        {value ===
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
                    min="13"
                    max="100"
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
                    {unit ===
                    'metric'
                      ? 'kg'
                      : 'lbs'}
                    )
                  </p>

                  <Input
                    type="number"
                    min="0"
                    placeholder={
                      unit ===
                      'metric'
                        ? 'e.g. 80'
                        : 'e.g. 175'
                    }
                    value={
                      weightLbs
                    }
                    onChange={(
                      event
                    ) =>
                      setWeightLbs(
                        event.target
                          .value
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

                {unit ===
                'metric' ? (
                  <Input
                    type="number"
                    min="0"
                    placeholder="Height in cm (e.g. 178)"
                    value={
                      heightFt
                    }
                    onChange={(
                      event
                    ) =>
                      setHeightFt(
                        event.target
                          .value
                      )
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
                      value={
                        heightFt
                      }
                      onChange={(
                        event
                      ) =>
                        setHeightFt(
                          event.target
                            .value
                        )
                      }
                      className="h-12 text-base"
                    />

                    <Input
                      type="number"
                      min="0"
                      max="11"
                      placeholder="Inches (e.g. 10)"
                      value={
                        heightIn
                      }
                      onChange={(
                        event
                      ) =>
                        setHeightIn(
                          event.target
                            .value
                        )
                      }
                      className="h-12 text-base"
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

                        return (
                          <button
                            type="button"
                            key={
                              value
                            }
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
                className="flex-1 h-14 text-lg font-heading font-semibold"
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


        {/* ====================================================
            STEP 3 — LEVEL / WEIGHT GOALS
        ==================================================== */}

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
                  {firstName ||
                    'Athlete'}
                  ?
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
                      <div
                        key={
                          value
                        }
                      >

                        <button
                          type="button"
                          onClick={() =>
                            setLevel(
                              value
                            )
                          }
                          className={cn(
                            'w-full p-4 rounded-2xl border-2 text-left transition-all',
                            level ===
                              value
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
                              onClick={(
                                event
                              ) =>
                                event.stopPropagation()
                              }
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

                          return (
                            <button
                              type="button"
                              key={
                                value
                              }
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
                  {firstName ||
                    'Athlete'}
                  ?
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
                          key={
                            value
                          }
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
                className="flex-1 h-14 text-lg font-heading font-semibold"
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


        {/* ====================================================
            STEP 4 — FINAL AI INPUT
        ==================================================== */}

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
                ? 'Describe your goals, what you want to achieve, and any limitations. The more detail you give, the more personalized your AI program will be.'
                : 'List your available equipment and any requirements. This helps your AI coach build the perfect program for you.'}
            </p>


            <div className="flex-1 flex flex-col gap-3">

              {hasSkills && (
                <>
                  <Textarea
                    value={
                      goalDescription
                    }
                    onChange={(
                      event
                    ) =>
                      setGoalDescription(
                        event.target
                          .value
                      )
                    }
                    placeholder='e.g. "I want to learn the muscle up and build a strong back. I can currently do 10 pull-ups and 15 dips. I want to improve my pressing strength too."'
                    className="min-h-[140px] text-sm resize-none bg-card border-border focus:border-primary rounded-2xl p-4 leading-relaxed"
                  />


                  <div className="bg-muted/50 rounded-2xl p-4 border border-border">

                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      ⏱ Timeframe for your goals
                    </p>

                    <Textarea
                      value={
                        timeframe
                      }
                      onChange={(
                        event
                      ) =>
                        setTimeframe(
                          event.target
                            .value
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
                  value={
                    equipment
                  }
                  onChange={(
                    event
                  ) =>
                    setEquipment(
                      event.target
                        .value
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
                  List everything you have access to.
                </p>

              </div>


              <div className="bg-muted/50 rounded-2xl p-4 border border-border">

                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  📝 Requirements & Notes
                </p>

                <Textarea
                  value={
                    requirements
                  }
                  onChange={(
                    event
                  ) =>
                    setRequirements(
                      event.target
                        .value
                    )
                  }
                  placeholder='e.g. "I can train 4 days a week, about 60 min per session. I want to focus on my chest and improve my pull-ups."'
                  className="min-h-[80px] text-sm resize-none bg-card border-border focus:border-primary rounded-xl p-3 leading-relaxed"
                />

                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Training availability, limitations,
                  preferences, injuries, or anything
                  else your AI coach should know.
                </p>

              </div>

            </div>


            {/* ==================================================
                BUTTONS
            ================================================== */}

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
                className="flex-1 h-14 text-lg font-heading font-semibold"
                disabled={
                  !step4Valid ||
                  loading
                }
                onClick={
                  handleGenerate
                }
              >

                {loading ? (
                  <div className="flex items-center gap-3 min-w-0">

                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />

                    <span className="truncate">
                      {loadingPhase ||
                        'Building your AI program…'}{' '}
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


            {/* ==================================================
                AI PROGRESS
            ================================================== */}

            {loading && (
              <div className="mb-6 space-y-2">

                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">

                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${progress}%`,
                    }}
                  />

                </div>

                <p className="text-xs text-muted-foreground text-center">
                  {loadingPhase ||
                    'Building your AI program…'}
                </p>

              </div>
            )}

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
