import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/common/ThemeProvider";
import { useUpdateProfile } from "@/data/use-backend";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
import { toast } from "sonner";
import {
  Settings2,
  User,
  Bell,
  Shield,
  Wallet,
  Moon,
  Sun,
  Copy,
  Mic,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useWalletInfo } from "@reown/appkit/react";
import { useHelper } from "@/hooks/use-helper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { modal } from "@/configs/reown";
import { useUsername } from "@/contexts/UsernameContext";
import { BuyDomain } from "@/components/domain/BuyDomain";
import { useIsMobile } from "@/hooks/use-mobile";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAaPUnX7EIs6ny0FQAUwzXyV-eIZ18YzFc",
  authDomain: "nomee-91730.firebaseapp.com",
  projectId: "nomee-91730",
  storageBucket: "nomee-91730.firebasestorage.app",
  messagingSenderId: "21701776655",
  appId: "1:21701776655:web:56baa6113087b30ebc9a7a",
  measurementId: "G-S3X5XH9MD7",
};

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { addresses } = useAccount();
  const { walletInfo } = useWalletInfo();
  const { trimAddress } = useHelper();
  const { activeUsername, profile, refetchProfile } = useUsername();
  const isMobile = useIsMobile();

  const updateProfileMutation = useUpdateProfile();

  const [permissionStatus, setPermissionStatus] = useState({
    microphone: "unknown" as "granted" | "denied" | "prompt" | "unknown",
    pushNotifications: "unknown" as "granted" | "denied" | "prompt" | "unknown",
  });

  const [showFcmDialog, setShowFcmDialog] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const micPermission = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        setPermissionStatus((prev) => ({
          ...prev,
          microphone: micPermission.state,
        }));
      } catch (error) {
        console.log("Microphone permission check not supported");
        toast("Microphone permission check not supported");
      }

      if ("Notification" in window) {
        const pushStatus = Notification.permission;
        setPermissionStatus((prev) => ({
          ...prev,
          pushNotifications: pushStatus === "default" ? "prompt" : pushStatus,
        }));
      }
    };

    checkPermissions();
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionStatus((prev) => ({ ...prev, microphone: "granted" }));
      toast.success("Microphone permission granted");
    } catch (error) {
      setPermissionStatus((prev) => ({ ...prev, microphone: "denied" }));
      toast.error("Microphone permission denied");
    }
  };

  const requestPushNotificationPermission = async () => {
    try {
      if (!activeUsername) {
        return toast("No active username.");
      }

      if (!("Notification" in window)) {
        toast.error("Push notifications are not supported in this browser");
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        setPermissionStatus((prev) => ({
          ...prev,
          pushNotifications: "granted",
        }));

        // Generate FCM token
        try {
          const app = initializeApp(firebaseConfig);
          const messaging = getMessaging(app);

          const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID,
          });

          if (token) {
            await updateProfileMutation.mutateAsync({ fcmToken: token });
            toast.success("Push notifications enabled successfully");
          }

          refetchProfile();
        } catch (error) {
          console.error("Error getting FCM token:", error);
          toast.error("Failed to setup push notifications");
        }
      } else {
        setPermissionStatus((prev) => ({
          ...prev,
          pushNotifications: "denied",
        }));
        toast.error("Push notification permission denied");
      }
    } catch (error) {
      console.error("Error requesting push permission:", error);
      toast.error("Failed to request push notification permission");
    }
  };

  const handlePermissionToggle = (
    permissionType: "microphone" | "pushNotifications"
  ) => {
    const currentStatus = permissionStatus[permissionType];

    if (currentStatus === "granted") {
      toast.info(
        `${
          permissionType === "microphone" ? "Microphone" : "Push notification"
        } permission is already granted. Please manage it through your browser settings.`
      );
      return;
    }

    if (permissionType === "microphone") {
      requestMicrophonePermission();
    } else {
      requestPushNotificationPermission();
    }
  };

  const generateFcmToken = async () => {
    if (!activeUsername) {
      return toast.error("No active username.");
    }

    setIsGeneratingToken(true);
    try {
      const app = initializeApp(firebaseConfig);
      const messaging = getMessaging(app);

      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID,
      });

      if (token) {
        await updateProfileMutation.mutateAsync({ fcmToken: token });
        toast.success("FCM token generated and saved successfully");
        setShowFcmDialog(false);

        refetchProfile();
      } else {
        toast.error("Failed to generate FCM token");
      }
    } catch (error) {
      console.error("Error generating FCM token:", error);
      toast.error("Failed to generate FCM token");
    } finally {
      setIsGeneratingToken(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-content space-content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-grotesk">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and app settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 gap-1 h-auto">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger
            value="wallet"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Wallet</span>
          </TabsTrigger>
          <TabsTrigger
            value="permissions"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Permissions</span>
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          {activeUsername ? (
            <Card className="p-4 md:p-6">
              <div className="space-y-8">
                {/* Profile Header */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center ring-2 ring-primary/10">
                      {profile?.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-10 w-10 text-primary" />
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    >
                      <Settings2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold font-grotesk">
                      {activeUsername}
                    </h3>
                    <p className="text-muted-foreground">@{activeUsername}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Upload New Photo
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Basic Information */}
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold font-grotesk">
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium">
                        Username
                      </Label>
                      <div className="relative">
                        <Input
                          id="username"
                          value={activeUsername}
                          disabled
                          className="bg-muted/50 cursor-not-allowed"
                        />
                        <Badge
                          variant="secondary"
                          className="absolute right-2 top-2 text-xs"
                        >
                          Cannot be changed
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        defaultValue={profile?.email}
                        className="focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio" className="text-sm font-medium">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself..."
                        defaultValue={profile?.bio}
                        className="focus:ring-primary focus:border-primary min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline">Reset Changes</Button>
                  <Button>Save Changes</Button>
                </div>
              </div>
            </Card>
          ) : (
            <BuyDomain description={"No active username"} />
          )}
        </TabsContent>

        {/* Wallet Settings */}
        <TabsContent value="wallet" className="space-y-6">
          <Card className="p-4 md:p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold font-grotesk">
                Connected Wallets
              </h3>

              {addresses?.map((address) => {
                return (
                  <div className="space-y-4" key={address}>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img
                          src={walletInfo?.icon}
                          className="h-6 w-6 md:h-8 md:w-8"
                        />
                        <div>
                          <p className="font-medium">{walletInfo?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {trimAddress(address)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge>{walletInfo?.type}</Badge>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                navigator.clipboard.writeText(address);
                                toast.success("Address copied to clipboard");
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy address</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                );
              })}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  modal?.open({ view: "Connect" });
                }}
              >
                <Wallet className="h-4 w-4 mr-2" />
                {(addresses?.length ?? 0) > 0
                  ? "Connect Another Wallet"
                  : "Connect Wallet"}
              </Button>

              <Separator />

              <div>
                <h4 className="text-md font-semibold mb-4">
                  Transaction Settings
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gasPrice">Default Gas Price</Label>
                    <Select defaultValue="standard">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Slow (Lower cost)</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="fast">Fast (Higher cost)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Permissions Settings */}
        <TabsContent value="permissions" className="space-y-6">
          <Card className="p-4 md:p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold font-grotesk">
                App Permissions
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mic className="h-6 w-6 text-primary" />
                    <div className="flex-1 space-y-0.5">
                      <Label>Microphone Access</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow voice messages and audio recording
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {permissionStatus.microphone === "granted" && (
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-800 border-green-200"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Granted
                      </Badge>
                    )}
                    {permissionStatus.microphone === "denied" && (
                      <Badge variant="destructive">
                        <X className="h-3 w-3 mr-1" />
                        Denied
                      </Badge>
                    )}
                    {(permissionStatus.microphone === "prompt" ||
                      permissionStatus.microphone === "unknown") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePermissionToggle("microphone")}
                      >
                        Request Access
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-6 w-6 text-primary" />
                    <div className="flex-1 space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about important updates and messages
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {permissionStatus.pushNotifications === "granted" && (
                      <>
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800 border-green-200"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Granted
                        </Badge>
                        {!profile?.fcmToken && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFcmDialog(true)}
                            className="ml-2"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Generate Token
                          </Button>
                        )}
                      </>
                    )}
                    {permissionStatus.pushNotifications === "denied" && (
                      <Badge variant="destructive">
                        <X className="h-3 w-3 mr-1" />
                        Denied
                      </Badge>
                    )}
                    {permissionStatus.pushNotifications === "prompt" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePermissionToggle("pushNotifications")
                        }
                      >
                        Request Access
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-md font-semibold mb-4">
                  Permission Management
                </h4>
                <div className="space-y-3">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> If permissions are denied, you can
                      re-enable them through your browser settings. Look for the
                      lock icon in the address bar or check your browser's site
                      settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Preferences Settings */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="p-4 md:p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold font-grotesk">
                App Preferences
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center">
                          <Sun className="h-4 w-4 mr-2" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center">
                          <Moon className="h-4 w-4 mr-2" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select defaultValue="eth">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eth">ETH</SelectItem>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Preferences</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* FCM Token Generation Modal */}
      {isMobile ? (
        <Drawer open={showFcmDialog} onOpenChange={setShowFcmDialog}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Generate FCM Token</DrawerTitle>
              <DrawerDescription>
                Generate and set a new Firebase Cloud Messaging (FCM) token for
                push notifications. This will enable you to receive push
                notifications on this device.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This will generate a new token and
                  update your notification settings. You should only do this if
                  you're having issues with notifications or setting up a new
                  device.
                </p>
              </div>
            </div>
            <DrawerFooter>
              <Button onClick={generateFcmToken} disabled={isGeneratingToken}>
                {isGeneratingToken ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Generate Token
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFcmDialog(false)}
                disabled={isGeneratingToken}
              >
                Cancel
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showFcmDialog} onOpenChange={setShowFcmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate FCM Token</DialogTitle>
              <DialogDescription>
                Generate and set a new Firebase Cloud Messaging (FCM) token for
                push notifications. This will enable you to receive push
                notifications on this device.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This will generate a new token and
                  update your notification settings. You should only do this if
                  you're having issues with notifications or setting up a new
                  device.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowFcmDialog(false)}
                disabled={isGeneratingToken}
              >
                Cancel
              </Button>
              <Button onClick={generateFcmToken} disabled={isGeneratingToken}>
                {isGeneratingToken ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Generate Token
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Settings;
