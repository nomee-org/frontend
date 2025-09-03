import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Key,
  Lock,
  Unlock,
  Loader,
  AlertTriangle,
} from "lucide-react";
import {
  useSetupEncryption,
  useConversationEncryptionStatus,
  useDecryptMessage,
} from "@/data/use-backend";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface MessageSettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  messageId?: string;
}

export const MessageSettingsPopup = ({
  isOpen,
  onClose,
  conversationId,
  messageId,
}: MessageSettingsPopupProps) => {
  const isMobile = useIsMobile();
  const [publicKey, setPublicKey] = useState("");
  const [encryptedPrivateKey, setEncryptedPrivateKey] = useState("");
  const [enableByDefault, setEnableByDefault] = useState(false);
  const [decryptPassword, setDecryptPassword] = useState("");

  const setupEncryption = useSetupEncryption();
  const decryptMessage = useDecryptMessage();
  
  const { data: encryptionStatus, isLoading: statusLoading } = useConversationEncryptionStatus(
    conversationId || ""
  );

  const handleSetupEncryption = async () => {
    if (!conversationId || !publicKey || !encryptedPrivateKey) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await setupEncryption.mutateAsync({
        conversationId,
        setupEncryptionDto: {
          publicKey,
          encryptedPrivateKey,
          enableByDefault,
        },
      });
      toast.success("Encryption setup successfully");
      setPublicKey("");
      setEncryptedPrivateKey("");
      setEnableByDefault(false);
    } catch (error) {
      toast.error("Failed to setup encryption");
    }
  };

  const handleDecryptMessage = async () => {
    if (!messageId || !decryptPassword) {
      toast.error("Please provide a password to decrypt the message");
      return;
    }

    try {
      const result = await decryptMessage.mutateAsync({
        messageId,
        dto: { password: decryptPassword },
      });
      toast.success("Message decrypted successfully");
      setDecryptPassword("");
    } catch (error) {
      toast.error("Failed to decrypt message. Check your password.");
    }
  };

  const renderEncryptionStatus = () => {
    if (statusLoading) {
      return (
        <div className="flex items-center justify-center p-6">
          <Loader className="h-6 w-6 animate-spin" />
        </div>
      );
    }

    if (!encryptionStatus) {
      return (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <ShieldX className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">No Encryption Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Unable to retrieve encryption status for this conversation.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {encryptionStatus.isEncrypted ? (
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                ) : (
                  <ShieldX className="h-5 w-5 text-muted-foreground" />
                )}
                <CardTitle className="text-base">
                  {encryptionStatus.isEncrypted ? "Encrypted" : "Not Encrypted"}
                </CardTitle>
              </div>
              <Badge variant={encryptionStatus.isEncrypted ? "default" : "secondary"}>
                {encryptionStatus.isEncrypted ? "Secure" : "Unprotected"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Algorithm:</span>
              <span className="text-sm text-muted-foreground">
                {encryptionStatus.algorithm || "None"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Key Exchange:</span>
              <div className="flex items-center space-x-2">
                {encryptionStatus.keyExchangeComplete ? (
                  <Key className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-sm text-muted-foreground">
                  {encryptionStatus.keyExchangeComplete ? "Complete" : "Incomplete"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const content = (
    <Tabs defaultValue="status" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="status">Status</TabsTrigger>
        <TabsTrigger value="setup">Setup</TabsTrigger>
        <TabsTrigger value="decrypt">Decrypt</TabsTrigger>
      </TabsList>

      <TabsContent value="status" className="space-y-4">
        {renderEncryptionStatus()}
      </TabsContent>

      <TabsContent value="setup" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>Setup Encryption</span>
            </CardTitle>
            <CardDescription>
              Configure end-to-end encryption for this conversation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="publicKey">Public Key</Label>
              <Input
                id="publicKey"
                type="text"
                placeholder="Enter public key"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="privateKey">Encrypted Private Key</Label>
              <Input
                id="privateKey"
                type="password"
                placeholder="Enter encrypted private key"
                value={encryptedPrivateKey}
                onChange={(e) => setEncryptedPrivateKey(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enableByDefault"
                checked={enableByDefault}
                onCheckedChange={setEnableByDefault}
              />
              <Label htmlFor="enableByDefault">Enable encryption by default</Label>
            </div>

            <Button
              onClick={handleSetupEncryption}
              disabled={setupEncryption.isPending || !publicKey || !encryptedPrivateKey}
              className="w-full"
            >
              {setupEncryption.isPending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Setting up...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Setup Encryption
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="decrypt" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Unlock className="h-4 w-4" />
              <span>Decrypt Message</span>
            </CardTitle>
            <CardDescription>
              Decrypt an encrypted message using your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Decryption Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter decryption password"
                value={decryptPassword}
                onChange={(e) => setDecryptPassword(e.target.value)}
              />
            </div>

            <Button
              onClick={handleDecryptMessage}
              disabled={decryptMessage.isPending || !decryptPassword || !messageId}
              className="w-full"
            >
              {decryptMessage.isPending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Decrypting...
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Decrypt Message
                </>
              )}
            </Button>

            {!messageId && (
              <p className="text-sm text-muted-foreground">
                Select a message to decrypt it.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Message Security Settings</span>
            </DrawerTitle>
            <DrawerDescription>
              Manage encryption settings and decrypt messages for this conversation.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Message Security Settings</span>
          </DialogTitle>
          <DialogDescription>
            Manage encryption settings and decrypt messages for this conversation.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default MessageSettingsPopup;