import Joi from "joi";

// Define onboarding validation schema
const onboardingSchema = Joi.object({
  userId: Joi.string().required(),

  age: Joi.date().less("now").required().messages({
    "any.required": "age is required.",
  }),

  height: Joi.number().positive().required().messages({
    "number.base": "Height must be a number.",
    "number.positive": "Height must be a positive number.",
    "any.required": "Height is required.",
  }),

  weight: Joi.number().positive().required().messages({
    "number.base": "Weight must be a number.",
    "number.positive": "Weight must be a positive number.",
    "any.required": "Weight is required.",
  }),

  gender: Joi.string().valid("Male", "Female").required().messages({
    "string.base": "Gender must be a string.",
    "any.required": "Gender is required.",
  }),

  primaryGoal: Joi.string(),

  workoutFrequency: Joi.required().messages({
    "number.base": "Workout frequency must be a number.",
    "number.integer": "Workout frequency must be an integer.",
    "number.min": "Workout frequency must be at least 1.",
    "any.required": "Workout frequency is required.",
  }),

  currentFitnessLevel: Joi.string().trim().required().messages({
    "string.base": "Current fitness level must be a string.",
    "any.required": "Current fitness level is required.",
  }),

  dailyActivityLevel: Joi.string()
    .valid("Low", "Moderate", "High")
    .required()
    .messages({
      "string.base": "Daily activity level must be a string.",
      "any.required": "Daily activity level is required.",
    }),
  securityQuestions: Joi.string()
    .valid(
      "What is your favorite food?",
      "What is your first pet's name?",
      "What is your mother's maiden name?",
      "what was the name of your first school?"
    )
    .required()
    .messages({
      "string.base": "Security question must be a string.",
      "any.required": "Security question is required.",
      "any.only": "Security question must be one of the predefined options.",
    }),

    securityQuestionsAnswer: Joi.string().required().messages({
        "string.base": "Security question answer must be a string.",
        "any.required": "Security question answer is required.",
        }),
});

export { onboardingSchema };
