import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  DeviceEventEmitter,
  Alert,
  ScrollView,
  Image,
  Dimensions,
  SafeAreaView,
  Platform,
  Animated,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BASE_URL } from '../src/api.js';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';


import LinearGradient from 'react-native-linear-gradient';
import {
  configure,
  startAssessment,
  startCustomAssessment,
  setSessionLanguage,
  startCustomWorkout,
  startWorkoutProgram,
  setEndExercisePreferences,
  setCounterPreferences,
} from '@sency/react-native-smkit-ui';
import * as SMWorkoutLibrary from '@sency/react-native-smkit-ui/src/SMWorkout';
import EditText from '../components/EditText';
import ThreeCheckboxes from '../components/ThreeCheckboxes';
import React from 'react';
import PlanSection from '../components/PlanSection';
import PropTypes from 'prop-types';
import { useIsFocused } from '@react-navigation/native';
import { addPerformedExercises, getPerformedExercises } from '../utils/exerciseTracker';
import { useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import AuthContext from '../context/AuthContext';
import { useNightMode } from '../context/NightModeContext';
import RazorpayPayment from '../src/components/RazorpayPayment';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Add this helper function near the top, after imports:
function formatExerciseName(name: string) {
  if (!name) return '';
  return name
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper functions to calculate dynamic workout details
const calculateWorkoutDetails = (plan: any, selectedLevel: string) => {
  if (!plan || !plan.exercises) {
    return {
      level: 'Beginner',
      time: '18 mins',
      focusArea: 'Abs'
    };
  }

  // Calculate total time based on exercises and selected level
  const totalTime = plan.exercises.reduce((total: number, exercise: any) => {
    const exerciseTime = exercise.duration?.[selectedLevel] || 30;
    return total + exerciseTime;
  }, 0);

  // Convert seconds to minutes
  const timeInMinutes = Math.round(totalTime / 60);
  
  // Comprehensive focus area mapping based on exercise types
  const focusAreas = {
    // Upper Body Exercises
    'Push-ups': 'Upper Body Strength',
    'Shoulder Press': 'Upper Body Strength',
    'Shoulder Taps Plank': 'Upper Body Strength',
    
    // Lower Body Exercises
    'Squats': 'Lower Body Strength',
    'Air Squat': 'Lower Body Strength',
    'Side Lunge': 'Lower Body Strength',
    'Lunge': 'Lower Body Strength',
    'Overhead Squat': 'Lower Body Strength',
    
    // Core & Full Body Strength
    'Plank': 'core',
    'High Plank': 'core',
    'Side Plank': 'core',
    'Tuck Hold': 'core',
    'High Plank Hold': 'core',
    'Side Plank': 'core',
    'Plank Shoulder Taps': 'Full Body Strength',
    'Oblique Crunches': 'Core Strength',
    'Crunches': 'Core Strength',
    
    // Cardio Exercises
    'Jumping Jacks': 'Cardio ',
    'High Knees': 'Cardio ',
    'Skater Hops': 'Cardio ',
    'Jumps': 'Cardio ',
    'Ski Jumps': 'Cardio ',
    'Push-up Hold': 'Cardio ',
    
    // Mobility & Flexibility
    'Hamstring mobility': 'Flexibility',
    'Standing hamstring mobility': 'Flexibility',
    'Side Bend Left': 'Flexibility',
    'Side Bend Right': 'Flexibility',
    'Standing Knee Raise Left': 'Flexibility',
    'Standing Knee Raise Right': 'Flexibility',
    'Jefferson curl': 'Flexibility',
    'Standing Hamstring Mobility': 'Flexibility',
    'Side Bend': 'Flexibility',
    'Standing Knee Raise': 'Flexibility',
    
    // Balance & Stability
    'Glutes Bridge': 'Balance & Stability',
    'Glutes Bridge Hold': 'Balance & Stability',
    'Reverse Sit to Table Top': 'Balance & Stability'
  };

  // Get focus areas for all exercises in this plan
  const exerciseFocusAreas = plan.exercises.map((exercise: any) => 
    focusAreas[exercise.name as keyof typeof focusAreas] || 'Full Body'
  );
  
  // Count focus areas to determine the primary focus
  const focusAreaCounts = exerciseFocusAreas.reduce((acc: any, area: string) => {
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});
  
  // Determine primary focus area
  let primaryFocusArea = 'Full Body';
  
  if (Object.keys(focusAreaCounts).length > 0) {
    // If there's a clear majority, use that
    const maxCount = Math.max(...Object.values(focusAreaCounts) as number[]);
    const dominantAreas = Object.keys(focusAreaCounts).filter(area => 
      focusAreaCounts[area] === maxCount
    );
    
    if (dominantAreas.length === 1) {
      primaryFocusArea = dominantAreas[0];
    } else if (dominantAreas.length > 1) {
      // If multiple areas are tied, create a combined focus area
      if (dominantAreas.includes('Cardio Fitness') && dominantAreas.includes('Upper Body Strength')) {
        primaryFocusArea = 'Cardio & Strength';
      } else if (dominantAreas.includes('Lower Body Strength') && dominantAreas.includes('Upper Body Strength')) {
        primaryFocusArea = 'Full Body Strength';
      } else if (dominantAreas.includes('Mobility & Flexibility') && dominantAreas.includes('Core Strength')) {
        primaryFocusArea = 'Mobility & Core';
      } else {
        primaryFocusArea = 'Full Body';
      }
    }
  }

  return {
    level: selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1),
    time: `${timeInMinutes} mins`,
    focusArea: primaryFocusArea
  };
};

// Define navigation type
type RootStackParamList = {
  Login: undefined;
  // add other routes if needed
};

const App = () => {
  const { isNightMode, setIsNightMode } = useNightMode();
  const [didConfig, setDidConfig] = useState(false);
  const [creditLoading, setCreditLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWFPUI, setWPFUI] = useState(false);
  const [week, setWeek] = useState('1');
  const [bodyZone, setBodyZone] = useState(SMWorkoutLibrary.BodyZone.FullBody);
  const [difficulty, setDifficulty] = useState(SMWorkoutLibrary.WorkoutDifficulty.LowDifficulty);
  const [duration, setDuration] = useState(SMWorkoutLibrary.WorkoutDuration.Long);
  const [language, setLanguage] = useState(SMWorkoutLibrary.Language.English);
  const [name, setName] = useState('YOUR_PROGRAM_ID');
  const [modalVisible, setModalVisible] = useState(false);
  const [summaryMessage, setSummaryMessage] = useState('');
  const [parsedSummaryData, setParsedSummaryData] = useState<any>(null);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [creditScore, setCreditScore] = useState(0);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<{ strengths: string[], improvements: string[] }>({ strengths: [], improvements: [] });

  // New state variables for the assessment info modal
  const [assessmentInfoModalVisible, setAssessmentInfoModalVisible] = useState(false);
  const [currentAssessmentExercises, setCurrentAssessmentExercises] = useState<any[]>([]);
  const [currentAssessmentType, setCurrentAssessmentType] = useState<string | null>(null); // To store the category type
  const [hasRestarted, setHasRestarted] = useState(false);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [startDisabled, setStartDisabled] = useState(false);
  const [showTodaysPlanModal, setShowTodaysPlanModal] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [premiumStatusRefresh, setPremiumStatusRefresh] = useState(0); // Force refresh counter

  const [lastScorePercent, setLastScorePercent] = useState(88); // Default to 88% for initial UI
  const [performedCount, setPerformedCount] = useState(0);
  const [cleanPercent, setCleanPercent] = useState(0);

  const isFocused = useIsFocused();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { logout, user } = useContext(AuthContext);

  // Get user ID from logged-in user
  const userId = user?._id || user?.id;

  // Add level durations mapping
  const levelDurations = {
    beginner: 30,
    performer: 60,
    advanced: 120
  };

  // Plan exercise data (example)
  const planData = [
    {
      id: 'full-stack-fitness',
      name: 'Full Stack Fitness',
      level: 'All Levels',
      time: '30-45 min',
      focus: 'Full Body',
      image: require('../assets/pushups.png'),
      exercises: [
        {
          name: 'Push-ups',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          }
        },
        {
          name: 'Squats',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          }
        },
        {
          name: 'Plank',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 20,
            performer: 30,
            advanced: 40
          }
        }
      ]
    },
    {
      id: 'fat-burner',
      name: 'Fat Burner',
      level: 'All Levels',
      time: '20-30 min',
      focus: 'Cardio',
      image: require('../assets/jumpingjack.png'),
      exercises: [
        {
          name: 'Jumping Jacks',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          }
        },
        {
          name: 'High Knees',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 20,
            performer: 30,
            advanced: 40
          }
        },
        {
          name: 'Push-ups',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          }
        },
        {
          name: 'Skater Hops',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          }
        },
        {
          name: 'Jumps',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          }
        }
      ]
    },
    {
      id: 'plank-core-stability',
      name: 'Plank & Core Stability',
      level: 'Beginner',
      time: '4 min',
      focus: 'Core',
      image: require('../assets/plank1.png'),
      exercises: [
        {
          name: 'High Plank',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('../assets/plank1.png')
        },
        {
          name: 'Side Plank',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('../assets/plank1.png')
        },
        {
          name: 'Tuck Hold',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
         image: require('../assets/plank1.png')
        },
        {
          name: 'Plank',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('../assets/plank1.png')
        }
      ]
    },
    {
      id: 'mobility-stretch',
      name: 'Mobility & Stretch',
      level: 'Beginner',
      time: '5 min',
      focus: 'Mobility',
      image: require('../assets/jefferson.png'),
      exercises: [
        {
          name: 'Hamstring mobility',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('../assets/jefferson.png')
        },
        {
          name: 'Standing hamstring mobility',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('../assets/jefferson.png')
        },
        {
          name: 'Side Bend Left',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('../assets/jefferson.png')
        },
        {
          name: 'Side Bend Right',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('../assets/jefferson.png')
        },
        {
          name: 'Standing Knee Raise Left',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('../assets/jefferson.png')
        },
        {
          name: 'Standing Knee Raise Right',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('../assets/jefferson.png')
        },
        {
          name: 'Jefferson curl',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('../assets/jefferson.png')
        }
      ]
    },
    {
      id: 'cardio-basic',
      name: 'Cardio Basic',
      level: 'Beginner',
      time: '8 min',
      focus: 'Cardio',
      image: require('../assets/highknees.png'),
      exercises: [
        {
          name: 'Jumping Jacks',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          },
          image: require('../assets/highknees.png')
        },
        {
          name: 'High Knees',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 20,
            performer: 30,
            advanced: 40
          },
          image: require('../assets/highknees.png')
        },
        {
          name: 'Ski Jumps',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          },
          image: require('../assets/highknees.png')
        },
        {
          name: 'Skater Hops',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          },
          image: require('../assets/highknees.png')
        },
        {
          name: 'Jumps',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          },
          image: require('../assets/highknees.png')
        },
        {
          name: 'Standing Knee Raise Left',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 20,
            performer: 30,
            advanced: 40
          },
          image: require('../assets/jumpingjack.png')
        },
        {
          name: 'Standing Knee Raise Right',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 20,
            performer: 30,
            advanced: 40
          },
          image: require('../assets/jumpingjack.png')
        }
      ]
    },
    {
      id: 'cardio-hardcore',
      name: 'Cardio Hardcore',
      level: 'Advanced',
      time: '12 min',
      focus: 'Cardio',
      image: require('../assets/jumpingjack.png'),
      exercises: [
        {
          name: 'Jumping Jacks',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          },
          image: require('../assets/jumpingjack.png')
        },
        {
          name: 'High Knees',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 20,
            performer: 30,
            advanced: 40
          },
          image: require('../assets/jumpingjack.png')
        },
        {
          name: 'Ski Jumps',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          },
          image: require('../assets/jumpingjack.png')
        },
        {
          name: 'Skater Hops',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          },
          image: require('../assets/jumpingjack.png')
        },
        {
          name: 'Lunge',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 12,
            performer: 20,
            advanced: 30
          },
          image: require('../assets/jumpingjack.png')
        },
        {
          name: 'Jumps',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          },
          image: require('../assets/jumpingjack.png')
        },
        {
          name: 'Standing Knee Raise Left',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 20,
            performer: 30,
            advanced: 40
          },
          image: require('../assets/jumpingjack.png')
        },
        {
          name: 'Standing Knee Raise Right',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 20,
            performer: 30,
            advanced: 40
          },
          image: require('../assets/jumpingjack.png')
        }
      ]
    },
  ];

  // Map display names to Sency detector IDs
  const exerciseIdMap = {
    'Push-ups': 'PushupRegular',
    'Squats': 'SquatRegular',
    'Plank': 'PlankHighStatic',
    'High Plank': 'PlankHighStatic',
    'Side Plank': 'PlankSideLowStatic',
    'Tuck Hold': 'TuckHold',
    'Hamstring mobility': 'HamstringMobility',
    'Standing hamstring mobility': 'StandingHamstringMobility',
    'Side bend': 'StandingSideBendRight',
    'Side Bend Left': 'StandingSideBendLeft',
    'Side Bend Right': 'StandingSideBendRight',
    'Standing knee raises': 'HighKnees',
    'Jefferson curl': 'JeffersonCurlRight',
    'Jumping Jacks': 'JumpingJacks',
    'High Knees': 'HighKnees',
    'Ski Jumps': 'SkiJumps',
    'Skater Hops': 'SkaterHops',
    'Lunge': 'LungeFront',
    'Jumps': 'Jumps',
    'Standing Knee Raise': 'StandingKneeRaiseLeft',
    'Standing Knee Raise Left': 'StandingKneeRaiseLeft',
    'Standing Knee Raise Right': 'StandingKneeRaiseRight',
  };

  // Map display names to scoring type and UI
  const exerciseScoringMap = {
    'Push-ups': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Squats': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Plank': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'High Plank': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Side Plank': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Tuck Hold': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Hamstring mobility': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Standing hamstring mobility': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Side bend': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Side Bend Left': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Side Bend Right': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Standing knee raises': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Jefferson curl': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.GaugeOfMotion, SMWorkoutLibrary.UIElement.Timer] },
    'Jumping Jacks': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'High Knees': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Ski Jumps': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Skater Hops': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Lunge': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Jumps': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Standing Knee Raise': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Standing Knee Raise Left': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Standing Knee Raise Right': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
  };

  useEffect(() => {
    configureSMKitUI();
  }, []);

 


