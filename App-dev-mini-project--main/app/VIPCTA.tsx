import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Platform,
  SafeAreaView,
  useColorScheme,
} from 'react-native';


type Plan = {
  id: string;
  title: string;
  price: string;
  period: string;
  perks: string[];
};

const PLANS: Plan[] = [
  {
    id: 'monthly',
    title: 'VIP Monthly',
    price: '₹299',
    period: 'month',
    perks: ['Unlimited access', 'Ad-free', 'Priority support'],
  },
  {
    id: 'yearly',
    title: 'VIP Yearly',
    price: '₹2,999',
    period: 'year',
    perks: ['2 months free', 'All VIP features', 'Dedicated support'],
  },
];

// --- Color palettes to match the app's theme ---
const lightColors = {
  background: '#F3F4F6',
  card: '#FFFFFF',
  cardSecondary: '#F9FAFB',
  text: '#111827',
  textSecondary: '#0f766e',
  primary: '#38e07b',
  primaryText: '#111827',
  modalBg: 'rgba(0, 0, 0, 0.5)',
};

const darkColors = {
  background: '#122017',
  card: '#1F2937', // A bit lighter for modals
  cardSecondary: '#2d3748',
  text: '#FFFFFF',
  textSecondary: '#a0aec0',
  primary: '#38e07b',
  primaryText: '#111827',
  modalBg: 'rgba(0, 0, 0, 0.7)',
};

interface VIPSubscriptionCTAProps {
  // We can add props here if needed in the future
}

export interface VIPSubscriptionCTARef {
  open: (onSuccess?: () => void) => void;
}

const VIPSubscriptionCTA = forwardRef<VIPSubscriptionCTARef, VIPSubscriptionCTAProps>((props, ref) => {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? darkColors : lightColors;
  const styles = useMemo(() => getStyles(themeColors), [colorScheme]);

  const [visible, setVisible] = useState(false); // Manages modal visibility internally
  const [selected, setSelected] = useState<Plan | null>(PLANS[1]);
  const onSuccessCallback = useRef<(() => void) | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }
  }, [visible, fade, scale]);

  function close() {
    setVisible(false);
    // Reset callback if modal is closed manually
    onSuccessCallback.current = null;
  }

  // Expose the open function to parent components via ref
  useImperativeHandle(ref, () => ({
    open: (onSuccess?: () => void) => {
      onSuccessCallback.current = onSuccess || null;
      setVisible(true);
    },
  }));

  function onSubscribe(plan: Plan) {
    // Hook point: connect with in-app-purchase, Stripe, or your API.
    // For demo, we'll just close and show a quick acknowledgment.
    setSelected(plan);
    // Close the modal first
    setVisible(false);

    // Simulate a successful API call
    setTimeout(() => {
      console.log('Subscribed to', plan.id);
      // If a success callback was provided, execute it now.
      onSuccessCallback.current?.();
      onSuccessCallback.current = null; // Clean up
    }, 200);
  }

  return (
    <>
      {/* The modal is the only part we need to render from the parent */}
      <Modal visible={visible} animationType="none" transparent onRequestClose={close}>
        <Animated.View style={[styles.modalBg, { opacity: fade }]} />
        <View style={styles.modalWrapper} pointerEvents={visible ? 'auto' : 'none'}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale }] }]}>
            <Text style={styles.modalHeading}>Choose your plan</Text>
            <Text style={styles.modalSub}>Secure checkout. Cancel anytime.</Text>

            {PLANS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.planRow,
                  selected?.id === p.id ? styles.planSelected : null,
                ]}
                onPress={() => setSelected(p)}
                accessibilityRole="button"
              >
                <View>
                  <Text style={styles.planTitle}>{p.title}</Text>
                  <Text style={styles.planPrice}>{p.price} / {p.period}</Text>
                </View>
                <View>
                  <Text style={styles.chooseText}>{selected?.id === p.id ? 'Selected' : 'Choose'}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.subscribeBtn}
              onPress={() => selected && onSubscribe(selected)}
              accessibilityRole="button"
            >
              <Text style={styles.subscribeBtnText}>Subscribe • {selected?.price}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={close} style={styles.modalClose} accessibilityRole="button">
              <Text style={styles.modalCloseText}>Maybe later</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
});

export default VIPSubscriptionCTA;

const getStyles = (themeColors: typeof lightColors) => StyleSheet.create({
  /* Modal */
  modalBg: {
    flex: 1,
    backgroundColor: themeColors.modalBg,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalWrapper: { flex: 1, justifyContent: 'center', padding: 20 },
  modalCard: {
    backgroundColor: themeColors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeading: {
    color: themeColors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSub: { color: themeColors.textSecondary, marginBottom: 20, textAlign: 'center' },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: themeColors.cardSecondary,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planSelected: {
    borderColor: themeColors.primary,
    backgroundColor: themeColors.background,
  },
  planTitle: { color: themeColors.text, fontWeight: 'bold', fontSize: 16 },
  planPrice: { color: themeColors.textSecondary, fontSize: 14, marginTop: 2 },
  chooseText: { color: themeColors.primary, fontWeight: 'bold' },
  subscribeBtn: {
    marginTop: 12,
    backgroundColor: themeColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  subscribeBtnText: {
    color: themeColors.primaryText,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalClose: {
    marginTop: 16,
    padding: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    color: themeColors.textSecondary,
    fontWeight: '500',
  },
});
