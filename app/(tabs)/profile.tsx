import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
    Bell,
    CheckCircle2,
    ChevronRight,
    Cpu,
    Fingerprint,
    Image as ImageIcon,
    KeyRound,
    LogOut,
    Mail,
    ShieldAlert,
    ShieldCheck,
    Smartphone,
    User,
    UserCircle2,
    Zap
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeType, useAuth, useTheme } from '../_layout';

const { width } = Dimensions.get('window');
const BACKEND_BASE_URL = 'http://192.168.18.139:8080/api/users';

const getThemeColors = (theme: ThemeType) => {
    switch (theme) {
        case 'AMETHYST_NEON':
            return {
                bg: '#0A0214',
                primaryAccent: '#9B30FF',
                secondaryAccent: '#00FFFF',
                glow1: 'rgba(155, 48, 255, 0.28)',
                glow2: 'rgba(0, 255, 255, 0.2)',
                glow3: 'rgba(255, 0, 128, 0.12)',
            };
        case 'VIBRANT_CYAN':
            return {
                bg: '#010C13',
                primaryAccent: '#00D2FF',
                secondaryAccent: '#FF2A6D',
                glow1: 'rgba(0, 210, 255, 0.28)',
                glow2: 'rgba(255, 42, 109, 0.2)',
                glow3: 'rgba(175, 82, 222, 0.12)',
            };
        default: // NEXORA_DARK
            return {
                bg: '#030107',
                primaryAccent: '#AF52DE',
                secondaryAccent: '#00F0FF',
                glow1: 'rgba(175, 82, 222, 0.28)',
                glow2: 'rgba(0, 240, 255, 0.2)',
                glow3: 'rgba(255, 0, 85, 0.12)',
            };
    }
};

