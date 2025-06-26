import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';

const { height } = Dimensions.get('window');

type Child = { name: string };
type SelectBookeeModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (arg: { name?: string; type: 'self' | 'child' | 'new-child' }) => void;
  userName: string;
  children?: Child[];
};

export type SelectBookeeModalRef = {
  animateOut: (callback: () => void) => void;
};

const SelectBookeeModal = forwardRef<SelectBookeeModalRef, SelectBookeeModalProps>(
  ({ visible, onClose, onSelect, userName, children = [] }, ref) => {
    const slideAnim = useRef(new Animated.Value(height)).current;
    const helloOpacity = useRef(new Animated.Value(0)).current;
    const questionOpacity = useRef(new Animated.Value(0)).current;
    const questionTranslateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
      if (visible) {
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(helloOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(helloOpacity, {
            toValue: 0,
            delay: 1000,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(questionOpacity, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(questionTranslateY, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      } else {
        slideAnim.setValue(height);
        helloOpacity.setValue(0);
        questionOpacity.setValue(0);
        questionTranslateY.setValue(20);
      }
    }, [visible]);

    // Expose animateOut to parent
    useImperativeHandle(ref, () => ({
      animateOut: (callback: () => void) => {
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start(callback);
      },
    }));

    return (
      <Modal visible={visible} animationType="none" transparent={true}>
        <Animated.View
          style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}
        >
          <Animated.Text style={[styles.helloText, { opacity: helloOpacity }]}>Hello!</Animated.Text>

          <Animated.View
            style={{
              opacity: questionOpacity,
              transform: [{ translateY: questionTranslateY }],
              alignItems: 'center',
            }}
          >
            <Text style={styles.questionText}>Who are you booking for?</Text>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => onSelect({ name: userName, type: 'self' })}
            >
              <Text style={styles.optionText}>{userName} (Yourself)</Text>
            </TouchableOpacity>

            {children.map((child, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => onSelect({ name: child.name, type: 'child' })}
              >
                <Text style={styles.optionText}>{child.name}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.createBox} onPress={() => onSelect({ type: 'new-child' })}>
              <Text style={styles.createText}>+ Create another account</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity onPress={onClose} style={styles.closeArea} />
        </Animated.View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: '#f97316',
    paddingTop: 100,
    paddingHorizontal: 24,
  },
  helloText: {
    fontSize: 36,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    marginBottom: 30,
  },
  optionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginVertical: 6,
    width: '100%',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  createBox: {
    borderStyle: 'dashed',
    borderColor: '#fff',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
    alignItems: 'center',
  },
  createText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  closeArea: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 30,
    height: 30,
  },
});

export default SelectBookeeModal;
