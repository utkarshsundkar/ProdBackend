import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';

const { height } = Dimensions.get('window');

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  'What was the name of your first pet?',
  'What was the name of your elementary school?',
  'What is your favorite food?',
];

type Props = {
  onBack: () => void;
  onContinue: (question: string, answer: string) => void;
};

const SecurityQuestions: React.FC<Props> = ({ onBack, onContinue }) => {
  const [selectedQuestion, setSelectedQuestion] = useState<string>(SECURITY_QUESTIONS[0]);
  const [answer, setAnswer] = useState('');

  return (
    <SafeAreaView style={styles.caContainer}>
      {/* Top Bar */}
      <View style={styles.caTopBar}>
        <Pressable onPress={onBack} hitSlop={10} style={styles.caBackBtn}>
          <Text style={styles.caBackArrow}>{'←'}</Text>
        </Pressable>
        <Pressable style={styles.caHelpBtn}>
          <Text style={styles.caHelpText}>Need Help?</Text>
        </Pressable>
      </View>
      {/* Title */}
      <Text style={styles.verificationTitle}>Security Question</Text>
      <Text style={styles.verificationSubtext}>Select your security question and provide the answer</Text>
      {/* Security Question List */}
      <View style={styles.questionList}>
        {SECURITY_QUESTIONS.map((q, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.questionBtn, selectedQuestion === q && styles.selectedQuestionBtn]}
            onPress={() => setSelectedQuestion(q)}
          >
            <Text style={[styles.questionText, selectedQuestion === q && styles.selectedQuestionText]}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Answer Input */}
      <TextInput
        style={styles.answerInput}
        value={answer}
        onChangeText={setAnswer}
        placeholder="Your Answer"
        placeholderTextColor="#7D8A9C"
      />
      {/* Continue Button */}
      <Pressable
        onPress={() => onContinue(selectedQuestion, answer)}
        style={({ pressed }: { pressed: boolean }) => [
          styles.caSignUpBtn,
          pressed && { transform: [{ scale: 0.96 }] }
        ]}
      >
        <Text style={styles.caSignUpBtnText}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  caContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: height * 0.06,
    alignItems: 'center',
  },
  caTopBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  caBackBtn: {
    padding: 4,
  },
  caBackArrow: {
    fontSize: 24,
    color: '#7D8A9C',
    fontWeight: 'bold',
  },
  caHelpBtn: {
    padding: 4,
  },
  caHelpText: {
    color: '#7D8A9C',
    fontSize: 14,
    fontWeight: '500',
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#031B4E',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'System',
  },
  verificationSubtext: {
    fontSize: 14,
    color: '#7D8A9C',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'System',
  },
  questionList: {
    width: '100%',
    marginBottom: 24,
  },
  questionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#F7F8FA',
  },
  selectedQuestionBtn: {
    borderColor: '#0093D6',
    backgroundColor: '#E3F2FD',
  },
  questionText: {
    color: '#031B4E',
    fontSize: 15,
  },
  selectedQuestionText: {
    color: '#0093D6',
    fontWeight: 'bold',
  },
  answerInput: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    fontSize: 16,
    color: '#031B4E',
    backgroundColor: '#fff',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  caSignUpBtn: {
    width: '85%',
    backgroundColor: '#0093D6',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  caSignUpBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
});

export default SecurityQuestions; 