export default function ProfileScreen() {
    const { signOut } = useAuth();
    const { activeTheme, setTheme } = useTheme();
    const insets = useSafeAreaInsets();
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();

    const themeColors = getThemeColors(activeTheme);
    const styles = createStyles(themeColors);

    // APP CORE STATES
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);
    const [encryptionActive, setEncryptionActive] = useState<boolean>(true);
    const [neuralAlerts, setNeuralAlerts] = useState<boolean>(true);

    // MODAL WINDOW MANAGERS
    const [myProfileVisible, setMyProfileVisible] = useState<boolean>(false);
    const [themeModalVisible, setThemeModalVisible] = useState<boolean>(false);
    const [encryptionModalVisible, setEncryptionModalVisible] = useState<boolean>(false);

    const resolveNetworkAvatarUrl = (rawUrl: string | null) => {
        if (!rawUrl) return null;
        if (rawUrl.startsWith('file://') || rawUrl.startsWith('content://')) return rawUrl;
        if (rawUrl.includes('192.168.18.139')) {
            if (Platform.OS === 'android') return rawUrl.replace('192.168.18.139', '10.0.2.2');
        }
        return rawUrl;
    };

 const fetchLiveProfileNodes = async (email: string) => {
        try {
            const activeToken = await SecureStore.getItemAsync('userToken');
            console.log("Fetching profile for email:", email); // Debugging line
            
            const response = await fetch(`${BACKEND_BASE_URL}/profile/${email}`, {
                method: 'GET',
                headers: { 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': activeToken ? `Bearer ${activeToken}` : ''
                }
            });
            
            if (response.ok) {
                const liveData = await response.json();
                console.log("Backend liveData received:", liveData); // Debugging line
                
                // 🟩 FIX: Direct data structural mapping with explicit fallbacks
                const updatedUser = {
                    id: liveData.id ? String(liveData.id) : "???",
                    email: liveData.email || email, // Agar backend se miss ho to request wali email use karein
                    name: liveData.fullName || liveData.username || "Nexora User",
                    username: liveData.username || "cyber_node",
                    phoneNumber: liveData.phoneNumber && liveData.phoneNumber !== "null" ? liveData.phoneNumber : "Not Linked",
                    accountNumber: liveData.accountNumber && liveData.accountNumber !== "null" ? liveData.accountNumber : "Not Linked"
                };

                setUserData(updatedUser);
                // Save to secure store so it remains accessible
                await SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));

                if (liveData.avatarUrl) {
                    const optimizedUrl = resolveNetworkAvatarUrl(liveData.avatarUrl);
                    setProfileImage(optimizedUrl);
                    if (optimizedUrl) await SecureStore.setItemAsync('user_avatar_local', optimizedUrl);
                } else {
                    setProfileImage(null);
                }
            } else {
                console.log("Backend profile API failed. Status:", response.status);
            }
        } catch (error) {
            console.log("Error querying node API:", error);
        } finally {
            setLoading(false);
        }
    };
  useEffect(() => {
        const loadInitialConfiguration = async () => {
            try {
                setLoading(true);
                
                // 1. Pehle token aur local userData read karein
                const activeToken = await SecureStore.getItemAsync('userToken');
                const userStr = await SecureStore.getItemAsync('userData');
                
                let detectedEmail = "";

                if (userStr) {
                    const parsed = JSON.parse(userStr);
                    setUserData(parsed);
                    detectedEmail = parsed.email || "";
                }

                // 2. Fallback: Agar login screen se object nahi mila, to remembered values check karein
                if (!detectedEmail) {
                    const rememberedIdentity = await AsyncStorage.getItem('remembered_identity');
                    if (rememberedIdentity) {
                        detectedEmail = rememberedIdentity;
                    }
                }

                const cachedImg = await SecureStore.getItemAsync('user_avatar_local');
                const cachedBio = await SecureStore.getItemAsync('setting_biometric');
                
                if (cachedImg) setProfileImage(resolveNetworkAvatarUrl(cachedImg));
                if (cachedBio) setBiometricEnabled(cachedBio === 'true');

                // 3. Trigger API hit only if we have an email
                if (detectedEmail && detectedEmail.trim() !== "") {
                    await fetchLiveProfileNodes(detectedEmail.trim());
                } else {
                    console.log("System Warning: Request flow missing email anchor context.");
                    // Force a local recovery state so screen doesn't stay completely blank
                    const savedName = await AsyncStorage.getItem('user_name');
                    setUserData({
                        id: "???",
                        email: "Authentication Pending",
                        name: savedName || "Nexora Operator",
                        username: "cyber_node",
                        phoneNumber: "Not Linked",
                        accountNumber: "Not Linked"
                    });
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error in loadInitialConfiguration:", err);
                setLoading(false);
            }
        };
        loadInitialConfiguration();
    }, []);

    const handleAvatarPick = async () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
        });

        if (!result.canceled && result.assets[0].uri) {
            const imageUri = result.assets[0].uri;
            setProfileImage(imageUri);
            setLoading(true);

            try {
                const formData = new FormData();
                const targetEmail = userData?.email;
                if (!targetEmail) return;

                formData.append('file', {
                    uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
                    type: 'image/jpeg',
                    name: `profile_${userData?.id || 'session'}.jpg`,
                } as any);
                formData.append('email', targetEmail);

                const activeToken = await SecureStore.getItemAsync('userToken');
                const response = await fetch(`${BACKEND_BASE_URL}/upload-avatar`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': activeToken ? `Bearer ${activeToken}` : ''
                    },
                });

                const responseText = await response.text();
                let data: any = {};
                try { data = JSON.parse(responseText); } catch (_) {}

                if (response.ok) {
                    const finalUrl = data.avatarUrl || responseText || imageUri;
                    const optimizedUrl = resolveNetworkAvatarUrl(finalUrl);
                    setProfileImage(optimizedUrl);
                    if (optimizedUrl) await SecureStore.setItemAsync('user_avatar_local', optimizedUrl);
                    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            } catch (error) {
                Alert.alert("Sync Notice", "Image cached locally on this device.");
            } finally {
                setLoading(false);
            }
        }
    };

    const toggleBiometricProtocol = async () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const targetState = !biometricEnabled;
        if (targetState) {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (hasHardware && isEnrolled) {
                const auth = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Authorize Security Configuration Change',
                    fallbackLabel: 'Use Lock Screen PIN',
                });
                if (!auth.success) return;
            } else return;
        }
        setBiometricEnabled(targetState);
        await SecureStore.setItemAsync('setting_biometric', targetState ? 'true' : 'false');
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleLogout = async () => {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert("Confirm Log Out", "Are you sure you want to terminate your current active secure Nexora session?", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Disconnect", 
                onPress: async () => {
                    await SecureStore.deleteItemAsync('userToken');
                    await SecureStore.deleteItemAsync('userData');
                    await SecureStore.deleteItemAsync('user_avatar_local');
                    signOut();
                    router.replace('/login');
                },
                style: "destructive" 
            },
        ]);
    };

    const SettingsRowComponent = ({ icon, title, subtitle, badgeText, badgeColor, onPress }: any) => (
        <TouchableOpacity style={styles.neonOuterGlowBorder} activeOpacity={0.82} onPress={onPress}>
            <LinearGradient colors={['rgba(175, 82, 222, 0.45)', 'rgba(0, 240, 255, 0.15)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <BlurView intensity={35} tint="dark" style={styles.blurRowContainer}>
                <View style={styles.innerRowContent}>
                    <View style={styles.iconGlowWrapper}>
                        <LinearGradient colors={[themeColors.primaryAccent, themeColors.secondaryAccent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconBackingBox}>
                            <View style={styles.iconInnerCore}>
                                {React.cloneElement(icon, { color: themeColors.secondaryAccent, size: 15 })}
                            </View>
                        </LinearGradient>
                    </View>
                    
                    <View style={styles.textStackSpace}>
                        <Text style={styles.primaryRowLabel}>{title}</Text>
                        {subtitle && <Text numberOfLines={1} style={styles.secondaryRowLabel}>{subtitle}</Text>}
                    </View>
                    
                    {badgeText && (
                        <LinearGradient 
                            colors={[`${badgeColor || themeColors.secondaryAccent}55`, 'rgba(5, 2, 10, 0.85)']} 
                            start={{ x: 0, y: 0 }} 
                            end={{ x: 1, y: 1 }} 
                            style={[styles.statusMicroBadge, { borderColor: badgeColor || themeColors.secondaryAccent }]}
                        >
                            <Text style={[styles.statusMicroBadgeText, { color: badgeColor || themeColors.secondaryAccent }]}>{badgeText}</Text>
                        </LinearGradient>
                    )}
                    <ChevronRight size={16} color={themeColors.secondaryAccent} />
                </View>
            </BlurView>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <LinearGradient colors={[themeColors.bg, '#0A0418', '#010003']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
            <View style={styles.ambientPurpleGlow} />
            <View style={styles.ambientCyanGlow} />
            <View style={styles.ambientMagentaGlow} />

            {loading && (
                <View style={styles.globalLoaderLayer}>
                    <ActivityIndicator size="large" color={themeColors.primaryAccent} />
                    <Text style={styles.loaderTerminalText}>CONNECTING TO NEXORA CORE SECURE NODE...</Text>
                </View>
            )}

            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                
                {/* HUD HEADER */}
                <View style={styles.topHudLineContainer}>
                    <View style={styles.hudBadge}>
                        <Zap size={11} color={themeColors.primaryAccent} />
                        <Text style={styles.hudBadgeText}>SECURE TERMINAL NODE ONLINE</Text>
                    </View>
                    <LinearGradient colors={[themeColors.primaryAccent, themeColors.secondaryAccent, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.hudLine} />
                </View>

                {/* ─── METALLIC GLASSMORPHISM HEADER CARD ─── */}
                <View style={styles.glassProfileCardOuter}>
                    <LinearGradient colors={['rgba(0, 240, 255, 0.5)', 'rgba(175, 82, 222, 0.5)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                    <BlurView intensity={45} tint="dark" style={styles.profileGlassBlur}>
                        <LinearGradient colors={['rgba(175, 82, 222, 0.15)', 'rgba(0, 240, 255, 0.05)']} style={StyleSheet.absoluteFill} />
                        
                        <TouchableOpacity activeOpacity={0.85} onPress={handleAvatarPick} style={styles.avatarMainTrigger}>
                            <LinearGradient colors={[themeColors.secondaryAccent, themeColors.primaryAccent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientBorderRing}>
                                <View style={styles.avatarDarkCap}>
                                    {profileImage && profileImage.trim() !== "" ? (
                                        <Image 
                                            source={{ uri: profileImage, headers: { Pragma: 'no-cache' } }} 
                                            style={styles.avatarImg}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <User size={34} color={themeColors.secondaryAccent} />
                                    )}
                                </View>
                            </LinearGradient>
                            <LinearGradient colors={[themeColors.primaryAccent, themeColors.secondaryAccent]} style={styles.cameraIconBadge}>
                                <ImageIcon size={9} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.userInfoCluster}>
                            <View style={styles.inlineNameRow}>
                                <Text numberOfLines={1} style={styles.profileHeadingText}>
                                    {userData?.name || "Initializing..."}
                                </Text>
                                <CheckCircle2 size={16} color="#00FFC2" style={styles.verifiedTick} />
                            </View>
                            <Text numberOfLines={1} style={styles.profileEmailSubtext}>
                                {userData?.email || "Resolving quantum link..."}
                            </Text>
                        </View>
                    </BlurView>
                </View>

                {/* --- SETTINGS GROUPS --- */}
                <View style={styles.sectionBlock}>
                    <Text style={styles.sectionHeaderLabel}>IDENTITY CREDENTIAL VECTOR</Text>
                    <SettingsRowComponent 
                        icon={<UserCircle2 />} 
                        title="Personal Registry Data" 
                        subtitle="View and manage core authorized records"
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setMyProfileVisible(true);
                        }}
                    />
                </View>

                <View style={styles.sectionBlock}>
                    <Text style={styles.sectionHeaderLabel}>SECURITY PROTOCOLS MATRIX</Text>
                    <SettingsRowComponent 
                        icon={<Fingerprint />} 
                        title="Biometric Verification Lock" 
                        subtitle="Instant device biometrics synchronization"
                        badgeText={biometricEnabled ? "BIOMETRIC LOCKED" : "INACTIVE LAYERS"}
                        badgeColor={biometricEnabled ? "#00FFC2" : "#FF453A"}
                        onPress={toggleBiometricProtocol}
                    />
                    <SettingsRowComponent 
                        icon={<ShieldCheck />} 
                        title="Automated Data Encryption" 
                        subtitle="Military-grade AES-256 local token stream"
                        badgeText={encryptionActive ? "STREAM ACTIVE" : "STANDARD PIPELINE"}
                        badgeColor={themeColors.secondaryAccent}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setEncryptionModalVisible(true);
                        }}
                    />
                </View>

                <View style={styles.sectionBlock}>
                    <Text style={styles.sectionHeaderLabel}>CORE SUBSYSTEM ENGINE</Text>
                    <SettingsRowComponent 
                        icon={<Bell />} 
                        title="Push Notification Modules" 
                        subtitle="Real-time financial status alert nodes"
                        badgeText={neuralAlerts ? "LIVE INTEGRATION" : "MUTED PIPELINE"}
                        badgeColor={neuralAlerts ? "#00FFC2" : "rgba(255,255,255,0.2)"}
                        onPress={() => {
                            setNeuralAlerts(!neuralAlerts);
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }}
                    />
                    <SettingsRowComponent 
                        icon={<Cpu />} 
                        title="System Graphics Theme" 
                        subtitle={`Interface State: ${activeTheme.replace('_', ' ')}`}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setThemeModalVisible(true);
                        }}
                    />
                </View>

                {/* --- PREMIUM GLOWING DESTRUCTIVE LOGOUT BUTTON --- */}
                <TouchableOpacity style={styles.actionLogoutWrapper} activeOpacity={0.85} onPress={handleLogout}>
                    <LinearGradient colors={['rgba(255, 69, 58, 0.6)', 'rgba(175, 82, 222, 0.2)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                    <BlurView intensity={25} tint="dark" style={styles.logoutBlurBox}>
                        <LogOut color="#FF453A" size={16} />
                        <Text style={styles.logoutActionLabel}>TERMINATE ACTIVE SECURE TERMINAL</Text>
                    </BlurView>
                </TouchableOpacity>

                <Text style={styles.systemFooterBrand}>NEXORA QUANTUM OVERDRIVE ENGINE • v1.0.0</Text>
            </ScrollView>

            {/* ================================== OVERLAY: PROFILE REGISTRY SYSTEM ================================== */}
            <Modal animationType="slide" transparent={true} visible={myProfileVisible} onRequestClose={() => setMyProfileVisible(false)}>
                <View style={styles.modalBlurOverlay}>
                    <BlurView intensity={55} tint="dark" style={styles.modalGlassCardBox}>
                        <View style={[styles.modalStructuralInner, { borderColor: themeColors.secondaryAccent }]}>
                            <View style={styles.modalIdentityHeadingRow}>
                                <UserCircle2 color={themeColors.secondaryAccent} size={20} />
                                <Text style={styles.modalDynamicTitle}>User Core Registry</Text>
                            </View>

                            <View style={styles.registryDataRow}>
                                <Smartphone color={themeColors.secondaryAccent} size={13} />
                                <View style={styles.registryDataStack}>
                                    <Text style={styles.registryLabel}>ACCOUNT REGISTER ID</Text>
                                    <Text style={styles.registryValue}>NEX-{userData?.id || 'ALLOCATING NODE...'}</Text>
                                </View>
                            </View>

                            <View style={styles.registryDataRow}>
                                <User color={themeColors.primaryAccent} size={13} />
                                <View style={styles.registryDataStack}>
                                    <Text style={styles.registryLabel}>AUTHENTICATED ALIAS</Text>
                                    <Text style={styles.registryValue}>{userData?.username || 'UNAVAILABLE'}</Text>
                                </View>
                            </View>

                            <View style={styles.registryDataRow}>
                                <Mail color="#00FFC2" size={13} />
                                <View style={styles.registryDataStack}>
                                    <Text style={styles.registryLabel}>PRIMARY TRANSACTION PATH</Text>
                                    <Text style={styles.registryValue}>{userData?.email || 'UNAVAILABLE'}</Text>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.modalTerminationBtn} activeOpacity={0.85} onPress={() => setMyProfileVisible(false)}>
                                <LinearGradient colors={[themeColors.secondaryAccent, themeColors.primaryAccent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modalButtonGradientStyle}>
                                    <Text style={styles.modalButtonTextStyle}>CLOSE SECURE CORE</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </View>
            </Modal>

            {/* ================================== OVERLAY: DATA CYPHER SECURITY ================================== */}
            <Modal animationType="fade" transparent={true} visible={encryptionModalVisible} onRequestClose={() => setEncryptionModalVisible(false)}>
                <View style={styles.modalBlurOverlay}>
                    <BlurView intensity={65} tint="dark" style={styles.modalGlassCardBox}>
                        <View style={[styles.modalStructuralInner, { borderColor: themeColors.primaryAccent }]}>
                            <View style={styles.modalIdentityHeadingRow}>
                                <KeyRound color={themeColors.primaryAccent} size={20} />
                                <Text style={[styles.modalDynamicTitle, { color: themeColors.primaryAccent }]}>Cypher Architecture</Text>
                            </View>
                            <Text style={styles.informationalModalBodyText}>
                                All operations and communication streams built inside this network module are tokenized locally via real-time symmetric crypto matrices.
                            </Text>

                            <TouchableOpacity 
                                style={[styles.cryptoStatusPanel, encryptionActive && styles.cryptoStatusPanelActive]} 
                                activeOpacity={0.8}
                                onPress={() => {
                                    setEncryptionActive(!encryptionActive);
                                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                }}
                            >
                                <ShieldAlert color={encryptionActive ? "#00FFC2" : "#FF453A"} size={16} />
                                <Text style={styles.cryptoStatusLabelText}>
                                    {encryptionActive ? 'AES-256 Symmetric Stream Active' : 'Standard Pipeline Fallback'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.modalTerminationBtn} activeOpacity={0.85} onPress={() => setEncryptionModalVisible(false)}>
                                <LinearGradient colors={[themeColors.primaryAccent, themeColors.secondaryAccent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modalButtonGradientStyle}>
                                    <Text style={[styles.modalButtonTextStyle, { color: '#FFF' }]}>ACKNOWLEDGE PARAMETERS</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </View>
            </Modal>

            {/* ================================== OVERLAY: CONFIGURABLE BRAND THEMES ================================== */}
            <Modal animationType="slide" transparent={true} visible={themeModalVisible} onRequestClose={() => setThemeModalVisible(false)}>
                <View style={styles.modalBlurOverlay}>
                    <BlurView intensity={55} tint="dark" style={styles.modalGlassCardBox}>
                        <View style={[styles.modalStructuralInner, { borderColor: '#00FFC2' }]}>
                            <View style={styles.modalIdentityHeadingRow}>
                                <Cpu color="#00FFC2" size={20} />
                                <Text style={[styles.modalDynamicTitle, { color: '#00FFC2' }]}>Appearance Vectors</Text>
                            </View>

                            {['NEXORA_DARK', 'AMETHYST_NEON', 'VIBRANT_CYAN'].map((themeToken) => {
                                const selected = activeTheme === themeToken;
                                return (
                                    <TouchableOpacity 
                                        key={themeToken} 
                                        style={[styles.themeSelectRow, selected && styles.themeSelectRowSelected]} 
                                        activeOpacity={0.75}
                                        onPress={async () => {
                                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setTheme(themeToken as any);
                                        }}
                                    >
                                        <Text style={[styles.themeSelectionText, selected && { color: '#00FFC2', fontWeight: '800' }]}>
                                            {themeToken.replace('_', ' ')}
                                        </Text>
                                        {selected && <View style={styles.activeSelectionDotIndication} />}
                                    </TouchableOpacity>
                                );
                            })}

                            <TouchableOpacity style={styles.modalTerminationBtn} activeOpacity={0.85} onPress={() => setThemeModalVisible(false)}>
                                <LinearGradient colors={['#00FFC2', '#00F0FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modalButtonGradientStyle}>
                                    <Text style={[styles.modalButtonTextStyle, { color: '#030107' }]}>SAVE CORE THEME CONFIG</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </View>
            </Modal>
        </View>
    );
}

const createStyles = (themeColors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.bg },
    ambientPurpleGlow: { position: 'absolute', top: -100, left: -60, width: 320, height: 320, borderRadius: 160, backgroundColor: themeColors.primaryAccent, opacity: 0.28 },
    ambientCyanGlow: { position: 'absolute', top: 200, right: -120, width: 360, height: 360, borderRadius: 180, backgroundColor: themeColors.secondaryAccent, opacity: 0.2 },
    ambientMagentaGlow: { position: 'absolute', bottom: -50, left: -40, width: 260, height: 260, borderRadius: 130, backgroundColor: themeColors.glow3, opacity: 0.12 },
    globalLoaderLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(3,1,7,0.96)', zIndex: 999, justifyContent: 'center', alignItems: 'center' },
    loaderTerminalText: { color: themeColors.secondaryAccent, fontSize: 10, fontWeight: '800', marginTop: 22, letterSpacing: 1.5 },
    topHudLineContainer: { paddingHorizontal: 20, marginTop: 12, marginBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
    hudLine: { height: 1, flex: 1, opacity: 0.6 },
    hudBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(175,82,222,0.12)', borderWidth: 1, borderColor: themeColors.primaryAccent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, gap: 5 },
    hudBadgeText: { color: themeColors.primaryAccent, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
    glassProfileCardOuter: { marginHorizontal: 20, marginBottom: 28, borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(0, 240, 255, 0.4)' },
    profileGlassBlur: { padding: 24, flexDirection: 'row', alignItems: 'center' },
    avatarMainTrigger: { position: 'relative' },
    gradientBorderRing: { width: 78, height: 78, borderRadius: 39, padding: 2.5, justifyContent: 'center', alignItems: 'center' },
    avatarDarkCap: { width: '100%', height: '100%', borderRadius: 37, backgroundColor: '#0A0418', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    avatarImg: { width: 73, height: 73, borderRadius: 36.5 },
    cameraIconBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#0A0418' },
    userInfoCluster: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    inlineNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    profileHeadingText: { color: '#FFF', fontSize: 19, fontWeight: '900', letterSpacing: -0.1, maxWidth: width * 0.44 },
    verifiedTick: { marginLeft: 6 },
    profileEmailSubtext: { color: themeColors.secondaryAccent, fontSize: 11, fontWeight: '600', letterSpacing: 0.3, opacity: 0.8 },
    sectionBlock: { paddingHorizontal: 20, marginBottom: 25 },
    sectionHeaderLabel: { color: themeColors.secondaryAccent, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 14, marginLeft: 2, textShadowColor: 'rgba(0,240,255,0.4)', textShadowRadius: 4 },
    neonOuterGlowBorder: { marginBottom: 12, borderRadius: 18, overflow: 'hidden', padding: 1.5 },
    blurRowContainer: { padding: 14, borderRadius: 17, overflow: 'hidden', backgroundColor: 'rgba(5, 2, 10, 0.7)' },
    innerRowContent: { flexDirection: 'row', alignItems: 'center' },
    iconGlowWrapper: { padding: 1, borderRadius: 11, shadowColor: themeColors.secondaryAccent, shadowRadius: 6, shadowOpacity: 0.5, elevation: 4 },
    iconBackingBox: { width: 34, height: 34, borderRadius: 10, padding: 1, justifyContent: 'center', alignItems: 'center' },
    iconInnerCore: { width: '100%', height: '100%', borderRadius: 9, backgroundColor: '#030107', justifyContent: 'center', alignItems: 'center' },
    textStackSpace: { flex: 1, marginLeft: 14, paddingRight: 6 },
    primaryRowLabel: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: -0.1 },
    secondaryRowLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2, fontWeight: '500' },
    statusMicroBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1.2, marginRight: 10, overflow: 'hidden' },
    statusMicroBadgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
    actionLogoutWrapper: { marginHorizontal: 20, marginTop: 10, marginBottom: 12, borderRadius: 16, overflow: 'hidden', padding: 1.5, shadowColor: '#FF453A', shadowRadius: 8, shadowOpacity: 0.3 },
    logoutBlurBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 12, backgroundColor: 'rgba(5, 2, 10, 0.85)' },
    logoutActionLabel: { color: '#FF453A', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    systemFooterBrand: { color: 'rgba(255,255,255,0.2)', fontSize: 9, textAlign: 'center', marginTop: 32, fontWeight: '800', letterSpacing: 1.5 },
    modalBlurOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modalGlassCardBox: { width: '88%', borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)' },
    modalStructuralInner: { width: '100%', backgroundColor: '#05020A', padding: 24, borderWidth: 1, borderRadius: 24 },
    modalIdentityHeadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    modalDynamicTitle: { fontSize: 17, fontWeight: '900', marginLeft: 12, color: themeColors.primaryAccent, letterSpacing: 0.2 },
    modalTerminationBtn: { width: '100%', height: 48, borderRadius: 14, marginTop: 22, overflow: 'hidden' },
    modalButtonGradientStyle: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    modalButtonTextStyle: { color: '#030107', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
    registryDataRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 14, borderRadius: 16, marginBottom: 12 },
    registryDataStack: { marginLeft: 15 },
    registryLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
    registryValue: { color: '#FFF', fontSize: 13, fontWeight: '700', marginTop: 3 },
    informationalModalBodyText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 19, marginBottom: 20 },
    cryptoStatusPanel: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,69,58,0.06)', borderWidth: 1, borderColor: 'rgba(255,69,58,0.3)', padding: 15, borderRadius: 16, gap: 11 },
    cryptoStatusPanelActive: { backgroundColor: 'rgba(0,255,194,0.05)', borderColor: 'rgba(0,255,194,0.4)' },
    cryptoStatusLabelText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
    themeSelectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 16, marginBottom: 12 },
    themeSelectRowSelected: { borderColor: '#00FFC2', backgroundColor: 'rgba(0,255,194,0.05)' },
    themeSelectionText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
    activeSelectionDotIndication: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00FFC2' }
});