useEffect(() => {
    if (!isFocused) return;
    const didExitWorkoutSubscription = DeviceEventEmitter.addListener('didExitWorkout', params => {
      handleEvent(params.summary);
      console.log('Received didExitWorkout event with message:', params.summary);
    });



    const workoutDidFinishSubscription = DeviceEventEmitter.addListener('workoutDidFinish', params => {
      handleEvent(params.summary);
      console.log('Received workoutDidFinish event with message:', params.summary);
    });

    return () => {
      didExitWorkoutSubscription.remove();
      workoutDidFinishSubscription.remove();
    };
  }, [isFocused]);

  useEffect(() => {
    const loadCount = async () => {
      const all = await getPerformedExercises();
      setPerformedCount(all.length);
    };
    loadCount();
    const sub = DeviceEventEmitter.addListener('performedExercisesUpdated', loadCount);
    return () => sub.remove();
  }, []);

  const analyzePerformance = (data: any) => {
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (!data.exercises || data.exercises.length === 0) {
      return { strengths, improvements };
    }

      // Analyze each exercise
  data.exercises.forEach((exercise: any) => {
      const exerciseName = exercise.pretty_name || exercise.exercise_id || 'Unknown Exercise';
      const score = exercise.total_score || 0;
      const repsPerfect = exercise.reps_performed_perfect || 0;
      const timePerfect = exercise.time_in_position_perfect || 0;

      // Example analysis logic (customize based on your scoring system and exercise types)
      if (score >= 8) { // High score threshold
        strengths.push(`${exerciseName}: Excellent performance with a score of ${score}.`);
      } else if (score <= 3) { // Low score threshold
        improvements.push(`${exerciseName}: Room for improvement. Current score: ${score}.`);
      }

      // Analyze reps and time if available
      if (repsPerfect > 0) {
        strengths.push(`${exerciseName}: Completed ${repsPerfect} perfect repetitions.`);
      }
      if (timePerfect > 0) {
        strengths.push(`${exerciseName}: Held correct position for ${timePerfect.toFixed(1)} seconds.`);
      }
    });

    return { strengths, improvements };
  };

  //=================================
  // const userId = "6853e136a4d5b09d329515ff"; // REMOVED - using logged-in user's ID instead

//   useEffect(() => {
//   if (!userId) return;

//   const intervalId = setInterval(async () => {
//     try {
//       const response = await axios.get(`http://localhost:3000/api/v1/credit/get/${userId}`);
      
//       const updatedCredits = response?.data?.data?.credits ;
//       setCreditScore(updatedCredits);
//       console.log('🔁 Credits updated:', updatedCredits);
//     } catch (error) {
//       console.error('❌ Failed to fetch credits:', error.response?.data || error.message);
//     }
//   }, 5000); // 5 seconds = 5000ms

//   return () => clearInterval(intervalId); // Cleanup when component unmounts
// }, [userId]);


