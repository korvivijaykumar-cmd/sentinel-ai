import { Mail, Phone, Send, Clock, AlertTriangle, Shield, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertChannelSettings as AlertSettings } from '@/hooks/useAlertChannels';

interface AlertChannelSettingsProps {
  settings: AlertSettings;
  onUpdateSettings: (settings: Partial<AlertSettings>) => void;
  onTestAlerts: () => void;
  isSending: boolean;
}

export const AlertChannelSettings = ({
  settings,
  onUpdateSettings,
  onTestAlerts,
  isSending,
}: AlertChannelSettingsProps) => {
  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Send className="w-5 h-5 text-primary" />
          External Alert Channels
        </CardTitle>
        <CardDescription>
          Send alerts via email and SMS when threats are detected
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Alerts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className={`w-5 h-5 ${settings.emailEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <Label>Email Alerts</Label>
                <p className="text-xs text-muted-foreground">Receive threat alerts via email</p>
              </div>
            </div>
            <Switch
              checked={settings.emailEnabled}
              onCheckedChange={(checked) => onUpdateSettings({ emailEnabled: checked })}
            />
          </div>
          {settings.emailEnabled && (
            <Input
              type="email"
              placeholder="your@email.com"
              value={settings.emailAddress}
              onChange={(e) => onUpdateSettings({ emailAddress: e.target.value })}
              className="mt-2"
            />
          )}
        </div>

        {/* SMS Alerts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className={`w-5 h-5 ${settings.smsEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <Label>SMS Alerts</Label>
                <p className="text-xs text-muted-foreground">Receive threat alerts via SMS</p>
              </div>
            </div>
            <Switch
              checked={settings.smsEnabled}
              onCheckedChange={(checked) => onUpdateSettings({ smsEnabled: checked })}
            />
          </div>
          {settings.smsEnabled && (
            <Input
              type="tel"
              placeholder="+1234567890"
              value={settings.phoneNumber}
              onChange={(e) => onUpdateSettings({ phoneNumber: e.target.value })}
              className="mt-2"
            />
          )}
        </div>

        {/* Severity Thresholds */}
        <div className="space-y-3 pt-2 border-t border-border">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Alert Thresholds
          </Label>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <Label htmlFor="alert-critical" className="text-sm">Critical Threats</Label>
            </div>
            <Switch
              id="alert-critical"
              checked={settings.alertOnCritical}
              onCheckedChange={(checked) => onUpdateSettings({ alertOnCritical: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-warning" />
              <Label htmlFor="alert-high" className="text-sm">High Severity</Label>
            </div>
            <Switch
              id="alert-high"
              checked={settings.alertOnHigh}
              onCheckedChange={(checked) => onUpdateSettings({ alertOnHigh: checked })}
            />
          </div>
        </div>

        {/* Cooldown Setting */}
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm">Alert Cooldown</Label>
          </div>
          <Select
            value={String(settings.cooldownMinutes)}
            onValueChange={(value) => onUpdateSettings({ cooldownMinutes: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 minute</SelectItem>
              <SelectItem value="5">5 minutes</SelectItem>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Minimum time between alerts to prevent spam
          </p>
        </div>

        {/* Test Button */}
        <Button
          onClick={onTestAlerts}
          disabled={isSending || (!settings.emailEnabled && !settings.smsEnabled)}
          className="w-full gap-2"
          variant="outline"
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending Test...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Test Alert
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
