import Joi from 'joi';

// Define onboarding validation schema
const onboardingSchema = Joi.object({
    dob: Joi.date()
        .less('now') // DOB should be in the past
        .required()
        .messages({
            'date.base': 'Date of birth must be a valid date.',
            'date.less': 'Date of birth cannot be in the future.',
            'any.required': 'Date of birth is required.'
        }),

    height: Joi.number()
        .positive()
        .required()
        .messages({
            'number.base': 'Height must be a number.',
            'number.positive': 'Height must be a positive number.',
            'any.required': 'Height is required.'
        }),

    weight: Joi.number()
        .positive()
        .required()
        .messages({
            'number.base': 'Weight must be a number.',
            'number.positive': 'Weight must be a positive number.',
            'any.required': 'Weight is required.'
        }),

    primaryGoal: Joi.string()
        .trim()
        .required()
        .messages({
            'string.base': 'Primary goal must be a string.',
            'any.required': 'Primary goal is required.'
        }),

    workoutFrequency: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'number.base': 'Workout frequency must be a number.',
            'number.integer': 'Workout frequency must be an integer.',
            'number.min': 'Workout frequency must be at least 1.',
            'any.required': 'Workout frequency is required.'
        }),

    currentFitnessLevel: Joi.string()
        .trim()
        .required()
        .messages({
            'string.base': 'Current fitness level must be a string.',
            'any.required': 'Current fitness level is required.'
        }),

    dailyActivityLevel: Joi.string()
        .trim()
        .required()
        .messages({
            'string.base': 'Daily activity level must be a string.',
            'any.required': 'Daily activity level is required.'
        })
});

export { onboardingSchema };