useFocusEffect(
  useCallback(() => {
    setCreditLoading(true);
    const fetchCredits = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/credit/get/${userId}`);
        const updatedCredits = response?.data?.data?.credits ?? 0;
        setCreditScore(updatedCredits);
        console.log('🎯 Credits fetched on screen focus:', updatedCredits);
      } catch (err: any) {
        console.error('❌ Failed to fetch credits:', err.response?.data || err.message);
      } finally {
        setCreditLoading(false);
      }
    };

    fetchCredits();
  }, [userId])
);


  //=================================

  const handleEvent = async (summary: any) => {
  if (!isFocused) return;

  try {
    console.log('Event received:', summary);
    setSummaryMessage(summary);

    let parsed: any = null;
    try {
      parsed = JSON.parse(summary);
      setParsedSummaryData(parsed);

      // 🧠 API call: Save each exercise
      // 🔁 Replace with actual user ID

      if (parsed?.exercises?.length > 0) {
        // Calculate clean %
        let totalClean = 0;
        let totalPossible = 0;

        for (const ex of parsed.exercises) {
          const exerciseName =
            ex.exercise_info?.pretty_name ||
            ex.exercise_info?.exercise_id ||
            ex.pretty_name ||
            ex.exercise_id ||
            ex.name;

          const scoring =
            exerciseScoringMap[exerciseName] || { type: SMWorkoutLibrary.ScoringType.Reps };

          if (scoring.type === SMWorkoutLibrary.ScoringType.Time) {
            totalClean += ex.time_in_position_perfect ?? ex.exercise_info?.time_in_position_perfect ?? 0;
            totalPossible += ex.time_in_position ?? ex.exercise_info?.time_in_position ?? 0;
          } else {
            totalClean += ex.reps_performed_perfect ?? ex.exercise_info?.reps_performed_perfect ?? 0;
            totalPossible += ex.reps_performed ?? ex.exercise_info?.reps_performed ?? 0;
          }

          // ✅ Save this exercise
          try {
            await axios.post(`${BASE_URL}/exercise/save`, {
              userId,
              exercise_name: exerciseName,
              reps_performed: ex.reps_performed ?? 0,
              reps_performed_perfect: ex.reps_performed_perfect ?? 0
            });
            console.log(`✅ Saved exercise: ${exerciseName}`);

             // 2️⃣ Fetch latest credits
    setCreditLoading(true);
    const creditResponse = await axios.get(`${BASE_URL}/credit/get/${userId}`);
    const updatedCredits = creditResponse?.data?.data?.credits ?? 0;

    // 3️⃣ Update state
    
    setCreditScore(updatedCredits);
            
    console.log(`🎉 Updated credits: ${updatedCredits}`);
          } catch (err) {
            console.error(`❌ Failed to save ${exerciseName}:`, err.response?.data || err.message);
          }finally {
            setCreditLoading(false);
          }
        }

        const percent = totalPossible > 0 ? Math.round((totalClean / totalPossible) * 100) : 0;
        setLastScorePercent(percent);
        setCleanPercent(percent);

        // Track performed exercises
        const performed = parsed.exercises.filter(ex => {
          const exerciseName =
            ex.exercise_info?.pretty_name ||
            ex.exercise_info?.exercise_id ||
            ex.pretty_name ||
            ex.exercise_id ||
            ex.name;

          const scoring = exerciseScoringMap[exerciseName] || { type: SMWorkoutLibrary.ScoringType.Reps };

          if (scoring.type === SMWorkoutLibrary.ScoringType.Time) {
            const total = ex.time_in_position ?? ex.exercise_info?.time_in_position ?? 0;
            return total > 0;
          } else {
            const reps = ex.reps_performed ?? ex.exercise_info?.reps_performed ?? 0;
            return reps > 0;
          }
        }).map(ex =>
          ex.exercise_info?.pretty_name ||
          ex.exercise_info?.exercise_id ||
          ex.pretty_name ||
          ex.exercise_id ||
          ex.name
        );

        if (performed.length > 0) addPerformedExercises(performed);
      }
    } catch (e) {
      if (e instanceof Error) {
        console.error("❌ JSON parsing error:", e.message);
      } else {
        console.error("❌ JSON parsing error:", e);
      }
      setParsedSummaryData(null);
    }

    setModalVisible(true);
  } catch (e) {
    if (e instanceof Error) {
      console.error('❌ Error handling event:', e.message);
      Alert.alert('Error', 'Failed to process assessment results.');
    } else {
      console.error('❌ Error handling event:', e);
      Alert.alert('Error', 'Failed to process assessment results.');
    }
  }
};




  const onDuration = (index: number) => {
    setDuration(index === 0 ? SMWorkoutLibrary.WorkoutDuration.Long : SMWorkoutLibrary.WorkoutDuration.Short);
  };

  const onLanguage = (index: number) => {
    setLanguage(index === 0 ? SMWorkoutLibrary.Language.Hebrew : SMWorkoutLibrary.Language.English);
  };

  const onBodyZone = (index: number) => {
    setBodyZone(
      index === 0 ? SMWorkoutLibrary.BodyZone.UpperBody :
      index === 1 ? SMWorkoutLibrary.BodyZone.LowerBody :
      SMWorkoutLibrary.BodyZone.FullBody
    );
  };

  const onDifficulty = (index: number) => {
    setDifficulty(
      index === 0 ? SMWorkoutLibrary.WorkoutDifficulty.LowDifficulty :
      index === 1 ? SMWorkoutLibrary.WorkoutDifficulty.MidDifficulty :
      SMWorkoutLibrary.WorkoutDifficulty.HighDifficulty
    );
  };

  const handleExerciseSelect = (exercise: string) => {
    setSelectedExercises(prev => {
      if (prev.includes(exercise)) {
        return prev.filter(e => e !== exercise);
      }
      if (prev.length >= 3) {
        showAlert('Maximum Exercises', 'You can only select up to 3 exercises');
        return prev;
      }
      return [...prev, exercise];
    });
  };

  const handleCategorySelect = async (category: string) => {
    if (!didConfig) {
      showAlert('Configuration Required', 'Please wait for configuration to complete.');
      return;
    }

    let exercisesToShow: any[] = [];
    let assessmentToStart: string | null = category;

    try {
      switch (category) {
        case 'Burn Calories Faster':
          // Check if user has premium access
          const checkPremiumStatus = async () => {
            try {
              const authToken = await AsyncStorage.getItem('accessToken');
              if (!authToken) {
                setShowPaymentModal(true);
                return;
              }
              // Check current user's premium status
              const response = await fetch(`${BASE_URL}/users/current-user`, {
                headers: {
                  'Authorization': `Bearer ${authToken}`
                }
              });
              if (response.ok) {
                const userData = await response.json();
                const user = userData.data.user;
                if (user.isPremium && user.premium) {
                  // Check if subscription is still valid
                  const expiryDate = new Date(user.premium.endDate);
                  const now = new Date();
                  if (expiryDate > now) {
                    // User has active premium, proceed with workout selection
                    const burnCaloriesPlans = planData.filter(plan => 
                      plan.id === 'fat-burner' || 
                      plan.id === 'hiit-workout' || 
                      plan.id === 'plank-core-stability'
                    );
                    setSelectedPlan(burnCaloriesPlans[0]); // Show the first plan by default
                    setShowPlanModal(true);
                    return;
                  } else {
                    setShowPaymentModal(true);
                    return;
                  }
                } else {
                  setShowPaymentModal(true);
                  return;
                }
              } else {
                setShowPaymentModal(true);
                return;
              }
            } catch (error) {
              setShowPaymentModal(true);
              return;
            }
          };
          checkPremiumStatus();
          break;
        // ... existing code ...
      }
      // ... existing code ...
    } catch (error) {
      console.error('Error preparing assessment:', error);
      Alert.alert('Error', 'Failed to prepare assessment. Please try again.');
    }
  };

  // New function to start the assessment from the info modal
  const startAssessmentFromInfoModal = async () => {
    setAssessmentInfoModalVisible(false); // Close the info modal
    setIsLoading(true); // Show loading indicator
    setHasRestarted(false); // Reset restart flag on manual start

    try {
      switch (currentAssessmentType) {
        case 'Fitness':
          await startAssessmentSession(
            SMWorkoutLibrary.AssessmentTypes.Fitness,
            true,
            ''
          );
          break;
        case 'Movement':
          await startAssessmentSession(
            SMWorkoutLibrary.AssessmentTypes.Body360,
            true,
            ''
          );
          break;
        case 'Cardio':
          await startAssessmentSession(
            SMWorkoutLibrary.AssessmentTypes.Fitness, // Using Fitness type for Cardio
            true,
            ''
          );
          break;
        case 'Strength':
           // Start the predefined strength assessment if you have a separate function for it,
           // or if it uses startCustomAssessment with the specific strength exercises.
           // For now, let's assume you might have a startStrengthAssessment function or
           // it uses startCustomAssessment with the defined strengthExercises.
           // Example using startCustomAssessment with the previously defined exercises:
           const strengthExercises = [
            new SMWorkoutLibrary.SMExercise(
              "Burpees",
              35,
              "BurpeesRegular",
              null,
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer],
              "BurpeesRegular",
              "",
              null
            ),
            new SMWorkoutLibrary.SMExercise(
              "Froggers",
              35,
              "FroggersRegular",
              null,
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer],
              "FroggersRegular",
              "",
              null
            )
          ];
           const strengthWorkout = new SMWorkoutLibrary.SMWorkout('strength', 'Strength Assessment', null, null, strengthExercises, null, null, null);
           await startCustomAssessment(strengthWorkout, null, true, false); // Assuming showSummary is false for these
          break;
        case 'Custom Fitness':
          await startSMKitUICustomAssessment();
          break;
        default:
          console.error('Unknown assessment type to start:', currentAssessmentType);
          Alert.alert('Start Error', 'Could not determine the assessment type to start.');
          break;
      }
    } catch (error) {
      console.error('Error starting assessment:', error);
      Alert.alert('Start Error', 'Failed to start assessment.');
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  };

  const handleStartWorkout = async () => {
    if (selectedExercises.length === 0) {
      showAlert('No Exercises', 'Please select at least one exercise');
      return;
    }

    try {
      const exercises = selectedExercises.map(exerciseName => {
        let detectorId;
        let scoringType;
        let targetReps: number | null = null;
        let targetTime: number | null = null;
        let uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];

        switch(exerciseName) {
          case 'High Plank':
            detectorId = 'PlankHighStatic';
            scoringType = SMWorkoutLibrary.ScoringType.Time;
            targetTime = 30;
            uiElements = [SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Air Squat':
            detectorId = 'SquatRegular';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 10;
            break;
          case 'Push-ups':
            detectorId = 'PushupRegular';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 10;
            break;
          case 'OH Squat':
            detectorId = 'SquatRegularOverheadStatic';
            scoringType = SMWorkoutLibrary.ScoringType.Time;
            targetTime = 20;
            uiElements = [SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Knee Raise Left':
            detectorId = 'StandingKneeRaiseLeft';
            scoringType = SMWorkoutLibrary.ScoringType.Time;
            targetTime = 15;
            uiElements = [SMWorkoutLibrary.UIElement.GaugeOfMotion, SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Knee Raise Right':
            detectorId = 'StandingKneeRaiseRight';
            scoringType = SMWorkoutLibrary.ScoringType.Time;
            targetTime = 15;
            uiElements = [SMWorkoutLibrary.UIElement.GaugeOfMotion, SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Side Bend Left':
            detectorId = 'StandingSideBendLeft';
            scoringType = SMWorkoutLibrary.ScoringType.Time;
            targetTime = 30;
            uiElements = [SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Side Bend Right':
            detectorId = 'StandingSideBendRight';
            scoringType = SMWorkoutLibrary.ScoringType.Time;
            targetTime = 30;
            uiElements = [SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Hamstring mobility':
          case 'Standing hamstring mobility':
          case 'Standing Alternate Toe Touch':
            detectorId = 'StandingAlternateToeTouch';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 10;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Jefferson Curl':
            detectorId = 'JeffersonCurlRight';
            scoringType = SMWorkoutLibrary.ScoringType.Time;
            targetTime = 20;
            uiElements = [SMWorkoutLibrary.UIElement.GaugeOfMotion, SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Alternate Windmill Toe Touch':
            detectorId = 'AlternateWindmillToeTouch';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 10;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'AlternateWindmillToeTouch',           // name
              35,                                     // totalSeconds
              'AlternateWindmillToeTouch',            // videoInstruction
              null,                                   // exerciseIntro
              uiElements,                             // UI elements
              'AlternateWindmillToeTouch',            // detector
              '',                                     // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,                          // scoring type based on exercise
                0.3,                                  // threshold
                targetTime,                           // targetTime (for plank and static holds)
                targetReps,                           // targetReps (for dynamic exercises)
                null,                                 // targetDistance
                null                                  // targetCalories
              ),
              '',                                     // failedSound
              exerciseName,                           // exerciseTitle (display name)
              'Complete the exercise',                 // subtitle
              'Reps',                                 // scoreTitle
              'clean reps'                            // scoreSubtitle
            );
          case 'Burpees':
            detectorId = 'Burpees';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 10;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'Burpees',           // name
              35,                     // totalSeconds
              'Burpees',            // videoInstruction
              null,                  // exerciseIntro
              uiElements,            // UI elements
              'Burpees',            // detector
              '',                    // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,         // scoring type based on exercise
                0.3,                 // threshold
                targetTime,          // targetTime (for plank and static holds)
                targetReps,          // targetReps (for dynamic exercises)
                null,                // targetDistance
                null                 // targetCalories
              ),
              '',                    // failedSound
              exerciseName,          // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',  // scoreTitle
              'clean reps'  // scoreSubtitle
            );
          case 'Crunches':
            detectorId = 'Crunches';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 15;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Froggers':
            detectorId = 'Froggers';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 10;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'Froggers',           // name
              35,                     // totalSeconds
              'Froggers',            // videoInstruction
              null,                  // exerciseIntro
              uiElements,            // UI elements
              'Froggers',            // detector
              '',                    // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,         // scoring type based on exercise
                0.3,                 // threshold
                targetTime,          // targetTime (for plank and static holds)
                targetReps,          // targetReps (for dynamic exercises)
                null,                // targetDistance
                null                 // targetCalories
              ),
              '',                    // failedSound
              exerciseName,          // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',  // scoreTitle
              'clean reps'  // scoreSubtitle
            );
          case 'Glute Bridge':
            detectorId = 'GlutesBridge';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 12;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'GlutesBridge',           // name
              35,                         // totalSeconds
              'GlutesBridge',            // videoInstruction
              null,                      // exerciseIntro
              uiElements,                // UI elements
              'GlutesBridge',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,             // scoring type based on exercise
                0.3,                     // threshold
                targetTime,              // targetTime (for plank and static holds)
                targetReps,              // targetReps (for dynamic exercises)
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'High Knees':
            detectorId = 'HighKnees';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 20;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'HighKnees',           // name
              35,                     // totalSeconds
              'HighKnees',            // videoInstruction
              null,                  // exerciseIntro
              uiElements,            // UI elements
              'HighKnees',            // detector
              '',                    // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,         // scoring type based on exercise
                0.3,                 // threshold
                targetTime,          // targetTime (for plank and static holds)
                targetReps,          // targetReps (for dynamic exercises)
                null,                // targetDistance
                null                 // targetCalories
              ),
              '',                    // failedSound
              exerciseName,          // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',  // scoreTitle
              'clean reps'  // scoreSubtitle
            );
          case 'Jumping Jacks':
            detectorId = 'JumpingJacks';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 20;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'JumpingJacks',           // name
              35,                         // totalSeconds
              'JumpingJacks',            // videoInstruction
              null,                      // exerciseIntro
              uiElements,                // UI elements
              'JumpingJacks',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,             // scoring type based on exercise
                0.3,                     // threshold
                targetTime,              // targetTime (for plank and static holds)
                targetReps,              // targetReps (for dynamic exercises)
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Jumps':
            detectorId = 'Jumps';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 15;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'Jumps',           // name
              35,                         // totalSeconds
              'Jumps',            // videoInstruction
              null,                      // exerciseIntro
              uiElements,                // UI elements
              'Jumps',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,             // scoring type based on exercise
                0.3,                     // threshold
                targetTime,              // targetTime (for plank and static holds)
                targetReps,              // targetReps (for dynamic exercises)
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Lateral Raises':
            detectorId = 'LateralRaise';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 12;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'LateralRaise',           // name
              35,                         // totalSeconds
              'LateralRaise',            // videoInstruction
              null,                      // exerciseIntro
              uiElements,                // UI elements
              'LateralRaise',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,             // scoring type based on exercise
                0.3,                     // threshold
                targetTime,              // targetTime (for plank and static holds)
                targetReps,              // targetReps (for dynamic exercises)
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Lunge':
            detectorId = 'LungeFront';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 12;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'Lunge',           // name
              35,                         // totalSeconds
              'Lunge',            // videoInstruction
              null,                      // exerciseIntro
              uiElements,                // UI elements
              'Lunge',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,             // scoring type based on exercise
                0.3,                     // threshold
                targetTime,              // targetTime (for plank and static holds)
                targetReps,              // targetReps (for dynamic exercises)
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Lunge Jump':
            detectorId = 'LungeJump';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 12;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'LungeJump',           // name
              35,                         // totalSeconds
              'LungeJump',            // videoInstruction
              null,                      // exerciseIntro
              uiElements,                // UI elements
              'LungeJump',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,             // scoring type based on exercise
                0.3,                     // threshold
                targetTime,              // targetTime (for plank and static holds)
                targetReps,              // targetReps (for dynamic exercises)
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Side Lunge':
            detectorId = 'SideLunge';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 12;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'SideLunge',           // name
              35,                         // totalSeconds
              'SideLunge',            // videoInstruction
              null,                      // exerciseIntro
              uiElements,                // UI elements
              'SideLunge',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,             // scoring type based on exercise
                0.3,                     // threshold
                targetTime,              // targetTime (for plank and static holds)
                targetReps,              // targetReps (for dynamic exercises)
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Mountain Climber Plank':
            detectorId = 'MountainClimberPlank';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 20;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'MountainClimberPlank',           // name
              35,                         // totalSeconds
              'MountainClimberPlank',            // videoInstruction
              null,                      // exerciseIntro
              uiElements,                // UI elements
              'MountainClimberPlank',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,             // scoring type based on exercise
                0.3,                     // threshold
                targetTime,              // targetTime (for plank and static holds)
                targetReps,              // targetReps (for dynamic exercises)
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Shoulder Taps Plank':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'PlankHighShoulderTaps',           // name
              35,                         // totalSeconds
              'PlankHighShoulderTaps',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer], // UI elements
              'PlankHighShoulderTaps',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Reps,  // scoring type
                0.3,                     // threshold
                null,                    // targetTime
                20,                      // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Reverse Sit to Table Top':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'ReverseSitToTableTop',           // name
              35,                         // totalSeconds
              'ReverseSitToTableTop',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer], // UI elements
              'ReverseSitToTableTop',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Reps,  // scoring type
                0.3,                     // threshold
                null,                    // targetTime
                12,                      // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Skater Hops':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'SkaterHops',           // name
              35,                         // totalSeconds
              'SkaterHops',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer], // UI elements
              'SkaterHops',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Reps,  // scoring type
                0.3,                     // threshold
                null,                    // targetTime
                20,                      // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Ski Jumps':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'SkiJumps',           // name
              35,                         // totalSeconds
              'SkiJumps',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer], // UI elements
              'SkiJumps',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Reps,  // scoring type
                0.3,                     // threshold
                null,                    // targetTime
                20,                      // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Rotation Jab Squat':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'SquatAndRotationJab',           // name
              35,                         // totalSeconds
              'SquatAndRotationJab',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer], // UI elements
              'SquatAndRotationJab',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Reps,  // scoring type
                0.3,                     // threshold
                null,                    // targetTime
                12,                      // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Bicycle Crunches':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'StandingBicycleCrunches',           // name
              35,                         // totalSeconds
              'StandingBicycleCrunches',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer], // UI elements
              'StandingBicycleCrunches',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Reps,  // scoring type
                0.3,                     // threshold
                null,                    // targetTime
                20,                      // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Oblique Crunches':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'StandingObliqueCrunches',           // name
              35,                         // totalSeconds
              'StandingObliqueCrunches',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer], // UI elements
              'StandingObliqueCrunches',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Reps,  // scoring type
                0.3,                     // threshold
                null,                    // targetTime
                20,                      // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Shoulder Press':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'ShouldersPress',           // name
              35,                         // totalSeconds
              'ShouldersPress',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer], // UI elements
              'ShouldersPress',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Reps,  // scoring type
                0.3,                     // threshold
                null,                    // targetTime
                12,                      // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Side Plank':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'PlankSideLowStatic',           // name
              35,                         // totalSeconds
              'PlankSideLowStatic',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.Timer], // UI elements
              'PlankSideLowStatic',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Time,  // scoring type
                0.3,                     // threshold
                30,                      // targetTime
                null,                    // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Hold the position',   // subtitle
              'Time',                    // scoreTitle
              'seconds'               // scoreSubtitle
            );
          case 'Tuck Hold':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'TuckHold',           // name
              35,                         // totalSeconds
              'TuckHold',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.Timer], // UI elements
              'TuckHold',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Time,  // scoring type
                0.3,                     // threshold
                30,                      // targetTime
                null,                    // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Hold the position',   // subtitle
              'Time',                    // scoreTitle
              'seconds'               // scoreSubtitle
            );
          default:
            if (exerciseName === 'Lunge Jump') {
              detectorId = 'LungeJump';
              scoringType = SMWorkoutLibrary.ScoringType.Reps;
              targetReps = 12;
              uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            } else if (exerciseName === 'Lateral Raises') {
              detectorId = 'LateralRaise';
              scoringType = SMWorkoutLibrary.ScoringType.Reps;
              targetReps = 12;
              uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            } else if (exerciseName === 'Shoulder Taps Plank') {
              detectorId = 'PlankHighShoulderTaps';
              scoringType = SMWorkoutLibrary.ScoringType.Reps;
              targetReps = 20;
              uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            } else if (exerciseName === 'Rotation Jab Squat') {
              detectorId = 'SquatAndRotationJab';
              scoringType = SMWorkoutLibrary.ScoringType.Reps;
              targetReps = 12;
              uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            } else {
              detectorId = exerciseName;
              scoringType = SMWorkoutLibrary.ScoringType.Reps;
              targetReps = 10;
            }
            break;
        }

        return new SMWorkoutLibrary.SMAssessmentExercise(
          detectorId,           // name (using detector ID as name for consistency)
          35,                     // totalSeconds
          exerciseName === 'Alternate Windmill Toe Touch' ? 'AlternateWindmillToeTouch' : detectorId,            // videoInstruction
          null,                  // exerciseIntro
          uiElements,            // UI elements
          detectorId,            // detector
          '',                    // successSound
          new SMWorkoutLibrary.SMScoringParams(
            scoringType,         // scoring type based on exercise
            0.3,                 // threshold
            targetTime,          // targetTime (for plank and static holds)
            targetReps,          // targetReps (for dynamic exercises)
            null,                // targetDistance
            null                 // targetCalories
          ),
          '',                    // failedSound
          exerciseName,          // exerciseTitle (display name)
          scoringType === SMWorkoutLibrary.ScoringType.Time ? 'Hold the position' : 'Complete the exercise',   // subtitle
          scoringType === SMWorkoutLibrary.ScoringType.Time ? 'Time' : 'Reps',  // scoreTitle
          scoringType === SMWorkoutLibrary.ScoringType.Time ? 'seconds held' : 'clean reps'  // scoreSubtitle
        );
      });

      const workout = new SMWorkoutLibrary.SMWorkout(
        '50',
        'Custom Workout',
        null,
        null,
        exercises,
        null,
        null,
        null,
      );

      const result = await startCustomAssessment(workout, null, true, false);
      console.log('Assessment result:', result.summary);
      console.log('Did finish:', result.didFinish);
    } catch (e) {
      showAlert('Workout Error', e.message);
    }
  };

  // --- Weekly Plans ---
  const weeklyPlans = [
    {
      day: 'Monday',
      title: 'Lower Body & Glutes',
      sections: [
        {
          title: 'Warm-up',
          exercises: ['Jumping Jacks', 'Glutes Bridge', 'Standing Knee Raise'],
          color: '#FF6B35',
          rest: '20 seconds between exercises',
        },
        {
          title: 'Workout',
          exercises: ['Air Squat', 'Side Lunge', 'Lunge', 'Overhead Squat'],
          color: '#FF8C42',
          rest: '40 seconds between sets',
        },
        {
          title: 'Finisher',
          exercises: ['Skater Hops', 'Glutes Bridge Hold'],
          color: '#FFA726',
          rest: 'No rest',
        },
        {
          title: 'Cool-down',
          exercises: ['Standing Hamstring Mobility', 'Jefferson Curl'],
          color: '#FFB74D',
          rest: 'Hold each stretch for 30 seconds',
        },
      ],
    },
    {
      day: 'Tuesday',
      title: 'Upper Body Strength',
      sections: [
        {
          title: 'Warm-up',
          exercises: ['Shoulder Taps Plank', 'Standing Knee Raise', 'High Knees'],
          color: '#FF6B35',
          rest: '20 seconds between exercises',
        },
        {
          title: 'Workout',
          exercises: ['Push-up', 'Shoulder Press', 'High Plank Hold', 'Side Plank'],
          color: '#FF8C42',
          rest: '40 seconds between sets',
        },
        {
          title: 'Finisher',
          exercises: ['Jumping Jacks', 'Push-up Hold'],
          color: '#FFA726',
          rest: 'No rest',
        },
        {
          title: 'Cool-down',
          exercises: ['Side Bend', 'Hamstring Mobility'],
          color: '#FFB74D',
          rest: 'Hold each stretch for 30 seconds',
        },
      ],
    },
    {
      day: 'Wednesday',
      title: 'Core & Stability',
      sections: [
        {
          title: 'Warm-up',
          exercises: ['Tuck Hold', 'Side Bends', 'Ski Jumps'],
          color: '#FF6B35',
          rest: '20 seconds between exercises',
        },
        {
          title: 'Workout',
          exercises: ['Oblique Crunches', 'Crunches', 'Plank Shoulder Taps', 'Side Plank'],
          color: '#FF8C42',
          rest: '40 seconds between sets',
        },
        {
          title: 'Finisher',
          exercises: ['High Knees', 'Tuck Hold'],
          color: '#FFA726',
          rest: 'No rest',
        },
        {
          title: 'Cool-down',
          exercises: ['Reverse Sit to Table Top', 'Jefferson Curl'],
          color: '#FFB74D',
          rest: 'Hold each stretch for 30 seconds',
        },
      ],
    },
    {
      day: 'Thursday',
      title: 'Full Body Balance & Mobility',
      sections: [
        {
          title: 'Warm-up',
          exercises: ['Jumping Jacks', 'Standing Hamstring Mobility', 'Side Bend'],
          color: '#FF6B35',
          rest: '20 seconds between exercises',
        },
        {
          title: 'Workout',
          exercises: ['Skater Hops', 'Side Lunge', 'High Plank', 'Shoulder Press'],
          color: '#FF8C42',
          rest: '40 seconds between sets',
        },
        {
          title: 'Finisher',
          exercises: ['Ski Jumps', 'Reverse Sit to Table Top'],
          color: '#FFA726',
          rest: 'No rest',
        },
        {
          title: 'Cool-down',
          exercises: ['Hamstring Mobility', 'Jefferson Curl'],
          color: '#FFB74D',
          rest: 'Hold each stretch for 30 seconds',
        },
      ],
    },
    {
      day: 'Friday',
      title: 'Cardio & Burnout',
      sections: [
        {
          title: 'Warm-up',
          exercises: ['High Knees', 'Jumping Jacks', 'Glutes Bridge'],
          color: '#FF6B35',
          rest: '20 seconds between exercises',
        },
        {
          title: 'Workout',
          exercises: ['Air Squat', 'Push-up', 'Crunches', 'Shoulder Taps', 'Oblique Crunches'],
          color: '#FF8C42',
          rest: '40 seconds between sets',
        },
        {
          title: 'Finisher',
          exercises: ['Jumps', 'Tuck Hold'],
          color: '#FFA726',
          rest: 'No rest',
        },
        {
          title: 'Cool-down',
          exercises: ['Side Bend', 'Standing Hamstring Mobility'],
          color: '#FFB74D',
          rest: 'Hold each stretch for 30 seconds',
        },
      ],
    },
    // Add more days here
  ];

  // --- Today's Plan Logic ---
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, ...
  
  // Check if it's weekend (Saturday=6, Sunday=0)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // Select plan based on day (Monday=1, Tuesday=2, etc.)
  let planIndex = 0; // Default to Monday
  if (dayOfWeek === 1) planIndex = 0; // Monday
  else if (dayOfWeek === 2) planIndex = 1; // Tuesday
  else if (dayOfWeek === 3) planIndex = 2; // Wednesday
  else if (dayOfWeek === 4) planIndex = 3; // Thursday
  else if (dayOfWeek === 5) planIndex = 4; // Friday
  // Add more days as we add them
  
  const todaysPlan = isWeekend ? null : (weeklyPlans[planIndex] || weeklyPlans[0]); // null for weekend

  // --- Today's Plan Section State ---
  const todaysPlanSections = isWeekend ? [] : todaysPlan.sections;

  // Payment success handler
  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setPremiumStatusRefresh(prev => prev + 1); // Force refresh premium status
  };

  // Drawer functions
  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.timing(drawerAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnimation, {
      toValue: -SCREEN_WIDTH * 0.75,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setDrawerVisible(false);
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle play button press for premium features
  const handlePlayButtonPress = (planId: string) => {
    // Check if user has premium access
    const checkPremiumStatus = async () => {
      try {
        const authToken = await AsyncStorage.getItem('accessToken');
        if (!authToken) {
          setShowPaymentModal(true);
          return;
        }

        // Check current user's premium status
        const response = await fetch(`${BASE_URL}/users/current-user`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          const user = userData.data.user;
          
          console.log('🔍 User premium status:', user.isPremium);
          console.log('🔍 User premium data:', user.premium);
          
          if (user.isPremium && user.premium) {
            // Check if subscription is still valid
            const expiryDate = new Date(user.premium.endDate);
            const now = new Date();
            
            if (expiryDate > now) {
              // User has active premium, proceed to workout
              console.log('✅ User has active premium subscription');
              const selectedPlan = planData.find(plan => plan.id === planId);
              if (selectedPlan) {
                setSelectedPlan(selectedPlan);
                setShowPlanModal(true);
              }
              return;
            } else {
              console.log('❌ Premium subscription expired');
              setShowPaymentModal(true);
              return;
            }
          } else {
            console.log('❌ User is not premium');
            setShowPaymentModal(true);
            return;
          }
        } else {
          console.log('❌ Failed to get user data');
          setShowPaymentModal(true);
          return;
        }
      } catch (error) {
        console.error('❌ Error checking premium status:', error);
        setShowPaymentModal(true);
        return;
      }
    };

    checkPremiumStatus();
  };

  const handleTodaysPlanPress = async () => {
    // Check if user has premium access
    const checkPremiumStatus = async () => {
      try {
        const authToken = await AsyncStorage.getItem('accessToken');
        if (!authToken) {
          setShowPaymentModal(true);
          return;
        }

        // Check current user's premium status
        const response = await fetch(`${BASE_URL}/users/current-user`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          const user = userData.data.user;
          
          if (user.isPremium && user.premium) {
            // Check if subscription is still valid
            const expiryDate = new Date(user.premium.endDate);
            const now = new Date();
            
            if (expiryDate > now) {
              // User has active premium, proceed to workout
              setShowTodaysPlanModal(true);
              return;
            } else {
              console.log('❌ Premium subscription expired');
              setShowPaymentModal(true);
              return;
            }
          } else {
            console.log('❌ User is not premium');
            setShowPaymentModal(true);
            return;
          }
        } else {
          console.log('❌ Failed to get user data');
          setShowPaymentModal(true);
          return;
        }
      } catch (error) {
        console.error('❌ Error checking premium status:', error);
        setShowPaymentModal(true);
        return;
      }
    };

    checkPremiumStatus();
  };

  return (
    <SafeAreaView style={[styles.safeArea, isNightMode && { backgroundColor: '#111' }]}>
      <ScrollView contentContainerStyle={[styles.mainContainer, { flexGrow: 1, paddingBottom: Platform.OS === 'ios' ? 120 : 80 }, isNightMode && { backgroundColor: '#111' }]}>
      {isLoading && <ActivityIndicator size="large" color="#C4A484" />}
      
        {/* Credit Counter at Top Right (restored) */}
      <View style={styles.creditCounterContainer}>
  {creditLoading ? (
    <ActivityIndicator size="small" color="#FFD700" />
  ) : (
    <Text style={styles.creditCounterText}>
      {creditScore} <Text style={{ fontSize: 22, color: '#4CAF50' }}>🪙</Text>
    </Text>
  )}
      </View>

      {/* Header Section - Remove logo and welcome text */}
      {/* <View style={styles.headerContainer}>
        <Image 
            source={require('./assets/logo1.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>Welcome to </Text>
          <View style={{ flexDirection: 'row' }}>
            <Text style={[styles.titleText, { color: 'white' }]}>Ar</Text>
            <Text style={[styles.titleText, { color: '#E08714' }]}>thlete</Text>
            <Text style={[styles.titleText, { color: 'white' }]}> AI Experience</Text>
          </View>
        </View> */}

      {/* Profile Button and Motivational Quote */}
      <View style={styles.profileSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsNightMode((prev) => !prev)}
              style={{
                backgroundColor: isNightMode ? '#222' : '#FFA726',
                borderRadius: 20,
                padding: 8,
                marginLeft: 10,
                borderWidth: 2,
                borderColor: '#FFA726',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 18 }}>🌙</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.motivationalQuote, isNightMode && { color: '#fff' }]}>
          "Push, because no one else is going to do it for you."
        </Text>
          {/* Removed: Carousel banners below feature buttons */}
          {/* <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.carouselContainer}
          contentContainerStyle={styles.carouselContent}
          pagingEnabled
        >
          <View style={[styles.bannerContainer, { width: SCREEN_WIDTH - 40, marginRight: 10 }]}> 
            <Text style={styles.bannerTitle}>Welcome to Arthlete!</Text>
            <Text style={styles.bannerSubtitle}>Start your fitness journey today.</Text>
          </View>
          <View style={[styles.bannerContainer, { width: SCREEN_WIDTH - 40, marginRight: 10 }]}> 
            <Text style={styles.bannerTitle}>Earn Rewards</Text>
            <Text style={styles.bannerSubtitle}>Complete workouts to collect coins.</Text>
          </View>
          <View style={[styles.bannerContainer, { width: SCREEN_WIDTH - 40 }]}> 
            <Text style={styles.bannerTitle}>Join the Community</Text>
            <Text style={styles.bannerSubtitle}>Connect and compete with friends.</Text>
          </View>
          </ScrollView> */}
      </View>

        {/* New Section: Fitness Metrics */}
        <View style={styles.fitnessMetricsSection}>
          <View style={styles.fitnessMetricsHeader}>
            <Text style={[styles.fitnessMetricsTitle, isNightMode && { color: '#fff' }]}>Fitness Metrics</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricsCarousel}>
            <View style={styles.metricsCarouselContent}>
              {/* Score Card */}
              <View style={[styles.metricCard, styles.scoreCard, { borderColor: isNightMode ? '#fff' : '#000', borderWidth: 1 }]}>
                <Text style={styles.metricCardTitle}>Score</Text>
                {/* Bar chart visualization */}
                <View style={styles.barChartContainer}>
                  <View style={[styles.bar, { height: '40%' }]}></View>
                  <View style={[styles.bar, { height: '60%' }]}></View>
                  <View style={[styles.bar, { height: '80%' }]}></View>
                  <View style={[styles.bar, { height: '50%' }]}></View>
                  <View style={[styles.bar, { height: '70%' }]}></View>
                  <View style={[styles.bar, { height: '90%' }]}></View>
                  <View style={[styles.bar, { height: '75%' }]}></View>
                </View>
                <Text style={styles.metricCardValue}>{lastScorePercent} %</Text>
              </View>
              {/* Hydration Card */}
              <View style={[styles.metricCard, styles.hydrationCard, { borderColor: isNightMode ? '#fff' : '#000', borderWidth: 1 }]}>
                <Text style={styles.metricCardTitle}>No of Exercises Performed</Text>
                {/* Line graph visualization with two lines */}
                <View style={styles.lineGraphContainer}>
                   {/* Desired Outcome (Goal) Line */}
                   <View style={styles.goalLine}></View>
                   {/* User Input Line */}
                   <View style={styles.userInputLine}></View>
                </View>
                <Text style={styles.metricCardValue}>{performedCount}</Text>
              </View>
              {/* Calories Card */}
              <View style={[styles.metricCard, styles.caloriesCard, { borderColor: isNightMode ? '#fff' : '#000', borderWidth: 1 }]}>
                <Text style={styles.metricCardTitle}>Clean Reps Percentage</Text>
                 {/* Horizontal progress bar visualization */}
                 <View style={styles.progressBarContainer}>
                   <View style={[styles.progressBarFill, { width: '75%' }]}></View>{/* Example fill percentage */}
                 </View>
                <Text style={styles.metricCardValue}>{cleanPercent}%</Text>
              </View>
              {/* Add more metric cards here */}
        </View>
      </ScrollView>
        </View>

        {/* Today's Plan Section */}
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: isNightMode ? '#fff' : '#111', marginBottom: 16, marginTop: 0 }}>Today's Plan</Text>
        <TouchableOpacity
          style={{
            backgroundColor: isNightMode ? '#222' : '#fff',
            borderColor: '#000',
            borderWidth: 2,
            borderRadius: 12,
            padding: 20,
            marginHorizontal: 0,
            width: '100%',
            alignSelf: 'center',
            marginBottom: 24,
            minHeight: 100,
          }}
          onPress={isWeekend ? null : handleTodaysPlanPress}
          activeOpacity={isWeekend ? 1 : 0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View style={{ 
                backgroundColor: isWeekend ? '#666' : '#FF6B35', 
                borderRadius: 6, 
                paddingHorizontal: 10, 
                paddingVertical: 3, 
                alignSelf: 'flex-start',
                marginBottom: 8
              }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                  {isWeekend ? 'Rest Day' : `Day ${planIndex + 1}`}
                </Text>
              </View>
              <Text style={{ 
                fontWeight: '600', 
                fontSize: 18, 
                color: isNightMode ? '#fff' : '#333', 
                marginBottom: 4 
              }}>
                {isWeekend ? 'Take a Break' : todaysPlan.title}
              </Text>
              <Text style={{ 
                color: isNightMode ? '#ccc' : '#666', 
                fontSize: 14
              }}>
                {isWeekend ? 'Recover and recharge for next week' : `${todaysPlan.sections.length} sections · ${todaysPlan.sections.reduce((total, section) => total + section.exercises.length, 0)} exercises`}
              </Text>
            </View>
            <View style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: isWeekend ? '#666' : '#FF6B35'
            }}>
              {isWeekend ? (
                <Text style={{ color: '#fff', fontSize: 24 }}>😴</Text>
              ) : (
                <Image
                  source={require('../assets/PlayButton2.png')}
                  style={{ width: 20, height: 20 }}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        </TouchableOpacity>
        {/* Today's Plan Modal */}
        {showTodaysPlanModal && (
          <Modal
            visible={showTodaysPlanModal}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setShowTodaysPlanModal(false)}
          >
            <SafeAreaView style={{ flex: 1, backgroundColor: isNightMode ? '#111' : '#fff' }}>
              <View style={{ flex: 1 }}>
                {/* Header */}
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  backgroundColor: isNightMode ? '#111' : '#fff',
                  borderBottomWidth: 1,
                  borderBottomColor: isNightMode ? '#333' : '#e0e0e0'
                }}>
                  <TouchableOpacity
                    style={{ 
                      backgroundColor: isNightMode ? '#333' : '#f5f5f5', 
                      borderRadius: 20, 
                      width: 40, 
                      height: 40, 
                      justifyContent: 'center', 
                      alignItems: 'center' 
                    }}
                    onPress={() => setShowTodaysPlanModal(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 20, color: isNightMode ? '#fff' : '#333', fontWeight: '300' }}>×</Text>
                  </TouchableOpacity>
                  <Text style={{ 
                    fontSize: 20, 
                    fontWeight: '600', 
                    color: isNightMode ? '#fff' : '#333',
                    flex: 1,
                    textAlign: 'center',
                    marginRight: 40
                  }}>
                    Today's Plan
                  </Text>
                </View>

                <ScrollView 
                  contentContainerStyle={{ 
                    padding: 20, 
                    paddingBottom: 40 
                  }}
                  showsVerticalScrollIndicator={false}
                >
                  {todaysPlanSections.map((section, idx) => (
                    <View key={section.title} style={{ 
                      marginBottom: 20, 
                      backgroundColor: isNightMode ? '#222' : '#fff', 
                      borderRadius: 12, 
                      padding: 20, 
                      borderWidth: 2,
                      borderColor: '#000'
                    }}>
                      {/* Section Header */}
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ 
                          fontSize: 18, 
                          fontWeight: '600', 
                          color: section.color,
                          marginBottom: 4
                        }}>
                          {section.title}
                        </Text>
                        <Text style={{ 
                          color: isNightMode ? '#ccc' : '#666', 
                          fontSize: 14 
                        }}>
                          {section.description}
                        </Text>
                      </View>

                      {/* Rest Time */}
                      {section.rest && (
                        <View style={{ 
                          backgroundColor: isNightMode ? '#333' : '#f5f5f5', 
                          borderRadius: 6, 
                          padding: 8, 
                          marginBottom: 16,
                          borderLeftWidth: 3,
                          borderLeftColor: section.color
                        }}>
                          <Text style={{ 
                            color: isNightMode ? '#ccc' : '#666', 
                            fontSize: 13, 
                            fontWeight: '500'
                          }}>
                            {section.rest}
                          </Text>
                        </View>
                      )}

                      {/* Exercises List */}
                      <View style={{ marginBottom: 20 }}>
                        {section.exercises.map((ex, exIdx) => (
                          <View key={exIdx} style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            marginBottom: 8 
                          }}>
                            <View style={{ 
                              backgroundColor: section.color, 
                              borderRadius: 2, 
                              width: 4, 
                              height: 4, 
                              marginRight: 12 
                            }} />
                            <Text style={{ 
                              color: isNightMode ? '#fff' : '#333', 
                              fontSize: 15
                            }}>
                              {ex}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Start Button */}
                      <TouchableOpacity
                        style={{ 
                          backgroundColor: section.color, 
                          borderRadius: 8, 
                          paddingVertical: 14, 
                          alignItems: 'center'
                        }}
                        onPress={() => handleStartSection(section)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ 
                          color: '#fff', 
                          fontWeight: '500', 
                          fontSize: 16 
                        }}>
                          Start {section.title}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </SafeAreaView>
          </Modal>
        )}

        {/* New Section: Burn Calories Fast */}
        <PlanSection
          title="Burn Calories Fast"
          description="Designed to push your limits with intense movements that help melt fat and boost endurance."
          isNightMode={isNightMode}
        >
          <TouchableOpacity
            style={[styles.planContainer, { width: SCREEN_WIDTH * 0.8, overflow: 'hidden', backgroundColor: 'transparent', borderRadius: 15, padding: 0, justifyContent: 'flex-end' }]} 
            activeOpacity={0.8}
            onPress={() => handlePlayButtonPress('full-stack-fitness')}
            disabled={showPlanModal}
          >
            <Image source={planData[0].image} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 15 }} />
            <View style={{ position: 'absolute', left: 16, bottom: 16 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 4 }}>Full stack Fitness</Text>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, marginTop: 2, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 3 }}>10 Mins</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.planContainer, { width: SCREEN_WIDTH * 0.8, overflow: 'hidden', backgroundColor: 'transparent', borderRadius: 15, padding: 0, justifyContent: 'flex-end' }]} 
            activeOpacity={0.8}
            onPress={() => handlePlayButtonPress('fat-burner')}
            disabled={showPlanModal}
          >
            <Image source={planData[1].image} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 15 }} />
            <View style={{ position: 'absolute', left: 16, bottom: 16 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 4 }}>Fat Burner</Text>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, marginTop: 2, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 3 }}>10 mins</Text>
            </View>
          </TouchableOpacity>
        </PlanSection>

        {/* New Section: Plank & Mobility */}
        <PlanSection
          title="Plank & Mobility"
          description="Improve your core strength and stability with focused plank and mobility exercises."
          isNightMode={isNightMode}
        >
          {/* Plank & Core Stability Plan */}
          <TouchableOpacity
            style={[styles.planContainer, { width: SCREEN_WIDTH * 0.8, overflow: 'hidden', backgroundColor: 'transparent', borderRadius: 15, padding: 0, justifyContent: 'flex-end' }]} 
            activeOpacity={0.8}
            onPress={() => handlePlayButtonPress('plank-core-stability')}
            disabled={showPlanModal}
          >
            <Image source={require('../assets/plank1.png')} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 15 }} />
            <View style={{ position: 'absolute', left: 16, bottom: 16 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 4 }}>Plank & Core Stability</Text>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, marginTop: 2, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 3 }}>4 mins</Text>
            </View>
          </TouchableOpacity>
          {/* Mobility & Stretch Plan */}
          <TouchableOpacity
            style={[styles.planContainer, { width: SCREEN_WIDTH * 0.8, overflow: 'hidden', backgroundColor: 'transparent', borderRadius: 15, padding: 0, justifyContent: 'flex-end' }]} 
            activeOpacity={0.8}
            onPress={() => handlePlayButtonPress('mobility-stretch')}
            disabled={showPlanModal}
          >
            <Image source={require('../assets/jefferson.png')} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 15 }} />
            <View style={{ position: 'absolute', left: 16, bottom: 16 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 4 }}>Mobility & Stretch</Text>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, marginTop: 2, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 3 }}>5 mins</Text>
            </View>
          </TouchableOpacity>
        </PlanSection>

        {/* New Section: Cardio */}
        <PlanSection
          title="Cardio"
          description="Heart-pumping workouts to improve cardiovascular health, burn calories, and boost your endurance."
          isNightMode={isNightMode}
        >
          <TouchableOpacity
  style={[styles.planContainer, { width: SCREEN_WIDTH * 0.8, overflow: 'hidden', backgroundColor: 'transparent', borderRadius: 15, padding: 0, justifyContent: 'flex-end' }]}
  activeOpacity={0.8}
  onPress={() => handlePlayButtonPress('cardio-basic')}
  disabled={showPlanModal}
>
  <Image
    source={require('../assets/highknees.png')}
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
      borderRadius: 15
    }}
  />
  <View style={{ position: 'absolute', left: 16, bottom: 16 }}>
    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 }}>
      Cardio Basic
    </Text>
    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, marginTop: 2, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }}>
      8 mins
    </Text>
  </View>
</TouchableOpacity>

                          <TouchableOpacity
                                style={[styles.planContainer, { width: SCREEN_WIDTH * 0.8, overflow: 'hidden', backgroundColor: 'transparent', borderRadius: 15, padding: 0, justifyContent: 'flex-end' }]}
                                activeOpacity={0.8}
                                onPress={() => handlePlayButtonPress('cardio-hardcore')}
                                disabled={showPlanModal}
                            >
                              <Image
                                source={require('../assets/jumpingjack.png')}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  width: '100%',
                                  height: '100%',
                                  resizeMode: 'cover',
                                  borderRadius: 15
                                }}
                              />
                              <View style={{ position: 'absolute', left: 16, bottom: 16 }}>
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 }}>
                                  Cardio Hardcore
                                </Text>
                                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, marginTop: 2, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }}>
                                  12 mins
                                </Text>
                              </View>
        </TouchableOpacity>

        </PlanSection>

        {/* Move Modals outside ScrollView for iOS compatibility */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.18)' }}>
          <LinearGradient
            colors={["#f5f6fa", "#ffffff"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ width: '92%', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#b6c3e0', shadowOpacity: 0.10, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8, borderWidth: 2, borderColor: '#000' }}
          >
            {parsedSummaryData && parsedSummaryData.exercises && parsedSummaryData.exercises.length > 0 ? (() => {
              // Calculate overall clean % (sum time for time-based, reps for rep-based)
              let totalClean = 0;
              let totalPossible = 0;
              parsedSummaryData.exercises.forEach(ex => {
                const exerciseName = ex.exercise_info?.pretty_name || ex.exercise_info?.exercise_id || ex.pretty_name || ex.exercise_id || ex.name;
                const scoring = exerciseScoringMap[exerciseName] || { type: SMWorkoutLibrary.ScoringType.Reps };
                if (scoring.type === SMWorkoutLibrary.ScoringType.Time) {
                  totalClean += ex.time_in_position_perfect ?? ex.exercise_info?.time_in_position_perfect ?? 0;
                  totalPossible += ex.time_in_position ?? ex.exercise_info?.time_in_position ?? 0;
                } else {
                  totalClean += ex.reps_performed_perfect ?? ex.exercise_info?.reps_performed_perfect ?? 0;
                  totalPossible += ex.reps_performed ?? ex.exercise_info?.reps_performed ?? 0;
                }
              });
              const percent = totalPossible > 0 ? Math.round((totalClean / totalPossible) * 100) : 0;
              // Calculate average score
              const scores = parsedSummaryData.exercises.map(ex => ex.total_score ?? 0);
              const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
              if (parsedSummaryData && parsedSummaryData.exercises && parsedSummaryData.exercises.length > 0) {
                console.log('Summary exercises:', JSON.stringify(parsedSummaryData.exercises, null, 2));
              }
              return (
                <>
                  {/* Overall Summary: Clean Percentage and Score */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 32, paddingHorizontal: 0, maxWidth: '100%', gap: 16 }}>
                    {/* Clean Percentage Box */}
                    <LinearGradient
                      colors={["#f5f6fa", "#ffffff"]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={{ flex: 1, borderColor: '#000', borderWidth: 2, borderRadius: 22, padding: 24, alignItems: 'center', justifyContent: 'center', minWidth: 120, maxWidth: 160, minHeight: 160 }}
                    >
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#5b7cff', textAlign: 'center' }}>{percent}%</Text>
                      <Text style={{ fontSize: 14, color: '#7a8ca3', textAlign: 'center', fontWeight: '600' }}>Clean</Text>
                    </LinearGradient>
                    {/* Score Box */}
                    <LinearGradient
                      colors={["#f5f6fa", "#ffffff"]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={{ flex: 1, borderColor: '#000', borderWidth: 2, borderRadius: 22, padding: 24, alignItems: 'center', justifyContent: 'center', minWidth: 120, maxWidth: 160, minHeight: 160 }}
                    >
                      <Text style={{ color: '#7a8ca3', fontSize: 16, marginBottom: 8, fontWeight: '600', letterSpacing: 0.5 }}>Score</Text>
                      <Text style={{ color: '#5b7cff', fontSize: 36, fontWeight: 'bold', letterSpacing: 1 }}>{avgScore}</Text>
                    </LinearGradient>
                  </View>
                  {/* List each exercise with clean/total reps or time and score */}
                  <ScrollView style={{ width: '100%', maxHeight: 400 }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 24 }}>
                    {parsedSummaryData.exercises.length > 0 ? (
                      parsedSummaryData.exercises.map((ex, idx) => {
                        const exerciseName = ex.exercise_info?.pretty_name || ex.exercise_info?.exercise_id || ex.pretty_name || ex.exercise_id || ex.name;
                        const scoring = exerciseScoringMap[exerciseName] || { type: SMWorkoutLibrary.ScoringType.Reps };
                        let clean = 0, total = 0, cleanLabel = '', totalLabel = '';
                        if (scoring.type === SMWorkoutLibrary.ScoringType.Time) {
                          clean = ex.time_in_position_perfect ?? ex.exercise_info?.time_in_position_perfect ?? 0;
                          total = ex.time_in_position ?? ex.exercise_info?.time_in_position ?? 0;
                          cleanLabel = 'Clean Time (s)';
                          totalLabel = 'Total Time (s)';
                        } else {
                          clean = ex.reps_performed_perfect ?? ex.exercise_info?.reps_performed_perfect ?? 0;
                          total = ex.reps_performed ?? ex.exercise_info?.reps_performed ?? 0;
                          cleanLabel = 'Clean Reps';
                          totalLabel = 'Total Reps';
                        }
                        return (
                          <View key={idx} style={{ marginBottom: 24, alignItems: 'center', width: '100%' }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#222', marginBottom: 8 }}>{formatExerciseName(exerciseName)}</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                              <View style={{ alignItems: 'center', marginHorizontal: 18 }}>
                                <Text style={{ color: '#888', fontSize: 14 }}>{cleanLabel}</Text>
                                <Text style={{ color: '#222', fontSize: 22, fontWeight: 'bold' }}>{clean}</Text>
                              </View>
                              <View style={{ width: 1, height: 36, backgroundColor: '#000', marginHorizontal: 8 }} />
                              <View style={{ alignItems: 'center', marginHorizontal: 18 }}>
                                <Text style={{ color: '#888', fontSize: 14 }}>{totalLabel}</Text>
                                <Text style={{ color: '#222', fontSize: 22, fontWeight: 'bold' }}>{total}</Text>
                              </View>
                            </View>
                          </View>
                        );
                      })
                    ) : null}
                  </ScrollView>
                  {/* Close Button only */}
                  <TouchableOpacity
                    style={{ marginTop: 16, backgroundColor: '#f5f5f5', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 36, borderWidth: 1, borderColor: '#eee' }}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 18 }}>Close</Text>
                  </TouchableOpacity>
                </>
              );
            })() : (
              <Text style={styles.modalText}>{summaryMessage}</Text>
            )}
          </LinearGradient>
        </View>
      </Modal>

      {/* New Modal for Assessment Info */}
      <Modal
        transparent={true}
        visible={assessmentInfoModalVisible}
        animationType="slide"
        onRequestClose={() => setAssessmentInfoModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <ScrollView>
              <Text style={styles.modalTitle}>Assessment Exercises</Text>
              {currentAssessmentExercises.length > 0 ? (
                currentAssessmentExercises.map((exercise, index) => (
                  <View key={index} style={styles.exerciseInfoContainer}>
                    <Text style={styles.exerciseInfoName}>{exercise.name}</Text>
                    {exercise.description && <Text style={styles.exerciseInfoDescription}>{exercise.description}</Text>}
                  </View>
                ))
              ) : (
                <Text style={styles.modalText}>No exercise information available for this assessment type.</Text>
              )}
            </ScrollView>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.startButton]} // Reusing startButton style
                onPress={startAssessmentFromInfoModal}>
                <Text style={styles.buttonText}>Start Assessment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.closeButton]}
                onPress={() => setAssessmentInfoModalVisible(false)}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

        {/* Add the bottom modal for plan details */}
        <Modal
          visible={showPlanModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowPlanModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start' }}>
            <SafeAreaView style={{ flex: 1, backgroundColor: isNightMode ? '#111' : '#fff' }}>
              {selectedPlan && (
                <>
                  {/* Close Button */}
                  <TouchableOpacity
                    onPress={() => setShowPlanModal(false)}
                    style={{
                      position: 'absolute',
                      top: Platform.OS === 'android' ? 40 : 70,
                      right: 24,
                      zIndex: 10,
                      backgroundColor: '#fff',
                      borderRadius: 24,
                      width: 44,
                      height: 44,
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.12,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Text style={{ fontSize: 28, color: '#E53935', fontWeight: 'bold', lineHeight: 30 }}>×</Text>
                  </TouchableOpacity>
                  {/* Plan Image */}
                  <Image
                    source={selectedPlan.image}
                    style={{ width: '100%', height: 220, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderRadius: 0, resizeMode: 'cover' }}
                  />
                  {/* Plan Info Header and all modal content in a ScrollView */}
                  <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
                    <Text style={{ color: isNightMode ? '#fff' : '#111', fontSize: 26, fontWeight: 'bold', marginBottom: 8 }}>{selectedPlan.name}</Text>
                    <View style={{ flexDirection: 'row', marginTop: 8, marginBottom: 16, justifyContent: 'center', alignItems: 'center' }}>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: isNightMode ? '#fff' : '#111', fontWeight: 'bold', fontSize: 16 }}>{calculateWorkoutDetails(selectedPlan, selectedLevel).level}</Text>
                        <Text style={{ color: isNightMode ? '#aaa' : '#888', fontSize: 13 }}>Level</Text>
                      </View>
                      <Text style={{ color: isNightMode ? '#aaa' : '#888', fontSize: 18, marginHorizontal: 28, marginTop: 2 }}>|</Text>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: isNightMode ? '#fff' : '#111', fontWeight: 'bold', fontSize: 16 }}>{calculateWorkoutDetails(selectedPlan, selectedLevel).time}</Text>
                        <Text style={{ color: isNightMode ? '#aaa' : '#888', fontSize: 13 }}>Time</Text>
                      </View>
                      <Text style={{ color: isNightMode ? '#aaa' : '#888', fontSize: 18, marginHorizontal: 28, marginTop: 2 }}>|</Text>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: isNightMode ? '#fff' : '#111', fontWeight: 'bold', fontSize: 16 }}>{calculateWorkoutDetails(selectedPlan, selectedLevel).focusArea}</Text>
                        <Text style={{ color: isNightMode ? '#aaa' : '#888', fontSize: 13 }}>Focus Area</Text>
                      </View>
                    </View>
                    {/* Level Selection UI - moved here */}
                    <View style={{ marginBottom: 28 }}>
                      <Text style={{ fontSize: 18, fontWeight: '600', color: isNightMode ? '#fff' : '#000', marginBottom: 12 }}>
                        Select Level
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                        {['beginner', 'performer', 'advanced'].map((level) => (
                          <TouchableOpacity
                            key={level}
                            style={{
                              flex: 1,
                              minWidth: 0, // Important for iOS
                              marginHorizontal: 2,
                              padding: 12,
                              borderRadius: 8,
                              backgroundColor: selectedLevel === level ? '#2196F3' : isNightMode ? '#333' : '#f0f0f0',
                              alignItems: 'center',
                            }}
                            onPress={() => {
                              setSelectedLevel(level);
                              setStartDisabled(true);
                              setTimeout(() => setStartDisabled(false), 200);
                            }}
                          >
                            <Text
                              style={{
                                color: selectedLevel === level ? '#fff' : isNightMode ? '#fff' : '#000',
                                fontWeight: '600',
                                textTransform: 'capitalize',
                                textAlign: 'center',
                              }}
                              numberOfLines={1}
                              ellipsizeMode='tail'
                            >
                              {level === 'performer' ? 'Performer' : level.charAt(0).toUpperCase() + level.slice(1)}
                            </Text>
                            <Text
                              style={{
                                color: selectedLevel === level ? '#fff' : isNightMode ? '#aaa' : '#666',
                                fontSize: 12,
                                marginTop: 4,
                                textAlign: 'center',
                              }}
                              numberOfLines={1}
                              ellipsizeMode='tail'
                            >
                              {levelDurations[level]}s
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    {/* Exercises List */}
                    <Text style={{ color: isNightMode ? '#fff' : '#111', fontWeight: 'bold', fontSize: 20, marginBottom: 12 }}>Exercises ({selectedPlan.exercises.length})</Text>
                    {selectedPlan.exercises && Array.isArray(selectedPlan.exercises) && selectedPlan.exercises.map((ex, idx) => (
                      ex && ex.name ? (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
                          {/* Placeholder avatar for each exercise */}
                          <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: isNightMode ? '#222' : '#eee', marginRight: 16, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: isNightMode ? '#fff' : '#111', fontSize: 28 }}>{ex.name[0]}</Text>
                          </View>
                          <View>
                            <Text style={{ color: isNightMode ? '#fff' : '#111', fontWeight: 'bold', fontSize: 17 }}>{ex.name}</Text>
                            <Text style={{ color: isNightMode ? '#aaa' : '#888', fontSize: 15 }}>{ex.detail}</Text>
                          </View>
                        </View>
                      ) : null
                    ))}
                    {/* Disclaimer below the exercise list */}
                    <View style={{ marginTop: 18, marginBottom: 8 }}>
                      <Text style={{ color: isNightMode ? '#E53935' : '#B71C1C', fontSize: 14, textAlign: 'center', fontWeight: '600' }}>
                        Please keep your mobile phone on a stable surface (preferably on the ground) and step back and stand in the Frame.
                      </Text>
                    </View>
                  </ScrollView>
                  {/* Start Button */}
                  <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 24, backgroundColor: isNightMode ? '#111' : '#fff' }}>
                    <TouchableOpacity
                      style={{ backgroundColor: startDisabled ? '#90caf9' : '#2196F3', borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
                      disabled={startDisabled}
                      onPress={() => {
                        setStartDisabled(true);
                        setShowPlanModal(false);
                        setTimeout(async () => {
                          if (selectedPlan) {
                            // Check if user has premium access
                            const checkPremiumStatus = async () => {
                              try {
                                const authToken = await AsyncStorage.getItem('accessToken');
                                if (!authToken) {
                                  setShowPaymentModal(true);
                                  setStartDisabled(false);
                                  return;
                                }

                                // Check current user's premium status
                                const response = await fetch(`${BASE_URL}/users/current-user`, {
                                  headers: {
                                    'Authorization': `Bearer ${authToken}`
                                  }
                                });

                                if (response.ok) {
                                  const userData = await response.json();
                                  const user = userData.data.user;
                                  
                                  if (user.isPremium && user.premium) {
                                    // Check if subscription is still valid
                                    const expiryDate = new Date(user.premium.endDate);
                                    const now = new Date();
                                    
                                    if (expiryDate > now) {
                                      // User has active premium, proceed with workout
                                      console.log('✅ User has active premium subscription');
                                      // Proceed with workout logic here
                                      // Use selectedPlan and selectedLevel for any plan
                                      const customExercises = selectedPlan.exercises.map((exercise, idx) => {
                                        const scoring = exerciseScoringMap[exercise.name] || { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] };
                                        // Special handling for Plank & Core Stability exercises
                                        if (["High Plank", "Side Plank", "Tuck Hold", "Plank", "Hamstring mobility", "Standing hamstring mobility", "Side bend", "Standing knee raises", "Jefferson curl"].includes(exercise.name)) {
                                          const scoring = exerciseScoringMap[exercise.name];
                                          // Set correct video instruction names for hamstring exercises
                                          let videoInstruction = exerciseIdMap[exercise.name];
                                          if (exercise.name === "Hamstring mobility") {
                                            videoInstruction = "HamstringMobility";
                                          } else if (exercise.name === "Standing hamstring mobility") {
                                            videoInstruction = "StandingHamstringMobility";
                                          }
                                          return new SMWorkoutLibrary.SMAssessmentExercise(
                                            exerciseIdMap[exercise.name],
                                            exercise.duration[selectedLevel],
                                            videoInstruction,
                                            null,
                                            scoring.ui,
                                            exerciseIdMap[exercise.name],
                                            '',
                                            new SMWorkoutLibrary.SMScoringParams(
                                              scoring.type,
                                              0.3,
                                              scoring.type === SMWorkoutLibrary.ScoringType.Time ? exercise.duration[selectedLevel] : null,
                                              scoring.type === SMWorkoutLibrary.ScoringType.Reps ? exercise.reps[selectedLevel] : null,
                                              null,
                                              null
                                            ),
                                            '',
                                            exercise.name,
                                            scoring.type === SMWorkoutLibrary.ScoringType.Time ? 'Hold the position' : 'Complete the exercise',
                                            scoring.type === SMWorkoutLibrary.ScoringType.Time ? 'Time' : 'Reps',
                                            scoring.type === SMWorkoutLibrary.ScoringType.Time ? 'seconds held' : 'clean reps'
                                          );
                                        } else {
                                          return new SMWorkoutLibrary.SMAssessmentExercise(
                                            exerciseIdMap[exercise.name] || exercise.name.replace(/\s+/g, ''),
                                            exercise.duration[selectedLevel],
                                            exerciseIdMap[exercise.name] || exercise.name.replace(/\s+/g, ''),
                                            null,
                                            scoring.ui,
                                            exerciseIdMap[exercise.name] || exercise.name.replace(/\s+/g, ''),
                                            '',
                                            new SMWorkoutLibrary.SMScoringParams(
                                              scoring.type,
                                              0.3,
                                              scoring.type === SMWorkoutLibrary.ScoringType.Time ? exercise.duration[selectedLevel] : null,
                                              scoring.type === SMWorkoutLibrary.ScoringType.Reps ? exercise.reps[selectedLevel] : null,
                                              null,
                                              null
                                            ),
                                            '',
                                            exercise.name,
                                            scoring.type === SMWorkoutLibrary.ScoringType.Time ? 'Hold the position' : 'Complete the exercise',
                                            scoring.type === SMWorkoutLibrary.ScoringType.Time ? 'Time' : 'Reps',
                                            scoring.type === SMWorkoutLibrary.ScoringType.Time ? 'seconds held' : 'clean reps'
                                          );
                                        }
                                      });
                                      const customWorkout = new SMWorkoutLibrary.SMWorkout(
                                        selectedPlan.name.toLowerCase().replace(/\s+/g, '-'),
                                        selectedPlan.name,
                                        null,
                                        null,
                                        customExercises,
                                        null,
                                        null,
                                        null
                                      );
                                      try {
                                        const result = await startCustomAssessment(customWorkout, null, true, false);
                                        
                                        // Add a small delay before showing the summary modal
                                        await new Promise(resolve => setTimeout(resolve, 1000));
                                        
                                        setSummaryMessage(result.summary);
                                        const parsed = JSON.parse(result.summary);
                                        setParsedSummaryData(parsed);
                                        setModalVisible(true);
                                      } catch (e) {
                                        Alert.alert('Assessment Error', e.message);
                                      }
                                    } else {
                                      console.log('❌ Premium subscription expired');
                                      setShowPaymentModal(true);
                                      setStartDisabled(false);
                                      return;
                                    }
                                  } else {
                                    console.log('❌ User is not premium');
                                    setShowPaymentModal(true);
                                    setStartDisabled(false);
                                    return;
                                  }
                                } else {
                                  console.log('❌ Failed to get user data');
                                  setShowPaymentModal(true);
                                  setStartDisabled(false);
                                  return;
                                }
                              } catch (error) {
                                console.error('❌ Error checking premium status:', error);
                                setShowPaymentModal(true);
                                setStartDisabled(false);
                                return;
                              }
                            };

                            checkPremiumStatus();
                          }
                          setStartDisabled(false);
                        }, 1000);
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>Start</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </SafeAreaView>
          </View>
        </Modal>

        {/* Payment Modal */}
        <RazorpayPayment
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />

        {/* Slide-out Drawer */}
        {/* (Drawer removed) */}

      </ScrollView>
    </SafeAreaView>
  );

  async function configureSMKitUI() {
    setIsLoading(true);
    try {
      
      var res = await configure("public_live_ENl0bawcspDkVlGFaB");
      console.log("Configuration successful:", res);
      setIsLoading(false);
      setDidConfig(true);
    } catch (e) {
      setIsLoading(false);
      Alert.alert('Configure Failed', e.message, [{ text: 'OK', onPress: () => console.log('OK Pressed') }]);
    }
  }

  async function startWorkoutProgramSession() {
    try {
      const parsedWeek = parseInt(week, 10);
      if (isNaN(parsedWeek)) {
        throw new Error('Invalid week number');
      }
      var config = new SMWorkoutLibrary.WorkoutConfig(
        parsedWeek,
        bodyZone,
        difficulty,
        duration,
        language,
        name,
      );
      var result = await startWorkoutProgram(config);
      console.log(result.summary);
      console.log(result.didFinish);
    } catch (e) {
      Alert.alert('Unable to start workout program', e.message, [{ text: 'OK', onPress: () => console.log('OK Pressed') }]);
    }
  }
  async function startAssessmentSession(
    type: SMWorkoutLibrary.AssessmentTypes,
    showSummary: boolean,
    customAssessmentID: string
  ) {
    try {
      console.log('Starting assessment with type:', type);
      const result = await startAssessment(
        type,
        showSummary,
        null,
        false,
        customAssessmentID
      );
      console.log('Assessment result:', result.summary);
      console.log('Did finish:', result.didFinish);
      // Set summary and show modal directly (cross-platform)
      setSummaryMessage(result.summary);
      let parsed: any = null;
      try {
        parsed = JSON.parse(result.summary);
        setParsedSummaryData(parsed);
      } catch (e) {
        setParsedSummaryData(null);
      }
      setModalVisible(true);
    } catch (e) {
      console.error('Assessment error:', e);
      Alert.alert('Unable to start assessment', e.message);
    }
  }

  async function startSMKitUICustomWorkout() {
    try {
      var exercises = [
        new SMWorkoutLibrary.SMAssessmentExercise(
          'SquatRegularOverheadStatic',
          30,
          'SquatRegularOverheadStatic',
          null,
          [
            SMWorkoutLibrary.UIElement.GaugeOfMotion,
            SMWorkoutLibrary.UIElement.Timer,
          ],
          'SquatRegularOverheadStatic',
          'stam',
          new SMWorkoutLibrary.SMScoringParams(
            SMWorkoutLibrary.ScoringType.Time,
            0.5,
            20,
            null,
            null,
            null,
          ),
          '',
          'SquatRegularOverheadStatic',
          'Subtitle',
          'timeInPosition',
          'clean reps'
        ),
        new SMWorkoutLibrary.SMAssessmentExercise(
          'Jefferson Curl',
          30,
          'JeffersonCurlRight',
          null,
          [
            SMWorkoutLibrary.UIElement.GaugeOfMotion,
            SMWorkoutLibrary.UIElement.Timer,
          ],
          'JeffersonCurlRight',
          'stam',
          new SMWorkoutLibrary.SMScoringParams(
            SMWorkoutLibrary.ScoringType.Time,
            0.5,
            20,
            null,
            null,
            null,
          ),
          '',
          'JeffersonCurlRight',
          'Subtitle',
          'timeInPosition',
          'clean reps'
        ),
        new SMWorkoutLibrary.SMAssessmentExercise(
          'Push-Up',
          30,
          'PushupRegular',
          null,
          [
            SMWorkoutLibrary.UIElement.RepsCounter,
            SMWorkoutLibrary.UIElement.Timer,
          ],
          'PushupRegular',
          'stam',
          new SMWorkoutLibrary.SMScoringParams(
            SMWorkoutLibrary.ScoringType.Reps,
            0.5,
            null,
            6,
            null,
            null,
          ),
          '',
          'PushupRegular',
          'Subtitle',
          'Reps',
          'clean reps'
        ),
        new SMWorkoutLibrary.SMAssessmentExercise(
          'LungeFrontRight',
          30,
          'LungeFrontRight',
          null,
          [
            SMWorkoutLibrary.UIElement.GaugeOfMotion,
            SMWorkoutLibrary.UIElement.Timer,
          ],
          'LungeFront',
          'stam',
          new SMWorkoutLibrary.SMScoringParams(
            SMWorkoutLibrary.ScoringType.Reps,
            0.5,
            null,
            20,
            null,
            null,
          ),
          '',
          'LungeFrontRight',
          'Subtitle',
          'timeInPosition',
          'clean reps'
        ),
        new SMWorkoutLibrary.SMAssessmentExercise(
          'LungeFrontLeft',
          30,
          'LungeFrontLeft',
          null,
          [
            SMWorkoutLibrary.UIElement.GaugeOfMotion,
            SMWorkoutLibrary.UIElement.Timer,
          ],
          'LungeFront',
          'stam',
          new SMWorkoutLibrary.SMScoringParams(
            SMWorkoutLibrary.ScoringType.Reps,
            0.5,
            null,
            20,
            null,
            null,
          ),
          '',
          'LungeFrontLeft',
          'Subtitle',
          'timeInPosition',
          'clean reps'
        ),
      ];

      var assessment = new SMWorkoutLibrary.SMWorkout(
        '50',
        'demo workout',
        null,
        null,
        exercises,
        null,
        null,
        null,
      );

      var result = await startCustomWorkout(assessment);
      console.log(result.summary);
      console.log(result.didFinish);
    } catch (e) {
      console.error(e);
      showAlert('Custom workout error', e.message);
    }
  }

  async function startSMKitUICustomAssessment() {
    try {
      // Set language and preferences first
      await setSessionLanguage(SMWorkoutLibrary.Language.Hebrew);
      setEndExercisePreferences(SMWorkoutLibrary.EndExercisePreferences.TargetBased);
      setCounterPreferences(SMWorkoutLibrary.CounterPreferences.PerfectOnly);

      // Optional: Use local sound files instead of URLs
      const successSound = '';  // Remove URL and use local file or leave empty
      const failedSound = '';   // Remove URL and use local file or leave empty

      const exercises = [
        new SMWorkoutLibrary.SMAssessmentExercise(
          'SquatRegular',
          35,
          'SquatRegular',
          null,
          [
            SMWorkoutLibrary.UIElement.RepsCounter,
            SMWorkoutLibrary.UIElement.Timer,
          ],
          'SquatRegular',
          successSound,
          new SMWorkoutLibrary.SMScoringParams(
            SMWorkoutLibrary.ScoringType.Reps,
            0.3,
            null,
            5,
            null,
            null,
          ),
          failedSound,
          'SquatRegular',
          'Subtitle',
          'Reps',
          'clean reps'
        ),
        new SMWorkoutLibrary.SMAssessmentExercise(
          'LungeFront',
          35,
          'LungeFront',
          null,
          [
            SMWorkoutLibrary.UIElement.RepsCounter,
            SMWorkoutLibrary.UIElement.Timer,
          ],
          'LungeFront',
          successSound,
          new SMWorkoutLibrary.SMScoringParams(
            SMWorkoutLibrary.ScoringType.Reps,
            0.3,
            null,
            5,
            null,
            null,
          ),
          failedSound,
          'LungeFront',
          'Subtitle',
          'Reps',
          'clean reps'
        ),
        new SMWorkoutLibrary.SMAssessmentExercise(
          'HighKnees',
          35,
          'HighKnees',
          null,
          [
            SMWorkoutLibrary.UIElement.RepsCounter,
            SMWorkoutLibrary.UIElement.Timer,
          ],
          'HighKnees',
          successSound,
          new SMWorkoutLibrary.SMScoringParams(
            SMWorkoutLibrary.ScoringType.Reps,
            0.3,
            null,
            5,
            null,
            null,
          ),
          failedSound,
          'HighKnees',
          'Subtitle',
          'Reps',
          'clean reps'
        ),
        new SMWorkoutLibrary.SMAssessmentExercise(
          'SquatRegularOverheadStatic',
          35,
          'SquatRegularOverheadStatic',
          null,
          [
            SMWorkoutLibrary.UIElement.RepsCounter,
            SMWorkoutLibrary.UIElement.Timer,
          ],
          'SquatRegularOverheadStatic',
          successSound,
          new SMWorkoutLibrary.SMScoringParams(
            SMWorkoutLibrary.ScoringType.Time,
            0.3,
            15,
            null,
            null,
            null,
          ),
          failedSound,
          'SquatRegularOverheadStatic',
          'Subtitle',
          'Time',
          'seconds held'
        ),
        new SMWorkoutLibrary.SMAssessmentExercise(
          'PlankHighStatic',
          35,
          'PlankHighStatic',
          null,
          [
            SMWorkoutLibrary.UIElement.RepsCounter,
            SMWorkoutLibrary.UIElement.Timer,
          ],
          'PlankHighStatic',
          successSound,
          new SMWorkoutLibrary.SMScoringParams(
            SMWorkoutLibrary.ScoringType.Time,
            0.3,
            15,
            null,
            null,
            null,
          ),
          failedSound,
          'PlankHighStatic',
          'Subtitle',
          'Time',
          'seconds held'
        ),
        new SMWorkoutLibrary.SMAssessmentExercise(
          'StandingSideBendRight',
          35,
          'StandingSideBendRight',
          null,
          [
            SMWorkoutLibrary.UIElement.RepsCounter,
            SMWorkoutLibrary.UIElement.Timer,
          ],
          'StandingSideBendRight',
          successSound,
          new SMWorkoutLibrary.SMScoringParams(
            SMWorkoutLibrary.ScoringType.Time,
            0.3,
            15,
            null,
            null,
            null,
          ),
          failedSound,
          'StandingSideBendRight',
          'Subtitle',
          'Time',
          'seconds held'
        ),
      ];

      var assessment = new SMWorkoutLibrary.SMWorkout(
        '50',
        'demo workout',
        null,
        null,
        exercises,
        null,
        null,
        null,
      );

      var result = await startCustomAssessment(assessment, null, true, false);
      console.log('Assessment result:', result.summary);
      console.log('Did finish:', result.didFinish);
    } catch (e) {
      console.error('Custom assessment error:', e);
      showAlert('Custom assessment error', e.message);
    }
  }
};

function showAlert(title, message) {
  Alert.alert(title, message, [
    { text: 'OK', onPress: () => console.log('OK Pressed') },
  ]);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContainer: {
    backgroundColor: '#fff',
    padding: '5%', // Use a single padding property for consistency
    paddingBottom: Platform.OS === 'ios' ? 120 : 80, // Add extra padding for bottom navigation bar + safe area
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    color: '#000000', // Black text for visibility on white background
  },
  personalizedPlansText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'left',
    marginTop: -80,
    marginBottom: 15,
    // Removed paddingHorizontal: '5%',
  },
  headerContainer: {
    marginTop: '2%',
    marginBottom: '4%',
  },
  logo: {
    width: '20%',
    height: undefined,
    aspectRatio: 1,
    marginBottom: 0,
    borderRadius: 20,
  },
  welcomeText: {
    marginRight: 10,
    fontSize: 24,
    color: '#FF9800', // Orange text
    opacity: 0.85,
  },
  titleText: {
    fontSize:27,
    color: '#FF9800', // Orange text
    fontWeight: 'bold',
  },
  categoryScrollContainer: {
    flex: 1,
    marginBottom: 10,
  },
  categoryContainer: {
    width: '100%',
  },
  categoryButton: {
    width: '100%',
    height: '8%',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFE5B4', // Light orange border
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '5%',
    marginBottom: '2%',
    backgroundColor: '#FFF7ED', // Very light orange background
  },
  categoryText: {
    color: '#FF9800', // Orange text
    fontSize: 18,
    textAlign: 'center',
  },
  instructionText: {
    color: '#FFA726', // Orange accent
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
  },
  exerciseScrollContainer: {
    flex: 1,
    marginBottom: 10,
  },
  exerciseContainer: {
    width: '100%',
  },
  exerciseButton: {
    width: '100%',
    height: '8%',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFE5B4', // Light orange border
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '5%',
    marginBottom: '2%',
    backgroundColor: '#FFF7ED', // Very light orange background
  },
  exerciseText: {
    color: '#FF9800', // Orange text
    fontSize: 18,
    textAlign: 'center',
  },
  bottomContainer: {
    marginTop: '2%',
    paddingBottom: '2%',
  },
  startButton: {
    width: '100%',
    height: '8%',
    borderRadius: 25,
    backgroundColor: '#FFA726', // Orange
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '2%',
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  learnMoreText: {
    color: '#FFA726',
    fontSize: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFF7ED', // Very light orange
    borderRadius: 10,
    padding: '5%',
    elevation: 5,
    borderColor: '#FFA726',
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 15,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFA726',
    marginTop: 10,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#FFA726',
    paddingBottom: 3,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'left',
    color: '#FF9800',
    fontSize: 14,
  },
  modalDataText: {
    color: '#FFA726',
    fontSize: 14,
    marginBottom: 4,
  },
  exerciseContainerModal: {
    backgroundColor: '#FFE5B4', // Light orange
    borderRadius: 8,
    padding: '3%',
    marginBottom: '2%',
    borderColor: '#FFA726',
    borderWidth: 0.5,
  },
  exerciseTitleModal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#FFA726',
    borderRadius: 5,
    padding: 10,
    width: '45%',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#FF7043', // Deeper orange for close
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  selectedExercise: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)', // Light orange highlight
    borderColor: '#FFA726',
  },
  disabledButton: {
    opacity: 0.5,
  },
  creditCounterContainer: {
    position: 'absolute',
    top: '3%',
    right: '5%',
    backgroundColor: '#fff', // White background
    borderRadius: 20,
    paddingHorizontal: '6%',
    paddingVertical: '2%',
    zIndex: 2,
    elevation: 6,
    shadowColor: '#FFA726', // Orange shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#FFA726', // Orange border
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditCounterText: {
    color: '#FF9800', // Orange text
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  analysisContainer: {
    backgroundColor: '#FFE5B4', // Light orange
    borderRadius: 8,
    padding: '3%',
    marginBottom: '2%',
    borderColor: '#FFA726',
    borderWidth: 0.5,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 5,
  },
  analysisText: {
    color: '#FFA726',
    fontSize: 14,
    marginBottom: 4,
  },
  restartContainer: {
    backgroundColor: '#FFA726',
    borderRadius: 8,
    padding: '3%',
    marginTop: '3%',
    marginBottom: '2%',
  },
  restartText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  // New styles for assessment info modal
  exerciseInfoContainer: {
    backgroundColor: '#FFE5B4', // Light orange
    borderRadius: 8,
    padding: '3%',
    marginBottom: '2%',
    borderColor: '#FFA726',
    borderWidth: 0.5,
  },
  exerciseInfoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 5,
  },
  exerciseInfoDescription: {
    color: '#FFA726',
    fontSize: 14,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: '4%',
  },
  profileSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: '4%',
    marginTop: '2%',
  },
  profileButton: {
    width: '12%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: '#FFA726',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '1.5%',
  },
  profileIcon: {
    color: 'white',
    fontSize: 24,
  },
  motivationalQuote: {
    color: '#000000',
    fontSize: 16,
    maxWidth: '60%',
    textAlign: 'left',
    marginBottom: 4,
  },
  featureButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center', // Center horizontally
    alignItems: 'center',
    marginTop: '2%',
    marginBottom: '1.5%',
    width: '100%',
    gap: 0,
  },
  featureButton: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 16,
    marginHorizontal: 3, // Reduced gap
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
    paddingVertical: '2%',
    paddingHorizontal: '1%',
  },
  featureButtonRanks: {
    backgroundColor: '#FFE5B4', // Light orange
    borderColor: '#FFA726', // Orange
    shadowColor: '#FFA726',
  },
  featureButtonProgress: {
    backgroundColor: '#FFEBEE', // Light red
    borderColor: '#E53935', // Red
    shadowColor: '#E53935',
  },
  featureButtonTracker: {
    backgroundColor: '#E8F5E9', // Light green
    borderColor: '#66BB6A', // Green
    shadowColor: '#66BB6A',
  },
  featureButtonCommunity: {
    backgroundColor: '#E3F2FD', // Light blue
    borderColor: '#1976D2', // Blue
    shadowColor: '#1976D2',
  },
  featureButtonSelected: {
    borderColor: '#FF9800', // Deeper orange accent for selected
    shadowColor: '#FF9800',
    shadowOpacity: 0.18,
    elevation: 4,
  },
  featureIcon: {
    fontSize: 24, // Slightly smaller
    marginBottom: 4,
    color: '#FF9800', // Orange accent
    textAlign: 'center',
  },
  featureLabel: {
    color: '#000000', // Orange text for theme
    fontSize: 12, // Slightly smaller
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15, // Adjusted for smaller font
  },
  carouselContainer: {
    marginTop: '2%',
    marginBottom: '2%',
    width: '100%',
    minHeight: '25%',
  },
  carouselContent: {
    alignItems: 'center',
    paddingLeft: 0,
    paddingRight: 8,
  },
  bannerContainer: {
    backgroundColor: '#45B0A4',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: '#E08714',
    lineHeight: 22,
  },
  plansCarousel: {
    marginTop: 0, // Ensure no space above the carousel
    marginBottom: 0,
    paddingVertical: 0,
    marginVertical: 0,
  },
  plansCarouselContent: {
    flexDirection: 'row',
    // Removed paddingLeft: '5%', // Rely on mainContainer's padding
    paddingTop: 0,
    paddingBottom: 0,
  },
  planContainer: {
    backgroundColor: '#45B0A4',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'flex-start', // Align text to the left inside the card
    height: 170,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  planText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff', // White text for better contrast on the background
    marginBottom: 5, // Add some space below the title
  },
  // New styles for Burn Calories section
  burnCaloriesContainer: {
    marginBottom: 0, // Ensure no extra space below this container
    // Removed paddingHorizontal: '5%', // Rely on mainContainer's padding
  },
  burnCaloriesHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  burnCaloriesDescription: {
    fontSize: 14,
    color: '#333333', // Slightly lighter color for description
    lineHeight: 20,
    marginBottom: 32, // Further increase space below the description
    marginTop: 0,
    paddingVertical: 0,
    marginVertical: 0,
  },
  // New styles for Fitness Metrics section
  fitnessMetricsSection: {
    marginTop: 4,
    marginBottom: 20,
  },
  fitnessMetricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    // Padding will be handled by mainContainer
  },
  fitnessMetricsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Black text
  },
  fitnessMetricsSeeAll: {
    fontSize: 14,
    color: '#007BFF', // Blue color for link
  },
  metricsCarousel: {
    // No specific styles needed here, content styles handle layout
  },
  metricsCarouselContent: {
    flexDirection: 'row',
    // Padding will be handled by mainContainer for the first item alignment
  },
  metricCard: {
    borderRadius: 15,
    padding: 15,
    marginRight: 8,
    width: 150, // Fixed width for cards
    height: 180, // Fixed height for cards
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#000',
  },
  scoreCard: {
    backgroundColor: '#FFA726', // Orange background from image
  },
  hydrationCard: {
    backgroundColor: '#2196F3', // Blue background from image
  },
  caloriesCard: {
    backgroundColor: '#757575', // Grey background from image
  },
  metricCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff', // White text for contrast
  },
  chartPlaceholder: {
    flex: 1, // Take available space
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Semi-transparent white placeholder
    borderRadius: 5,
    marginVertical: 5,
  },
   circlesPlaceholder: {
     width: 20,
     height: 60, // Adjust height to match circles in image
     // backgroundColor: 'rgba(255, 255, 255, 0.3)', // No background needed for the container
     borderRadius: 10, // Make it circular
     justifyContent: 'space-around', // Distribute circles vertically
     alignItems: 'center', // Center circles horizontally
     paddingVertical: 5, // Add some vertical padding inside
     flexDirection: 'column', // Stack circles vertically
  },
  // Removed: Style for the individual circle dots
  /*
  circleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // White dots
    marginBottom: 4, // Space between dots
  },
  */
  metricCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff', // White text
  },
  // New styles for chart visualizations
  barChartContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end', // Align bars to the bottom
    justifyContent: 'space-around', // Distribute space around bars
    paddingHorizontal: 5,
    marginVertical: 5,
  },
  bar: {
    width: 10, // Width of each bar
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // White bars
    borderRadius: 2,
  },
  lineGraphContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
    position: 'relative', // Needed for absolute positioning of lines
  },
  // Removed: lineGraphLine style
  
  // New styles for the two lines
  goalLine: {
    position: 'absolute',
    width: '90%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Semi-transparent white for goal
    transform: [{ rotate: '-5deg' }], // Example slight upward angle
    top: '30%', // Position the line higher
  },
  userInputLine: {
    position: 'absolute',
    width: '90%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 1)', // Opaque white for user input
    transform: [{ rotate: '5deg' }], // Example slight upward angle, different from goal
    top: '60%', // Position the line lower
  },
  // New styles for the progress bar visualization
  progressBarContainer: {
    width: '100%',
    height: 8, // Thickness of the progress bar
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Light track
    borderRadius: 4,
    marginVertical: 10,
    overflow: 'hidden', // Clip the fill to the rounded corners
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFA726', // Orange fill color (example)
    borderRadius: 4,
  },
});

export default App;