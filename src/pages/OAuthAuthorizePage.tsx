import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, X, Check, Loader2 } from "lucide-react";

export default function OAuthAuthorizePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appInfo, setAppInfo] = useState<{ name: string; logo_url: string | null; scope: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const scope = searchParams.get("scope") || "read";
  const state = searchParams.get("state");

  useEffect(() => {
    const init = async () => {
      // Check auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const returnUrl = window.location.href;
        navigate(`/auth?redirect=${encodeURIComponent(returnUrl)}`);
        return;
      }
      setUserId(session.user.id);

      if (!clientId || !redirectUri) {
        setError("بيانات التطبيق غير مكتملة");
        setLoading(false);
        return;
      }

      // Get app info
      const { data, error: fetchError } = await supabase.functions.invoke("oauth-authorize", {
        body: { client_id: clientId, redirect_uri: redirectUri, scope, action: "info" },
      });

      if (fetchError || !data) {
        setError("تطبيق غير صالح");
        setLoading(false);
        return;
      }

      if (!data.valid_redirect) {
        setError("رابط إعادة التوجيه غير مسموح به");
        setLoading(false);
        return;
      }

      setAppInfo(data);
      setLoading(false);
    };
    init();
  }, [clientId, redirectUri, scope, navigate]);

  const handleApprove = async () => {
    if (!userId || !clientId || !redirectUri) return;
    setApproving(true);

    const { data, error: invokeError } = await supabase.functions.invoke("oauth-authorize", {
      body: { client_id: clientId, redirect_uri: redirectUri, scope, user_id: userId, action: "approve" },
    });

    if (invokeError || !data?.code) {
      setError("حدث خطأ أثناء التفويض");
      setApproving(false);
      return;
    }

    const url = new URL(redirectUri);
    url.searchParams.set("code", data.code);
    if (state) url.searchParams.set("state", state);
    window.location.href = url.toString();
  };

  const handleDeny = () => {
    if (!redirectUri) return;
    const url = new URL(redirectUri);
    url.searchParams.set("error", "access_denied");
    if (state) url.searchParams.set("state", state);
    window.location.href = url.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <X className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            {appInfo?.logo_url ? (
              <img src={appInfo.logo_url} alt={appInfo.name} className="w-10 h-10 rounded-xl" />
            ) : (
              <Shield className="w-8 h-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-xl">{appInfo?.name}</CardTitle>
          <CardDescription>يريد الوصول إلى حسابك في Megsy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">سيتمكن التطبيق من:</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span>قراءة معلومات حسابك (الاسم، البريد، الصورة)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span>معرفة خطتك الحالية</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleDeny}>
              رفض
            </Button>
            <Button className="flex-1" onClick={handleApprove} disabled={approving}>
              {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : "السماح"}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            بالضغط على "السماح"، أنت توافق على مشاركة بياناتك مع هذا التطبيق.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
